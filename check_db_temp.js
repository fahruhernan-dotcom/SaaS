import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env file
const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  console.log('Connecting to Supabase...');
  const { data: deliveries, error } = await supabase
    .from('deliveries')
    .select(`
      id,
      initial_weight_kg,
      arrived_weight_kg,
      sale_id,
      sales (
        id,
        total_revenue,
        price_per_kg,
        total_weight_kg
      )
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching deliveries:', error);
    return;
  }

  if (!deliveries || deliveries.length === 0) {
    console.log('No completed deliveries found.');
    return;
  }

  console.log(`Found ${deliveries.length} completed deliveries.\n`);

  deliveries.forEach(d => {
    const sale = d.sales;
    if (!sale) {
        console.log(`Delivery ID: ${d.id} - No associated sale found.`);
        return;
    }
    
    const arrivedWeight = d.arrived_weight_kg || 0;
    const initialWeight = d.initial_weight_kg || 0;
    const pricePerKg = sale.price_per_kg || 0;
    const currentRevenue = sale.total_revenue || 0;
    
    const expectedRevenue = arrivedWeight * pricePerKg;
    const revenueFromInitial = initialWeight * pricePerKg;

    console.log(`Delivery ID: ${d.id}`);
    console.log(`  Initial Weight: ${initialWeight} kg`);
    console.log(`  Arrived Weight: ${arrivedWeight} kg`);
    console.log(`  Price/Kg: Rp ${pricePerKg.toLocaleString('id-ID')}`);
    console.log(`  Current Revenue in DB: Rp ${currentRevenue.toLocaleString('id-ID')}`);
    console.log(`  Expected Revenue (Arrived): Rp ${expectedRevenue.toLocaleString('id-ID')}`);
    console.log(`  Revenue from Initial: Rp ${revenueFromInitial.toLocaleString('id-ID')}`);
    
    if (Math.abs(currentRevenue - expectedRevenue) > 10) {
       if (Math.abs(currentRevenue - revenueFromInitial) < 10) {
          console.log(`  🔴 BUG CONFIRMED: Revenue matches INITIAL weight instead of ARRIVED weight.`);
       } else {
          console.log(`  🟡 MISMATCH: Revenue matches neither initial nor arrived weight.`);
       }
    } else {
      console.log(`  🟢 OK: Revenue matches arrived weight.`);
    }
    console.log('---');
  });
}

check();
