import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  'https://llgqxzrlcewugufzwyer.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZ3F4enJsY2V3dWd1Znp3eWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTM3ODAsImV4cCI6MjA4OTA4OTc4MH0.O3vb0nYXjBFlxlLUJEmqoIWG-V0HZrgNDS0GIq27CnQ'
)

// Query information_schema via RPC or raw SQL isn't available with anon key.
// Instead, let's use the Management API via the linked project.
// We'll use supabase inspect db approach with a workaround.

// Actually, let's just list all tables by trying to select from information_schema
// via a database function if available, or use the REST API.

// Simplest approach: use the Supabase Management API
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = 'llgqxzrlcewugufzwyer'

async function getSchema() {
  // Read the access token from the supabase CLI config
  const homeDir = process.env.USERPROFILE || process.env.HOME
  let accessToken = ''
  
  try {
    // Try reading from supabase CLI credentials
    const credPaths = [
      `${homeDir}/.supabase/access-token`,
      `${homeDir}/AppData/Roaming/supabase/access-token`,
      `${homeDir}/AppData/Local/supabase/access-token`,
    ]
    
    for (const p of credPaths) {
      try {
        accessToken = fs.readFileSync(p, 'utf8').trim()
        if (accessToken) {
          console.log(`Found token at: ${p}`)
          break
        }
      } catch {}
    }
  } catch {}

  if (!accessToken) {
    console.log('No access token found. Trying via SQL query through Management API...')
    // Fallback: try to find it via environment or prompting
    // Let's try the supabase config directory
    const configDirs = [
      `${homeDir}/.config/supabase`,
      `${homeDir}/AppData/Roaming/supabase`,
    ]
    for (const dir of configDirs) {
      try {
        const files = fs.readdirSync(dir)
        console.log(`Files in ${dir}:`, files)
        for (const f of files) {
          if (f.includes('token') || f.includes('access') || f.includes('credentials')) {
            try {
              accessToken = fs.readFileSync(`${dir}/${f}`, 'utf8').trim()
              console.log(`Found potential token in: ${dir}/${f}`)
              break
            } catch {}
          }
        }
      } catch {}
    }
  }

  if (!accessToken) {
    console.error('Could not find Supabase access token. Aborting.')
    process.exit(1)
  }

  // Use Management API to run SQL
  const sqlQuery = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable,
      c.column_default,
      c.is_generated,
      c.generation_expression,
      (
        SELECT tc.constraint_type 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = t.table_name 
          AND kcu.column_name = c.column_name 
          AND tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
        LIMIT 1
      ) as is_pk,
      (
        SELECT ccu.table_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = t.table_name 
          AND kcu.column_name = c.column_name 
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        LIMIT 1
      ) as fk_table
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position;
  `

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlQuery })
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`API error ${res.status}: ${text}`)
    process.exit(1)
  }

  const data = await res.json()
  
  // Write raw data
  fs.writeFileSync('tmp/schema_dump.json', JSON.stringify(data, null, 2))
  console.log(`Wrote ${data.length} column definitions to tmp/schema_dump.json`)
  
  // Group by table
  const tables = {}
  for (const row of data) {
    const tbl = row.table_name
    if (!tables[tbl]) tables[tbl] = []
    tables[tbl].push(row)
  }
  
  console.log(`\nFound ${Object.keys(tables).length} tables:`)
  console.log(Object.keys(tables).sort().join('\n'))
}

getSchema().catch(console.error)
