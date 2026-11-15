export async function onRequest({request,env,params}){
 const p=(params.path||[]).join("/"),m=request.method,db=env.DB;
 const j=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json"}});
 if(p==="all"&&m==="GET"){
  const {results}=await db.prepare("SELECT id,data FROM docs").all();
  const out={contacts:[],cfg:{}};
  for(const r of results){const o=JSON.parse(r.data);if(r.id==="cfg")out.cfg=o;else out.contacts.push({...o,id:r.id})}
  return j(out)}
 if(p.startsWith("doc/")){
  const id=decodeURIComponent(p.slice(4));
  if(m==="PUT"){const b=await request.text();JSON.parse(b);
   await db.prepare("INSERT INTO docs(id,data,updated) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET data=?2,updated=?3").bind(id,b,Date.now()).run();return j({ok:1})}
  if(m==="DELETE"){await db.prepare("DELETE FROM docs WHERE id=?1").bind(id).run();return j({ok:1})}}
 return j({error:"not found"},404)}
