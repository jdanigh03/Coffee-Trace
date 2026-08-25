import express from 'express'
import { q, asyncHandler } from '../db.js'

const router = express.Router()

const ORDEN = { critica: 0, alta: 1, media: 2, info: 3 }

/** GET /api/notificaciones */
router.get('/', asyncHandler(async (req, res) => {
  const alertas = await q(`select * from v_alertas`)
  alertas.sort((a, b) => (ORDEN[a.severidad] ?? 9) - (ORDEN[b.severidad] ?? 9))

  const porSeveridad = alertas.reduce((acc, a) => {
    acc[a.severidad] = (acc[a.severidad] ?? 0) + 1
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      alertas,
      // `total` cuenta ALERTAS, no registros: 171 entregas observadas son una
      // sola alerta. El badge de la campana muestra este numero.
      total: alertas.length,
      porSeveridad,
      requiereAtencion: alertas.some((a) => a.severidad === 'critica' || a.severidad === 'alta'),
    },
  })
}))

export default router
