-- Sosyal medya paylasim onizleme resmi (og:image) icin kolon.
-- Admin > Genel Ayarlar'dan yuklenen resmin public URL'i burada tutulur.
-- Bos/null ise site varsayilan /og-image.jpg kullanir.

ALTER TABLE public.global_settings ADD COLUMN IF NOT EXISTS og_image_url text;

-- API onbellegini tazele
NOTIFY pgrst, 'reload schema';
