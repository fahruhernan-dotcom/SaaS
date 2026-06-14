// @ts-nocheck
// Edge Function: scrape-fb-harga
// Purpose: Scrape Facebook posts via Apify, extract domba/ternak prices, store in market_prices
// Auth: Supabase service role + superadmin check
// API token: Only read from Supabase env secret APIFY_API_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ── Constants ─────────────────────────────────────────────────────────────────
const APIFY_BASE   = "https://api.apify.com/v2"
const ACTOR_ID     = "apify~facebook-posts-scraper"
const MAX_POSTS    = 30          // per source
const POLL_TIMEOUT = 120_000     // 2 min max wait for Apify
const POLL_INTERVAL = 5_000      // poll every 5s
const MIN_CONFIDENCE = 0.55      // threshold to accept price candidate
const MIN_PRICE_IDR  = 500_000   // per ekor minimum reasonable domba price
const MAX_PRICE_IDR  = 15_000_000 // per ekor maximum reasonable domba price

// For per-kg pricing (harga per kg hidup)
const MIN_PRICE_KG  = 30_000
const MAX_PRICE_KG  = 150_000

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// ── Price Extraction ──────────────────────────────────────────────────────────

/**
 * Keyword patterns that indicate a domba/sheep price post
 */
const DOMBA_KEYWORDS = [
  'domba', 'biri', 'gibas', 'gembala', 'biri-biri',
  'kambing', 'qurban', 'aqiqah', 'hari raya', 'harqur',
  'jual domba', 'beli domba', 'harga domba',
  'kg hidup', 'ekor', 'per ekor',
]

/**
 * Patterns for extracting prices from Indonesian text.
 * Returns array of { raw, value, type }
 */
function extractPrices(text) {
  const results = []
  const t = text.toLowerCase()

  // Pattern: "Rp 2.500.000" or "Rp2.500.000" or "rp 2500000"
  const rpFull = /rp\.?\s*([\d]{1,3}(?:[.,][\d]{3})+)/gi
  let m
  while ((m = rpFull.exec(text)) !== null) {
    const val = parseIndonesianNumber(m[1])
    if (val) results.push({ raw: m[0], value: val, type: 'unknown' })
  }

  // Pattern: "2.500.000" or "2.500.000/ekor" or "2500000"
  const plainMillion = /\b([\d]{1,2}[.,][\d]{3}[.,][\d]{3})\b/g
  while ((m = plainMillion.exec(text)) !== null) {
    const val = parseIndonesianNumber(m[1])
    if (val && !results.some(r => Math.abs(r.value - val) < 1000)) {
      results.push({ raw: m[0], value: val, type: 'unknown' })
    }
  }

  // Pattern: "2,5jt" or "2.5jt" or "2 juta"
  const juta = /(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/gi
  while ((m = juta.exec(text)) !== null) {
    const val = Math.round(parseFloat(m[1].replace(',', '.')) * 1_000_000)
    if (val && !results.some(r => Math.abs(r.value - val) < 1000)) {
      results.push({ raw: m[0], value: val, type: 'unknown' })
    }
  }

  // Pattern: "75rb/kg" or "75.000/kg" or "75000 per kg"
  const perKg = /([\d]{2,3}(?:[.,][\d]{3})?)\s*(?:rb|ribu|000)?\s*\/?\s*(?:per\s+)?kg/gi
  while ((m = perKg.exec(text)) !== null) {
    const raw = m[1].replace(/\./g, '').replace(/,/g, '')
    let val = parseInt(raw)
    if (raw.length <= 3) val *= 1000  // "75" → 75000
    if (val >= MIN_PRICE_KG && val <= MAX_PRICE_KG) {
      results.push({ raw: m[0], value: val, type: 'per_kg' })
    }
  }

  // Pattern: "75rb" or "75ribu" (standalone, likely per kg)
  const rb = /\b(\d{2,3})\s*(?:rb|ribu)\b/gi
  while ((m = rb.exec(text)) !== null) {
    const val = parseInt(m[1]) * 1000
    if (val >= MIN_PRICE_KG && val <= MAX_PRICE_KG &&
        !results.some(r => Math.abs(r.value - val) < 1000)) {
      results.push({ raw: m[0], value: val, type: 'per_kg' })
    }
  }

  // Detect type from context: farm_gate vs buyer
  return results.map(r => ({
    ...r,
    type: r.type !== 'unknown' ? r.type : detectPriceType(text, r.raw),
  }))
}

function detectPriceType(text, rawMatch) {
  const t = text.toLowerCase()
  const idx = t.indexOf(rawMatch.toLowerCase())
  const context = t.slice(Math.max(0, idx - 60), idx + 60)

  if (/kandang|peternak|farm.?gate|langsung|dari kandang|ex kandang/.test(context)) return 'farm_gate'
  if (/broker|tengkulak|pengepul|beli|ambil|jual ke|jual/.test(context)) return 'buyer'
  return 'unknown'
}

function parseIndonesianNumber(str) {
  if (!str) return null
  // Handle "1.500.000" (dots as thousands sep) and "1,500,000"
  const clean = str.replace(/\./g, '').replace(/,/g, '')
  const val = parseInt(clean)
  return isNaN(val) ? null : val
}

/**
 * Score a price candidate based on:
 * - Range validity
 * - Keyword context match
 * - Price type clarity
 */
function scoreCandidate(price, text, komoditas) {
  let score = 0.0

  // Base range check
  const isPerEkor = price.type !== 'per_kg'
  if (isPerEkor) {
    if (price.value >= MIN_PRICE_IDR && price.value <= MAX_PRICE_IDR) score += 0.3
    else return 0.0  // out of range, reject
  } else {
    // per_kg
    if (price.value >= MIN_PRICE_KG && price.value <= MAX_PRICE_KG) score += 0.3
    else return 0.0
  }

  // Keyword match around the price
  const t = text.toLowerCase()
  const idx = t.indexOf(price.raw.toLowerCase())
  const ctx = t.slice(Math.max(0, idx - 100), idx + 100)

  const dombaHit = DOMBA_KEYWORDS.filter(kw => ctx.includes(kw)).length
  score += Math.min(dombaHit * 0.15, 0.35)

  // Explicit price label
  if (/harga|price|jual|beli/.test(ctx)) score += 0.15

  // Type clarity bonus
  if (price.type !== 'unknown') score += 0.1

  // Rp prefix is a strong signal
  if (/rp/.test(price.raw.toLowerCase())) score += 0.1

  return Math.min(score, 1.0)
}

function isRelatedToDomba(text, komoditas) {
  const t = text.toLowerCase()
  const keywords = komoditas === 'domba'
    ? DOMBA_KEYWORDS
    : komoditas === 'sapi'
      ? ['sapi', 'lembu', 'harga sapi', 'jual sapi']
      : komoditas === 'broiler'
        ? ['ayam', 'broiler', 'harga ayam', 'broiller']
        : DOMBA_KEYWORDS
  return keywords.some(kw => t.includes(kw))
}

// ── Apify Helpers ─────────────────────────────────────────────────────────────

async function startApifyRun(token, startUrls) {
  const resp = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      startUrls: startUrls.map(url => ({ url })),
      maxPosts: MAX_POSTS,
      scrapeAbout: false,
      scrapePostComments: false,
      scrapePostReactions: false,
    }),
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Apify start failed: ${resp.status} ${err}`)
  }
  const data = await resp.json()
  return data.data?.id
}

async function pollApifyRun(token, runId) {
  const deadline = Date.now() + POLL_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL))
    const resp = await fetch(`${APIFY_BASE}/actor-runs/${runId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`Apify poll failed: ${resp.status}`)
    const data = await resp.json()
    const status = data.data?.status
    if (status === 'SUCCEEDED') return true
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Apify run ended with status: ${status}`)
    }
  }
  throw new Error('Apify run timed out after 2 minutes')
}

async function fetchApifyDataset(token, runId) {
  const resp = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?format=json&limit=500`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  if (!resp.ok) throw new Error(`Apify dataset fetch failed: ${resp.status}`)
  return resp.json()
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // ── Auth check: must be superadmin ────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')

  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('app_role, role, id')
    .eq('auth_user_id', user.id)

  const isSuperadmin = user.app_metadata?.is_superadmin === true || 
    (profiles && profiles.some(p => p.app_role === 'superadmin' || p.role === 'superadmin'))

  if (!isSuperadmin) {
    return new Response(JSON.stringify({ error: 'Forbidden: superadmin only' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const profile = profiles?.find(p => p.app_role === 'superadmin' || p.role === 'superadmin') || profiles?.[0]

  // ── Parse body ────────────────────────────────────────────────────────────
  let body = {}
  try { body = await req.json() } catch (_) {}

  const {
    sourceIds = [],
    komoditas = 'domba',
    dryRun = false,
  } = body

  const apifyToken = Deno.env.get('APIFY_API_TOKEN')
  if (!apifyToken) {
    return new Response(JSON.stringify({ error: 'APIFY_API_TOKEN not configured in Supabase secrets' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // ── Fetch active sources ──────────────────────────────────────────────────
  let sourcesQuery = supabase
    .from('fb_scraper_sources')
    .select('id, page_url, page_name, region, komoditas')
    .eq('is_active', true)
    .eq('komoditas', komoditas)

  if (sourceIds.length > 0) {
    sourcesQuery = sourcesQuery.in('id', sourceIds)
  }

  const { data: sources, error: srcErr } = await sourcesQuery
  if (srcErr) throw srcErr

  if (!sources || sources.length === 0) {
    return new Response(JSON.stringify({ error: 'No active sources found for komoditas: ' + komoditas }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // ── Create run record ─────────────────────────────────────────────────────
  const { data: runRecord, error: runErr } = await supabase
    .from('fb_scraper_runs')
    .insert({
      komoditas,
      source_ids: sources.map(s => s.id),
      status: dryRun ? 'dry_run' : 'running',
      is_dry_run: dryRun,
      triggered_by: profile.id,
    })
    .select()
    .single()

  if (runErr || !runRecord) {
    return new Response(JSON.stringify({ error: 'Failed to create run record', detail: runErr }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const runId = runRecord.id

  try {
    // ── Call Apify ────────────────────────────────────────────────────────
    const urls = sources.map(s => s.page_url)
    const apifyRunId = await startApifyRun(apifyToken, urls)

    await supabase.from('fb_scraper_runs').update({ apify_run_id: apifyRunId }).eq('id', runId)

    // Poll until done
    await pollApifyRun(apifyToken, apifyRunId)

    // Fetch results
    const posts = await fetchApifyDataset(apifyToken, apifyRunId)

    // ── Process posts ─────────────────────────────────────────────────────
    let totalPricesExtracted = 0
    let highConfidenceCount = 0
    const acceptedPrices = [] // { value, type, region }

    for (const post of posts) {
      const text = post.text || ''
      if (!text || text.length < 20) continue
      if (!isRelatedToDomba(text, komoditas)) continue

      // Find which source this post belongs to
      const matchedSource = sources.find(s =>
        post.facebookUrl && post.facebookUrl.includes(s.page_url.replace('https://www.facebook.com/', ''))
      ) || sources[0]

      // Save minimal post record (no personal data, only page name + text)
      const { data: savedPost } = await supabase
        .from('fb_scraper_posts')
        .insert({
          run_id: runId,
          source_id: matchedSource.id,
          post_id: post.postId,
          page_name: post.pageName || matchedSource.page_name,
          post_url: post.url,
          post_text: text.substring(0, 2000), // cap at 2000 chars
          post_date: post.time ? new Date(post.time).toISOString() : null,
        })
        .select()
        .single()

      const postDbId = savedPost?.id

      // Extract price candidates
      const candidates = extractPrices(text)
      if (candidates.length === 0) continue

      for (const candidate of candidates) {
        const score = scoreCandidate(candidate, text, komoditas)
        if (score === 0) continue // out of range, skip entirely

        const isAccepted = score >= MIN_CONFIDENCE
        totalPricesExtracted++
        if (isAccepted) {
          highConfidenceCount++
          acceptedPrices.push({
            value: candidate.value,
            type: candidate.type,
            region: matchedSource.region,
          })
        }

        await supabase.from('fb_price_candidates').insert({
          run_id: runId,
          post_id: postDbId,
          komoditas,
          region: matchedSource.region,
          raw_text_snippet: candidate.raw,
          price_idr: candidate.value,
          price_type: candidate.type,
          confidence_score: score,
          is_accepted: isAccepted,
        })
      }
    }

    // ── Aggregate & publish to market_prices ─────────────────────────────
    let publishedPrice = null

    if (!dryRun && acceptedPrices.length > 0) {
      // Separate farm_gate vs buyer vs unknown
      const farmGatePrices = acceptedPrices.filter(p => p.type === 'farm_gate').map(p => p.value)
      const buyerPrices    = acceptedPrices.filter(p => p.type === 'buyer').map(p => p.value)
      const unknownPrices  = acceptedPrices.filter(p => p.type === 'unknown').map(p => p.value)

      const avg = arr => arr.length > 0
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : null

      const avgFarmGate  = avg(farmGatePrices) ?? avg([...unknownPrices, ...buyerPrices])
      const avgBuyPrice  = avg(buyerPrices) ?? (avgFarmGate ? avgFarmGate + 50000 : null)

      const today = new Date().toISOString().split('T')[0]

      // Determine dominant region
      const regionCounts = {}
      acceptedPrices.forEach(p => { regionCounts[p.region] = (regionCounts[p.region] || 0) + 1 })
      const dominantRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'nasional'

      if (avgFarmGate) {
        const { error: insertErr } = await supabase.from('market_prices').upsert({
          price_date: today,
          chicken_type: komoditas,  // note: column named chicken_type but used for all livestock
          region: dominantRegion,
          farm_gate_price: avgFarmGate,
          avg_buy_price: avgBuyPrice ?? avgFarmGate,
          buyer_price: avgBuyPrice ?? avgFarmGate,
          avg_sell_price: avgBuyPrice ?? avgFarmGate,
          transaction_count: highConfidenceCount,
          source: 'fb_scraper',
          source_url: sources.map(s => s.page_url).join(', ').substring(0, 500),
        }, {
          onConflict: 'price_date,chicken_type,region,source',
        })

        if (!insertErr) publishedPrice = avgFarmGate
      }
    }

    // ── Update sources last_scraped_at ────────────────────────────────────
    if (!dryRun) {
      await supabase
        .from('fb_scraper_sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .in('id', sources.map(s => s.id))
    }

    // ── Finalize run record ───────────────────────────────────────────────
    await supabase.from('fb_scraper_runs').update({
      status: 'success',
      posts_fetched: posts.length,
      prices_extracted: totalPricesExtracted,
      high_confidence_count: highConfidenceCount,
      avg_price_published: publishedPrice,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)

    return new Response(JSON.stringify({
      success: true,
      runId,
      dryRun,
      summary: {
        sourcesUsed: sources.length,
        postsFetched: posts.length,
        pricesExtracted: totalPricesExtracted,
        highConfidenceCount,
        publishedToMarketPrices: !dryRun && publishedPrice !== null,
        avgPricePublished: publishedPrice,
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    // Update run to error status
    await supabase.from('fb_scraper_runs').update({
      status: 'error',
      error_message: err.message,
      finished_at: new Date().toISOString(),
    }).eq('id', runId)

    return new Response(JSON.stringify({ error: err.message, runId }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
