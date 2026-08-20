#!/usr/bin/env node
/**
 * Aplica migraciones, seed y carga de datos contra Supabase.
 *
 *   node scripts/migrate.js --check    solo prueba la conexion
 *   node scripts/migrate.js            aplica migraciones + seed
 *   node scripts/migrate.js --load     ademas carga los CSV de db/out
 *
 * Lee SUPABASE_DB_URL del .env. Esa cadena es la de "Connection string >
 * URI" del panel de Supabase e incluye la contrasena de la base: no es la
 * clave publishable, que no puede ejecutar DDL.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

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

/** Parser CSV minimo pero correcto: respeta comillas y comas dentro de campos. */
function parseCsv(texto) {
  const filas = []
  let campo = '', fila = [], enComillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else { enComillas = false }
      } else campo += c
    } else if (c === '"') enComillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = '' }
    else if (c !== '\r') campo += c
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila) }
  const cab = filas.shift()
  return filas.filter((f) => f.length === cab.length)
              .map((f) => Object.fromEntries(cab.map((k, i) => [k, f[i]])))
}

const nulo = (v) => (v === '' || v === undefined ? null : v)

async function insertarLote(client, tabla, columnas, filas, tam = 500) {
  let total = 0
  for (let i = 0; i < filas.length; i += tam) {
    const trozo = filas.slice(i, i + tam)
    const valores = []
    const marcadores = trozo.map((f, j) => {
      const base = j * columnas.length
      columnas.forEach((c) => valores.push(nulo(f[c])))
      return '(' + columnas.map((_, k) => `$${base + k + 1}`).join(',') + ')'
    })
    const sql = `insert into ${tabla} (${columnas.join(',')}) values ${marcadores.join(',')}`
    const r = await client.query(sql, valores)
    total += r.rowCount
  }
  return total
}

async function main() {
  const args = process.argv.slice(2)
  const soloCheck = args.includes('--check')
  const cargar = args.includes('--load')
  const reset = args.includes('--reset')

  const env = { ...leerEnv(), ...process.env }
  const url = env.SUPABASE_DB_URL || env.DATABASE_URL
  if (!url) {
    console.error(`
Falta SUPABASE_DB_URL en el .env

Panel de Supabase > Project Settings > Database > Connection string > URI
Usa el puerto 5432 (conexion directa o session pooler). El transaction pooler
del 6543 no soporta bien el DDL.

  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres

La clave publishable del .env NO sirve para esto: no puede crear tablas.`)
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const { rows: [info] } = await client.query(
    'select current_database() db, current_user usr, version() v')
  console.log(`Conectado: ${info.db} como ${info.usr}`)
  console.log(`  ${info.v.split(',')[0]}\n`)

  const { rows: [{ n }] } = await client.query(
    "select count(*)::int n from information_schema.tables where table_schema='public'")
  console.log(`Tablas actuales en public: ${n}`)

  if (soloCheck) { await client.end(); return }

  if (reset) {
    // BORRA TODO el esquema public. Solo para rehacer una migracion fallida
    // sobre un proyecto que todavia no tiene datos de valor.
    console.log('\n--reset: borrando el esquema public entero...')
    await client.query(`
      drop schema public cascade;
      create schema public;
      grant usage on schema public to postgres, anon, authenticated, service_role;
      grant all on schema public to postgres, service_role;
    `)
    // El trigger sobre auth.users vive fuera de public y hay que quitarlo aparte.
    await client.query('drop trigger if exists trg_nuevo_usuario on auth.users')
    console.log('  ok, esquema vacio')
  }

  const { rows: [{ n: n2 }] } = await client.query(
    "select count(*)::int n from information_schema.tables where table_schema='public'")

  if (n2 > 0) {
    console.log(`
El esquema public NO esta vacio (${n2} tablas). Estas migraciones crean tablas
y tipos desde cero: si ya existen, van a fallar. Revisa el estado antes de
continuar, aplica sobre un proyecto limpio, o usa --reset para borrar el
esquema public y empezar de nuevo (destructivo).`)
    await client.end()
    process.exit(1)
  }

  const dirMig = path.join(raiz, 'supabase', 'migrations')
  const archivos = fs.readdirSync(dirMig).filter((f) => f.endsWith('.sql')).sort()

  for (const f of archivos) {
    process.stdout.write(`  aplicando ${f} ... `)
    await client.query(fs.readFileSync(path.join(dirMig, f), 'utf8'))
    console.log('ok')
  }

  process.stdout.write('  aplicando seed.sql ... ')
  await client.query(fs.readFileSync(path.join(raiz, 'supabase', 'seed.sql'), 'utf8'))
  console.log('ok')

  if (cargar) {
    const out = path.join(raiz, 'db', 'out')
    if (!fs.existsSync(out)) {
      console.error('\nNo existe db/out. Corre primero: python scripts/etl_excel.py')
      await client.end()
      process.exit(1)
    }
    const csv = (n) => parseCsv(fs.readFileSync(path.join(out, n + '.csv'), 'utf8'))

    console.log('\nCargando datos...')
    await client.query('begin')
    try {
      let t

      t = await insertarLote(client, 'personas', ['id', 'nombre'], csv('personas'))
      console.log(`  personas ............. ${t}`)

      // La comunidad viene como texto y se resuelve contra el catalogo del seed.
      const { rows: coms } = await client.query('select id, nombre from comunidades')
      const mapaCom = new Map(coms.map((c) => [c.nombre, c.id]))
      const parcelas = csv('parcelas').map((p) => {
        const id = mapaCom.get(p.comunidad)
        if (!id) throw new Error(`Comunidad no encontrada en el catalogo: "${p.comunidad}"`)
        return { id: p.id, persona_id: p.persona_id, comunidad_id: id }
      })
      t = await insertarLote(client, 'parcelas', ['id', 'persona_id', 'comunidad_id'], parcelas)
      console.log(`  parcelas ............. ${t}`)

      t = await insertarLote(client, 'codigos_productor',
        ['id', 'codigo', 'parcela_id', 'persona_id', 'nombre_excel'], csv('codigos_productor'))
      console.log(`  codigos_productor .... ${t}`)

      t = await insertarLote(client, 'certificaciones',
        ['parcela_id', 'campania_id', 'estatus', 'tipo'], csv('certificaciones'))
      console.log(`  certificaciones ...... ${t}`)

      t = await insertarLote(client, 'lotes',
        ['id', 'codigo', 'campania_id', 'certificacion', 'correlativo'], csv('lotes'))
      console.log(`  lotes ................ ${t}`)

      t = await insertarLote(client, 'entregas_acopio',
        ['campania_id', 'fecha', 'codigo_productor_id', 'parcela_id', 'persona_id',
         'kg_guinda_real', 'precio_unitario_bs', 'estatus_declarado', 'lote_id',
         'revision', 'revision_nota'], csv('entregas_acopio'))
      console.log(`  entregas_acopio ...... ${t}`)

      t = await insertarLote(client, 'envios',
        ['lote_id', 'fecha_salida', 'kg_pergamino_despachado'], csv('envios'))
      console.log(`  envios ............... ${t}`)

      // ---- segunda pasada: beneficio, existencias, muestras, ventas
      const hayBeneficio = fs.existsSync(path.join(out, 'beneficio_seco.csv'))
      if (hayBeneficio) {
        console.log('\n  -- beneficio y ventas --')

        t = await insertarLote(client, 'lotes',
          ['id', 'codigo', 'campania_id', 'certificacion', 'correlativo'], csv('lotes_extra'))
        console.log(`  lotes gestiones previas ${t}`)

        t = await insertarLote(client, 'beneficio_seco',
          ['id', 'lote_id', 'kg_pergamino_entrada', 'kg_trillado_calc', 'kg_verde_calc',
           'kg_caracol_calc', 'kg_descarte_calc', 'observaciones'], csv('beneficio_seco'))
        console.log(`  beneficio_seco ....... ${t}`)

        t = await insertarLote(client, 'beneficio_productor',
          ['beneficio_id', 'persona_id', 'nombre_excel', 'fuente', 'latas', 'kg_guinda',
           'kg_pergamino_seco', 'kg_trillado', 'kg_descarte', 'kg_caracol', 'kg_verde_export',
           'revision', 'revision_nota'], csv('beneficio_productor'))
        console.log(`  beneficio_productor .. ${t}`)

        // almacen y cliente vienen por nombre: se resuelven contra el seed.
        const { rows: alm } = await client.query('select id, nombre from almacenes')
        const mapaAlm = new Map(alm.map((a) => [a.nombre, a.id]))
        const { rows: cli } = await client.query('select id, nombre from clientes')
        const mapaCli = new Map(cli.map((c) => [c.nombre, c.id]))

        const exis = csv('existencias').map((e) => ({
          ...e, almacen_id: mapaAlm.get('Almacen El Alto'),
        }))
        t = await insertarLote(client, 'existencias',
          ['almacen_id', 'lote_id', 'producto', 'kg_ingreso', 'kg_saldo', 'fecha_ingreso',
           'responsable'], exis)
        console.log(`  existencias .......... ${t}`)

        const contratos = csv('contratos').map((c) => {
          const cid = mapaCli.get(c.cliente)
          if (!cid) throw new Error(`Cliente no encontrado en el catalogo: "${c.cliente}"`)
          return { ...c, cliente_id: cid }
        })
        t = await insertarLote(client, 'contratos',
          ['id', 'numero', 'cliente_id', 'fecha', 'sacos', 'kg_por_saco', 'moneda'], contratos)
        console.log(`  contratos ............ ${t}`)

        const desp = csv('despachos').map((d) => ({ ...d, almacen_id: mapaAlm.get(d.almacen) }))
        t = await insertarLote(client, 'despachos',
          ['id', 'contrato_id', 'almacen_id', 'fecha_despacho', 'kg_neto', 'observaciones'], desp)
        console.log(`  despachos ............ ${t}`)

        t = await insertarLote(client, 'despacho_lotes',
          ['despacho_id', 'lote_id', 'kg_asignados'], csv('despacho_lotes'))
        console.log(`  despacho_lotes ....... ${t}`)

        t = await insertarLote(client, 'muestras',
          ['lote_id', 'tipo', 'kg', 'fecha', 'motivo'], csv('muestras'))
        console.log(`  muestras ............. ${t}`)

        t = await insertarLote(client, 'exportaciones',
          ['despacho_id', 'fecha_embarque', 'volumen_kg'], csv('exportaciones'))
        console.log(`  exportaciones ........ ${t}`)

        // Los lotes despachados dejan de estar en 'acopio'.
        await client.query(`
          update lotes set estado = 'exportado'
          where id in (select lote_id from despacho_lotes)`)
      }

      await client.query(`
        update lotes l set kg_guinda_total = t.kg_guinda_real
        from v_lote_totales t where t.lote_id = l.id`)

      // El literal necesita cast: en `insert ... select` Postgres lo tipa como
      // text y no lo coacciona solo al enum.
      await client.query(`
        insert into afiliaciones (persona_id, campania_id, estado)
        select distinct persona_id, 2025, 'activo'::estado_afiliacion
        from entregas_acopio
        where persona_id is not null
        on conflict (persona_id, campania_id) do nothing`)

      await client.query('commit')
    } catch (e) {
      await client.query('rollback')
      throw e
    }

    const { rows: rev } = await client.query(
      'select revision, count(*)::int n from entregas_acopio group by revision order by n desc')
    console.log('\nEntregas por estado de revision:')
    rev.forEach((r) => console.log(`  ${r.revision.padEnd(12)} ${r.n}`))

    const { rows: lot } = await client.query(
      'select codigo, entregas, kg_guinda_real, entregas_observadas from v_lote_totales order by codigo')
    console.log('\nLotes:')
    lot.forEach((l) => console.log(
      `  ${l.codigo}  entregas=${String(l.entregas).padStart(4)}  ` +
      `kg=${Number(l.kg_guinda_real).toLocaleString('es-BO').padStart(11)}  ` +
      `observadas=${l.entregas_observadas}`))
  }

  await client.end()
  console.log('\nListo.')
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1) })
