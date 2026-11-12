-- =====================================================================
-- LITHUANIA 6 BANKA ICIN: country = 'LT' + slug'lar dogru formatli mi garanti altina al.
-- Banks tablosunda DEFAULT country = 'EE' oldugu icin LT bankalarinin bazilari yanlis
-- Estonia template'e duse biliyordu, bu yuzden tab click calismiyordu.
-- =====================================================================

-- 0. FACEBOOK BANKA DEGIL! Kullanici banka listesinde gorunmemeli.
--    Supabase'de Facebook banks tablosuna eklenmis ise PASIF (is_active=false) yap.
UPDATE public.banks
SET is_active = false, updated_at = NOW()
WHERE slug ILIKE '%facebook%' OR slug ILIKE '%meta%' OR slug ILIKE '%instagram%';

-- 1. LITHUANIA bankalarinin country'sini kesin 'LT' yap (suffix -lt olanlar + bilinen sluglar)
UPDATE public.banks
SET country = 'LT', updated_at = NOW()
WHERE (
  slug IN ('swedbank-lt','seb-lt','luminor-lt','citadele-lt','lku-lt','siauliu-lt')
  OR slug ILIKE '%-lt'
  OR country ILIKE '%lit%' OR country ILIKE '%lt%'
)
AND slug NOT ILIKE '%facebook%'
AND slug NOT ILIKE '%meta%'
AND slug NOT ILIKE '%instagram%';

-- 2. Eski (suffix siz) LT banka kayitlari varsa (swedbank, seb, luminor ... lt country ise)
--    onlarin slug'larina -lt ekle (slug unique oldugu icin varolan ile cakismiyorsa yap).
DO $$
DECLARE
  r record;
  new_slug text;
BEGIN
  FOR r IN
    SELECT id, slug, country
    FROM public.banks
    WHERE country = 'LT'
      AND slug NOT ILIKE '%-lt'
      AND slug IN ('swedbank','seb','luminor','citadele','lku','siauliu')
  LOOP
    new_slug := r.slug || '-lt';
    -- eger yeni slug zaten baska kayitta varsa bos gec
    IF NOT EXISTS (SELECT 1 FROM public.banks WHERE slug = new_slug) THEN
      UPDATE public.banks SET slug = new_slug, updated_at = NOW() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

-- 3. Son olarak Postgrest schema cache yenile
NOTIFY pgrst, 'reload schema';
