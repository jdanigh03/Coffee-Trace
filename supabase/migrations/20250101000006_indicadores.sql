-- ============================================================
-- Indicadores de eficiencia exportadora
--
-- Operacionalizan la variable dependiente del proyecto. Se calculan de forma
-- diferenciada por certificacion (organico / transicion) porque cada categoria
-- tiene condiciones de mercado y certificacion distintas.
--
--   TEE = (VOe / VOp) * 100    Tasa de Eficiencia Exportadora
--   TIN = (VOs / VOp) * 100    Tasa de Inmovilizacion de Inventario
--   TND = (VOnd / VOp) * 100   Tasa de producto sin destino documentado
--
-- donde  VOnd = VOp - (VOe + VOs)  y por construccion TEE + TIN + TND = 100.
-- ============================================================

-- Volumen de cafe verde oro PRODUCIDO por lote (VOp).
-- Se prefiere el peso real medido en planta; mientras no exista, se usa la
-- estimacion por factores. `es_estimado` deja claro cual de los dos se uso:
-- un indicador calculado sobre una estimacion no es lo mismo que uno medido.
create or replace view v_verde_oro_producido as
select
  l.id            as lote_id,
  l.codigo,
  l.campania_id,
  l.certificacion,
  coalesce(b.kg_verde_real, b.kg_verde_calc, eq.kg_verde_oro_calc, 0) as kg_verde_oro,
  (b.kg_verde_real is null) as es_estimado
from lotes l
left join beneficio_seco b        on b.lote_id = l.id
left join v_equivalencias_lote eq on eq.lote_id = l.id;

comment on view v_verde_oro_producido is
  'VOp por lote. es_estimado = true significa que nadie peso el verde oro: '
  'sale de multiplicar la guinda por los factores fijos.';

-- Volumen EXPORTADO con documentacion de embarque verificable (VOe).
-- Solo cuenta lo que tiene registro en `exportaciones`: sin documento de
-- embarque no es exportacion verificable, que es justo lo que mide el TEE.
create or replace view v_verde_oro_exportado as
select
  dl.lote_id,
  sum(dl.kg_asignados) as kg_exportado,
  count(*) filter (where e.id is not null)::int as despachos_con_documento,
  count(*)::int as despachos_totales
from despacho_lotes dl
join despachos d      on d.id = dl.despacho_id
left join exportaciones e on e.despacho_id = d.id
where e.id is not null
group by dl.lote_id;

-- Saldo inmovilizado en almacen (VOs).
create or replace view v_verde_oro_saldo as
select lote_id, sum(kg_saldo) as kg_saldo
from existencias
where producto = 'verde_oro'
group by lote_id;

-- ------------------------------------------------------------
-- Indicadores por campania y certificacion
-- ------------------------------------------------------------

create or replace view v_indicadores_exportacion as
with base as (
  select
    p.campania_id,
    p.certificacion,
    sum(p.kg_verde_oro)                as vop,
    sum(coalesce(x.kg_exportado, 0))   as voe,
    sum(coalesce(s.kg_saldo, 0))       as vos,
    count(*)::int                      as lotes,
    count(*) filter (where p.es_estimado)::int as lotes_estimados
  from v_verde_oro_producido p
  left join v_verde_oro_exportado x on x.lote_id = p.lote_id
  left join v_verde_oro_saldo s     on s.lote_id = p.lote_id
  group by p.campania_id, p.certificacion
)
select
  campania_id,
  certificacion,
  lotes,
  lotes_estimados,
  round(vop::numeric, 2) as vop,
  round(voe::numeric, 2) as voe,
  round(vos::numeric, 2) as vos,
  round((vop - voe - vos)::numeric, 2) as vond,
  -- nullif evita la division por cero cuando una categoria no produjo nada.
  round((voe / nullif(vop, 0) * 100)::numeric, 2)                as tee,
  round((vos / nullif(vop, 0) * 100)::numeric, 2)                as tin,
  round(((vop - voe - vos) / nullif(vop, 0) * 100)::numeric, 2)  as tnd,
  -- Un VOnd negativo significa que lo exportado mas lo almacenado supera lo
  -- producido: no es una brecha, es una inconsistencia de datos.
  (vop - voe - vos) < 0 as inconsistente
from base
order by campania_id desc, certificacion;

comment on view v_indicadores_exportacion is
  'TEE, TIN y TND por campania y certificacion. TEE es el indicador principal; '
  'TND mide la brecha de trazabilidad: producto cuya disposicion final no puede '
  'acreditarse documentalmente.';

-- Totales de la campania, sin separar por certificacion.
create or replace view v_indicadores_campania as
select
  campania_id,
  sum(lotes)::int           as lotes,
  sum(lotes_estimados)::int as lotes_estimados,
  round(sum(vop), 2)  as vop,
  round(sum(voe), 2)  as voe,
  round(sum(vos), 2)  as vos,
  round(sum(vond), 2) as vond,
  round(sum(voe) / nullif(sum(vop), 0) * 100, 2)  as tee,
  round(sum(vos) / nullif(sum(vop), 0) * 100, 2)  as tin,
  round(sum(vond) / nullif(sum(vop), 0) * 100, 2) as tnd
from v_indicadores_exportacion
group by campania_id
order by campania_id desc;

grant select on v_verde_oro_producido, v_verde_oro_exportado, v_verde_oro_saldo,
                v_indicadores_exportacion, v_indicadores_campania
  to anon, authenticated;
