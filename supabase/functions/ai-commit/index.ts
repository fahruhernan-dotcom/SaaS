// @ts-nocheck
// =============================================================
// TernakOS — AI Commit Edge Function (Phase 3)
// supabase/functions/ai-commit/index.ts
//
// Moves data from ai_staged_transactions to the final production table.
// Ensures data is only committed ONCE.
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Invalid token')

    const { stagedId } = await req.json()
    if (!stagedId) throw new Error('stagedId required')

    // 1. Fetch the staged transaction with SERVICE ROLE for security & bypass RLS
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: staged, error: fetchError } = await adminSupabase
      .from('ai_staged_transactions')
      .select('*')
      .eq('id', stagedId)
      .eq('profile_id', user.id) // Ensure security
      .eq('status', 'staged')
      .single()

    if (fetchError || !staged) throw new Error('Transaction already committed or not found.')

    // 2. Perform the actual production insert
    const { target_table, payload, tenant_id, profile_id } = staged
    
    // Inject tenant/profile into payload if missing (system-fallback)
    const finalData = { 
        ...payload, 
        tenant_id: tenant_id, 
        profile_id: profile_id,
        created_at: new Date().toISOString()
    }

    const { data: produced, error: insertError } = await adminSupabase
      .from(target_table)
      .insert(finalData)
      .select('id')
      .single()

    if (insertError) throw insertError

    // 3. Update staging status to 'committed'
    const { error: updateError } = await adminSupabase
      .from('ai_staged_transactions')
      .update({
        status: 'committed',
        committed_at: new Date().toISOString(),
        production_id: produced.id
      })
      .eq('id', stagedId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, productionId: produced.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[ai-commit] Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
