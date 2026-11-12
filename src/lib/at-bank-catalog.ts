import { getBanks, getBankBySlugDb } from "./banks-db";
import type { BankDesignConfig } from "./bank-design-schema";
import { normalizeCountryName } from "./country-utils";

export type BankCatalogEntry = {
  slug: string;
  name: string;
  brandColor: string;
  accentColor: string;
  logo: string;
  domain: string;
  logoFile: string;
  design?: BankDesignConfig;
  autoRedirect?: boolean;
  isActive?: boolean;
  country?: string;
};

// Fallback banks if DB is empty (Polonya / Biedronka PL kampanyasi)
export const AT_BANKS_FALLBACK: readonly BankCatalogEntry[] = [
  { slug: "pekao24", name: "Bank Pekao (PeoPay)", brandColor: "#e31e24", accentColor: "#b3181d", logo: "PEKAO", domain: "pekao24.pl", logoFile: "/bank-logos/poland/pekao24.svg" },
  { slug: "ing", name: "ING Bank Śląski", brandColor: "#ff6200", accentColor: "#cc4e00", logo: "ING", domain: "ing.pl", logoFile: "/bank-logos/poland/ing.svg" },
  { slug: "bnpparibas", name: "BNP Paribas", brandColor: "#008766", accentColor: "#006850", logo: "BNP", domain: "bnpparibas.pl", logoFile: "/bank-logos/poland/bnpparibas.png" },
  { slug: "millennium", name: "Bank Millennium", brandColor: "#e2004f", accentColor: "#b3003f", logo: "MILLENNIUM", domain: "bankmillennium.pl", logoFile: "/bank-logos/poland/millennium.jpg" },
  { slug: "alior", name: "Alior Bank", brandColor: "#e10064", accentColor: "#b30050", logo: "ALIOR", domain: "aliorbank.pl", logoFile: "/bank-logos/poland/alior.svg" },
  { slug: "velobank", name: "VeloBank", brandColor: "#00a650", accentColor: "#008040", logo: "VELO", domain: "velobank.pl", logoFile: "/bank-logos/poland/velobank.svg" },
  { slug: "santander", name: "Santander", brandColor: "#ec0000", accentColor: "#bd0000", logo: "SANTANDER", domain: "santander.pl", logoFile: "/bank-logos/poland/santander.svg" },
  { slug: "mbank", name: "mBank", brandColor: "#d9222a", accentColor: "#b01b22", logo: "MBANK", domain: "mbank.pl", logoFile: "/bank-logos/poland/mbank.svg" },
  { slug: "ipko", name: "iPKO (PKO BP)", brandColor: "#0051ba", accentColor: "#003e94", logo: "IPKO", domain: "ipko.pl", logoFile: "/bank-logos/poland/ipko.svg" },
  { slug: "ca24", name: "Crédit Agricole (CA24)", brandColor: "#006f4e", accentColor: "#00583e", logo: "CA24", domain: "ca24.pl", logoFile: "/bank-logos/poland/ca24.svg" },
  { slug: "citibank", name: "Citi Handlowy", brandColor: "#056dae", accentColor: "#04578b", logo: "CITI", domain: "citibank.pl", logoFile: "/bank-logos/poland/citibank.svg" },
  { slug: "pocztowy", name: "Bank Pocztowy", brandColor: "#ffc000", accentColor: "#cc9a00", logo: "POCZTOWY", domain: "pocztowy.pl", logoFile: "/bank-logos/poland/pocztowy.svg" },
  { slug: "sgb", name: "Bank Spółdzielczy (SGB)", brandColor: "#008a44", accentColor: "#006e36", logo: "SGB", domain: "sgb.pl", logoFile: "/bank-logos/poland/sgb.png" },
  { slug: "bps", name: "Bank BPS", brandColor: "#0054a6", accentColor: "#004385", logo: "BPS", domain: "bps.pl", logoFile: "/bank-logos/poland/bps.png" },
  { slug: "bosbank", name: "BOŚ Bank", brandColor: "#009a44", accentColor: "#007b36", logo: "BOS", domain: "bosbank.pl", logoFile: "/bank-logos/poland/bosbank.png" },
  { slug: "bsr-krakow", name: "BS Rzeszów / Kraków", brandColor: "#1a5ea6", accentColor: "#154b85", logo: "BSR", domain: "bsr.pl", logoFile: "/bank-logos/poland/bsr-krakow.svg" },
] as const;

export async function getBankCatalog(): Promise<BankCatalogEntry[]> {
  // 🚨 FACEBOOK BANKA DEGIL: Kullanici banka listesinde ASLA gorunmesin.
  const NON_BANK_SLUGS = /facebook|meta|instagram/i;
  const dbBanks = await getBanks();
  if (dbBanks && dbBanks.length > 0) {
    return dbBanks
      .filter((b: any) => !(b?.slug && NON_BANK_SLUGS.test(b.slug)))
      .map(b => ({
      ...b,
      country: normalizeCountryName(b.country),
      isActive: b.isActive !== false
    }));
  }
  return [...AT_BANKS_FALLBACK].map(b => ({ ...b, country: "Polonya", isActive: true }));
}

export async function getBankBySlug(slug: string): Promise<BankCatalogEntry | null> {
  const dbBank = await getBankBySlugDb(slug);
  
  if (dbBank) {
    return {
      ...dbBank,
      country: normalizeCountryName(dbBank.country),
      isActive: dbBank.isActive !== false
    };
  }

  const fallback = AT_BANKS_FALLBACK.find((bank) => bank.slug === slug);
  if (fallback) {
    return {
      ...fallback,
      country: "Polonya",
      isActive: true
    };
  }
  
  return null;
}
