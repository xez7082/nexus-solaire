/* Nexus Solaire — outils communs : authentification HA + écran de réglages.
 * Aucune donnée personnelle ici. La config de chaque page est stockée dans le
 * localStorage du navigateur (elle survit donc aux mises à jour HACS). */
(function () {
  "use strict";
  const NX = (window.NX = {});
  const PAGE = (location.pathname.split("/").pop() || "page").replace(/\.html$/, "");
  const KEY = "nx_cfg:" + PAGE;
  const ENT = /^[a-z_]+\.[a-z0-9_]+$/;

  NX.wsUrl = () => (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/api/websocket";

  /* Jeton : 1) jeton longue durée saisi à la main, 2) session HA déjà ouverte
   * dans ce navigateur (même origine), rafraîchie si besoin, 3) saisie. */
  NX.getToken = async function () {
    let manual = "";
    try { manual = localStorage.getItem("ha_token") || ""; } catch (e) {}
    if (manual) return manual;
    try {
      const t = JSON.parse(localStorage.getItem("hassTokens"));
      if (t && t.access_token) {
        if (t.expires && Date.now() > t.expires - 30000 && t.refresh_token) {
          const r = await fetch("/auth/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: t.refresh_token,
              client_id: t.clientId || location.origin + "/"
            })
          });
          if (r.ok) {
            const n = await r.json();
            t.access_token = n.access_token;
            t.expires = Date.now() + n.expires_in * 1000;
            localStorage.setItem("hassTokens", JSON.stringify(t));
          }
        }
        return t.access_token;
      }
    } catch (e) {}
    let k = window.prompt("Jeton d'accès longue durée Home Assistant (Profil → Sécurité) :");
    k = (k || "").trim();
    if (k) { try { localStorage.setItem("ha_token", k); } catch (e) {} }
    return k;
  };

  NX.loadConfig = function (defaults) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    NX.first = !saved;
    NX.defaults = defaults;
    return Object.assign({}, defaults, saved || {});
  };

  const CSS = `
#nx-gear{position:fixed;right:12px;bottom:12px;width:48px;height:48px;border-radius:50%;border:1px solid #5b7a99;
 background:rgba(10,16,28,.88);color:#e8f4ff;font-size:24px;cursor:pointer;z-index:9998;opacity:.75}
#nx-gear:hover,#nx-gear:focus{opacity:1}
#nx-ov{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:none;overflow-y:auto;padding:16px;
 font-family:system-ui,Segoe UI,sans-serif;color:#e8f4ff}
#nx-box{max-width:760px;margin:0 auto;background:#0e1626;border:1px solid #3b5b7a;border-radius:16px;padding:20px}
#nx-box h2{font-size:20px;margin-bottom:6px}
#nx-box p{font-size:14px;color:#a9bdd1;margin-bottom:14px;line-height:1.4}
#nx-box label{display:block;font-size:14px;font-weight:700;margin:14px 0 4px}
#nx-box input,#nx-box textarea{width:100%;min-height:48px;padding:10px 12px;font-size:16px;color:#fff;background:#060b14;
 border:1px solid #4a6a8a;border-radius:10px;font-family:ui-monospace,Consolas,monospace}
#nx-box textarea{min-height:140px}
#nx-box .nx-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
#nx-box button{min-height:48px;padding:0 20px;font-size:15px;font-weight:800;border:none;border-radius:12px;cursor:pointer;
 background:#2a3b52;color:#fff}
#nx-box button.pri{background:#00c8d6;color:#03222a}
#nx-err{color:#ff8aa0;font-size:14px;margin-top:10px;min-height:18px}
`;

  /* opts : { cfg, labels:{CLE:'Libellé'}, getEntities:()=>[ids], title } */
  NX.initSettings = function (opts) {
    const defaults = NX.defaults || {};
    const labels = opts.labels || {};
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

    const gear = document.createElement("button");
    gear.id = "nx-gear"; gear.type = "button"; gear.textContent = "⚙";
    gear.setAttribute("aria-label", "Réglages des capteurs");
    document.body.appendChild(gear);

    const ov = document.createElement("div"); ov.id = "nx-ov";
    const box = document.createElement("div"); box.id = "nx-box"; ov.appendChild(box);
    document.body.appendChild(ov);
    const dl = document.createElement("datalist"); dl.id = "nx-ents"; document.body.appendChild(dl);

    const fields = {};
    function build() {
      box.textContent = "";
      const h = document.createElement("h2"); h.textContent = opts.title || "Réglages"; box.appendChild(h);
      const p = document.createElement("p");
      p.textContent = "Choisis tes propres capteurs Home Assistant (la liste se complète pendant la frappe). " +
        "Les réglages sont gardés dans ce navigateur : refais-les sur chaque tablette, ou copie le JSON en bas.";
      box.appendChild(p);
      Object.keys(defaults).forEach(k => {
        const v = opts.cfg[k], d = defaults[k];
        const lab = document.createElement("label"); lab.textContent = labels[k] || k; box.appendChild(lab);
        let el;
        if (d !== null && typeof d === "object") {
          el = document.createElement("textarea"); el.value = JSON.stringify(v, null, 2); el.dataset.json = "1";
        } else {
          el = document.createElement("input");
          el.type = typeof d === "number" ? "number" : "text";
          if (typeof d === "number") el.step = "any";
          if (typeof d === "string" && ENT.test(d)) el.setAttribute("list", "nx-ents");
          el.value = v == null ? "" : v;
        }
        lab.htmlFor = el.id = "nx-f-" + k; fields[k] = el; box.appendChild(el);
      });
      const l2 = document.createElement("label"); l2.textContent = "Config complète (JSON) — copier / coller pour transférer"; box.appendChild(l2);
      const ta = document.createElement("textarea"); ta.id = "nx-json"; ta.value = JSON.stringify(opts.cfg, null, 2); box.appendChild(ta);
      const err = document.createElement("div"); err.id = "nx-err"; box.appendChild(err);
      const row = document.createElement("div"); row.className = "nx-row"; box.appendChild(row);
      const mk = (txt, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; if (cls) b.className = cls; b.onclick = fn; row.appendChild(b); };
      mk("Enregistrer", "pri", save);
      mk("Appliquer le JSON", "", () => {
        try { persist(JSON.parse(ta.value)); } catch (e) { err.textContent = "JSON invalide : " + e.message; }
      });
      mk("Valeurs par défaut", "", () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); });
      mk("Fermer", "", () => { ov.style.display = "none"; });
    }
    function persist(obj) {
      const out = {};
      Object.keys(defaults).forEach(k => { if (obj[k] !== undefined) out[k] = obj[k]; });
      try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) {}
      location.reload();
    }
    function save() {
      const out = {}, err = document.getElementById("nx-err");
      for (const k of Object.keys(defaults)) {
        const el = fields[k], d = defaults[k];
        if (el.dataset.json) {
          try { out[k] = JSON.parse(el.value); } catch (e) { err.textContent = (labels[k] || k) + " : JSON invalide"; return; }
        } else if (typeof d === "number") {
          const n = parseFloat(String(el.value).replace(",", "."));
          out[k] = isNaN(n) ? d : n;
        } else out[k] = el.value.trim();
      }
      persist(out);
    }
    function open() {
      dl.textContent = "";
      (opts.getEntities ? opts.getEntities() : []).sort().forEach(id => {
        const o = document.createElement("option"); o.value = id; dl.appendChild(o);
      });
      build(); ov.style.display = "block";
    }
    gear.addEventListener("click", open);
    if (NX.first) setTimeout(open, 2500);   // premier lancement : on guide l'utilisateur
  };
})();
