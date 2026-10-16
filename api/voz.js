// Conversación por voz en tiempo real (agentes de ElevenLabs), como PULSO by Lacteol.
// GET /api/voz?agente=rumbo|clara
// - Con ELEVENLABS_API_KEY: pide a ElevenLabs un token de un solo uso (el agente puede ser privado
//   y la llave nunca llega al navegador).
// - Sin llave: entrega el id del agente (el agente debe ser público en ElevenLabs).
// Variables: ELEVENLABS_AGENT_RUMBO, ELEVENLABS_AGENT_CLARA y, opcional, ELEVENLABS_API_KEY.
const { rateLimit, originOk } = require('./_lib');
const AG = { rumbo: 'ELEVENLABS_AGENT_RUMBO', clara: 'ELEVENLABS_AGENT_CLARA' };
// Agentes públicos de la cuenta de Polar (creados el 15 oct 2026). Las variables de entorno, si existen, mandan.
const DEF = { rumbo: 'agent_5201m518kr4gffq932p4a5neezae', clara: 'agent_7301m519evfdfmatf3v1whwcxn96' };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' || !originOk(req)) { res.statusCode = 405; return res.end(); }
  if (!rateLimit(req, 20, 10 * 60 * 1000)) { res.statusCode = 429; return res.end('demasiadas llamadas'); }
  const q = new URL(req.url, 'http://x').searchParams.get('agente');
  const id = AG[q] && (process.env[AG[q]] || DEF[q]);
  if (!id) { res.statusCode = 501; return res.end('agente de voz no configurado'); }
  res.setHeader('Content-Type', 'application/json');
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return res.end(JSON.stringify({ agentId: id }));
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=' + encodeURIComponent(id), { headers: { 'xi-api-key': key } });
    if (!r.ok) throw new Error('token ' + r.status);
    const { token } = await r.json();
    return res.end(JSON.stringify({ conversationToken: token }));
  } catch (e) {
    console.error('voz', e.message);
    return res.end(JSON.stringify({ agentId: id }));
  }
};
