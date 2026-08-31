#!/usr/bin/env node
/**
 * Carga (y descarga) los datos SIMULADOS del Excel de simulacion.
 *
 *   node scripts/simulacion.js --estado     que hay cargado ahora
 *   node scripts/simulacion.js --cargar     carga db/simulacion.json
 *   node scripts/simulacion.js --borrar     deshace la carga
 *
 * Nada de esto es dato real de ASOCAFE. Cada fila queda anotada en
 * `simulacion_registros`, y en los UPDATE se guarda ademas el valor anterior,
 * que es lo unico que hace que `--borrar` devuelva la base a como estaba.
 *
 * Las tablas de INSERT estaban vacias: alli la simulacion no pisa nada.
 * Los UPDATE son tres: envios (nota de remision y peso recibido), despachos y
 * exportaciones (contenedor, precintos, puerto). No se toca ni un peso real ni
 * nada de lo que dependen los indicadores TEE/TIN/TND.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CARGA = 'excel-simulacion-2025'

/** Tablas que se llenan por insercion, con las columnas de cada una. */
const INSERTAR = [
  ['etapa_tolva', ['lote_id', 'kg_entrada', 'tolva', 'limpieza_previa', 'hora_limpieza',
    'responsable_limpieza', 'hora_inicio', 'hora_fin', 'operario', 'estado', 'observaciones']],
  ['etapa_despulpado', ['lote_id', 'maquina', 'hora_inicio', 'hora_fin', 'operario',
    'limpieza_validada', 'responsable_limpieza', 'temperatura_c', 'velocidad_rpm',
    'kg_entrada', 'kg_despulpado', 'estado', 'incidencias']],
  ['sultana', ['lote_id', 'fecha', 'kg_sultana', 'destino', 'responsable', 'observaciones']],
  ['etapa_fermentacion', ['lote_id', 'tanque', 'kg_entrada', 'hora_inicio', 'hora_fin',
    'mucilago_despegado', 'responsable', 'estado', 'observaciones']],
  ['etapa_lavado', ['lote_id', 'hora_inicio', 'hora_fin', 'encargado', 'operarios',
    'calidad_agua', 'temperatura_agua_c', 'carretillas', 'kg_por_carretilla',
    'segregacion_ok', 'estado', 'observaciones']],
  ['etapa_secado', ['lote_id', 'tipo_secado', 'fecha_inicio', 'fecha_fin',
    'temperatura_inicial_c', 'humedad_inicial_pct', 'humedad_final_pct', 'validador_humedad',
    'kg_entrada', 'kg_pergamino_seco', 'perdida_agua_kg', 'carretillas_traslado',
    'fecha_traslado', 'estado', 'observaciones']],
  ['etapa_almacen_temporal', ['lote_id', 'fecha_ingreso', 'ubicacion', 'temperatura_c',
    'humedad_pct', 'kg_acumulado', 'lotes_diarios', 'responsable', 'estado', 'observaciones']],
  ['limpiezas_equipo', ['lote_siguiente_id', 'equipo', 'fecha_hora', 'tipo_limpieza',
    'duracion_min', 'responsable', 'insumos']],
  ['etapa_trillado', ['lote_id', 'fecha_inicio', 'fecha_fin', 'kg_pergamino_entrada',
    'kg_verde_sin_seleccionar', 'kg_cascarilla', 'kg_caracol', 'kg_descarte_mecanico',
    'rendimiento_pct', 'operador', 'equipo_linea', 'estado', 'observaciones']],
  ['etapa_seleccion', ['lote_id', 'fecha_inicio', 'fecha_fin', 'kg_asignado', 'kg_devuelto',
    'kg_defectos', 'tasa_defecto_pct', 'seleccionadoras', 'kg_por_seleccionadora',
    'balance_cuadra', 'responsable', 'estado', 'observaciones']],
  ['etapa_empaque', ['lote_id', 'fecha_ingreso', 'kg_verde_oro', 'tipo_empaque',
    'numero_sacos', 'kg_por_saco', 'ubicacion', 'temperatura_c', 'humedad_pct',
    'responsable', 'observaciones']],
]

/** Columnas que la simulacion escribe en cada tabla existente. */
const ENVIO_COLS = ['nota_remision', 'numero_bolsas', 'vehiculo', 'conductor',
  'responsable_transportista', 'responsable', 'remitente', 'destinatario',
  'documentos_verificados', 'fecha_llegada', 'kg_pergamino_recibido', 'observaciones']
const DESPACHO_COLS = ['contenedor', 'precintos', 'responsable', 'observaciones']
const EXPORTACION_COLS = ['puerto_salida', 'naviera', 'certificaciones']

function leerEnv() {
  const ruta = path.join(raiz, '.env')
  if (!fs.existsSync(ruta)) return {}
  return Object.fromEntries(
    fs.readFileSync(ruta, 'utf8').split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      })
  )
}

async function conectar() {
  const env = { ...leerEnv(), ...process.env }
  const url = env.SUPABASE_DB_URL || env.DATABASE_URL
  if (!url) {
    console.error('Falta SUPABASE_DB_URL en el .env')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  return client
}

/** Anota una fila tocada, para poder deshacerla. */
async function anotar(client, tabla, filaId, operacion, previos = null) {
  await client.query(
    `insert into simulacion_registros (carga, tabla, fila_id, operacion, valores_previos)
     values ($1, $2, $3, $4, $5)`,
    [CARGA, tabla, String(filaId), operacion, previos ? JSON.stringify(previos) : null])
}

/**
 * Actualiza una fila guardando antes el valor original de esas columnas.
 * Devuelve false si la fila no existe.
 */
async function actualizar(client, tabla, id, columnas, datos) {
  const { rows } = await client.query(
    `select to_jsonb(t) j from ${tabla} t where t.id = $1`, [id])
  if (!rows.length) return false

  const previos = Object.fromEntries(columnas.map((c) => [c, rows[0].j[c]]))
  const sets = columnas.map((c, i) => `${c} = $${i + 2}`).join(', ')
  await client.query(
    `update ${tabla} set ${sets} where id = $1`,
    [id, ...columnas.map((c) => datos[c] ?? null)])
  await anotar(client, tabla, id, 'update', previos)
  return true
}

// ---------------------------------------------------------------- cargar

async function cargar(client) {
  const ruta = path.join(raiz, 'db', 'simulacion.json')
  if (!fs.existsSync(ruta)) {
    console.error('No existe db/simulacion.json. Corre antes:\n' +
                  '  python scripts/extraer_simulacion.py')
    process.exit(1)
  }
  const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'))

  const { rows: yaHay } = await client.query(
    'select count(*)::int n from simulacion_registros where carga = $1', [CARGA])
  if (yaHay[0].n > 0) {
    console.error(`Ya hay ${yaHay[0].n} filas de la carga "${CARGA}".\n` +
                  'Borra la anterior antes:  node scripts/simulacion.js --borrar')
    process.exit(1)
  }

  const { rows: lotes } = await client.query('select id, codigo from lotes')
  const mapa = new Map(lotes.map((l) => [l.codigo, l.id]))
  const idDe = (codigo) => {
    const id = mapa.get(codigo)
    if (!id) throw new Error(`El lote ${codigo} no existe en la base`)
    return id
  }

  await client.query('begin')
  try {
    for (const [tabla, columnas] of INSERTAR) {
      const filas = datos[tabla] ?? []
      for (const f of filas) {
        // El nombre de la columna de lote cambia segun la tabla.
        const fila = { ...f }
        if (columnas.includes('lote_id')) fila.lote_id = idDe(f.lote)
        if (columnas.includes('lote_siguiente_id')) fila.lote_siguiente_id = idDe(f.lote_siguiente)

        const { rows } = await client.query(
          `insert into ${tabla} (${columnas.join(',')})
           values (${columnas.map((_, i) => `$${i + 1}`).join(',')})
           returning id`,
          columnas.map((c) => fila[c] ?? null))
        await anotar(client, tabla, rows[0].id, 'insert')
      }
      console.log(`  ${tabla.padEnd(24)} +${filas.length}`)
    }

    // ---- envios: los 9 ya existen, se completan los huecos
    let n = 0
    for (const e of datos.envios ?? []) {
      const { rows } = await client.query(
        'select id from envios where lote_id = $1', [idDe(e.lote)])
      if (!rows.length) {
        console.log(`  AVISO: el lote ${e.lote} no tiene envio en la base; se omite`)
        continue
      }
      if (await actualizar(client, 'envios', rows[0].id, ENVIO_COLS, e)) n++
    }
    console.log(`  ${'envios'.padEnd(24)} ~${n} (actualizados)`)

    // ---- despachos y exportaciones: se emparejan por fecha de embarque
    let d = 0
    for (const x of datos.exportaciones ?? []) {
      const { rows } = await client.query(
        `select e.id exportacion_id, e.despacho_id
         from exportaciones e where e.fecha_embarque = $1::date`, [x.fecha_embarque])
      if (!rows.length) {
        console.log(`  AVISO: no hay embarque del ${x.fecha_embarque}; se omite`)
        continue
      }
      await actualizar(client, 'despachos', rows[0].despacho_id, DESPACHO_COLS, x)
      await actualizar(client, 'exportaciones', rows[0].exportacion_id, EXPORTACION_COLS, x)
      d++
    }
    console.log(`  ${'despachos/exportaciones'.padEnd(24)} ~${d} embarques`)

    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  }
}

// ---------------------------------------------------------------- borrar

async function borrar(client) {
  const { rows } = await client.query(
    `select id, tabla, fila_id, operacion, valores_previos
     from simulacion_registros where carga = $1
     order by id desc`, [CARGA])

  if (!rows.length) {
    console.log('No hay nada cargado de esa simulacion.')
    return
  }

  await client.query('begin')
  try {
    const cuenta = {}
    for (const r of rows) {
      if (r.operacion === 'insert') {
        await client.query(`delete from ${r.tabla} where id::text = $1`, [r.fila_id])
      } else {
        // jsonb_populate_record devuelve los valores con su tipo original,
        // incluidos los arrays: sin el, restaurar certificaciones fallaria.
        const cols = Object.keys(r.valores_previos)
        await client.query(
          `update ${r.tabla} t
              set (${cols.join(',')}) = row(${cols.map((c) => `p.${c}`).join(',')})
             from jsonb_populate_record(null::${r.tabla}, $1::jsonb) p
            where t.id::text = $2`,
          [JSON.stringify(r.valores_previos), r.fila_id])
      }
      const k = `${r.tabla} (${r.operacion})`
      cuenta[k] = (cuenta[k] ?? 0) + 1
    }
    await client.query('delete from simulacion_registros where carga = $1', [CARGA])
    await client.query('commit')

    for (const [k, v] of Object.entries(cuenta).sort()) {
      console.log(`  ${k.padEnd(34)} ${v}`)
    }
  } catch (e) {
    await client.query('rollback')
    throw e
  }
}

// ---------------------------------------------------------------- estado

async function estado(client) {
  const { rows } = await client.query('select * from v_simulacion')
  if (!rows.length) {
    console.log('No hay datos simulados cargados.')
    return
  }
  console.log('Datos SIMULADOS actualmente en la base:\n')
  let total = 0
  for (const r of rows) {
    console.log(`  ${r.tabla.padEnd(24)} ${r.operacion.padEnd(7)} ${String(r.filas).padStart(4)}` +
                `   ${new Date(r.desde).toLocaleString('es-BO')}`)
    total += r.filas
  }
  console.log(`\n  ${'TOTAL'.padEnd(32)} ${String(total).padStart(4)} filas`)
  console.log('\nPara quitarlos:  node scripts/simulacion.js --borrar')
}

// ---------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2)
  const client = await conectar()
  try {
    if (args.includes('--cargar')) {
      console.log(`Cargando datos SIMULADOS (carga "${CARGA}")...\n`)
      await cargar(client)
      console.log('\nListo. Son datos simulados: para quitarlos,')
      console.log('  node scripts/simulacion.js --borrar')
    } else if (args.includes('--borrar')) {
      console.log(`Borrando la carga "${CARGA}"...\n`)
      await borrar(client)
      console.log('\nBase devuelta a su estado anterior.')
    } else {
      await estado(client)
    }
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1) })
