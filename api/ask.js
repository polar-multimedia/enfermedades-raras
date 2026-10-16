// Pregunta a Claude (Anthropic) con la llave guardada en el servidor.
// La página manda el texto ya armado (instrucciones + fragmentos del corpus + pregunta).
const { rateLimit, originOk, readJson } = require('./_lib');

const SYSTEM = 'Eres el motor del Acervo del Observatorio Latinoamericano de Enfermedades Poco Frecuentes (Capítulo México), operado por Polar Multimedia: Rumbo (familias), Clara (médicos de primer contacto) y el buscador del Acervo. ' +
  'Sigue las instrucciones del mensaje solo si tratan de enfermedades poco frecuentes, salud, apoyos, atención en México o el material que se te da. ' +
  'Si el mensaje pide cualquier otra cosa, responde únicamente: "Este asistente solo responde sobre enfermedades poco frecuentes." ' +
  'Di siempre "enfermedad poco frecuente" o "enfermedades poco frecuentes", nunca "rara" o "raras", salvo cuando sea parte del nombre propio de una fuente o una organización, o cuando cites textualmente una ley o un documento (por ejemplo, la Ley General de Salud dice "enfermedades raras"; algunos documentos dicen "huérfanas"). Si citas ese término, aclara que es el término del documento. Responde siempre en español de México.';

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
  // Archivos opcionales (resultado de tamiz neonatal en foto o PDF) adjuntos al último mensaje
  const OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const files = Array.isArray(body.files) ? body.files.slice(0, 3) : [];
  if (files.length) {
    let bytes = 0;
    const blocks = [];
    for (const f of files) {
      if (!f || !OK.includes(f.media_type) || typeof f.data !== 'string') { res.statusCode = 400; return res.end('archivo no válido'); }
      bytes += f.data.length * 0.75;
      blocks.push(f.media_type === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } }
        : { type: 'image', source: { type: 'base64', media_type: f.media_type, data: f.data } });
    }
    if (bytes > 3.2 * 1024 * 1024) { res.statusCode = 413; return res.end('archivo demasiado grande'); }
    const last = messages[messages.length - 1];
    messages[messages.length - 1] = { role: last.role, content: blocks.concat([{ type: 'text', text: last.content }]) };
  }

  const wantJson = !!body.json;
  const payload = {
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
    // Margen amplio: los modelos recientes pueden razonar antes de escribir y ese razonamiento también cuenta
    max_tokens: Number(process.env.MAX_TOKENS || 4000),
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
    if (!text) console.error('respuesta sin texto', d.stop_reason, (d.content || []).map(b => b.type));
    let json = null;
    try { const a = text.indexOf('{'), b = text.lastIndexOf('}'); json = JSON.parse(text.slice(a, b + 1)); } catch {}
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ json, text, stop: d.stop_reason }));
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
        if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason && ev.delta.stop_reason !== 'end_turn') console.error('stop', ev.delta.stop_reason);
      } catch {}
    }
  }
  res.end();
};
