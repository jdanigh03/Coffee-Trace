#!/usr/bin/env node
/**
 * Worker de sellado: drena blockchain_outbox hacia Hyperledger Fabric.
 *
 *   node server/worker/sellador.js
 *   node server/worker/sellador.js --una-vuelta
 *
 * Nunca se llama a Fabric dentro de la transaccion de Postgres. El flujo es:
 *   1. tomar pendientes de la cola y marcarlos 'enviado'
 *   2. enviar a Fabric fuera de transaccion
 *   3. al confirmar, INSERT en blockchain_registros (append-only) y marcar
 *      'confirmado'; si falla, marcar 'error' y reintentar despues
 *
 * Si Fabric no esta configurado, el worker NO simula sellos: sale con un
 * mensaje. Un sello inventado seria peor que no tener ninguno.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const raiz = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))

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

const env = { ...leerEnv(), ...process.env }
const INTERVALO_MS = Number(env.WORKER_INTERVALO_MS ?? 10_000)
const LOTE_MAX = Number(env.WORKER_LOTE_MAX ?? 25)
const MAX_INTENTOS = Number(env.WORKER_MAX_INTENTOS ?? 5)

/** Mapea la tabla de origen a la funcion de chaincode que le corresponde. */
const FASE_POR_TABLA = {
  entregas_acopio: 'acopio',
  envios: 'transporte',
  beneficio_seco: 'trillado',
  despachos: 'despacho',
}

// ------------------------------------------------------------------
// Conexion a Fabric
// ------------------------------------------------------------------

/**
 * Devuelve un contrato de Fabric, o null si la red no esta configurada.
 * Se importa @hyperledger/fabric-gateway de forma dinamica para que el worker
 * arranque y explique el problema aunque la dependencia no este instalada.
 */
async function conectarFabric() {
  const requeridas = [
    'FABRIC_ENDPOINT', 'FABRIC_MSPID', 'FABRIC_TLS_CERT',
    'FABRIC_CERT', 'FABRIC_KEY', 'FABRIC_CHANNEL', 'FABRIC_CHAINCODE',
  ]
  const faltan = requeridas.filter((k) => !env[k])
  if (faltan.length) {
    return { contrato: null, motivo: `faltan variables: ${faltan.join(', ')}` }
  }

  let gateway, grpc
  try {
    gateway = await import('@hyperledger/fabric-gateway')
    grpc = await import('@grpc/grpc-js')
  } catch {
    return {
      contrato: null,
      motivo: 'falta instalar: npm i @hyperledger/fabric-gateway @grpc/grpc-js',
    }
  }

  const { connect, signers } = gateway
  const crypto = await import('node:crypto')

  const tlsRoot = fs.readFileSync(env.FABRIC_TLS_CERT)
  const cliente = new grpc.default.Client(
    env.FABRIC_ENDPOINT,
    grpc.default.credentials.createSsl(tlsRoot),
    { 'grpc.ssl_target_name_override': env.FABRIC_HOST_ALIAS ?? undefined }
  )

  const identidad = { mspId: env.FABRIC_MSPID, credentials: fs.readFileSync(env.FABRIC_CERT) }
  const clavePrivada = crypto.createPrivateKey(fs.readFileSync(env.FABRIC_KEY))

  const red = connect({
    client: cliente,
    identity: identidad,
    signer: signers.newPrivateKeySigner(clavePrivada),
  })

  const contrato = red
    .getNetwork(env.FABRIC_CHANNEL)
    .getContract(env.FABRIC_CHAINCODE)

  return { contrato, cerrar: () => { red.close(); cliente.close() } }
}

// ------------------------------------------------------------------
// Ciclo de trabajo
// ------------------------------------------------------------------

async function procesarTanda(pool, contrato) {
  // Se reclaman las filas con FOR UPDATE SKIP LOCKED para que varios workers
  // puedan correr a la vez sin pisarse.
  const { rows: pendientes } = await pool.query(`
    update blockchain_outbox o
       set estado = 'enviado', intentos = intentos + 1, actualizado_en = now()
     where o.id in (
       select id from blockchain_outbox
        where estado in ('pendiente','error') and intentos < $2
        order by creado_en
        for update skip locked
        limit $1)
    returning o.id, o.tabla_origen, o.registro_id, o.lote_id, o.fase,
              o.payload_canonico, o.hash_sha256`,
    [LOTE_MAX, MAX_INTENTOS])

  if (!pendientes.length) return { procesados: 0, errores: 0 }

  let ok = 0, errores = 0
  for (const item of pendientes) {
    try {
      const { rows: [lote] } = await pool.query(
        `select codigo from lotes where id = $1`, [item.lote_id])
      if (!lote) throw new Error(`El registro ${item.id} no tiene lote asociado`)

      const fase = item.fase ?? FASE_POR_TABLA[item.tabla_origen]
      if (!fase) throw new Error(`Sin fase para la tabla ${item.tabla_origen}`)

      // Solo pesos: el detalle y las identidades se quedan en Postgres.
      const datos = JSON.parse(item.payload_canonico)
      const pesos = Object.fromEntries(
        Object.entries(datos).filter(([k, v]) => k.startsWith('kg') && typeof v === 'number'))

      const respuesta = await contrato.submitTransaction(
        'SellarFase',
        lote.codigo,
        fase,
        item.hash_sha256,
        `${item.tabla_origen}:${item.registro_id}`,
        JSON.stringify(pesos),
      )
      const txId = Buffer.from(respuesta).toString()

      await pool.query('begin')
      try {
        await pool.query(`
          insert into blockchain_registros
            (tabla_origen, registro_id, lote_id, hash_sha256, tx_id)
          values ($1, $2, $3, $4, $5)
          on conflict (tabla_origen, registro_id) do nothing`,
          [item.tabla_origen, item.registro_id, item.lote_id, item.hash_sha256, txId])
        await pool.query(
          `update blockchain_outbox
              set estado = 'confirmado', ultimo_error = null, actualizado_en = now()
            where id = $1`, [item.id])
        await pool.query('commit')
      } catch (e) {
        await pool.query('rollback')
        throw e
      }
      ok++
      console.log(`  sellado ${lote.codigo}/${fase} -> ${txId.slice(0, 16)}...`)
    } catch (e) {
      errores++
      await pool.query(
        `update blockchain_outbox
            set estado = 'error', ultimo_error = $2, actualizado_en = now()
          where id = $1`, [item.id, String(e.message).slice(0, 500)])
      console.error(`  error en ${item.tabla_origen}:${item.registro_id} -> ${e.message}`)
    }
  }
  return { procesados: ok, errores }
}

async function main() {
  const unaVuelta = process.argv.includes('--una-vuelta')

  const connectionString = env.SUPABASE_DB_URL || env.DATABASE_URL
  if (!connectionString) {
    console.error('Falta SUPABASE_DB_URL en el .env')
    process.exit(1)
  }
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 3 })

  const { contrato, motivo, cerrar } = await conectarFabric()
  if (!contrato) {
    const { rows: [c] } = await pool.query(
      `select count(*)::int n from blockchain_outbox where estado <> 'confirmado'`)
    console.error(`
El worker no puede sellar: la red Fabric no esta configurada.
  Motivo: ${motivo}

Hay ${c.n} registros esperando en la cola. Se quedan ahi, intactos: este
worker no inventa sellos. Configura la red (ver blockchain/README.md) y
vuelve a ejecutarlo.`)
    await pool.end()
    process.exit(1)
  }

  console.log(`Worker de sellado conectado a ${env.FABRIC_CHANNEL}/${env.FABRIC_CHAINCODE}`)

  const vuelta = async () => {
    const r = await procesarTanda(pool, contrato)
    if (r.procesados || r.errores) {
      console.log(`  tanda: ${r.procesados} sellados, ${r.errores} con error`)
    }
  }

  if (unaVuelta) {
    await vuelta()
  } else {
    await vuelta()
    setInterval(() => { vuelta().catch((e) => console.error('ciclo:', e.message)) }, INTERVALO_MS)
    process.on('SIGINT', async () => {
      console.log('\nCerrando...')
      cerrar?.()
      await pool.end()
      process.exit(0)
    })
    return
  }

  cerrar?.()
  await pool.end()
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1) })
