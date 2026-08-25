import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/** GET /api/configuracion */
router.get('/', asyncHandler(async (req, res) => {
  const [organizacion, parametros, campanias, factores, almacenes, clientes] = await Promise.all([
    uno(`select id, nombre, codigo_ico, nit, direccion from organizacion where id = 1`),
    q(`select clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor,
              actualizado_en
       from parametros order by grupo, clave`),
    q(`select id, fecha_inicio, fecha_fin, activa,
              (select count(*)::int from entregas_acopio e where e.campania_id = c.id) as entregas
       from campanias c order by id desc`),
    q(`select campania_id, origen, destino, factor, es_estimado, nota
       from factores_conversion order by campania_id desc, origen, destino`),
    q(`select id, nombre, ubicacion, capacidad_kg from almacenes order by id`),
    q(`select id, nombre, pais, activo from clientes order by nombre`),
  ])

  res.json({
    success: true,
    data: {
      organizacion,
      parametros,
      campanias,
      factores,
      almacenes,
      clientes,
      sistema: {
        entorno: process.env.VERCEL ? `vercel/${process.env.VERCEL_ENV ?? '?'}` : 'local',
        nodeVersion: process.version,
        redFabricDesplegada: false,
      },
    },
  })
}))

/** PATCH /api/configuracion/parametros/:clave */
router.patch('/parametros/:clave', asyncHandler(async (req, res) => {
  const { clave } = req.params
  const { valor } = req.body

  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return res.status(400).json({ success: false, error: 'Falta `valor`' })
  }

  const p = await uno(`select * from parametros where clave = $1`, [clave])
  if (!p) return res.status(404).json({ success: false, error: `Parametro ${clave} no existe` })

  const texto = String(valor).trim()

  // Validar contra el tipo y el rango declarados en la propia tabla, para que
  // agregar un parametro nuevo no exija tocar esta validacion.
  if (p.tipo === 'numero') {
    const n = Number(texto)
    if (!Number.isFinite(n)) {
      return res.status(400).json({ success: false, error: `"${texto}" no es un numero` })
    }
    if (p.min_valor != null && n < Number(p.min_valor)) {
      return res.status(400).json({
        success: false, error: `${clave} no puede ser menor que ${p.min_valor}` })
    }
    if (p.max_valor != null && n > Number(p.max_valor)) {
      return res.status(400).json({
        success: false, error: `${clave} no puede ser mayor que ${p.max_valor}` })
    }
  } else if (p.tipo === 'booleano' && !['true', 'false'].includes(texto)) {
    return res.status(400).json({ success: false, error: `${clave} debe ser true o false` })
  }

  const fila = await uno(
    `update parametros set valor = $1, actualizado_en = now()
     where clave = $2 returning clave, valor, tipo, unidad, actualizado_en`,
    [texto, clave])
  res.json({ success: true, data: fila })
}))

/** PATCH /api/configuracion/organizacion */
router.patch('/organizacion', asyncHandler(async (req, res) => {
  const { nombre, codigo_ico, nit, direccion } = req.body
  if (nombre !== undefined && !String(nombre).trim()) {
    return res.status(400).json({ success: false, error: 'El nombre no puede quedar vacio' })
  }
  const fila = await uno(`
    update organizacion set
      nombre     = coalesce($1, nombre),
      codigo_ico = coalesce($2, codigo_ico),
      nit        = coalesce($3, nit),
      direccion  = coalesce($4, direccion)
    where id = 1
    returning id, nombre, codigo_ico, nit, direccion`,
    [nombre ?? null, codigo_ico ?? null, nit ?? null, direccion ?? null])
  res.json({ success: true, data: fila })
}))

/** PATCH /api/configuracion/campania-activa  { campania: 2025 } */
router.patch('/campania-activa', asyncHandler(async (req, res) => {
  const campania = Number(req.body.campania)
  if (!Number.isInteger(campania)) {
    return res.status(400).json({ success: false, error: '`campania` debe ser un anio' })
  }
  const existe = await uno(`select id from campanias where id = $1`, [campania])
  if (!existe) return res.status(404).json({ success: false, error: `La campania ${campania} no existe` })

  // Solo una campania activa a la vez.
  await q(`update campanias set activa = (id = $1)`, [campania])
  const filas = await q(`select id, activa from campanias order by id desc`)
  res.json({ success: true, data: filas })
}))

export default router
