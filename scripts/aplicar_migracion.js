#!/usr/bin/env node
/**
 * Aplica UNA migracion sobre una base que ya tiene datos.
 *
 *   node scripts/aplicar_migracion.js 20250101000011_etapas_beneficio_seco.sql
 *
 * `migrate.js` solo corre sobre un esquema vacio: rehace la base entera. Esto
 * es para las migraciones que van llegando despues, cuando ya hay datos que no
 * se pueden perder.
 *
 * Cada archivo se envia como una sola sentencia, asi que Postgres lo ejecuta
 * dentro de una transaccion implicita: si algo falla no queda a medias.
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

async function main() {
  const archivos = process.argv.slice(2)
  if (!archivos.length) {
    console.error('Uso: node scripts/aplicar_migracion.js <archivo.sql> [otro.sql ...]')
    process.exit(1)
  }

  const env = { ...leerEnv(), ...process.env }
  const url = env.SUPABASE_DB_URL || env.DATABASE_URL
  if (!url) {
    console.error('Falta SUPABASE_DB_URL en el .env')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    for (const a of archivos) {
      const ruta = path.isAbsolute(a) ? a : path.join(raiz, 'supabase', 'migrations', a)
      if (!fs.existsSync(ruta)) throw new Error(`No existe ${ruta}`)
      process.stdout.write(`  aplicando ${path.basename(ruta)} ... `)
      await client.query(fs.readFileSync(ruta, 'utf8'))
      console.log('ok')
    }
  } finally {
    await client.end()
  }
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1) })
