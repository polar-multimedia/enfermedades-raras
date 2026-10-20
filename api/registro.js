// Red de Acompañamiento del Observatorio: familias y pacientes con diagnóstico confirmado, sospecha o en búsqueda.
// Guarda en Upstash Redis. El nombre y el contacto son opcionales y solo se piden si la persona quiere acompañamiento.
// GET            → totales públicos por situación, enfermedad y estado (sin datos personales)
// GET ?key=…     → todos los registros (clave PRESENTER_KEY); &csv=1 los entrega como CSV
const crypto = require('crypto');
const { rateLimit, readJson, redis, redisConf, originOk } = require('./_lib');
const LIST = 'red:registros', BY_ENF = 'red:enf', BY_EDO = 'red:edo', BY_SIT = 'red:sit';
const CONSENT_VERSION = 'v1 · 2026-10-20';

const SIT = ['confirmado', 'sospecha', 'buscando'];
const QUIEN = ['paciente', 'familiar'];
const COMO = ['genetico', 'bioquimico', 'especialista'];
const SEXO = ['mujer', 'hombre', 'nd'];
const INST = ['ssa', 'imssb', 'imss', 'issste', 'pemex', 'mil', 'priv', 'ninguna'];
const PREF = ['whatsapp', 'llamada', 'correo'];

const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const pick = (v, list) => (list.includes(v) ? v : '');
const int = (v, lo, hi) => { const n = parseInt(v, 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const folio = p => p + '-' + Array.from(crypto.randomBytes(6), b => AB[b % AB.length]).join('');

function clean(p) {
  const y = new Date().getFullYear();
  const okC = !!p.ok_contacto;
  const r = {
    situacion: pick(p.situacion, SIT) || 'confirmado',
    quien: pick(p.quien, QUIEN),
    enf: str(p.enf, 24).toLowerCase().replace(/[^a-z0-9_]/g, ''),
    enf_otra: str(p.enf_otra, 120),
    como: pick(p.como, COMO),
    anio: int(p.anio, 1950, y),
    edad: int(p.edad, 0, 110),
    sexo: pick(p.sexo, SEXO),
    estado: str(p.estado, 40),
    inst: pick(p.inst, INST),
    folio_medico: str(p.folio_medico, 12).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
    nombre: okC ? str(p.nombre, 60) : '',
    contacto: okC ? str(p.contacto, 120) : '',
    preferencia: okC ? pick(p.preferencia, PREF) : '',
    ok_datos: !!p.ok_datos,
    ok_contacto: okC,
    ok_asociacion: okC && !!p.ok_asociacion,
    ok_instituciones: okC && !!p.ok_instituciones,
    consentimiento: CONSENT_VERSION,
  };
  if (!r.ok_datos || !r.quien || !r.estado || r.edad == null) return null;
  if (r.situacion !== 'buscando' && !r.enf) return null;
  if (r.enf === 'otra' && !r.enf_otra) return null;
  if (r.situacion === 'confirmado' && !r.como) return null;
  if (r.ok_contacto && !r.contacto) return null;
  return r;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisConf()) { res.statusCode = 503; return res.end('registro sin configurar'); }
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      const key = url.searchParams.get('key');
      if (key) {
        if (!process.env.PRESENTER_KEY || key !== process.env.PRESENTER_KEY) { res.statusCode = 403; return res.end('clave incorrecta'); }
        const rows = ((await redis(['LRANGE', LIST, '0', '-1'])) || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        if (url.searchParams.get('csv')) {
          const cols = ['fecha', 'folio', 'situacion', 'quien', 'enf', 'enf_otra', 'como', 'anio', 'edad', 'sexo', 'estado', 'inst', 'folio_medico', 'nombre', 'contacto', 'preferencia', 'ok_contacto', 'ok_asociacion', 'ok_instituciones', 'consentimiento'];
          const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="red-de-acompanamiento.csv"');
          return res.end('﻿' + cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c])).join(',')).join('\n'));
        }
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ total: rows.length, registros: rows }));
      }
      const flat = a => { const o = {}; for (let i = 0; i < (a || []).length; i += 2) o[a[i]] = +a[i + 1]; return o; };
      const [enf, edo, sit, total] = await Promise.all([redis(['HGETALL', BY_ENF]), redis(['HGETALL', BY_EDO]), redis(['HGETALL', BY_SIT]), redis(['LLEN', LIST])]);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ total: total || 0, situaciones: flat(sit), enfermedades: flat(enf), estados: flat(edo) }));
    }
    if (req.method === 'POST') {
      if (!originOk(req)) { res.statusCode = 403; return res.end('origen no permitido'); }
      if (!rateLimit(req, 5, 60 * 60 * 1000)) { res.statusCode = 429; return res.end('demasiados registros'); }
      const r = clean(await readJson(req));
      if (!r) { res.statusCode = 400; return res.end('faltan datos'); }
      r.fecha = new Date().toISOString();
      r.folio = folio('RA');
      await redis(['RPUSH', LIST, JSON.stringify(r)]);
      if (r.enf) await redis(['HINCRBY', BY_ENF, r.enf === 'otra' ? 'otra' : r.enf, '1']);
      await redis(['HINCRBY', BY_EDO, r.estado, '1']);
      await redis(['HINCRBY', BY_SIT, r.situacion, '1']);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, folio: r.folio }));
    }
    res.statusCode = 405; res.end();
  } catch (e) {
    res.statusCode = 500; res.end('error');
  }
};
