// Censo del Observatorio: registro de pacientes con diagnóstico confirmado de una enfermedad poco frecuente.
// Guarda en Upstash Redis (la misma base del Barómetro). No pide nombre; el contacto es opcional.
// GET            → totales públicos por enfermedad y estado (sin datos personales)
// GET ?key=…     → todos los registros (clave PRESENTER_KEY); &csv=1 los entrega como CSV
const { rateLimit, readJson, redis, redisConf, originOk } = require('./_lib');
const LIST = 'censo:registros', BY_ENF = 'censo:enf', BY_EDO = 'censo:edo';

const QUIEN = ['paciente', 'familiar'];
const COMO = ['genetico', 'bioquimico', 'especialista'];
const SEXO = ['mujer', 'hombre', 'nd'];
const INST = ['ssa', 'imssb', 'imss', 'issste', 'pemex', 'mil', 'priv', 'ninguna'];

const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const pick = (v, list) => (list.includes(v) ? v : '');
const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };

function clean(p) {
  const y = new Date().getFullYear();
  const r = {
    quien: pick(p.quien, QUIEN),
    enf: str(p.enf, 24).toLowerCase().replace(/[^a-z0-9_]/g, ''),
    enf_otra: str(p.enf_otra, 120),
    como: pick(p.como, COMO),
    anio: int(p.anio, 1950, y),
    edad: int(p.edad, 0, 110),
    sexo: pick(p.sexo, SEXO),
    estado: str(p.estado, 40),
    inst: pick(p.inst, INST),
    contacto: p.ok_contacto ? str(p.contacto, 120) : '',
    ok_contacto: !!p.ok_contacto,
  };
  if (!p.ok_datos || !r.quien || !r.enf || !r.como || !r.estado || r.edad == null) return null;
  if (r.enf === 'otra' && !r.enf_otra) return null;
  return r;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisConf()) { res.statusCode = 503; return res.end('censo sin configurar'); }
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      const key = url.searchParams.get('key');
      if (key) {
        if (!process.env.PRESENTER_KEY || key !== process.env.PRESENTER_KEY) { res.statusCode = 403; return res.end('clave incorrecta'); }
        const rows = ((await redis(['LRANGE', LIST, '0', '-1'])) || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        if (url.searchParams.get('csv')) {
          const cols = ['fecha', 'quien', 'enf', 'enf_otra', 'como', 'anio', 'edad', 'sexo', 'estado', 'inst', 'ok_contacto', 'contacto'];
          const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="censo-observatorio.csv"');
          return res.end('﻿' + cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c])).join(',')).join('\n'));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ total: rows.length, registros: rows }));
      }
      const flat = a => { const o = {}; for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = +a[i + 1]; return o; };
      const [enf, edo, total] = await Promise.all([redis(['HGETALL', BY_ENF]), redis(['HGETALL', BY_EDO]), redis(['LLEN', LIST])]);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ total: total || 0, enfermedades: flat(enf), estados: flat(edo) }));
    }
    if (req.method === 'POST') {
      if (!originOk(req)) { res.statusCode = 403; return res.end('origen no permitido'); }
      if (!rateLimit(req, 5, 60 * 60 * 1000)) { res.statusCode = 429; return res.end('demasiados registros'); }
      const r = clean(await readJson(req));
      if (!r) { res.statusCode = 400; return res.end('faltan datos'); }
      r.fecha = new Date().toISOString();
      await redis(['RPUSH', LIST, JSON.stringify(r)]);
      await redis(['HINCRBY', BY_ENF, r.enf === 'otra' ? 'otra' : r.enf, '1']);
      await redis(['HINCRBY', BY_EDO, r.estado, '1']);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true }));
    }
    res.statusCode = 405; res.end();
  } catch (e) {
    res.statusCode = 500; res.end('error');
  }
};
