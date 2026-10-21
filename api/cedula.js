// Sonda temporal: inspecciona el buscador público del Registro Nacional de Profesionistas.
module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const target = url.searchParams.get('u') || 'https://cedulaprofesional.sep.gob.mx/';
  if (!/^https:\/\/[a-z0-9.-]*sep\.gob\.mx\//.test(target)) { res.statusCode = 400; return res.end('no'); }
  try {
    const r = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Chrome/124 Safari/537.36' } });
    const t = await r.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('status ' + r.status + '\n' + t.slice(0, +(url.searchParams.get('n') || 60000)));
  } catch (e) { res.statusCode = 500; res.end('err ' + e.message); }
};
