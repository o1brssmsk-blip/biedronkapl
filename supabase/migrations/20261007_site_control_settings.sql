-- =====================================================================
-- 2026-10-07  SITE KONTROL AYARLARI + EKSIK KOLONLAR
-- site_enabled: admin'den site ac/kapa (kapaliyken 503)
-- entry_page: anadomain giris sayfasi secimi (/win, /wheel, /verify, /code, /banken)
-- wheel_settings + diger genel ayar kolonlari yoksa eklenir (idempotent)
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS site_enabled boolean DEFAULT true;
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS entry_page text DEFAULT '/win';
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS wheel_settings jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS og_image_url text;
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS portal_name text;
ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS support_center_name text;

UPDATE public.global_settings SET site_enabled = true WHERE site_enabled IS NULL;
UPDATE public.global_settings SET entry_page = '/win' WHERE entry_page IS NULL OR entry_page = '';
UPDATE public.global_settings SET wheel_settings = '{}'::jsonb WHERE wheel_settings IS NULL;

NOTIFY pgrst, 'reload schema';

SELECT id, site_enabled, entry_page, wheel_settings FROM public.global_settings LIMIT 1;
