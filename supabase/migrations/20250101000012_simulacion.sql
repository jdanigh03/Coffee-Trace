-- ============================================================
-- Registro de datos simulados
--
-- La campana 2025 tiene datos reales en acopio, lotes, envios y despachos, y
-- datos simulados en las etapas intermedias. Mezclarlos sin marca seria
-- irreversible: dentro de un mes nadie sabria cual es cual.
--
-- Esta tabla anota cada fila tocada por una carga de simulacion. Para los
-- INSERT basta el id; para los UPDATE se guarda ademas el valor anterior de
-- las columnas modificadas, que es lo unico que permite deshacerlos.
--
-- Con esto, borrar la simulacion es una operacion exacta y no una limpieza a
-- ojo: `node scripts/simulacion.js --borrar`.
-- ============================================================

create table simulacion_registros (
  id              bigserial primary key,
  carga           varchar(60) not null,
  tabla           varchar(63) not null,
  -- text y no uuid: unas tablas usan uuid y otras bigserial.
  fila_id         text not null,
  operacion       varchar(10) not null check (operacion in ('insert', 'update')),
  -- Valores de ANTES, solo de las columnas que la carga escribio.
  valores_previos jsonb,
  cargado_en      timestamptz not null default now(),
  constraint update_lleva_valores_previos
    check (operacion = 'insert' or valores_previos is not null)
);

comment on table simulacion_registros is
  'Inventario de lo que metio cada carga de datos simulados, para poder '
  'revertirla fila por fila.';
comment on column simulacion_registros.valores_previos is
  'Solo en los update: el valor original de las columnas pisadas. Sin esto un '
  'update sobre datos reales no tendria vuelta atras.';

create index on simulacion_registros (carga);
create index on simulacion_registros (tabla);

alter table simulacion_registros enable row level security;

create policy "lectura_autenticados" on simulacion_registros
  for select to authenticated using (true);

-- Solo admin: borrar la simulacion cambia los datos de toda la plataforma.
create policy "escritura_admin" on simulacion_registros
  for all to authenticated
  using (tiene_rol('admin')) with check (tiene_rol('admin'));

grant select on simulacion_registros to anon, authenticated;
grant insert, update, delete on simulacion_registros to authenticated;
grant all on simulacion_registros to service_role;
grant usage, select on sequence simulacion_registros_id_seq
  to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- Que hay cargado ahora mismo
-- ------------------------------------------------------------
create or replace view v_simulacion as
select carga, tabla, operacion, count(*)::int filas,
       min(cargado_en) as desde, max(cargado_en) as hasta
from simulacion_registros
group by carga, tabla, operacion
order by carga, tabla;

grant select on v_simulacion to anon, authenticated;
