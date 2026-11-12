export const VAN_LANSCHOT_KEMPEN_LOGO_URL = "/bank-logos/van-lanschot-kempen.svg";

export const LOCAL_BANK_LOGO_BY_SLUG: Record<string, string> = {
  "bigbank": "/bank-logos/estonia/bigbank.jpg",
  "citadele-banka": "/bank-logos/estonia/citadele-banka.jpg",
  "coop-pank": "/bank-logos/estonia/coop-pank.jpg",
  "inbank": "/bank-logos/estonia/inbank.png",
  "lhv-pank": "/bank-logos/estonia/lhv-pank.jpg",
  "luminor-ee": "/bank-logos/estonia/luminor-ee.jpg",
  "op-corporate-bank": "/bank-logos/estonia/op-corporate-bank.jpg",
  "seb-pank": "/bank-logos/estonia/seb-pank.jpg",
  "swedbank-ee": "/bank-logos/estonia/swedbank-ee.jpg",
  "van-lanschot-kempen": VAN_LANSCHOT_KEMPEN_LOGO_URL,

  // Litvanya (Lithuania) bankalari - logo dosyalari public/bank-logos/lithuania/
  // altina {slug}.png veya {slug}.jpg olarak kaydedildiginde otomatik okunur.
  "swedbank-lt": "/bank-logos/lithuania/swedbank-lt.png",
  "seb-lt": "/bank-logos/lithuania/seb-lt.png",
  "luminor-lt": "/bank-logos/lithuania/luminor-lt.png",
  "citadele-lt": "/bank-logos/lithuania/citadele-lt.png",
  "lku-lt": "/bank-logos/lithuania/lku-lt.png",
  "kredito-unijos-lt": "/bank-logos/lithuania/kredito-unijos-lt.png",
  "siauliu-bankas-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "siauliu-bankas": "/bank-logos/lithuania/siauliu-lt.png",
  "siauliu-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "artea-lt": "/bank-logos/lithuania/siauliu-lt.png",
  "citadele": "/bank-logos/lithuania/citadele-lt.png",
  "luminor": "/bank-logos/lithuania/luminor-lt.png",
  "seb": "/bank-logos/lithuania/seb-lt.png",
  "swedbank": "/bank-logos/lithuania/swedbank-lt.png",

  // Irlanda (Ireland) bankalari - public/bank-logos/ireland/
  "permanent-tsb": "/bank-logos/ireland/ptsb.png",
  "ptsb": "/bank-logos/ireland/ptsb.png",
  "aib": "/bank-logos/ireland/aib.svg",
  "an-post": "/bank-logos/ireland/an-post.svg",
  "anpost": "/bank-logos/ireland/an-post.svg",
  "bank-of-ireland": "/bank-logos/ireland/bank-of-ireland.svg",
  "boi": "/bank-logos/ireland/bank-of-ireland.svg",
  "ebs": "/bank-logos/ireland/ebs.png",
  "revolut": "/bank-logos/ireland/revolut.svg",
  "wise": "/bank-logos/ireland/wise.svg",

  // Polonya (Poland) bankalari - public/bank-logos/poland/
  "pekao24": "/bank-logos/poland/pekao24.webp",
  "pekao": "/bank-logos/poland/pekao24.webp",
  "ing": "/bank-logos/poland/ing.webp",
  "ingbank": "/bank-logos/poland/ing.webp",
  "ing-bank-slaski": "/bank-logos/poland/ing.webp",
  "bnpparibas": "/bank-logos/poland/bnpparibas.webp",
  "bnp-paribas": "/bank-logos/poland/bnpparibas.webp",
  "millennium": "/bank-logos/poland/millennium.webp",
  "bank-millennium": "/bank-logos/poland/millennium.webp",
  "alior": "/bank-logos/poland/alior.webp",
  "alior-bank": "/bank-logos/poland/alior.webp",
  "velobank": "/bank-logos/poland/velobank.webp",
  "santander": "/bank-logos/poland/santander.svg",
  "santander-pl": "/bank-logos/poland/santander.svg",
  "bps": "/bank-logos/poland/bps.webp",
  "bank-bps": "/bank-logos/poland/bps.webp",
  "bosbank": "/bank-logos/poland/bosbank.webp",
  "bosbank24": "/bank-logos/poland/bosbank.webp",
  "bsr-krakow": "/bank-logos/poland/bsr-krakow.svg",
  "ca24": "/bank-logos/poland/ca24.webp",
  "credit-agricole": "/bank-logos/poland/ca24.webp",
  "citibank": "/bank-logos/poland/citibank.svg",
  "citi": "/bank-logos/poland/citibank.svg",
  "ipko": "/bank-logos/poland/ipko.webp",
  "pko": "/bank-logos/poland/ipko.webp",
  "pko-bp": "/bank-logos/poland/ipko.webp",
  "mbank": "/bank-logos/poland/mbank.webp",
  "pocztowy": "/bank-logos/poland/pocztowy.webp",
  "bank-pocztowy": "/bank-logos/poland/pocztowy.webp",
  "sgb": "/bank-logos/poland/sgb.webp",
  "sgb24": "/bank-logos/poland/sgb.webp",
};

export function resolveLocalBankLogoFile(slug?: string | null, logoFile?: string | null) {
  const normalizedLogoFile = typeof logoFile === "string" ? logoFile.trim() : "";

  // 1. ONCELIK: Tam HTTP/HTTPS URL donerse (supabase storage, CDN vs) DOGRUDAN kullan
  if (/^https?:\/\//i.test(normalizedLogoFile)) {
    return normalizedLogoFile;
  }

  // 2. Lokal static asset path ("/bank-logos/...") ise dogrudan kullan
  if (normalizedLogoFile.startsWith("/")) {
    return normalizedLogoFile;
  }

  // 3. Slug bazli lokal eslesme (Estonya + Litvanya)
  if (slug) {
    const localLogo = LOCAL_BANK_LOGO_BY_SLUG[slug];
    if (localLogo) {
      return localLogo;
    }
  }

  // 4. Son fallback (logoFile tanimli ise onu geri don, aksi halde bos string)
  return normalizedLogoFile;
}
