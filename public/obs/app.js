/* Observatorio Latinoamericano de Enfermedades Poco Frecuentes · El Acervo (demo) */
(function(){
'use strict';
var PD=null;
var view=document.getElementById('view');

/* ---------- utilidades ---------- */
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function h(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}

var DIS={eb:'piel de mariposa (epidermólisis bullosa)',gaucher:'enfermedad de Gaucher',fabry:'enfermedad de Fabry',mps:'síndrome de Hunter (mucopolisacaridosis tipo II)'};
var DSHORT={eb:'Piel de mariposa',gaucher:'Gaucher',fabry:'Fabry',mps:'Hunter (MPS II)',general:'General'};
var K2D={e:'eb',g:'gaucher',f:'fabry',m:'mps'},D2K={eb:'e',gaucher:'g',fabry:'f',mps:'m'};
var WEBER='Revista Enfermedades Raras (Fundación Weber), vol. 10, núm. 2, sep. 2025, p. 91';
function seg(cur,all){return '<div class="seg" role="tablist">'+(all?'<button data-d="all"'+(cur==='all'?' class="on"':'')+'>Todas</button>':'')+['eb','gaucher','fabry','mps'].map(function(d){return '<button data-d="'+d+'"'+(cur===d?' class="on"':'')+'>'+DSHORT[d]+'</button>';}).join('')+'</div>';}
function bindSeg(root,fn){$$('.seg button',root).forEach(function(b){b.onclick=function(){$$('button',b.parentNode).forEach(function(x){x.classList.toggle('on',x===b);});fn(b.dataset.d);};});}

/* ---------- inteligencia artificial (pasa por el servidor; la llave no llega al navegador) ---------- */
function errCopy(e){return e&&e.code===429?'Demasiadas consultas seguidas. Espera unos segundos.':'No pude consultar al asistente en este momento. Te muestro lo que dicen las fuentes.';}
async function aiStream(input,onText,signal){
  var r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},signal:signal,body:JSON.stringify({input:input})});
  if(!r.ok){var e=new Error('HTTP '+r.status);e.code=r.status;throw e;}
  var rd=r.body.getReader(),dec=new TextDecoder(),text='';
  for(;;){var c=await rd.read();if(c.done)break;text+=dec.decode(c.value,{stream:true});if(onText)onText(text);}
  return text;}
async function aiJson(input){
  var r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:input,json:true})});
  if(!r.ok){var e=new Error('HTTP '+r.status);e.code=r.status;throw e;}
  var o=await r.json();if(o.json==null)throw new Error('json');return o.json;}

/* ---------- búsqueda local en el Acervo ---------- */
var STOP={};
function fold(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
('a al algo algun alguna como con cual cuales cuando de del desde donde el ella en entre es esa ese eso esta este esto hay la las le les lo los mas me mi mis muy no nos o para pero por que se si sin sobre su sus te tiene tu un una uno y ya yo qué cómo cuál dónde cuándo hace hacer puede puedo debo tengo son ser está están estan fue han').split(' ').forEach(function(w){STOP[fold(w)]=1;});
function toks(s){return fold(s).split(/[^a-z0-9ñ]+/).filter(function(w){return w.length>2&&!STOP[w];}).map(function(w){return w.length>5?w.slice(0,5):w;});}
function Index(docs,textOf){
  var N=docs.length,df={},tf=[];
  docs.forEach(function(d,i){var m={};toks(textOf(d)).forEach(function(t){m[t]=(m[t]||0)+1;});tf[i]=m;Object.keys(m).forEach(function(t){df[t]=(df[t]||0)+1;});});
  return function(q,k,filter){var qt=toks(q),sc=[];
    docs.forEach(function(d,i){if(filter&&!filter(d))return;var s=0;qt.forEach(function(t){var f=tf[i][t];if(f)s+=Math.log(1+N/df[t])*f/(f+1.2);});sc.push([s,i]);});
    sc.sort(function(a,b){return b[0]-a[0];});return sc.slice(0,k).filter(function(x){return x[0]>0;}).map(function(x){return docs[x[1]];});};}
var C=[],CBY={},cSearch=null;
function fragBlock(fr){return fr.map(function(d){return '['+d.id+'] ('+d.fuente+' · '+d.tema+') '+d.texto;}).join('\n');}
function cite(text){var used=[];
  var html=esc(text).replace(/\[([a-z]\d{1,2}(?:\s*,\s*[a-z]\d{1,2})*)\]/gi,function(_,ids){
    return ids.split(/\s*,\s*/).map(function(id){id=id.toLowerCase();if(!CBY[id])return '';if(used.indexOf(id)<0)used.push(id);return '<sup class="c">'+(used.indexOf(id)+1)+'</sup>';}).join('');});
  html=html.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n{2,}/g,'<br><br>');
  return {html:html,used:used};}
function srcLinks(ids){return ids.length?'<div class="srcs">'+ids.map(function(id,i){var d=CBY[id];return '<a href="'+esc(d.url)+'" target="_blank" rel="noopener">'+(i+1)+' · '+esc(d.fuente)+' ↗</a>';}).join('')+'</div>':'';}

/* ---------- tarjetas de apoyo de Rumbo ---------- */
var RM={media:{},w:[]},RW={};
function wSrc(w){return w.src?'<a class="ws" href="'+esc(w.url||'#')+'" target="_blank" rel="noopener">Fuente: '+esc(w.src)+' ↗</a>':'';}
function wImg(w){return w.img&&RM.media[w.img]?'<img class="wi" alt="" loading="lazy" src="'+RM.media[w.img]+'">':'';}
function miniMap(k){var A=PD.atlas,pts=A.pts.filter(function(p){return p.px!=null&&p.d.indexOf(k)>=0;});
  var svg='<svg viewBox="60 0 940 640" class="wm" aria-hidden="true">'+A.mx.p.map(function(p,i){var has=pts.some(function(x){return x.s===i;});return '<path d="'+p.d+'" class="'+(has?'has':'')+'"/>';}).join('')+
    pts.map(function(p){return '<circle cx="'+p.px+'" cy="'+p.py+'" r="11" fill="'+LAY[p.l].c+'"/>';}).join('')+'</svg>';
  var list=pts.filter(function(p){return p.l!=='t';}).map(function(p){return '<li><a href="'+esc(p.u)+'" target="_blank" rel="noopener">'+esc(p.n.replace(/\s*[–(].*$/,''))+'</a><span>'+esc(p.c)+'</span></li>';});
  return svg+'<ul class="wl">'+list.slice(0,5).join('')+'</ul>';}
function inheritSvg(w){if(w.mode==='x')return inheritX(w);var c='#FF4FD8',p='#00C8D6',n='#5b7a8c';
  function kid(x,col,half,lab,pct){return '<g transform="translate('+x+',150)"><circle r="26" fill="'+(half?'url(#hf)':col)+'" stroke="#CFE6F2" stroke-width="2"/><text y="56" text-anchor="middle" class="t1">'+pct+'</text><text y="78" text-anchor="middle" class="t2">'+lab+'</text></g>';}
  return '<svg viewBox="0 0 400 250" class="wh"><defs><linearGradient id="hf"><stop offset="50%" stop-color="'+p+'"/><stop offset="50%" stop-color="'+n+'"/></linearGradient></defs>'+
   '<g transform="translate(140,40)"><circle r="24" fill="url(#hf)" stroke="#CFE6F2" stroke-width="2"/><text y="-32" text-anchor="middle" class="t2">Mamá portadora</text></g>'+
   '<g transform="translate(260,40)"><circle r="24" fill="url(#hf)" stroke="#CFE6F2" stroke-width="2"/><text y="-32" text-anchor="middle" class="t2">Papá portador</text></g>'+
   '<path d="M200 40V95M60 95H340M60 95V122M153 95V122M247 95V122M340 95V122" stroke="#93AEBF" stroke-width="2" fill="none"/>'+
   kid(60,c,false,'con la enfermedad','25%')+kid(153,0,true,'portador','25%')+kid(247,0,true,'portador','25%')+kid(340,n,false,'sin la variante','25%')+'</svg>';}
function inheritX(w){var c='#FF4FD8',p='#00C8D6',n='#5b7a8c',L=w.lab,P=w.par;
  function sym(x,y,male,fill){var shp=male?'<rect x="-24" y="-24" width="48" height="48" rx="6"':'<circle r="26"';return '<g transform="translate('+x+','+y+')">'+shp+' fill="'+fill+'" stroke="#CFE6F2" stroke-width="2"/></g>';}
  function lab(x,t){var w2=t.split('|');return '<text x="'+x+'" y="200" text-anchor="middle" class="t1">25%</text><text x="'+x+'" y="220" text-anchor="middle" class="t2">'+esc(w2[0])+'</text>'+(w2[1]?'<text x="'+x+'" y="236" text-anchor="middle" class="t2">'+esc(w2[1])+'</text>':'');}
  return '<svg viewBox="0 0 400 250" class="wh"><defs><linearGradient id="hx"><stop offset="50%" stop-color="'+p+'"/><stop offset="50%" stop-color="'+n+'"/></linearGradient></defs>'+
   sym(140,44,false,'url(#hx)')+sym(260,44,true,n)+'<text x="140" y="12" text-anchor="middle" class="t2">'+esc(P[0])+'</text><text x="260" y="12" text-anchor="middle" class="t2">'+esc(P[1])+'</text>'+
   '<path d="M164 44H236M200 44V95M55 95H345M55 95V122M150 95V122M250 95V122M345 95V122" stroke="#93AEBF" stroke-width="2" fill="none"/>'+
   sym(55,150,true,c)+sym(150,150,true,n)+sym(250,150,false,'url(#hx)')+sym(345,150,false,n)+lab(55,L[0])+lab(150,L[1])+lab(250,L[2])+lab(345,L[3])+
   '</svg><div class="wn">Cuadro: hombre · círculo: mujer</div>';}
function renderW(w){var b=h('div','wg'),L={video:'Video',steps:'Paso a paso',check:'Lista',stat:'Dato',contact:'Contacto',link:'Liga',map:'Mapa',inherit:'Diagrama',compare:'Comparativo',chips:'De un vistazo',pension:'Apoyo'};
  var H='<div class="wk">'+L[w.t]+'</div>';
  if(w.t==='video')H='<a class="wv" href="https://www.youtube.com/watch?v='+esc(w.yt)+'" target="_blank" rel="noopener"><span class="th"><img alt="" loading="lazy" src="'+esc(w.thumb)+'"></span><span class="vt"><span class="wk">Video</span><b>'+esc(w.title)+'</b><span>'+esc(w.canal)+' · '+esc(w.nota)+'</span><em>Ver en YouTube ↗</em></span></a>';
  else if(w.t==='steps')H+=wImg(w)+'<b class="wt">'+esc(w.title)+'</b><ol>'+w.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>'+wSrc(w);
  else if(w.t==='check')H+='<b class="wt">'+esc(w.title)+'</b><ul class="ck">'+w.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'+(w.nota?'<p class="wn">'+esc(w.nota)+'</p>':'')+wSrc(w);
  else if(w.t==='stat')H+='<div class="sb"><b>'+esc(w.big)+'</b><div class="bars"><i style="width:'+parseInt(w.big)+'%"></i><i class="c" style="width:'+parseInt(w.vs)+'%"></i></div></div><p>'+esc(w.label)+'</p><p class="wn">'+esc(w.sub)+'</p>'+wSrc(w);
  else if(w.t==='contact')H+='<b class="wt">'+esc(w.title)+'</b><p class="wn">'+esc(w.sub)+'</p><dl>'+w.rows.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd><span>'+esc(r[1])+'</span>'+(r[0]==='Teléfono'||r[0]==='Correo'?'<button type="button" class="cp" data-v="'+esc(r[1])+'">Copiar</button>':'')+'</dd>';}).join('')+'</dl><a class="wb" href="'+esc(w.url)+'" target="_blank" rel="noopener">Abrir sitio ↗</a>'+wSrc(w);
  else if(w.t==='link')H+='<a class="wlk" href="'+esc(w.url)+'" target="_blank" rel="noopener"><b>'+esc(w.title)+'</b><span class="wn">'+esc(w.sub)+'</span><em>'+esc(w.dom)+' ↗</em></a>';
  else if(w.t==='map')H+='<b class="wt">'+esc(w.title)+'</b>'+miniMap(w.k)+'<a class="wb" href="#/atlas?d='+K2D[w.k]+'">Ver en el Atlas</a>';
  else if(w.t==='inherit')H+='<b class="wt">'+esc(w.title)+'</b><p class="wn">'+esc(w.sub)+'</p>'+inheritSvg(w)+wSrc(w);
  else if(w.t==='compare')H+=wImg(w)+'<b class="wt">'+esc(w.title)+'</b><div class="cmp">'+w.cols.map(function(c){return '<div><b>'+esc(c[0])+'</b><span>'+esc(c[1])+'</span><span><i>Cómo:</i> '+esc(c[2])+'</span><span><i>Para:</i> '+esc(c[3])+'</span></div>';}).join('')+'</div><p class="wn">'+esc(w.nota)+'</p>'+wSrc(w);
  else if(w.t==='chips')H+='<b class="wt">'+esc(w.title)+'</b><div class="chp">'+w.items.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>'+wSrc(w);
  else if(w.t==='pension')H+=wImg(w)+'<b class="wt">'+esc(w.title)+'</b><div class="sb"><b>'+esc(w.big)+'</b><p>'+esc(w.label)+'</p></div><p class="wn">'+esc(w.edad)+'</p><ul class="ck">'+w.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul><p class="wn">'+esc(w.nota)+'</p>'+w.links.map(function(l){return '<a class="wb" href="'+esc(l[1])+'" target="_blank" rel="noopener">'+esc(l[0])+' ↗</a>';}).join(' ')+wSrc(w);
  b.innerHTML=H;
  $$('.cp',b).forEach(function(c){c.onclick=function(){try{navigator.clipboard.writeText(c.dataset.v).then(function(){c.textContent='Copiado';},function(){c.textContent='Selecciónalo';});}catch(e){c.textContent='Selecciónalo';}};});
  return b;}
function pickW(ids,dis,fr){var ok=function(w){return w&&(w.d===dis||w.d==='general');};
  var out=[];(ids||[]).forEach(function(id){var w=RW[id];if(ok(w)&&out.indexOf(w)<0)out.push(w);});
  if(!out.length){var sc=RM.w.filter(ok).map(function(w){var s=0;fr.slice(0,3).forEach(function(d,i){if((w.fr||[]).indexOf(d.id)>=0)s+=3-i;});return [s,w];}).filter(function(x){return x[0]>0;}).sort(function(a,b){return b[0]-a[0];});
    var nv=sc.filter(function(x){return x[1].t!=='video';})[0],v=sc.filter(function(x){return x[1].t==='video';})[0];if(nv)out.push(nv[1]);if(v)out.push(v[1]);}
  return out.slice(0,3);}

/* ================= vistas ================= */
var V={};

/* ---------- Inicio ---------- */
V.inicio=function(){
  var nFichas=C.length,nVid=RM.w.filter(function(w){return w.t==='video';}).length,nPts=PD.atlas.pts.length;
  view.innerHTML=
  '<section class="hero"><div class="bgimg" aria-hidden="true"></div><div class="wrap">'+
   '<h1 class="hero-t">Nadie debería navegar solo una enfermedad poco frecuente.</h1>'+
   '<p class="hero-s">Entre 8 y 10 millones de personas en México viven con una. El Observatorio reúne lo que se sabe, mide lo que falta y alumbra el camino para familias, médicos y quienes deciden.</p>'+
  '</div>'+
  '<a class="hero-cta" href="#/acervo"><i aria-hidden="true"></i>Explorar el Acervo</a>'+
  '<p class="hero-hint">Capítulo México · Observatorio Latinoamericano<br>de Enfermedades Poco Frecuentes</p>'+
  '</section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick m">Por qué un observatorio</span><h2>En Europa ya se mide cuánto tarda un diagnóstico. En México, todavía no.</h2>'+
   '<div class="stats">'+
    '<div class="stat"><b>4.7 años</b><span>tarda en promedio un diagnóstico en Europa</span></div>'+
    '<div class="stat"><b>10.4 años</b><span>esperan los adolescentes, el grupo con mayor retraso</span></div>'+
    '<div class="stat"><b>× 2.6</b><span>riesgo de retraso tras consultar a más de 10 especialistas</span></div>'+
    '<div class="stat"><b>× 2.1</b><span>si hay que salir de la propia región para ver a un especialista</span></div>'+
   '</div>'+
   '<p class="note" style="margin-top:16px">Fuente: '+WEBER+'. Para México se estiman entre 8 y 10 millones de personas con una enfermedad poco frecuente, sin censo nacional (<a href="'+esc(CBY.x2?CBY.x2.url:'#')+'" target="_blank" rel="noopener">Excélsior, feb. 2026</a>). Medir la cifra mexicana es la primera tarea del Observatorio.</p>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick">El Acervo</span><h2>¿Por dónde entras?</h2><p class="sub">Una sola base de conocimiento, cuatro puertas. Cada quien recibe la información a su medida y con la fuente a la vista.</p>'+
   '<div class="grid g4" style="margin-top:22px">'+
    '<a class="door" href="#/rumbo"><span class="who">Soy familia o paciente</span><h3>Rumbo</h3><p>Qué sigue después del diagnóstico: cuidados en casa, trámites, apoyos y a dónde acudir.</p><span class="go">Preguntar a Rumbo →</span></a>'+
    '<a class="door m" href="#/clara"><span class="who">Soy médico</span><h3>Clara</h3><p>Para el pediatra y el médico de primer contacto: pensar a tiempo en una enfermedad poco frecuente y saber a dónde referir.</p><span class="go">Analizar un caso →</span></a>'+
    '<a class="door t" href="#/asociaciones"><span class="who">Soy asociación de pacientes</span><h3>Asociaciones</h3><p>Acceso sin costo, directorio, materiales y herramientas para dar a conocer su causa.</p><span class="go">Ver el espacio →</span></a>'+
    '<a class="door y" href="#/atlas"><span class="who">Decido política pública</span><h3>Atlas</h3><p>El mapa de dónde hay atención en México y dónde no: hospitales, asociaciones y ensayos clínicos.</p><span class="go">Abrir el mapa →</span></a>'+
   '</div>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick y">Cómo está hecho</span><h2>Un observatorio que mide. Un acervo que acompaña.</h2>'+
   '<div class="arch"><div class="brandshot"><img src="/obs/img/brand/faro-3d.webp" alt="El faro del Observatorio: una torre con piel de cebra, el símbolo de las enfermedades poco frecuentes, coronada por un ojo con iris de colores y rodeada de rayos de luz en forma de manos" loading="lazy"></div>'+
    '<div class="card"><span class="pill y">El Observatorio</span><h3 style="margin-top:10px">Mide y da la cara</h3><p>Publica el Atlas y los informes, lleva los datos al Senado y firma los informes. Tiene consejo honorífico y presidencia médica.</p></div>'+
    '<div class="card"><span class="pill">El Acervo</span><h3 style="margin-top:10px">Reúne y responde</h3><p>Fichas, entrevistas, videos y asistentes que responden solo con información aprobada. Hoy contiene <b>'+nFichas+' fichas con fuente</b>, <b>'+nVid+' videos</b> y <b>'+nPts+' puntos de atención</b> sobre cuatro enfermedades.</p></div>'+
   '</div>'+
   '<p class="sub" style="margin-top:18px">Enfermedades en esta demostración: piel de mariposa (epidermólisis bullosa), Gaucher, Fabry y síndrome de Hunter (MPS II).</p>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick">Quién lo hace posible</span><h2>Laboratorios que patrocinan conocimiento, no producto</h2>'+
   '<p class="sub">Cada laboratorio patrocina el contenido de su área terapéutica y lo dice abiertamente. Las asociaciones de pacientes participan sin costo y validan lo que se publica.</p>'+
   '<div class="spons">'+[1,2,3,4,5].map(function(){return '<div class="slot">Espacio para laboratorio patrocinador</div>';}).join('')+'<div class="slot ong">Asociaciones de pacientes aliadas</div></div>'+
  '</div></section>';
};

/* ---------- Acervo ---------- */
V.acervo=function(q){
  var dis=q.d||'all',aud=q.p||'all',shown=12,ctl=null;
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<span class="kick">El Acervo</span><h1>Conocimiento vivo, con la fuente a la vista</h1>'+
   '<p class="lead">Fichas, videos y respuestas sobre enfermedades poco frecuentes. Pregunta con tus palabras: el Acervo responde solo con lo que está aquí y te dice de dónde sale cada dato.</p>'+
   '<form class="ask" id="ask"><input id="q" placeholder="Por ejemplo: ¿qué apoyos hay para una familia en México?" maxlength="300" aria-label="Pregunta al Acervo"><button class="btn" type="submit">Preguntar</button></form>'+
   '<div class="answer" id="ans"></div>'+
   '<div class="toolbar">'+seg(dis,true)+'<div class="seg" id="aud"><button data-p="all"'+(aud==='all'?' class="on"':'')+'>Todo</button><button data-p="familia"'+(aud==='familia'?' class="on"':'')+'>Para familias</button><button data-p="medico"'+(aud==='medico'?' class="on"':'')+'>Para médicos</button></div></div>'+
   '<div class="grid g3" id="fichas"></div><div class="more" id="more"></div>'+
  '</div></section>'+
  '<section class="blk"><div class="wrap"><span class="kick m">Videos</span><h2>Para entender y para acompañar</h2><p class="sub">Cápsulas de divulgación, testimonios y entrevistas. En la versión final, cada laboratorio aporta entrevistas con sus especialistas.</p><div class="grid g3" id="vids" style="margin-top:20px"></div></div></section>';
  var ans=$('#ans');
  function list(){
    var L=C.filter(function(d){return (dis==='all'||d.enfermedad===dis||d.enfermedad==='general')&&(aud==='all'||d.publico===aud||d.publico==='ambos');});
    $('#fichas').innerHTML=L.slice(0,shown).map(function(d){return '<article class="card ficha"><div class="meta"><span class="pill'+(d.enfermedad==='general'?' g':'')+'">'+DSHORT[d.enfermedad]+'</span><span class="pill '+(d.publico==='medico'?'m':d.publico==='familia'?'y':'g')+'">'+({medico:'Médicos',familia:'Familias',ambos:'Todos'})[d.publico]+'</span></div><h3>'+esc(d.tema)+'</h3><p>'+esc(d.texto)+'</p><a class="src" href="'+esc(d.url)+'" target="_blank" rel="noopener">Fuente: '+esc(d.fuente)+' ↗</a></article>';}).join('')||'<p class="note">Sin fichas para este filtro.</p>';
    $('#more').innerHTML=L.length>shown?'<button class="btn ghost" type="button">Ver más ('+(L.length-shown)+')</button>':'';
    var mb=$('#more button');if(mb)mb.onclick=function(){shown+=12;list();};
    var vids=RM.w.filter(function(w){return w.t==='video'&&(dis==='all'||w.d===dis||w.d==='general');});
    $('#vids').innerHTML=vids.map(function(w){return '<a class="vid" href="https://www.youtube.com/watch?v='+esc(w.yt)+'" target="_blank" rel="noopener"><span class="th"><img alt="" loading="lazy" src="'+esc(w.thumb)+'"><i></i></span><span class="vt"><b>'+esc(w.title)+'</b><span>'+esc(w.canal)+' · '+esc(w.nota)+'</span></span></a>';}).join('');}
  bindSeg($('.toolbar'),function(d){if(!d)return;dis=d;shown=12;list();});
  $$('#aud button').forEach(function(b){b.onclick=function(){$$('#aud button').forEach(function(x){x.classList.toggle('on',x===b);});aud=b.dataset.p;shown=12;list();};});
  list();
  $('#ask').onsubmit=async function(e){e.preventDefault();var qq=$('#q').value.trim();if(!qq)return;
    if(ctl)ctl.abort();ctl=new AbortController();
    var fr=cSearch(qq+' '+qq,7,function(d){return dis==='all'||d.enfermedad===dis||d.enfermedad==='general';});
    ans.innerHTML='<div class="box"><span class="wait">Buscando en el Acervo</span></div>';var box=ans.firstChild;
    if(!fr.length){box.innerHTML='No encontré información sobre eso en el Acervo. En esta demostración cubre cuatro enfermedades: piel de mariposa, Gaucher, Fabry y síndrome de Hunter, además de apoyos y trámites en México.';return;}
    var prompt='Eres el Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes (Capítulo México). Responde en español de México, claro y cálido, en un máximo de 110 palabras. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento, por ejemplo [g4]. Si la respuesta no está en los fragmentos, dilo con honestidad. No indiques dosis ni hagas diagnósticos. Di "enfermedades poco frecuentes" en lugar de "enfermedades raras". Sin títulos.\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nPREGUNTA: '+qq;
    try{var t=await aiStream(prompt,function(t){box.innerHTML=cite(t).html;},ctl.signal);var c=cite(t);box.innerHTML=c.html+srcLinks(c.used);}
    catch(err){if(err.name==='AbortError')return;box.innerHTML='<p class="note">'+esc(errCopy(err))+'</p><br><b>'+esc(fr[0].tema)+'.</b> '+esc(fr[0].texto)+'<sup class="c">1</sup>'+srcLinks([fr[0].id]);}};
  if(q.q){$('#q').value=q.q;$('#ask').requestSubmit();}
};

/* ---------- Rumbo ---------- */
V.rumbo=function(q){
  var dis=DIS[q.d]?q.d:'eb',turns=[],busy=false,ctl=null;
  var SUG={eb:['¿Cómo cargo y visto a mi bebé?','¿Cómo hago una curación?','¿Dónde la atienden en México?','¿Hay algún apoyo económico?','¿Existe algún tratamiento nuevo?','¿Con quién puedo hablar?'],
    gaucher:['¿Qué es y cómo se hereda?','¿Cómo se confirma el diagnóstico?','¿Qué tratamientos hay?','¿Dónde la atienden en México?','¿Puedo pedir la pensión por discapacidad?','¿Hay videos para entenderla?'],
    fabry:['¿Por qué me arden las manos y los pies?','¿Cómo se hereda?','¿Las mujeres también la tienen?','¿Cómo se confirma?','¿Qué tratamientos hay?','¿Hay una asociación de pacientes?'],
    mps:['¿Qué es el síndrome de Hunter?','¿Cómo se hereda?','¿Cuáles son los primeros signos?','¿Qué tratamiento hay?','¿Qué cuidados necesita en casa y en la escuela?','¿Con quién puedo hablar?']};
  var HOLA={eb:'Hola, soy Rumbo. Te acompaño con la piel de mariposa: cuidados en casa, dónde atenderse en México y qué apoyos existen. ¿En qué te ayudo?',
    gaucher:'Hola, soy Rumbo. Te acompaño con la enfermedad de Gaucher: qué es, cómo se confirma, tratamientos y apoyos en México. ¿En qué te ayudo?',
    fabry:'Hola, soy Rumbo. Te acompaño con la enfermedad de Fabry: síntomas, cómo se hereda, cómo se confirma, tratamientos y dónde atenderse. ¿En qué te ayudo?',
    mps:'Hola, soy Rumbo. Te acompaño con el síndrome de Hunter (MPS II): primeros signos, cuidados en casa y escuela, tratamiento y dónde atenderse. ¿En qué te ayudo?'};
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<span class="kick">Para familias y pacientes</span><h1>Rumbo</h1><p class="lead">Qué sigue después del diagnóstico, en el lenguaje de la familia. Rumbo responde solo con información aprobada y cita la fuente de cada dato.</p>'+
   '<div class="tool"><div class="panel">'+seg(dis)+'<div class="log" id="log" aria-live="polite"></div><div class="sug" id="sug"></div>'+
    '<form class="row" id="f"><input id="inp" placeholder="Escribe tu pregunta…" maxlength="300" aria-label="Tu pregunta"><button class="btn" type="submit">Enviar</button></form>'+
    '<div class="note">Orientación general; no sustituye la consulta médica.</div></div>'+
   '<aside class="card side"><h3>Lo que hace Rumbo</h3><ul><li>Explica la enfermedad con palabras sencillas y diagramas.</li><li>Da pasos concretos para el cuidado en casa.</li><li>Orienta en trámites: certificado y pensión por discapacidad.</li><li>Conecta con hospitales y asociaciones de pacientes.</li></ul>'+
   '<div class="demo-flag">En la versión final, Rumbo también funciona por WhatsApp y su contenido lo validan las asociaciones de pacientes de cada enfermedad.</div></aside></div>'+
  '</div></section>';
  var log=$('#log'),sug=$('#sug'),inp=$('#inp'),form=$('#f');
  function hello(){log.innerHTML='';turns=[];log.appendChild(h('div','bb a',esc(HOLA[dis])));
    sug.innerHTML=SUG[dis].map(function(s){return '<button type="button">'+esc(s)+'</button>';}).join('');
    $$('button',sug).forEach(function(b){b.onclick=function(){send(b.textContent);};});}
  bindSeg(view,function(d){if(ctl)ctl.abort();busy=false;dis=d;hello();});
  form.onsubmit=function(e){e.preventDefault();var t=inp.value.trim();if(t&&!busy){inp.value='';send(t);}};
  function clean(t){return t.split(/\n?\s*WIDGETS?\s*:/i)[0].trim();}
  async function send(qq){if(busy)return;busy=true;form.querySelector('button').disabled=true;
    log.appendChild(h('div','bb u',esc(qq)));var a=h('div','bb a','<span class="wait">Buscando en las fuentes</span>');log.appendChild(a);log.scrollTop=1e6;
    var ctx=turns.slice(-2).map(function(t){return t.content;}).join(' ');
    var fr=cSearch(qq+' '+qq+' '+ctx,6,function(d){return (d.enfermedad===dis||d.enfermedad==='general')&&d.publico!=='medico';});
    if(fr.length<3)fr=fr.concat(cSearch(qq,6,function(d){return d.enfermedad===dis||d.enfermedad==='general';}).filter(function(d){return fr.indexOf(d)<0;})).slice(0,6);
    var cat=RM.w.filter(function(w){return w.d===dis||w.d==='general';}).map(function(w){return w.id+': '+w.desc;}).join('\n');
    var text='',ids=[],done=false;
    if(fr.length){
      var hist=turns.slice(-4).map(function(t){return (t.role==='user'?'Familia: ':'Rumbo: ')+t.content;}).join('\n');
      var prompt='Eres Rumbo, el acompañante para familias del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. La familia vive con '+DIS[dis]+'. Responde en español de México, con calidez y en lenguaje sencillo, en un máximo de 80 palabras, porque la respuesta va acompañada de tarjetas visuales. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento de donde sale, por ejemplo [e7]. Si la respuesta no está en los fragmentos, dilo con honestidad y sugiere hablar con su equipo médico o con la asociación de pacientes. No indiques dosis ni hagas diagnósticos. Di "enfermedad poco frecuente", nunca "rara". Sin títulos ni listas.\n\nAl final, en una línea aparte, escribe WIDGETS: seguido de 1 a 3 identificadores del CATÁLOGO que mejor complementan la respuesta (de preferencia uno visual y, si hay uno pertinente, un video), separados por comas.\n\nCATÁLOGO:\n'+cat+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+(hist?'\n\nCONVERSACIÓN PREVIA:\n'+hist:'')+'\n\nPREGUNTA DE LA FAMILIA: '+qq;
      ctl=new AbortController();
      try{var r=await aiStream(prompt,function(t){a.innerHTML=cite(clean(t)).html;log.scrollTop=1e6;},ctl.signal);
        var m=r.match(/WIDGETS?\s*:\s*(.+)/i);ids=m?m[1].split(/[\s,]+/).map(function(s){return s.replace(/[^\w-]/g,'');}).filter(Boolean):[];
        text=clean(r);done=true;}
      catch(e){if(e.name==='AbortError')return;a.innerHTML='<span class="note">'+esc(errCopy(e))+'</span>';}
    }
    if(done){var c=cite(text);a.innerHTML=c.html+srcLinks(c.used);}
    else if(!fr.length)a.innerHTML='No encontré información sobre eso en las fuentes de Rumbo. Te sugiero preguntarlo a tu equipo médico o a la asociación de pacientes.';
    else{a.innerHTML+='<br><br><b>'+esc(fr[0].tema)+'.</b> '+esc(fr[0].texto)+'<sup class="c">1</sup>'+srcLinks([fr[0].id]);text=fr[0].texto;}
    var ws=pickW(ids,dis,fr);
    if(ws.length){var g=h('div','wgs');ws.forEach(function(w){g.appendChild(renderW(w));});log.appendChild(g);}
    turns.push({role:'user',content:qq},{role:'assistant',content:text.replace(/\[[a-z]\d+\]/gi,'')});
    a.scrollIntoView({block:'nearest'});busy=false;form.querySelector('button').disabled=false;}
  hello();
};

/* ---------- Clara ---------- */
var voice={a:null,stop:function(){if(this.a){this.a.pause();this.a=null;}try{speechSynthesis.cancel();}catch(e){}},
  speak:async function(text,btn){this.stop();btn.textContent='Detener';var self=this,done=function(){btn.textContent='Escuchar a Clara';};
    try{var r=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text})});
      if(r.ok){var u=URL.createObjectURL(await r.blob());self.a=new Audio(u);self.a.onended=done;await self.a.play();return;}}catch(e){}
    try{var s=new SpeechSynthesisUtterance(text);s.lang='es-MX';var vs=speechSynthesis.getVoices().filter(function(v){return /^es/i.test(v.lang);});
      var best=vs.filter(function(v){return /MX|419|US/.test(v.lang);})[0]||vs[0];if(best)s.voice=best;s.rate=1.02;s.onend=done;speechSynthesis.speak(s);}catch(e){done();}}};
V.clara=function(q){
  var dis=DIS[q.d]?q.d:'gaucher',busy=false,say='';
  var EX={gaucher:{edad:15,sexo:'F',esp:4,sint:'Fatiga desde hace dos años, dolor óseo en piernas, bazo aumentado a la exploración, moretones fáciles. Biometría con plaquetas bajas y anemia leve.'},
    fabry:{edad:19,sexo:'M',esp:5,sint:'Ardor en manos y pies desde los 9 años que empeora con el ejercicio y la fiebre; casi no suda e intolera el calor; dolor abdominal y diarrea frecuentes; pequeñas manchas rojo-violáceas alrededor del ombligo. Examen general de orina con proteína.'},
    mps:{edad:3,sexo:'M',esp:4,sint:'Infecciones de oído y respiratorias de repetición desde el primer año, ronquido y pausas al dormir, hernia umbilical operada, rasgos faciales toscos, lengua grande, hígado y bazo palpables y rigidez en las manos.'},
    eb:{edad:0,sexo:'M',esp:2,sint:'Recién nacido de 10 días con ampollas en manos, pies y rodillas que aparecen con el roce mínimo; erosiones en boca al alimentarse. Sin antecedentes familiares conocidos.'}};
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<span class="kick m">Para el médico de primer contacto</span><h1>Clara</h1><p class="lead">Pensar a tiempo en una enfermedad poco frecuente. El pediatra o el médico general describe el caso; Clara señala si vale la pena sospechar, qué falta explorar y a dónde referir, citando la guía de donde sale cada dato.</p>'+
   '<div class="tool"><div class="panel">'+seg(dis)+
    '<div class="f3"><div class="field"><label for="edad">Edad (años)</label><input id="edad" type="number" min="0" max="110"></div><div class="field"><label for="sexo">Sexo</label><select id="sexo"><option value="F">Femenino</option><option value="M">Masculino</option></select></div><div class="field"><label for="esp">Especialistas vistos</label><input id="esp" type="number" min="0" max="40"></div></div>'+
    '<div class="field"><label for="sint">Cuadro clínico</label><textarea id="sint" rows="4"></textarea></div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn" id="go" type="button">Analizar caso</button><span class="note">Caso de demostración. Clara no diagnostica: orienta la sospecha y la referencia.</span></div>'+
    '<div class="res" id="res" aria-live="polite"></div></div>'+
   '<aside class="card side"><h3>Cómo razona Clara</h3><ul><li>Busca solo en guías y literatura aprobadas, y muestra de dónde sale cada dato.</li><li>Lanza una alerta de sesgo cuando el perfil del paciente es de los que más esperan un diagnóstico.</li><li>Termina con un siguiente paso concreto y a qué servicio referir.</li></ul>'+
   '<div class="demo-flag">La puerta de entrada que se propone es el pediatra: los signos de alarma de los primeros meses y el seguimiento del tamiz neonatal ampliado. El corpus final lo aprueba un comité médico.</div></aside></div>'+
  '</div></section>';
  var res=$('#res'),btn=$('#go');
  function fill(){var x=EX[dis];$('#edad').value=x.edad;$('#sexo').value=x.sexo;$('#esp').value=x.esp;$('#sint').value=x.sint;res.innerHTML='';voice.stop();}
  bindSeg(view,function(d){dis=d;fill();});
  function bias(edad,sexo,esp){var a=[];
    if(edad>=10&&edad<=19)a.push('Adolescente: es el grupo con mayor retraso diagnóstico, 10.4 años en promedio.');
    if(sexo==='F')a.push('Mujer: el retraso promedio es de 5.4 años, frente a 3.7 en hombres.');
    if(esp>10)a.push('Más de 10 especialistas consultados multiplica por 2.6 el riesgo de retraso.');
    else if(esp>=3)a.push('Ya pasó por '+esp+' especialistas sin diagnóstico: la ruta se está alargando.');
    return a;}
  btn.onclick=async function(){if(busy)return;busy=true;btn.disabled=true;voice.stop();
    var edad=+$('#edad').value||0,sexo=$('#sexo').value,esp=+$('#esp').value||0,sint=$('#sint').value.trim();
    var b=bias(edad,sexo,esp);
    res.innerHTML=(b.length?'<div class="box alert"><b>Alerta de sesgo</b> · '+b.map(esc).join(' ')+'<div class="note" style="margin-top:6px">Fuente: '+WEBER+'</div></div>':'')+'<div class="box"><span class="wait">Revisando las guías</span></div>';
    var out=res.lastChild,j=null,ok=false;
    var fr=cSearch(sint+' sospecha diagnóstico confirmación referencia',7,function(d){return d.enfermedad===dis&&d.publico!=='familia';});
    var prompt='Eres Clara, el apoyo para médicos de primer contacto del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México (medicina general, pediatría, medicina interna). No diagnosticas: ayudas a decidir si vale la pena sospechar '+DIS[dis]+' y cuál es el siguiente paso. Usa SOLO los FRAGMENTOS como evidencia y cita sus etiquetas.\n\nCASO: '+(edad===0?'recién nacido o menor de un año':edad+' años')+', sexo '+(sexo==='F'?'femenino':'masculino')+', ha visto a '+esp+' especialistas. Cuadro: '+sint+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nDevuelve SOLO un objeto JSON con esta forma: {"nivel":"alta"|"media"|"baja","razon":"por qué, máximo 40 palabras","coinciden":["hallazgos del caso que coinciden, máximo 4"],"explorar":["datos o estudios que faltan, máximo 3"],"siguiente_paso":"máximo 35 palabras","referencia":"a qué tipo de servicio referir, máximo 20 palabras","fuentes":["g2"]}';
    if(fr.length){try{j=await aiJson(prompt);ok=true;}catch(e){out.innerHTML='<p class="note">'+esc(errCopy(e))+'</p>';}}
    var li=function(a){return (a&&a.length)?'<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';};
    if(ok){var ids=(j.fuentes||[]).map(function(x){return String(x).toLowerCase();}).filter(function(x){return CBY[x];});
      var lv=String(j.nivel||'').toLowerCase();
      out.innerHTML='<b>Sospecha</b><span class="lvl '+esc(lv)+'">'+esc(lv)+'</span><p style="margin-top:6px">'+esc(j.razon||'')+'</p>'+(j.coinciden&&j.coinciden.length?'<p style="margin-top:10px"><b>Coinciden</b></p>'+li(j.coinciden):'')+(j.explorar&&j.explorar.length?'<p style="margin-top:10px"><b>Falta explorar</b></p>'+li(j.explorar):'');
      res.appendChild(h('div','box','<b>Siguiente paso</b><p>'+esc(j.siguiente_paso||'')+'</p><p style="margin-top:10px"><b>Referir a</b></p><p>'+esc(j.referencia||'')+'</p>'+srcLinks(ids)));
      say=(b.length?'Alerta de sesgo. '+b.join(' ')+' ':'')+'Sospecha '+lv+'. '+(j.razon||'')+' Siguiente paso: '+(j.siguiente_paso||'')+' Referir a: '+(j.referencia||'')+'. Recuerda: yo oriento la sospecha; el diagnóstico lo hace el especialista.';}
    else{var top=fr.slice(0,3);out.innerHTML+=top.map(function(d,i){return '<p style="margin-top:8px"><b>'+esc(d.tema)+'.</b> '+esc(d.texto)+'<sup class="c">'+(i+1)+'</sup></p>';}).join('')+srcLinks(top.map(function(d){return d.id;}));
      say=top[0]?'Esto dicen las guías. '+top[0].tema+'. '+top[0].texto:'';}
    if(say){var sp=h('button','btn ghost speak','Escuchar a Clara');sp.type='button';sp.onclick=function(){if(sp.textContent==='Detener'){voice.stop();sp.textContent='Escuchar a Clara';}else voice.speak(say,sp);};res.appendChild(sp);}
    busy=false;btn.disabled=false;};
  fill();
};

/* ---------- Atlas ---------- */
var LAY={h:{c:'#00C8D6',n:'Hospitales con experiencia'},a:{c:'#FF4FD8',n:'Asociaciones de pacientes'},t:{c:'#F2D14B',n:'Ensayos clínicos'}};
V.atlas=function(q){
  var A=PD.atlas,dis=DIS[q.d]?q.d:'all',on={h:1,a:1,t:1},sel=null;
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<span class="kick y">Para quien decide</span><h1>Atlas</h1><p class="lead">Dónde hay atención para las enfermedades poco frecuentes en México y dónde no. Usa la misma base que Rumbo, servida para quien diseña política pública.</p>'+
   '<div class="toolbar">'+seg(dis,true)+'<span class="note">Corte: '+esc(new Date(A.corte+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}))+'</span></div>'+
   '<div class="kpis" id="kpis"></div>'+
   '<div class="atlas"><div><div class="map" id="map"></div><div class="legend" id="leg"></div></div><div class="plist" id="pl" aria-live="polite"></div></div>'+
   '<div class="demo-flag">Solo datos públicos y agregados por institución. El Atlas nunca muestra información de pacientes individuales.</div>'+
  '</div></section>';
  function pts(){return A.pts.filter(function(p){return on[p.l]&&(dis==='all'||p.d.indexOf(D2K[dis])>=0);});}
  var area=null; /* grupo de puntos elegido en el mapa */
  function clusters(P){var g={};P.filter(function(p){return p.px!=null;}).forEach(function(p){var k=Math.round(p.px/24)+'_'+Math.round(p.py/24);(g[k]=g[k]||[]).push(p);});
    return Object.keys(g).map(function(k){var a=g[k],x=0,y=0,cnt={};a.forEach(function(p){x+=p.px;y+=p.py;cnt[p.l]=(cnt[p.l]||0)+1;});
      var top=Object.keys(cnt).sort(function(m,n){return cnt[n]-cnt[m];})[0];return {k:k,pts:a,x:x/a.length,y:y/a.length,l:top,mixed:Object.keys(cnt).length>1};});}
  function draw(){var P=pts(),states={};P.forEach(function(p){if(p.s!=null)states[p.s]=1;});
    $('#kpis').innerHTML=['h','a','t'].map(function(l){var n=A.pts.filter(function(p){return p.l===l&&(dis==='all'||p.d.indexOf(D2K[dis])>=0);}).length;return '<div class="kpi" style="border-top:3px solid '+LAY[l].c+'"><b>'+n+'</b><span>'+LAY[l].n+'</span></div>';}).join('');
    var covered=Object.keys(states).length,CL=clusters(P);
    if(area&&!CL.some(function(c){return c.k===area;}))area=null;
    $('#map').innerHTML='<svg viewBox="60 0 940 640" role="img" aria-label="Mapa de México con '+P.length+' puntos de atención">'+A.mx.p.map(function(p,i){return '<path d="'+p.d+'" class="'+(states[i]?'has':'')+'"><title>'+esc(p.n)+'</title></path>';}).join('')+
      CL.map(function(c){var n=c.pts.length,r=n>1?13+Math.sqrt(n)*4:10;return '<g class="cl" data-k="'+c.k+'" tabindex="0" role="button" aria-label="'+n+' puntos en '+esc(c.pts[0].c)+'" style="cursor:pointer"><circle cx="'+c.x+'" cy="'+c.y+'" r="'+r+'" fill="'+LAY[c.l].c+'" class="'+(area===c.k?'sel':'')+'"'+(c.mixed?' stroke-dasharray="4 3"':'')+'/>'+(n>1?'<text x="'+c.x+'" y="'+(c.y+5)+'" text-anchor="middle" style="font:800 15px Manrope,sans-serif;fill:#06121c;pointer-events:none">'+n+'</text>':'')+'</g>';}).join('')+'</svg>'+
      '<p class="note" style="padding:4px 8px 2px">'+covered+' de 32 entidades tienen al menos un punto en esta vista; las demás no tienen atención identificada. Toca un círculo para ver qué hay ahí.</p>';
    $$('#map .cl').forEach(function(g){var pick=function(){area=area===g.dataset.k?null:g.dataset.k;sel=null;draw();};g.onclick=pick;g.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}};});
    $('#leg').innerHTML=['h','a','t'].map(function(l){return '<button type="button" data-l="'+l+'" class="'+(on[l]?'':'off')+'" aria-pressed="'+(!!on[l])+'"><i style="background:'+LAY[l].c+'"></i>'+LAY[l].n+'</button>';}).join('');
    $$('#leg button').forEach(function(b){b.onclick=function(){on[b.dataset.l]=on[b.dataset.l]?0:1;draw();};});
    var ac=area&&CL.filter(function(c){return c.k===area;})[0];
    var L=(ac?ac.pts:P).slice().sort(function(a,b){return a.l.localeCompare(b.l);});
    $('#pl').innerHTML=(ac?'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>'+ac.pts.length+' en '+esc(ac.pts[0].c.replace(/\s*\(.*$/,''))+'</b><button type="button" class="wb" id="all">Ver todos</button></div>':'')+
      L.map(function(p){var i=A.pts.indexOf(p);return '<div class="pt'+(p===sel?' sel':'')+'" data-i="'+i+'" tabindex="0" style="border-left:3px solid '+LAY[p.l].c+'"><b>'+esc(p.n)+'</b><span class="c">'+esc(p.c)+' · '+p.d.map(function(k){return DSHORT[K2D[k]];}).join(', ')+'</span>'+(p===sel?'<p>'+esc(p.x)+'</p>'+(p.more||[]).map(function(m){return '<p>'+esc(m.x)+'</p>';}).join(''):'')+'<a href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></div>';}).join('')||'<p class="note">Sin puntos para este filtro.</p>';
    var all=$('#all');if(all)all.onclick=function(){area=null;draw();};
    $$('#pl .pt').forEach(function(el){var t=function(e){if(e.target.tagName==='A')return;var p=A.pts[+el.dataset.i];sel=sel===p?null:p;draw();};el.onclick=t;el.onkeydown=function(e){if(e.key==='Enter')t(e);};});}
  bindSeg($('.toolbar'),function(d){dis=d;sel=null;area=null;draw();});
  draw();
};

/* ---------- Asociaciones ---------- */
V.asociaciones=function(){
  var A=PD.atlas.pts.filter(function(p){return p.l==='a';});
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<span class="kick m">Para asociaciones de pacientes</span><h1>Su causa, en el centro del Acervo</h1><p class="lead">Las asociaciones participan sin costo. Aportan la cercanía con las familias y validan lo que se publica de su enfermedad; a cambio, el Observatorio les da visibilidad, herramientas y acceso a todo el conocimiento del Acervo.</p>'+
   '<div class="grid g3" style="margin-top:26px">'+
    '<div class="card"><span class="pill m">Visibilidad</span><h3 style="margin-top:10px">Ficha propia</h3><p>Perfil en el directorio, contacto directo y presencia en el Atlas, en Rumbo y en Clara cuando una familia o un médico preguntan por su enfermedad.</p></div>'+
    '<div class="card"><span class="pill m">Contenido</span><h3 style="margin-top:10px">Voz en el Acervo</h3><p>Publican testimonios, guías para familias y eventos. Revisan y aprueban lo que se dice de su enfermedad antes de que se publique.</p></div>'+
    '<div class="card"><span class="pill m">Herramientas</span><h3 style="margin-top:10px">Para crecer</h3><p>Registro de pacientes con consentimiento, convocatorias de financiamiento y materiales para su incidencia ante autoridades.</p></div>'+
   '</div></div></section>'+
  '<section class="blk"><div class="wrap"><span class="kick">Directorio</span><h2>Asociaciones identificadas en esta demostración</h2>'+
   '<div class="grid g2" style="margin-top:20px">'+A.map(function(p){return '<article class="card ficha"><div class="meta">'+p.d.map(function(k){return '<span class="pill">'+DSHORT[K2D[k]]+'</span>';}).join('')+'</div><h3>'+esc(p.n)+'</h3><p class="note">'+esc(p.c)+'</p><p>'+esc(p.x)+'</p><a class="src" href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></article>';}).join('')+'</div>'+
  '</div></section>'+
  '<section class="blk"><div class="wrap"><span class="kick y">Súmese</span><h2>Solicitud para formar parte</h2>'+
   '<form class="card" id="join" style="margin-top:20px;max-width:640px;display:flex;flex-direction:column;gap:12px">'+
    '<div class="field"><label for="jn">Nombre de la asociación</label><input id="jn" required></div>'+
    '<div class="field"><label for="je">Enfermedad o grupo de enfermedades</label><input id="je" required></div>'+
    '<div class="field"><label for="jc">Ciudad o estado</label><input id="jc"></div>'+
    '<button class="btn" type="submit" style="align-self:flex-start">Enviar solicitud</button><p class="note" id="jmsg">Demostración: este formulario no envía ni guarda datos.</p></form>'+
  '</div></section>';
  $('#join').onsubmit=function(e){e.preventDefault();$('#jmsg').textContent='Listo. En la versión final, esta solicitud llega al equipo del Observatorio, que se pone en contacto en pocos días. En esta demostración no se guardó nada.';};
};

/* ---------- Barómetro ---------- */
V.barometro=function(){
  var url=location.origin+'/#votar';
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<div class="pagehero" style="--img:url(/obs/img/brand/faro-manos.webp)"><span class="kick y">Para foros y el Senado</span><h1>Barómetro en Vivo</h1><p class="lead">La primera medición mexicana de cómo se vive con una enfermedad poco frecuente. Los asistentes votan desde su celular, las barras se llenan al momento en la pantalla y cada resultado se compara con España.</p></div>'+
   '<div class="grid g2" style="margin-top:26px;align-items:start">'+
    '<div class="card"><h3>Cómo funciona en la sala</h3><ul style="margin:10px 0 0 18px;display:flex;flex-direction:column;gap:6px"><li>Cada asistente escanea el código y vota.</li><li>Dos preguntas de opción única y una de opción múltiple, con los mismos reactivos del barómetro español.</li><li>Después del foro se publica el informe con la pregunta de jerarquía: el primer barómetro mexicano.</li></ul>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="btn" href="/#votar">Abrir la votación</a><a class="btn ghost" href="/">Ver la presentación</a></div></div>'+
    '<div class="card"><h3>Liga para votar</h3><p class="note" style="margin-top:6px">Esta es la dirección que va en el código QR de la sala.</p><p style="margin-top:12px;word-break:break-all"><b>'+esc(url)+'</b></p><p class="note" style="margin-top:12px">Comparación: '+WEBER.replace(', p. 91','')+'.</p></div>'+
   '</div></div></section>';
};


/* ---------- fondo animado: el abanico de manos de luz ---------- */
var FX=(function(){
  var cv=document.getElementById('fx');if(!cv||!cv.getContext)return {go:function(){}};
  var ctx=cv.getContext('2d'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL=[[255,79,216],[139,92,246],[56,189,248],[74,222,128],[255,143,177]],BASE=[-58,-24,6,34,64],FING=[.62,.9,1,.88,.6];
  /* posición del abanico (fracción de pantalla), escala, giro y qué mano resalta en cada sección */
  var CFG={inicio:{x:.86,y:1.12,s:1.1,rot:-6,hi:null,a:.34},acervo:{x:.92,y:1.15,s:.95,rot:-14,hi:1,a:.3},rumbo:{x:.08,y:1.18,s:.9,rot:18,hi:2,a:.3},
    clara:{x:.92,y:1.18,s:.9,rot:-18,hi:0,a:.3},atlas:{x:.5,y:1.3,s:1.05,rot:0,hi:3,a:.24},asociaciones:{x:.1,y:1.15,s:.95,rot:14,hi:4,a:.3},barometro:{x:.5,y:1.2,s:1.15,rot:0,hi:null,a:.34}};
  var W=0,H=0,dpr=Math.min(1.5,window.devicePixelRatio||1),cur=null,from=null,to=null,t0=0,DUR=1400;
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(cur)draw(cur,performance.now(),0);}
  function st(name){var c=CFG[name]||CFG.inicio,al=[];for(var i=0;i<5;i++)al[i]=c.hi==null?c.a:(i===c.hi?c.a*1.9:c.a*.45);return {x:c.x,y:c.y,s:c.s,rot:c.rot,a:al};}
  function lerp(a,b,k){return a+(b-a)*k;}
  function mix(p,q,k){return {x:lerp(p.x,q.x,k),y:lerp(p.y,q.y,k),s:lerp(p.s,q.s,k),rot:lerp(p.rot,q.rot,k),a:p.a.map(function(v,i){return lerp(v,q.a[i],k);})};}
  function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;}
  function finger(px,py,ang,len,w,c,al){var ex=px+Math.sin(ang)*len,ey=py-Math.cos(ang)*len,g=ctx.createLinearGradient(px,py,ex,ey);
    g.addColorStop(0,'rgba('+c+','+(al*.04)+')');g.addColorStop(.5,'rgba('+c+','+(al*.65)+')');g.addColorStop(1,'rgba('+c+','+al+')');
    ctx.save();ctx.translate(px,py);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(-w*.55,0);ctx.lineTo(-w/2,-len+w/2);ctx.arc(0,-len+w/2,w/2,Math.PI,0);ctx.lineTo(w*.55,0);ctx.closePath();ctx.restore();ctx.fillStyle=g;ctx.fill();}
  function draw(s,time,close){ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
    var u=Math.min(W,H*1.4)/1100,br=RM?0:Math.sin(time/2400)*.035,flare=1+close*1.2;
    for(var hnd=0;hnd<5;hnd++){var al=Math.min(.9,s.a[hnd]*flare);if(al<.01)continue;var c=COL[hnd].join(',');
      var base=(BASE[hnd]*(1-close*.6)+s.rot)*Math.PI/180,L=520*s.s*u*(1+(RM?0:Math.sin(time/3100+hnd)*.03)),Wd=74*s.s*u,px=s.x*W+(hnd-2)*24*s.s*u,py=s.y*H;
      for(var f=0;f<5;f++){var ang=base+((f-2)*(13+br*40)*(1-close*.5))*Math.PI/180;finger(px+Math.sin(base)*40*s.s*u,py,ang,L*FING[f],Wd*(f===0||f===4?.82:1),c,al*.6);}
      var rg=ctx.createRadialGradient(px,py-140*s.s*u,0,px,py-140*s.s*u,300*s.s*u);rg.addColorStop(0,'rgba('+c+','+(al*.3)+')');rg.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=rg;ctx.fillRect(px-340*s.s*u,py-460*s.s*u,680*s.s*u,680*s.s*u);}
    ctx.globalCompositeOperation='source-over';}
  function frame(time){var s=cur,close=0;
    if(to){var k=Math.min(1,(time-t0)/DUR),e=ease(k);s=mix(from,to,e);close=Math.sin(Math.PI*k)*.85;s.rot=lerp(from.rot-60,to.rot,e);if(k>=1){cur=to;to=null;}}
    if(s)draw(s,time,close);if(!RM||to)requestAnimationFrame(frame);}
  addEventListener('resize',size);size();
  return {go:function(name){var n=st(name);
    if(!cur||RM){cur=n;to=null;draw(n,0,0);if(!RM)requestAnimationFrame(frame);return;}
    from=to?mix(from,to,ease(Math.min(1,(performance.now()-t0)/DUR))):cur;to=n;t0=performance.now();
    var sw=document.getElementById('sweep');if(sw){sw.classList.remove('go');void sw.offsetWidth;sw.classList.add('go');}}};
})();
var firstRoute=true;
var topEl=document.querySelector('.top');
function solidHead(){if(topEl)topEl.classList.toggle('solid',scrollY>40||!document.body.classList.contains('home'));}
addEventListener('scroll',solidHead,{passive:true});

/* ---------- enrutador ---------- */
function route(){
  var hs=location.hash.replace(/^#\/?/,''),parts=hs.split('?'),name=parts[0]||'inicio',q={};
  (parts[1]||'').split('&').forEach(function(kv){if(!kv)return;var p=kv.split('=');q[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'');});
  if(!V[name])name='inicio';
  voice.stop();
  $$('.nav a').forEach(function(a){a.classList.toggle('on',a.dataset.v===name);if(a.dataset.v===name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  V[name](q);window.scrollTo(0,0);if(name!=='inicio')view.focus({preventScroll:true});
  document.body.classList.toggle('home',name==='inicio');solidHead();
  FX.go(name);view.classList.remove('enter');void view.offsetWidth;view.classList.add('enter');firstRoute=false;
  document.title=(name==='inicio'?'':({acervo:'Acervo',rumbo:'Rumbo',clara:'Clara',atlas:'Atlas',asociaciones:'Asociaciones',barometro:'Barómetro'})[name]+' · ')+'Observatorio · Enfermedades Poco Frecuentes';}

fetch('/obs/acervo.json').then(function(r){return r.json();}).then(function(d){
  PD=d;C=PD.corpus||[];C.forEach(function(x){CBY[x.id]=x;});
  cSearch=Index(C,function(x){return x.tema+' '+x.tema+' '+x.texto;});
  RM=PD.rumbo||RM;RM.w.forEach(function(w){RW[w.id]=w;});
  window.addEventListener('hashchange',route);route();
}).catch(function(){view.innerHTML='<section class="blk"><div class="wrap"><h2>No se pudo cargar el Acervo</h2><p class="lead">Recarga la página.</p></div></section>';});
})();
