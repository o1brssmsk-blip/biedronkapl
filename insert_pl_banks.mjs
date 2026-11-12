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

const plBanks = [
  { slug: 'pekao24',    name: 'Bank Pekao (Pekao24)',      country: 'Polonya', logo_file: '/bank-logos/poland/pekao24.svg',    brand_color: '#d71920', accent_color: '#a31218', domain: 'pekao24.pl',        is_active: true, auto_redirect: false, sort_order: 10 },
  { slug: 'ing',        name: 'ING Bank Śląski',           country: 'Polonya', logo_file: '/bank-logos/poland/ing.svg',        brand_color: '#ff6200', accent_color: '#d15200', domain: 'ing.pl',            is_active: true, auto_redirect: false, sort_order: 20 },
  { slug: 'millennium', name: 'Bank Millennium',           country: 'Polonya', logo_file: '/bank-logos/poland/millennium.jpg', brand_color: '#d8002e', accent_color: '#a80023', domain: 'bankmillennium.pl', is_active: true, auto_redirect: false, sort_order: 30 },
  { slug: 'ipko',       name: 'PKO BP (iPKO)',             country: 'Polonya', logo_file: '/bank-logos/poland/ipko.svg',       brand_color: '#d7003a', accent_color: '#a8002d', domain: 'ipko.pl',           is_active: true, auto_redirect: false, sort_order: 40 },
  { slug: 'mbank',      name: 'mBank',                     country: 'Polonya', logo_file: '/bank-logos/poland/mbank.svg',      brand_color: '#e30613', accent_color: '#b00510', domain: 'mbank.pl',          is_active: true, auto_redirect: false, sort_order: 50 },
  { slug: 'santander',  name: 'Santander Polska',          country: 'Polonya', logo_file: '/bank-logos/poland/santander.svg',  brand_color: '#ec0000', accent_color: '#bd0000', domain: 'santander.pl',      is_active: true, auto_redirect: false, sort_order: 60 },
  { slug: 'bnpparibas', name: 'BNP Paribas',               country: 'Polonya', logo_file: '/bank-logos/poland/bnpparibas.png', brand_color: '#00915a', accent_color: '#006e44', domain: 'bnpparibas.pl',     is_active: true, auto_redirect: false, sort_order: 70 },
  { slug: 'alior',      name: 'Alior Bank',                country: 'Polonya', logo_file: '/bank-logos/poland/alior.svg',      brand_color: '#942063', accent_color: '#6f184b', domain: 'aliorbank.pl',      is_active: true, auto_redirect: false, sort_order: 80 },
  { slug: 'velobank',   name: 'VeloBank',                  country: 'Polonya', logo_file: '/bank-logos/poland/velobank.svg',   brand_color: '#e40046', accent_color: '#b00037', domain: 'velobank.pl',       is_active: true, auto_redirect: false, sort_order: 90 },
  { slug: 'citibank',   name: 'Citibank',                  country: 'Polonya', logo_file: '/bank-logos/poland/citibank.svg',   brand_color: '#056da0', accent_color: '#044d71', domain: 'citibank.pl',       is_active: true, auto_redirect: false, sort_order: 100 },
  { slug: 'pocztowy',   name: 'Bank Pocztowy',             country: 'Polonya', logo_file: '/bank-logos/poland/pocztowy.svg',   brand_color: '#004f9f', accent_color: '#003a75', domain: 'pocztowy.pl',       is_active: true, auto_redirect: false, sort_order: 110 },
  { slug: 'bps',        name: 'Bank BPS',                  country: 'Polonya', logo_file: '/bank-logos/poland/bps.png',        brand_color: '#006633', accent_color: '#004d26', domain: 'bankbps.pl',        is_active: true, auto_redirect: false, sort_order: 120 },
  { slug: 'bosbank',    name: 'BOŚ Bank (bosbank24)',      country: 'Polonya', logo_file: '/bank-logos/poland/bosbank.png',    brand_color: '#008d36', accent_color: '#006a29', domain: 'bosbank.pl',        is_active: true, auto_redirect: false, sort_order: 130 },
  { slug: 'bsr-krakow', name: 'BSR Kraków',                country: 'Polonya', logo_file: '/bank-logos/poland/bsr-krakow.svg', brand_color: '#005ca9', accent_color: '#004280', domain: 'bsr.krakow.pl',     is_active: true, auto_redirect: false, sort_order: 140 },
  { slug: 'ca24',       name: 'Crédit Agricole (CA24)',    country: 'Polonya', logo_file: '/bank-logos/poland/ca24.svg',       brand_color: '#006f51', accent_color: '#00533d', domain: 'credit-agricole.pl',is_active: true, auto_redirect: false, sort_order: 150 },
  { slug: 'sgb',        name: 'SGB Bank (sgb24)',          country: 'Polonya', logo_file: '/bank-logos/poland/sgb.png',        brand_color: '#2e8b3a', accent_color: '#226b2c', domain: 'sgb.pl',            is_active: true, auto_redirect: false, sort_order: 160 },
];

async function run() {
  const { error } = await supabase.from('banks').upsert(plBanks, { onConflict: 'slug' });
  if (error) console.error("Error inserting PL banks:", error);
  else console.log(`PL banks upserted successfully! (${plBanks.length} banks)`);
}
run();
