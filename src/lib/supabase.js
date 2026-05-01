import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Bypass Web Locks API — browser ini tidak follow LockManager spec
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  }
)
