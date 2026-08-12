import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    blockchain: {
      isOnline: true,
      nodesSync: 12,
      totalNodes: 12,
    },
  })
})

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.path}` })
})

export default app
