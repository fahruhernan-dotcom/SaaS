import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function checkDb() {
  const { data: customer, error: err1 } = await supabase
    .from('sembako_customers')
    .select('*')
    .ilike('customer_name', '%Lemoanaru%')
    .single();

  console.log('Customer:', customer);

  if (customer) {
    const { data: sales, error: err2 } = await supabase
      .from('sembako_sales')
      .select('*, sembako_sale_items(*), sembako_payments(*)')
      .eq('customer_id', customer.id);
      
    console.log('Sales:', JSON.stringify(sales, null, 2));
  }
}

checkDb().catch(console.error);
