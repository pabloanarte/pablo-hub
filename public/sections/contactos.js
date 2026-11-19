
const T=["Productora","Artista","Mànager"],CL={"Productora":"#0a84ff","Artista":"#ff375f","Mànager":"#30b27a"},PAL=["#ff9f0a","#af52de","#5ac8fa","#a2845e","#ffcc00","#64d2ff","#8e8e93"];
const ES=["Pendent","Contactat","Ha respost","Reunió","Descartat"],EC={"Pendent":"#ff3b30","Contactat":"#0a84ff","Ha respost":"#30b27a","Reunió":"#30b27a","Descartat":"#c7c7cc"};
const LG='<div class="lg"><span><i style="background:#ff3b30"></i>Per contactar</span><span><i style="background:#0a84ff"></i>Contactat</span><span><i style="background:#30b27a"></i>Ha respost</span></div>';
const MO=["Videoclips","Publicitat","Llargmetratge: Días de Sal","Llargmetratge: La Última Noche","Distribució de curts"];
const VIAS=["Email","Instagram","Telèfon"];
const DT={
emailP:"Asunto: Director en Barcelona\n\nHola [Nombre],\n\nSoy Pablo Anarte, director de Barcelona. He dirigido cortos de ficción y videoclips; el último acaba de salir.\n\nMe gustaría que me tuvierais en cuenta si surge algún proyecto en el que encaje un director. Todo mi trabajo está en pabloanarte.com.\n\nSi os va bien, me encantaría tomar un café y conoceros.\n\nUn saludo,\nPablo",
igP:"Hola [Nombre]! Soy Pablo Anarte, director de Barcelona. He dirigido cortos de ficción y videoclips. Me gustaría que me tuvierais en cuenta si surge algún proyecto en el que encaje un director. Mi trabajo: pabloanarte.com. Si os va bien, encantado de tomar un café.",
emailAs:"Asunto: Videoclip\n\nHola [Nombre],\n\nSoy Pablo, director de Barcelona. Me gusta tu música y me encantaría hacerte un videoclip. Dirijo con mirada cinematográfica y presupuestos ajustados. Mi trabajo está en pabloanarte.com.\n\nSi te interesa y tienes algún tema nuevo que vayas a sacar, hablemos!\n\nUn abrazo,\nPablo",
emailAg:"Asunto: Videoclip\n\nHola [Nombre],\n\nSoy Pablo, director de Barcelona. Me gusta vuestra música y me encantaría haceros un videoclip. Dirijo con mirada cinematográfica y presupuestos ajustados. Mi trabajo está en pabloanarte.com.\n\nSi os interesa y tenéis algún tema nuevo que vayáis a sacar, hablemos!\n\nUn abrazo,\nPablo",
igAs:"Hola [Nombre]! Soy Pablo, director de videoclips y cortos de Barcelona. Me gusta mucho tu música y me encantaría hacerte un videoclip. Mi trabajo: pabloanarte.com. Si te interesa y tienes algún tema nuevo que vayas a sacar, hablemos! :)",
igAg:"Hola [Nombre]! Soy Pablo, director de videoclips y cortos de Barcelona. Me gusta mucho vuestra música y me encantaría haceros un videoclip. Mi trabajo: pabloanarte.com. Si os interesa y tenéis algún tema nuevo que vayáis a sacar, hablemos! :)",
emailM:"Asunto: Director de videoclips para tus artistas\n\nHola [Nombre],\n\nSoy Pablo Anarte, director de Barcelona. Dirijo videoclips con mirada cinematográfica y presupuestos ajustados, y me gustaría ponerme a disposición de los artistas que representas por si alguno tiene un videoclip en camino.\n\nMi trabajo está en pabloanarte.com. Si te encaja, encantado de hablar y de enviarte una propuesta para el artista que tú veas.\n\nUn saludo,\nPablo",
igM:"Hola [Nombre]! Soy Pablo, director de videoclips de Barcelona. Me gustaría ponerme a disposición de los artistas que representas por si alguno tiene un videoclip en camino. Mi trabajo: pabloanarte.com. Si te encaja, hablamos y te cuento cómo trabajo.",
seg:"Hola [Nombre], retomo mi mensaje anterior por si se perdió. Sigo con ganas de hablar, sin prisa. Un saludo, Pablo"};
const TN={emailP:"Productora · Email",igP:"Productora · Instagram i telèfon",emailAs:"Artista solista · Email",igAs:"Artista solista · Instagram i telèfon",emailAg:"Artista grup · Email",igAg:"Artista grup · Instagram i telèfon",emailM:"Mànager · Email",igM:"Mànager · Instagram i telèfon",seg:"Seguiment"};

// Plantillas en inglés (mismas claves con _en)
const DT_EN={
emailP:"Subject: Director based in Barcelona\n\nHi [Nombre],\n\nI'm Pablo Anarte, a film director based in Barcelona. I've directed fiction short films and music videos; the latest one has just come out.\n\nI'd love you to keep me in mind if a project comes up where a director could fit. All my work is at pabloanarte.com.\n\nIf you're up for it, I'd be happy to grab a coffee and meet you.\n\nBest,\nPablo",
igP:"Hi [Nombre]! I'm Pablo Anarte, a film director based in Barcelona. I've directed fiction short films and music videos. I'd love you to keep me in mind if a project comes up where a director could fit. My work: pabloanarte.com. Happy to grab a coffee anytime.",
emailAs:"Subject: Music video\n\nHi [Nombre],\n\nI'm Pablo, a director based in Barcelona. I really like your music and I'd love to make a music video with you. I direct with a cinematic eye on tight budgets. My work is at pabloanarte.com.\n\nIf you're interested and have a new track coming out, let's talk!\n\nCheers,\nPablo",
emailAg:"Subject: Music video\n\nHi [Nombre],\n\nI'm Pablo, a director based in Barcelona. I really like your music and I'd love to make a music video with you all. I direct with a cinematic eye on tight budgets. My work is at pabloanarte.com.\n\nIf you're interested and have a new track coming out, let's talk!\n\nCheers,\nPablo",
igAs:"Hi [Nombre]! I'm Pablo, a music video and short film director from Barcelona. I really like your music and I'd love to make a music video with you. My work: pabloanarte.com. If you're interested and have a new track coming out, let's talk! :)",
igAg:"Hi [Nombre]! I'm Pablo, a music video and short film director from Barcelona. I really like your music and I'd love to make a music video with you all. My work: pabloanarte.com. If you're interested and have a new track coming out, let's talk! :)",
emailM:"Subject: Music video director for your artists\n\nHi [Nombre],\n\nI'm Pablo Anarte, a director based in Barcelona. I direct music videos with a cinematic eye on tight budgets, and I'd like to offer my work to the artists you represent in case any of them has a music video coming up.\n\nMy work is at pabloanarte.com. If it's a fit, I'd be glad to talk and send you a proposal for whichever artist you have in mind.\n\nBest,\nPablo",
igM:"Hi [Nombre]! I'm Pablo, a music video director from Barcelona. I'd like to offer my work to the artists you represent in case any of them has a music video coming up. My work: pabloanarte.com. If it's a fit, let's talk and I'll tell you how I work.",
seg:"Hi [Nombre], just following up on my previous message in case it got lost. Still keen to talk, no rush. Best, Pablo"};
Object.keys(DT_EN).forEach(k=>{DT[k+"_en"]=DT_EN[k];const b=TN[k];TN[k]=b+" · Castellà";TN[k+"_en"]=b+" · Anglès"});
let ml="es";
const $=s=>document.querySelector(s);
const E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const D=d=>d?d.split("-").reverse().join("/"):"";
const days=d=>Math.floor((Date.now()-new Date(d))/864e5);
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const ig=h=>h?"https://instagram.com/"+h.replace(/^.*instagram\.com\//,"").replace(/^@/,"").replace(/[\/?].*$/,""):"";
const wa=t=>{t=(t||"").replace(/\D/g,"");return t?"https://wa.me/"+(t.length===9?"34"+t:t):""};
const wb=u=>u?(/^https?:/.test(u)?u:"https://"+u):"";
const sp=v=>(v||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
const sb=t=>{const m=t.match(/^(?:Asunto|Subject): (.*)\n+([\s\S]*)$/);return m?"subject="+encodeURIComponent(m[1])+"&body="+encodeURIComponent(m[2]):"body="+encodeURIComponent(t)};
let C=[],cfg={tpl:{},mo:[]},view="hoy",flt="",q="",open=null,store=null,loc=0,started=0,cv="",tm,tm2,tt,undo,downloads=null;
const cur=()=>C.find(x=>x.id===open);
const tipos=()=>T.concat((cfg.tipos||[]).map(x=>x.n)),col=t=>CL[t]||((cfg.tipos||[]).find(x=>x.n===t)||{}).c||"#c7c7cc";
const save=c=>store&&store.set(c.id,c);
const flush=()=>{clearTimeout(tm);const c=cur();if(c)save(c)};window.addEventListener("pagehide",flush);
const M=c=>c.msgs||[];
function toast(t,fn){const e=$("#toast");undo=fn;e.innerHTML=E(t)+(fn?` <button class="t" data-a="undo">Desfer</button>`:"");e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,fn?6000:2200)}
function links(c,full,cmp){let em=sp(c.email),te=sp(c.tel);const ds=full?sp(c.dir):[];if(cmp){em=em.slice(0,1);te=te.slice(0,1)}
 const L=[[ig(c.ig),"Instagram"]].concat(em.map(x=>["mailto:"+x,em.length>1?x:"Email"]),te.map(x=>["tel:"+x.replace(/\s/g,""),te.length>1?"Trucar "+x:"Trucar"]),te.filter(x=>/^[67]/.test(x.replace(/\D/g,"").slice(-9))).map(x=>[wa(x),te.length>1?"WhatsApp "+x:"WhatsApp"]),[[wb(c.web),"Web"]],ds.map((x,i)=>["https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(x),"Mapa"+(ds.length>1?" "+(i+1):"")]));
 return L.filter(x=>x[0]).map(x=>`<a class="ln" target="_blank" rel="noopener" href="${E(x[0])}">${E(x[1])}</a>`).join("")}
function row(c,sub){return `<div class="r" data-a="o" data-id="${c.id}"><i class="dot" style="background:${EC[c.estado||"Pendent"]}"></i><div class="g"><b>${E(c.nombre||"Sense nom")}</b><small>${sub}</small></div><div class="ls">${links(c,0,1)}</div></div>`}
const due=c=>c.estado==="Contactat"&&M(c).length>0&&M(c).length<3&&days(M(c).at(-1).d)>=7;
let fh="";
const ct=c=>M(c).length>0||["Contactat","Ha respost","Reunió"].includes(c.estado),rs=c=>c.estado==="Ha respost"||c.estado==="Reunió";
function hoy(){
 const a=fh?C.filter(c=>c.tipo===fh):C,st=[["Contactes",a.length],["Contactats",a.filter(ct).length],["Respostes",a.filter(rs).length],["Reunions",a.filter(c=>c.estado==="Reunió").length]];
 const sec=(t,l,f)=>l.length?`<h2>${t} <span>${l.length}</span></h2>`+l.map(f).join(""):"";
 const tc=tipos().filter(t=>C.some(c=>c.tipo===t)).map(t=>{const l=C.filter(c=>c.tipo===t);return `<div class="tc ${fh===t?"on":""}" data-a="fh" data-t="${E(t)}"><b>${E(t)}</b><span>${l.filter(ct).length}<small>/${l.length}</small></span><small>contactats</small><small>${l.filter(rs).length} respostes</small></div>`}).join("");
 const la=c=>M(c).at(-1),pen=c=>(c.estado||"Pendent")==="Pendent",tp=c=>E(c.tipo||"");
 return `<div class="st">${st.map(x=>`<div><b>${x[1]}</b><small>${x[0]}</small></div>`).join("")}</div>`+
 (tc?`<h2>Per tipus (toca per filtrar)</h2><div class="tcs">${tc}</div>`:"")+LG+
 sec("Seguiments pendents",a.filter(due),c=>row(c,`${tp(c)} · últim enviament fa ${days(la(c).d)} dies`))+
 sec("Per contactar",a.filter(pen),c=>row(c,tp(c)))+
 sec("Contactats · esperant resposta",a.filter(c=>c.estado==="Contactat"&&!due(c)),c=>row(c,tp(c)+(la(c)?` · enviat ${D(la(c).d)} · ${(n=>n<=0?"seguiment avui":n===1?"seguiment demà":"seguiment en "+n+" dies")(7-days(la(c).d))}`:"")))+
 sec("Han respost",a.filter(rs),c=>row(c,`${tp(c)} · ${c.estado}`+(la(c)?` · últim enviament ${D(la(c).d)}`:"")))+
 sec("Descartats",a.filter(c=>c.estado==="Descartat"),c=>row(c,tp(c)))+
 (a.length?"":`<p class="em">Encara no hi ha contactes.</p>`)}
function contactos(){return `<div class="bar"><input id="q" placeholder="Cerca" value="${E(q)}"><button class="b" data-a="new">+ Nou</button></div><div class="seg">${[["Tots",""],["Productores","Productora"],["Artistes","Artista"],["Mànagers","Mànager"]].concat((cfg.tipos||[]).map(x=>[x.n,x.n])).map(x=>`<button class="t ${flt===x[1]?"on":""}" data-a="f" data-t="${x[1]}">${x[0]}</button>`).join("")}</div>${LG}<div id="lst"></div>`}
function fill(){const k=q.toLowerCase(),l=C.filter(c=>(!flt||c.tipo===flt)&&(!k||[c.nombre,c.persona,c.notas,c.man].join(" ").toLowerCase().includes(k))).sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));
 $("#lst").innerHTML=l.map(c=>row(c,E([c.tipo,c.estado||"Pendent",(c.motivos||[]).join(", ")].filter(Boolean).join(" · ")))).join("")||`<p class="em">Sense resultats.</p>`}
function plantillas(){return `<p class="em">Es desen soles. [Nombre] es substitueix pel nom del contacte en crear un enviament.</p>`+Object.keys(TN).map(k=>`<h2>${TN[k]}</h2><textarea data-k="${k}" rows="${k==="seg"||k.startsWith("ig")?5:10}">${E(cfg.tpl&&cfg.tpl[k]||DT[k])}</textarea><div class="ls"><button class="b" data-a="ct" data-k="${k}">Copiar</button><button class="t" data-a="rt" data-k="${k}">Restaurar</button></div>`).join("")}
function datos(){return `<h2>Dades</h2><p>${C.length} contactes desats${loc?" només en aquest dispositiu (no s'ha pogut connectar amb el teu compte)":" a la teva base de dades de Cloudflare, accessibles des de qualsevol dispositiu"}.</p><div class="ls"><button class="b" data-a="ej">Exportar JSON</button><button class="b" data-a="ec">Exportar CSV</button></div><h2>Importar</h2><button class="b" data-a="im">Importar JSON</button><input id="fi" type="file" accept=".json" hidden>`}
function draw(){document.querySelectorAll("#nav .t").forEach(b=>b.classList.toggle("on",b.dataset.v===view));$("#v").innerHTML=({hoy,contactos,plantillas,datos})[view]();if(view==="contactos")fill()}
function render(){if(view==="contactos"&&$("#lst"))fill();else if(!(view==="plantillas"&&document.activeElement&&document.activeElement.tagName==="TEXTAREA"))draw()}
function tk(c,via){if(M(c).length)return"seg";const p=via==="Email"?"email":"ig";if(c.tipo==="Artista")return p+"A"+(c.sub==="Grup"?"g":"s");return p+(c.tipo==="Mànager"?"M":"P")}
function tplFor(c,via){const k=tk(c,via)+(ml==="en"?"_en":"");return (cfg.tpl[k]||DT[k]).replace(/\[Nombre\]/g,(c.persona||c.nombre||"").split(" ")[0])}
function side(c){
 $("#lk").innerHTML=links(c,1);
 const mg=C.find(x=>x.id===c.manId);
 $("#mg").innerHTML=(mg?`<a class="ln" href="#" data-a="o" data-id="${mg.id}">Fitxa de ${E(mg.nombre)}</a>`:"")+(c.tipo==="Mànager"?"<small>Representa</small> "+C.filter(x=>x.manId===c.id).map(x=>`<a class="ln" href="#" data-a="o" data-id="${x.id}">${E(x.nombre)}</a>`).join(" "):"");
 $("#dl").innerHTML=C.filter(x=>x.id!==c.id).map(x=>`<option value="${E(x.nombre)}">`).join("");
 $("#ms").innerHTML=M(c).map((m,i)=>`<details class="m"><summary>${D(m.d)} · ${E(m.v)}${m.prog?" · programat":""}</summary><pre>${E(m.t)}</pre><label>Data de l'enviament</label><input type="date" data-md="${i}" value="${E(m.d)}"><button class="del" style="margin:0 0 6px" data-a="um" data-i="${i}">Desfer aquest enviament</button></details>`).reverse().join("")||"<small>Encara no hi ha enviaments.</small>"}
function sheet(id){
 const c=C.find(x=>x.id===id);if(!c)return;open=id;const y=$("#shc").scrollTop,cm=c.motivos||[];
 const inp=(f,p)=>`<input data-f="${f}" placeholder="${p}" value="${E(c[f])}">`;
 $("#shc").innerHTML=`<div class="top"><button class="t" data-a="x">Tancar</button></div>
 <input class="big" data-f="nombre" placeholder="Empresa o artista" value="${E(c.nombre)}">${inp("persona","Persona de contacte")}
 <div class="seg">${tipos().map(t=>`<button class="t ${c.tipo===t?"on":""}" data-a="tp" data-t="${E(t)}">${E(t)}</button>`).join("")}<input id="nt" placeholder="+ Un altre tipus (Retorn)" style="width:150px"></div>${c.tipo==="Artista"?`<div class="seg">${["Solista","Grup"].map(x=>`<button class="t ${(c.sub||"Solista")===x?"on":""}" data-a="sub" data-s="${x}">${x}</button>`).join("")}</div>`:""}
 <label>Estat</label><select data-f="estado">${ES.map(s=>`<option ${s===(c.estado||"Pendent")?"selected":""}>${s}</option>`).join("")}</select>
 <label>Motiu del contacte</label><div class="seg">${MO.concat(cfg.mo||[]).map(m=>`<button class="t ${cm.includes(m)?"on":""}" data-a="mo" data-m="${E(m)}">${E(m)}</button>`).join("")}<input id="nm" placeholder="+ Un altre (Retorn)" style="width:150px"></div>
 <label>Contacte</label>${inp("email","Email (diversos, separats per comes)")}${inp("ig","Instagram (@usuari o enllaç)")}${inp("tel","Telèfon (diversos, separats per comes)")}${inp("web","Web")}<label>Adreça de les oficines (una per línia)</label><textarea data-f="dir" rows="2">${E(c.dir)}</textarea><div id="lk" class="ls"></div>
 ${c.tipo==="Productora"||c.tipo==="Mànager"?"":`<label>Gestionat per (mànager)</label><input data-f="man" list="dl" placeholder="Nom del mànager" value="${E(c.man)}">`}<div id="mg" class="ls"></div>
 <label>Notes</label><textarea data-f="notas" rows="3">${E(c.notas)}</textarea>
 <label>Enviaments</label><div id="ms"></div><div id="cmp"></div><div class="seg"><button class="b" data-a="cmp">Nou enviament</button></div><div id="crr"></div><div id="rs" ${["Ha respost","Reunió"].includes(c.estado)?"":"hidden"}><label>Resposta (enganxa aquí el que t'han contestat)</label><textarea data-f="resp" rows="5">${E(c.resp)}</textarea></div>
 <div class="sfoot"><button class="del" data-a="del">Eliminar contacte</button><button class="b" data-a="save">Desar</button></div>`;
 side(c);$("#sh").hidden=false;$("#shc").scrollTop=y;correus(c)}
// Correus amb aquest contacte (Gmail, si està connectat)
let corOk=null;
async function correuOk(){if(corOk===null){try{corOk=(await H.api("GET","correu/config")).connectat}catch(e){corOk=false}}return corOk}
async function correus(c){const em=sp(c.email);if(!em.length||!await correuOk()||open!==c.id)return;const el=$("#crr");if(!el)return;el.innerHTML=`<label>Correus</label><small>Carregant…</small>`;
 try{const r=await H.api("GET","correu/llista?max=8&q="+encodeURIComponent(em.map(x=>`from:${x} OR to:${x}`).join(" OR ")));if(open!==c.id||!$("#crr"))return;
  $("#crr").innerHTML=`<label>Correus</label>`+(r.fils.length?r.fils.map(f=>`<div class="r" data-a="fil" data-id="${f.id}"><i class="dot" style="background:${f.nollegit?"#000":"transparent"}"></i><div class="g"><b>${E(f.assumpte||"(sense assumpte)")}</b><small>${E(f.de)} · ${new Date(f.data).toLocaleDateString("ca-ES",{day:"numeric",month:"short"})} · ${E(f.resum.slice(0,90))}</small></div></div>`).join(""):`<small>Encara no hi ha correus amb aquest contacte.</small>`)}catch(e){$("#crr").innerHTML=""}}
let envOc=0;
async function envia(c,quan){if(envOc)return;const t=$("#tx").value,m=t.match(/^(?:Asunto|Subject): (.*)\n+([\s\S]*)$/),a=sp(c.email)[0];if(!a)return toast("Aquest contacte no té email");
 const b=$("#cmp [data-a=envia]"),bp=$("#cmp [data-a=prog]");envOc=1;if(bp)bp.disabled=true;if(b){b.disabled=true;b.textContent="Enviant…"}
 try{const r=await H.api("POST","correu/envia",{a,assumpte:m?m[1]:"",cos:m?m[2]:t,quan:quan||""});const id=c.id;const lq=quan&&(x=>new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10))(new Date(quan));envOc=0;c.msgs=M(c).concat(Object.assign({d:quan?lq:today(),v:"Email",t},r.programat?{prog:r.programat}:{}));if((c.estado||"Pendent")==="Pendent")c.estado="Contactat";save(c);sheet(id);toast(quan?"Programat per al "+new Date(quan).toLocaleString("ca-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"Enviat")}
 catch(e){envOc=0;toast("No s'ha pogut enviar"+(e&&e.error?": "+(e.error==="config"?"el correu no està connectat":e.error):""));if(bp)bp.disabled=false;if(b){b.disabled=false;b.textContent="Enviar ara"}}}
// Perquè altres seccions (Correu, Inici) puguin obrir i actualitzar contactes
window.CONT={
 obre:id=>{hubShow("contactos");setTimeout(()=>sheet(id),60)},
 registra:(em,t,d,pid)=>{em=(String(em||"").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)||[""])[0].toLowerCase();if(!em)return;const c=C.find(x=>sp(x.email).some(y=>y.toLowerCase()===em));if(!c)return;c.msgs=M(c).concat(Object.assign({d:d||today(),v:"Email",t},pid?{prog:pid}:{}));if((c.estado||"Pendent")==="Pendent")c.estado="Contactat";save(c);render()},
 desprograma:pid=>{C.forEach(c=>{if(!M(c).some(m=>m.prog===pid))return;c.msgs=M(c).filter(m=>m.prog!==pid);if(!c.msgs.length&&c.estado==="Contactat")c.estado="Pendent";save(c)});render()},
 estat:(id,e)=>{const c=C.find(x=>x.id===id);if(!c)return;c.estado=e;save(c);render()},
 tots:()=>C,
 color:e=>EC[e||"Pendent"]||"#c7c7cc"
};
function cmp(c,via){via=via||({"Productora":"Email","Artista":"Instagram"})[c.tipo]||(c.email?"Email":c.ig?"Instagram":"Telèfon");cv=via;
 $("#cmp").innerHTML=`<div class="seg">${VIAS.map(v=>`<button class="t ${v===via?"on":""}" data-a="via" data-v="${v}">${v}</button>`).join("")}<span style="flex:1"></span>${[["es","Castellà"],["en","Anglès"]].map(([v,l])=>`<button class="t ${v===ml?"on":""}" data-a="ml" data-v="${v}">${l}</button>`).join("")}</div><textarea id="tx" rows="9">${E(tplFor(c,via))}</textarea><label>Data de l'enviament</label><input type="date" id="fd" value="${today()}"><div class="ls"><button class="b" data-a="cp">Copiar</button><a class="ln" id="op" target="_blank" rel="noopener">Obrir</a><button class="b" data-a="sent">Marcar com a enviat</button></div><div id="envh"></div>`;ol(c);envH(c)}
async function envH(c){if(cv!=="Email"||!sp(c.email).length||!await correuOk()||!$("#envh"))return;
 $("#envh").innerHTML=`<label>Des del hub (Gmail)</label><div class="ls"><button class="b" data-a="envia">Enviar ara</button><input type="datetime-local" id="fq" style="width:auto"><button class="b2" data-a="prog">Programar</button></div><small>Envia des de pablo.anarte.film@gmail.com i ho apunta com a enviament.</small>`;
 // amb Gmail connectat, el botó principal és "Enviar ara"; la resta queden en segon pla
 $("#cmp").querySelectorAll('[data-a=cp],[data-a=sent]').forEach(b=>b.className="b2");const o=$("#op");if(o)o.className="b2";
 const nb=$('#shc [data-a=cmp]');if(nb)nb.hidden=true}
function ol(c){const t=$("#tx").value;$("#op").href=(cv==="Instagram"?ig(c.ig):cv==="Email"&&sp(c.email).length?"mailto:"+sp(c.email)[0]+"?"+sb(t):cv==="Telèfon"?wa(sp(c.tel)[0]):"")||"#"}
async function copy(t){try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}toast("Copiat")}
function csv(){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';return ["nombre","persona","tipo","estado","motivos","email","instagram","telefono","web","direccion","gestionado_por","notas","envios","ultimo_envio"].join(",")+"\n"+C.map(c=>[c.nombre,c.persona,c.tipo,c.estado,(c.motivos||[]).join("; "),c.email,c.ig,c.tel,c.web,(c.dir||"").replace(/\n/g," | "),c.man,c.notas,M(c).length,M(c).length?M(c).at(-1).d:""].map(q).join(",")).join("\n")}
async function dl(name,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data]));a.download=name;document.body.appendChild(a);a.click();a.remove()}
document.addEventListener("click",e=>{
 if(e.target.closest("a[target]"))return;
 const b=e.target.closest("[data-a]");if(!b)return;if(b.tagName==="A")e.preventDefault();
 const a=b.dataset.a,c=cur(),d=b.dataset;
 if(a==="nav"){view=d.v;draw()}
 else if(a==="o")sheet(d.id)
 else if(a==="x"){flush();open=null;$("#sh").hidden=true;render()}
 else if(a==="save"){clearTimeout(tm);Promise.resolve(save(c)).then(ok=>{if(ok!==false){toast("Desat");open=null;$("#sh").hidden=true;render()}})}
 else if(a==="f"){flt=d.t;draw()}
 else if(a==="new"){const n={id:"c_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),nombre:"",persona:"",tipo:flt||"Productora",estado:"Pendent",motivos:[],email:"",ig:"",tel:"",web:"",dir:"",man:"",manId:"",notas:"",msgs:[]};C.push(n);save(n);sheet(n.id);render();$("#shc [data-f=nombre]").focus()}
 else if(a==="tp"){c.tipo=d.t;save(c);sheet(c.id)}
 else if(a==="mo"){const s=new Set(c.motivos||[]);s.has(d.m)?s.delete(d.m):s.add(d.m);c.motivos=[...s];b.classList.toggle("on");save(c)}
 else if(a==="fh"){fh=fh===d.t?"":d.t;draw()}
 else if(a==="sub"){c.sub=d.s;save(c);sheet(c.id)}
 else if(a==="um"){const pm=M(c)[+d.i];if(pm&&pm.prog&&String(pm.prog).startsWith("P_")){if(!confirm("És un enviament programat: també es cancel·larà a Gmail. Continuar?"))return;H.api("POST","correu/cancela",{id:pm.prog}).catch(()=>toast("No s'ha pogut cancel·lar a Gmail"))}c.msgs=M(c).filter((_,i)=>i!==+d.i);if(!c.msgs.length&&c.estado==="Contactat")c.estado="Pendent";save(c);sheet(c.id)}
 else if(a==="undo"){undo&&undo();$("#toast").hidden=true}
 else if(a==="cmp")cmp(c)
 else if(a==="via")cmp(c,d.v)
 else if(a==="ml"){ml=d.v;cmp(c,cv)}
 else if(a==="cp")copy($("#tx").value)
 else if(a==="envia")envia(c)
 else if(a==="prog"){const v=$("#fq").value;if(!v)return toast("Tria el dia i l'hora");if(new Date(v)<=new Date())return toast("Ha de ser una hora futura");envia(c,new Date(v).toISOString())}
 else if(a==="fil"){$("#sh").hidden=true;open=null;window.CORREU&&CORREU.obre(d.id)}
 else if(a==="sent"){const id=c.id,pm=M(c),pe=c.estado;c.msgs=pm.concat({d:$("#fd").value||today(),v:cv,t:$("#tx").value});if((c.estado||"Pendent")==="Pendent")c.estado="Contactat";save(c);sheet(id);toast("Enviament registrat",()=>{const k=C.find(x=>x.id===id);k.msgs=pm;k.estado=pe;save(k);if(open===id)sheet(id)})}
 else if(a==="del"){if(!b.dataset.s){b.dataset.s=1;b.textContent="Prem un altre cop per eliminar"}else{store.del(c.id);C=C.filter(x=>x.id!==c.id);open=null;$("#sh").hidden=true;render()}}
 else if(a==="ct")copy($(`textarea[data-k=${d.k}]`).value)
 else if(a==="rt"){delete cfg.tpl[d.k];store.set("cfg",cfg);draw()}
 else if(a==="ej")dl("pablo-contactos.json",JSON.stringify({contactos:C,config:cfg},null,1))
 else if(a==="ec")dl("pablo-contactos.csv",csv())

 else if(a==="im")$("#fi").click()
});
document.addEventListener("input",e=>{
 const t=e.target;
 if(t.id==="q"){q=t.value;fill()}
 else if(t.id==="tx")ol(cur());
 else if(t.dataset.md!==undefined){const c=cur();c.msgs[+t.dataset.md].d=t.value;clearTimeout(tm);tm=setTimeout(()=>{save(c);render()},400)}
 else if(t.dataset.f){const c=cur(),pv=c[t.dataset.f];c[t.dataset.f]=t.value;if(t.dataset.f==="estado"){const id=c.id;$("#rs").hidden=!["Ha respost","Reunió"].includes(t.value);toast("Estat: "+t.value,()=>{const k=C.find(x=>x.id===id);k.estado=pv||"Pendent";save(k);if(open===id)sheet(id)})}if(t.dataset.f==="man"){const m=C.find(x=>x.id!==c.id&&x.nombre===t.value);c.manId=m?m.id:""}clearTimeout(tm);tm=setTimeout(()=>{save(c);side(c);render()},400)}
 else if(t.dataset.k){cfg.tpl[t.dataset.k]=t.value;clearTimeout(tm2);tm2=setTimeout(()=>store.set("cfg",cfg),400)}
});
document.addEventListener("keydown",e=>{
 if(e.target.id==="nt"&&e.key==="Enter"&&e.target.value.trim()){const c=cur(),v=e.target.value.trim();if(!tipos().includes(v))cfg.tipos=(cfg.tipos||[]).concat({n:v,c:PAL[(cfg.tipos||[]).length%PAL.length]});store.set("cfg",cfg);c.tipo=v;save(c);sheet(c.id)}
 if(e.target.id==="nm"&&e.key==="Enter"&&e.target.value.trim()){const c=cur(),v=e.target.value.trim();cfg.mo=(cfg.mo||[]).concat(v);store.set("cfg",cfg);c.motivos=(c.motivos||[]).concat(v);save(c);sheet(c.id)}
 
});
function local(){loc=1;let d={};try{d=JSON.parse(localStorage.getItem("pdb")||"{}")}catch(e){}
 const p=()=>{try{localStorage.setItem("pdb",JSON.stringify(d))}catch(e){}};
 store={set:(id,o)=>{d[id]=o;p()},del:id=>{delete d[id];p()}};
 C=Object.keys(d).filter(k=>k!=="cfg").map(k=>Object.assign({},d[k],{id:k}));if(d.cfg)cfg=Object.assign(cfg,d.cfg);render()}
async function init(){
 const api=(m,p,b)=>fetch("/api/"+p,{method:m,headers:{"content-type":"application/json"},body:b?JSON.stringify(b):undefined}).then(r=>{if(!r.ok)throw 0;return r.json()});
 try{const d=await api("GET","all");C=d.contacts;cfg=Object.assign({tpl:{},mo:[],tipos:[]},d.cfg||{})}catch(e){local();return}
 store={set:(id,o)=>api("PUT","doc/"+encodeURIComponent(id),o).then(()=>{H.refrescaContactes&&H.refrescaContactes();return true}).then(()=>true).catch(()=>{toast("No s'ha pogut desar");return false}),del:id=>api("DELETE","doc/"+encodeURIComponent(id)).then(()=>H.refrescaContactes&&H.refrescaContactes()).catch(()=>{})};
 {const M=H.MIG,mm=v=>M[v]||v;C.forEach(c=>{const a=JSON.stringify([c.estado,c.tipo,c.motivos]);c.estado=mm(c.estado);c.tipo=mm(c.tipo);if(Array.isArray(c.motivos))c.motivos=c.motivos.map(mm);if(JSON.stringify([c.estado,c.tipo,c.motivos])!==a)store.set(c.id,c)});const b=JSON.stringify(cfg);cfg.mo=(cfg.mo||[]).map(mm);(cfg.tipos||[]).forEach(t=>t.n=mm(t.n));if(JSON.stringify(cfg)!==b)store.set("cfg",cfg)}
 render()}
function go(){if(!started){started=1;draw();init()}}
go();

document.addEventListener("change",async e=>{if(e.target.id!=="fi")return;const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text()),n=j.contactos||[];C=C.filter(x=>!n.some(y=>y.id===x.id)).concat(n);n.forEach(save);if(j.config){cfg=Object.assign(cfg,j.config);store.set("cfg",cfg)}render();toast("Importats "+n.length+(n.length===1?" contacte":" contactes"))}catch(x){toast("Arxiu no vàlid")}e.target.value=""});

document.getElementById("sh").addEventListener("click",e=>{if(e.target.id==="sh"){const b=document.querySelector('#shc [data-a="x"]');b&&b.click()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("sh").hidden){const b=document.querySelector('#shc [data-a="x"]');b&&b.click()}});
