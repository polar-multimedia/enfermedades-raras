// Utilidades compartidas: límites de uso y Upstash Redis (REST, sin dependencias)
const hits = new Map();
function rateLimit(req, max, windowMs) {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now); hits.set(ip, arr);
  return true;
}
function originOk(req) {
  const allow = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!allow.length) return true;
  const o = req.headers.origin || req.headers.referer || '';
  return allow.some(a => o.startsWith(a));
}
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const c of req) raw += c;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}
function redisConf() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}
async function redis(cmd) {
  const c = redisConf();
  if (!c) throw new Error('no-redis');
  const r = await fetch(c.url, { method: 'POST', headers: { Authorization: 'Bearer ' + c.token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}
module.exports = { rateLimit, originOk, readJson, redis, redisConf };
