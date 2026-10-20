// Casos en seguimiento: el médico registra, sin datos que identifiquen al paciente, una sospecha orientada por Clara.
// Recibe un folio para volver después y marcar el desenlace (confirmado, descartado o en estudio).
// POST {accion:'nuevo', ...}               → {folio}
// POST {accion:'desenlace', folio, ...}   → actualiza
// GET ?folio=…                            → estado del caso (sin datos personales)
// GET                                     → totales públicos
// GET ?key=… [&csv=1]                     → todos los casos (PRESENTER_KEY)
const crypto = require('crypto');
const { rateLimit, readJson, redis, redisConf, originOk } = require('./_lib');
const IDX = 'seg:folios', HK = f => 'seg:' + f, BY = 'seg:totales';
const NIVEL = ['alta', 'media', 'baja'];
const SEXO = ['F', 'M', ''];
const DES = ['confirmado', 'descartado', 'en_estudio'];
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const pick = (v, list) => (list.includes(v) ? v : '');
const okFolio = f => /^CS-[A-Z0-9]{6}$/.test(f || '');
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newFolio = () => 'CS-' + Array.from(crypto.randomBytes(6), b => AB[b % AB.length]).join('');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisConf()) { res.statusCode = 503; return res.end('seguimiento sin configurar'); }
  const json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      const key = url.searchParams.get('key'), f = (url.searchParams.get('folio') || '').toUpperCase();
      if (key) {
        if (!process.env.PRESENTER_KEY || key !== process.env.PRESENTER_KEY) { res.statusCode = 403; return res.end('clave incorrecta'); }
        const folios = (await redis(['LRANGE', IDX, '0', '-1'])) || [];
        const rows = [];
        for (const fo of folios) { const s = await redis(['GET', HK(fo)]); if (s) try { rows.push(JSON.parse(s)); } catch {} }
        if (url.searchParams.get('csv')) {
          const cols = ['fecha', 'folio', 'enf', 'nivel', 'edad', 'sexo', 'estado', 'inst', 'tamiz', 'especialistas', 'referencia', 'desenlace', 'enf_final', 'fecha_desenlace'];
          const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="casos-en-seguimiento.csv"');
          return res.end('﻿' + cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c])).join(',')).join('\n'));
        }
        return json({ total: rows.length, casos: rows });
      }
      if (f) {
        if (!okFolio(f)) { res.statusCode = 400; return res.end('folio inválido'); }
        const s = await redis(['GET', HK(f)]);
        if (!s) { res.statusCode = 404; return res.end('no encontrado'); }
        const c = JSON.parse(s);
        return json({ folio: c.folio, enf: c.enf, nivel: c.nivel, desenlace: c.desenlace || 'en_estudio', fecha: c.fecha });
      }
      const flat = a => { const o = {}; for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = +a[i + 1]; return o; };
      return json({ totales: flat(await redis(['HGETALL', BY])) });
    }
    if (req.method === 'POST') {
      if (!originOk(req)) { res.statusCode = 403; return res.end('origen no permitido'); }
      if (!rateLimit(req, 20, 60 * 60 * 1000)) { res.statusCode = 429; return res.end('demasiadas solicitudes'); }
      const p = await readJson(req);
      if (p.accion === 'desenlace') {
        const f = String(p.folio || '').toUpperCase();
        if (!okFolio(f)) { res.statusCode = 400; return res.end('folio inválido'); }
        const s = await redis(['GET', HK(f)]);
        if (!s) { res.statusCode = 404; return res.end('no encontrado'); }
        const c = JSON.parse(s), d = pick(p.desenlace, DES);
        if (!d) { res.statusCode = 400; return res.end('faltan datos'); }
        if (c.desenlace && c.desenlace !== 'en_estudio') await redis(['HINCRBY', BY, 'desenlace:' + c.desenlace, '-1']);
        c.desenlace = d; c.enf_final = str(p.enf_final, 40); c.fecha_desenlace = new Date().toISOString();
        await redis(['SET', HK(f), JSON.stringify(c)]);
        if (d !== 'en_estudio') await redis(['HINCRBY', BY, 'desenlace:' + d, '1']);
        return json({ ok: true, folio: f, desenlace: d });
      }
      const c = {
        enf: str(p.enf, 24).toLowerCase().replace(/[^a-z0-9_]/g, ''),
        nivel: pick(p.nivel, NIVEL),
        edad: str(p.edad, 20),
        sexo: pick(p.sexo || '', SEXO),
        estado: str(p.estado, 40),
        inst: str(p.inst, 40),
        tamiz: str(p.tamiz, 60),
        especialistas: str(p.especialistas, 4),
        referencia: str(p.referencia, 200),
      };
      if (!c.enf || !c.nivel || !c.estado) { res.statusCode = 400; return res.end('faltan datos'); }
      c.folio = newFolio(); c.fecha = new Date().toISOString(); c.desenlace = 'en_estudio';
      await redis(['SET', HK(c.folio), JSON.stringify(c)]);
      await redis(['RPUSH', IDX, c.folio]);
      await redis(['HINCRBY', BY, 'casos', '1']);
      await redis(['HINCRBY', BY, 'enf:' + c.enf, '1']);
      return json({ ok: true, folio: c.folio });
    }
    res.statusCode = 405; res.end();
  } catch (e) {
    res.statusCode = 500; res.end('error');
  }
};
