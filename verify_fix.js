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

async function search() {
  console.log('Searching for weight 4460...');
  // Check deliveries
  const { data: deliveries, error: dError } = await supabase
    .from('deliveries')
    .select('id, arrived_weight_kg, status')
    .eq('arrived_weight_kg', 4460);
  
  if (dError) console.error('D error:', dError);
  console.log('Deliveries with 4460kg:', deliveries?.length || 0);

  // Check sales
  const { data: sales, error: sError } = await supabase
    .from('sales')
    .select('id, total_weight_kg, total_revenue')
    .eq('total_weight_kg', 4500); // 4.50 ton was the initial weight

  if (sError) console.error('S error:', sError);
  console.log('Sales with 4500kg:', sales?.length || 0);
}

search();
