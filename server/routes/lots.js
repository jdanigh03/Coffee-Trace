import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/** GET /api/lots  -> todos los lotes con sus totales reales */
router.get('/', asyncHandler(async (req, res) => {
  const { certificacion, campania, estado } = req.query
  const filas = await q(`
    select t.lote_id as id, t.codigo, t.campania_id, t.certificacion, t.estado,
           t.entregas, t.kg_guinda_real, t.latas, t.total_pagado_bs,
           t.entregas_observadas,
           eq.kg_pergamino_calc, eq.kg_verde_oro_calc
    from v_lote_totales t
    left join v_equivalencias_lote eq on eq.lote_id = t.lote_id
    where ($1::text is null or t.certificacion::text = $1)
      and ($2::int  is null or t.campania_id = $2)
      and ($3::text is null or t.estado::text = $3)
    order by t.codigo`,
    [certificacion ?? null, campania ?? null, estado ?? null])
  res.json({ success: true, data: filas })
}))

/** GET /api/lots/:codigo  -> cabecera + cadena completa del lote */
router.get('/:codigo', asyncHandler(async (req, res) => {
  const { codigo } = req.params

  const lote = await uno(`
    select t.lote_id as id, t.codigo, t.campania_id, t.certificacion, t.estado,
           t.entregas, t.kg_guinda_real, t.latas, t.total_pagado_bs, t.entregas_observadas,
           eq.kg_mote_calc, eq.kg_pergamino_calc, eq.kg_verde_oro_calc
    from v_lote_totales t
    left join v_equivalencias_lote eq on eq.lote_id = t.lote_id
    where t.codigo = $1`, [codigo])

  if (!lote) return res.status(404).json({ success: false, error: `Lote ${codigo} no encontrado` })

  const [envio, beneficio, muestras, despachos, recon, sellos] = await Promise.all([
    uno(`select fecha_salida, fecha_llegada, kg_pergamino_despachado,
                kg_pergamino_recibido, diferencia_kg, nota_remision, vehiculo, conductor
         from envios where lote_id = $1`, [lote.id]),
    uno(`select id, kg_pergamino_entrada, kg_trillado_calc, kg_verde_calc,
                kg_caracol_calc, kg_descarte_calc, kg_verde_real, rendimiento_pct
         from beneficio_seco where lote_id = $1`, [lote.id]),
    q(`select tipo, kg, fecha, motivo from muestras where lote_id = $1 order by fecha`, [lote.id]),
    q(`select d.fecha_despacho, d.kg_neto, dl.kg_asignados, c.numero, cl.nombre as cliente, cl.pais
       from despacho_lotes dl
       join despachos d on d.id = dl.despacho_id
       left join contratos c on c.id = d.contrato_id
       left join clientes cl on cl.id = c.cliente_id
       where dl.lote_id = $1`, [lote.id]),
    uno(`select kg_acopio, kg_beneficio, diferencia, estado from v_reconciliacion_lote where codigo = $1`, [codigo]),
    q(`select tabla_origen, hash_sha256, tx_id, block_number, sellado_en
       from blockchain_registros where lote_id = $1 order by sellado_en`, [lote.id]),
  ])

  const productores = await q(`
    select bp.nombre_excel, bp.fuente, bp.kg_guinda, bp.kg_verde_export, bp.revision,
           p.nombre as persona
    from beneficio_productor bp
    join beneficio_seco bs on bs.id = bp.beneficio_id
    left join personas p on p.id = bp.persona_id
    where bs.lote_id = $1
    order by bp.kg_guinda desc`, [lote.id])

  res.json({
    success: true,
    data: { ...lote, envio, beneficio, muestras, despachos, reconciliacion: recon,
            sellosBlockchain: sellos, productores },
  })
}))

/** GET /api/lots/:codigo/entregas  -> el acopio que compone el lote */
router.get('/:codigo/entregas', asyncHandler(async (req, res) => {
  const filas = await q(`
    select e.id, e.fecha, cp.codigo as codigo_productor, cp.nombre_excel,
           co.nombre as comunidad, e.kg_guinda_real, e.latas,
           e.precio_unitario_bs, e.total_pagado_bs, e.estatus_declarado,
           e.revision, e.revision_nota
    from entregas_acopio e
    join lotes l              on l.id = e.lote_id
    join codigos_productor cp on cp.id = e.codigo_productor_id
    left join parcelas pa     on pa.id = e.parcela_id
    left join comunidades co  on co.id = pa.comunidad_id
    where l.codigo = $1
    order by e.fecha, cp.codigo`, [req.params.codigo])
  res.json({ success: true, data: filas, count: filas.length })
}))

/** GET /api/lots/:codigo/trazabilidad  -> la cadena resumida, para el certificado */
router.get('/:codigo/trazabilidad', asyncHandler(async (req, res) => {
  const t = await uno(`select * from v_trazabilidad_lote where lote = $1`, [req.params.codigo])
  if (!t) return res.status(404).json({ success: false, error: 'Lote no encontrado' })
  res.json({ success: true, data: t })
}))

export default router
