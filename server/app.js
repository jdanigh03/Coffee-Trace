import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { uno } from './db.js'

/**
 * Describe una cadena de conexion sin revelarla: solo host, puerto y usuario.
 * La contrasena nunca se incluye.
 */
function describirCadena(valor) {
  if (!valor) return 'ausente'
  const limpio = valor.trim()
  if (limpio !== valor) return 'presente pero con espacios al inicio o al final'
  try {
    const u = new URL(limpio)
    return {
      host: u.hostname,
      puerto: u.port,
      usuario: u.username,
      modo: u.port === '6543' ? 'transaction pooler (correcto para serverless)'
          : u.hostname.startsWith('db.') ? 'conexion directa (NO funciona en Vercel: solo IPv6)'
          : 'otro',
    }
  } catch {
    return 'presente pero no es una URL valida'
  }
}
import lotRoutes from './routes/lots.js'
import producerRoutes from './routes/producers.js'
import blockchainRoutes from './routes/blockchain.js'
import analyticsRoutes from './routes/analytics.js'

dotenv.config()

/**
 * App de Express sin `listen`.
 *
 * Se separa del arranque para que el mismo codigo sirva a los dos destinos:
 * `server/index.js` la escucha en un puerto (Docker, VPS, local) y
 * `api/index.js` la exporta como handler serverless (Vercel).
 */
const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/lots', lotRoutes)
app.use('/api/producers', producerRoutes)
app.use('/api/blockchain', blockchainRoutes)
app.use('/api/analytics', analyticsRoutes)

app.get('/api/health', async (req, res) => {
  const salida = { status: 'online', timestamp: new Date().toISOString() }
  try {
    const r = await uno(`select count(*)::int entregas from entregas_acopio`)
    salida.base = { conectada: true, entregas: r.entregas }
  } catch (e) {
    salida.status = 'degraded'
    salida.base = { conectada: false, error: e.message }

    // Diagnostico: por que no llega la cadena de conexion. Se reportan
    // NOMBRES y forma, nunca el valor: la contrasena no sale de aqui.
    const u = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL
    salida.diagnostico = {
      entorno: process.env.VERCEL ? `vercel/${process.env.VERCEL_ENV ?? '?'}` : 'local',
      SUPABASE_DB_URL: describirCadena(process.env.SUPABASE_DB_URL),
      DATABASE_URL: describirCadena(process.env.DATABASE_URL),
      // Delata nombres mal escritos: espacios, minusculas, prefijos sobrantes.
      variablesParecidas: Object.keys(process.env)
        .filter((k) => /SUPA|DATABASE|POSTGRES|PG_/i.test(k))
        .map((k) => JSON.stringify(k)),
      usable: Boolean(u),
    }
  }
  // Fabric aun no esta desplegado. No se reporta una red que no existe.
  salida.blockchain = { redDesplegada: false }
  res.status(salida.status === 'online' ? 200 : 503).json(salida)
})

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.path}` })
})

// Los handlers async pasan sus errores aqui via asyncHandler.
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.path}]`, err.message)
  res.status(500).json({ success: false, error: err.message })
})

export default app
