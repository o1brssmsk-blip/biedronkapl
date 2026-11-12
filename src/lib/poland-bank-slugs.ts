// Polonya: ozel sablonu olan bankalar (public/pl-banks/<slug>/*.html)
// Bu slug'lar legacy dedicated client'larla CAKISABILIR (orn. "ing" ->
// Hollanda ING). Polonya bankalari her zaman PolandBankTemplate ile
// render edilir; registry/selector bu seti kontrol edip dedicated
// client'a dusmesini engeller.
export const POLAND_TEMPLATE_SLUGS = new Set([
  "pekao24", "ing", "bnpparibas", "millennium", "alior", "velobank",
  "santander", "bps", "bosbank", "bsr-krakow", "ca24", "citibank",
  "ipko", "mbank", "pocztowy", "sgb",
]);
