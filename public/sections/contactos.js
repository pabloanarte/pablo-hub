
const T=["Productora","Artista","Manager"],CL={Productora:"#0a84ff",Artista:"#ff375f",Manager:"#30b27a"},PAL=["#ff9f0a","#af52de","#5ac8fa","#a2845e","#ffcc00","#64d2ff","#8e8e93"];
const ES=["Pendiente","Contactado","Respondió","Reunión","Descartado"],EC={Pendiente:"#ff3b30",Contactado:"#0a84ff",Respondió:"#30b27a",Reunión:"#30b27a",Descartado:"#c7c7cc"};
const LG='<div class="lg"><span><i style="background:#ff3b30"></i>Por contactar</span><span><i style="background:#0a84ff"></i>Contactado</span><span><i style="background:#30b27a"></i>Respondió</span></div>';
const MO=["Videoclips","Publicidad","Largometraje: Días de Sal","Largometraje: La Última Noche","Distribución de cortos"];
const VIAS=["Email","Instagram","Teléfono"];
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
const TN={emailP:"Productora · Email",igP:"Productora · Instagram y teléfono",emailAs:"Artista solitario · Email",igAs:"Artista solitario · Instagram y teléfono",emailAg:"Artista grupo · Email",igAg:"Artista grupo · Instagram y teléfono",emailM:"Manager · Email",igM:"Manager · Instagram y teléfono",seg:"Seguimiento"};
const $=s=>document.querySelector(s);
const E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const D=d=>d?d.split("-").reverse().join("/"):"";
const days=d=>Math.floor((Date.now()-new Date(d))/864e5);
const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const ig=h=>h?"https://instagram.com/"+h.replace(/^.*instagram\.com\//,"").replace(/^@/,"").replace(/[\/?].*$/,""):"";
const wa=t=>{t=(t||"").replace(/\D/g,"");return t?"https://wa.me/"+(t.length===9?"34"+t:t):""};
const wb=u=>u?(/^https?:/.test(u)?u:"https://"+u):"";
const sp=v=>(v||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
const sb=t=>{const m=t.match(/^Asunto: (.*)\n+([\s\S]*)$/);return m?"subject="+encodeURIComponent(m[1])+"&body="+encodeURIComponent(m[2]):"body="+encodeURIComponent(t)};
let C=[],cfg={tpl:{},mo:[]},view="hoy",flt="",q="",open=null,store=null,loc=0,started=0,cv="",tm,tm2,tt,undo,downloads=null;
const cur=()=>C.find(x=>x.id===open);
const tipos=()=>T.concat((cfg.tipos||[]).map(x=>x.n)),col=t=>CL[t]||((cfg.tipos||[]).find(x=>x.n===t)||{}).c||"#c7c7cc";
const save=c=>store&&store.set(c.id,c);
const flush=()=>{clearTimeout(tm);const c=cur();if(c)save(c)};window.addEventListener("pagehide",flush);
const M=c=>c.msgs||[];
function toast(t,fn){const e=$("#toast");undo=fn;e.innerHTML=E(t)+(fn?` <button class="t" data-a="undo">Deshacer</button>`:"");e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,fn?6000:2200)}
function links(c,full,cmp){let em=sp(c.email),te=sp(c.tel);const ds=full?sp(c.dir):[];if(cmp){em=em.slice(0,1);te=te.slice(0,1)}
 const L=[[ig(c.ig),"Instagram"]].concat(em.map(x=>["mailto:"+x,em.length>1?x:"Email"]),te.map(x=>["tel:"+x.replace(/\s/g,""),te.length>1?"Llamar "+x:"Llamar"]),te.filter(x=>/^[67]/.test(x.replace(/\D/g,"").slice(-9))).map(x=>[wa(x),te.length>1?"WhatsApp "+x:"WhatsApp"]),[[wb(c.web),"Web"]],ds.map((x,i)=>["https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(x),"Mapa"+(ds.length>1?" "+(i+1):"")]));
 return L.filter(x=>x[0]).map(x=>`<a class="ln" target="_blank" rel="noopener" href="${E(x[0])}">${E(x[1])}</a>`).join("")}
function row(c,sub){return `<div class="r" data-a="o" data-id="${c.id}"><i class="dot" style="background:${EC[c.estado||"Pendiente"]}"></i><div class="g"><b>${E(c.nombre||"Sin nombre")}</b><small>${sub}</small></div><div class="ls">${links(c,0,1)}</div></div>`}
const due=c=>c.estado==="Contactado"&&M(c).length>0&&M(c).length<3&&days(M(c).at(-1).d)>=7;
let fh="";
const ct=c=>M(c).length>0||["Contactado","Respondió","Reunión"].includes(c.estado),rs=c=>c.estado==="Respondió"||c.estado==="Reunión";
function hoy(){
 const a=fh?C.filter(c=>c.tipo===fh):C,st=[["Contactos",a.length],["Contactados",a.filter(ct).length],["Respuestas",a.filter(rs).length],["Reuniones",a.filter(c=>c.estado==="Reunión").length]];
 const sec=(t,l,f)=>l.length?`<h2>${t} <span>${l.length}</span></h2>`+l.map(f).join(""):"";
 const tc=tipos().filter(t=>C.some(c=>c.tipo===t)).map(t=>{const l=C.filter(c=>c.tipo===t);return `<div class="tc ${fh===t?"on":""}" data-a="fh" data-t="${E(t)}"><b>${E(t)}</b><span>${l.filter(ct).length}<small>/${l.length}</small></span><small>contactados</small><small>${l.filter(rs).length} respuestas</small></div>`}).join("");
 const la=c=>M(c).at(-1),pen=c=>(c.estado||"Pendiente")==="Pendiente",tp=c=>E(c.tipo||"");
 return `<div class="st">${st.map(x=>`<div><b>${x[1]}</b><small>${x[0]}</small></div>`).join("")}</div>`+
 (tc?`<h2>Por tipo (toca para filtrar)</h2><div class="tcs">${tc}</div>`:"")+LG+
 sec("Seguimientos pendientes",a.filter(due),c=>row(c,`${tp(c)} · último envío hace ${days(la(c).d)} días`))+
 sec("Por contactar",a.filter(pen),c=>row(c,tp(c)))+
 sec("Contactados · esperando respuesta",a.filter(c=>c.estado==="Contactado"&&!due(c)),c=>row(c,tp(c)+(la(c)?` · enviado ${D(la(c).d)} · seguimiento en ${Math.max(0,7-days(la(c).d))} días`:"")))+
 sec("Han respondido",a.filter(rs),c=>row(c,`${tp(c)} · ${c.estado}`+(la(c)?` · último envío ${D(la(c).d)}`:"")))+
 sec("Descartados",a.filter(c=>c.estado==="Descartado"),c=>row(c,tp(c)))+
 (a.length?"":`<p class="em">Aún no hay contactos.</p>`)}
function contactos(){return `<div class="bar"><input id="q" placeholder="Buscar" value="${E(q)}"><button class="b" data-a="new">+ Nuevo</button></div><div class="seg">${[["Todos",""],["Productoras","Productora"],["Artistas","Artista"],["Managers","Manager"]].concat((cfg.tipos||[]).map(x=>[x.n,x.n])).map(x=>`<button class="t ${flt===x[1]?"on":""}" data-a="f" data-t="${x[1]}">${x[0]}</button>`).join("")}</div>${LG}<div id="lst"></div>`}
function fill(){const k=q.toLowerCase(),l=C.filter(c=>(!flt||c.tipo===flt)&&(!k||[c.nombre,c.persona,c.notas,c.man].join(" ").toLowerCase().includes(k))).sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));
 $("#lst").innerHTML=l.map(c=>row(c,E([c.tipo,c.estado||"Pendiente",(c.motivos||[]).join(", ")].filter(Boolean).join(" · ")))).join("")||`<p class="em">Sin resultados.</p>`}
function plantillas(){return `<p class="em">Se guardan solas. [Nombre] se sustituye por el nombre del contacto al crear un envío.</p>`+Object.keys(TN).map(k=>`<h2>${TN[k]}</h2><textarea data-k="${k}" rows="${k==="seg"||k.startsWith("ig")?5:10}">${E(cfg.tpl&&cfg.tpl[k]||DT[k])}</textarea><div class="ls"><button class="b" data-a="ct" data-k="${k}">Copiar</button><button class="t" data-a="rt" data-k="${k}">Restaurar</button></div>`).join("")}
function datos(){return `<h2>Datos</h2><p>${C.length} contactos guardados${loc?" solo en este dispositivo (no se pudo conectar con tu cuenta)":" en tu base de datos de Cloudflare, accesibles desde cualquier dispositivo"}.</p><div class="ls"><button class="b" data-a="ej">Exportar JSON</button><button class="b" data-a="ec">Exportar CSV</button></div><h2>Importar</h2><button class="b" data-a="im">Importar JSON</button><input id="fi" type="file" accept=".json" hidden>`}
function draw(){document.querySelectorAll("#nav .t").forEach(b=>b.classList.toggle("on",b.dataset.v===view));$("#v").innerHTML=({hoy,contactos,plantillas,datos})[view]();if(view==="contactos")fill()}
function render(){if(view==="contactos"&&$("#lst"))fill();else if(!(view==="plantillas"&&document.activeElement&&document.activeElement.tagName==="TEXTAREA"))draw()}
function tk(c,via){if(M(c).length)return"seg";const p=via==="Email"?"email":"ig";if(c.tipo==="Artista")return p+"A"+(c.sub==="Grupo"?"g":"s");return p+(c.tipo==="Manager"?"M":"P")}
function tplFor(c,via){const k=tk(c,via);return (cfg.tpl[k]||DT[k]).replace(/\[Nombre\]/g,(c.persona||c.nombre||"").split(" ")[0])}
function side(c){
 $("#lk").innerHTML=links(c,1);
 const mg=C.find(x=>x.id===c.manId);
 $("#mg").innerHTML=(mg?`<a class="ln" href="#" data-a="o" data-id="${mg.id}">Ficha de ${E(mg.nombre)}</a>`:"")+(c.tipo==="Manager"?"<small>Representa a</small> "+C.filter(x=>x.manId===c.id).map(x=>`<a class="ln" href="#" data-a="o" data-id="${x.id}">${E(x.nombre)}</a>`).join(" "):"");
 $("#dl").innerHTML=C.filter(x=>x.id!==c.id).map(x=>`<option value="${E(x.nombre)}">`).join("");
 $("#ms").innerHTML=M(c).map((m,i)=>`<details class="m"><summary>${D(m.d)} · ${E(m.v)}</summary><pre>${E(m.t)}</pre><label>Fecha del envío</label><input type="date" data-md="${i}" value="${E(m.d)}"><button class="del" style="margin:0 0 6px" data-a="um" data-i="${i}">Deshacer este envío</button></details>`).reverse().join("")||"<small>Aún sin envíos.</small>"}
function sheet(id){
 const c=C.find(x=>x.id===id);if(!c)return;open=id;const y=$("#shc").scrollTop,cm=c.motivos||[];
 const inp=(f,p)=>`<input data-f="${f}" placeholder="${p}" value="${E(c[f])}">`;
 $("#shc").innerHTML=`<div class="top"><button class="t" data-a="x">Cerrar</button></div>
 <input class="big" data-f="nombre" placeholder="Empresa o artista" value="${E(c.nombre)}">${inp("persona","Persona de contacto")}
 <div class="seg">${tipos().map(t=>`<button class="t ${c.tipo===t?"on":""}" data-a="tp" data-t="${E(t)}">${E(t)}</button>`).join("")}<input id="nt" placeholder="+ Otro tipo (Enter)" style="width:150px"></div>${c.tipo==="Artista"?`<div class="seg">${["Solitario","Grupo"].map(x=>`<button class="t ${(c.sub||"Solitario")===x?"on":""}" data-a="sub" data-s="${x}">${x}</button>`).join("")}</div>`:""}
 <label>Estado</label><select data-f="estado">${ES.map(s=>`<option ${s===(c.estado||"Pendiente")?"selected":""}>${s}</option>`).join("")}</select>
 <label>Le contacto por</label><div class="seg">${MO.concat(cfg.mo||[]).map(m=>`<button class="t ${cm.includes(m)?"on":""}" data-a="mo" data-m="${E(m)}">${E(m)}</button>`).join("")}<input id="nm" placeholder="+ Otro (Enter)" style="width:150px"></div>
 <label>Contacto</label>${inp("email","Email (varios, separados por coma)")}${inp("ig","Instagram (@usuario o enlace)")}${inp("tel","Teléfono (varios, separados por coma)")}${inp("web","Web")}<label>Dirección de oficinas (una por línea)</label><textarea data-f="dir" rows="2">${E(c.dir)}</textarea><div id="lk" class="ls"></div>
 ${c.tipo==="Productora"||c.tipo==="Manager"?"":`<label>Gestionado por (management)</label><input data-f="man" list="dl" placeholder="Nombre del manager" value="${E(c.man)}">`}<div id="mg" class="ls"></div>
 <label>Notas</label><textarea data-f="notas" rows="3">${E(c.notas)}</textarea>
 <label>Envíos</label><div id="ms"></div><div id="cmp"></div><div class="seg"><button class="b" data-a="cmp">Nuevo envío</button></div><div id="rs" ${["Respondió","Reunión"].includes(c.estado)?"":"hidden"}><label>Respuesta (pega aquí lo que te han contestado)</label><textarea data-f="resp" rows="5">${E(c.resp)}</textarea></div>
 <div class="seg"><button class="b" data-a="save" style="width:100%">Guardar</button></div><button class="del" data-a="del">Eliminar contacto</button>`;
 side(c);$("#sh").hidden=false;$("#shc").scrollTop=y}
function cmp(c,via){via=via||({Productora:"Email",Artista:"Instagram"})[c.tipo]||(c.email?"Email":c.ig?"Instagram":"Teléfono");cv=via;
 $("#cmp").innerHTML=`<div class="seg">${VIAS.map(v=>`<button class="t ${v===via?"on":""}" data-a="via" data-v="${v}">${v}</button>`).join("")}</div><textarea id="tx" rows="9">${E(tplFor(c,via))}</textarea><label>Fecha del envío</label><input type="date" id="fd" value="${today()}"><div class="ls"><button class="b" data-a="cp">Copiar</button><a class="ln" id="op" target="_blank" rel="noopener">Abrir</a><button class="b" data-a="sent">Marcar como enviado</button></div>`;ol(c)}
function ol(c){const t=$("#tx").value;$("#op").href=(cv==="Instagram"?ig(c.ig):cv==="Email"&&sp(c.email).length?"mailto:"+sp(c.email)[0]+"?"+sb(t):cv==="Teléfono"?wa(sp(c.tel)[0]):"")||"#"}
async function copy(t){try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}toast("Copiado")}
function csv(){const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';return ["nombre","persona","tipo","estado","motivos","email","instagram","telefono","web","direccion","gestionado_por","notas","envios","ultimo_envio"].join(",")+"\n"+C.map(c=>[c.nombre,c.persona,c.tipo,c.estado,(c.motivos||[]).join("; "),c.email,c.ig,c.tel,c.web,(c.dir||"").replace(/\n/g," | "),c.man,c.notas,M(c).length,M(c).length?M(c).at(-1).d:""].map(q).join(",")).join("\n")}
async function dl(name,data){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data]));a.download=name;document.body.appendChild(a);a.click();a.remove()}
document.addEventListener("click",e=>{
 if(e.target.closest("a[target]"))return;
 const b=e.target.closest("[data-a]");if(!b)return;if(b.tagName==="A")e.preventDefault();
 const a=b.dataset.a,c=cur(),d=b.dataset;
 if(a==="nav"){view=d.v;draw()}
 else if(a==="o")sheet(d.id)
 else if(a==="x"){flush();open=null;$("#sh").hidden=true;render()}
 else if(a==="save"){clearTimeout(tm);Promise.resolve(save(c)).then(ok=>{if(ok!==false){toast("Guardado");open=null;$("#sh").hidden=true;render()}})}
 else if(a==="f"){flt=d.t;draw()}
 else if(a==="new"){const n={id:"c_"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),nombre:"",persona:"",tipo:flt||"Productora",estado:"Pendiente",motivos:[],email:"",ig:"",tel:"",web:"",dir:"",man:"",manId:"",notas:"",msgs:[]};C.push(n);save(n);sheet(n.id);render();$("#shc [data-f=nombre]").focus()}
 else if(a==="tp"){c.tipo=d.t;save(c);sheet(c.id)}
 else if(a==="mo"){const s=new Set(c.motivos||[]);s.has(d.m)?s.delete(d.m):s.add(d.m);c.motivos=[...s];b.classList.toggle("on");save(c)}
 else if(a==="fh"){fh=fh===d.t?"":d.t;draw()}
 else if(a==="sub"){c.sub=d.s;save(c);sheet(c.id)}
 else if(a==="um"){c.msgs=M(c).filter((_,i)=>i!==+d.i);if(!c.msgs.length&&c.estado==="Contactado")c.estado="Pendiente";save(c);sheet(c.id)}
 else if(a==="undo"){undo&&undo();$("#toast").hidden=true}
 else if(a==="cmp")cmp(c)
 else if(a==="via")cmp(c,d.v)
 else if(a==="cp")copy($("#tx").value)
 else if(a==="sent"){const id=c.id,pm=M(c),pe=c.estado;c.msgs=pm.concat({d:$("#fd").value||today(),v:cv,t:$("#tx").value});if((c.estado||"Pendiente")==="Pendiente")c.estado="Contactado";save(c);sheet(id);toast("Envío registrado",()=>{const k=C.find(x=>x.id===id);k.msgs=pm;k.estado=pe;save(k);if(open===id)sheet(id)})}
 else if(a==="del"){if(!b.dataset.s){b.dataset.s=1;b.textContent="Pulsa otra vez para eliminar"}else{store.del(c.id);C=C.filter(x=>x.id!==c.id);open=null;$("#sh").hidden=true;render()}}
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
 else if(t.dataset.f){const c=cur(),pv=c[t.dataset.f];c[t.dataset.f]=t.value;if(t.dataset.f==="estado"){const id=c.id;$("#rs").hidden=!["Respondió","Reunión"].includes(t.value);toast("Estado: "+t.value,()=>{const k=C.find(x=>x.id===id);k.estado=pv||"Pendiente";save(k);if(open===id)sheet(id)})}if(t.dataset.f==="man"){const m=C.find(x=>x.id!==c.id&&x.nombre===t.value);c.manId=m?m.id:""}clearTimeout(tm);tm=setTimeout(()=>{save(c);side(c);render()},400)}
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
 store={set:(id,o)=>api("PUT","doc/"+encodeURIComponent(id),o).then(()=>true).catch(()=>{toast("No se pudo guardar");return false}),del:id=>api("DELETE","doc/"+encodeURIComponent(id)).catch(()=>{})};
 render()}
function go(){if(!started){started=1;draw();init()}}
go();

document.addEventListener("change",async e=>{if(e.target.id!=="fi")return;const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text()),n=j.contactos||[];C=C.filter(x=>!n.some(y=>y.id===x.id)).concat(n);n.forEach(save);if(j.config){cfg=Object.assign(cfg,j.config);store.set("cfg",cfg)}render();toast("Importados "+n.length+" contactos")}catch(x){toast("Archivo no válido")}e.target.value=""});
