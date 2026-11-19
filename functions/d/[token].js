// Pàgina pública d'un dossier compartit: /d/<token>
export async function onRequest({ params }) {
  const t = String(params.token || "").replace(/[^a-z0-9]/g, "");
  return new Response(`<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dossier</title>
<style>html,body{margin:0;background:#f2f2f2;color:#000;font-family:Helvetica,Arial,sans-serif}#b{max-width:1400px;margin:0 auto;padding:24px 16px 80px;display:flex;flex-direction:column;gap:20px}
.bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,.95);border-bottom:1px solid #e5e5ea}#b .dkw{box-shadow:0 2px 16px rgba(0,0,0,.08)}.bar b{font-size:15px;font-weight:400;letter-spacing:.5px}
button{font:inherit;font-size:14px;border:1px solid #d1d1d6;background:#fff;color:#000;border-radius:10px;padding:9px 14px;cursor:pointer}form{max-width:280px;margin:30vh auto;display:flex;flex-direction:column;gap:10px;text-align:center}input{font:inherit;padding:11px;border-radius:10px;border:1px solid #d1d1d6;background:#fff;color:#000;text-align:center}form p{color:#d70015;margin:0;font-size:14px}form small{color:#6e6e73}
#pres{position:fixed;inset:0;background:#000;display:none;align-items:center;justify-content:center;z-index:10}#pres.on{display:flex}#pres small{position:fixed;bottom:16px;left:0;right:0;text-align:center;color:#888}
@media print{.bar,#pres{display:none!important}html,body{background:none}#b{padding:0;gap:0;max-width:none}#b>div{break-after:page}}</style></head>
<body><div id="b">Carregant…</div><div id="pres"></div><script src="/deck.js"></script><script>
const T="${t}";let pw="",D=null,i=0;
async function carrega(){const r=await fetch("/api/public/deck/"+T+"?pw="+encodeURIComponent(pw));if(r.status===401){document.getElementById("b").innerHTML='<form onsubmit="pw=this.p.value;carrega();return false"><small>pablo anarte</small><b>Aquest dossier té contrasenya</b><input name="p" type="password" autofocus>'+(pw?'<p>Contrasenya incorrecta</p>':'')+'<button>Veure</button></form>';return}if(!r.ok){document.getElementById("b").textContent="Aquest enllaç no existeix o ja no està actiu.";return}D=await r.json();document.title=D.titulo||"Dossier";
const ims=D.slides.flatMap(s=>[s.img,...(s.imgs||[]),...(s.items||[]).map(x=>x.img)]).filter(Boolean);D._imgs=ims;if(D.slides.some(s=>s.tipus==="paleta"&&s.auto))D._pal=await DK.paleta(ims.map(img));pinta()}
const img=id=>"/api/public/arxiu/"+T+"/"+id+"?pw="+encodeURIComponent(pw);
function pinta(){const b=document.getElementById("b"),S=D.slides.filter(s=>!s.amaga),[w,h]=DK.mida(D),am=Math.min(b.clientWidth-32,1400);
document.body.insertAdjacentHTML("afterbegin",'<div class="bar"><b>'+DK.E(D.titulo||"")+'</b><span><button onclick="pres(0)">Presentar</button> '+(D.baixar?'<button onclick="print()">Descarregar PDF</button>':'')+'</span></div>');
const st=document.createElement("style");st.textContent="@page{size:"+w+"px "+h+"px;margin:0}@media print{.dkw{width:"+w+"px!important;height:"+h+"px!important}.dkw>div{transform:none!important}}";document.head.appendChild(st);
b.innerHTML=S.map((s,k)=>'<div onclick="pres('+k+')" style="cursor:zoom-in">'+DK.escalada(D,s,am,{img,n:k+1})+'</div>').join("");DK.ajusta(b)}
function pres(k){i=k;const p=document.getElementById("pres"),S=D.slides.filter(s=>!s.amaga),[w,h]=DK.mida(D),am=Math.min(innerWidth,innerHeight*w/h);p.innerHTML=DK.escalada(D,S[i],am,{img,n:i+1})+'<small>'+(i+1)+' / '+S.length+' · fletxes per passar · Esc per sortir</small>';p.classList.add("on");DK.ajusta(p)}
document.addEventListener("keydown",e=>{const p=document.getElementById("pres");if(!p.classList.contains("on"))return;const n=D.slides.filter(s=>!s.amaga).length;if(e.key==="Escape")p.classList.remove("on");if((e.key==="ArrowRight"||e.key===" ")&&i<n-1)pres(i+1);if(e.key==="ArrowLeft"&&i>0)pres(i-1)});
document.getElementById("pres").onclick=e=>{const n=D.slides.filter(s=>!s.amaga).length;if(e.clientX>innerWidth/2&&i<n-1)pres(i+1);else if(e.clientX<=innerWidth/2&&i>0)pres(i-1);else document.getElementById("pres").classList.remove("on")};
carrega();</script></body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}
