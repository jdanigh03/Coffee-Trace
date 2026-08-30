import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

const PRECIO = {
  combustible: 'sultana_precio_combustible',
  venta: 'sultana_precio_venta',
  compost: 'sultana_precio_compost',
}

async function parametro(clave, porDefecto) {
  const r = await uno('select valor from parametros where clave = $1', [clave])
  const n = Number(r?.valor)
  return Number.isFinite(n) ? n : porDefecto
}

/** GET /api/sultana/lotes  -> cuanta corresponde a cada lote y cuanta se anoto */
router.get('/lotes', asyncHandler(async (req, res) => {
  const [filas, factor, precios] = await Promise.all([
    q('select * from v_sultana_lote order by codigo'),
    parametro('sultana_factor', 0.31),
    (async () => ({
      combustible: await parametro(PRECIO.combustible, 0),
      venta: await parametro(PRECIO.venta, 0),
      compost: await parametro(PRECIO.compost, 0),
    }))(),
  ])
  // Todo dentro de `data`: el cliente desenvuelve esa clave y si el factor
  // viajara fuera se perderia en el camino.
  res.json({ success: true, data: { lotes: filas, factor, precios } })
}))

/** GET /api/sultana  -> registros */
router.get('/', asyncHandler(async (req, res) => {
  const filas = await q(`
    select s.*, l.codigo as lote, l.certificacion, l.campania_id
    from sultana s
    join lotes l on l.id = s.lote_id
    order by s.fecha desc, s.creado_en desc
    limit 200`)
  res.json({ success: true, data: filas, count: filas.length })
}))

/** POST /api/sultana */
router.post('/', asyncHandler(async (req, res) => {
  const { lote, destino, numero_sacos, kg_sultana, fecha, responsable, observaciones } = req.body

  if (!lote) return res.status(400).json({ success: false, error: 'Falta el lote' })
  if (!destino || !(destino in PRECIO)) {
    return res.status(400).json({
      success: false, error: 'El destino debe ser combustible, venta o compost' })
  }

  const l = await uno(`
    select l.id, l.codigo, t.kg_guinda_real
    from lotes l join v_lote_totales t on t.lote_id = l.id
    where l.codigo = $1`, [lote])
  if (!l) return res.status(404).json({ success: false, error: `El lote ${lote} no existe` })

  // Los kg se calculan del lote, no se aceptan del formulario: el documento
  // los marca como solo lectura y asi no se puede declarar menos pulpa de la
  // que realmente salio.
  const factor = await parametro('sultana_factor', 0.31)
  const kg = Number(kg_sultana) > 0
    ? Number(kg_sultana)
    : Math.round(Number(l.kg_guinda_real) * factor * 100) / 100

  if (!(kg > 0)) {
    return res.status(400).json({
      success: false, error: 'El lote no tiene kilos de guinda para calcular la sultana' })
  }

  const precio = await parametro(PRECIO[destino], 0)
  const valor = Math.round(kg * precio * 100) / 100

  const fila = await uno(`
    insert into sultana
      (lote_id, fecha, kg_sultana, destino, numero_sacos, valor_estimado_bs,
       responsable, observaciones)
    values ($1, coalesce($2::date, current_date), $3, $4, $5, $6, $7, $8)
    returning *`,
    [l.id, fecha || null, kg, destino, numero_sacos || null, valor,
     responsable || null, observaciones || null])

  res.status(201).json({
    success: true,
    data: { ...fila, lote: l.codigo, factor_usado: factor, precio_por_kg: precio },
  })
}))

export default router
