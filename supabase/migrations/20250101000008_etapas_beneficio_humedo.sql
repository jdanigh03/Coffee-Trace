-- ============================================================
-- Fase II: etapas del beneficio humedo (Taipiplaya)
--
-- Las seis etapas que el documento de cadena de suministro marca como
-- "algo que se debe agregar": hoy no existen en ningun registro de ASOCAFE.
-- Se crean vacias, para capturar desde cero.
-- ============================================================

create type estado_etapa as enum ('en_proceso', 'completada', 'observada');

-- ------------------------------------------------------------
-- 1. Descarga en tolva
-- ------------------------------------------------------------
create table etapa_tolva (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null references lotes(id) on delete cascade,
  kg_entrada        decimal(12,3) check (kg_entrada > 0),
  tolva             varchar(40),
  limpieza_previa   boolean not null default false,
  hora_limpieza     timestamptz,
  responsable_limpieza varchar(120),
  hora_inicio       timestamptz,
  hora_fin          timestamptz,
  operario          varchar(120),
  observaciones     text,
  estado            estado_etapa not null default 'en_proceso',
  creado_en         timestamptz not null default now()
);
comment on table etapa_tolva is
  'Las tolvas estan separadas por certificacion: la limpieza previa es lo que '
  'impide que un lote organico se contamine con residuos de uno de transicion.';

-- ------------------------------------------------------------
-- 2. Despulpado y desmucilaginado
-- ------------------------------------------------------------
create table etapa_despulpado (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null references lotes(id) on delete cascade,
  maquina           varchar(60),
  hora_inicio       timestamptz,
  hora_fin          timestamptz,
  operario          varchar(120),
  limpieza_validada boolean not null default false,
  responsable_limpieza varchar(120),
  temperatura_c     decimal(5,2),
  velocidad_rpm     integer,
  kg_entrada        decimal(12,3) check (kg_entrada > 0),
  kg_despulpado     decimal(12,3),
  kg_sultana        decimal(12,3),
  destino_sultana   varchar(40)
                    check (destino_sultana in ('combustible','venta','consumo_local','abono')),
  responsable_sultana varchar(120),
  incidencias       text,
  estado            estado_etapa not null default 'en_proceso',
  creado_en         timestamptz not null default now()
);
comment on column etapa_despulpado.kg_sultana is
  'La sultana es el 31% de la guinda y hoy no se registra a donde va. '
  'Sin este dato no cierra el balance de masa de la fase.';

-- ------------------------------------------------------------
-- 3. Fermentacion
-- ------------------------------------------------------------
create table etapa_fermentacion (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null references lotes(id) on delete cascade,
  tanque            varchar(40),
  kg_entrada        decimal(12,3) check (kg_entrada > 0),
  hora_inicio       timestamptz,
  hora_fin          timestamptz,
  mucilago_despegado boolean,
  responsable       varchar(120),
  observaciones     text,
  estado            estado_etapa not null default 'en_proceso',
  creado_en         timestamptz not null default now()
);

-- El monitoreo va aparte: son varias lecturas por fermentacion, cada 2-4 horas.
create table fermentacion_lectura (
  id              bigserial primary key,
  fermentacion_id uuid not null references etapa_fermentacion(id) on delete cascade,
  hora            timestamptz not null,
  temperatura_c   decimal(5,2) not null,
  observaciones   text
);
create index on fermentacion_lectura (fermentacion_id, hora);

-- ------------------------------------------------------------
-- 4. Lavado en canal de correteo
-- ------------------------------------------------------------
create table etapa_lavado (
  id              uuid primary key default gen_random_uuid(),
  lote_id         uuid not null references lotes(id) on delete cascade,
  hora_inicio     timestamptz,
  hora_fin        timestamptz,
  encargado       varchar(120),
  operarios       text,
  calidad_agua    varchar(20) check (calidad_agua in ('limpia','turbia')),
  temperatura_agua_c decimal(5,2),
  carretillas     integer check (carretillas > 0),
  kg_por_carretilla decimal(8,2),
  segregacion_ok  boolean not null default false,
  observaciones   text,
  estado          estado_etapa not null default 'en_proceso',
  creado_en       timestamptz not null default now()
);
comment on column etapa_lavado.segregacion_ok is
  'En el canal el cafe se mezcla y pierde identificacion individual: mantener '
  'la separacion por categoria es critico y por eso se registra explicitamente.';

-- ------------------------------------------------------------
-- 5. Secado
-- ------------------------------------------------------------
create table etapa_secado (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null references lotes(id) on delete cascade,
  tipo_secado       varchar(20) check (tipo_secado in ('tarima','cachi','guardiola','hibrido')),
  fecha_inicio      timestamptz,
  fecha_fin         timestamptz,
  temperatura_inicial_c decimal(5,2),
  humedad_inicial_pct   decimal(5,2),
  -- Humedad final MEDIDA con higrometro, no estimada.
  humedad_final_pct decimal(5,2) check (humedad_final_pct between 0 and 100),
  validador_humedad varchar(120),
  kg_entrada        decimal(12,3),
  kg_pergamino_seco decimal(12,3),
  perdida_agua_kg   decimal(12,3),
  carretillas_traslado integer,
  fecha_traslado    date,
  observaciones     text,
  estado            estado_etapa not null default 'en_proceso',
  creado_en         timestamptz not null default now()
);

create table secado_lectura (
  id            bigserial primary key,
  secado_id     uuid not null references etapa_secado(id) on delete cascade,
  fecha         date not null,
  temperatura_c decimal(5,2),
  humedad_pct   decimal(5,2),
  estado_visual varchar(120),
  incidencias   text
);
create index on secado_lectura (secado_id, fecha);

-- ------------------------------------------------------------
-- 6. Almacenamiento temporal
-- ------------------------------------------------------------
create table etapa_almacen_temporal (
  id              uuid primary key default gen_random_uuid(),
  lote_id         uuid not null references lotes(id) on delete cascade,
  fecha_ingreso   timestamptz,
  ubicacion       varchar(80),
  temperatura_c   decimal(5,2),
  humedad_pct     decimal(5,2),
  kg_acumulado    decimal(12,3),
  lotes_diarios   text,
  responsable     varchar(120),
  observaciones   text,
  estado          estado_etapa not null default 'en_proceso',
  creado_en       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Indices y permisos
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'etapa_tolva','etapa_despulpado','etapa_fermentacion','etapa_lavado',
    'etapa_secado','etapa_almacen_temporal'
  ] loop
    execute format('create index on %I (lote_id)', t);
    execute format('alter table %I enable row level security', t);
    execute format($f$
      create policy "lectura_autenticados" on %I
        for select to authenticated using (true)
    $f$, t);
    execute format($f$
      create policy "escritura_planta" on %I
        for all to authenticated
        using (tiene_rol('admin','operador_acopio','encargado_maquinas'))
        with check (tiene_rol('admin','operador_acopio','encargado_maquinas'))
    $f$, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['fermentacion_lectura','secado_lectura'] loop
    execute format('alter table %I enable row level security', t);
    execute format($f$
      create policy "lectura_autenticados" on %I
        for select to authenticated using (true)
    $f$, t);
    execute format($f$
      create policy "escritura_planta" on %I
        for all to authenticated
        using (tiene_rol('admin','encargado_maquinas'))
        with check (tiene_rol('admin','encargado_maquinas'))
    $f$, t);
  end loop;
end $$;

-- Los permisos se conceden SOLO sobre las tablas nuevas.
-- Un `grant ... on all tables in schema public` volveria a dar UPDATE y DELETE
-- sobre blockchain_registros y anularia el revoke de la migracion de RLS, que
-- es lo que garantiza que un sello no se pueda alterar.
do $$
declare t text;
begin
  foreach t in array array[
    'etapa_tolva','etapa_despulpado','etapa_fermentacion','etapa_lavado',
    'etapa_secado','etapa_almacen_temporal','fermentacion_lectura','secado_lectura'
  ] loop
    execute format('grant select on %I to anon, authenticated', t);
    execute format('grant insert, update, delete on %I to authenticated', t);
    execute format('grant all on %I to service_role', t);
  end loop;
end $$;

grant usage, select on sequence fermentacion_lectura_id_seq, secado_lectura_id_seq
  to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- Avance de la fase II por lote
-- ------------------------------------------------------------
create or replace view v_avance_fase_ii as
select
  l.id as lote_id, l.codigo, l.certificacion, l.campania_id,
  exists(select 1 from etapa_tolva x            where x.lote_id = l.id) as tolva,
  exists(select 1 from etapa_despulpado x       where x.lote_id = l.id) as despulpado,
  exists(select 1 from etapa_fermentacion x     where x.lote_id = l.id) as fermentacion,
  exists(select 1 from etapa_lavado x           where x.lote_id = l.id) as lavado,
  exists(select 1 from etapa_secado x           where x.lote_id = l.id) as secado,
  exists(select 1 from etapa_almacen_temporal x where x.lote_id = l.id) as almacen_temporal
from lotes l;

grant select on v_avance_fase_ii to anon, authenticated;
