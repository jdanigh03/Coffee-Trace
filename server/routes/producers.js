import express from 'express'
import { q, uno, asyncHandler } from '../db.js'

const router = express.Router()

/** GET /api/producers  -> personas con su aporte y estado de afiliacion */
router.get('/', asyncHandler(async (req, res) => {
  const { campania = 2025, comunidad, buscar } = req.query
  const filas = await q(`
    select p.id, p.nombre, p.activo,
           a.estado as afiliacion,
           count(distinct pa.id)                     as parcelas,
           string_agg(distinct co.nombre, ', ')      as comunidades,
           string_agg(distinct cp.codigo, ', ')      as codigos,
           -- Una persona puede tener varias parcelas con distinto estatus,
           -- asi que se listan todos en vez de quedarse con uno.
           string_agg(distinct c.estatus::text, '/') as estatus,
           coalesce(pg.kg_guinda, 0)                 as kg_guinda,
           coalesce(pg.entregas, 0)                  as entregas,
           coalesce(pg.total_pagado_bs, 0)           as total_pagado_bs
    from personas p
    left join afiliaciones a  on a.persona_id = p.id and a.campania_id = $1
    left join parcelas pa     on pa.persona_id = p.id
    left join comunidades co  on co.id = pa.comunidad_id
    left join codigos_productor cp on cp.parcela_id = pa.id
    left join certificaciones c on c.parcela_id = pa.id and c.campania_id = $1
    left join v_pagos_por_productor pg on pg.persona_id = p.id and pg.campania_id = $1
    where ($2::text is null or co.nombre = $2)
      and ($3::text is null or p.nombre ilike '%' || $3 || '%')
    group by p.id, p.nombre, p.activo, a.estado, pg.kg_guinda, pg.entregas, pg.total_pagado_bs
    order by coalesce(pg.kg_guinda, 0) desc`,
    [campania, comunidad ?? null, buscar ?? null])
  res.json({ success: true, data: filas, count: filas.length })
}))

/** GET /api/producers/comunidades */
router.get('/comunidades', asyncHandler(async (req, res) => {
  const filas = await q(`
    select co.id, co.nombre, co.prefijo_codigo,
           count(distinct pa.id) as parcelas,
           count(distinct pa.persona_id) as productores,
           coalesce(sum(e.kg_guinda_real), 0) as kg_guinda
    from comunidades co
    left join parcelas pa        on pa.comunidad_id = co.id
    left join entregas_acopio e  on e.parcela_id = pa.id
    group by co.id
    order by kg_guinda desc`)
  res.json({ success: true, data: filas })
}))

/** GET /api/producers/:id  -> ficha con sus entregas */
router.get('/:id', asyncHandler(async (req, res) => {
  const p = await uno(`select id, nombre, ci, telefono, activo from personas where id = $1`,
    [req.params.id])
  if (!p) return res.status(404).json({ success: false, error: 'Productor no encontrado' })

  const [parcelas, entregas, pagos] = await Promise.all([
    q(`select pa.id, co.nombre as comunidad, pa.hectareas,
              c.estatus, c.tipo, c.campania_id,
              string_agg(cp.codigo, ', ') as codigos
       from parcelas pa
       join comunidades co on co.id = pa.comunidad_id
       left join certificaciones c on c.parcela_id = pa.id
       left join codigos_productor cp on cp.parcela_id = pa.id
       where pa.persona_id = $1
       group by pa.id, co.nombre, pa.hectareas, c.estatus, c.tipo, c.campania_id`, [p.id]),
    q(`select e.fecha, l.codigo as lote, e.kg_guinda_real, e.latas,
              e.precio_unitario_bs, e.total_pagado_bs, e.estatus_declarado, e.revision
       from entregas_acopio e
       left join lotes l on l.id = e.lote_id
       where e.persona_id = $1
       order by e.fecha`, [p.id]),
    q(`select campania_id, entregas, kg_guinda, latas, precio_promedio_bs, total_pagado_bs
       from v_pagos_por_productor where persona_id = $1`, [p.id]),
  ])
  res.json({ success: true, data: { ...p, parcelas, entregas, pagos } })
}))

export default router
