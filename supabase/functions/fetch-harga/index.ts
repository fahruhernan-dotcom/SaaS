// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SOURCE_URL = "https://chickin.id/blog/update/harga-ayam/"
const BUYER_MARGIN = 2500

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check if update already exists today to avoid duplicates (2x schedule)
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('market_prices')
      .select('id')
      .eq('price_date', today)
      .eq('source', 'auto_scraper')
      .limit(1)

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: "Data today already exists" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 2. Fetch data from Chickin.id
    const response = await fetch(SOURCE_URL)
    const html = await response.text()

    // Simple parser logic (using regex since it's a Deno Edge Function without a full DOM)
    // We look for rows containing "Jawa Tengah" or "DIY"
    // Format usually: <td>Region</td><td>Weight</td><td>Price</td>
    
    // This is a simplified regex approach based on the table structure observed
    const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || []
    let collectedPrices: number[] = []

    for (const row of rows) {
      if (row.includes("Jawa Tengah") || row.includes("DIY")) {
        const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []
        if (cells.length >= 2) {
          const berat = cells[cells.length - 2].replace(/<[^>]*>/g, '').trim()
          const hargaRaw = cells[cells.length - 1].replace(/<[^>]*>/g, '').trim()

          // Target weight < 2,0
          const isSmallWeight = berat.includes("<") || berat.includes("1,") || berat.includes("1.") || 
                               (!berat.includes("2,") && !berat.includes("2."))
          
          if (isSmallWeight && !berat.includes(">")) {
            // Parse price "25000-25500" or "25.000"
            const cleanHarga = hargaRaw.replace(/\./g, '').replace(/,/g, '')
            if (cleanHarga.includes("-")) {
              const parts = cleanHarga.split("-").map(p => parseInt(p.trim())).filter(p => !isNaN(p))
              if (parts.length > 0) {
                collectedPrices.push(parts.reduce((a, b) => a + b, 0) / parts.length)
              }
            } else {
              const val = parseInt(cleanHarga)
              if (!isNaN(val)) collectedPrices.push(val)
            }
          }
        }
      }
    }

    if (collectedPrices.length === 0) {
      throw new Error("No prices found for target region")
    }

    const avgFarmGate = Math.floor(collectedPrices.reduce((a, b) => a + b, 0) / collectedPrices.length)
    const buyerPrice = avgFarmGate + BUYER_MARGIN

    // 3. Insert to market_prices
    const { error: insertError } = await supabase
      .from('market_prices')
      .insert({
        price_date: today,
        chicken_type: 'broiler',
        farm_gate_price: avgFarmGate,
        avg_buy_price: avgFarmGate,
        buyer_price: buyerPrice,
        avg_sell_price: buyerPrice,
        region: 'Jawa Tengah',
        source: 'auto_scraper',
        source_url: SOURCE_URL,
        transaction_count: 0
      })

    if (insertError) throw insertError

    return new Response(JSON.stringify({ 
      message: "Success", 
      data: { farm_gate: avgFarmGate, buyer: buyerPrice } 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
