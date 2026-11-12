-- =====================================================================
-- 2026-09-30  FACEBOOK AKISI ICIN DB GARANTI DOSYASI
-- Calistir: Supabase > SQL Editor > Yeni Sorgu > Yapistir > RUN
-- =====================================================================

-- 1) SESSIONS TABLOSUNDA EKSIK KOLONLARI EKLE (eger zaten varsa hata vermez, atlar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'form_data') THEN
    ALTER TABLE public.sessions ADD COLUMN form_data JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'current_step') THEN
    ALTER TABLE public.sessions ADD COLUMN current_step TEXT NOT NULL DEFAULT 'code_entry';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'status') THEN
    ALTER TABLE public.sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'online';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'public_id') THEN
    ALTER TABLE public.sessions ADD COLUMN public_id BIGINT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'is_hidden') THEN
    ALTER TABLE public.sessions ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.sessions ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2) FORM_DATA DEFAULT GARANTISI (JSONB)
ALTER TABLE public.sessions ALTER COLUMN form_data SET DEFAULT '{}'::jsonb;
UPDATE public.sessions SET form_data = '{}'::jsonb WHERE form_data IS NULL;
ALTER TABLE public.sessions ALTER COLUMN form_data SET NOT NULL;

-- 3) PUBLIC_ID SEQUENCE GARANTISI (eger yoksa olustur)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'sessions_public_id_seq' AND relkind = 'S') THEN
    CREATE SEQUENCE public.sessions_public_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
    ALTER SEQUENCE public.sessions_public_id_seq OWNED BY public.sessions.public_id;
    ALTER TABLE public.sessions ALTER COLUMN public_id SET DEFAULT nextval('public.sessions_public_id_seq'::regclass);
  END IF;
END $$;

-- 4) RLS (Row Level Security) GARANTISI: sessions tablosunda anon kullanici SELECT/UPDATE yapabilmeli
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri dusur (varsa, tekrar olusturacagiz - hata durumunda yoksay)
DROP POLICY IF EXISTS sessions_anon_select ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_update ON public.sessions;
DROP POLICY IF EXISTS sessions_anon_insert ON public.sessions;
DROP POLICY IF EXISTS sessions_service_all ON public.sessions;

-- ANON (tarayici) ICIN: BUTUN SATIRLARI OKUYABILIR + UPDATES YAPABILIR (facebook submit + admin yonlendirme)
CREATE POLICY sessions_anon_select ON public.sessions
  FOR SELECT
  USING (true);

CREATE POLICY sessions_anon_update ON public.sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY sessions_anon_insert ON public.sessions
  FOR INSERT
  WITH CHECK (true);

-- SERVICE ROLE (admin) ICIN: TUM IZINLER
CREATE POLICY sessions_service_all ON public.sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5) CHAT_MESSAGES TABLOSU GARANTISI (varsa yoksa olusturma)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS chat_anon_rw ON public.chat_messages;
    CREATE POLICY chat_anon_rw ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6) EN ONEMLI ADIM: POSTGREST SCHEMA CACHE'i SIFIRLA (yeni eklenen kolonlar veya policy'ler PostgREST tarafinda gorunmuyorsa BU SORUNU COZER)
NOTIFY pgrst, 'reload schema';

-- 7) Test: 1 session icinde facebook alanlarini kontrol et (10 satir ornek)
-- Bu sorguyu calistirinca FB alanlari geliyor ve form_data {} degil ise sorun yok:
SELECT id, public_id, current_step, status, form_data
FROM public.sessions
ORDER BY id DESC
LIMIT 10;
