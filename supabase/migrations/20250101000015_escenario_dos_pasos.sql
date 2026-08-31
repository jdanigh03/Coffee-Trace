-- ============================================================
-- El escenario propuesto, en dos pasos
--
-- Los tres supuestos del Excel no son de la misma naturaleza y meterlos en una
-- sola columna deja el numero sin defensa:
--
--   ESCENARIO A - atribuible al sistema.
--     El TND es, literalmente, cafe cuya disposicion final no puede
--     acreditarse. Que baje a cero es consecuencia directa de registrar toda
--     salida con su destino, que es lo que hace la plataforma. No hace falta
--     que nadie tome ninguna decision para que ocurra.
--
--   ESCENARIO B - requiere decision comercial.
--     Bajar el inventario inmovilizado al 8 % (organico) y al 20 %
--     (transicion) exige salir a colocar ese cafe. La trazabilidad lo
--     habilita porque permite comprometer el lote antes de cerrar campania,
--     pero no lo ejecuta.
--
-- Separarlos permite afirmar el A sin condiciones y presentar el B como
-- potencial, con sus supuestos a la vista.
-- ============================================================

-- `create or replace view` no puede renombrar columnas: las dos vistas se
-- rehacen desde cero. La de campania primero, que depende de la otra.
drop view if exists v_indicadores_escenario_campania;
drop view if exists v_indicadores_escenario;

create view v_indicadores_escenario as
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
    -- Meta de producto sin destino: 0 por defecto. Comun a los dos escenarios,
    -- porque es lo que el sistema resuelve por si solo.
    round(a.vop * coalesce(fn_parametro_num('escenario_tnd_pct'), 0) / 100, 2) as vond_meta,
    -- El escenario B nunca sube el inventario: si ya esta por debajo de la
    -- meta, se queda donde esta.
    least(a.vos, round(a.vop * m.tin_meta_pct / 100, 2)) as vos_b
  from v_indicadores_exportacion a
  join meta m using (certificacion)
)
select
  campania_id, certificacion, tin_meta_pct,
  -- Medicion
  vop, voe, vos, vond, tee, tin, tnd,

  -- Escenario A: solo se acredita el destino de lo que hoy no se puede
  -- acreditar. El inventario no se toca.
  vos                                                        as vos_a,
  vond_meta                                                  as vond_a,
  round(vop - vos - vond_meta, 2)                            as voe_a,
  round((vop - vos - vond_meta) / nullif(vop, 0) * 100, 2)   as tee_a,
  round(vos / nullif(vop, 0) * 100, 2)                       as tin_a,
  round(vond_meta / nullif(vop, 0) * 100, 2)                 as tnd_a,

  -- Escenario B: ademas, el inventario baja a la meta de la categoria.
  vos_b,
  vond_meta                                                  as vond_b,
  round(vop - vos_b - vond_meta, 2)                          as voe_b,
  round((vop - vos_b - vond_meta) / nullif(vop, 0) * 100, 2) as tee_b,
  round(vos_b / nullif(vop, 0) * 100, 2)                     as tin_b,
  round(vond_meta / nullif(vop, 0) * 100, 2)                 as tnd_b
from calc;

comment on view v_indicadores_escenario is
  'Las columnas sin sufijo son medicion. Las _a son proyeccion atribuible al '
  'sistema (documentar toda salida). Las _b anaden supuestos de gestion '
  'comercial parametrizados en el grupo "escenario".';

create view v_indicadores_escenario_campania as
select
  campania_id,
  round(sum(vop), 2) vop, round(sum(voe), 2) voe,
  round(sum(vos), 2) vos, round(sum(vond), 2) vond,
  round(sum(voe) / nullif(sum(vop), 0) * 100, 2)  as tee,
  round(sum(vos) / nullif(sum(vop), 0) * 100, 2)  as tin,
  round(sum(vond) / nullif(sum(vop), 0) * 100, 2) as tnd,

  round(sum(voe_a), 2) voe_a, round(sum(vos_a), 2) vos_a,
  round(sum(vond_a), 2) vond_a,
  round(sum(voe_a) / nullif(sum(vop), 0) * 100, 2)  as tee_a,
  round(sum(vos_a) / nullif(sum(vop), 0) * 100, 2)  as tin_a,
  round(sum(vond_a) / nullif(sum(vop), 0) * 100, 2) as tnd_a,

  round(sum(voe_b), 2) voe_b, round(sum(vos_b), 2) vos_b,
  round(sum(vond_b), 2) vond_b,
  round(sum(voe_b) / nullif(sum(vop), 0) * 100, 2)  as tee_b,
  round(sum(vos_b) / nullif(sum(vop), 0) * 100, 2)  as tin_b,
  round(sum(vond_b) / nullif(sum(vop), 0) * 100, 2) as tnd_b
from v_indicadores_escenario
group by campania_id;

grant select on v_indicadores_escenario, v_indicadores_escenario_campania
  to anon, authenticated;
