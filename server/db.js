import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/** Lee el .env sin depender de dotenv, igual que scripts/migrate.js. */
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
const connectionString = env.SUPABASE_DB_URL || env.DATABASE_URL

/** En Vercel no hay archivo .env: las variables vienen del entorno. */
const enServerless = Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME)

if (!connectionString) {
  console.error(
    enServerless
      ? 'Falta SUPABASE_DB_URL. Configurala en Vercel > Settings > Environment Variables ' +
        'y vuelve a desplegar. Usa la cadena del POOLER (puerto 6543), no la directa.'
      : 'Falta SUPABASE_DB_URL en el .env. El API no puede leer datos reales.'
  )
}

// Postgres devuelve numeric como string para no perder precision. En este
// dominio los kg y los Bs caben de sobra en un double, y el frontend espera
// numeros, asi que se convierten aqui en un solo lugar.
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))
pg.types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)))

/**
 * En serverless cada instancia de la funcion abre su propio pool, y Vercel
 * puede levantar decenas a la vez. Con max: 5 por instancia se agotan las
 * conexiones de Supabase enseguida, asi que ahi se usa una sola por instancia
 * y se deja que el pooler de Supabase haga el multiplexado.
 */
const poolMax = Number(env.PG_POOL_MAX ?? (enServerless ? 3 : 10))

export const pool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: poolMax,
      idleTimeoutMillis: enServerless ? 10_000 : 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null

// Sin esto, un error de red en una conexion inactiva tumba el proceso entero.
pool?.on('error', (e) => console.error('Error en el pool de Postgres:', e.message))

export async function q(sql, params = []) {
  if (!pool) throw new Error('Sin conexion a la base: falta SUPABASE_DB_URL')
  const r = await pool.query(sql, params)
  return r.rows
}

export async function uno(sql, params = []) {
  const filas = await q(sql, params)
  return filas[0] ?? null
}

/** Envuelve un handler async para que los errores lleguen al middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
