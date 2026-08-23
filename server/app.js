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
  try {
    const u = new URL(limpio)
    return {
      host: u.hostname,
      puerto: u.port,
      usuario: u.username,
      longitud: valor.length,
      espaciosAlBorde: limpio !== valor,
      modo: u.port === '6543' ? 'transaction pooler (correcto para serverless)'
          : u.hostname.startsWith('db.') ? 'conexion directa (NO funciona en Vercel: solo IPv6)'
          : 'otro',
    }
  } catch {
    // La longitud delata un valor truncado o pegado a medias sin revelarlo:
    // una cadena de pooler completa ronda los 105-110 caracteres.
    return {
      problema: 'presente pero no es una URL valida',
      longitud: valor.length,
      empiezaPorPostgres: /^postgres(ql)?:\/\//.test(limpio),
      tieneSaltosDeLinea: /[\r\n]/.test(valor),
      espaciosAlBorde: limpio !== valor,
    }
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

    // Nombres que pone la plataforma. Todo lo demas lo configuro el usuario:
    // si esa lista sale vacia, el proyecto no tiene NINGUNA variable propia.
    const DEL_SISTEMA = /^(VERCEL|AWS|LAMBDA|_|NODE|PATH|HOME|PWD|SHLVL|TZ|LANG|TERM|HOSTNAME|npm_)/i

    salida.diagnostico = {
      entorno: process.env.VERCEL ? `vercel/${process.env.VERCEL_ENV ?? '?'}` : 'local',
      proyecto: process.env.VERCEL_PROJECT_PRODUCTION_URL
        ?? process.env.VERCEL_URL ?? 'desconocido',
      rama: process.env.VERCEL_GIT_COMMIT_REF ?? '?',
      commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || '?',
      SUPABASE_DB_URL: describirCadena(process.env.SUPABASE_DB_URL),
      DATABASE_URL: describirCadena(process.env.DATABASE_URL),
      // Delata nombres mal escritos: espacios, minusculas, prefijos sobrantes.
      variablesParecidas: Object.keys(process.env)
        .filter((k) => /SUPA|DATABASE|POSTGRES|PG_/i.test(k))
        .map((k) => JSON.stringify(k)),
      // Solo NOMBRES, nunca valores.
      variablesPropias: Object.keys(process.env).filter((k) => !DEL_SISTEMA.test(k)).sort(),
      totalVariables: Object.keys(process.env).length,
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
