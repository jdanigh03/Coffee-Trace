import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/**
 * Las seis etapas del beneficio humedo comparten estructura: cabecera ligada a
 * un lote y, en dos casos, lecturas de monitoreo. Un solo modulo generico evita
 * repetir seis veces el mismo CRUD.
 *
 * `columnas` actua ademas de lista blanca: nada que no este aqui llega al SQL.
 */
const ETAPAS = {
  tolva: {
    tabla: 'etapa_tolva',
    columnas: ['lote_id', 'kg_entrada', 'tolva', 'limpieza_previa', 'hora_limpieza',
      'responsable_limpieza', 'hora_inicio', 'hora_fin', 'operario', 'observaciones', 'estado'],
  },
  despulpado: {
    tabla: 'etapa_despulpado',
    columnas: ['lote_id', 'maquina', 'hora_inicio', 'hora_fin', 'operario', 'limpieza_validada',
      'responsable_limpieza', 'temperatura_c', 'velocidad_rpm', 'kg_entrada', 'kg_despulpado',
      'kg_sultana', 'destino_sultana', 'responsable_sultana', 'incidencias', 'estado'],
  },
  fermentacion: {
    tabla: 'etapa_fermentacion',
    columnas: ['lote_id', 'tanque', 'kg_entrada', 'hora_inicio', 'hora_fin',
      'mucilago_despegado', 'responsable', 'observaciones', 'estado'],
    lecturas: {
      tabla: 'fermentacion_lectura', fk: 'fermentacion_id',
      columnas: ['hora', 'temperatura_c', 'observaciones'], orden: 'hora',
    },
  },
  lavado: {
    tabla: 'etapa_lavado',
    columnas: ['lote_id', 'hora_inicio', 'hora_fin', 'encargado', 'operarios', 'calidad_agua',
      'temperatura_agua_c', 'carretillas', 'kg_por_carretilla', 'segregacion_ok',
      'observaciones', 'estado'],
  },
  secado: {
    tabla: 'etapa_secado',
    columnas: ['lote_id', 'tipo_secado', 'fecha_inicio', 'fecha_fin', 'temperatura_inicial_c',
      'humedad_inicial_pct', 'humedad_final_pct', 'validador_humedad', 'kg_entrada',
      'kg_pergamino_seco', 'perdida_agua_kg', 'carretillas_traslado', 'fecha_traslado',
      'observaciones', 'estado'],
    lecturas: {
      tabla: 'secado_lectura', fk: 'secado_id',
      columnas: ['fecha', 'temperatura_c', 'humedad_pct', 'estado_visual', 'incidencias'],
      orden: 'fecha',
    },
  },
  'almacen-temporal': {
    tabla: 'etapa_almacen_temporal',
    columnas: ['lote_id', 'fecha_ingreso', 'ubicacion', 'temperatura_c', 'humedad_pct',
      'kg_acumulado', 'lotes_diarios', 'responsable', 'observaciones', 'estado'],
  },
}

const vacio = (v) => v === '' || v === undefined || v === null

/** GET /api/etapas/avance  -> que etapas tiene cubierta cada lote */
router.get('/avance', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await q('select * from v_avance_fase_ii order by codigo') })
}))

/** GET /api/etapas/:etapa  -> registros de esa etapa, con su lote */
router.get('/:etapa', asyncHandler(async (req, res) => {
  const def = ETAPAS[req.params.etapa]
  if (!def) return res.status(404).json({ success: false, error: 'Etapa desconocida' })

  const filas = await q(`
    select e.*, l.codigo as lote, l.certificacion
    from ${def.tabla} e
    join lotes l on l.id = e.lote_id
    order by e.creado_en desc
    limit 200`)

  if (def.lecturas && filas.length) {
    const lecturas = await q(
      `select * from ${def.lecturas.tabla}
       where ${def.lecturas.fk} = any($1::uuid[])
       order by ${def.lecturas.orden}`,
      [filas.map((f) => f.id)])
    for (const f of filas) {
      f.lecturas = lecturas.filter((x) => x[def.lecturas.fk] === f.id)
    }
  }

  res.json({ success: true, data: filas, count: filas.length })
}))

/** POST /api/etapas/:etapa */
router.post('/:etapa', asyncHandler(async (req, res) => {
  const def = ETAPAS[req.params.etapa]
  if (!def) return res.status(404).json({ success: false, error: 'Etapa desconocida' })

  const { lote, lecturas, ...cuerpo } = req.body
  if (!lote) return res.status(400).json({ success: false, error: 'Falta el lote' })

  const l = await uno('select id from lotes where codigo = $1', [lote])
  if (!l) return res.status(404).json({ success: false, error: `El lote ${lote} no existe` })

  cuerpo.lote_id = l.id
  const cols = def.columnas.filter((c) => !vacio(cuerpo[c]))
  if (cols.length <= 1) {
    return res.status(400).json({ success: false, error: 'No se envio ningun dato de la etapa' })
  }

  const fila = await uno(
    `insert into ${def.tabla} (${cols.join(',')})
     values (${cols.map((_, i) => `$${i + 1}`).join(',')})
     returning *`,
    cols.map((c) => cuerpo[c]))

  if (def.lecturas && Array.isArray(lecturas) && lecturas.length) {
    for (const lec of lecturas) {
      const lc = def.lecturas.columnas.filter((c) => !vacio(lec[c]))
      if (!lc.length) continue
      await q(
        `insert into ${def.lecturas.tabla} (${def.lecturas.fk}, ${lc.join(',')})
         values ($1, ${lc.map((_, i) => `$${i + 2}`).join(',')})`,
        [fila.id, ...lc.map((c) => lec[c])])
    }
  }

  res.status(201).json({ success: true, data: fila })
}))

export default router
