// Une public/obs/nuevas.json (14 enfermedades nuevas) con public/obs/acervo.json.
// - pts.d pasa de letras (e,g,f,m) a claves de enfermedad (eb, gaucher, ...)
// - puntos nuevos: px/py con la proyección del mapa y estado (s) por punto en polígono
// - hospitales que ya existían se fusionan (se suman enfermedades y descripción)
const fs=require('fs'),path=require('path');
const P=path.join(__dirname,'../public/obs/');
const A=JSON.parse(fs.readFileSync(P+'acervo.json','utf8')),N=JSON.parse(fs.readFileSync(P+'nuevas.json','utf8'));
if(A._merged){console.log('ya estaba unido');process.exit(0);}
const K2D={e:'eb',g:'gaucher',f:'fabry',m:'mps'};
A.atlas.pts.forEach(p=>{p.d=p.d.map(k=>K2D[k]||k);});
const M=A.atlas.mx,[x0,x1,y0,y1]=M.b;
const proj=(lat,lon)=>[+((lon-x0)/(x1-x0)*M.w).toFixed(1),+((y1-lat)/(y1-y0)*M.h).toFixed(1)];
const polys=M.p.map(o=>o.d.split('M').filter(Boolean).map(r=>r.replace(/Z/gi,'').split('L').map(s=>s.split(',').map(Number))));
function inPoly(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function stateOf(x,y){for(let i=0;i<polys.length;i++)if(polys[i].some(r=>inPoly(x,y,r)))return i;
  let best=-1,bd=1e9;polys.forEach((rs,i)=>rs.forEach(r=>r.forEach(([a,b])=>{const d=(a-x)**2+(b-y)**2;if(d<bd){bd=d;best=i;}})));return best;}
const byName=n=>A.atlas.pts.findIndex(p=>p.n.startsWith(n));
const SAME=[[/^Instituto Nacional de Pediatr/,'Instituto Nacional de Pediatría – Clínica'],[/^Hospital Infantil de México/,'Hospital Infantil de México'],
 [/Siglo XXI/,'Hospital de Pediatría, CMN Siglo XXI'],[/Gaudencio Gonz/,'Hospital General, CMN La Raza'],[/20 de Noviembre/,"CMN '20 de Noviembre'"],
 [/Salvador Zubir/,'Instituto Nacional de Ciencias Médicas'],[/^Hospital General de México/,'Hospital General de México'],[/Central Sur/,'Hospital Central Sur'],
 [/Eleuterio Gonz/,"Hospital Universitario 'Dr. José Eleuterio"],[/Especialidades No\. 25/,'Hospital de Especialidades No. 25'],[/^Centenario Hospital Miguel Hidalgo/,'Centenario Hospital'],
 [/Alta Especialidad del Baj/,'Hospital Regional de Alta Especialidad del Bajío'],[/^Hospital de Especialidades Pediátrico de León/,'Hospital de Especialidades Pediátrico de León'],
 [/Occidente \(IMSS\) y Centro de Investigaci/,'Centro de Investigación Biomédica de Occidente'],[/^Grupo Fabry/,'Grupo Fabry']];
let merged=0,added=0;
for(const q of N.puntos){
  const m=SAME.find(([re])=>re.test(q.n));const i=m?byName(m[1]):-1;
  if(i>=0){const p=A.atlas.pts[i];q.d.forEach(k=>{if(!p.d.includes(k))p.d.push(k);});(p.more=p.more||[]).push({x:q.x,f:q.f,u:q.u});merged++;continue;}
  const [px,py]=proj(q.lat,q.lon);A.atlas.pts.push({l:q.l,n:q.n,c:q.c,d:q.d,x:q.x,f:q.f,u:q.u,s:stateOf(px,py),px,py});added++;}
A.corpus=A.corpus.concat(N.corpus);
A.enfermedades=N.enfermedades;A.tamiz.inst=N.tamiz_instituciones;A.tamiz.estados=N.tamiz_estados;A.laboratorios=N.laboratorios;
A._merged=true;
fs.writeFileSync(P+'acervo.json',JSON.stringify(A));
console.log('fusionados',merged,'nuevos',added,'puntos',A.atlas.pts.length,'fichas',A.corpus.length);
