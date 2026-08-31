-- ============================================================
-- Lo que mejora al registrar la cadena, y lo que solo se proyecta
--
-- El comparativo del Excel mezcla dos cosas que no se miden igual:
--
--  1. COBERTURA. Cuantas etapas de la cadena tienen registro y cuantos
--     registros hay. Eso es un hecho: se cuenta en la base y sube en cuanto
--     se registran las etapas. `v_cobertura_cadena`.
--
--  2. EFICIENCIA (TEE/TIN/TND). Registrar el despulpado no mueve un kilo de
--     cafe del almacen al barco. La mejora que proyecta el Excel viene de tres
--     supuestos de gestion declarados en su hoja Calculo_Eficiencia, no de los
--     datos. `v_indicadores_escenario` los aplica y los deja a la vista.
--
-- Separarlas importa: presentar una proyeccion como medicion es lo que hunde
-- una defensa. Asi se puede decir "esto lo mide la plataforma" y "esto es lo
-- que pasaria si se adopta el modelo", y cada numero queda sostenido por lo
-- que le corresponde.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Cobertura de la cadena  (HECHO: se cuenta en la base)
-- ------------------------------------------------------------
create or replace view v_cobertura_cadena as
select orden, fase, etapa, fuente, registros, registros > 0 as cubierta
from (values
  ( 1, 'I',   'Parcelas y cosecha',      'parcelas',
       (select count(*)::int from parcelas)),
  ( 2, 'II',  'Acopio de guinda',        'entregas_acopio',
       (select count(*)::int from entregas_acopio)),
  ( 3, 'II',  'Descarga en tolva',       'etapa_tolva',
       (select count(*)::int from etapa_tolva)),
  ( 4, 'II',  'Despulpado',              'etapa_despulpado',
       (select count(*)::int from etapa_despulpado)),
  ( 5, 'II',  'Sultana (subproducto)',   'sultana',
       (select count(*)::int from sultana)),
  ( 6, 'II',  'Fermentacion',            'etapa_fermentacion',
       (select count(*)::int from etapa_fermentacion)),
  ( 7, 'II',  'Lavado en correteo',      'etapa_lavado',
       (select count(*)::int from etapa_lavado)),
  ( 8, 'II',  'Secado',                  'etapa_secado',
       (select count(*)::int from etapa_secado)),
  ( 9, 'II',  'Almacen y formacion de lote', 'etapa_almacen_temporal',
       (select count(*)::int from etapa_almacen_temporal)),
  (10, 'II',  'Despacho a El Alto',      'envios con nota de remision',
       (select count(*)::int from envios where nota_remision is not null)),
  (11, 'III', 'Transporte',              'envios',
       (select count(*)::int from envios)),
  (12, 'III', 'Recepcion en El Alto',    'envios con peso recibido',
       (select count(*)::int from envios where kg_pergamino_recibido is not null)),
  (13, 'III', 'Limpieza de maquinas',    'limpiezas_equipo',
       (select count(*)::int from limpiezas_equipo)),
  (14, 'III', 'Trillado',                'etapa_trillado',
       (select count(*)::int from etapa_trillado)),
  (15, 'III', 'Seleccion',               'etapa_seleccion',
       (select count(*)::int from etapa_seleccion)),
  (16, 'III', 'Empaque y almacen',       'etapa_empaque',
       (select count(*)::int from etapa_empaque)),
  (17, 'III', 'Despacho a exportacion',  'despacho_lotes',
       (select count(*)::int from despacho_lotes)),
  (18, 'III', 'Documentacion de embarque', 'exportaciones',
       (select count(*)::int from exportaciones))
) as t(orden, fase, etapa, fuente, registros);

comment on view v_cobertura_cadena is
  'Una fila por eslabon de la cadena con cuantos registros tiene. Es la medida '
  'directa de lo que la plataforma cubre: si una etapa esta en cero, ese tramo '
  'del recorrido del cafe no esta documentado.';

create or replace view v_cobertura_resumen as
select
  count(*)::int                                as etapas,
  count(*) filter (where cubierta)::int        as etapas_cubiertas,
  sum(registros)::int                          as registros,
  round(count(*) filter (where cubierta) * 100.0 / count(*), 1) as cobertura_pct
from v_cobertura_cadena;

grant select on v_cobertura_cadena, v_cobertura_resumen to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Escenario propuesto  (PROYECCION: supuestos declarados)
--
-- Los tres supuestos son los de la hoja Calculo_Eficiencia del Excel:
--   - el producto sin destino documentado se elimina (TND -> 0)
--   - el inventario organico baja al 8 % del verde oro producido
--   - el inventario de transicion baja al 20 %
--
-- Son parametros: si la asociacion revisa la meta, el escenario se recalcula
-- solo. No estan escritos dentro de la vista a proposito.
-- ------------------------------------------------------------
insert into parametros (clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor) values
  ('escenario_tin_organico_pct',   '8',  'numero', 'escenario',
   'Meta de inventario inmovilizado organico, como % del verde oro producido', '%', 0, 100),
  ('escenario_tin_transicion_pct', '20', 'numero', 'escenario',
   'Meta de inventario inmovilizado de transicion, como % del verde oro producido', '%', 0, 100),
  ('escenario_tnd_pct',            '0',  'numero', 'escenario',
   'Meta de producto sin destino documentado: toda salida queda registrada', '%', 0, 100)
on conflict (clave) do nothing;

create or replace view v_indicadores_escenario as
with meta as (
  select 'organico'::tipo_certificacion as certificacion,
         coalesce(fn_parametro_num('escenario_tin_organico_pct'), 8) as tin_meta_pct
  union all
  select 'transicion'::tipo_certificacion,
         coalesce(fn_parametro_num('escenario_tin_transicion_pct'), 20)
),
calc as (
  select
    a.campania_id, a.certificacion, a.vop, a.voe, a.vos, a.vond,
    a.tee, a.tin, a.tnd,
    m.tin_meta_pct,
    -- El escenario nunca sube el inventario: si ya esta por debajo de la meta,
    -- se queda donde esta.
    least(a.vos, round(a.vop * m.tin_meta_pct / 100, 2))              as vos_meta,
    round(a.vop * coalesce(fn_parametro_num('escenario_tnd_pct'), 0) / 100, 2) as vond_meta
  from v_indicadores_exportacion a
  join meta m using (certificacion)
)
select
  campania_id, certificacion, tin_meta_pct,
  vop, voe, vos, vond, tee, tin, tnd,
  vos_meta,
  vond_meta,
  -- El volumen fisico no cambia: lo que sale del almacen y lo que deja de
  -- estar sin acreditar pasa a exportacion.
  round(vop - vos_meta - vond_meta, 2)                          as voe_meta,
  round((vop - vos_meta - vond_meta) / nullif(vop, 0) * 100, 2) as tee_meta,
  round(vos_meta / nullif(vop, 0) * 100, 2)                     as tin_meta,
  round(vond_meta / nullif(vop, 0) * 100, 2)                    as tnd_meta
from calc;

comment on view v_indicadores_escenario is
  'PROYECCION, no medicion. Las columnas _meta son lo que darian los '
  'indicadores si se cumplen los supuestos de gestion parametrizados en el '
  'grupo "escenario". Las otras columnas si son la medicion real.';

create or replace view v_indicadores_escenario_campania as
select
  campania_id,
  round(sum(vop), 2) vop, round(sum(voe), 2) voe,
  round(sum(vos), 2) vos, round(sum(vond), 2) vond,
  round(sum(voe) / nullif(sum(vop), 0) * 100, 2)  as tee,
  round(sum(vos) / nullif(sum(vop), 0) * 100, 2)  as tin,
  round(sum(vond) / nullif(sum(vop), 0) * 100, 2) as tnd,
  round(sum(voe_meta), 2) voe_meta, round(sum(vos_meta), 2) vos_meta,
  round(sum(vond_meta), 2) vond_meta,
  round(sum(voe_meta) / nullif(sum(vop), 0) * 100, 2)  as tee_meta,
  round(sum(vos_meta) / nullif(sum(vop), 0) * 100, 2)  as tin_meta,
  round(sum(vond_meta) / nullif(sum(vop), 0) * 100, 2) as tnd_meta
from v_indicadores_escenario
group by campania_id;

grant select on v_indicadores_escenario, v_indicadores_escenario_campania
  to anon, authenticated;
