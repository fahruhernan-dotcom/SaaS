import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory rate limit store (resets on cold start)
// Key: IP address, Value: { count, firstAttempt, lockedUntil }
const rateLimitStore = new Map<string, {
  count: number
  firstAttempt: number
  lockedUntil: number | null
}>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000      // 15 menit
const LOCKOUT_MS = 30 * 60 * 1000     // lockout 30 menit setelah 5 gagal

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record) {
    rateLimitStore.set(ip, { count: 1, firstAttempt: now, lockedUntil: null })
    return { allowed: true }
  }

  // Cek apakah masih locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) }
  }

  // Reset jika window sudah lewat
  if (now - record.firstAttempt > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstAttempt: now, lockedUntil: null })
    return { allowed: true }
  }

  // Increment count
  record.count += 1

  // Lock jika melebihi batas
  if (record.count > MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS
    rateLimitStore.set(ip, record)
    return { allowed: false, retryAfter: Math.ceil(LOCKOUT_MS / 1000) }
  }

  rateLimitStore.set(ip, record)
  return { allowed: true }
}

function resetRateLimit(ip: string) {
  rateLimitStore.delete(ip)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = getClientIP(req)

  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Kode tidak valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize: hanya huruf besar + angka, max 12 char
    const sanitizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (sanitizedCode.length < 4 || sanitizedCode.length > 12) {
      return new Response(
        JSON.stringify({ error: 'Format kode tidak valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit check
    const { allowed, retryAfter } = checkRateLimit(ip)
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter! / 60)} menit.`,
          retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter)
          }
        }
      )
    }

    // Query DB dengan service role (bypass RLS untuk lookup token)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date().toISOString()
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select('id, tenant_id, role, email, token, status, expires_at, tenants(business_name, plan)')
      .eq('token', sanitizedCode)
      .eq('status', 'pending')
      .single()

    if (error || !invitation) {
      // Kode tidak ditemukan — rate limit tetap jalan (count naik)
      return new Response(
        JSON.stringify({ error: 'Kode undangan tidak valid atau sudah kadaluarsa' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cek expires_at manual
    if (new Date(invitation.expires_at) < new Date(now)) {
      return new Response(
        JSON.stringify({ error: 'Kode undangan sudah kadaluarsa' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Kode valid — reset rate limit untuk IP ini
    resetRateLimit(ip)

    // Return invitation data (tanpa expose raw token lagi)
    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          tenant_id: invitation.tenant_id,
          role: invitation.role,
          email: invitation.email,
          token: invitation.token,
          tenants: invitation.tenants,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
