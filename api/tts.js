// Opcional: voz natural de ElevenLabs para cualquier respuesta de Clara.
// Si no hay ELEVENLABS_API_KEY, responde 501 y la página usa la voz del navegador.
const { rateLimit, originOk, readJson } = require('./_lib');
module.exports = async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) { res.statusCode = 501; return res.end('sin voz configurada'); }
  if (req.method !== 'POST' || !originOk(req)) { res.statusCode = 405; return res.end(); }
  if (!rateLimit(req, 30, 10 * 60 * 1000)) { res.statusCode = 429; return res.end(); }
  const { text } = await readJson(req);
  if (!text || typeof text !== 'string') { res.statusCode = 400; return res.end(); }
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!voice) { res.statusCode = 501; return res.end('falta ELEVENLABS_VOICE_ID'); }
  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice + '?output_format=mp3_44100_64', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text: text.slice(0, 1200), model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2' }),
  });
  if (!r.ok) { res.statusCode = 502; return res.end('error de voz'); }
  res.setHeader('Content-Type', 'audio/mpeg');
  res.end(Buffer.from(await r.arrayBuffer()));
};
