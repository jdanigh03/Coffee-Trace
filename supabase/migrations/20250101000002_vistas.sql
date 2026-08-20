-- ============================================================
-- Vistas de consulta
-- Las equivalencias NO se almacenan: se derivan aqui desde los
-- dos unicos pesos medidos (guinda en acopio, pergamino al cargar).
-- ============================================================

-- Total autoritativo de cada lote a partir de sus entregas.
create or replace view v_lote_totales as
select
  l.id                as lote_id,
  l.codigo,
  l.campania_id,
  l.certificacion,
  l.estado,
  count(e.id)         as entregas,
  coalesce(sum(e.kg_guinda_real), 0) as kg_guinda_real,
  coalesce(sum(e.latas), 0)          as latas,
  coalesce(sum(e.total_pagado_bs), 0) as total_pagado_bs,
  count(*) filter (where e.revision <> 'ok') as entregas_observadas
from lotes l
left join entregas_acopio e on e.lote_id = l.id
group by l.id;

comment on view v_lote_totales is
  'Suma real de cada lote. lotes.kg_guinda_total es solo un cache; esta vista manda.';

-- Equivalencias por lote aplicando los factores de la campania.
create or replace view v_equivalencias_lote as
select
  t.lote_id,
  t.codigo,
  t.campania_id,
  t.kg_guinda_real,
  t.kg_guinda_real * max(f.factor) filter (where f.destino = 'mote')                  as kg_mote_calc,
  t.kg_guinda_real * max(f.factor) filter (where f.destino = 'pergamino')             as kg_pergamino_calc,
  t.kg_guinda_real * max(f.factor) filter (where f.destino = 'verde_sin_seleccionar') as kg_verde_sin_selec_calc,
  t.kg_guinda_real * max(f.factor) filter (where f.destino = 'verde_oro')             as kg_verde_oro_calc
from v_lote_totales t
join factores_conversion f
  on f.campania_id = t.campania_id
 and f.origen = 'guinda'
group by t.lote_id, t.codigo, t.campania_id, t.kg_guinda_real;

comment on view v_equivalencias_lote is
  'Reproduce las columnas MOTE / PERGAMINO / VERDE de los Excel. Son estimaciones por factores, '
  'no pesos medidos. Comparar con envios.kg_pergamino_despachado, que si es real.';

-- Estimado vs real: lo que hoy el Excel no puede mostrar.
create or replace view v_rendimiento_real_vs_estimado as
select
  l.codigo,
  l.campania_id,
  l.certificacion,
  eq.kg_pergamino_calc              as pergamino_estimado,
  en.kg_pergamino_despachado        as pergamino_despachado_real,
  en.kg_pergamino_recibido          as pergamino_recibido_real,
  en.diferencia_kg                  as diferencia_transporte,
  b.kg_verde_calc                   as verde_estimado,
  b.kg_verde_real                   as verde_real,
  b.rendimiento_pct,
  case
    when b.kg_verde_real is null then 'estimado'
    else 'medido'
  end as origen_del_dato
from lotes l
left join v_equivalencias_lote eq on eq.lote_id = l.id
left join envios en              on en.lote_id = l.id
left join beneficio_seco b       on b.lote_id = l.id;

comment on view v_rendimiento_real_vs_estimado is
  'origen_del_dato = estimado significa que nadie peso: el numero sale de multiplicar por un factor.';

-- Cuanto se pago a cada productor por campania (contabilidad la lleva otra area).
create or replace view v_pagos_por_productor as
select
  p.id            as persona_id,
  p.nombre,
  e.campania_id,
  count(e.id)     as entregas,
  sum(e.kg_guinda_real) as kg_guinda,
  sum(e.latas)          as latas,
  round(avg(e.precio_unitario_bs), 2) as precio_promedio_bs,
  sum(e.total_pagado_bs)              as total_pagado_bs
from entregas_acopio e
join personas p on p.id = e.persona_id
group by p.id, p.nombre, e.campania_id;

-- Retencion de socios entre campanias.
create or replace view v_socios_por_campania as
select
  a.campania_id,
  a.estado,
  count(*) as socios,
  count(*) filter (where ent.persona_id is not null) as con_entregas
from afiliaciones a
left join lateral (
  select 1 as persona_id
  from entregas_acopio e
  where e.persona_id = a.persona_id and e.campania_id = a.campania_id
  limit 1
) ent on true
group by a.campania_id, a.estado;

comment on view v_socios_por_campania is
  'Responde cuantos socios entregaron por campania y cuantos se retiraron. '
  'Relevante porque varios estan dejando la asociacion por la competencia privada.';

-- Cadena de trazabilidad completa de un lote, para el certificado de origen.
create or replace view v_trazabilidad_lote as
select
  l.codigo                  as lote,
  l.certificacion,
  l.campania_id,
  t.entregas,
  t.kg_guinda_real,
  count(distinct e.persona_id) as productores,
  count(distinct pa.comunidad_id) as comunidades,
  en.fecha_salida,
  en.kg_pergamino_despachado,
  b.kg_verde_real,
  b.kg_verde_calc,
  mu.kg_en_muestras,
  bc.sellos_blockchain
from lotes l
left join v_lote_totales t   on t.lote_id = l.id
left join entregas_acopio e  on e.lote_id = l.id
left join parcelas pa        on pa.id = e.parcela_id
left join envios en          on en.lote_id = l.id
left join beneficio_seco b   on b.lote_id = l.id
-- Muestras y sellos van por lateral, no por join directo: unirlos junto a
-- entregas multiplicaria las filas y los totales saldrian inflados.
left join lateral (
  select coalesce(sum(m.kg), 0) as kg_en_muestras
  from muestras m where m.lote_id = l.id
) mu on true
left join lateral (
  select count(*) as sellos_blockchain
  from blockchain_registros br where br.lote_id = l.id
) bc on true
group by l.id, l.codigo, l.certificacion, l.campania_id, t.entregas, t.kg_guinda_real,
         en.fecha_salida, en.kg_pergamino_despachado, b.kg_verde_real, b.kg_verde_calc,
         mu.kg_en_muestras, bc.sellos_blockchain;

-- Filas que quedaron marcadas al cargar.
create or replace view v_inconsistencias as
select
  e.id,
  e.fecha,
  cp.codigo        as codigo_excel,
  cp.nombre_excel,
  e.kg_guinda_real,
  e.estatus_declarado,
  l.codigo         as lote,
  l.certificacion  as lote_certificacion,
  e.revision,
  e.revision_nota
from entregas_acopio e
join codigos_productor cp on cp.id = e.codigo_productor_id
left join lotes l on l.id = e.lote_id
where e.revision <> 'ok'
order by e.fecha;

comment on view v_inconsistencias is
  'Las filas contradictorias no se descartan al cargar, se marcan. Esta vista es la lista de '
  'trabajo para depurarlas: 8 entregas T3 en planilla organica + 34 con estatus vacio.';
