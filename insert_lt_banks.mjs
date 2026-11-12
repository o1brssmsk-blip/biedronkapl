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

const ltBanks = [
  { name: 'Swedbank', slug: 'swedbank-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/swedbank-lt.png', is_active: true },
  { name: 'SEB', slug: 'seb-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/seb-lt.png', is_active: true },
  { name: 'Luminor Bank', slug: 'luminor-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/luminor-lt.png', is_active: true },
  { name: 'Citadele', slug: 'citadele-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/citadele-lt.png', is_active: true },
  { name: 'LKU Kredito unijos', slug: 'lku-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/lku-lt.png', is_active: true },
  { name: 'Šiaulių bankas', slug: 'siauliu-lt', country: 'Litvanya', logo_file: '/bank-logos/lithuania/siauliu-lt.png', is_active: true }
];

async function run() {
  const { error } = await supabase.from('banks').upsert(ltBanks, { onConflict: 'slug' });
  if (error) console.error("Error inserting LT banks:", error);
  else console.log("LT banks inserted successfully!");
}
run();
