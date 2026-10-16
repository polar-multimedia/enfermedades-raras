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
var K2D={e:'eb',g:'gaucher',f:'fabry',m:'mps'};
/* registro de enfermedades: las 4 originales + las que llegan en acervo.json */
var GRUPOS=[
  {k:'tamiz',t:'Le salió alterado el tamiz del talón',s:'Enfermedades del metabolismo y de las hormonas que se buscan al nacer'},
  {k:'musculo',t:'Debilidad en los músculos',s:'No sostiene la cabeza, se cae seguido, se cansa o le cuesta respirar'},
  {k:'sangre',t:'Sangra mucho o le salen moretones',s:'Sangrados que tardan en parar, golpes que se hinchan'},
  {k:'piel',t:'Ampollas o heridas en la piel',s:'La piel se lastima con un roce mínimo'},
  {k:'lisosomal',t:'Huesos, crecimiento, bazo grande o rasgos que cambian',s:'Dolor de huesos, talla baja, articulaciones rígidas, infecciones seguidas'},
  {k:'dolor',t:'Ardor en manos y pies',s:'Dolor que quema, casi no suda; con los años afecta riñón y corazón'}];
var BASE4=[
  {key:'eb',nombre:'Piel de mariposa (epidermólisis bullosa)',corto:'Piel de mariposa',grupo:'piel',familia:'La piel es tan frágil que se lastima y forma ampollas con un roce mínimo, como las alas de una mariposa.',sinonimos:['epidermolisis bullosa','EB','ampollas','ampollas al nacer','piel fragil','heridas en la piel','se le levanta la piel','DEBRA'],senales:['Ampollas con roces mínimos desde el nacimiento','Heridas en la boca al comer','Uñas que se caen o se engrosan','Heridas que tardan en sanar']},
  {key:'gaucher',nombre:'Enfermedad de Gaucher',corto:'Gaucher',grupo:'lisosomal',familia:'Falta una enzima y se acumula grasa en bazo, hígado y huesos: panza grande, moretones, cansancio y dolor de huesos.',sinonimos:['gaucher','bazo grande','panza grande','plaquetas bajas','moretones','dolor de huesos','cansancio','enzima'],senales:['Panza que crece por bazo o hígado grandes','Moretones y sangrado de nariz','Cansancio y anemia','Dolor de huesos o fracturas']},
  {key:'fabry',nombre:'Enfermedad de Fabry',corto:'Fabry',grupo:'dolor',familia:'Falta una enzima y se acumula grasa en vasos y nervios: ardor en manos y pies; con los años afecta riñón y corazón.',sinonimos:['fabry','ardor en manos','ardor en pies','dolor quemante','no suda','manchitas rojas','riñon','proteina en orina'],senales:['Ardor en manos y pies, sobre todo con calor o ejercicio','Casi no suda','Manchitas rojo oscuro en la piel','Dolor de panza y diarrea frecuentes']},
  {key:'mps',nombre:'Síndrome de Hunter (MPS II)',corto:'Hunter (MPS II)',grupo:'lisosomal',familia:'Falta una enzima y se acumulan sustancias en todo el cuerpo: rasgos que cambian, articulaciones rígidas e infecciones seguidas.',sinonimos:['hunter','mucopolisacaridosis','MPS II','MPS 2','rasgos toscos','hernia','ronca','infecciones de oido','articulaciones rigidas'],senales:['Infecciones de oído y respiratorias seguidas','Ronca o hace pausas al dormir','Rasgos de la cara que se van engrosando','Manos y articulaciones rígidas']}];
var ENF=BASE4.slice(),ENFBY={};BASE4.forEach(function(e){ENFBY[e.key]=e;});
var GCOL={tamiz:'c-p',musculo:'c-b',sangre:'c-m',piel:'c-m',lisosomal:'c-g',dolor:'c-v'};
function initDis(list){(list||[]).forEach(function(e){if(ENFBY[e.key])return;ENF.push(e);ENFBY[e.key]=e;});
  ENF.forEach(function(e){DIS[e.key]=DIS[e.key]||e.nombre;DSHORT[e.key]=DSHORT[e.key]||e.corto;if(!DCOL[e.key])DCOL[e.key]=GCOL[e.grupo]||'c-b';});}
function disOptions(cur,all){return (all?'<option value="all"'+(cur==='all'?' selected':'')+'>Todas las enfermedades</option>':'')+GRUPOS.map(function(g){var L=ENF.filter(function(e){return e.grupo===g.k;});return L.length?'<optgroup label="'+esc(g.t)+'">'+L.map(function(e){return '<option value="'+e.key+'"'+(cur===e.key?' selected':'')+'>'+esc(e.corto===e.nombre?e.nombre:e.corto+' · '+e.nombre)+'</option>';}).join('')+'</optgroup>':'';}).join('');}
function disMatch(q){q=fold(q).trim();if(q.length<2)return [];var qt=q.split(/\s+/).filter(function(w){return w.length>2&&!STOP[w]&&!/^(mucho|mucha|poco|salio|tiene|bebe|nino|nina|hijo|hija)$/.test(w);});
  return ENF.map(function(e){var hay=fold([e.nombre,e.corto].concat(e.sinonimos||[]).join(' | ')),s=0;
    if(hay.indexOf(q)>=0)s+=6;(e.sinonimos||[]).forEach(function(w){if(fold(w).indexOf(q)===0)s+=3;});qt.forEach(function(t){if(hay.indexOf(t.slice(0,6))>=0)s+=1.5;});return [s,e];})
   .filter(function(x){return x[0]>0;}).sort(function(a,b){return b[0]-a[0];}).filter(function(x,i,arr){return x[0]>=Math.max(1.5,arr[0][0]*.6);}).slice(0,5).map(function(x){return x[1];});}
var SRC_DX={t:'EURORDIS, Rare Barometer: encuesta a más de 10,000 pacientes en 42 países (2024)',u:'https://www.eurordis.org/survey-reveals-lengthy-diagnostic-delays'},
    SRC_ESP={t:'Benito-Lozano et al., Int J Environ Res Public Health 2022 (Registro Español de Pacientes, 1,216 personas)',u:'https://repisalud.isciii.es/entities/publication/feeadffd-12e4-49be-a62e-cda35bb99713'},
    SRC_DISC={t:'EURORDIS, Rare Barometer: encuesta a 9,591 personas en 43 países (feb. 2025)',u:'https://www.eurordis.org/rare-barometer-findings-daily-life-survey'};
function srcA(o){return '<a href="'+o.u+'" target="_blank" rel="noopener">'+esc(o.t)+' ↗</a>';}
var WEBER=SRC_DX.t;
function seg(cur,all){return '<div class="seg" role="tablist">'+(all?'<button data-d="all"'+(cur==='all'?' class="on"':'')+'>Todas</button>':'')+['eb','gaucher','fabry','mps'].map(function(d){return '<button data-d="'+d+'"'+(cur===d?' class="on"':'')+'>'+DSHORT[d]+'</button>';}).join('')+'</div>';}
function bindSeg(root,fn){$$('.seg button',root).forEach(function(b){b.onclick=function(){$$('button',b.parentNode).forEach(function(x){x.classList.toggle('on',x===b);});fn(b.dataset.d);};});}

/* ---------- perfil de entrada: familia o médico ---------- */
var PERFIL=null;try{PERFIL=localStorage.getItem('obs-perfil');}catch(e){}
function tx(t,u){return PERFIL==='fam'?t:u;}
function applyPerfil(){var b=document.body;b.classList.toggle('fam',PERFIL==='fam');b.classList.toggle('med',PERFIL==='med');b.classList.toggle('pres',PERFIL==='pres');
  if(PERFIL==='med'||PERFIL==='pres'){MED=true;try{sessionStorage.setItem('obs-medico','1');}catch(e){}}else if(PERFIL==='fam'){MED=false;try{sessionStorage.removeItem('obs-medico');}catch(e){}}
  var pb=document.getElementById('perfilBtn');if(pb){pb.onclick=entrada;pb.setAttribute('aria-label','Perfil: '+(PERFIL==='med'?'médico':PERFIL==='fam'?'familia':'sin elegir')+'. Cambiar');}if(pb)pb.innerHTML='<img src="/obs/img/brand/rayos.svg" alt="" aria-hidden="true">'+(PERFIL==='med'?'Médico':PERFIL==='fam'?'Familia':PERFIL==='pres'?'Presentación':'Elegir perfil');}
function setPerfil(p){PERFIL=p;try{localStorage.setItem('obs-perfil',p);}catch(e){}applyPerfil();}
function entrada(){var old=document.getElementById('entrada');if(old)old.remove();
  var d=h('div','',null);d.id='entrada';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','en-t');
  d.innerHTML='<div class="en-bg" aria-hidden="true"></div><div class="en-in">'+
    '<div class="en-logo"><img class="en-rays" src="/obs/img/brand/rayos.svg" alt="" aria-hidden="true"><img class="en-ico" src="/obs/img/brand/icono.webp" alt=""></div>'+
    '<p class="en-k"><i aria-hidden="true"></i>Capítulo México</p><h1 id="en-t">Observatorio Latinoamericano de Enfermedades Poco Frecuentes</h1>'+
    '<p class="en-s">Para mostrarte lo que te sirve, cuéntanos quién eres.</p>'+
    '<div class="en-opts" id="eno">'+
     '<button type="button" class="en-o fam" data-p="fam"><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><small>Soy paciente o familiar</small><b>Entrar</b><span>Rumbo, el Acervo, el Atlas y las asociaciones, con palabras sencillas.</span></button>'+
     '<button type="button" class="en-o med" data-p="med"><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><small>Soy médico o profesional de la salud</small><b>Entrar</b><span>Todo lo anterior y Clara, la herramienta de orientación clínica.</span></button>'+
    '</div><p class="en-n">Puedes cambiarlo cuando quieras desde el menú.</p><button type="button" class="en-pres" id="enp">Modo presentación</button></div>';
  document.body.appendChild(d);document.body.classList.add('en-open');
  function close(p){setPerfil(p);d.classList.add('out');document.body.classList.remove('en-open');setTimeout(function(){d.remove();},500);
    if(!/^#\/(clara|rumbo|atlas|acervo|asociaciones)/.test(location.hash)||(p==='fam'&&/clara/.test(location.hash)))location.hash='#/';else route();}
  $('.en-o.fam',d).onclick=function(){close('fam');};
  $('#enp',d).onclick=function(){close('pres');};
  $('.en-o.med',d).onclick=function(){$('#eno',d).innerHTML='<form class="en-conf" id="enc"><b>Clara es exclusiva para profesionales de la salud.</b><label class="ckl"><input type="checkbox" id="enck" required> Confirmo que soy médico o profesional de la salud.</label>'+
    '<div class="field"><label for="encd">Cédula profesional <span class="note">(opcional en esta demostración)</span></label><input id="encd" inputmode="numeric" maxlength="10"></div>'+
    '<div class="factions"><button class="btn" type="submit">Entrar</button><button class="btn ghost" type="button" id="enb">Volver</button></div></form>';
    $('#enck').focus();$('#enb').onclick=function(){entrada();};$('#enc').onsubmit=function(e){e.preventDefault();if($('#enck').checked)close('med');};};
  setTimeout(function(){var b=$('.en-o.fam',d);if(b)b.focus();},50);}

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
  var html=esc(text).replace(/\[([a-z]{1,4}\d{1,3}(?:\s*,\s*[a-z]{1,4}\d{1,3})*)\]/gi,function(_,ids){
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
  else if(w.t==='map')H+='<b class="wt">'+esc(w.title)+'</b>'+miniMap(K2D[w.k]||w.k)+'<a class="wb" href="#/atlas?d='+(K2D[w.k]||w.k)+'">Ver en el Atlas</a>';
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

/* ---------- laboratorios con tratamientos en México ---------- */
var LAB_SHOW=['sanofi','takeda','biomarin','roche','biogen','novartis','pfizer','bayer','novo-nordisk','vertex','abbott'];
var LAB_LOGO={sanofi:'sanofi.svg',takeda:'takeda.svg',biomarin:'biomarin.svg',roche:'roche.svg',biogen:'biogen.svg',novartis:'novartis.svg',pfizer:'pfizer.svg',bayer:'bayer.svg',vertex:'vertex.svg',abbott:'abbott.svg'};
var LAB_MARCA={'taliglucerasa alfa':'Elelyso','damoctocog alfa pegol':'Jivi','eptacog alfa (FVIIa recombinante)':'NovoSeven'};
function labsData(){return (PD.laboratorios||[]).filter(function(l){return LAB_SHOW.indexOf(l.id)>=0;}).sort(function(a,b){return LAB_SHOW.indexOf(a.id)-LAB_SHOW.indexOf(b.id);});}
function labState(p){var c=String(p.cofepris||'');if(p.cuadro_basico_imss===true)return ['cb','En Cuadro Básico del IMSS'];
  if(/autorizado|aprobado/i.test(c)&&!/no aprobado/i.test(c))return ['ok','Con autorización de Cofepris'];
  if(/contradictorio/i.test(c))return ['rv','Registro por confirmar en México'];
  if(/ensayo/i.test(p.marca||'')||/solo en ensayo|probado en México/i.test(c))return ['tr','En ensayo clínico en México'];
  if(/no aprobado|evaluar/i.test(c))return ['no','Aún no aprobado en México'];
  return ['rv','Registro por confirmar en México'];}
function labName(l){return l.nombre.replace(/\s*\(.*\)$/,'');}
function labRibbon(){var L=labsData(),one=function(copy){return L.map(function(l){var lg=LAB_LOGO[l.id];
  return '<button type="button" class="labc" data-id="'+l.id+'" aria-expanded="false"'+(copy?' aria-hidden="true" tabindex="-1"':'')+' title="'+esc(labName(l))+'">'+(lg?'<img src="/obs/img/labs/'+lg+'" alt="'+esc(labName(l))+'" loading="lazy">':'<b>'+esc(labName(l))+'</b>')+'</button>';}).join('');};
  return '<div class="track">'+one(false)+one(true)+'</div>';}
function bindLabs(){var cur=null;$$('#lg .labc').forEach(function(b){b.onclick=function(){var id=b.dataset.id;cur=cur===id?null:id;
  $$('#lg .labc').forEach(function(x){var on=x.dataset.id===cur;x.classList.toggle('on',on);x.setAttribute('aria-expanded',on);});
  $('#lg').classList.toggle('paused',!!cur);
  var l=labsData().filter(function(x){return x.id===cur;})[0],P=$('#lp');if(!l){P.innerHTML='';return;}
  var by={};l.productos.forEach(function(p){(by[p.enfermedad]=by[p.enfermedad]||[]).push(p);});
  P.innerHTML='<div class="labx"><div class="labx-h"><h3>'+esc(labName(l))+'</h3><button type="button" class="wb" id="lx">Cerrar</button></div>'+(l.mx&&!/investigaci|no detallad|no documentad|no confirmad|no se encontr/i.test(l.mx)?'<p class="note">'+esc(l.mx)+'</p>':'')+
    '<div class="labx-g">'+Object.keys(by).map(function(e){return '<div class="labx-e"><span class="tk">'+esc(e)+'</span>'+by[e].map(function(p){var st=labState(p),mk=p.marca&&!/^\(/.test(p.marca)?p.marca:(LAB_MARCA[p.generico]||'');
      return '<div class="medi"><b>'+esc(mk||p.generico)+'</b>'+(mk?'<span>'+esc(p.generico)+'</span>':'')+'<i class="st '+st[0]+'">'+esc(st[1])+'</i>'+(p.url?'<a href="'+esc(p.url)+'" target="_blank" rel="noopener">'+esc(p.fuente||'Fuente')+' ↗</a>':'')+'</div>';}).join('')+'</div>';}).join('')+'</div></div>';
  $('#lx').onclick=function(){cur=null;P.innerHTML='';$('#lg').classList.remove('paused');$$('#lg .labc').forEach(function(x){x.classList.remove('on');x.setAttribute('aria-expanded','false');});b.focus();};
  P.scrollIntoView({block:'nearest',behavior:'smooth'});};});}

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
  '<p class="hero-hint"><span class="hh-ini"><span class="rs-logo xs"><img src="/obs/img/brand/28wh.webp" alt="" width="28" height="28"></span>Una iniciativa de Twentyeight Women\'s Health</span>Capítulo México · Observatorio Latinoamericano<br>de Enfermedades Poco Frecuentes</p>'+
  '<aside class="pendon" aria-label="Con el respaldo del Senado de la República, LXVI Legislatura"><span class="pd-logo"><img src="/obs/img/brand/senado-lxvi.webp" alt="Senado de la República, LXVI Legislatura" width="96" height="96"></span><small>Con el respaldo del</small><b>Senado de la República</b><em>LXVI Legislatura</em></aside>'+
  '</section>'+
  '<section class="labsband" id="labs"><p class="lb-k">El Acervo se construye con el conocimiento de</p>'+
   '<div class="ribbon" id="lg" aria-label="Laboratorios con tratamientos en México. Toca un logo para ver sus medicamentos.">'+labRibbon()+'</div>'+
   '<div class="wrap"><div class="labp" id="lp" aria-live="polite"></div><p class="note lb-n">'+tx('Toca un logo para ver sus medicamentos y las enfermedades que tratan.','Seleccione un logo para ver sus medicamentos y las enfermedades que tratan.')+' Aparecer aquí no implica patrocinio ni recomendación.</p></div></section>'+
  '<div class="pres-only">'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick m">Por qué un observatorio</span><h2>En Europa ya se mide cuánto tarda un diagnóstico. En Latinoamérica, todavía no.</h2>'+
   '<div class="stats">'+
    '<div class="stat"><b>4.7 años</b><span>tarda en promedio un diagnóstico en Europa</span></div>'+
    '<div class="stat"><b>10.4 años</b><span>esperan los adolescentes, el grupo con mayor retraso</span></div>'+
    '<div class="stat"><b>× 2.6</b><span>más probabilidad de retraso tras consultar a más de 10 especialistas</span></div>'+
    '<div class="stat"><b>× 2.1</b><span>si hay que salir de la propia región para ver a un especialista</span></div>'+
   '</div>'+
   '<p class="note" style="margin-top:16px">Fuentes: '+srcA(SRC_DX)+' · '+srcA(SRC_ESP)+'. Para México se estiman entre 8 y 10 millones de personas con una enfermedad poco frecuente, sin censo nacional (<a href="'+esc(CBY.x2?CBY.x2.url:'#')+'" target="_blank" rel="noopener">Excélsior, feb. 2026</a>). Medir la cifra latinoamericana, empezando por México, es la primera tarea del Observatorio.</p>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick">El Acervo</span><h2>¿Por dónde entras?</h2><p class="sub">Una sola base de conocimiento, cuatro puertas. Cada quien recibe la información a su medida y con la fuente a la vista.</p>'+
   '<div class="grid g4" style="margin-top:22px">'+
    '<a class="door" href="#/rumbo"><span class="who">Soy familia o paciente</span><h3>Rumbo</h3><p>Qué sigue después del diagnóstico: cuidados en casa, trámites, apoyos y a dónde acudir.</p><span class="go">Preguntar a Rumbo →</span></a>'+
    '<a class="door m med-only" href="#/clara"><span class="who">Solo para médicos</span><h3>Clara</h3><p>Para el pediatra y el médico de primer contacto: pensar a tiempo en una enfermedad poco frecuente y saber a dónde referir.</p><span class="go">Analizar un caso →</span></a>'+
    '<a class="door t" href="#/asociaciones"><span class="who">Soy asociación de pacientes</span><h3>Asociaciones</h3><p>Acceso sin costo, directorio, materiales y herramientas para dar a conocer su causa.</p><span class="go">Ver el espacio →</span></a>'+
    '<a class="door y" href="#/atlas"><span class="who">Decido política pública</span><h3>Atlas</h3><p>El mapa de dónde hay atención en México y dónde no: hospitales, asociaciones y ensayos clínicos.</p><span class="go">Abrir el mapa →</span></a>'+
   '</div>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick y">Cómo está hecho</span><h2>Un observatorio que mide. Un acervo que acompaña.</h2>'+
   '<div class="arch"><div class="brandshot"><img src="/obs/img/brand/faro-3d.webp" alt="El faro del Observatorio: una torre con piel de cebra, el símbolo de las enfermedades poco frecuentes, coronada por un ojo con iris de colores y rodeada de rayos de luz en forma de manos" loading="lazy"></div>'+
    '<div class="card"><span class="pill y">El Observatorio</span><h3 style="margin-top:10px">Mide y da la cara</h3><p>Publica el Atlas y los informes, lleva los datos al Senado y firma los informes. Tiene consejo honorífico y presidencia médica.</p></div>'+
    '<div class="card"><span class="pill">El Acervo</span><h3 style="margin-top:10px">Reúne y responde</h3><p>Fichas, entrevistas, videos y asistentes que responden solo con información aprobada. Hoy contiene <b>'+nFichas+' fichas con fuente</b>, <b>'+nVid+' videos</b> y <b>'+nPts+' puntos de atención</b> sobre '+ENF.length+' enfermedades.</p></div>'+
   '</div>'+
   '<p class="sub" style="margin-top:18px">Enfermedades en esta demostración: '+esc(ENF.map(function(e){return e.nombre.replace(/^Enfermedad de /,'');}).join(', '))+'.</p>'+
  '</div></section>'+

  '<section class="blk"><div class="wrap">'+
   '<span class="kick">El corpus del Acervo</span><h2>El conocimiento de los laboratorios, convertido en respuestas con fuente</h2>'+
   '<p class="sub">Los laboratorios que investigan y tratan estas enfermedades en México guardan años de conocimiento: estudios, guías, materiales para pacientes. El Observatorio lo convierte en el corpus del Acervo, para que Rumbo, Clara y el Atlas respondan solo con información revisada.</p>'+
   '<div class="flow3"><div><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><b>Aportan</b><span>Cada laboratorio comparte el conocimiento científico de su área terapéutica.</span></div>'+
    '<div><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><b>Se valida</b><span>Un comité médico y las asociaciones de pacientes revisan cada ficha antes de publicarla.</span></div>'+
    '<div><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><b>Responde con fuente</b><span>Los asistentes solo usan ese corpus y citan de dónde sale cada dato. Conocimiento, no producto.</span></div></div>'+
   '<p class="note" style="margin-top:14px">Los laboratorios de la cinta tienen medicamentos en México para enfermedades del Acervo (Cuadro Básico del IMSS, julio de 2026, y autorizaciones de Cofepris).</p>'+
  '</div></section>'+
  '<section class="blk senado"><div class="wrap">'+
   '<span class="kick m">Desde el Senado</span><h2>Legislar con datos: el Registro Nacional y el Observatorio</h2>'+
   '<div class="sn-g">'+
    '<div class="sn-who"><span class="rs-logo big"><img src="/obs/img/brand/senado-lxvi.webp" alt="Senado de la República, LXVI Legislatura" width="120" height="120"></span>'+
     '<b>Sen. Emmanuel Reyes Carmona</b><span>Presidente de la Comisión de Economía · Integrante de la Comisión de Salud</span>'+
     '<p>Principal promotor del Registro Nacional de pacientes con enfermedades poco frecuentes. Convocó el Primer Foro Bicameral en el Senado.</p></div>'+
    '<figure class="sn-q"><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><blockquote>En México hay familias que tardan años en ponerle nombre a lo que vive su hija o su hijo. Con el Registro Nacional queremos que el Estado sepa cuántas personas viven con una enfermedad poco frecuente y dónde están. El Observatorio nos da algo igual de urgente: un mapa claro de dónde hay atención y dónde no, y un lugar donde las familias y los médicos encuentran información confiable. Desde el Senado respaldamos este esfuerzo, porque legislar con datos es legislar con justicia.</blockquote>'+
     '<figcaption><b>Sen. Emmanuel Reyes Carmona</b><i>Propuesta de mensaje · por validar con su equipo</i></figcaption></figure>'+
   '</div>'+
   '<div class="sn-t">'+[['25 y 26 feb 2026','Primer Foro Bicameral sobre enfermedades poco frecuentes, en el Senado'],['15 abr 2026','La Cámara de Diputados aprueba el Registro Nacional con 440 votos y lo envía al Senado'],['30 sep 2026','Encuentro Iberoamericano en el Senado: se pide aprobar la minuta'],['28 oct 2026','Conversatorio: la financiación de los tratamientos y las experiencias europeas']].map(function(t,i){return '<div class="'+(i===3?'now':'')+'"><b>'+t[0]+'</b><span>'+t[1]+'</span></div>';}).join('')+'</div>'+
   '<h3 style="margin-top:26px">Lo que el Observatorio aporta al Registro</h3>'+
   '<div class="flow3 four"><div><b>Dónde hay atención</b><span>El Atlas ubica '+PD.atlas.pts.filter(function(p){return p.l==='h';}).length+' hospitales con experiencia y muestra los estados sin un solo punto.</span></div>'+
    '<div><b>Qué se busca al nacer</b><span>El tamiz por institución y por estado: '+((PD.tamiz.estados||[]).filter(function(e){return e.cat==='sin_dato';}).length)+' de 32 estados sin dato público.</span></div>'+
    '<div><b>Cuántos faltan por diagnosticar</b><span>La brecha entre personas estimadas y diagnosticadas, enfermedad por enfermedad.</span></div>'+
    '<div><b>Sin costo para el Estado</b><span>Familias y médicos informados con un corpus sostenido por los laboratorios y validado por especialistas.</span></div></div>'+
   '<p class="note" style="margin-top:14px">Fuentes de la cronología: N+ (16 abr 2026), LaSalud.mx (1 mar 2026), Argonmexico (1 oct 2026).</p>'+
  '</div></section>'+
  '</div>';
  heroVideo();bindLabs();
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
    text=text.replace(/\[[a-z]{1,4}\d+(?:\s*,\s*[a-z]{1,4}\d+)*\]/gi,'').replace(/\*\*/g,'');
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
function callBtn(nombre){return '<button type="button" class="callbtn" aria-pressed="false"><i aria-hidden="true"></i><span>Consultar '+nombre+'</span></button>';}
var CALL={c:null,raf:0,o:null};
function endCall(){var c=CALL.c;CALL.c=null;cancelAnimationFrame(CALL.raf);if(c)try{c.endSession();}catch(e){}
  var o=CALL.o;CALL.o=null;if(!o)return;o.ava.classList.remove('live','talk');o.ava.style.removeProperty('--lv');
  o.btn.classList.remove('on');o.btn.setAttribute('aria-pressed','false');o.btn.querySelector('span').textContent='Consultar '+o.nombre;o.btn.disabled=false;o.status('');}
async function startCall(o){
  if(CALL.c||CALL.o){endCall();return;}
  voice.stop();CALL.o=o;o.btn.disabled=true;o.status('Conectando…');
  var cfg=null;try{var r=await fetch('/api/voz?agente='+o.agente);if(r.ok)cfg=await r.json();}catch(e){}
  if(!cfg){CALL.o=null;o.btn.disabled=false;o.status((o.u?'La conversación por voz todavía no está conectada. Mientras, puede escribir o dictar.':'La conversación por voz todavía no está conectada. Mientras, puedes escribir o dictar.'));return;}
  try{var st=await navigator.mediaDevices.getUserMedia({audio:true});st.getTracks().forEach(function(t){t.stop();});}
  catch(e){CALL.o=null;o.btn.disabled=false;o.status('Para consultar a '+o.nombre+(o.u?' necesito permiso para usar su micrófono.':' necesito permiso para usar tu micrófono.'));return;}
  var EL;try{EL=await loadEL();}catch(e){CALL.o=null;o.btn.disabled=false;o.status((o.u?'No pude cargar la voz. Revise su conexión.':'No pude cargar la voz. Revisa tu conexión.'));return;}
  var opts={connectionType:'webrtc',dynamicVariables:o.vars||{},clientTools:o.tools||{},
    onConnect:function(){o.btn.disabled=false;o.btn.classList.add('on');o.btn.setAttribute('aria-pressed','true');o.btn.querySelector('span').textContent='Colgar';o.ava.classList.add('live');o.status((o.u?'Le escucho. Hable con naturalidad.':'Te escucho. Habla con naturalidad.'));},
    onDisconnect:function(){endCall();},
    onError:function(m){console.warn('voz',m);o.status((o.u?'Se cortó la conversación. Intente de nuevo.':'Se cortó la conversación. Intenta de nuevo.'));},
    onModeChange:function(m){if(CALL.o)o.status(m.mode==='speaking'?o.nombre+(o.u?' está hablando… puede interrumpirla.':' está hablando… puedes interrumpirla.'):(o.u?'Le escucho.':'Te escucho.'));},
    onMessage:function(m){if(m&&m.message)o.say(m.source==='user'||m.role==='user'?'u':'a',m.message);}};
  if(cfg.conversationToken)opts.conversationToken=cfg.conversationToken;else opts.agentId=cfg.agentId;
  try{CALL.c=await EL.Conversation.startSession(opts);}catch(e){console.warn(e);CALL.o=null;o.btn.disabled=false;o.status((o.u?'No pude iniciar la conversación. Intente de nuevo.':'No pude iniciar la conversación. Intenta de nuevo.'));return;}
  (function loop(){if(!CALL.c)return;var sp=CALL.c.getOutputVolume?CALL.c.getOutputVolume():0,mi=CALL.c.getInputVolume?CALL.c.getInputVolume():0;
    o.ava.style.setProperty('--lv',Math.min(1,Math.max(sp*1.6,mi*.7)).toFixed(3));CALL.raf=requestAnimationFrame(loop);})();}
window.addEventListener('hashchange',function(){if(CALL.o)endCall();});
/* herramientas que el agente puede usar en pantalla mientras habla */
function voiceTools(log,extra){var t={
  mostrar_fuentes:function(p){var ids=String(p&&p.ids||'').toLowerCase().match(/[a-z]{1,4}\d+/g)||[];ids=ids.filter(function(x){return CBY[x];});if(!ids.length)return 'Sin fuentes con esos identificadores.';
    log.appendChild(h('div','bb a src-only',srcLinks(ids)));log.scrollTop=1e6;return 'Fuentes mostradas en pantalla.';},
  mostrar_tarjeta:function(p){log.appendChild(h('div','box','<b>'+esc(p&&p.titulo||'')+'</b><p style="margin-top:6px">'+esc(p&&p.texto||'')+'</p>'));log.scrollTop=1e6;return 'Tarjeta mostrada.';},
  ir_al_atlas:function(p){var k=String(p&&p.enfermedad||'').toLowerCase(),d=DIS[k]?k:'';log.appendChild(h('div','box','<a class="go" href="#/atlas'+(d?'?d='+d:'')+'" style="text-decoration:none">Ver en el Atlas dónde se atiende'+(d?' '+esc(DSHORT[d].toLowerCase()):'')+' →</a>'));log.scrollTop=1e6;return 'Enlace al Atlas mostrado.';}};
  for(var k in extra)t[k]=extra[k];return t;}

var DCOL={eb:'c-m',gaucher:'c-b',fabry:'c-v',mps:'c-g',general:'c-y',tamiz:'c-p'};
DSHORT.tamiz='Tamiz neonatal';
var EUROPA=srcA(SRC_DISC);

/* ---------- Acervo: pregunta o explora ---------- */
var GCORTO={tamiz:'Detectadas en el tamiz neonatal',musculo:'Músculo y movimiento',sangre:'Sangre y coagulación',piel:'Piel',lisosomal:'Huesos, bazo y crecimiento',dolor:'Dolor, riñón y corazón'};
V.acervo=function(q){
  var dis=q.d||'all',aud=q.p||(PERFIL==='fam'?'familia':'all'),shown=12,ctl=null,E=ENFBY[dis];
  var nOf=function(k){return C.filter(function(d){return d.enfermedad===k;}).length;};
  var SUGQ=PERFIL==='med'?['¿Qué detecta el tamiz del IMSS?','Señales de alarma de AME en lactantes','¿Cómo se confirma la enfermedad de Pompe?','¿Qué hemofilia trata emicizumab?']
    :['¿Qué detecta el tamiz de mi bebé?','¿Qué es la piel de mariposa?','¿La hemofilia tiene tratamiento?','¿Qué apoyos hay para familias?'];
  var special={tamiz:['Tamiz neonatal','Qué se busca al nacer y qué hacer si sale alterado'],general:['Trámites y apoyos','Pensión, credenciales y derechos']};
  var head=dis==='all'?'':(E?E.corto:special[dis]?special[dis][0]:dis);
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk">El Acervo</span><h1>'+(dis==='all'?'Pregunta o explora':esc(head))+'</h1><p>'+(dis==='all'?tx('Escribe tu duda con tus palabras o elige un tema. Cada dato dice de dónde sale.','Escriba su pregunta o elija un tema. Cada dato indica su fuente.'):esc(E?E.nombre+(E.familia?' · '+E.familia:''):special[dis]?special[dis][1]:''))+'</p></div>'+
   (dis!=='all'?'<a class="dpill" href="#/acervo"><span><small>Estás en</small><b>'+esc(head)+'</b></span><em>Todo el Acervo</em></a>':'')+'</div>'+
   '<div class="bento">'+
    '<div class="tile s4 c-b srch"><form class="ask big" id="ask"><span class="pk-ic" aria-hidden="true"></span><input id="q" placeholder="'+(dis==='all'?tx('Pregunta o busca un tema…','Pregunte o busque un tema…'):tx('Pregunta sobre ','Pregunte sobre ')+esc(E?head:head.toLowerCase())+'…')+'" maxlength="300" aria-label="Pregunta al Acervo" autocomplete="off">'+MIC+'<button class="btn" type="submit">Preguntar</button></form>'+
     '<div class="qlive" id="ql"></div>'+
     (dis==='all'?'<div class="chips sq" id="sq">'+SUGQ.map(function(s){return '<button type="button">'+esc(s)+'</button>';}).join('')+'</div>':'')+
     '<div class="answer" id="ans" style="max-width:none"></div></div>'+
    (dis==='all'?
      '<div class="tile s4 thw"><span class="tk">Explora por tema</span><div class="thm">'+
        GRUPOS.map(function(g){var L=ENF.filter(function(e){return e.grupo===g.k;});if(!L.length)return '';
          return '<div class="th '+(GCOL[g.k]||'')+'"><div class="th-h"><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><b>'+esc(GCORTO[g.k]||g.t)+'</b></div><div class="th-l">'+L.map(function(e){return '<a href="#/acervo?d='+e.key+'"><span>'+esc(e.corto)+'</span><em>'+nOf(e.key)+'</em></a>';}).join('')+'</div></div>';}).join('')+
        '<div class="th c-y"><div class="th-h"><img src="/obs/img/brand/rayos-fan.svg" alt="" aria-hidden="true"><b>Para todas</b></div><div class="th-l"><a href="#/acervo?d=tamiz"><span>Tamiz neonatal</span><em>'+nOf('tamiz')+'</em></a><a href="#/acervo?d=general"><span>Trámites y apoyos</span><em>'+nOf('general')+'</em></a></div></div>'+
      '</div></div><div class="tile s4 vrow" id="vids"></div>'
     :'<div class="tile s4 dact">'+
        '<div class="seg2" id="fa">'+[['familia','Para familias'],['medico','Para médicos'],['all','Todo']].map(function(o){return '<button type="button" data-p="'+o[0]+'" class="'+(aud===o[0]?'on':'')+'">'+o[1]+'</button>';}).join('')+'</div>'+
        '<div class="dlinks">'+(E?'<a class="btn ghost" href="#/rumbo?d='+dis+'">Preguntarle a Rumbo</a><a class="btn ghost" href="#/atlas?ruta=1&d='+dis+'">Dónde se atiende</a>'+(PERFIL==='med'?'<a class="btn ghost" href="#/clara">Analizar un caso en Clara</a>':''):'')+'</div></div>'+
      '<div class="tile s4 flist" id="tiles"></div><div class="tile s4 vrow" id="vids"></div>')+
   '</div><div class="more" id="more"></div>'+
  '</div></section>';
  var ans=$('#ans'),qi=$('#q');
  function vids(){var V2=RM.w.filter(function(w){return w.t==='video'&&(dis==='all'||w.d===dis);}).slice(0,dis==='all'?4:6),el=$('#vids');
    if(!V2.length){el.remove();return;}
    el.innerHTML='<span class="tk">Videos</span><div class="vr">'+V2.map(function(w){return '<a href="https://www.youtube.com/watch?v='+esc(w.yt)+'" target="_blank" rel="noopener"><span class="vt2" style="background-image:url('+esc(w.thumb)+')"></span><b>'+esc(w.title)+'</b><span class="note">'+esc(w.canal)+' · '+esc(DSHORT[w.d]||'')+'</span></a>';}).join('')+'</div>';}
  function list(){var el=$('#tiles');if(!el)return;
    var L=C.filter(function(d){return d.enfermedad===dis&&(aud==='all'||d.publico===aud||d.publico==='ambos');});
    el.innerHTML='<span class="tk">'+L.length+' ficha'+(L.length===1?'':'s')+' · '+tx('toca una para leerla completa','seleccione una para leerla completa')+'</span>'+(L.slice(0,shown).map(function(d){return '<details class="fi"><summary><b>'+esc(d.tema.replace(/^Tamiz neonatal · /,''))+'</b><span>'+esc(d.texto.slice(0,120))+(d.texto.length>120?'…':'')+'</span><i class="aud '+d.publico+'">'+({medico:'Médicos',familia:'Familias',ambos:'Todos'})[d.publico]+'</i></summary><p>'+esc(d.texto)+'</p><a class="src" href="'+esc(d.url)+'" target="_blank" rel="noopener">Fuente: '+esc(d.fuente)+' ↗</a></details>';}).join('')||'<p class="note">'+tx('No hay fichas para este público. Prueba con «Todo».','No hay fichas para este público. Pruebe con «Todo».')+'</p>');
    $('#more').innerHTML=L.length>shown?'<button class="btn ghost" type="button">Ver más ('+(L.length-shown)+')</button>':'';
    var mb=$('#more button');if(mb)mb.onclick=function(){shown+=12;list();};}
  $$('#fa button').forEach(function(b){b.onclick=function(){$$('#fa button').forEach(function(x){x.classList.toggle('on',x===b);});aud=b.dataset.p;shown=12;list();};});
  list();vids();
  qi.oninput=function(){var v=qi.value.trim(),M=dis==='all'?disMatch(v):[];$('#ql').innerHTML=M.length?'<span class="note">Ir al tema:</span>'+M.slice(0,3).map(function(e){return '<a href="#/acervo?d='+e.key+'">'+esc(e.corto)+' →</a>';}).join(''):'';};
  $$('#sq button').forEach(function(b){b.onclick=function(){qi.value=b.textContent;$('#ask').requestSubmit();};});
  dictado($('#ask .mic'),qi,function(){$('#ask').requestSubmit();});
  $('#ask').onsubmit=async function(e){e.preventDefault();var qq=qi.value.trim();if(!qq)return;
    if(ctl)ctl.abort();ctl=new AbortController();
    var fr=cSearch(qq+' '+qq,7,function(d){return (dis==='all'||d.enfermedad===dis||d.enfermedad==='general')&&(PERFIL!=='fam'||d.publico!=='medico');});
    ans.innerHTML='<div class="box" style="margin-top:12px"><span class="wait">Buscando en el Acervo</span></div>';var box=ans.firstChild;
    if(!fr.length){box.innerHTML='No encontré información sobre eso en el Acervo. Hoy cubre '+ENF.length+' enfermedades poco frecuentes, el tamiz neonatal en México y apoyos y trámites. '+tx('Prueba con otras palabras o explora por tema.','Pruebe con otros términos o explore por tema.');return;}
    var prompt='Eres el Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes (Capítulo México). Responde en español de México, claro y cálido, en un máximo de 110 palabras'+(PERFIL==='fam'?', para una familia que puede no saber términos médicos: háblale de tú, con empatía':', para un profesional de la salud: dirígete de usted, con lenguaje clínico preciso')+'. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento, por ejemplo [g4]. Si la respuesta no está en los fragmentos, dilo con honestidad. No indiques dosis ni hagas diagnósticos. Sin títulos.\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nPREGUNTA: '+qq;
    try{var t=await aiStream(prompt,function(t){box.innerHTML=cite(t).html;},ctl.signal);var c=cite(t);box.innerHTML=c.html+srcLinks(c.used);}
    catch(err){if(err.name==='AbortError')return;box.innerHTML='<p class="note">'+esc(errCopy(err))+'</p><br><b>'+esc(fr[0].tema)+'.</b> '+esc(fr[0].texto)+'<sup class="c">1</sup>'+srcLinks([fr[0].id]);}};
  if(q.q){qi.value=q.q;$('#ask').requestSubmit();}
};

/* ---------- selector de enfermedad para quien no sabe nada todavía ---------- */
function picker(root,onPick,opts){opts=opts||{};
  root.innerHTML='<div class="pick">'+
   '<label class="pk-s"><span class="pk-ic" aria-hidden="true"></span><input id="pks" autocomplete="off" placeholder="'+esc(opts.ph||'¿Qué te dijo el médico o qué notas?')+'" aria-label="Buscar enfermedad"></label><p class="note pk-ex">Por ejemplo: «ampollas», «hemofilia», «no sostiene la cabeza», «salió alterado el tamiz».</p>'+
   '<div class="pk-res" id="pkr" aria-live="polite"></div>'+
   '<p class="pk-or">o elige lo que más se parece a lo que están viviendo</p>'+
   '<div class="pk-g">'+GRUPOS.map(function(g){var L=ENF.filter(function(e){return e.grupo===g.k;});if(!L.length)return '';
     return '<details class="pk-c '+(GCOL[g.k]||'')+'"><summary><b>'+esc(g.t)+'</b><span>'+esc(g.s)+'</span><i aria-hidden="true"></i></summary><div class="pk-l">'+
       L.map(function(e){return '<button type="button" data-k="'+e.key+'"><b>'+esc(e.corto)+'</b>'+(e.corto!==e.nombre?'<small>'+esc(e.nombre)+'</small>':'')+'<span>'+esc(e.familia||'')+'</span></button>';}).join('')+'</div></details>';}).join('')+'</div>'+
   (opts.sin===false?'':'<button type="button" class="pk-no" data-k="sin"><b>Todavía no tenemos diagnóstico</b><span>Te ayudamos a saber a quién acudir y qué preguntar.</span></button>')+
  '</div>';
  var inp=$('#pks',root),res=$('#pkr',root);
  function bind(){$$('button[data-k]',root).forEach(function(b){b.onclick=function(){onPick(b.dataset.k);};});}
  inp.oninput=function(){var L=disMatch(inp.value);res.innerHTML=inp.value.trim().length<2?'':(L.length?L.map(function(e){return '<button type="button" data-k="'+e.key+'" class="'+(GCOL[e.grupo]||'')+'"><b>'+esc(e.corto)+'</b>'+(e.corto!==e.nombre?' <small>'+esc(e.nombre)+'</small>':'')+'<span>'+esc(e.familia||'')+'</span></button>';}).join(''):'<p class="note">No encontré algo parecido. Prueba con otra palabra o elige abajo lo que más se parece.</p>');bind();};
  bind();}

/* ---------- Rumbo (luz clara) ---------- */
V.rumbo=function(q){
  if(!q.d||(!DIS[q.d]&&q.d!=='sin')){
    view.innerHTML='<section class="pg"><div class="wrap narrow">'+
     '<div class="pg-h"><div><span class="tk c-b">Para familias y pacientes</span><h1>Rumbo</h1><p>No necesitas saber términos médicos. Cuéntanos qué te dijeron o qué notas, y te acompañamos con información aprobada, con la fuente a la vista.</p></div></div>'+
     '<div class="tile c-b vcall" id="vc"><div class="who">'+ava()+'<div><h3>¿Prefieres platicarlo?</h3><p>Cuéntale a Rumbo con tu voz lo que están viviendo. Te responde solo con información aprobada.</p></div><span class="hdr-r">'+callBtn('Rumbo')+'</span></div><p class="callst" id="cst" aria-live="polite"></p><div class="log vlog" id="vlog" aria-live="polite"></div></div>'+
     '<div class="tile pk-tile" id="pkw"></div></div></section>';
    picker($('#pkw'),function(k){location.hash='#/rumbo?d='+k;});
    var vlog=$('#vlog');$('#vc .callbtn').onclick=function(){startCall({agente:'rumbo',nombre:'Rumbo',ava:$('#vc .ava'),btn:this,vars:{enfermedad:'lo que están viviendo, aunque todavía no sepan el nombre de la enfermedad'},
      status:function(t){$('#cst').textContent=t;},say:function(w,t){vlog.classList.add('on');vlog.appendChild(h('div','bb '+w,esc(t)));vlog.scrollTop=1e6;},tools:voiceTools(vlog,{})});};
    return;}
  var sin=q.d==='sin',dis=sin?'general':q.d,E=ENFBY[dis]||{},turns=[],busy=false,ctl=null;
  var SUG={eb:['¿Cómo cargo y visto a mi bebé?','¿Cómo hago una curación?','¿Dónde la atienden en México?','¿Hay algún apoyo económico?','¿Con quién puedo hablar?'],
    gaucher:['¿Qué es y cómo se hereda?','¿Cómo se confirma el diagnóstico?','¿Qué tratamientos hay?','¿Dónde la atienden en México?','¿Puedo pedir la pensión por discapacidad?'],
    fabry:['¿Por qué me arden las manos y los pies?','¿Cómo se hereda?','¿Las mujeres también la tienen?','¿Qué tratamientos hay?','¿Hay una asociación de pacientes?'],
    mps:['¿Qué es el síndrome de Hunter?','¿Cuáles son los primeros signos?','¿Qué tratamiento hay?','¿Qué cuidados necesita en la escuela?','¿Con quién puedo hablar?'],
    general:['¿Cómo pido que lo vea un especialista?','¿Qué es el tamiz neonatal y cómo pido el resultado?','¿Dónde hay hospitales con experiencia?','¿Qué apoyos existen?']};
  var SUGT=['¿Qué significa que salió alterado el tamiz?','¿Qué estudios siguen para confirmarlo?','¿Tiene tratamiento?','¿Dónde la atienden en México?','¿Qué cuidados necesita en casa?'];
  var SUGN=['¿Qué es y por qué pasa?','¿Qué señales debo vigilar?','¿Tiene tratamiento en México?','¿Dónde la atienden?','¿Hay familias que pasen por lo mismo?'];
  var HOLA={eb:'Hola, soy Rumbo. Te acompaño con la piel de mariposa: cuidados en casa, dónde atenderse en México y qué apoyos existen. ¿En qué te ayudo?',
    gaucher:'Hola, soy Rumbo. Te acompaño con la enfermedad de Gaucher: qué es, cómo se confirma, tratamientos y apoyos en México. ¿En qué te ayudo?',
    fabry:'Hola, soy Rumbo. Te acompaño con la enfermedad de Fabry: síntomas, cómo se hereda, tratamientos y dónde atenderse. ¿En qué te ayudo?',
    mps:'Hola, soy Rumbo. Te acompaño con el síndrome de Hunter: primeros signos, cuidados en casa y escuela, tratamiento y dónde atenderse. ¿En qué te ayudo?',
    general:'Hola, soy Rumbo. No tener un diagnóstico todavía es muy común y agotador. Te ayudo a saber a quién acudir, qué pedir y qué preguntar. ¿Por dónde empezamos?'};
  var hola=HOLA[dis]||('Hola, soy Rumbo. Te acompaño con '+(E.nombre||'').toLowerCase().replace(/^(.)/,function(m){return m;})+': qué es, qué vigilar, tratamiento y dónde atenderse en México. Pregúntame con tus palabras.');
  var sugs=SUG[dis]||(E.grupo==='tamiz'?SUGT:SUGN);
  var ASO={eb:'debra',gaucher:'nord',fabry:'grupo_fabry',mps:'palito'};
  var title=sin?'Sin diagnóstico todavía':(E.corto||DSHORT[dis]);
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-b">Para familias y pacientes</span><h1>Rumbo</h1><p>Qué sigue, con tus palabras. Escríbele o háblale: te responde con información aprobada y te dice de dónde sale cada dato.</p></div>'+
   '<a class="dpill '+(DCOL[dis]||'')+'" href="#/rumbo"><span><small>Te acompaño con</small><b>'+esc(title)+'</b></span><em>Cambiar</em></a></div>'+
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
  $('#chat .callbtn').onclick=function(){startCall({agente:'rumbo',nombre:'Rumbo',ava:av,btn:this,vars:{enfermedad:sin?'una enfermedad todavía sin diagnóstico':DIS[dis]},
    status:function(t){$('#cst').textContent=t;},say:function(w,t){log.appendChild(h('div','bb '+w,esc(t)));log.scrollTop=1e6;},tools:voiceTools(log,{})});};
  function side(){
    $('#w-dato').innerHTML='<span class="tk">Dato que importa</span><div class="big">8 <small>de cada 10</small></div><p>personas con una enfermedad poco frecuente viven con alguna discapacidad, y apenas 57% ha tenido una valoración. En Europa ya se mide; en Latinoamérica todavía no.</p><span class="src">'+EUROPA+'</span>';
    var P=PD.atlas.pts.filter(function(p){return sin||p.d.indexOf(dis)>=0;}),nh=P.filter(function(p){return p.l==='h';}).length,na=P.filter(function(p){return p.l==='a';}).length;
    var w=$('#w-cerca');w.href='#/atlas?ruta=1'+(sin?'':'&d='+dis);w.innerHTML='<span class="tk">Dónde atienden</span><div class="big">'+nh+' <small>hospitales</small></div><p>'+(sin||!na?'con experiencia'+(sin?' en enfermedades poco frecuentes':' en '+esc((DSHORT[dis]||'').toLowerCase()))+'. Te decimos cuáles quedan más cerca.':na+(na===1?' asociación':' asociaciones')+' de pacientes con experiencia en '+esc((DSHORT[dis]||'').toLowerCase())+'.')+'</p><span class="go">Buscar el más cercano →</span>';
    var v=RM.w.filter(function(x){return x.t==='video'&&x.d===dis;})[0];
    $('#w-video').innerHTML=v?'<span class="tk">Para entenderla</span><a href="https://www.youtube.com/watch?v='+esc(v.yt)+'" target="_blank" rel="noopener" style="display:block;aspect-ratio:16/9;border-radius:12px;background:#000 url('+esc(v.thumb)+') center/cover"></a><b style="font-size:14px;line-height:1.35">'+esc(v.title)+'</b><span class="note">'+esc(v.canal)+'</span>'
      :(E.senales&&E.senales.length?'<span class="tk">Señales que vale la pena vigilar</span><ul class="ck sm">'+E.senales.slice(0,5).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>'
      :'<span class="tk">Antes de la consulta</span><ul class="ck sm"><li>Anota desde cuándo empezó y qué ha cambiado</li><li>Junta estudios y resultados, incluido el tamiz</li><li>Lleva fotos o videos de lo que notas</li><li>Pregunta: ¿a qué especialista nos refiere?</li></ul>');
    var tz=E.grupo==='tamiz';
    $('#w-tramite').innerHTML=tz?'<span class="tk">Si salió alterado</span><h3>Qué sigue después del tamiz</h3><p>Una prueba alterada no es un diagnóstico: hay que confirmarlo pronto. Te explicamos los pasos.</p><span class="go">Preguntar a Rumbo →</span>'
      :'<span class="tk">Trámite</span><h3>Pensión por discapacidad</h3><p>Quién la puede pedir, qué documentos llevar y cómo registrarse.</p><span class="go">Preguntar a Rumbo →</span>';
    $('#w-tramite').onclick=function(){send(tz?'El tamiz de mi bebé salió alterado, ¿qué sigue?':'¿Puedo pedir la pensión por discapacidad y qué necesito?');};
    var a=RW[ASO[dis]],pa=PD.atlas.pts.filter(function(p){return p.l==='a'&&p.d.indexOf(dis)>=0;})[0];
    $('#w-aso').innerHTML=a?'<span class="tk" style="color:#FF8FB1">No estás sola, no estás solo</span><h3>'+esc(a.title)+'</h3><p style="color:#cfd8e3">'+esc(a.sub||'')+'</p><a class="go" style="color:#FF8FB1;text-decoration:none" href="'+esc(a.url)+'" target="_blank" rel="noopener">Conocer a la asociación ↗</a>'
      :pa?'<span class="tk" style="color:#FF8FB1">No estás sola, no estás solo</span><h3>'+esc(pa.n)+'</h3><p style="color:#cfd8e3">'+esc(pa.x||'')+'</p><a class="go" style="color:#FF8FB1;text-decoration:none" href="'+esc(pa.u)+'" target="_blank" rel="noopener">Conocer a la asociación ↗</a>'
      :'<span class="tk" style="color:#FF8FB1">No estás sola, no estás solo</span><h3>Asociaciones de pacientes</h3><p style="color:#cfd8e3">Hay familias que ya recorrieron este camino. En el directorio del Observatorio puedes encontrar una cerca de ti.</p><a class="go" style="color:#FF8FB1;text-decoration:none" href="#/asociaciones">Ver el directorio →</a>';}
  function hello(){voice.stop();log.innerHTML='';turns=[];log.appendChild(h('div','bb a',esc(hola)));
    sug.innerHTML=sugs.map(function(s){return '<button type="button">'+esc(s)+'</button>';}).join('');
    $$('button',sug).forEach(function(b){b.onclick=function(){send(b.textContent);};});side();}
  form.onsubmit=function(e){e.preventDefault();var t=inp.value.trim();if(t&&!busy){inp.value='';send(t);}};
  dictado($('#f .mic'),inp,function(){form.requestSubmit();});
  function clean(t){return t.split(/\n?\s*WIDGETS?\s*:/i)[0].trim();}
  function okDoc(d){return (d.enfermedad===dis||d.enfermedad==='general'||(E.grupo==='tamiz'||sin)&&d.enfermedad==='tamiz');}
  async function send(qq){if(busy)return;busy=true;voice.stop();form.querySelector('.btn').disabled=true;
    log.appendChild(h('div','bb u',esc(qq)));var a=h('div','bb a','<span class="wait">Buscando en las fuentes</span>');log.appendChild(a);log.scrollTop=1e6;
    var ctx=turns.slice(-2).map(function(t){return t.content;}).join(' ');
    var fr=cSearch(qq+' '+qq+' '+ctx,6,function(d){return okDoc(d)&&d.publico!=='medico';});
    if(fr.length<3)fr=fr.concat(cSearch(qq,6,okDoc).filter(function(d){return fr.indexOf(d)<0;})).slice(0,6);
    var cat=RM.w.filter(function(w){return w.d===dis||w.d==='general';}).map(function(w){return w.id+': '+w.desc;}).join('\n');
    var text='',ids=[],done=false;
    if(fr.length){
      var hist=turns.slice(-4).map(function(t){return (t.role==='user'?'Familia: ':'Rumbo: ')+t.content;}).join('\n');
      var prompt='Eres Rumbo, el acompañante para familias del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. '+(sin?'La familia todavía no tiene un diagnóstico; ayúdale a orientarse sin adivinar enfermedades.':'La familia vive con '+DIS[dis]+'.')+' Puede ser su primer contacto con el tema: no des nada por sabido y explica cualquier término. Háblale siempre de tú, con empatía: reconoce primero cómo se siente si lo expresa. Habla como una mujer mexicana de unos 35 a 40 años: cálida, clara y serena. Responde en un máximo de 80 palabras, porque la respuesta se lee en voz alta y va acompañada de tarjetas visuales. Usa SOLO la información de los FRAGMENTOS. Después de cada dato, pon entre corchetes la etiqueta del fragmento, por ejemplo [e7]. Si la respuesta no está en los fragmentos, dilo con honestidad y sugiere hablar con su equipo médico o con la asociación de pacientes. No indiques dosis ni hagas diagnósticos. Sin títulos ni listas.'+(cat?'\n\nAl final, en una línea aparte, escribe WIDGETS: seguido de 1 a 3 identificadores del CATÁLOGO que mejor complementan la respuesta (de preferencia uno visual y, si hay uno pertinente, un video), separados por comas.\n\nCATÁLOGO:\n'+cat:'')+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+(hist?'\n\nCONVERSACIÓN PREVIA:\n'+hist:'')+'\n\nPREGUNTA DE LA FAMILIA: '+qq;
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
    turns.push({role:'user',content:qq},{role:'assistant',content:text.replace(/\[[a-z]{1,4}\d+(?:\s*,\s*[a-z]{1,4}\d+)*\]/gi,'')});
    a.scrollIntoView({block:'nearest'});busy=false;form.querySelector('.btn').disabled=false;}
  hello();
};

/* ---------- Clara: solo médicos; ficha del caso, tamiz y consulta guiada ---------- */
var MED=false;try{MED=sessionStorage.getItem('obs-medico')==='1';}catch(e){}
function claraGate(){
  view.innerHTML='<section class="pg"><div class="wrap narrow">'+
   '<div class="gate tile c-m"><div class="who">'+ava()+'<div><span class="tk c-m">Acceso para profesionales de la salud</span><h1 style="margin:2px 0 0">Clara</h1></div></div>'+
   '<p class="lead">Clara es una herramienta de apoyo clínico <b>exclusiva para médicos y profesionales de la salud</b>. Orienta la sospecha de enfermedades poco frecuentes y la referencia; no diagnostica.</p>'+
   '<form id="gf" class="gate-f"><label class="ckl"><input type="checkbox" id="g1" required> Confirmo que soy médico o profesional de la salud.</label>'+
   '<div class="field"><label for="gc">Cédula profesional <span class="note">(opcional en esta demostración)</span></label><input id="gc" inputmode="numeric" maxlength="10" placeholder="Ej. 12345678"></div>'+
   '<button class="btn" type="submit">Entrar a Clara</button></form>'+
   '<div class="gate-alt"><b>¿Eres familiar o paciente?</b><p>Rumbo está hecho para ti: te explica con tus palabras y te dice a dónde acudir.</p><a class="btn ghost" href="#/rumbo">Ir a Rumbo →</a></div>'+
   '</div></div></section>';
  $('#gf').onsubmit=function(e){e.preventDefault();if(!$('#g1').checked)return;setPerfil('med');V.clara();};}

var HALL=[['Neuromuscular',['Hipotonía','Debilidad progresiva','Pérdida de hitos del desarrollo','Signo de Gowers o caídas frecuentes','Pseudohipertrofia de pantorrillas','CPK elevada']],
  ['Hematológico',['Sangrado prolongado o hematomas','Hemartrosis','Plaquetopenia','Anemia']],
  ['Visceral y óseo',['Hepatoesplenomegalia','Dolor óseo','Talla baja o disostosis','Rigidez articular','Rasgos faciales toscos','Hernias umbilicales o inguinales']],
  ['Piel',['Ampollas o erosiones con roce mínimo','Angioqueratomas','Hipohidrosis']],
  ['Neonatal y metabólico',['Vómito y letargia neonatal','Hipoglucemia','Acidosis o hiperamonemia','Olor peculiar en orina','Ictericia prolongada o cataratas','Genitales ambiguos o crisis perdedora de sal','Íleo meconial o sudor salado']],
  ['Otros',['Dolor neuropático en manos y pies','Retraso global del desarrollo','Infecciones respiratorias de repetición','Apnea obstructiva o ronquido','Proteinuria o enfermedad renal','Miocardiopatía']]];
var TZI=['No sé','No se realizó','Secretaría de Salud / IMSS-Bienestar','IMSS','ISSSTE','Pemex','SEDENA / Semar','Privado'];
function fileB64(f){return new Promise(function(ok,ko){
  if(/pdf$/i.test(f.type)){if(f.size>3e6)return ko(new Error('grande'));var r=new FileReader();r.onload=function(){ok({media_type:'application/pdf',data:String(r.result).split(',')[1]});};r.onerror=ko;r.readAsDataURL(f);return;}
  if(!/^image\//.test(f.type))return ko(new Error('tipo'));
  var u=URL.createObjectURL(f),im=new Image();im.onload=function(){var m=1800,s=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok({media_type:'image/jpeg',data:c.toDataURL('image/jpeg',.86).split(',')[1]});};im.onerror=ko;im.src=u;});}
async function aiJsonF(input,files){
  var r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:input,json:true,files:files})});
  if(!r.ok){var e=new Error('HTTP '+r.status);e.code=r.status;throw e;}
  var o=await r.json();if(o.json==null)throw new Error('json');return o.json;}

V.clara=function(){
  if(PERFIL==='med'||PERFIL==='pres')MED=true;
  if(!MED)return claraGate();
  var busy=false,caso='',preguntas=[],resp={},tzFile=null,tzRead=null;
  var EJ=[['Adolescente con bazo grande','Mujer de 15 años. Fatiga desde hace dos años, dolor de huesos en las piernas, moretones fáciles. A la exploración, bazo aumentado. Biometría con plaquetas bajas y anemia leve. Ha visto a 4 especialistas.'],
    ['Ardor en manos y pies','Hombre de 19 años. Ardor en manos y pies desde los 9 años que empeora con el ejercicio y la fiebre; casi no suda; dolor abdominal y diarrea frecuentes; pequeñas manchas rojo violáceas alrededor del ombligo. Proteína en orina. Ha visto a 5 especialistas.'],
    ['Lactante hipotónico','Lactante de 5 meses, hombre. Desde los 2 meses se nota flácido, no sostiene la cabeza, llanto débil y respiración abdominal. Reflejos osteotendinosos ausentes, fasciculaciones en lengua. Tamiz neonatal básico de la Secretaría de Salud, normal. Lo han visto 2 especialistas.'],
    ['Niño que se cae','Niño de 5 años. Se cae con frecuencia, le cuesta subir escaleras y se levanta del piso apoyándose en sus piernas. Pantorrillas grandes. CPK de 12,000 U/L. Ha visto a 3 especialistas.'],
    ['Recién nacido con ampollas','Recién nacido de 10 días con ampollas en manos, pies y rodillas que aparecen con el roce mínimo; erosiones en la boca al alimentarse. Sin antecedentes familiares conocidos. Lo han visto 2 especialistas.']];
  var T=PD.tamiz||{panel:[],mort:{}},mx=Math.max.apply(null,T.panel.map(function(p){return p.v;}).concat([1]));
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-m">Solo para profesionales de la salud</span><h1>Clara</h1><p>Llene la ficha del caso o suba el resultado del tamiz neonatal. Clara le hace las preguntas que faltan y le orienta: qué sospechar, qué explorar y a dónde referir.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile s3 r3 c-m" id="cons"><div class="who">'+ava()+'<div><h3>Clara</h3><p>Consulta guiada · no diagnostica, orienta</p></div><span class="hdr-r">'+callBtn('Clara')+voiceToggle()+'</span></div><p class="callst" id="cst" aria-live="polite"></p>'+
     '<div class="log" id="clog" aria-live="polite"></div>'+
     '<div id="cin"></div></div>'+
    '<div class="tile c-p"><span class="tk">El tiempo cuenta</span><div class="big">4.7 <small>años</small></div><p>tarda en promedio un diagnóstico en Europa; los adolescentes esperan 10.4.</p><span class="src">'+srcA(SRC_DX)+'</span></div>'+
    '<div class="tile c-y"><span class="tk">Tamiz al nacer</span><p style="margin-bottom:2px">Sin tamiz ampliado, la mortalidad fue casi el doble:</p><div class="big">'+(T.mort.no||'')+'% <small>vs '+(T.mort.si||'')+'%</small></div><a class="src" href="'+esc(T.mort.url||'#')+'" target="_blank" rel="noopener">'+esc(T.mort.src||'')+' ↗</a></div>'+
    '<div class="tile c-v"><span class="tk">Casos de ejemplo</span><p>Cárgalo y Clara empieza a orientar.</p><div class="chips" id="ejs" style="gap:6px">'+EJ.map(function(e,i){return '<button type="button" data-i="'+i+'" style="font-size:12.5px;padding:6px 11px">'+esc(e[0])+'</button>';}).join('')+'</div></div>'+
    '<div class="tile s4 c-g"><span class="tk">¿Qué se buscó en este bebé al nacer?</span><p>El tamiz neonatal depende de dónde nació. Preguntarlo cambia la sospecha.</p><div class="tz">'+T.panel.map(function(p){return '<div class="'+(/Referencia/.test(p.n)?'ref':'')+'" title="'+esc(p.nota)+'"><span>'+esc(p.n)+'</span><span class="bar"><i style="width:'+Math.round(p.v/mx*100)+'%"></i></span><b>'+p.v+'</b></div>';}).join('')+'</div><a class="src" href="#/atlas?vista=tamiz">Qué detecta cada institución · ver en el Atlas →</a></div>'+
   '</div></div></section>';
  var clog=$('#clog'),cin=$('#cin'),av=$('#cons .ava');bindVoiceToggle($('#cons'));
  $('#cons .callbtn').onclick=function(){if(!CALL.o){voice.stop();cin.innerHTML='';}
    startCall({agente:'clara',nombre:'Clara',u:true,ava:av,btn:this,vars:{},status:function(t){$('#cst').textContent=t;if(!CALL.o&&!cin.innerHTML)(t?ficha():endButtons());},
      say:function(w,t){clog.appendChild(h('div','bb '+w,esc(t)));clog.scrollTop=1e6;},
      tools:voiceTools(clog,{mostrar_orientacion:function(p){p=p||{};var d=String(p.enfermedad||'').toLowerCase(),lv=String(p.nivel||'').toLowerCase();
        clog.appendChild(h('div','box','<b>'+esc(DSHORT[d]||p.enfermedad||'Orientación')+'</b>'+(lv?'<span class="lvl '+esc(lv)+'">Sospecha '+esc(lv)+'</span>':'')+(p.razon?'<p style="margin-top:6px">'+esc(p.razon)+'</p>':'')+(p.siguiente_paso?'<p style="margin-top:8px"><b>Siguiente paso</b></p><p>'+esc(p.siguiente_paso)+'</p>':'')+(p.referencia?'<p style="margin-top:8px"><b>Referir a</b></p><p>'+esc(p.referencia)+'</p>':'')+(DIS[d]?'<a class="go" href="#/atlas?d='+d+'" style="display:inline-block;margin-top:8px;text-decoration:none">Dónde referir en el Atlas →</a>':'')));
        clog.scrollTop=1e6;return 'Orientación mostrada en pantalla.';}})});};
  function say(html,spoken){var b=h('div','bb a',html);clog.appendChild(b);clog.scrollTop=1e6;if(spoken)voice.speak(spoken,av);return b;}
  function me(t){clog.appendChild(h('div','bb u',esc(t)));clog.scrollTop=1e6;}
  /* ficha del caso */
  function ficha(){tzFile=null;tzRead=null;
    cin.innerHTML='<form class="intake" id="cf" novalidate>'+
     '<div class="drop" id="drop" tabindex="0" role="button" aria-label="Subir resultado de tamiz neonatal"><input type="file" id="tzf" accept="image/*,application/pdf" hidden><b>¿Tiene el resultado del tamiz neonatal?</b><span>Súbalo en foto o PDF y empiezo con él.</span><em id="tzn">Elegir archivo</em></div>'+
     '<div class="frow"><div class="field"><label for="ce">Edad</label><div class="ig"><input id="ce" type="number" min="0" max="120" inputmode="numeric"><select id="cu" aria-label="Unidad de edad"><option>días</option><option>meses</option><option selected>años</option></select></div></div>'+
      '<div class="field"><span class="lbl">Sexo</span><div class="seg2" id="cs"><button type="button" data-v="F">Mujer</button><button type="button" data-v="M">Hombre</button></div></div>'+
      '<div class="field"><label for="cn">Especialistas que lo han visto</label><input id="cn" type="number" min="0" max="40" inputmode="numeric" placeholder="0"></div></div>'+
     '<div class="field"><label for="cm">Motivo de consulta y evolución</label><textarea id="cm" rows="2" maxlength="600" placeholder="Qué le preocupa, desde cuándo y cómo ha cambiado"></textarea></div>'+
     '<div class="field"><span class="lbl">Hallazgos <span class="note">(marque los que apliquen)</span></span><div class="hall">'+HALL.map(function(g){return '<div><small>'+esc(g[0])+'</small><div class="mchips">'+g[1].map(function(x){return '<button type="button" aria-pressed="false">'+esc(x)+'</button>';}).join('')+'</div></div>';}).join('')+'</div></div>'+
     '<div class="frow"><div class="field"><label for="ct">Tamiz neonatal</label><select id="ct">'+TZI.map(function(x){return '<option>'+esc(x)+'</option>';}).join('')+'</select></div>'+
      '<div class="field"><span class="lbl">Antecedentes</span><div class="mchips" id="cx"><button type="button" aria-pressed="false">Consanguinidad</button><button type="button" aria-pressed="false">Familiar con cuadro similar</button><button type="button" aria-pressed="false">Muerte temprana en la familia</button></div></div></div>'+
     '<div class="field"><label for="cl">Estudios y resultados relevantes <span class="note">(opcional)</span></label><input id="cl" maxlength="400" placeholder="Ej. CPK 12,000 U/L; plaquetas 80,000; TSH 35"></div>'+
     '<div class="factions"><button class="btn" type="submit">Orientar el caso</button><button class="btn ghost" type="button" id="libre">Prefiero contarlo con mis palabras</button></div>'+
     '<p class="note">No escriba nombres ni datos que identifiquen al paciente. El archivo del tamiz se usa solo para esta consulta y no se guarda.</p></form>';
    var sx=null;$$('#cs button').forEach(function(b){b.onclick=function(){sx=sx===b.dataset.v?null:b.dataset.v;$$('#cs button').forEach(function(x){x.classList.toggle('on',x.dataset.v===sx);});};});
    $$('#cf .mchips button').forEach(function(b){b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.classList.toggle('on',on);};});
    var fi=$('#tzf'),dr=$('#drop');dr.onclick=function(){fi.click();};dr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fi.click();}};
    dr.ondragover=function(e){e.preventDefault();dr.classList.add('ov');};dr.ondragleave=function(){dr.classList.remove('ov');};
    dr.ondrop=function(e){e.preventDefault();dr.classList.remove('ov');if(e.dataTransfer.files[0])takeFile(e.dataTransfer.files[0]);};
    fi.onchange=function(){if(fi.files[0])takeFile(fi.files[0]);};
    function takeFile(f){tzFile=f;$('#tzn').textContent=f.name+' · listo';dr.classList.add('ok');if($('#ct').selectedIndex<2)$('#ct').selectedIndex=0;}
    $('#libre').onclick=libre;
    $('#cf').onsubmit=async function(e){e.preventDefault();if(busy)return;
      var ed=$('#ce').value,un=$('#cu').value,n=$('#cn').value,mo=$('#cm').value.trim(),hs=$$('.hall button.on').map(function(b){return b.textContent;}),ax=$$('#cx button.on').map(function(b){return b.textContent;}),tz=$('#ct').value,lb=$('#cl').value.trim();
      if(!mo&&!hs.length&&!tzFile){$('#cm').focus();$('#cm').placeholder='Indíqueme al menos el motivo de consulta, marque hallazgos o suba el tamiz';return;}
      var t=(sx?(sx==='F'?'Mujer':'Hombre'):'Paciente')+(ed?' de '+ed+' '+un:'')+'. '+(mo?mo+(/[.!?]$/.test(mo)?'':'.')+' ':'')+(hs.length?'Hallazgos: '+hs.join(', ').toLowerCase()+'. ':'')+(lb?'Estudios: '+lb+'. ':'')+(ax.length?'Antecedentes: '+ax.join(', ').toLowerCase()+'. ':'')+'Tamiz neonatal: '+tz+'. '+(n!==''?'Lo han visto '+n+' especialistas.':'');
      var meta={edad:ed?(un==='años'?+ed:un==='meses'?+ed/12:+ed/365):null,sexo:sx,especialistas:n!==''?+n:null};
      if(tzFile){busy=true;cin.innerHTML='';me('Te comparto el resultado del tamiz neonatal: '+tzFile.name);await leerTamiz(t,meta);}else{cin.innerHTML='';paso1(t,meta);}};}
  function libre(){cin.innerHTML='<form class="row" id="cf2"><input id="ci" placeholder="Edad, sexo, qué ves, cuántos especialistas lo han visto…" maxlength="900" aria-label="Describe el caso">'+MIC+'<button class="btn" type="submit">Enviar</button></form><button type="button" class="linkish" id="vf">← Volver a la ficha</button>';
    var f=$('#cf2'),i=$('#ci');dictado($('#cf2 .mic'),i,function(){f.requestSubmit();});i.focus();$('#vf').onclick=ficha;
    f.onsubmit=function(e){e.preventDefault();var t=i.value.trim();if(t&&!busy){cin.innerHTML='';paso1(t);}};}
  async function leerTamiz(t,meta){var w=say('<span class="wait">Leyendo el resultado del tamiz</span>');
    var keys=ENF.map(function(e){return e.key+' ('+e.nombre+')';}).join('; ');
    var prompt='Eres Clara, apoyo para médicos de primer contacto del Observatorio Latinoamericano de Enfermedades Poco Frecuentes (México). El médico adjunta el resultado de un tamiz neonatal (foto o PDF). Léelo con cuidado y extrae SOLO lo que está escrito; si algo no se lee, dilo. No inventes valores. Contexto del médico: '+t+'\n\nEnfermedades que cubre el Acervo (usa estas claves en "sugiere"): '+keys+'.\n\nDevuelve SOLO un objeto JSON: {"legible":true|false,"institucion":"o null","laboratorio":"o null","fecha_toma":"o null","horas_vida_toma":número o null,"panel":"básico, ampliado o desconocido","resultados":[{"analito":"","valor":"","unidad":"","referencia":"","estado":"alterado"|"limítrofe"|"normal"}],"interpretacion":"qué patrón sugieren los alterados, máximo 35 palabras, sin diagnosticar","sugiere":["claves del Acervo compatibles con lo alterado"],"advertencias":"toma temprana, transfusión, prematurez, muestra inadecuada o vacío"}. En "resultados" incluye todos los alterados y limítrofes y, como máximo, 6 normales.';
    var f=null;try{f=await fileB64(tzFile);}catch(e){w.innerHTML='No pude abrir el archivo. Use una foto (JPG o PNG) o un PDF de menos de 3 MB.';busy=false;ficha();return;}
    var j=null;try{j=await aiJsonF(prompt,[f]);}catch(e){}
    if(!j||j.legible===false){w.innerHTML=j?'No alcanzo a leer bien el resultado. Intente con una foto más nítida, de frente y con buena luz, o capture los valores alterados en la ficha.':esc(errCopy({}));busy=false;if(!j)return paso1(t,meta);ficha();return;}
    tzRead=j;var R=(j.resultados||[]),alt=R.filter(function(r){return r.estado!=='normal';});
    w.innerHTML='<b>Lo que leí en el tamiz</b>'+(j.institucion||j.laboratorio?'<p class="note">'+esc([j.institucion,j.laboratorio,j.fecha_toma?'toma: '+j.fecha_toma:''].filter(Boolean).join(' · '))+'</p>':'')+
      '<table class="tzr"><thead><tr><th>Analito</th><th>Valor</th><th>Referencia</th></tr></thead><tbody>'+R.map(function(r){return '<tr class="'+esc(r.estado)+'"><td>'+esc(r.analito)+'</td><td><b>'+esc(r.valor)+'</b> '+esc(r.unidad||'')+'</td><td>'+esc(r.referencia||'')+'</td></tr>';}).join('')+'</tbody></table>'+
      (j.interpretacion?'<p style="margin-top:8px">'+esc(j.interpretacion)+'</p>':'')+(j.advertencias?'<p class="note" style="margin-top:6px">⚠ '+esc(j.advertencias)+'</p>':'')+
      '<p class="note" style="margin-top:6px">Verifique que coincida con el documento antes de seguir.</p>';
    voice.speak('Leí el tamiz. '+(alt.length?'Encontré '+alt.length+' valor'+(alt.length>1?'es':'')+' fuera de rango. ':'No veo valores fuera de rango. ')+(j.interpretacion||''),av);
    cin.innerHTML='<div class="chips"><button type="button" id="tok">Es correcto, continuar</button><button type="button" id="tno">Hay un error, corregir</button></div>';
    $('#tok').onclick=function(){cin.innerHTML='';var txt=t+' Resultado del tamiz neonatal'+(j.institucion?' ('+j.institucion+')':'')+': '+(alt.length?alt.map(function(r){return r.analito+' '+r.valor+(r.unidad?' '+r.unidad:'')+(r.referencia?' (referencia '+r.referencia+')':'')+' '+r.estado;}).join('; '):'sin valores alterados')+'.'+(j.advertencias?' Advertencias: '+j.advertencias:'');paso1(txt,meta,j.sugiere);};
    $('#tno').onclick=function(){cin.innerHTML='<form class="row" id="tfix"><input id="tfi" placeholder="Escriba el valor correcto, ej. TSH 8.2 µUI/mL" maxlength="300">'+MIC+'<button class="btn" type="submit">Continuar</button></form>';var ff=$('#tfix');dictado($('#tfix .mic'),$('#tfi'),function(){ff.requestSubmit();});
      ff.onsubmit=function(e){e.preventDefault();var c=$('#tfi').value.trim();cin.innerHTML='';me(c||'Sin corrección');paso1(t+' Resultado del tamiz neonatal según el médico: '+alt.map(function(r){return r.analito+' '+r.valor;}).join('; ')+'. Corrección: '+c,meta,j.sugiere);};};
    busy=false;}
  function start(){voice.stop();caso='';preguntas=[];resp={};clog.innerHTML='';
    say('Hola, soy Clara. Llene la ficha, suba el tamiz neonatal o cuénteme el caso con sus palabras. Con eso le hago las preguntas que faltan.');ficha();}
  $$('#ejs button').forEach(function(b){b.onclick=function(){if(busy)return;start();cin.innerHTML='';paso1(EJ[+b.dataset.i][1]);};});
  function frAll(t,k,pref){var f=cSearch(t+' sospecha diagnóstico confirmación referencia signos '+(pref||[]).map(function(x){return DIS[x]||'';}).join(' '),k,function(d){return d.publico!=='familia'&&d.enfermedad!=='general';});return f;}
  function bias(o){var a=[],e=+o.edad,esp=+o.especialistas;
    if(o.edad!=null&&e>=10&&e<=19)a.push('Adolescente: es el grupo con mayor retraso diagnóstico, 10.4 años en promedio.');
    if(o.sexo==='F')a.push('Mujer: el retraso promedio es de 5.4 años, frente a 3.7 en hombres.');
    if(esp>10)a.push('Haber consultado a más de 10 especialistas se asocia con 2.6 veces más probabilidad de retraso.');else if(esp>=3)a.push('Ya pasó por '+esp+' especialistas sin diagnóstico: la ruta se está alargando.');
    return a;}
  function listaEnf(){return ENF.map(function(e){return e.key+' ('+e.nombre+')';}).join(', ');}
  async function paso1(t,meta,pref){busy=true;caso=t;if(!tzRead||meta==null)me(t);cin.innerHTML='';var w=say('<span class="wait">Leyendo el caso</span>');
    var fr=frAll(t,10,pref);
    var prompt='Eres Clara, apoyo para médicos de primer contacto (pediatría, medicina general, medicina interna) del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. El médico te describe un caso. Dirígete a él siempre de usted, en registro clínico. Tu tarea ahora NO es diagnosticar: es identificar los datos clave y hacer de 2 a 3 preguntas breves que más ayuden a orientar la sospecha, apoyándote en los FRAGMENTOS. REGLA ESTRICTA: todo lo que escribas (preguntas, razones, estudios, referencias) debe estar respaldado por los FRAGMENTOS; si un dato no está en ellos, no lo menciones ni lo completes con conocimiento propio. No inventes cifras, guías, estudios ni dosis. El Acervo cubre: '+listaEnf()+', además del tamiz neonatal en México. No repitas preguntas cuya respuesta ya esté en el caso. Si el paciente es menor de 2 años o el dato es relevante y no lo sabes, pregunta si tuvo tamiz neonatal y en qué institución nació. Cada pregunta con 2 a 4 opciones cortas.\n\nCASO: '+t+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nDevuelve SOLO un objeto JSON: {"edad":años como número o null,"sexo":"F"|"M"|null,"especialistas":número o null,"resumen":"el caso en una línea, máximo 25 palabras","preguntas":[{"q":"pregunta, máximo 14 palabras","opciones":["...","..."]}]}';
    var j=null;try{j=await aiJson(prompt);}catch(e){}
    if(!j||!j.preguntas||!j.preguntas.length){w.innerHTML='<span class="note">'+(j?'Con lo que me dio puedo orientar directamente.':esc(errCopy({})))+'</span>';return analizar([],pref);}
    if(meta){['edad','sexo','especialistas'].forEach(function(k){if(meta[k]!=null)j[k]=meta[k];});}
    preguntas=j.preguntas.slice(0,3);var b=bias(j);
    w.innerHTML=(j.resumen?'<b>Entendí:</b> '+esc(j.resumen)+'<br><br>':'')+'Para orientarle mejor, ayúdeme con '+(preguntas.length===1?'una pregunta':preguntas.length+' preguntas')+':';
    if(b.length)clog.appendChild(h('div','box alert','<b>Alerta de sesgo</b> · '+b.map(esc).join(' ')+'<div class="note" style="margin-top:6px">Fuentes: '+srcA(SRC_DX)+' · '+srcA(SRC_ESP)+'</div>'));
    voice.speak((j.resumen?'Entendí: '+j.resumen+'. ':'')+'Para orientarle mejor, ayúdeme con estas preguntas.',av);
    var k=0;function next(){if(k>=preguntas.length){analizar(preguntas.map(function(p,i){return p.q+' → '+(resp[i]||'sin dato');}),pref);return;}
      var p=preguntas[k];say('<b>'+esc(p.q)+'</b>');
      cin.innerHTML='<div class="chips" id="op">'+(p.opciones||[]).concat(['No sé']).map(function(o){return '<button type="button">'+esc(o)+'</button>';}).join('')+'</div>';
      $$('#op button').forEach(function(bt){bt.onclick=function(){resp[k]=bt.textContent;me(bt.textContent);k++;next();};});}
    busy=false;next();}
  async function analizar(qa,pref){busy=true;cin.innerHTML='';var w=say('<span class="wait">Revisando las guías</span>');
    var fr=frAll(caso+' '+qa.join(' '),10,pref),keys=ENF.map(function(e){return '"'+e.key+'"';}).join('|');
    var prompt='Eres Clara, apoyo para médicos de primer contacto del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes, en México. No diagnosticas: orientas la sospecha. Dirígete al médico de usted. Usa SOLO los FRAGMENTOS como evidencia y cita sus etiquetas. REGLA ESTRICTA: todo lo que escribas (preguntas, razones, estudios, referencias) debe estar respaldado por los FRAGMENTOS; si un dato no está en ellos, no lo menciones ni lo completes con conocimiento propio. No inventes cifras, guías, estudios ni dosis. Las enfermedades que cubre el Acervo son: '+listaEnf()+'. Si ninguna encaja, dilo y sugiere ampliar el estudio con genética. Si hay un tamiz neonatal alterado, prioriza la confirmación urgente y la referencia inmediata cuando aplique.\n\nCASO: '+caso+(qa.length?'\nRESPUESTAS DEL MÉDICO:\n'+qa.join('\n'):'')+'\n\nFRAGMENTOS:\n'+fragBlock(fr)+'\n\nDevuelve SOLO un objeto JSON: {"candidatas":[{"enfermedad":'+keys+',"nivel":"alta"|"media"|"baja","razon":"máximo 30 palabras","coinciden":["máximo 4"],"explorar":["máximo 3"]}],"ninguna":"si ninguna encaja, explica en 25 palabras; si no, vacío","urgencia":"si requiere atención o confirmación urgente, en 15 palabras; si no, vacío","siguiente_paso":"máximo 35 palabras","referencia":"a qué servicio referir, máximo 20 palabras","tamiz":"una frase sobre el tamiz neonatal si aplica, o vacío","fuentes":["etiquetas"]}. Ordena candidatas de mayor a menor sospecha; máximo 2.';
    var j=null;try{j=await aiJson(prompt);}catch(e){}
    if(!j){var top=fr.slice(0,3);w.innerHTML='<span class="note">'+esc(errCopy({}))+'</span>'+top.map(function(d,i){return '<p style="margin-top:8px"><b>'+esc(d.tema)+'.</b> '+esc(d.texto)+'<sup class="c">'+(i+1)+'</sup></p>';}).join('')+srcLinks(top.map(function(d){return d.id;}));endButtons();busy=false;return;}
    var li=function(a){return (a&&a.length)?'<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';};
    var ids=(j.fuentes||[]).map(function(x){return String(x).toLowerCase();}).filter(function(x){return CBY[x];});
    w.remove();
    if(j.urgencia)clog.appendChild(h('div','box alert','<b>Atención</b> · '+esc(j.urgencia)));
    (j.candidatas||[]).forEach(function(c){var lv=String(c.nivel||'').toLowerCase();
      clog.appendChild(h('div','box','<b>'+esc(DIS[c.enfermedad]?DIS[c.enfermedad]:c.enfermedad)+'</b><span class="lvl '+esc(lv)+'">Sospecha '+esc(lv)+'</span><p style="margin-top:6px">'+esc(c.razon||'')+'</p>'+(c.coinciden&&c.coinciden.length?'<p style="margin-top:8px"><b>Coinciden</b></p>'+li(c.coinciden):'')+(c.explorar&&c.explorar.length?'<p style="margin-top:8px"><b>Falta explorar</b></p>'+li(c.explorar):'')+(DIS[c.enfermedad]?'<a class="go" href="#/atlas?d='+c.enfermedad+'" style="display:inline-block;margin-top:8px;text-decoration:none">Dónde referir en el Atlas →</a>':'')));});
    if(j.ninguna)clog.appendChild(h('div','box','<b>Fuera de lo que cubre el Acervo</b><p style="margin-top:6px">'+esc(j.ninguna)+'</p>'));
    clog.appendChild(h('div','box','<b>Siguiente paso</b><p>'+esc(j.siguiente_paso||'')+'</p><p style="margin-top:8px"><b>Referir a</b></p><p>'+esc(j.referencia||'')+'</p>'+(j.tamiz?'<p style="margin-top:8px"><b>Tamiz neonatal</b></p><p>'+esc(j.tamiz)+'</p>':'')+srcLinks(ids)));
    clog.scrollTop=1e6;
    var c0=(j.candidatas||[])[0];
    voice.speak((j.urgencia?j.urgencia+'. ':'')+(c0?'Sospecha '+(c0.nivel||'')+' de '+(DIS[c0.enfermedad]||c0.enfermedad)+'. '+(c0.razon||'')+' ':(j.ninguna||''))+' Siguiente paso: '+(j.siguiente_paso||'')+' Referir a: '+(j.referencia||'')+'. Recuerde: yo oriento la sospecha; el diagnóstico lo hace el especialista.',av);
    endButtons();busy=false;}
  function endButtons(){cin.innerHTML='<div class="chips"><button type="button" id="nuevo">Nuevo caso</button></div>';$('#nuevo').onclick=start;}
  start();
};

/* ---------- Atlas (noche) ---------- */
var LAY={h:{c:'#00C8D6',n:'Hospitales con experiencia'},a:{c:'#FF4FD8',n:'Asociaciones de pacientes'},t:{c:'#F2D14B',n:'Ensayos clínicos'}};
var SERV=[['imss','IMSS'],['issste','ISSSTE'],['pemex','Pemex'],['mil','SEDENA o Semar'],['bien','No tengo seguridad social (IMSS-Bienestar)'],['priv','Atención privada']];
var SRE={imss:/IMSS|UMAE|Siglo XXI|La Raza|Centro Médico Nacional de Occidente|Ignacio García Téllez/i,issste:/ISSSTE|20 de Noviembre/i,pemex:/Pemex/i,mil:/Militar|SEDENA|Semar|Naval|Marina/i,
  priv:/Español|Ángeles|Christus|TecSalud|San José|Camino|Médica Sur|ABC/i};
var PASO={imss:['Acude a tu Unidad de Medicina Familiar y pide a tu médico familiar la referencia a tu hospital de zona.','Desde el hospital de zona te envían a la Unidad Médica de Alta Especialidad (UMAE) que corresponda.','Si ya tienes un diagnóstico de otra institución, llévalo: acelera la referencia.'],
  issste:['Pide en tu Clínica de Medicina Familiar la referencia a tu hospital regional.','Para estudios especializados, el hospital regional puede enviarte al Centro Médico Nacional 20 de Noviembre.'],
  pemex:['Tu unidad médica de Pemex te refiere a su red de especialidad; el Hospital Central Sur de Alta Especialidad atiende enfermedades metabólicas y lisosomales.'],
  mil:['Tu unidad médica militar o naval te refiere al Hospital Central Militar o a los servicios de sanidad de Semar.'],
  bien:['Ve a tu centro de salud y pide que te refieran al hospital del estado; hoy la mayoría de los estados opera con IMSS-Bienestar.','Los Institutos Nacionales de Salud y el Hospital Infantil de México también reciben a personas sin seguridad social: pregunta en Trabajo Social por costos y apoyos.'],
  priv:['Pide a tu médico una referencia por escrito con resumen clínico.','Busca la especialidad indicada (genética, neurología, hematología, endocrinología) en los hospitales de la lista.']};
var PASOM={imss:['Refiera desde la Unidad de Medicina Familiar al hospital general de zona con resumen clínico y estudios.','El hospital de zona deriva a la UMAE correspondiente para confirmación y manejo.','Si el diagnóstico viene de otra institución, anéxelo: acelera la referencia.'],
  issste:['Refiera desde la Clínica de Medicina Familiar al hospital regional.','Para estudios especializados, el hospital regional puede derivar al CMN 20 de Noviembre.'],
  pemex:['Refiera dentro de la red de Pemex; el Hospital Central Sur de Alta Especialidad atiende enfermedades metabólicas y lisosomales.'],
  mil:['Refiera al Hospital Central Militar o a los servicios de sanidad de Semar, según corresponda.'],
  bien:['Refiera desde el centro de salud al hospital estatal (IMSS-Bienestar en la mayoría de los estados).','Los Institutos Nacionales de Salud y el Hospital Infantil de México reciben a pacientes sin seguridad social; Trabajo Social orienta sobre costos.'],
  priv:['Entregue una referencia por escrito con resumen clínico.','Oriente hacia genética, neurología, hematología o endocrinología en los hospitales de la lista.']};
var CENT=null;
function stateCentroids(){if(CENT)return CENT;CENT=PD.atlas.mx.p.map(function(o){var x=0,y=0,n=0;o.d.replace(/[ML](-?[\d.]+),(-?[\d.]+)/g,function(_,a,b){x+=+a;y+=+b;n++;});return [x/n,y/n];});return CENT;}
V.atlas=function(q){
  var A=PD.atlas,dis=DIS[q.d]?q.d:'all',on={h:1,a:1,t:1},sel=null,area=null,conSS=false;
  var T=PD.tamiz||{panel:[],mort:{}},TI=T.inst||[],TE=T.estados||[];
  var MX=ENF.filter(function(e){return e.tamiz;});
  var yn=function(v){return v===true?'<i class="yn y" title="Sí la detecta">✓</i>':v===false?'<i class="yn n" title="No la detecta">–</i>':'<i class="yn u" title="Sin dato público">?</i>';};
  var states=A.mx.p.map(function(p,i){return [p.n,i];}).sort(function(a,b){return a[0].localeCompare(b[0],'es');});
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-y">Para familias y para quien decide</span><h1>Atlas</h1><p>Dónde hay atención para las enfermedades poco frecuentes en México, dónde no, y qué se le busca a cada bebé al nacer según dónde nace.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile s4 c-b route" id="ruta"><div class="route-h"><span class="tk">'+tx('Si buscas atención por primera vez','Ruta de referencia')+'</span><h2>'+tx('Te decimos a dónde ir y qué llevar','A dónde referir a su paciente y qué debe llevar')+'</h2><p>'+tx('Tres preguntas. No necesitas saber términos médicos.','Tres datos del paciente y le mostramos los centros con experiencia más cercanos de su red.')+'</p></div>'+
     '<form id="rf" class="route-f"><div class="field"><label for="rd">'+tx('1 · ¿Qué tiene tu familiar?','1 · Diagnóstico o sospecha')+'</label><select id="rd"><option value="sin">'+tx('Todavía no sabemos','Sin diagnóstico aún')+'</option>'+disOptions(dis==='all'?'':dis,false)+'</select></div>'+
     '<div class="field"><label for="re">'+tx('2 · ¿En qué estado viven?','2 · Estado de residencia')+'</label><select id="re" required><option value="">'+tx('Elige tu estado','Elija el estado')+'</option>'+states.map(function(s){return '<option value="'+s[1]+'">'+esc(s[0])+'</option>';}).join('')+'</select></div>'+
     '<div class="field"><label for="rs">'+tx('3 · ¿Qué servicio de salud tienen?','3 · Derechohabiencia')+'</label><select id="rs">'+SERV.map(function(s){return '<option value="'+s[0]+'"'+(s[0]==='bien'?' selected':'')+'>'+esc(PERFIL==='fam'?s[1]:s[1].replace('No tengo seguridad social','Sin seguridad social'))+'</option>';}).join('')+'</select></div>'+
     '<button class="btn" type="submit">'+tx('Ver a dónde ir','Ver centros de referencia')+'</button></form><div id="rout" aria-live="polite"></div></div>'+
    '<div class="tile s4 af"><label for="az" class="tk">Ver el mapa de</label><select id="az">'+disOptions(dis,true)+'</select></div>'+
    '<div class="tile c-b" id="k-h"></div><div class="tile c-m" id="k-a"></div><div class="tile c-y" id="k-t"></div><div class="tile c-g" id="k-e"></div>'+
    '<div class="tile s3 r3 mapt"><div id="lmap" class="lmap" role="region" aria-label="Mapa de atención en México"></div><div class="lyr" id="lyr"></div><p class="mhint">'+tx('Toca el mapa para hacer zoom con la rueda del ratón.','Haga clic en el mapa para usar el zoom con la rueda del ratón.')+'</p></div>'+
    '<div class="tile r3 plt"><div class="plist" id="pl" aria-live="polite"></div></div>'+
    '<div class="tile s4 c-p" id="tzsec"><span class="tk">Tamiz neonatal</span><h2 style="margin:4px 0 6px">Lo que se busca en un bebé depende de dónde nace</h2>'+
     '<div class="tzt"><table><thead><tr><th>Institución</th><th>Cuántas</th><th>Qué incluye</th></tr></thead><tbody>'+TI.map(function(t){return '<tr'+(/Referencia/.test(t.inst)?' class="ref"':'')+'><td><b>'+esc(t.inst)+'</b>'+(t.desde?'<small>'+esc(t.desde)+'</small>':'')+'</td><td class="n">'+esc(t.n)+'</td><td>'+esc(t.cuales||'')+(t.url?' <a href="'+esc(t.url)+'" target="_blank" rel="noopener">Fuente ↗</a>':'')+'</td></tr>';}).join('')+'</tbody></table></div></div>'+
    '<div class="tile s2 c-g"><span class="tk">¿La detecta el tamiz?</span><table class="mx"><thead><tr><th></th><th>Sin seguridad social</th><th>IMSS</th><th>Pemex</th><th>Privado</th></tr></thead><tbody>'+MX.map(function(e){var t=e.tamiz;return '<tr title="'+esc(t.nota||'')+'"><td>'+esc(e.corto)+'</td><td>'+yn(t.ssa)+'</td><td>'+yn(t.imss)+'</td><td>'+yn(t.pemex)+'</td><td>'+yn(t.privado)+'</td></tr>';}).join('')+'</tbody></table><p class="note">✓ la detecta · – no la detecta · ? sin dato público. Pasa el cursor para ver la nota.</p></div>'+
    '<div class="tile s2 c-y"><span class="tk">Tamiz público por estado</span><div class="seg2 sm" id="tzss"><button type="button" class="on" data-v="0">Sin seguridad social</button><button type="button" data-v="1">Con seguridad social</button></div><div id="tzm"></div><p class="note" id="tzn">'+tx('Toca un estado para ver el detalle.','Seleccione un estado para ver el detalle.')+'</p></div>'+
    '<div class="tile s2 c-m"><span class="tk">Lo que cuesta no tamizar</span><div class="big">'+(T.mort.no||'')+'% <small>vs '+(T.mort.si||'')+'%</small></div><p>mortalidad en niños con errores innatos del metabolismo sin y con tamiz ampliado.</p><a class="src" href="'+esc(T.mort.url||'#')+'" target="_blank" rel="noopener">'+esc(T.mort.src||'')+' ↗</a></div>'+
    '<div class="tile s2 ink"><span class="tk" style="color:#F2D14B">Sin transparencia</span><div class="big">'+TE.filter(function(e){return e.cat==='sin_dato';}).length+' <small>de 32</small></div><p style="color:#cfd8e3">estados sin un documento público que diga qué enfermedades busca su tamiz para bebés sin seguridad social.</p></div>'+
    '<div class="tile s4 c-v leg"><span class="tk">Agenda legislativa</span><div class="legg">'+
     '<div><i class="st tr">Pendiente en el Senado</i><b>Registro Nacional de pacientes</b><span>Aprobado por la Cámara de Diputados con 440 votos el 15 de abril de 2026. Lo impulsa en el Senado el Sen. Emmanuel Reyes Carmona.</span><small>Fuentes: N+ (16 abr 2026), Argonmexico (1 oct 2026)</small></div>'+
     '<div><i class="st tr">Pendiente en Diputados</i><b>Tamiz neonatal ampliado obligatorio</b><span>Reforma al artículo 61 de la Ley General de Salud aprobada por el Senado el 13 de abril de 2023. La ley vigente sigue sin definir cuántas enfermedades debe incluir.</span><small>Fuente: investigación del Observatorio sobre tamiz neonatal (oct 2026)</small></div>'+
    '</div></div>'+
   '</div><div class="demo-flag">Solo datos públicos y agregados por institución. El Atlas nunca muestra información de pacientes individuales. Las distancias son aproximadas. Corte: '+esc(new Date(A.corte+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'}))+'.</div>'+
  '</div></section>';
  /* ruta para familias */
  $('#rf').onsubmit=function(e){e.preventDefault();var d=$('#rd').value,si=$('#re').value,sv=$('#rs').value,out=$('#rout');
    if(si===''){$('#re').focus();return;}si=+si;var C=stateCentroids()[si],E=ENFBY[d]||null,stn=A.mx.p[si].n;
    var H=A.pts.filter(function(p){return p.l==='h'&&p.px!=null&&(d==='sin'||p.d.indexOf(d)>=0);});
    var mine=function(p){return sv==='bien'?!/IMSS|UMAE|ISSSTE|Pemex|Militar|SEDENA|Semar|Naval|Español|Ángeles|Christus|TecSalud|San José|Camino/i.test(p.n):SRE[sv]?SRE[sv].test(p.n):true;};
    var km=function(p){return Math.round(Math.hypot(p.px-C[0],p.py-C[1])*3.3/10)*10;};
    H.forEach(function(p){p._km=p.s===si?0:km(p);});
    var red=H.filter(mine).sort(function(a,b){return a._km-b._km;}).slice(0,3),near=H.slice().sort(function(a,b){return a._km-b._km;}).filter(function(p){return red.indexOf(p)<0;}).slice(0,2);
    var aso=A.pts.filter(function(p){return p.l==='a'&&(d==='sin'||p.d.indexOf(d)>=0);}).slice(0,3);
    var card=function(p){return '<div class="rcard"><b>'+esc(p.n)+'</b><span>'+esc(p.c)+' · '+(p._km===0?tx('en tu estado','en el mismo estado'):'a unos '+p._km+' km')+'</span>'+'<p>Experiencia documentada en: '+esc(p.d.slice().sort(function(x,y){return (y===d)-(x===d);}).map(function(k){return DSHORT[k]||k;}).join(', '))+'</p>'+gmaps(p)+'<a href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></div>';};
    out.innerHTML='<div class="rres">'+
      (E&&E.grupo==='tamiz'?(PERFIL==='fam'?'<div class="box alert"><b>Si el tamiz salió alterado, no esperes.</b> La confirmación es urgente: llama hoy a la unidad donde tomaron la muestra o acude a urgencias pediátricas si el bebé está decaído, vomita o no come.</div>':'<div class="box alert"><b>Tamiz alterado: confirmación urgente.</b> Solicite la prueba confirmatoria sin esperar a la siguiente cita y refiera a urgencias pediátricas si hay letargia, vómito o rechazo al alimento.</div>'):'')+
      '<div class="rcol"><h3>'+(red.length?tx('En tu red de atención','En la red de su paciente'):'Hospitales con experiencia')+'</h3>'+(red.length?red.map(card).join(''):'<p class="note">'+tx('No encontramos un hospital de tu red con experiencia documentada en ','No encontramos un hospital de esa red con experiencia documentada en ')+esc(E?E.corto:'enfermedades poco frecuentes')+'. Te mostramos los más cercanos de cualquier institución.</p>')+(near.length?'<h4>También cerca</h4>'+near.map(card).join(''):'')+'</div>'+
      '<div class="rcol"><h3>'+tx('Tu primer paso','Ruta de referencia')+'</h3><ol>'+((PERFIL==='fam'?PASO:PASOM)[sv]||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>'+
       '<h4>'+tx('Lleva contigo','Que el paciente lleve')+'</h4><ul class="ck sm"><li>CURP y, si tienen, número de afiliación</li><li>Resumen clínico y todos los estudios previos</li><li>El resultado del tamiz neonatal</li><li>Fotos o videos de lo que notan</li><li>Sus dudas, escritas</li></ul>'+
       (aso.length?'<h4>'+tx('Familias que ya pasaron por esto','Asociaciones para referir a la familia')+'</h4>'+aso.map(function(p){return '<a class="aso" href="'+esc(p.u)+'" target="_blank" rel="noopener"><b>'+esc(p.n)+'</b><span>'+esc(p.c)+'</span></a>';}).join(''):'')+
       (PERFIL==='fam'?'<a class="btn ghost" style="margin-top:12px" href="#/rumbo?d='+(d||'sin')+'">Preguntarle a Rumbo →</a>':'<a class="btn ghost" style="margin-top:12px" href="#/clara">Orientar el caso con Clara →</a>')+'</div>'+
      '</div><p class="note">'+esc(stn)+': distancias aproximadas en línea recta desde el centro del estado.</p>';
    out.scrollIntoView({block:'nearest',behavior:'smooth'});};
  if(dis!=='all')$('#rd').value=dis;
  /* mapa de atención: Leaflet con capas y enlaces a Google Maps */
  var M=null,LG={},stLayer=null,tzLayer=null,me=null,meLL=null,lyr={h:1,a:1,t:1,tz:0,sin:0},lyrOpen=innerWidth>720;
  var inv=function(x,y){var b=A.mx.b;return [b[3]-y/A.mx.h*(b[3]-b[2]), x/A.mx.w*(b[1]-b[0])+b[0]];};
  function ll(p){return p.lat!=null?[p.lat,p.lon]:p.px!=null?inv(p.px,p.py):null;}
  function rings(i){return A.mx.p[i].d.split('M').filter(Boolean).map(function(r){return r.replace(/Z/gi,'').split('L').map(function(s){var a=s.split(',');return inv(+a[0],+a[1]);});});}
  function gq(p){return encodeURIComponent(p.n.replace(/\s*[–(].*$/,'')+', '+p.c.replace(/\s*\(.*?\)/g,''));}
  function gmaps(p){return '<div class="gm"><a class="gmb" href="https://www.google.com/maps/dir/?api=1&destination='+gq(p)+'" target="_blank" rel="noopener">Cómo llegar</a><a href="https://www.google.com/maps/search/?api=1&query='+gq(p)+'" target="_blank" rel="noopener">Ver en Google Maps ↗</a></div>';}
  var LBL={h:'Hospital con experiencia',a:'Asociación de pacientes',t:'Ensayo clínico'};
  function card(p,km){return '<b>'+esc(p.n)+'</b><span class="c">'+LBL[p.l]+' · '+esc(p.c)+(km!=null?' · a '+km+' km':'')+'</span><span class="dz">'+p.d.map(function(k){return DSHORT[k]||k;}).join(', ')+'</span>'+(p.x?'<p>'+esc(p.x)+'</p>':'')+(p.l!=='t'?gmaps(p):'')+'<a class="src" href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a>';}
  function hav(a,b){var R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)*Math.sin(dn/2);return Math.round(2*R*Math.asin(Math.sqrt(x))/5)*5;}
  function pts(){return A.pts.filter(function(p){return dis==='all'||p.d.indexOf(dis)>=0;});}
  function loadL(){if(window.L&&L.markerClusterGroup)return Promise.resolve();
    var add=function(t,a){return new Promise(function(ok,ko){var e=document.createElement(t);if(t==='link'){e.rel='stylesheet';e.href=a;e.onload=ok;}else{e.src=a;e.onload=ok;}e.onerror=ko;document.head.appendChild(e);});};
    return add('link','/obs/vendor/leaflet/leaflet.min.css').then(function(){return add('link','/obs/vendor/leaflet/MarkerCluster.css');}).then(function(){return add('script','/obs/vendor/leaflet/leaflet.min.js');}).then(function(){return add('script','/obs/vendor/leaflet/leaflet.markercluster.js');});}
  function initMap(){M=L.map('lmap',{zoomControl:true,scrollWheelZoom:false,minZoom:4,maxBounds:[[8,-125],[38,-80]]}).setView([23.6,-102],5);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Mapa base © Esri, HERE, Garmin, © OpenStreetMap',maxZoom:16}).addTo(M);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,pane:'shadowPane'}).addTo(M);
    M.on('click',function(){M.scrollWheelZoom.enable();});
    ['h','a','t'].forEach(function(l){LG[l]=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:42,iconCreateFunction:function(c){var n=c.getChildCount();return L.divIcon({html:'<span style="background:'+LAY[l].c+'">'+n+'</span>',className:'lcl',iconSize:[38,38]});}});});
    draw();}
  function stateStyle(cnt){return function(i){return {color:'#06121c',weight:1,fillColor:cnt[i]?'#00C8D6':'#FF4FD8',fillOpacity:cnt[i]?0:.32};};}
  function draw(){var P=pts(),states={};P.forEach(function(p){if(p.s!=null)states[p.s]=1;});
    var cnt=function(l){return P.filter(function(p){return p.l===l;}).length;};
    $('#k-h').innerHTML='<span class="tk">Hospitales</span><div class="big">'+cnt('h')+'</div><p>con experiencia documentada</p>';
    $('#k-a').innerHTML='<span class="tk">Asociaciones</span><div class="big">'+cnt('a')+'</div><p>de pacientes identificadas</p>';
    $('#k-t').innerHTML='<span class="tk">Ensayos clínicos</span><div class="big">'+cnt('t')+'</div><p>con sede en México</p>';
    var covered=Object.keys(states).length;
    $('#k-e').innerHTML='<span class="tk">Sin atención</span><div class="big">'+(32-covered)+' <small>de 32</small></div><p>entidades sin un punto identificado'+(dis==='all'?'':' para '+esc(DSHORT[dis]))+'</p>';
    $('#lyr').innerHTML='<button type="button" class="lyr-t" aria-expanded="'+(lyrOpen?'true':'false')+'">Capas del mapa</button><div class="lyr-b">'+['h','a','t'].map(function(l){return '<label><input type="checkbox" data-l="'+l+'"'+(lyr[l]?' checked':'')+'><i style="background:'+LAY[l].c+'"></i>'+LAY[l].n+' <em>'+cnt(l)+'</em></label>';}).join('')+
      '<label><input type="checkbox" data-l="sin"'+(lyr.sin?' checked':'')+'><i class="sq" style="background:#FF4FD8"></i>Estados sin atención <em>'+(32-covered)+'</em></label>'+
      '<label><input type="checkbox" data-l="tz"'+(lyr.tz?' checked':'')+'><i class="sq" style="background:#F2D14B"></i>Tamiz público por estado</label>'+
      '<button type="button" class="btn ghost sm" id="meb">'+(meLL?'Actualizar mi ubicación':'Usar mi ubicación')+'</button></div>';
    $('#lyr').classList.toggle('open',lyrOpen);$('#lyr .lyr-t').onclick=function(){lyrOpen=!lyrOpen;$('#lyr').classList.toggle('open',lyrOpen);this.setAttribute('aria-expanded',lyrOpen);};
    $$('#lyr input').forEach(function(c){c.onchange=function(){lyr[c.dataset.l]=c.checked?1:0;draw();};});
    $('#meb').onclick=locate;
    if(M){['h','a','t'].forEach(function(l){var g=LG[l];g.clearLayers();if(!lyr[l]){M.removeLayer(g);return;}
        P.filter(function(p){return p.l===l;}).forEach(function(p){var c=ll(p);if(!c)return;
          var m=L.circleMarker(c,{radius:9,color:'#06121c',weight:2,fillColor:LAY[l].c,fillOpacity:.95});m.bindPopup('<div class="lpop">'+card(p,meLL?hav(meLL,c):null)+'</div>',{maxWidth:300});g.addLayer(m);});
        M.addLayer(g);});
      if(stLayer){M.removeLayer(stLayer);stLayer=null;}
      if(lyr.sin){stLayer=L.layerGroup(A.mx.p.map(function(sp,i){return L.polygon(rings(i),stateStyle(states)(i)).bindTooltip(sp.n+(states[i]?'':' · sin punto identificado'),{sticky:true});})).addTo(M);}
      if(tzLayer){M.removeLayer(tzLayer);tzLayer=null;}
      if(lyr.tz){var by={};TE.forEach(function(e){by[e.estado]=e;});var TCL={basico:'#F2D14B',ampliado_hist:'#4ADE80',anuncio:'#A78BFA',sin_dato:'#3b4b5a'};
        tzLayer=L.layerGroup(A.mx.p.map(function(sp,i){var e=by[sp.n]||{cat:'sin_dato',nota:''};return L.polygon(rings(i),{color:'#06121c',weight:1,fillColor:TCL[e.cat],fillOpacity:.45}).bindPopup('<div class="lpop"><b>'+esc(sp.n)+'</b><p>'+esc(e.nota||'Sin dato público.')+'</p></div>');})).addTo(M);
        if(stLayer)stLayer.bringToFront();}}
    var L2=P.filter(function(p){return lyr[p.l];}).map(function(p){var c=ll(p);return {p:p,c:c,km:meLL&&c?hav(meLL,c):null};});
    if(meLL)L2.sort(function(a,b){return (a.km==null?1e9:a.km)-(b.km==null?1e9:b.km);});else L2.sort(function(a,b){return a.p.l.localeCompare(b.p.l);});
    $('#pl').innerHTML='<span class="tk">'+(meLL?tx('Lo más cercano a ti','Lo más cercano a su ubicación'):tx('Toca un punto del mapa o de la lista','Seleccione un punto del mapa o de la lista'))+'</span>'+L2.slice(0,60).map(function(o,i){return '<div class="pt" data-i="'+A.pts.indexOf(o.p)+'" tabindex="0" style="border-left:3px solid '+LAY[o.p.l].c+'">'+card(o.p,o.km)+'</div>';}).join('')||'<p class="note">Sin puntos para este filtro.</p>';
    $$('#pl .pt').forEach(function(el){el.onclick=function(e){if(e.target.closest('a'))return;var p=A.pts[+el.dataset.i],c=ll(p);if(!M||!c)return;M.flyTo(c,11,{duration:.8});
      var g=LG[p.l];g.eachLayer(function(m){var q=m.getLatLng();if(Math.abs(q.lat-c[0])<1e-6&&Math.abs(q.lng-c[1])<1e-6)g.zoomToShowLayer(m,function(){m.openPopup();});});
      $('#lmap').scrollIntoView({block:'nearest',behavior:'smooth'});};});}
  function locate(){if(!navigator.geolocation){alertMsg(tx('Tu navegador no comparte ubicación.','Su navegador no comparte la ubicación.'));return;}
    $('#meb').textContent='Buscando…';navigator.geolocation.getCurrentPosition(function(pos){meLL=[pos.coords.latitude,pos.coords.longitude];
      if(M){if(me)M.removeLayer(me);me=L.circleMarker(meLL,{radius:8,color:'#fff',weight:3,fillColor:'#38BDF8',fillOpacity:1}).addTo(M).bindTooltip('Tú',{permanent:true,direction:'top'});M.flyTo(meLL,7);}draw();},
      function(){$('#meb').textContent=tx('No pude obtener tu ubicación','No fue posible obtener la ubicación');},{timeout:9000});}
  function alertMsg(t){$('#pl').insertAdjacentHTML('afterbegin','<p class="note">'+esc(t)+'</p>');}
  $('#az').onchange=function(){dis=this.value;draw();};
  loadL().then(initMap).catch(function(){$('#lmap').innerHTML='<p class="note" style="padding:20px">No se pudo cargar el mapa. Revisa tu conexión.</p>';draw();});
  /* mapa del tamiz por estado */
  var TC={basico:['#F2D14B','Básico documentado (5 o 6)'],ampliado_hist:['#4ADE80','Ampliado, solo histórico'],anuncio:['#A78BFA','Anunciado o piloto'],sin_dato:['#3b4b5a','Sin dato público']};
  function tzDraw(){var by={};TE.forEach(function(e){by[e.estado]=e;});
    $('#tzm').innerHTML='<svg viewBox="60 0 940 640" class="tzmap" role="img" aria-label="Tamiz neonatal público por estado">'+A.mx.p.map(function(p,i){var e=by[p.n]||{cat:'sin_dato'},c=conSS?'#00C8D6':TC[e.cat][0];return '<path d="'+p.d+'" data-i="'+i+'" fill="'+c+'"'+(e.ley&&!conSS?' stroke="#FF4FD8" stroke-width="3"':'')+'><title>'+esc(p.n)+'</title></path>';}).join('')+'</svg>'+
      '<div class="tzleg">'+(conSS?'<span><i style="background:#00C8D6"></i>IMSS: 47 padecimientos · Pemex: 76 · en todo el país</span>':Object.keys(TC).map(function(k){return '<span><i style="background:'+TC[k][0]+'"></i>'+TC[k][1]+'</span>';}).join('')+'<span><i style="background:transparent;box-shadow:inset 0 0 0 2px #FF4FD8"></i>Su ley menciona tamiz ampliado</span>')+'</div>';
    $$('#tzm path').forEach(function(pa){pa.onclick=function(){var n=A.mx.p[+pa.dataset.i].n,e=by[n];$('#tzn').innerHTML=conSS?'<b>'+esc(n)+'</b>: con IMSS el bebé recibe el tamiz de 47 padecimientos; con Pemex, 76.':'<b>'+esc(n)+'</b>: '+esc(e?e.nota:'Sin dato.')+(e&&e.url?' <a href="'+esc(e.url)+'" target="_blank" rel="noopener">Fuente ↗</a>':'');};});}
  $$('#tzss button').forEach(function(b){b.onclick=function(){conSS=b.dataset.v==='1';$$('#tzss button').forEach(function(x){x.classList.toggle('on',x===b);});tzDraw();$('#tzn').textContent=conSS?'Con seguridad social el panel no depende del estado.':tx('Toca un estado para ver el detalle.','Seleccione un estado para ver el detalle.');};});
  tzDraw();
  if(q.ruta)setTimeout(function(){$('#ruta').scrollIntoView({block:'start'});$('#re').focus({preventScroll:true});},60);
  if(q.vista==='tamiz')setTimeout(function(){$('#tzsec').scrollIntoView({block:'start'});},60);
};

/* ---------- Asociaciones (luz clara) ---------- */
V.asociaciones=function(q){
  if(PERFIL!=='pres')return asocDir(q||{});
  asocPres();};
function asocDir(q){
  var fam=PERFIL==='fam',dis=DIS[q.d]?q.d:'all',col=['c-m','c-b','c-v','c-g','c-p'];
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-m">'+(fam?'Para familias y pacientes':'Para el médico')+'</span><h1>'+(fam?'No tienes que vivirlo sola, ni solo':'Asociaciones de pacientes para referir a las familias')+'</h1>'+
    '<p>'+(fam?'Las asociaciones de pacientes las forman familias que ya pasaron por lo mismo que tú. Te escuchan, te orientan en trámites y te ayudan a encontrar médicos que conocen la enfermedad.':'Además del manejo clínico, las familias necesitan acompañamiento. Estas asociaciones las orientan en trámites, cuidados y apoyo entre pares; puede recomendarlas desde la primera consulta.')+'</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile s4 af"><label for="adz" class="tk">'+(fam?'Busca por enfermedad':'Filtrar por enfermedad')+'</label><select id="adz">'+disOptions(dis,true)+'</select></div>'+
    '<div class="tile s2 c-p"><span class="tk">'+(fam?'Cómo te puede ayudar una asociación':'Qué ofrecen a sus pacientes')+'</span><ul class="ck sm" style="margin-top:6px">'+
     (fam?'<li>Hablar con alguien que entiende lo que estás viviendo</li><li>Orientación en trámites, apoyos y derechos</li><li>Materiales y consejos de cuidado en casa</li><li>Contacto con médicos y hospitales que conocen la enfermedad</li>'
         :'<li>Apoyo entre pares para la familia</li><li>Orientación en trámites, apoyos y derechos</li><li>Materiales de cuidado en casa</li><li>Vinculación con centros de referencia</li>')+'</ul></div>'+
    '<div class="tile s2 c-g"><span class="tk">'+(fam?'Antes de escribirles':'Al referir')+'</span><ul class="ck sm" style="margin-top:6px">'+
     (fam?'<li>Ten a la mano el diagnóstico o lo que te han dicho los médicos</li><li>Pregunta si tienen grupos o reuniones de familias</li><li>Pregunta si conocen especialistas cerca de donde vives</li>'
         :'<li>Entregue a la familia el nombre y el contacto de la asociación</li><li>Sugiera que lleven el diagnóstico y el resumen clínico</li><li>Si no hay asociación de la enfermedad, oriente hacia una federación</li>')+'</ul></div>'+
    '<div class="bento s4" id="alist" style="grid-column:1/-1"></div>'+
    '<div class="tile s4 ink"><span class="tk" style="color:#FF8FB1">'+(fam?'¿No encuentras la de tu enfermedad?':'¿Sin asociación para la enfermedad?')+'</span><p style="color:#cfd8e3;margin-top:6px">'+
     (fam?'Escríbele a Rumbo: te ayuda a buscar apoyo y a saber a dónde acudir. También puedes ver en el Atlas los hospitales con experiencia más cercanos.':'Las federaciones de pacientes agrupan a varias enfermedades y pueden orientar a la familia. En el Atlas encontrará los centros con experiencia más cercanos.')+'</p>'+
     '<div class="dlinks" style="margin-top:10px">'+(fam?'<a class="btn" href="#/rumbo">Consultar Rumbo</a>':'')+'<a class="btn ghost" style="color:#fff;border-color:rgba(255,255,255,.3)" href="#/atlas?ruta=1">'+(fam?'Buscar atención cerca de mí':'Abrir la ruta de referencia')+'</a></div></div>'+
   '</div></div></section>';
  function list(){var A=PD.atlas.pts.filter(function(p){return p.l==='a'&&(dis==='all'||p.d.indexOf(dis)>=0);});
    $('#alist').innerHTML=A.length?A.map(function(p,i){var city=!/No confirmada/i.test(p.c);
      return '<article class="tile s2 '+col[i%5]+' aso-c"><span class="tk">'+p.d.map(function(k){return DSHORT[k]||k;}).join(' · ')+'</span><h3>'+esc(p.n)+'</h3>'+(city?'<p class="note">'+esc(p.c)+'</p>':'')+'<p>'+esc(p.x||'')+'</p>'+
        '<div class="gm">'+(city?'<a class="gmb" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.n.replace(/\s*\(.*?\)/g,'')+', '+p.c)+'" target="_blank" rel="noopener">'+(fam?'Ver dónde está':'Ubicación')+'</a>':'')+'<a href="'+esc(p.u)+'" target="_blank" rel="noopener">Más información ↗</a></div></article>';}).join('')
      :'<div class="tile s4"><p>'+(fam?'Todavía no tenemos registrada una asociación para esta enfermedad. Mira abajo cómo encontrar apoyo.':'No hay una asociación registrada para esta enfermedad. Vea abajo otras opciones.')+'</p></div>';}
  $('#adz').onchange=function(){dis=this.value;list();};
  list();}
function asocPres(){
  var A=PD.atlas.pts.filter(function(p){return p.l==='a';}),col=['c-m','c-b','c-v','c-g','c-p'];
  view.innerHTML='<section class="pg"><div class="wrap">'+
   '<div class="pg-h"><div><span class="tk c-m">Para asociaciones de pacientes</span><h1>Su causa, en el centro del Acervo</h1><p>Las asociaciones participan sin costo. Aportan la cercanía con las familias y validan lo que se publica de su enfermedad; el Observatorio les da visibilidad, herramientas y todo el conocimiento del Acervo.</p></div></div>'+
   '<div class="bento">'+
    '<div class="tile c-p"><span class="tk">Visibilidad</span><h3>Ficha propia</h3><p>Perfil en el directorio y presencia en el Atlas, en Rumbo y en Clara cuando alguien pregunta por su enfermedad.</p></div>'+
    '<div class="tile c-v"><span class="tk">Contenido</span><h3>Voz en el Acervo</h3><p>Testimonios, guías y eventos. Revisan y aprueban lo que se dice de su enfermedad antes de publicarse.</p></div>'+
    '<div class="tile c-g"><span class="tk">Herramientas</span><h3>Para crecer</h3><p>Registro de pacientes con consentimiento, convocatorias de financiamiento y materiales para su incidencia.</p></div>'+
    '<div class="tile ink"><span class="tk" style="color:#FF8FB1">Sin costo</span><div class="big">$0</div><p style="color:#cfd8e3">El Observatorio lo sostienen laboratorios que patrocinan conocimiento, no producto.</p></div>'+
    A.map(function(p,i){return '<article class="tile s2 '+col[i%5]+'"><span class="tk">'+p.d.map(function(k){return DSHORT[k];}).join(' · ')+'</span><h3>'+esc(p.n)+'</h3><p class="note">'+esc(p.c)+'</p><p>'+esc(p.x)+'</p><a class="src" href="'+esc(p.u)+'" target="_blank" rel="noopener">Fuente ↗</a></article>';}).join('')+
    '<form class="tile s2 c-y" id="join"><span class="tk">Súmese</span><h3>Solicitud para formar parte</h3>'+
     '<div class="field"><label for="jn">Nombre de la asociación</label><input id="jn" required></div>'+
     '<div class="field"><label for="je">Enfermedad o grupo de enfermedades</label><input id="je" required></div>'+
     '<div class="field"><label for="jc">Ciudad o estado</label><input id="jc"></div>'+
     '<button class="btn" type="submit" style="align-self:flex-start">Enviar solicitud</button><p class="note" id="jmsg">Demostración: este formulario no envía ni guarda datos.</p></form>'+
   '</div></div></section>';
  $('#join').onsubmit=function(e){e.preventDefault();$('#jmsg').textContent='Listo. En la versión final, esta solicitud llega al equipo del Observatorio. En esta demostración no se guardó nada.';};
};

/* ---------- liga directa al modo presentación ---------- */
V.presentacion=function(){setPerfil('pres');var e=document.getElementById('entrada');if(e){e.remove();document.body.classList.remove('en-open');}location.replace('#/');};

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
  PD=d;C=PD.corpus||[];C.forEach(function(x){CBY[x.id]=x;});initDis(PD.enfermedades);
  cSearch=Index(C,function(x){return x.tema+' '+x.tema+' '+x.texto;});
  RM=PD.rumbo||RM;RM.w.forEach(function(w){RW[w.id]=w;});
  applyPerfil();window.addEventListener('hashchange',route);route();if(!PERFIL)entrada();
}).catch(function(){view.innerHTML='<section class="blk"><div class="wrap"><h2>No se pudo cargar el Acervo</h2><p class="lead">Recarga la página.</p></div></section>';});
})();
