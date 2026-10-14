// Votación del Barómetro en Vivo: cada celular guarda su voto; la pantalla lo lee cada 2 s.
// Usa Upstash Redis (integración gratuita de Vercel). Sin Redis, la votación queda apagada.
const { rateLimit, readJson, redis, redisConf } = require('./_lib');
const KEY = 'baro:' + (process.env.BARO_SESSION || 'senado');
const Q = { q1: [0, 4], q2: [0, 2], q3: [0, 7] };

function clean(p) {
  const out = {};
  if (p && (p.role === 'voter' || p.role === 'pres')) out.role = p.role;
  if (p && typeof p.q === 'number' && p.q >= 0 && p.q <= 2) out.q = p.q;
  if (p && p.v && typeof p.v === 'object') {
    const v = {};
    for (const k of Object.keys(Q)) {
      const [lo, hi] = Q[k], x = p.v[k];
      if (Array.isArray(x)) v[k] = x.filter(n => Number.isInteger(n) && n >= lo && n <= hi).slice(0, 3);
      else if (Number.isInteger(x) && x >= lo && x <= hi) v[k] = x;
    }
    out.v = v;
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!redisConf()) { res.statusCode = 503; return res.end('votación sin configurar'); }
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x');
      if (url.searchParams.get('reset')) {
        if (!process.env.PRESENTER_KEY || url.searchParams.get('key') !== process.env.PRESENTER_KEY) { res.statusCode = 403; return res.end('clave incorrecta'); }
        await redis(['DEL', KEY]);
        return res.end('Votación reiniciada');
      }
      const flat = (await redis(['HGETALL', KEY])) || [];
      const peers = [];
      for (let i = 0; i < flat.length; i += 2) { try { peers.push({ id: flat[i], presence: JSON.parse(flat[i + 1]) }); } catch {} }
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ peers }));
    }
    if (req.method === 'POST') {
      if (!rateLimit(req, 120, 10 * 60 * 1000)) { res.statusCode = 429; return res.end(); }
      const b = await readJson(req);
      const id = String(b.id || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
      if (!id) { res.statusCode = 400; return res.end(); }
      await redis(['HSET', KEY, id, JSON.stringify(clean(b.presence))]);
      await redis(['EXPIRE', KEY, 60 * 60 * 24 * 14]);
      return res.end('ok');
    }
    res.statusCode = 405; res.end();
  } catch (e) { console.error(e); res.statusCode = 500; res.end('error'); }
};
