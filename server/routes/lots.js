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

/**
 * GET /api/lots/entregas  -> todas las entregas, con filtros.
 * Va antes de /:codigo para que "entregas" no se lea como un codigo de lote.
 */
router.get('/entregas', asyncHandler(async (req, res) => {
  const { campania = 2025, revision, comunidad, buscar } = req.query
  const limite = Math.min(Number(req.query.limit ?? 200), 2000)

  const filas = await q(`
    select e.id, e.fecha, cp.codigo as codigo_productor, cp.nombre_excel,
           p.nombre as productor, p.id as persona_id,
           co.nombre as comunidad, l.codigo as lote,
           e.kg_guinda_real, e.latas, e.precio_unitario_bs, e.total_pagado_bs,
           e.estatus_declarado, e.revision, e.revision_nota
    from entregas_acopio e
    join codigos_productor cp on cp.id = e.codigo_productor_id
    left join personas p      on p.id = e.persona_id
    left join parcelas pa     on pa.id = e.parcela_id
    left join comunidades co  on co.id = pa.comunidad_id
    left join lotes l         on l.id = e.lote_id
    where e.campania_id = $1
      and ($2::text is null or e.revision::text = $2)
      and ($3::text is null or co.nombre = $3)
      and ($4::text is null or p.nombre ilike '%' || $4 || '%' or cp.codigo ilike '%' || $4 || '%')
    order by e.fecha desc, cp.codigo
    limit $5`,
    [campania, revision ?? null, comunidad ?? null, buscar ?? null, limite])

  res.json({ success: true, data: filas, count: filas.length })
}))

/** GET /api/lots/envios  -> los envios Taipiplaya -> La Paz */
router.get('/envios', asyncHandler(async (req, res) => {
  const filas = await q(`
    select en.id, l.codigo as lote, l.certificacion, l.campania_id,
           en.fecha_salida, en.fecha_llegada,
           en.kg_pergamino_despachado, en.kg_pergamino_recibido, en.diferencia_kg,
           en.nota_remision, en.vehiculo, en.conductor, en.responsable,
           t.kg_guinda_real, t.entregas
    from envios en
    join lotes l          on l.id = en.lote_id
    left join v_lote_totales t on t.lote_id = l.id
    order by en.fecha_salida desc`)
  res.json({ success: true, data: filas, count: filas.length })
}))

/** GET /api/lots/despachos  -> despachos y su contrato */
router.get('/despachos', asyncHandler(async (req, res) => {
  const filas = await q(`
    select d.id, d.fecha_despacho, d.contenedor, d.precintos, d.kg_neto, d.responsable,
           c.numero as contrato, c.certificacion, c.sacos, c.kg_por_saco, c.total_kg,
           c.tipo_empaque, c.incoterm, c.puerto_destino,
           cl.nombre as cliente, cl.pais,
           e.fecha_embarque, e.bl_numero, e.naviera,
           (select count(*)::int from despacho_lotes dl where dl.despacho_id = d.id) as lotes,
           (select string_agg(l2.codigo, ', ' order by l2.codigo)
              from despacho_lotes dl2 join lotes l2 on l2.id = dl2.lote_id
             where dl2.despacho_id = d.id) as codigos_lote
    from despachos d
    left join contratos c     on c.id = d.contrato_id
    left join clientes cl     on cl.id = c.cliente_id
    left join exportaciones e on e.despacho_id = d.id
    order by d.fecha_despacho desc`)
  res.json({ success: true, data: filas, count: filas.length })
}))

/**
 * POST /api/lots/entregas  -> registra una entrega de acopio.
 *
 * `latas` y `total_pagado_bs` NO se aceptan del cliente: son columnas generadas
 * en Postgres. Si se enviaran, un error de calculo en el navegador quedaria
 * registrado como si fuera el peso real.
 */
router.post('/entregas', asyncHandler(async (req, res) => {
  const {
    fecha, codigo_productor, kg_guinda_real, precio_unitario_bs,
    campania_id = 2025, lote, observaciones,
  } = req.body

  if (!fecha || !codigo_productor || !kg_guinda_real || !precio_unitario_bs) {
    return res.status(400).json({
      success: false,
      error: 'Faltan datos: fecha, codigo_productor, kg_guinda_real y precio_unitario_bs',
    })
  }
  const kg = Number(kg_guinda_real)
  const precio = Number(precio_unitario_bs)
  if (!(kg > 0)) return res.status(400).json({ success: false, error: 'El peso debe ser mayor que 0' })
  if (!(precio >= 0)) return res.status(400).json({ success: false, error: 'Precio invalido' })

  const cp = await uno(
    `select cp.id, cp.parcela_id, cp.persona_id, cp.nombre_excel
     from codigos_productor cp where cp.codigo = $1 limit 1`, [codigo_productor])
  if (!cp) {
    return res.status(404).json({
      success: false, error: `El codigo ${codigo_productor} no existe en el padron` })
  }

  let loteId = null
  if (lote) {
    const l = await uno('select id from lotes where codigo = $1', [lote])
    if (!l) return res.status(404).json({ success: false, error: `El lote ${lote} no existe` })
    loteId = l.id
  }

  // El estatus sale de la certificacion de la parcela, no del formulario:
  // asi no se puede declarar organico un cafe de transicion a mano.
  const cert = cp.parcela_id
    ? await uno(`select estatus from certificaciones
                 where parcela_id = $1 and campania_id = $2`, [cp.parcela_id, campania_id])
    : null

  // El trigger fn_validar_certificacion_entrega puede marcarla como observada.
  const fila = await uno(`
    insert into entregas_acopio
      (campania_id, fecha, codigo_productor_id, parcela_id, persona_id,
       kg_guinda_real, precio_unitario_bs, estatus_declarado, lote_id, observaciones)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning id, fecha, kg_guinda_real, latas, precio_unitario_bs, total_pagado_bs,
              estatus_declarado, revision, revision_nota`,
    [campania_id, fecha, cp.id, cp.parcela_id, cp.persona_id, kg, precio,
     cert?.estatus ?? null, loteId, observaciones ?? null])

  res.status(201).json({ success: true, data: { ...fila, productor: cp.nombre_excel } })
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
