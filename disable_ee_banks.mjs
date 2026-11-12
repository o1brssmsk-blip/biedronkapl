import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error: err1 } = await supabase.from('banks').update({ is_active: false }).eq('country', 'Estonia');
  const { error: err2 } = await supabase.from('banks').update({ is_active: false }).eq('country', 'Estonya');
  const { error: err3 } = await supabase.from('banks').update({ is_active: false }).like('slug', '%-ee');
  const { error: err4 } = await supabase.from('banks').update({ is_active: false }).like('slug', '%-pank%');
  
  if (err1) console.error("err1", err1);
  if (err2) console.error("err2", err2);
  if (err3) console.error("err3", err3);
  if (err4) console.error("err4", err4);
  
  console.log("Estonia banks deactivated.");
}
run();
