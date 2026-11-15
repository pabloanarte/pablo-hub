// Lista de secciones del hub. Para añadir una: una línea aquí + <section id="s-ID"> en index.html + sections/ID.js
const SECTIONS=[
 {id:"contactos",label:"Contactos",src:"sections/contactos.js"}
];
const nav=document.getElementById("hubnav");
function show(id){
 SECTIONS.forEach(s=>{document.getElementById("s-"+s.id).hidden=s.id!==id});
 nav.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.id===id));
 const s=SECTIONS.find(x=>x.id===id);
 if(!s.loaded){s.loaded=1;const e=document.createElement("script");e.src=s.src;document.body.appendChild(e)}
}
if(SECTIONS.length>1){
 nav.hidden=false;
 nav.innerHTML=SECTIONS.map(s=>`<button class="t" data-id="${s.id}">${s.label}</button>`).join("");
 nav.onclick=e=>{const b=e.target.closest("button");if(b)show(b.dataset.id)};
}
show(SECTIONS[0].id);
