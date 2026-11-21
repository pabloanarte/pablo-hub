// Importar contactes del mòbil (vCard .vcf: iPhone, Mac, Google, Android), amb revisió abans d'importar.
window.VCF = (() => {
  const E = H.E;
  // ---- lectura del vCard ----
  function qp(s) { // quoted-printable (vCard 2.1 d'Android)
    const b = []; s = s.replace(/=\r?\n/g, "");
    for (let i = 0; i < s.length; i++) { if (s[i] === "=" && /^[0-9A-F]{2}$/i.test(s.substr(i + 1, 2))) { b.push(parseInt(s.substr(i + 1, 2), 16)); i += 2 } else b.push(...new TextEncoder().encode(s[i])) }
    return new TextDecoder().decode(new Uint8Array(b));
  }
  const des = v => v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
  const parts = v => v.split(/(?<!\\);/).map(x => des(x).trim());
  function llegeix(text) {
    const L = text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").replace(/=\n/g, "=\n").split("\n");
    const out = []; let c = null;
    for (let i = 0; i < L.length; i++) {
      let l = L[i]; if (!l.trim()) continue;
      if (/^BEGIN:VCARD/i.test(l)) { c = { tel: [], email: [], url: [], adr: [], ig: "" }; continue }
      if (/^END:VCARD/i.test(l)) { if (c) out.push(c); c = null; continue }
      if (!c) continue;
      // línies quoted-printable partides amb "=" al final
      if (/ENCODING=QUOTED-PRINTABLE/i.test(l)) while (l.endsWith("=") && i + 1 < L.length) l = l.slice(0, -1) + L[++i];
      const k = l.indexOf(":"); if (k < 0) continue;
      const cap = l.slice(0, k), val0 = l.slice(k + 1), nom = cap.split(";")[0].replace(/^[\w-]+\./, "").toUpperCase(), par = cap.toLowerCase();
      const val = /encoding=quoted-printable/.test(par) ? qp(val0) : val0;
      if (nom === "FN") c.fn = des(val).trim();
      else if (nom === "N") { const p = parts(val); c.n = [p[1], p[2], p[0]].filter(Boolean).join(" ") }
      else if (nom === "ORG") c.org = parts(val).filter(Boolean).join(", ");
      else if (nom === "TITLE") c.carrec = des(val).trim();
      else if (nom === "TEL") c.tel.push(des(val).trim());
      else if (nom === "EMAIL") c.email.push(des(val).trim().toLowerCase());
      else if (nom === "URL") c.url.push(des(val).trim());
      else if (nom === "ADR") c.adr.push(parts(val).filter(Boolean).join(", "));
      else if (nom === "NOTE") c.nota = des(val).trim();
      else if (nom === "X-SOCIALPROFILE" || nom === "IMPP") { const v = des(val).trim(); if (/instagram/i.test(par + v)) c.ig = c.ig || v }
    }
    return out.map(c => {
      const ig = (c.ig || c.url.find(u => /instagram\.com/i.test(u)) || "").replace(/^.*instagram\.com\/|^x-apple:|^@/i, "").replace(/[/?#].*$/, "");
      const persona = c.fn || c.n || "", org = c.org || "";
      return {
        nombre: org || persona, persona: org ? persona : "", email: c.email[0] || "", tel: c.tel[0] || "", ig: ig ? "@" + ig : "",
        web: c.url.find(u => !/instagram\.com/i.test(u)) || "", dir: c.adr[0] || "",
        notas: [c.carrec, c.tel.slice(1).length ? "Altres telèfons: " + c.tel.slice(1).join(", ") : "", c.email.slice(1).length ? "Altres correus: " + c.email.slice(1).join(", ") : "", c.nota].filter(Boolean).join("\n")
      };
    }).filter(c => c.nombre || c.email || c.tel);
  }
  // ---- duplicats ----
  const dig = t => String(t || "").replace(/\D/g, "").slice(-9);
  const nm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  function igual(a, C) {
    return C.find(x => (a.email && x.email && a.email === String(x.email).toLowerCase()) || (dig(a.tel).length >= 9 && dig(a.tel) === dig(x.tel)) || (a.nombre && (nm(a.nombre) === nm(x.nombre) || (a.persona && nm(a.persona) === nm(x.persona)) || (!a.persona && nm(a.nombre) === nm(x.persona)))));
  }
  // ---- revisió ----
  function obre(text, ctx) { // ctx: { C, tipos, estats, desa(c), afegeix(c) }
    const L = llegeix(text);
    if (!L.length) return H.toast("No hi he trobat cap contacte. Ha de ser un arxiu .vcf");
    L.forEach(c => { c.ja = igual(c, ctx.C); c.on = !c.ja });
    let q = "", tipus = ctx.tipos.includes("Contacte del mòbil") ? "Contacte del mòbil" : "Contacte del mòbil", estat = "Contactat";
    const vis = () => L.filter(c => !q || nm([c.nombre, c.persona, c.email, c.tel].join(" ")).includes(nm(q)));
    function pinta() {
      const v = vis(), n = L.filter(c => c.on).length;
      H.sheet(`<h3 style="font-size:22px;margin:4px 0 6px">Contactes del mòbil</h3>
        <p class="em">${L.length} contactes a l'arxiu${L.filter(c => c.ja).length ? `; ${L.filter(c => c.ja).length} ja els tens (desmarcats: si els marques, només s'hi afegeix el que els falti)` : ""}.</p>
        <div class="ls" style="gap:12px;align-items:flex-end"><div style="flex:1;min-width:160px"><label>Tipus per als importats</label><select id="vct">${[...new Set(["Contacte del mòbil", ...ctx.tipos])].map(t => `<option ${t === tipus ? "selected" : ""}>${E(t)}</option>`).join("")}</select></div>
        <div style="flex:1;min-width:160px"><label>Estat</label><select id="vce">${ctx.estats.map(s => `<option ${s === estat ? "selected" : ""}>${E(s)}</option>`).join("")}</select></div></div>
        <div class="ls" style="margin:12px 0 6px"><input id="vcq" placeholder="Cerca…" value="${E(q)}" style="flex:1;min-width:140px"><button class="t" data-vc="tots">Marcar tots</button><button class="t" data-vc="cap">Cap</button></div>
        <div id="vcl">${v.map(c => { const i = L.indexOf(c); return `<label class="fip" style="display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--bd);cursor:pointer"><input type="checkbox" data-vi="${i}" ${c.on ? "checked" : ""} style="width:auto;margin-top:3px"><span style="min-width:0"><b>${E(c.nombre || "Sense nom")}</b>${c.persona ? ` · ${E(c.persona)}` : ""}${c.ja ? ` <small style="color:#ff9f0a">· ja hi és</small>` : ""}<small style="display:block">${E([c.tel, c.email, c.ig].filter(Boolean).join(" · "))}</small></span></label>` }).join("") || `<p class="em">Cap resultat.</p>`}</div>
        <div style="position:sticky;bottom:0;background:#fff;padding:12px 0 4px;margin-top:8px"><button class="b" data-vc="ok" ${n ? "" : "disabled"} style="width:100%">Importar ${n} ${n === 1 ? "contacte" : "contactes"}</button></div>`);
      const box = document.getElementById("hshc");
      box.onclick = async e => {
        const b = e.target.closest("[data-vc]"); if (!b) return;
        if (b.dataset.vc === "tots" || b.dataset.vc === "cap") { vis().forEach(c => c.on = b.dataset.vc === "tots"); return pinta() }
        if (b.dataset.vc === "ok") {
          b.disabled = true; b.textContent = "Important…";
          const sel = L.filter(c => c.on); let nous = 0, compl = 0; if (sel.some(c => !c.ja) && ctx.nouTipus) ctx.nouTipus(tipus);
          for (let i = 0; i < sel.length; i++) {
            const c = sel[i], ja = c.ja && ctx.C.find(x => x.id === c.ja.id);
            if (ja) { let canvi = 0; ["email", "tel", "ig", "web", "dir", "persona"].forEach(k => { if (!ja[k] && c[k]) { ja[k] = c[k]; canvi = 1 } }); if (c.notas && !String(ja.notas || "").includes(c.notas)) { ja.notas = [ja.notas, c.notas].filter(Boolean).join("\n"); canvi = 1 } if (canvi) { await ctx.desa(ja); compl++ } }
            else { await ctx.afegeix({ id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: c.nombre, persona: c.persona, tipo: tipus, estado: estat, motivos: [], email: c.email, ig: c.ig, tel: c.tel, web: c.web, dir: c.dir, man: "", manId: "", notas: c.notas, msgs: [] }); nous++ }
            if (i % 20 === 19) b.textContent = `Important… ${i + 1}/${sel.length}`;
          }
          H.cerrar(); H.toast(`${nous} ${nous === 1 ? "contacte nou" : "contactes nous"}${compl ? `, ${compl} completats` : ""}`); ctx.fet && ctx.fet();
        }
      };
      box.onchange = e => {
        if (e.target.dataset.vi !== undefined) { L[+e.target.dataset.vi].on = e.target.checked; const n = L.filter(c => c.on).length, b = box.querySelector('[data-vc="ok"]'); b.textContent = `Importar ${n} ${n === 1 ? "contacte" : "contactes"}`; b.disabled = !n }
        if (e.target.id === "vct") tipus = e.target.value;
        if (e.target.id === "vce") estat = e.target.value;
      };
      box.oninput = e => { if (e.target.id !== "vcq") return; q = e.target.value; const p = e.target.selectionStart; pinta(); const i = document.getElementById("vcq"); i.focus(); i.setSelectionRange(p, p) };
    }
    pinta();
  }
  return { obre, _llegeix: llegeix };
})();
