import express from 'express'
import { q, uno, asyncHandler } from '../db.js'
import { canonico, sha256, hashFase, verificarCadena } from '../hash.js'

const router = express.Router()

/** GET /api/blockchain/status  -> estado real de la cola y los sellos */
router.get('/status', asyncHandler(async (req, res) => {
  const [outbox, sellos] = await Promise.all([
    q(`select estado, count(*)::int n from blockchain_outbox group by estado`),
    uno(`select count(*)::int sellos, max(block_number) ultimo_bloque, max(sellado_en) ultimo
         from blockchain_registros`),
  ])
  const cola = Object.fromEntries(outbox.map((r) => [r.estado, r.n]))
  res.json({
    success: true,
    data: {
      // Fabric todavia no esta desplegado: no se inventa un estado de red.
      redDesplegada: false,
      cola: { pendiente: cola.pendiente ?? 0, enviado: cola.enviado ?? 0,
              confirmado: cola.confirmado ?? 0, error: cola.error ?? 0 },
      sellos: sellos.sellos, ultimoBloque: sellos.ultimo_bloque, ultimoSello: sellos.ultimo,
    },
  })
}))

/**
 * POST /api/blockchain/encolar
 * Calcula el hash canonico de un registro y lo deja en la cola.
 * El trigger de la base rechaza lo que no tenga revision = 'ok'.
 */
router.post('/encolar', asyncHandler(async (req, res) => {
  const { tabla, id, fase } = req.body
  if (!tabla || !id) {
    return res.status(400).json({ success: false, error: 'Faltan `tabla` e `id`' })
  }

  const permitidas = { entregas_acopio: 'id', envios: 'id', beneficio_seco: 'id', despachos: 'id' }
  if (!(tabla in permitidas)) {
    return res.status(400).json({ success: false, error: `Tabla no sellable: ${tabla}` })
  }

  const registro = await uno(`select * from ${tabla} where id = $1`, [id])
  if (!registro) return res.status(404).json({ success: false, error: 'Registro no encontrado' })

  const loteId = registro.lote_id ?? null
  const previo = loteId
    ? await uno(`select hash_sha256 from blockchain_registros
                 where lote_id = $1 order by sellado_en desc limit 1`, [loteId])
    : null

  const { payloadCanonico, hash } = hashFase(registro, previo?.hash_sha256 ?? '')

  try {
    const fila = await uno(`
      insert into blockchain_outbox
        (tabla_origen, registro_id, lote_id, fase, payload_canonico, hash_sha256)
      values ($1, $2, $3, $4, $5, $6)
      returning id, estado, hash_sha256, creado_en`,
      [tabla, String(id), loteId, fase ?? null, payloadCanonico, hash])
    res.status(201).json({ success: true, data: fila })
  } catch (e) {
    // El trigger fn_outbox_solo_revisado bloquea lo observado.
    return res.status(409).json({ success: false, error: e.message })
  }
}))

/** POST /api/blockchain/verify  -> recalcula el hash canonico de unos datos */
router.post('/verify', asyncHandler(async (req, res) => {
  const { hash, data, hashAnterior = '' } = req.body
  if (!hash || !data) {
    return res.status(400).json({ success: false, error: 'Se requieren `hash` y `data`' })
  }
  const payloadCanonico = canonico(data)
  const esperado = sha256(payloadCanonico + hashAnterior)
  res.json({
    success: true,
    data: {
      valido: hash === esperado, hash, esperado, payloadCanonico,
      mensaje: hash === esperado
        ? 'El hash coincide: los datos no fueron alterados desde el sellado'
        : 'El hash NO coincide: los datos cambiaron despues de sellarse',
    },
  })
}))

/** GET /api/blockchain/cadena/:codigoLote  -> verifica el encadenado completo */
router.get('/cadena/:codigoLote', asyncHandler(async (req, res) => {
  const lote = await uno(`select id, codigo from lotes where codigo = $1`, [req.params.codigoLote])
  if (!lote) return res.status(404).json({ success: false, error: 'Lote no encontrado' })

  const sellos = await q(`
    select br.id, br.tabla_origen, br.registro_id, br.hash_sha256, br.hash_anterior,
           br.tx_id, br.block_number, br.sellado_en, o.payload_canonico
    from blockchain_registros br
    left join blockchain_outbox o
      on o.tabla_origen = br.tabla_origen and o.registro_id = br.registro_id
    where br.lote_id = $1
    order by br.sellado_en`, [lote.id])

  const verificacion = sellos.every((s) => s.payload_canonico)
    ? verificarCadena(sellos)
    : { valida: null, motivo: 'Faltan payloads canonicos para reverificar' }

  res.json({ success: true, data: { lote: lote.codigo, sellos, verificacion } })
}))

/** GET /api/blockchain/outbox  -> la cola, para el worker y para diagnostico */
router.get('/outbox', asyncHandler(async (req, res) => {
  const filas = await q(`
    select o.id, o.tabla_origen, o.registro_id, l.codigo as lote, o.fase,
           o.hash_sha256, o.estado, o.intentos, o.ultimo_error, o.creado_en
    from blockchain_outbox o
    left join lotes l on l.id = o.lote_id
    where ($1::text is null or o.estado::text = $1)
    order by o.creado_en desc limit 200`, [req.query.estado ?? null])
  res.json({ success: true, data: filas })
}))

export default router
