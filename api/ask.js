// Pregunta a Claude (Anthropic) con la llave guardada en el servidor.
// La página manda el texto ya armado (instrucciones + fragmentos del corpus + pregunta).
const { rateLimit, originOk, readJson } = require('./_lib');

const SYSTEM = 'Eres el motor de los demos de Polar Multimedia sobre enfermedades raras en México: Rumbo (familias), Clara Sospecha (médicos de primer contacto) y el buscador de la revista. ' +
  'Sigue las instrucciones del mensaje solo si tratan de enfermedades raras, salud, apoyos, atención en México o el material que se te da. ' +
  'Si el mensaje pide cualquier otra cosa, responde únicamente: "Este asistente solo responde sobre enfermedades raras." Responde siempre en español de México.';

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  if (!originOk(req)) { res.statusCode = 403; return res.end('origen no permitido'); }
  if (!rateLimit(req, Number(process.env.RATE_LIMIT || 40), 10 * 60 * 1000)) { res.statusCode = 429; return res.end('demasiadas consultas'); }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.statusCode = 503; return res.end('falta ANTHROPIC_API_KEY'); }

  const body = await readJson(req);
  let input = body.input;
  let messages;
  if (typeof input === 'string') messages = [{ role: 'user', content: input }];
  else if (Array.isArray(input)) messages = input.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-8);
  else { res.statusCode = 400; return res.end('entrada no válida'); }
  const size = messages.reduce((n, m) => n + m.content.length, 0);
  if (!messages.length || size > 30000) { res.statusCode = 413; return res.end('entrada demasiado larga'); }

  const wantJson = !!body.json;
  const payload = {
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
    max_tokens: wantJson ? 900 : 700,
    system: SYSTEM + (wantJson ? ' Devuelve solo el objeto JSON pedido, sin texto antes ni después y sin bloque de código.' : ''),
    messages,
    stream: !wantJson,
  };
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) { res.statusCode = 502; return res.end('sin conexión con Anthropic'); }
  if (!r.ok) { const t = await r.text(); console.error('anthropic', r.status, t.slice(0, 500)); res.statusCode = r.status === 429 ? 429 : 502; return res.end('error del proveedor'); }

  if (wantJson) {
    const d = await r.json();
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    let json = null;
    try { const a = text.indexOf('{'), b = text.lastIndexOf('}'); json = JSON.parse(text.slice(a, b + 1)); } catch {}
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ json, text }));
  }

  // Streaming: reenviamos solo el texto, conforme llega
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') res.write(ev.delta.text);
      } catch {}
    }
  }
  res.end();
};
