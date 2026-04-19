import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Check persistent rate limit from DB
    const { data: limitRecord } = await supabase
      .from('invite_rate_limits')
      .select('*')
      .eq('ip_address', ip)
      .maybeSingle()

    const now = new Date()

    // 1a. Check if currently locked
    if (limitRecord?.locked_until && new Date(limitRecord.locked_until) > now) {
      const retryAfter = Math.ceil((new Date(limitRecord.locked_until).getTime() - now.getTime()) / 1000)
      return new Response(
        JSON.stringify({
          error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`,
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

    // 1b. Window check: reset if more than 15 minutes since first attempt
    const WINDOW_MS = 15 * 60 * 1000
    const windowExpired = limitRecord && (now.getTime() - new Date(limitRecord.first_attempt_at).getTime()) > WINDOW_MS

    if (!limitRecord || windowExpired) {
      // New or reset record
      await supabase.from('invite_rate_limits').upsert({
        ip_address: ip,
        attempt_count: 1,
        first_attempt_at: now.toISOString(),
        locked_until: null,
        last_attempt_at: now.toISOString()
      }, { onConflict: 'ip_address' })
    } else {
      // Increment attempt
      const newCount = (limitRecord.attempt_count || 0) + 1
      const shouldLock = newCount >= 5
      const LOCKOUT_MS = 30 * 60 * 1000

      await supabase.from('invite_rate_limits').update({
        attempt_count: newCount,
        last_attempt_at: now.toISOString(),
        locked_until: shouldLock 
          ? new Date(now.getTime() + LOCKOUT_MS).toISOString() 
          : null
      }).eq('ip_address', ip)

      if (shouldLock) {
        const retryAfter = Math.ceil(LOCKOUT_MS / 1000)
        return new Response(
          JSON.stringify({
            error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`,
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
    }

    // 2. Query Invitation (bypass RLS) — no join to avoid FK dependency
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select('id, tenant_id, role, email, token, status, expires_at')
      .eq('token', sanitizedCode)
      .eq('status', 'pending')
      .maybeSingle()

    if (error || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Kode undangan tidak valid atau sudah kadaluarsa' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cek expires_at manual
    if (new Date(invitation.expires_at) < now) {
      return new Response(
        JSON.stringify({ error: 'Kode undangan sudah kadaluarsa' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Fetch tenant info separately (safe, no FK required)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, plan')
      .eq('id', invitation.tenant_id)
      .maybeSingle()

    // Kode valid — reset rate limit untuk IP ini
    await supabase.from('invite_rate_limits').delete().eq('ip_address', ip)

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          tenant_id: invitation.tenant_id,
          role: invitation.role,
          email: invitation.email,
          token: invitation.token,
          tenants: tenant ?? null,
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
