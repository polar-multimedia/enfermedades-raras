# Polar · Enfermedades raras (versión web pública)

Rumbo, Clara Sospecha, Atlas y Barómetro en Vivo, listos para publicarse en Vercel.
Funciona sin que el público tenga cuenta de Claude: la inteligencia artificial pasa por el servidor de Polar, que guarda la llave de Anthropic.

## Qué hay en la carpeta

| Ruta | Qué es |
|---|---|
| `public/index.html` | La presentación completa con los cuatro demos |
| `public/audio/clara-gaucher.mp3` | Voz de Clara para el caso de ejemplo de Gaucher |
| `api/ask.js` | Habla con Claude (modelo Haiku) usando la llave del servidor |
| `api/room.js` | Guarda y cuenta los votos del Barómetro |
| `api/tts.js` | Opcional: voz natural de ElevenLabs para cualquier respuesta de Clara |
| `vercel.json` | Configuración de Vercel |

## Publicar (una sola vez)

1. **Sube la carpeta a GitHub.** Crea un repositorio nuevo (por ejemplo `polar-enfermedades-raras`) y sube todo el contenido de esta carpeta.
2. **Importa en Vercel.** En vercel.com → *Add New… → Project* → elige el repositorio. En *Framework Preset* deja **Other**. No cambies nada más.
3. **Pega la llave de Anthropic.** Antes de publicar, en *Environment Variables* agrega:
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu llave (empieza con `sk-ant-`)
4. **Deploy.** Vercel te da una dirección tipo `https://polar-enfermedades-raras.vercel.app`.

Si ya publicaste sin la llave: *Project → Settings → Environment Variables*, agrégala y luego *Deployments → … → Redeploy*.

## Encender la votación del Barómetro

La votación necesita una base de datos pequeña (gratis):

1. En Vercel, dentro del proyecto: *Storage → Create Database* (o *Marketplace*) → **Upstash Redis** → plan gratuito → *Connect to project*.
2. Vercel agrega solo las variables de conexión. Haz *Redeploy*.
3. Agrega también `PRESENTER_KEY` con una palabra secreta tuya. Sirve para reiniciar la votación antes del evento:
   `https://TU-DIRECCION.vercel.app/api/room?reset=1&key=TU_PALABRA`

El QR del Barómetro apunta solo a `https://TU-DIRECCION.vercel.app/#votar`. En un celular, la página abre directo en modo de voto.

## Variables de entorno

| Variable | ¿Obligatoria? | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Respuestas de Rumbo y Clara |
| `ANTHROPIC_MODEL` | No | Por omisión `claude-haiku-5-5` |
| Variables de Upstash (las pone Vercel) | Para votar | Barómetro en Vivo |
| `PRESENTER_KEY` | Recomendada | Reiniciar la votación |
| `ALLOWED_ORIGINS` | Recomendada | Tu dirección, p. ej. `https://polar-enfermedades-raras.vercel.app`; bloquea que otros sitios usen tu llave |
| `RATE_LIMIT` | No | Consultas por persona cada 10 min (por omisión 40) |
| `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID` | No | Voz natural en todas las respuestas de Clara |

## Cuidar el gasto

- En console.anthropic.com → *Billing / Limits*, pon un límite mensual (por ejemplo 20 USD). Cada pregunta con Haiku cuesta centavos.
- La función solo acepta temas de enfermedades raras, limita el tamaño de cada consulta y cuántas hace cada persona.
- La llave nunca llega al navegador: solo vive en Vercel.

## La voz de Clara

- **Caso de ejemplo de Gaucher** (sin cambiar los datos): voz natural pregrabada.
- **Cualquier otro caso:** si configuras ElevenLabs, voz natural; si no, la mejor voz en español que tenga el navegador. En Chrome y Edge suelen sonar mejor que en otros.
- El botón *Escuchar / Detener* repite o corta la voz. El abanico de luces late mientras habla.
