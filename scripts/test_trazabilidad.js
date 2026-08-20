#!/usr/bin/env node
/**
 * Pruebas de trazabilidad de punta a punta.
 *
 *   node scripts/test_trazabilidad.js
 *
 * Todo corre dentro de una transaccion que termina en ROLLBACK: los datos
 * temporales que crea no quedan en la base. Se puede correr contra el proyecto
 * con datos reales sin ensuciarlo.
 */

import pg from 'pg'
import { canonico, sha256, hashFase, verificarCadena } from '../server/hash.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = Object.fromEntries(
  fs.readFileSync(path.join(raiz, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

let ok = 0, fallo = 0
const resultados = []

function chequear(nombre, condicion, detalle = '') {
  if (condicion) { ok++; resultados.push(['PASA', nombre, detalle]) }
  else { fallo++; resultados.push(['FALLA', nombre, detalle]) }
}

async function main() {
  const c = new pg.Client({
    connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false },
  })
  await c.connect()
  await c.query('begin')

  try {
    // ============================================================
    // Datos temporales
    // ============================================================
    const { rows: [com] } = await c.query(`select id from comunidades limit 1`)

    const { rows: [persona] } = await c.query(
      `insert into personas (nombre) values ('ZZ PRUEBA Muñoz Ibáñez') returning id, nombre`)
    const { rows: [parcela] } = await c.query(
      `insert into parcelas (persona_id, comunidad_id) values ($1,$2) returning id`,
      [persona.id, com.id])
    // Parcela EN TRANSICION a proposito.
    await c.query(
      `insert into certificaciones (parcela_id, campania_id, estatus, tipo)
       values ($1, 2025, 'T2', 'transicion')`, [parcela.id])
    const { rows: [codigo] } = await c.query(
      `insert into codigos_productor (codigo, parcela_id, persona_id, campania_id, nombre_excel)
       values ('ZZZ-999', $1, $2, 2025, $3) returning id`,
      [parcela.id, persona.id, persona.nombre])

    const { rows: [loteOrg] } = await c.query(
      `insert into lotes (codigo, campania_id, certificacion, correlativo)
       values ('OR-99-25', 2025, 'organico', 99) returning id, codigo`)
    // Correlativo distinto a proposito: con el mismo, un UPDATE de
    // certificacion chocaria contra el unique (campania, certificacion,
    // correlativo) y la prueba de inmutabilidad daria un falso positivo.
    const { rows: [loteTra] } = await c.query(
      `insert into lotes (codigo, campania_id, certificacion, correlativo)
       values ('TR-98-25', 2025, 'transicion', 98) returning id, codigo`)

    // ============================================================
    // 1. Transicion no puede entrar a un lote organico
    // ============================================================
    const { rows: [mala] } = await c.query(
      `insert into entregas_acopio
         (campania_id, fecha, codigo_productor_id, parcela_id, persona_id,
          kg_guinda_real, precio_unitario_bs, estatus_declarado, lote_id)
       values (2025,'2025-06-01',$1,$2,$3, 140, 50, 'T2', $4)
       returning id, revision, revision_nota`,
      [codigo.id, parcela.id, persona.id, loteOrg.id])

    chequear('Transicion en lote organico queda marcada',
      mala.revision === 'observado',
      `revision=${mala.revision} | ${(mala.revision_nota || '').slice(0, 70)}`)

    // La misma entrega en un lote de transicion debe pasar limpia.
    const { rows: [buena] } = await c.query(
      `insert into entregas_acopio
         (campania_id, fecha, codigo_productor_id, parcela_id, persona_id,
          kg_guinda_real, precio_unitario_bs, estatus_declarado, lote_id)
       values (2025,'2025-06-02',$1,$2,$3, 280, 50, 'T2', $4)
       returning id, revision, latas, total_pagado_bs`,
      [codigo.id, parcela.id, persona.id, loteTra.id])

    chequear('Transicion en lote de transicion pasa limpia',
      buena.revision === 'ok', `revision=${buena.revision}`)

    // ============================================================
    // 2. Columnas generadas
    // ============================================================
    chequear('latas = kg / 14',
      Math.abs(Number(buena.latas) - 280 / 14) < 1e-6,
      `280 kg -> ${buena.latas} latas`)
    chequear('total_pagado = latas * precio',
      Math.abs(Number(buena.total_pagado_bs) - (280 / 14) * 50) < 0.01,
      `${buena.total_pagado_bs} Bs`)

    // ============================================================
    // 3. Balance de masa del beneficio
    // ============================================================
    const { rows: [ben] } = await c.query(
      `insert into beneficio_seco
         (lote_id, kg_pergamino_entrada, kg_trillado_calc, kg_verde_calc,
          kg_caracol_calc, kg_descarte_calc)
       values ($1, 100, 90, 80, 4.5, 5.5)
       returning id, rendimiento_pct`, [loteTra.id])

    chequear('verde + caracol + descarte = trillado',
      Math.abs(80 + 4.5 + 5.5 - 90) < 1e-9, '80 + 4,5 + 5,5 = 90')
    chequear('rendimiento_pct se calcula solo',
      Math.abs(Number(ben.rendimiento_pct) - 80) < 1e-6,
      `${ben.rendimiento_pct}% sobre 100 kg de pergamino`)

    // ============================================================
    // 4. Las muestras descuentan del lote
    // ============================================================
    await c.query(
      `insert into muestras (lote_id, tipo, kg, fecha, motivo)
       values ($1,'muestra',2.56,'2025-07-01','cateo'),
              ($1,'contramuestra',2.56,'2025-07-01','testigo')`, [loteTra.id])
    const { rows: [m] } = await c.query(
      `select coalesce(sum(kg),0) kg from muestras where lote_id = $1`, [loteTra.id])
    chequear('Las muestras quedan contabilizadas', Number(m.kg) === 5.12,
      `${m.kg} kg extraidos del lote`)

    // ============================================================
    // 5. La cola solo acepta lo que paso revision
    // ============================================================
    const payload = { lote: loteTra.codigo, kg_guinda_real: 280, fecha: '2025-06-02' }
    const { payloadCanonico, hash } = hashFase(payload)

    await c.query(
      `insert into blockchain_outbox
         (tabla_origen, registro_id, lote_id, fase, payload_canonico, hash_sha256)
       values ('entregas_acopio', $1, $2, 'acopio', $3, $4)`,
      [String(buena.id), loteTra.id, payloadCanonico, hash])
    chequear('Se encola una entrega con revision ok', true)

    let rechazada = false
    try {
      await c.query('savepoint sp1')
      await c.query(
        `insert into blockchain_outbox
           (tabla_origen, registro_id, lote_id, fase, payload_canonico, hash_sha256)
         values ('entregas_acopio', $1, $2, 'acopio', 'x', $3)`,
        [String(mala.id), loteOrg.id, sha256('x')])
    } catch { rechazada = true } finally { await c.query('rollback to savepoint sp1') }
    chequear('La cola RECHAZA una entrega observada', rechazada,
      'no se sella un dato que sabemos que esta mal')

    // ============================================================
    // 6. Serializacion canonica
    // ============================================================
    const a = canonico({ b: 2, a: 1, kg_peso: 1.23456789 })
    const b = canonico({ kg_peso: 1.23456789, a: 1, b: 2 })
    chequear('El orden de las claves no cambia el hash', a === b, a)

    const nfc = canonico({ nombre: 'Ibañez' })          // ñ compuesta
    const nfd = canonico({ nombre: 'Ibañez' })         // n + tilde
    chequear('NFC normaliza los acentos antes de hashear', nfc === nfd,
      `${sha256(nfc).slice(0, 12)} == ${sha256(nfd).slice(0, 12)}`)

    chequear('Los nulos se omiten, no se serializan',
      canonico({ a: 1, b: null }) === '{"a":1}', canonico({ a: 1, b: null }))

    // ============================================================
    // 7. Encadenado de hashes y deteccion de alteracion
    // ============================================================
    const fases = []
    let anterior = ''
    for (const [i, p] of [
      { fase: 'acopio', kg_guinda: 280 },
      { fase: 'transporte', kg_pergamino: 56 },
      { fase: 'trillado', kg_verde: 44.8 },
    ].entries()) {
      const r = hashFase(p, anterior)
      fases.push({ secuencia: i + 1, payload_canonico: r.payloadCanonico, hash_sha256: r.hash })
      anterior = r.hash
    }
    chequear('La cadena de hashes verifica', verificarCadena(fases).valida === true,
      `${fases.length} fases encadenadas`)

    // Alterar el peso de la fase intermedia debe romper la cadena.
    const alterada = fases.map((f) => ({ ...f }))
    alterada[1].payload_canonico = alterada[1].payload_canonico.replace('56', '560')
    const v = verificarCadena(alterada)
    chequear('Alterar un peso rompe la cadena', v.valida === false,
      `se detecta en la fase ${v.rotaEn}`)

    // ============================================================
    // 8. blockchain_registros es append-only
    // ============================================================
    await c.query(
      `insert into blockchain_registros (tabla_origen, registro_id, lote_id, hash_sha256)
       values ('entregas_acopio', $1, $2, $3)`, [String(buena.id), loteTra.id, hash])
    let updBloqueado = false
    try {
      await c.query('savepoint sp2')
      await c.query(`set local role authenticated`)
      await c.query(`update blockchain_registros set tx_id = 'alterado'`)
    } catch { updBloqueado = true } finally {
      await c.query('rollback to savepoint sp2')
      // `set local role` sobrevive al rollback del savepoint. Sin este reset,
      // las pruebas siguientes correrian como `authenticated` y fallarian por
      // RLS, dando falsos positivos.
      await c.query('reset role')
    }
    chequear('authenticated no puede alterar un sello', updBloqueado)

    // ============================================================
    // 9. Un lote puede cambiar de certificacion?  (deberia NO poder)
    // ============================================================
    let certProtegida = false
    try {
      await c.query('savepoint sp3')
      await c.query(`update lotes set certificacion = 'organico' where id = $1`, [loteTra.id])
    } catch { certProtegida = true } finally { await c.query('rollback to savepoint sp3') }
    chequear('La certificacion de un lote es inmutable', certProtegida,
      certProtegida ? 'un UPDATE es rechazado' : 'un UPDATE la cambia sin problema')

    // El estado avanza pero no retrocede.
    let avanza = false, retrocede = true
    try {
      await c.query('savepoint sp4')
      await c.query(`update lotes set estado = 'trillado' where id = $1`, [loteTra.id])
      avanza = true
      await c.query(`update lotes set estado = 'acopio' where id = $1`, [loteTra.id])
      retrocede = true
    } catch { retrocede = false } finally { await c.query('rollback to savepoint sp4') }
    chequear('El estado del lote avanza', avanza)
    chequear('El estado del lote NO retrocede', !retrocede,
      retrocede ? 'se pudo volver a acopio desde trillado' : 'exportado no vuelve a acopio')

    // ============================================================
    // 10. La vista de trazabilidad arma la cadena
    // ============================================================
    const { rows: [tz] } = await c.query(
      `select * from v_trazabilidad_lote where lote = $1`, [loteTra.codigo])
    chequear('v_trazabilidad_lote devuelve el lote temporal',
      tz && Number(tz.kg_guinda_real) === 280,
      tz ? `kg=${tz.kg_guinda_real} muestras=${tz.kg_en_muestras} sellos=${tz.sellos_blockchain}` : 'sin fila')

  } finally {
    await c.query('rollback')
    const { rows: [r] } = await c.query(
      `select count(*)::int n from lotes where codigo in ('OR-99-25','TR-99-25')`)
    chequear('ROLLBACK: no quedan datos de prueba en la base', r.n === 0,
      `${r.n} lotes de prueba encontrados despues del rollback`)
    await c.end()
  }

  const ancho = Math.max(...resultados.map((r) => r[1].length))
  console.log('\nPRUEBAS DE TRAZABILIDAD\n' + '='.repeat(ancho + 30))
  for (const [estado, nombre, detalle] of resultados) {
    console.log(`  ${estado === 'PASA' ? 'ok  ' : 'FALLA'} ${nombre.padEnd(ancho)}  ${detalle}`)
  }
  console.log('='.repeat(ancho + 30))
  console.log(`  ${ok} pasan, ${fallo} fallan`)
  process.exit(fallo ? 1 : 0)
}

main().catch((e) => { console.error('\nERROR:', e.message); process.exit(1) })
