import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from('banks').select('slug, name, logo_url, logo_file, country, is_active');
  console.log("All Banks count:", data.length);
  const ltBanks = data.filter(b => b.name === 'Swedbank' || b.name === 'SEB' || b.name === 'Luminor Bank' || b.name === 'Citadele' || b.name === 'LKU Kredito unijos' || b.name === 'Šiaulių bankas');
  console.log(ltBanks);
}
check();
