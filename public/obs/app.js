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
var SRC_DX={t:'EURORDIS, Rare Barometer: encuesta a más de 10,000 pacientes en 42 países (2024)',u:'https://www.eurordis.org/survey-reveals-lengthy-diagnostic-delays'},
    SRC_ESP={t:'Benito-Lozano et al., Int J Environ Res Public Health 2022 (Registro Español de Pacientes, 1,216 personas)',u:'https://repisalud.isciii.es/entities/publication/feeadffd-12e4-49be-a62e-cda35bb99713'},
    SRC_DISC={t:'EURORDIS, Rare Barometer: encuesta a 9,591 personas en 43 países (feb. 2025)',u:'https://www.eurordis.org/rare-barometer-findings-daily-life-survey'};
function srcA(o){return '<a href="'+o.u+'" target="_blank" rel="noopener">'+esc(o.t)+' ↗</a>';}
var WEBER=SRC_DX.t;
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

/* video en loop de la portada: solo escritorio, sin ahorro de datos ni 'reducir movimiento' */
function heroVideo(){var bg=$('.hero .bgimg');if(!bg)return;
  var c=navigator.connection||{},rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(rm||c.saveData||/2g/.test(c.effectiveType||'')||innerWidth<900)return;
  var v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.autoplay=true;v.preload='auto';v.setAttribute('aria-hidden','true');v.poster='/obs/img/brand/isla.webp';
  v.innerHTML='<source src="/obs/video/isla-loop.webm" type="video/webm"><source src="/obs/video/isla-loop.mp4" type="video/mp4">';
  v.addEventListener('playing',function(){v.classList.add('ready');},{once:true});
  bg.appendChild(v);var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});}
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
    '<div class="stat"><b>× 2.6</b><span>más probabilidad de retraso tras consultar a más de 10 especialistas</span></div>'+
    '<div class="stat"><b>× 2.1</b><span>si hay que salir de la propia región para ver a un especialista</span></div>'+
   '</div>'+
   '<p class="note" style="margin-top:16px">Fuentes: '+srcA(SRC_DX)+' · '+srcA(SRC_ESP)+'. Para México se estiman entre 8 y 10 millones de personas con una enfermedad poco frecuente, sin censo nacional (<a href="'+esc(CBY.x2?CBY.x2.url:'#')+'" target="_blank" rel="noopener">Excélsior, feb. 2026</a>). Medir la cifra mexicana es la primera tarea del Observatorio.</p>'+
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
  heroVideo();
};

/* ---------- voz: dictado (Web Speech) y respuesta hablada (ElevenLabs si está configurado; si no, la mejor voz femenina en español del navegador) ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function dictado(btn,inp,onDone){
  if(!SR){btn.hidden=true;return;}
  var rec=null;
  btn.onclick=function(){
    if(rec){rec.stop();return;}
    rec=new SR();rec.lang='es-MX';rec.interimResults=true;rec.continuous=false;
    var base=inp.value?inp.value+' ':'';
    rec.onresult=function(e){var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=base+t;};
    rec.onend=function(){rec=null;btn.classList.remove('rec');btn.setAttribute('aria-pressed','false');if(onDone&&inp.value.trim())onDone();};
    rec.onerror=function(){};
    btn.classList.add('rec');btn.setAttribute('aria-pressed','true');rec.start();};}
var FEM=/paulina|m[oó]nica|sabina|dalia|helena|elvira|marisol|lupe|laura|camila|female|mujer|google español de estados unidos|google español/i;
function bestVoice(){var vs=[];try{vs=speechSynthesis.getVoices().filter(function(v){return /^es/i.test(v.lang);});}catch(e){}
  var mx=vs.filter(function(v){return /MX/i.test(v.lang);}),f=function(a){return a.filter(function(v){return FEM.test(v.name);})[0];};
  return f(mx)||f(vs.filter(function(v){return /419|US/i.test(v.lang);}))||f(vs)||mx[0]||vs[0]||null;}
try{speechSynthesis.onvoiceschanged=function(){};}catch(e){}
var voice={a:null,ava:null,on:true,
  stop:function(){if(this.a){this.a.pause();this.a=null;}try{speechSynthesis.cancel();}catch(e){}if(this.ava)this.ava.classList.remove('talk');},
  speak:async function(text,ava){if(!this.on||!text)return;this.stop();this.ava=ava;var self=this,done=function(){if(ava)ava.classList.remove('talk');};
    text=text.replace(/\[[a-z]\d+(?:\s*,\s*[a-z]\d+)*\]/gi,'').replace(/\*\*/g,'');
    if(ava)ava.classList.add('talk');
    try{var r=await fetch('/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text})});
      if(r.ok){self.a=new Audio(URL.createObjectURL(await r.blob()));self.a.onended=done;self.a.onerror=done;await self.a.play();return;}}catch(e){}
    try{var s=new SpeechSynthesisUtterance(text);s.lang='es-MX';var v=bestVoice();if(v)s.voice=v;s.rate=1.03;s.pitch=1.02;s.onend=done;s.onerror=done;speechSynthesis.speak(s);}catch(e){done();}}};
function ava(){var c=['#FF4FD8','#8B5CF6','#38BDF8','#4ADE80','#FF8FB1'],h='';for(var i=0;i<10;i++)h+='<i style="--r:'+(i*36)+'deg;transform:rotate('+(i*36)+'deg);background:'+c[i%5]+';animation-delay:'+(i*.07)+'s"></i>';return '<span class="ava" aria-hidden="true">'+h+'<b></b></span>';}
function voiceToggle(){return '<button type="button" class="vtog" aria-pressed="'+voice.on+'" title="Respuesta en voz alta">'+(voice.on?'Voz activada':'Voz en silencio')+'</button>';}
function bindVoiceToggle(root){var b=$('.vtog',root);if(!b)return;b.onclick=function(){voice.on=!voice.on;if(!voice.on)voice.stop();b.textContent=voice.on?'Voz activada':'Voz en silencio';b.setAttribute('aria-pressed',voice.on);};}
var MIC='<button type="button" class="mic" aria-label="Dictar con tu voz" aria-pressed="false"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2Z" fill="currentColor"/></svg></button>';

/* ---------- conversación por voz en tiempo real (agentes de ElevenLabs, como PULSO) ---------- */
var EL_SRC='/obs/vendor/elevenlabs-client-1.25.0.min.js',elLoad=null;
function loadEL(){if(window.ElevenLabsClient)return Promise.resolve(window.ElevenLabsClient);
  if(!elLoad)elLoad=new Promise(function(ok,ko){var s=document.createElement('script');s.src=EL_SRC;s.onload=function(){ok(window.ElevenLabsClient);};s.onerror=ko;document.head.appendChild(s);});return elLoad;}
function callBtn(nombre){return '<button type="button" class="callbtn" aria-pressed="false"><i aria-hidden="true"></i><span>Hablar con '+nombre+'</span></button>';}
var CALL={c:null,raf:0,o:null};
function endCall(){var c=CALL.c;CALL.c=null;cancelAnimationFrame(CALL.raf);if(c)try{c.endSession();}catch(e){}
  var o=CALL.o;CALL.o=null;if(!o)return;o.ava.classList.remove('live','talk');o.ava.style.removeProperty('--lv');
  o.btn.classList.remove('on');o.btn.setAttribute('aria-pressed','false');o.btn.querySelector('span').textContent='Hablar con '+o.nombre;o.btn.disabled=false;o.status('');}
async function startCall(o){
  if(CALL.c||CALL.o){endCall();return;}
  voice.stop();CALL.o=o;o.btn.disabled=true;o.status('Conectando…');
  var cfg=null;try{var r=await fetch('/api/voz?agente='+o.agente);if(r.ok)cfg=await r.json();}catch(e){}
  if(!cfg){CALL.o=null;o.btn.disabled=false;o.status('La conversación por voz todavía no está conectada. Mientras, puedes escribir o dictar.');return;}
  try{var st=await navigator.mediaDevices.getUserMedia({audio:true});st.getTracks().forEach(function(t){t.stop();});}
  catch(e){CALL.o=null;o.btn.disabled=false;o.status('Para hablar con '+o.nombre+' necesito permiso para usar tu micrófono.');return;}
  var EL;try{EL=await loadEL();}catch(e){CALL.o=null;o.btn.disabled=false;o.status('No pude cargar la voz. Revisa tu conexión.');return;}
  var opts={connectionType:'webrtc',dynamicVariables:o.vars||{},clientTools:o.tools||{},
    onConnect:function(){o.btn.disabled=false;o.btn.classList.add('on');o.btn.setAttribute('aria-pressed','true');o.btn.querySelector('span').textContent='Colgar';o.ava.classList.add('live');o.status('Te escucho. Habla con naturalidad.');},
    onDisconnect:function(){endCall();},
    onError:function(m){console.warn('voz',m);o.status('Se cortó la conversación. Intenta de nuevo.');},
    onModeChange:function(m){if(CALL.o)o.status(m.mode==='speaking'?o.nombre+' está hablando… puedes interrumpirla.':'Te escucho.');},
    onMessage:function(m){if(m&&m.message)o.say(m.source==='user'||m.role==='user'?'u':'a',m.message);}};
  if(cfg.conversationToken)opts.conversationToken=cfg.conversationToken;else opts.agentId=cfg.agentId;
  try{CALL.c=await EL.Conversation.startSession(opts);}catch(e){console.warn(e);CALL.o=null;o.btn.disabled=false;o.status('No pude iniciar la conversación. Intenta de nuevo.');return;}
  (function loop(){if(!CALL.c)return;var sp=CALL.c.getOutputVolume?CALL.c.getOutputVolume():0,mi=CALL.c.getInputVolume?CALL.c.getInputVolume():0;
    o.ava.style.setProperty('--lv',Math.min(1,Math.max(sp*1.6,mi*.7)).toFixed(3));CALL.raf=requestAnimationFrame(loop);})();}
window.addEventListener('hashchange',function(){if(CALL.o)endCall();});
/* herramientas que el agente puede usar en pantalla mientras habla */
function voiceTools(log,extra){var t={
  mostrar_fuentes:function(p){var ids=String(p&&p.ids||'').toLowerCase().match(/[a-z]\d+/g)||[];ids=ids.filter(function(x){return CBY[x];});if(!ids.length)return 'Sin fuentes con esos identificadores.';
    log.appendChild(h('div','bb a src-only',srcLinks(ids)));log.scrollTop=1e6;return 'Fuentes mostradas en pantalla.';},
  mostrar_tarjeta:function(p){log.appendChild(h('div','box','<b>'+esc(p&&p.titulo||'')+'</b><p style="margin-top:6px">'+esc(p&&p.texto||'')+'</p>'));log.scrollTop=1e6;return 'Tarjeta mostrada.';},
  ir_al_atlas:function(p){var k=String(p&&p.enfermedad||'').toLowerCase(),d=DIS[k]?k:'';log.appendChild(h('div','box','<a class="go" href="#/atlas'+(d?'?d='+d:'')+'" style="text-decoration:none">Ver en el Atlas dónde se atiende'+(d?' '+esc(DSHORT[d].toLowerCase()):'')+' →</a>'));log.scrollTop=1e6;return 'Enlace al Atlas mostrado.';}};
  for(var k in extra)t[k]=extra[k];return t;}

var DCOL={eb:'c-m',gaucher:'c-b',fabry:'c-v',mps:'c-g',general:'c-y',tamiz:'c-p'};
DSHORT.tamiz='Tamiz neonatal';
var EUROPA=srcA(SRC_DISC);

/* ---------- Acervo ---------- */
V.acervo=function(q){
  var dis=q.d||'all',aud=q.p||'all',shown=11,ctl=null;
  var opts=[['all','Todo'],['eb','Piel de mariposa'],['gaucher','Gaucher'],['fabry','Fabry'],['mps','Hunter (MPS II)'],['tamiz','Tamiz neonatal'],['general','Trámites y apoyos']];
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk">El Acervo</span><h1>Conocimiento vivo, con la fuente a la vista</h1><p>Fichas, videos y respuestas sobre enfermedades poco frecuentes. Pregunta con tus palabras: cada dato dice de dónde sale.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile s4 c-b"><span class="tk">Pregunta al Acervo</span><form class="ask" id="ask" style="margin-top:4px;max-width:none"><input id="q" placeholder="Por ejemplo: ¿qué detecta el tamiz neonatal en el IMSS?" maxlength="300" aria-label="Pregunta al Acervo">'+MIC+'<button class="btn" type="submit">Preguntar</button></form><div class="answer" id="ans" style="max-width:none"></div></div>'+
    '<div class="tile s4" style="padding:14px"><div class="chips" id="fd">'+opts.map(function(o){return '<button type="button" data-d="'+o[0]+'"'+(dis===o[0]?' class="on"':'')+'>'+o[1]+'</button>';}).join('')+'</div><div class="chips" id="fa" style="margin-top:8px">'+[['all','Para todos'],['familia','Para familias'],['medico','Para médicos']].map(function(o){return '<button type="button" data-p="'+o[0]+'"'+(aud===o[0]?' class="on"':'')+'>'+o[1]+'</button>';}).join('')+'</div></div>'+
   '</div><div class="bento" id="tiles" style="margin-top:14px"></div><div class="more" id="more"></div>'+
  '</div></section>';
  var ans=$('#ans');
  function list(){
    var L=C.filter(function(d){return (dis==='all'||d.enfermedad===dis)&&(aud==='all'||d.publico===aud||d.publico==='ambos');});
    var vids=RM.w.filter(function(w){return w.t==='video'&&(dis==='all'||w.d===dis);}).slice(0,dis==='all'?3:4);
    var H=vids.map(function(w){return '<a class="tile c-v btnish" href="https://www.youtube.com/watch?v='+esc(w.yt)+'" target="_blank" rel="noopener" style="text-decoration:none;padding:0"><span style="display:block;aspect-ratio:16/9;background:#000 url('+esc(w.thumb)+') center/cover"></span><span style="padding:12px 16px 14px;display:flex;flex-direction:column;gap:4px"><span class="tk">Video · '+esc(DSHORT[w.d]||'')+'</span><b style="font-size:14.5px;line-height:1.35">'+esc(w.title)+'</b><span class="note">'+esc(w.canal)+'</span></span></a>';}).join('');
    H+=L.slice(0,shown).map(function(d){return '<article class="tile '+(DCOL[d.enfermedad]||'')+'"><span class="tk">'+esc(DSHORT[d.enfermedad]||'')+' · '+({medico:'Médicos',familia:'Familias',ambos:'Todos'})[d.publico]+'</span><h3>'+esc(d.tema.replace(/^Tamiz neonatal · /,''))+'</h3><p>'+esc(d.texto)+'</p><a class="src" href="'+esc(d.url)+'" target="_blank" rel="noopener">Fuente: '+esc(d.fuente)+' ↗</a></article>';}).join('');
    $('#tiles').innerHTML=H||'<p class="note">Sin fichas para este filtro.</p>';
    $('#more').innerHTML=L.length>shown?'<button class="btn ghost" type="button">Ver más ('+(L.length-shown)+')</button>':'';
    var mb=$('#more button');if(mb)mb.onclick=function(){shown+=12;list();};}
  $$('#fd button').forEach(function(b){b.onclick=function(){$$('#fd button').forEach(function(x){x.classList.toggle('on',x===b);});dis=b.dataset.d;shown=11;list();};});
  $$('#fa button').forEach(function(b){b.onclick=function(){$$('#fa button').forEach(function(x){x.classList.toggle('on',x===b);});aud=b.dataset.p;shown=11;list();};});
  list();
  dictado($('#ask .mic'),$('#q'),function(){$('#ask').requestSubmit();});
  $('#ask').onsubmit=async function(e){e.preventDefault();var qq=$('#q').value.trim();if(!qq)return;
    if(ctl)ctl.abort();ctl=new AbortController();
    var fr=cSearch(qq+' '+qq,7,function(d){return dis==='all'||d.enfermedad===dis||d.enfermedad==='general';});
    ans.innerHTML='<div class="box" style="margin-top:12px"><span class="wait">Buscando en el Acervo</span></div>';var box=ans.firstChild;
    if(!fr.length){box.innerHTML='No encontré información sobre eso en el Acervo. En esta demostración cubre cuatro enfermedades (piel de mariposa, Gaucher, Fabry y síndrome de Hunter), el tamiz neonatal en México y apoyos y trámites.';return;}
    var prompt='Eres el Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes (Capítulo México). Responde en español de México, claro y cálido, en un máximo de 110 palabras. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento, por ejemplo [g4]. Si la respuesta no está en los fragmentos, dilo con honestidad. No indiques dosis ni hagas diagnósticos. Sin títulos.\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nPREGUNTA: '+qq;
    try{var t=await aiStream(prompt,function(t){box.innerHTML=cite(t).html;},ctl.signal);var c=cite(t);box.innerHTML=c.html+srcLinks(c.used);}
    catch(err){if(err.name==='AbortError')return;box.innerHTML='<p class="note">'+esc(errCopy(err))+'</p><br><b>'+esc(fr[0].tema)+'.</b> '+esc(fr[0].texto)+'<sup class="c">1</sup>'+srcLinks([fr[0].id]);}};
  if(q.q){$('#q').value=q.q;$('#ask').requestSubmit();}
};

/* ---------- Rumbo (luz clara) ---------- */
V.rumbo=function(q){
  var dis=DIS[q.d]?q.d:'eb',turns=[],busy=false,ctl=null;
  var SUG={eb:['¿Cómo cargo y visto a mi bebé?','¿Cómo hago una curación?','¿Dónde la atienden en México?','¿Hay algún apoyo económico?','¿Con quién puedo hablar?'],
    gaucher:['¿Qué es y cómo se hereda?','¿Cómo se confirma el diagnóstico?','¿Qué tratamientos hay?','¿Dónde la atienden en México?','¿Puedo pedir la pensión por discapacidad?'],
    fabry:['¿Por qué me arden las manos y los pies?','¿Cómo se hereda?','¿Las mujeres también la tienen?','¿Qué tratamientos hay?','¿Hay una asociación de pacientes?'],
    mps:['¿Qué es el síndrome de Hunter?','¿Cuáles son los primeros signos?','¿Qué tratamiento hay?','¿Qué cuidados necesita en la escuela?','¿Con quién puedo hablar?']};
  var HOLA={eb:'Hola, soy Rumbo. Te acompaño con la piel de mariposa: cuidados en casa, dónde atenderse en México y qué apoyos existen. ¿En qué te ayudo?',
    gaucher:'Hola, soy Rumbo. Te acompaño con la enfermedad de Gaucher: qué es, cómo se confirma, tratamientos y apoyos en México. ¿En qué te ayudo?',
    fabry:'Hola, soy Rumbo. Te acompaño con la enfermedad de Fabry: síntomas, cómo se hereda, tratamientos y dónde atenderse. ¿En qué te ayudo?',
    mps:'Hola, soy Rumbo. Te acompaño con el síndrome de Hunter: primeros signos, cuidados en casa y escuela, tratamiento y dónde atenderse. ¿En qué te ayudo?'};
  var ASO={eb:'debra',gaucher:'nord',fabry:'grupo_fabry',mps:'palito'};
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-b">Para familias y pacientes</span><h1>Rumbo</h1><p>Qué sigue después del diagnóstico, en tus palabras. Escríbele o háblale: responde con información aprobada y te dice de dónde sale cada dato.</p></div>'+
   '<div class="chips" id="dz">'+['eb','gaucher','fabry','mps'].map(function(d){return '<button type="button" data-d="'+d+'"'+(dis===d?' class="on"':'')+'>'+DSHORT[d]+'</button>';}).join('')+'</div></div>'+
   '<div class="bento">'+
    '<div class="tile s2 r3 c-b" id="chat"><div class="who">'+ava()+'<div><h3>Rumbo</h3><p>Tu acompañante · responde con fuentes</p></div><span class="hdr-r">'+callBtn('Rumbo')+voiceToggle()+'</span></div><p class="callst" id="cst" aria-live="polite"></p>'+
     '<div class="log" id="log" aria-live="polite"></div><div class="sug" id="sug"></div>'+
     '<form class="row" id="f"><input id="inp" placeholder="Escribe o dicta tu pregunta…" maxlength="300" aria-label="Tu pregunta">'+MIC+'<button class="btn" type="submit">Enviar</button></form>'+
     '<div class="note">Orientación general; no sustituye la consulta médica.</div></div>'+
    '<div class="tile c-p" id="w-dato"></div>'+
    '<a class="tile c-g btnish" id="w-cerca" style="text-decoration:none"></a>'+
    '<div class="tile c-v" id="w-video"></div>'+
    '<button type="button" class="tile c-y btnish" id="w-tramite" style="text-align:left;font:inherit;color:inherit"></button>'+
    '<div class="tile s2 ink" id="w-aso"></div>'+
   '</div></div></section>';
  var log=$('#log'),sug=$('#sug'),inp=$('#inp'),form=$('#f'),av=$('#chat .ava');
  bindVoiceToggle($('#chat'));
  $('#chat .callbtn').onclick=function(){startCall({agente:'rumbo',nombre:'Rumbo',ava:av,btn:this,vars:{enfermedad:DIS[dis]},
    status:function(t){$('#cst').textContent=t;},say:function(w,t){log.appendChild(h('div','bb '+w,esc(t)));log.scrollTop=1e6;},tools:voiceTools(log,{})});};
  function side(){
    $('#w-dato').innerHTML='<span class="tk">Dato que importa</span><div class="big">8 <small>de cada 10</small></div><p>personas con una enfermedad poco frecuente viven con alguna discapacidad, y apenas 57% ha tenido una valoración. En Europa ya se mide; en Latinoamérica todavía no.</p><span class="src">'+EUROPA+'</span>';
    var P=PD.atlas.pts.filter(function(p){return p.d.indexOf(D2K[dis])>=0;}),nh=P.filter(function(p){return p.l==='h';}).length,na=P.filter(function(p){return p.l==='a';}).length;
    var w=$('#w-cerca');w.href='#/atlas?d='+dis;w.innerHTML='<span class="tk">Dónde atienden</span><div class="big">'+nh+' <small>hospitales</small></div><p>'+na+' asociación'+(na===1?'':'es')+' de pacientes con experiencia en '+esc(DSHORT[dis].toLowerCase())+'.</p><span class="go">Ver en el mapa →</span>';
    var v=RM.w.filter(function(x){return x.t==='video'&&x.d===dis;})[0];
    $('#w-video').innerHTML=v?'<span class="tk">Para entenderla</span><a href="https://www.youtube.com/watch?v='+esc(v.yt)+'" target="_blank" rel="noopener" style="display:block;aspect-ratio:16/9;border-radius:12px;background:#000 url('+esc(v.thumb)+') center/cover"></a><b style="font-size:14px;line-height:1.35">'+esc(v.title)+'</b><span class="note">'+esc(v.canal)+'</span>':'';
    $('#w-tramite').innerHTML='<span class="tk">Trámite</span><h3>Pensión por discapacidad</h3><p>Quién la puede pedir, qué documentos llevar y cómo registrarse.</p><span class="go">Preguntar a Rumbo →</span>';
    var a=RW[ASO[dis]];
    $('#w-aso').innerHTML=a?'<span class="tk" style="color:#FF8FB1">No estás sola, no estás solo</span><h3>'+esc(a.title)+'</h3><p style="color:#cfd8e3">'+esc(a.sub||'')+'</p><a class="go" style="color:#FF8FB1;text-decoration:none" href="'+esc(a.url)+'" target="_blank" rel="noopener">Conocer a la asociación ↗</a>':'';}
  $('#w-tramite').onclick=function(){send('¿Puedo pedir la pensión por discapacidad y qué necesito?');};
  function hello(){voice.stop();log.innerHTML='';turns=[];log.appendChild(h('div','bb a',esc(HOLA[dis])));
    sug.innerHTML=SUG[dis].map(function(s){return '<button type="button">'+esc(s)+'</button>';}).join('');
    $$('button',sug).forEach(function(b){b.onclick=function(){send(b.textContent);};});side();}
  $$('#dz button').forEach(function(b){b.onclick=function(){$$('#dz button').forEach(function(x){x.classList.toggle('on',x===b);});if(ctl)ctl.abort();busy=false;dis=b.dataset.d;hello();};});
  form.onsubmit=function(e){e.preventDefault();var t=inp.value.trim();if(t&&!busy){inp.value='';send(t);}};
  dictado($('#f .mic'),inp,function(){form.requestSubmit();});
  function clean(t){return t.split(/\n?\s*WIDGETS?\s*:/i)[0].trim();}
  async function send(qq){if(busy)return;busy=true;voice.stop();form.querySelector('.btn').disabled=true;
    log.appendChild(h('div','bb u',esc(qq)));var a=h('div','bb a','<span class="wait">Buscando en las fuentes</span>');log.appendChild(a);log.scrollTop=1e6;
    var ctx=turns.slice(-2).map(function(t){return t.content;}).join(' ');
    var fr=cSearch(qq+' '+qq+' '+ctx,6,function(d){return (d.enfermedad===dis||d.enfermedad==='general')&&d.publico!=='medico';});
    if(fr.length<3)fr=fr.concat(cSearch(qq,6,function(d){return d.enfermedad===dis||d.enfermedad==='general';}).filter(function(d){return fr.indexOf(d)<0;})).slice(0,6);
    var cat=RM.w.filter(function(w){return w.d===dis||w.d==='general';}).map(function(w){return w.id+': '+w.desc;}).join('\n');
    var text='',ids=[],done=false;
    if(fr.length){
      var hist=turns.slice(-4).map(function(t){return (t.role==='user'?'Familia: ':'Rumbo: ')+t.content;}).join('\n');
      var prompt='Eres Rumbo, el acompañante para familias del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. La familia vive con '+DIS[dis]+'. Habla como una mujer mexicana de unos 35 a 40 años: cálida, clara y serena. Responde en un máximo de 80 palabras, porque la respuesta se lee en voz alta y va acompañada de tarjetas visuales. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento, por ejemplo [e7]. Si la respuesta no está en los fragmentos, dilo con honestidad y sugiere hablar con su equipo médico o con la asociación de pacientes. No indiques dosis ni hagas diagnósticos. Sin títulos ni listas.\n\nAl final, en una línea aparte, escribe WIDGETS: seguido de 1 a 3 identificadores del CATÁLOGO que mejor complementan la respuesta (de preferencia uno visual y, si hay uno pertinente, un video), separados por comas.\n\nCATÁLOGO:\n'+cat+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+(hist?'\n\nCONVERSACIÓN PREVIA:\n'+hist:'')+'\n\nPREGUNTA DE LA FAMILIA: '+qq;
      ctl=new AbortController();
      try{var r=await aiStream(prompt,function(t){a.innerHTML=cite(clean(t)).html;log.scrollTop=1e6;},ctl.signal);
        var m=r.match(/WIDGETS?\s*:\s*(.+)/i);ids=m?m[1].split(/[\s,]+/).map(function(s){return s.replace(/[^\w-]/g,'');}).filter(Boolean):[];
        text=clean(r);done=true;}
      catch(e){if(e.name==='AbortError')return;a.innerHTML='<span class="note">'+esc(errCopy(e))+'</span>';}
    }
    if(done){var c=cite(text);a.innerHTML=c.html+srcLinks(c.used);}
    else if(!fr.length){text='No encontré información sobre eso en las fuentes de Rumbo. Te sugiero preguntarlo a tu equipo médico o a la asociación de pacientes.';a.innerHTML=esc(text);}
    else{a.innerHTML+='<br><br><b>'+esc(fr[0].tema)+'.</b> '+esc(fr[0].texto)+'<sup class="c">1</sup>'+srcLinks([fr[0].id]);text=fr[0].texto;}
    voice.speak(text,av);
    var ws=pickW(ids,dis,fr);
    if(ws.length){var g=h('div','wgs');ws.forEach(function(w){g.appendChild(renderW(w));});log.appendChild(g);}
    turns.push({role:'user',content:qq},{role:'assistant',content:text.replace(/\[[a-z]\d+\]/gi,'')});
    a.scrollIntoView({block:'nearest'});busy=false;form.querySelector('.btn').disabled=false;}
  hello();
};

/* ---------- Clara: consulta guiada, sin elegir enfermedad ---------- */
V.clara=function(){
  var busy=false,stage='caso',caso='',preguntas=[],resp={};
  var EJ=[['Adolescente con bazo grande','Mujer de 15 años. Fatiga desde hace dos años, dolor de huesos en las piernas, moretones fáciles. A la exploración, bazo aumentado. Biometría con plaquetas bajas y anemia leve. Ha visto a 4 especialistas.'],
    ['Ardor en manos y pies','Hombre de 19 años. Ardor en manos y pies desde los 9 años que empeora con el ejercicio y la fiebre; casi no suda; dolor abdominal y diarrea frecuentes; pequeñas manchas rojo violáceas alrededor del ombligo. Proteína en orina. Ha visto a 5 especialistas.'],
    ['Niño con infecciones y rasgos toscos','Niño de 3 años. Infecciones de oído y respiratorias de repetición desde el primer año, ronquido y pausas al dormir, hernia umbilical operada, rasgos faciales toscos, lengua grande, hígado y bazo palpables, rigidez en las manos. Ha visto a 4 especialistas.'],
    ['Recién nacido con ampollas','Recién nacido de 10 días con ampollas en manos, pies y rodillas que aparecen con el roce mínimo; erosiones en la boca al alimentarse. Sin antecedentes familiares conocidos. Lo han visto 2 especialistas.']];
  var T=PD.tamiz||{panel:[],mort:{}},mx=Math.max.apply(null,T.panel.map(function(p){return p.v;}).concat([1]));
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-m">Para el médico de primer contacto</span><h1>Clara</h1><p>Cuéntale el caso como se lo contarías a un colega. Clara te hace las preguntas que faltan y te orienta: qué sospechar, qué explorar y a dónde referir.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile s3 r3 c-m" id="cons"><div class="who">'+ava()+'<div><h3>Clara</h3><p>Consulta guiada · no diagnostica, orienta</p></div><span class="hdr-r">'+callBtn('Clara')+voiceToggle()+'</span></div><p class="callst" id="cst" aria-live="polite"></p>'+
     '<div class="log" id="clog" aria-live="polite"></div>'+
     '<div id="cin"></div></div>'+
    '<div class="tile c-p"><span class="tk">El tiempo cuenta</span><div class="big">4.7 <small>años</small></div><p>tarda en promedio un diagnóstico en Europa; los adolescentes esperan 10.4.</p><span class="src">'+srcA(SRC_DX)+'</span></div>'+
    '<div class="tile c-y"><span class="tk">Tamiz al nacer</span><p style="margin-bottom:2px">Sin tamiz ampliado, la mortalidad fue casi el doble:</p><div class="big">'+(T.mort.no||'')+'% <small>vs '+(T.mort.si||'')+'%</small></div><a class="src" href="'+esc(T.mort.url||'#')+'" target="_blank" rel="noopener">'+esc(T.mort.src||'')+' ↗</a></div>'+
    '<div class="tile c-v"><span class="tk">Casos de ejemplo</span><p>Cárgalo y Clara empieza a orientar.</p><div class="chips" id="ejs" style="gap:6px">'+EJ.map(function(e,i){return '<button type="button" data-i="'+i+'" style="font-size:12.5px;padding:6px 11px">'+esc(e[0])+'</button>';}).join('')+'</div></div>'+
    '<div class="tile s4 c-g"><span class="tk">¿Qué se buscó en este bebé al nacer?</span><p>El tamiz neonatal depende de dónde nació. Preguntarlo cambia la sospecha.</p><div class="tz">'+T.panel.map(function(p){return '<div class="'+(/Referencia/.test(p.n)?'ref':'')+'" title="'+esc(p.nota)+'"><span>'+esc(p.n)+'</span><span class="bar"><i style="width:'+Math.round(p.v/mx*100)+'%"></i></span><b>'+p.v+'</b></div>';}).join('')+'</div><a class="src" href="#/acervo?d=tamiz">Fuentes: IMSS, Rev Mex Pediatr, CNEGSR, HRSA · ver fichas del tamiz →</a></div>'+
   '</div></div></section>';
  var clog=$('#clog'),cin=$('#cin'),av=$('#cons .ava');bindVoiceToggle($('#cons'));
  $('#cons .callbtn').onclick=function(){if(!CALL.o){voice.stop();cin.innerHTML='';}
    startCall({agente:'clara',nombre:'Clara',ava:av,btn:this,vars:{},status:function(t){$('#cst').textContent=t;if(!CALL.o&&!cin.innerHTML)(t?inputCaso():endButtons());},
      say:function(w,t){clog.appendChild(h('div','bb '+w,esc(t)));clog.scrollTop=1e6;},
      tools:voiceTools(clog,{mostrar_orientacion:function(p){p=p||{};var d=String(p.enfermedad||'').toLowerCase(),lv=String(p.nivel||'').toLowerCase();
        clog.appendChild(h('div','box','<b>'+esc(DSHORT[d]||p.enfermedad||'Orientación')+'</b>'+(lv?'<span class="lvl '+esc(lv)+'">Sospecha '+esc(lv)+'</span>':'')+(p.razon?'<p style="margin-top:6px">'+esc(p.razon)+'</p>':'')+(p.siguiente_paso?'<p style="margin-top:8px"><b>Siguiente paso</b></p><p>'+esc(p.siguiente_paso)+'</p>':'')+(p.referencia?'<p style="margin-top:8px"><b>Referir a</b></p><p>'+esc(p.referencia)+'</p>':'')+(DIS[d]?'<a class="go" href="#/atlas?d='+d+'" style="display:inline-block;margin-top:8px;text-decoration:none">Dónde referir en el Atlas →</a>':'')));
        clog.scrollTop=1e6;return 'Orientación mostrada en pantalla.';}})});};
  function say(html,spoken){var b=h('div','bb a',html);clog.appendChild(b);clog.scrollTop=1e6;if(spoken)voice.speak(spoken,av);return b;}
  function me(t){clog.appendChild(h('div','bb u',esc(t)));clog.scrollTop=1e6;}
  function inputCaso(){cin.innerHTML='<form class="row" id="cf"><input id="ci" placeholder="Edad, sexo, qué ves, cuántos especialistas lo han visto…" maxlength="900" aria-label="Describe el caso">'+MIC+'<button class="btn" type="submit">Enviar</button></form>';
    var f=$('#cf'),i=$('#ci');dictado($('#cf .mic'),i,function(){f.requestSubmit();});
    f.onsubmit=function(e){e.preventDefault();var t=i.value.trim();if(t&&!busy)paso1(t);};}
  function start(){voice.stop();stage='caso';caso='';preguntas=[];resp={};clog.innerHTML='';
    say('Hola, soy Clara. Cuéntame del paciente con tus palabras: edad, sexo, qué te preocupa, qué encontraste y cuántos especialistas lo han visto. Puedes escribirlo o dictarlo.');inputCaso();}
  $$('#ejs button').forEach(function(b){b.onclick=function(){if(busy)return;start();paso1(EJ[+b.dataset.i][1]);};});
  function frAll(t,k){return cSearch(t+' sospecha diagnóstico confirmación referencia signos',k,function(d){return d.publico!=='familia'&&d.enfermedad!=='general';});}
  function bias(o){var a=[],e=+o.edad,esp=+o.especialistas;
    if(e>=10&&e<=19)a.push('Adolescente: es el grupo con mayor retraso diagnóstico, 10.4 años en promedio.');
    if(o.sexo==='F')a.push('Mujer: el retraso promedio es de 5.4 años, frente a 3.7 en hombres.');
    if(esp>10)a.push('Haber consultado a más de 10 especialistas se asocia con 2.6 veces más probabilidad de retraso.');else if(esp>=3)a.push('Ya pasó por '+esp+' especialistas sin diagnóstico: la ruta se está alargando.');
    return a;}
  async function paso1(t){busy=true;caso=t;me(t);cin.innerHTML='';var w=say('<span class="wait">Leyendo el caso</span>');
    var fr=frAll(t,10);
    var prompt='Eres Clara, apoyo para médicos de primer contacto (pediatría, medicina general, medicina interna) del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. El médico te describe un caso. Tu tarea ahora NO es diagnosticar: es identificar los datos clave y hacer de 2 a 3 preguntas breves que más ayuden a orientar la sospecha, apoyándote en los FRAGMENTOS (que cubren piel de mariposa, enfermedad de Gaucher, enfermedad de Fabry, síndrome de Hunter y tamiz neonatal en México). Si el paciente es menor de 2 años o el dato es relevante, una de las preguntas debe ser si tuvo tamiz neonatal y en qué institución nació. Cada pregunta con 2 a 4 opciones cortas.\n\nCASO: '+t+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nDevuelve SOLO un objeto JSON: {"edad":número o null,"sexo":"F"|"M"|null,"especialistas":número o null,"resumen":"el caso en una línea, máximo 25 palabras","preguntas":[{"q":"pregunta, máximo 14 palabras","opciones":["...","..."]}]}';
    var j=null;try{j=await aiJson(prompt);}catch(e){}
    if(!j||!j.preguntas||!j.preguntas.length){w.innerHTML='<span class="note">'+esc(errCopy({}))+'</span>';return analizar([],fr);}
    preguntas=j.preguntas.slice(0,3);var b=bias(j);
    w.innerHTML=(j.resumen?'<b>Entendí:</b> '+esc(j.resumen)+'<br><br>':'')+'Para orientarte mejor, ayúdame con '+(preguntas.length===1?'una pregunta':preguntas.length+' preguntas')+':';
    if(b.length)clog.appendChild(h('div','box alert','<b>Alerta de sesgo</b> · '+b.map(esc).join(' ')+'<div class="note" style="margin-top:6px">Fuentes: '+srcA(SRC_DX)+' · '+srcA(SRC_ESP)+'</div>'));
    voice.speak((j.resumen?'Entendí: '+j.resumen+'. ':'')+'Para orientarte mejor, ayúdame con estas preguntas.',av);
    var k=0;function next(){if(k>=preguntas.length){analizar(preguntas.map(function(p,i){return p.q+' → '+(resp[i]||'sin dato');}),fr);return;}
      var p=preguntas[k];say('<b>'+esc(p.q)+'</b>');
      cin.innerHTML='<div class="chips" id="op">'+(p.opciones||[]).concat(['No sé']).map(function(o){return '<button type="button">'+esc(o)+'</button>';}).join('')+'</div>';
      $$('#op button').forEach(function(bt){bt.onclick=function(){resp[k]=bt.textContent;me(bt.textContent);k++;next();};});}
    busy=false;next();}
  async function analizar(qa,fr){busy=true;cin.innerHTML='';var w=say('<span class="wait">Revisando las guías</span>');
    fr=frAll(caso+' '+qa.join(' '),9);
    var prompt='Eres Clara, apoyo para médicos de primer contacto del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. No diagnosticas: orientas la sospecha. Usa SOLO los FRAGMENTOS como evidencia y cita sus etiquetas. Las enfermedades que cubre el Acervo son: eb (piel de mariposa, epidermólisis bullosa), gaucher (enfermedad de Gaucher), fabry (enfermedad de Fabry) y mps (síndrome de Hunter). Si ninguna encaja, dilo y sugiere ampliar el estudio con genética.\n\nCASO: '+caso+(qa.length?'\nRESPUESTAS DEL MÉDICO:\n'+qa.join('\n'):'')+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nDevuelve SOLO un objeto JSON: {"candidatas":[{"enfermedad":"eb"|"gaucher"|"fabry"|"mps","nivel":"alta"|"media"|"baja","razon":"máximo 30 palabras","coinciden":["máximo 4"],"explorar":["máximo 3"]}],"ninguna":"si ninguna encaja, explica en 25 palabras; si no, vacío","siguiente_paso":"máximo 35 palabras","referencia":"a qué servicio referir, máximo 20 palabras","tamiz":"una frase sobre el tamiz neonatal si aplica, o vacío","fuentes":["g2"]}. Ordena candidatas de mayor a menor sospecha; máximo 2.';
    var j=null;try{j=await aiJson(prompt);}catch(e){}
    if(!j){var top=fr.slice(0,3);w.innerHTML='<span class="note">'+esc(errCopy({}))+'</span>'+top.map(function(d,i){return '<p style="margin-top:8px"><b>'+esc(d.tema)+'.</b> '+esc(d.texto)+'<sup class="c">'+(i+1)+'</sup></p>';}).join('')+srcLinks(top.map(function(d){return d.id;}));endButtons();busy=false;return;}
    var li=function(a){return (a&&a.length)?'<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';};
    var ids=(j.fuentes||[]).map(function(x){return String(x).toLowerCase();}).filter(function(x){return CBY[x];});
    w.remove();
    (j.candidatas||[]).forEach(function(c){var lv=String(c.nivel||'').toLowerCase();
      clog.appendChild(h('div','box','<b>'+esc(DIS[c.enfermedad]?DSHORT[c.enfermedad]:c.enfermedad)+'</b><span class="lvl '+esc(lv)+'">Sospecha '+esc(lv)+'</span><p style="margin-top:6px">'+esc(c.razon||'')+'</p>'+(c.coinciden&&c.coinciden.length?'<p style="margin-top:8px"><b>Coinciden</b></p>'+li(c.coinciden):'')+(c.explorar&&c.explorar.length?'<p style="margin-top:8px"><b>Falta explorar</b></p>'+li(c.explorar):'')+(DIS[c.enfermedad]?'<a class="go" href="#/atlas?d='+c.enfermedad+'" style="display:inline-block;margin-top:8px;text-decoration:none">Dónde referir en el Atlas →</a>':'')));});
    if(j.ninguna)clog.appendChild(h('div','box','<b>Fuera de lo que cubre el Acervo</b><p style="margin-top:6px">'+esc(j.ninguna)+'</p>'));
    clog.appendChild(h('div','box','<b>Siguiente paso</b><p>'+esc(j.siguiente_paso||'')+'</p><p style="margin-top:8px"><b>Referir a</b></p><p>'+esc(j.referencia||'')+'</p>'+(j.tamiz?'<p style="margin-top:8px"><b>Tamiz neonatal</b></p><p>'+esc(j.tamiz)+'</p>':'')+srcLinks(ids)));
    clog.scrollTop=1e6;
    var c0=(j.candidatas||[])[0];
    voice.speak((c0?'Sospecha '+(c0.nivel||'')+' de '+(DIS[c0.enfermedad]||c0.enfermedad)+'. '+(c0.razon||'')+' ':(j.ninguna||''))+' Siguiente paso: '+(j.siguiente_paso||'')+' Referir a: '+(j.referencia||'')+'. Recuerda: yo oriento la sospecha; el diagnóstico lo hace el especialista.',av);
    endButtons();busy=false;}
  function endButtons(){cin.innerHTML='<div class="chips"><button type="button" id="nuevo">Nuevo caso</button></div>';$('#nuevo').onclick=start;}
  start();
};

/* ---------- Atlas (noche) ---------- */
var LAY={h:{c:'#00C8D6',n:'Hospitales con experiencia'},a:{c:'#FF4FD8',n:'Asociaciones de pacientes'},t:{c:'#F2D14B',n:'Ensayos clínicos'}};
V.atlas=function(q){
  var A=PD.atlas,dis=DIS[q.d]?q.d:'all',on={h:1,a:1,t:1},sel=null,area=null;
  var T=PD.tamiz||{panel:[],mort:{}},mx=Math.max.apply(null,T.panel.map(function(p){return p.v;}).concat([1]));
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-y">Para quien decide</span><h1>Atlas</h1><p>Dónde hay atención para las enfermedades poco frecuentes en México, dónde no, y qué se le busca a cada bebé al nacer según dónde nace.</p></div>'+
   '<div class="chips" id="az">'+[['all','Todas']].concat(['eb','gaucher','fabry','mps'].map(function(d){return [d,DSHORT[d]];})).map(function(o){return '<button type="button" data-d="'+o[0]+'"'+(dis===o[0]?' class="on"':'')+'>'+o[1]+'</button>';}).join('')+'</div></div>'+
   '<div class="bento">'+
    '<div class="tile c-b" id="k-h"></div><div class="tile c-m" id="k-a"></div><div class="tile c-y" id="k-t"></div><div class="tile c-g" id="k-e"></div>'+
    '<div class="tile s3 r3" style="padding:10px"><div class="map" id="map" style="border:0;background:transparent;padding:0"></div><div class="legend" id="leg" style="padding:0 8px 6px"></div></div>'+
    '<div class="tile r3 plt"><div class="plist" id="pl" aria-live="polite"></div></div>'+
    '<div class="tile s3 c-p"><span class="tk">El tamiz neonatal: lo que se busca en un bebé según dónde nace</span><div class="tz">'+T.panel.map(function(p){return '<div class="'+(/Referencia/.test(p.n)?'ref':'')+'"><span>'+esc(p.n)+'<br><small class="note">'+esc(p.nota)+'</small></span><span class="bar"><i style="width:'+Math.round(p.v/mx*100)+'%"></i></span><b>'+p.v+'</b></div>';}).join('')+'</div><a class="src" href="#/acervo?d=tamiz">Fuentes: '+esc(T.panel.map(function(p){return p.src;}).join(' · '))+' · ver fichas →</a></div>'+
    '<div class="tile c-y"><span class="tk">Lo que cuesta no tamizar</span><div class="big">'+(T.mort.no||'')+'% <small>vs '+(T.mort.si||'')+'%</small></div><p>mortalidad en niños con errores innatos del metabolismo sin y con tamiz ampliado.</p><a class="src" href="'+esc(T.mort.url||'#')+'" target="_blank" rel="noopener">'+esc(T.mort.src||'')+' ↗</a></div>'+
   '</div><div class="demo-flag">Solo datos públicos y agregados por institución. El Atlas nunca muestra información de pacientes individuales. Corte: '+esc(new Date(A.corte+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}))+'.</div>'+
  '</div></section>';
  function pts(){return A.pts.filter(function(p){return on[p.l]&&(dis==='all'||p.d.indexOf(D2K[dis])>=0);});}
  function clusters(P){var g={};P.filter(function(p){return p.px!=null;}).forEach(function(p){var k=Math.round(p.px/24)+'_'+Math.round(p.py/24);(g[k]=g[k]||[]).push(p);});
    return Object.keys(g).map(function(k){var a=g[k],x=0,y=0,cnt={};a.forEach(function(p){x+=p.px;y+=p.py;cnt[p.l]=(cnt[p.l]||0)+1;});
      var top=Object.keys(cnt).sort(function(m,n){return cnt[n]-cnt[m];})[0];return {k:k,pts:a,x:x/a.length,y:y/a.length,l:top,mixed:Object.keys(cnt).length>1};});}
  function draw(){var P=pts(),states={};P.forEach(function(p){if(p.s!=null)states[p.s]=1;});
    var cnt=function(l){return A.pts.filter(function(p){return p.l===l&&(dis==='all'||p.d.indexOf(D2K[dis])>=0);}).length;};
    $('#k-h').innerHTML='<span class="tk">Hospitales</span><div class="big">'+cnt('h')+'</div><p>con experiencia documentada</p>';
    $('#k-a').innerHTML='<span class="tk">Asociaciones</span><div class="big">'+cnt('a')+'</div><p>de pacientes identificadas</p>';
    $('#k-t').innerHTML='<span class="tk">Ensayos clínicos</span><div class="big">'+cnt('t')+'</div><p>con sede en México</p>';
    var covered=Object.keys(states).length,CL=clusters(P);
    $('#k-e').innerHTML='<span class="tk">Sin atención</span><div class="big">'+(32-covered)+' <small>de 32</small></div><p>entidades sin un punto identificado en esta vista</p>';
    if(area&&!CL.some(function(c){return c.k===area;}))area=null;
    $('#map').innerHTML='<svg viewBox="60 0 940 640" role="img" aria-label="Mapa de México con '+P.length+' puntos de atención">'+A.mx.p.map(function(p,i){return '<path d="'+p.d+'" class="'+(states[i]?'has':'')+'"><title>'+esc(p.n)+'</title></path>';}).join('')+
      CL.map(function(c){var n=c.pts.length,r=n>1?13+Math.sqrt(n)*4:10;return '<g class="cl" data-k="'+c.k+'" tabindex="0" role="button" aria-label="'+n+' puntos en '+esc(c.pts[0].c)+'" style="cursor:pointer"><circle cx="'+c.x+'" cy="'+c.y+'" r="'+r+'" fill="'+LAY[c.l].c+'" class="'+(area===c.k?'sel':'')+'"'+(c.mixed?' stroke-dasharray="4 3"':'')+'/>'+(n>1?'<text x="'+c.x+'" y="'+(c.y+5)+'" text-anchor="middle" style="font:800 15px Manrope,sans-serif;fill:#06121c;pointer-events:none">'+n+'</text>':'')+'</g>';}).join('')+'</svg>';
    $$('#map .cl').forEach(function(g){var pick=function(){area=area===g.dataset.k?null:g.dataset.k;sel=null;draw();};g.onclick=pick;g.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}};});
    $('#leg').innerHTML=['h','a','t'].map(function(l){return '<button type="button" data-l="'+l+'" class="'+(on[l]?'':'off')+'" aria-pressed="'+(!!on[l])+'"><i style="background:'+LAY[l].c+'"></i>'+LAY[l].n+'</button>';}).join('');
    $$('#leg button').forEach(function(b){b.onclick=function(){on[b.dataset.l]=on[b.dataset.l]?0:1;draw();};});
    var ac=area&&CL.filter(function(c){return c.k===area;})[0],L=(ac?ac.pts:P).slice().sort(function(a,b){return a.l.localeCompare(b.l);});
    $('#pl').innerHTML=(ac?'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>'+ac.pts.length+' en '+esc(ac.pts[0].c.replace(/\s*\(.*$/,''))+'</b><button type="button" class="wb" id="all">Ver todos</button></div>':'<span class="tk">Toca un círculo del mapa</span>')+
      L.map(function(p){var i=A.pts.indexOf(p);return '<div class="pt'+(p===sel?' sel':'')+'" data-i="'+i+'" tabindex="0" style="border-left:3px solid '+LAY[p.l].c+'"><b>'+esc(p.n)+'</b><span class="c">'+esc(p.c)+' · '+p.d.map(function(k){return DSHORT[K2D[k]];}).join(', ')+'</span>'+(p===sel?'<p>'+esc(p.x)+'</p>'+(p.more||[]).map(function(m){return '<p>'+esc(m.x)+'</p>';}).join(''):'')+'<a href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></div>';}).join('')||'<p class="note">Sin puntos para este filtro.</p>';
    var all=$('#all');if(all)all.onclick=function(){area=null;draw();};
    $$('#pl .pt').forEach(function(el){var t=function(e){if(e.target.tagName==='A')return;var p=A.pts[+el.dataset.i];sel=sel===p?null:p;draw();};el.onclick=t;el.onkeydown=function(e){if(e.key==='Enter')t(e);};});}
  $$('#az button').forEach(function(b){b.onclick=function(){$$('#az button').forEach(function(x){x.classList.toggle('on',x===b);});dis=b.dataset.d;sel=null;area=null;draw();};});
  draw();
};

/* ---------- Asociaciones (luz clara) ---------- */
V.asociaciones=function(){
  var A=PD.atlas.pts.filter(function(p){return p.l==='a';}),col=['c-m','c-b','c-v','c-g','c-p'];
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-m">Para asociaciones de pacientes</span><h1>Su causa, en el centro del Acervo</h1><p>Las asociaciones participan sin costo. Aportan la cercanía con las familias y validan lo que se publica de su enfermedad; el Observatorio les da visibilidad, herramientas y todo el conocimiento del Acervo.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile c-p"><span class="tk">Visibilidad</span><h3>Ficha propia</h3><p>Perfil en el directorio y presencia en el Atlas, en Rumbo y en Clara cuando alguien pregunta por su enfermedad.</p></div>'+
    '<div class="tile c-v"><span class="tk">Contenido</span><h3>Voz en el Acervo</h3><p>Testimonios, guías y eventos. Revisan y aprueban lo que se dice de su enfermedad antes de publicarse.</p></div>'+
    '<div class="tile c-g"><span class="tk">Herramientas</span><h3>Para crecer</h3><p>Registro de pacientes con consentimiento, convocatorias de financiamiento y materiales para su incidencia.</p></div>'+
    '<div class="tile ink"><span class="tk" style="color:#FF8FB1">Sin costo</span><div class="big">$0</div><p style="color:#cfd8e3">El Observatorio lo sostienen laboratorios que patrocinan conocimiento, no producto.</p></div>'+
    A.map(function(p,i){return '<article class="tile s2 '+col[i%5]+'"><span class="tk">'+p.d.map(function(k){return DSHORT[K2D[k]];}).join(' · ')+'</span><h3>'+esc(p.n)+'</h3><p class="note">'+esc(p.c)+'</p><p>'+esc(p.x)+'</p><a class="src" href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></article>';}).join('')+
    '<form class="tile s2 c-y" id="join"><span class="tk">Súmese</span><h3>Solicitud para formar parte</h3>'+
     '<div class="field"><label for="jn">Nombre de la asociación</label><input id="jn" required></div>'+
     '<div class="field"><label for="je">Enfermedad o grupo de enfermedades</label><input id="je" required></div>'+
     '<div class="field"><label for="jc">Ciudad o estado</label><input id="jc"></div>'+
     '<button class="btn" type="submit" style="align-self:flex-start">Enviar solicitud</button><p class="note" id="jmsg">Demostración: este formulario no envía ni guarda datos.</p></form>'+
   '</div></div></section>';
  $('#join').onsubmit=function(e){e.preventDefault();$('#jmsg').textContent='Listo. En la versión final, esta solicitud llega al equipo del Observatorio. En esta demostración no se guardó nada.';};
};

/* ---------- Barómetro ---------- */
V.barometro=function(){
  var url=location.origin+'/#votar';
  view.innerHTML='<section class="blk"><div class="wrap">'+
   '<div class="pagehero" style="--img:url(/obs/img/brand/faro-manos.webp)"><span class="kick y">Para foros y el Senado</span><h1>Barómetro en Vivo</h1><p class="lead">La primera medición mexicana de cómo se vive con una enfermedad poco frecuente. Los asistentes votan desde su celular, las barras se llenan al momento en la pantalla y cada resultado se compara con España.</p></div>'+
   '<div class="grid g2" style="margin-top:26px;align-items:start">'+
    '<div class="card"><h3>Cómo funciona en la sala</h3><ul style="margin:10px 0 0 18px;display:flex;flex-direction:column;gap:6px"><li>Cada asistente escanea el código y vota.</li><li>Dos preguntas de opción única y una de opción múltiple, con los mismos reactivos del barómetro español.</li><li>Después del foro se publica el informe con la pregunta de jerarquía: el primer barómetro mexicano.</li></ul>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="btn" href="/#votar">Abrir la votación</a><a class="btn ghost" href="/">Ver la presentación</a></div></div>'+
    '<div class="card"><h3>Liga para votar</h3><p class="note" style="margin-top:6px">Esta es la dirección que va en el código QR de la sala.</p><p style="margin-top:12px;word-break:break-all"><b>'+esc(url)+'</b></p><p class="note" style="margin-top:12px">Comparación: '+srcA(SRC_DX)+'.</p></div>'+
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
  document.body.classList.toggle('home',name==='inicio');document.body.classList.toggle('light',name==='rumbo'||name==='asociaciones');solidHead();
  FX.go(name);view.classList.remove('enter');void view.offsetWidth;view.classList.add('enter');firstRoute=false;
  document.title=(name==='inicio'?'':({acervo:'Acervo',rumbo:'Rumbo',clara:'Clara',atlas:'Atlas',asociaciones:'Asociaciones',barometro:'Barómetro'})[name]+' · ')+'Observatorio · Enfermedades Poco Frecuentes';}

fetch('/obs/acervo.json').then(function(r){return r.json();}).then(function(d){
  PD=d;C=PD.corpus||[];C.forEach(function(x){CBY[x.id]=x;});
  cSearch=Index(C,function(x){return x.tema+' '+x.tema+' '+x.texto;});
  RM=PD.rumbo||RM;RM.w.forEach(function(w){RW[w.id]=w;});
  window.addEventListener('hashchange',route);route();
}).catch(function(){view.innerHTML='<section class="blk"><div class="wrap"><h2>No se pudo cargar el Acervo</h2><p class="lead">Recarga la página.</p></div></section>';});
})();
