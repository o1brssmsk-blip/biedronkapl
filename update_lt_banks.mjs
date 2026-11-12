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
  // Update Estonia banks to inactive
  const { error: eeError } = await supabase.from('banks')
    .update({ is_active: false })
    .eq('country', 'Estonya');
    
  if (eeError) console.error("Estonia update error:", eeError);
  else console.log("Estonia banks deactivated.");
  
  // Also update 'Estonia' just in case
  const { error: eeError2 } = await supabase.from('banks')
    .update({ is_active: false })
    .eq('country', 'Estonia');
  if (eeError2) console.error("Estonia update error 2:", eeError2);

  // Update Lithuania banks logo_file from logo_url
  const { data: ltBanks } = await supabase.from('banks').select('id, logo_url, logo_file').in('country', ['LT', 'Litvanya', 'Lithuania']);
  if (ltBanks) {
    for (const bank of ltBanks) {
      if (bank.logo_url && !bank.logo_file) {
        await supabase.from('banks').update({ logo_file: bank.logo_url }).eq('id', bank.id);
        console.log(`Updated logo_file for bank id: ${bank.id} -> ${bank.logo_url}`);
      }
    }
  }
}
check();
