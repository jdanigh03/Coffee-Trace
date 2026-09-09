import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/**
 * Cara publica de la plataforma.
 *
 * Estas rutas las consume la portada, que no pide credenciales. La base tiene
 * nombres, comunidades y montos pagados de 102 productores reales, asi que
 * aqui NADA se selecciona con `*`: cada consulta lista sus columnas a mano y
 * los productores se cuentan, nunca se nombran.
 *
 * Lo que si es publico: el recorrido del lote, la cobertura de la cadena y los
 * documentos de exportacion. Es justo lo que un comprador necesita verificar.
 */

/** GET /api/publico/resumen  -> cifras de la portada */
router.get('/resumen', asyncHandler(async (req, res) => {
  const campania = Number(req.query.campania ?? 2025)

  const [organizacion, cobertura, etapas, alcance, paises, sellado, lotes] = await Promise.all([
    uno('select nombre, codigo_ico from organizacion order by id limit 1'),
    uno('select * from v_cobertura_resumen'),
    q('select orden, fase, etapa, registros, cubierta from v_cobertura_cadena order by orden'),
    uno(`select (select count(*)::int from personas)                        as productores,
                (select count(*)::int from comunidades)                     as comunidades,
                (select count(distinct id)::int from lotes
                  where campania_id = $1)                                   as lotes,
                (select coalesce(sum(kg_guinda_real), 0) from entregas_acopio
                  where campania_id = $1)                                   as kg_guinda`,
      [campania]),
    // Solo destinos con embarque documentado: sin registro de exportacion no
    // es un mercado, es una intencion.
    q(`select c.pais, count(distinct d.id)::int as embarques,
              coalesce(sum(d.kg_neto), 0) as kg
       from despachos d
       join contratos ct     on ct.id = d.contrato_id
       join clientes c       on c.id = ct.cliente_id
       join exportaciones e  on e.despacho_id = d.id
       group by c.pais order by kg desc`),
    uno(`select count(*)::int as sellos from blockchain_registros`),
    q(`select l.codigo, l.certificacion, l.campania_id, l.estado
       from lotes l where l.campania_id = $1 order by l.codigo`, [campania]),
  ])

  // Certificaciones realmente declaradas en los embarques, sin repetir.
  const certificaciones = await q(
    `select distinct unnest(certificaciones) as nombre
     from exportaciones where certificaciones is not null order by 1`)

  res.json({
    success: true,
    data: {
      campania,
      organizacion,
      // `etapasDetalle` y no `etapas`: la vista ya trae `etapas` como el numero
      // total, y meter el array con ese nombre lo pisaba.
      cobertura: { ...cobertura, etapasDetalle: etapas },
      alcance,
      paises,
      certificaciones: certificaciones.map((c) => c.nombre),
      lotes,
      // La red Fabric todavia no esta desplegada. Se reporta el numero real de
      // sellos para que la portada no prometa una proteccion que hoy no existe.
      blockchain: { redDesplegada: false, sellos: sellado.sellos },
    },
  })
}))

/**
 * GET /api/publico/lote/:codigo  -> recorrido verificable de un lote.
 *
 * Vista recortada a proposito: cuenta los productores pero no los nombra, y
 * no devuelve precios, pagos ni el numero de contenedor.
 */
router.get('/lote/:codigo', asyncHandler(async (req, res) => {
  const codigo = String(req.params.codigo).trim().toUpperCase()

  const lote = await uno(`
    select l.id, l.codigo, l.certificacion, l.campania_id, l.estado,
           t.entregas, t.kg_guinda_real,
           eq.kg_pergamino_calc, eq.kg_verde_oro_calc
    from lotes l
    join v_lote_totales t             on t.lote_id = l.id
    left join v_equivalencias_lote eq on eq.lote_id = l.id
    where upper(l.codigo) = $1`, [codigo])

  if (!lote) {
    return res.status(404).json({
      success: false,
      error: `No encontramos el lote ${codigo}. Verifique el codigo en su documentacion.`,
    })
  }

  const [origen, faseII, faseIII, envio, exportacion] = await Promise.all([
    // Cuantos productores y de que comunidades. Los nombres no salen de aqui.
    uno(`select count(distinct e.persona_id)::int as productores,
                count(distinct co.id)::int       as comunidades,
                string_agg(distinct co.nombre, ', ' order by co.nombre) as lista_comunidades
         from entregas_acopio e
         left join parcelas pa    on pa.id = e.parcela_id
         left join comunidades co on co.id = pa.comunidad_id
         where e.lote_id = $1`, [lote.id]),
    uno(`select tolva, despulpado, fermentacion, lavado, secado, almacen_temporal
         from v_avance_fase_ii where lote_id = $1`, [lote.id]),
    uno(`select recepcion, limpieza, trillado, seleccion, empaque, exportacion
         from v_avance_fase_iii where lote_id = $1`, [lote.id]),
    uno(`select fecha_salida, fecha_llegada, nota_remision,
                kg_pergamino_despachado, kg_pergamino_recibido, diferencia_kg
         from envios where lote_id = $1 order by fecha_salida limit 1`, [lote.id]),
    uno(`select d.fecha_despacho, c.pais, ex.fecha_embarque, ex.puerto_salida,
                ex.naviera, ex.certificaciones, dl.kg_asignados
         from despacho_lotes dl
         join despachos d      on d.id = dl.despacho_id
         join exportaciones ex on ex.despacho_id = d.id
         left join contratos ct on ct.id = d.contrato_id
         left join clientes c   on c.id = ct.cliente_id
         where dl.lote_id = $1 order by ex.fecha_embarque limit 1`, [lote.id]),
  ])

  const sellos = await q(
    `select tabla_origen, hash_sha256, sellado_en, block_number
     from blockchain_registros where lote_id = $1 order by sellado_en`, [lote.id])

  res.json({
    success: true,
    data: { lote, origen, faseII, faseIII, envio, exportacion, sellos },
  })
}))

export default router
