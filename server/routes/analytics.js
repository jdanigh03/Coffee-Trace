import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/** GET /api/analytics/dashboard */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const campania = Number(req.query.campania ?? 2025)

  const [resumen, porCert, porMes, lotes, inconsistencias] = await Promise.all([
    uno(`select count(*)::int                       as entregas,
                count(distinct persona_id)::int     as productores,
                coalesce(sum(kg_guinda_real), 0)    as kg_guinda,
                coalesce(sum(total_pagado_bs), 0)   as total_pagado_bs,
                count(*) filter (where revision <> 'ok')::int as observadas
         from entregas_acopio where campania_id = $1`, [campania]),
    q(`select l.certificacion, count(distinct l.id)::int as lotes,
              coalesce(sum(t.kg_guinda_real), 0) as kg_guinda
       from lotes l join v_lote_totales t on t.lote_id = l.id
       where l.campania_id = $1 group by l.certificacion`, [campania]),
    q(`select to_char(fecha, 'YYYY-MM') as mes,
              sum(kg_guinda_real) as kg_guinda,
              count(*)::int as entregas,
              round(avg(precio_unitario_bs), 2) as precio_promedio
       from entregas_acopio where campania_id = $1
       group by 1 order by 1`, [campania]),
    q(`select codigo, certificacion, estado, entregas, kg_guinda_real, entregas_observadas
       from v_lote_totales where campania_id = $1 order by codigo`, [campania]),
    uno(`select count(*)::int as total from v_inconsistencias`),
  ])

  res.json({
    success: true,
    data: { campania, resumen, porCertificacion: porCert, porMes, lotes,
            inconsistencias: inconsistencias.total },
  })
}))

/** GET /api/analytics/rendimiento  -> estimado vs medido */
router.get('/rendimiento', asyncHandler(async (req, res) => {
  const filas = await q(`select * from v_rendimiento_real_vs_estimado order by codigo`)
  res.json({ success: true, data: filas })
}))

/** GET /api/analytics/reconciliacion  -> donde el beneficio no cuadra con el acopio */
router.get('/reconciliacion', asyncHandler(async (req, res) => {
  const filas = await q(`select * from v_reconciliacion_lote order by codigo`)
  res.json({ success: true, data: filas })
}))

/** GET /api/analytics/socios  -> retencion por campania */
router.get('/socios', asyncHandler(async (req, res) => {
  const filas = await q(`select * from v_socios_por_campania order by campania_id, estado`)
  res.json({ success: true, data: filas })
}))

/** GET /api/analytics/inconsistencias  -> la lista de trabajo para depurar */
router.get('/inconsistencias', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limit ?? 100), 1000)
  const [filas, porMotivo] = await Promise.all([
    q(`select * from v_inconsistencias limit $1`, [limite]),
    q(`select case
                 when revision_nota ilike '%discrepante%' then 'peso discrepante entre archivos'
                 when revision_nota ilike '%vacio%'       then 'estatus vacio'
                 when revision_nota ilike '%transicion%'  then 'transicion en planilla organica'
                 else 'otro'
               end as motivo,
              count(*)::int as filas
       from entregas_acopio where revision <> 'ok' group by 1 order by 2 desc`),
  ])
  res.json({ success: true, data: filas, porMotivo })
}))

export default router
