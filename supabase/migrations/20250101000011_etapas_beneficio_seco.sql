-- ============================================================
-- Fase III: etapas del beneficio seco (El Alto)
--
-- Trillado, seleccion y empaque no tenian tabla propia. Lo unico que existia
-- era `beneficio_seco`, que guarda el AGREGADO por lote calculado con factores,
-- y `existencias`, que guarda el SALDO en almacen.
--
-- Escribir el detalle de cada etapa dentro de esas dos tablas obligaria a pisar
-- cifras de las que dependen los indicadores TEE/TIN/TND: kg_verde_real cambia
-- el VOP, y una fila nueva en existencias cambia el VOS. Por eso las etapas van
-- en tablas aparte y las dos tablas agregadas quedan intactas.
-- ============================================================

-- ------------------------------------------------------------
-- 10. Trillado y clasificacion mecanica
-- ------------------------------------------------------------
create table etapa_trillado (
  id                       uuid primary key default gen_random_uuid(),
  lote_id                  uuid not null references lotes(id) on delete cascade,
  fecha_inicio             date,
  fecha_fin                date,
  kg_pergamino_entrada     decimal(12,3) check (kg_pergamino_entrada > 0),
  kg_verde_sin_seleccionar decimal(12,3),
  -- Subproductos que hoy solo se estiman por coeficiente.
  kg_cascarilla            decimal(12,3),
  kg_caracol               decimal(12,3),
  kg_descarte_mecanico     decimal(12,3),
  rendimiento_pct          decimal(6,2),
  operador                 varchar(120),
  equipo_linea             varchar(160),
  observaciones            text,
  estado                   estado_etapa not null default 'en_proceso',
  creado_en                timestamptz not null default now()
);
comment on table etapa_trillado is
  'Detalle por lote del trillado. El agregado con factores sigue en beneficio_seco: '
  'esta tabla no lo sustituye, lo documenta.';

-- ------------------------------------------------------------
-- 11. Seleccion fisica manual
-- ------------------------------------------------------------
create table etapa_seleccion (
  id                    uuid primary key default gen_random_uuid(),
  lote_id               uuid not null references lotes(id) on delete cascade,
  fecha_inicio          date,
  fecha_fin             date,
  kg_asignado           decimal(12,3),
  kg_devuelto           decimal(12,3),
  kg_defectos           decimal(12,3),
  tasa_defecto_pct      decimal(6,2),
  seleccionadoras       integer check (seleccionadoras > 0),
  kg_por_seleccionadora decimal(10,2),
  -- asignado = devuelto + defectos. Si no cuadra, faltan kilos por explicar.
  balance_cuadra        boolean,
  responsable           varchar(120),
  observaciones         text,
  estado                estado_etapa not null default 'en_proceso',
  creado_en             timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 12. Empaque y almacen de cafe verde oro
-- ------------------------------------------------------------
create table etapa_empaque (
  id             uuid primary key default gen_random_uuid(),
  lote_id        uuid not null references lotes(id) on delete cascade,
  fecha_ingreso  date,
  kg_verde_oro   decimal(12,3),
  tipo_empaque   varchar(60),
  numero_sacos   integer check (numero_sacos > 0),
  kg_por_saco    decimal(8,2),
  ubicacion      varchar(60),
  temperatura_c  decimal(5,2),
  humedad_pct    decimal(5,2),
  responsable    varchar(120),
  observaciones  text,
  estado         estado_etapa not null default 'en_proceso',
  creado_en      timestamptz not null default now()
);
comment on table etapa_empaque is
  'Ingreso del lote empacado al almacen. No es el saldo: el saldo vive en '
  'existencias y es lo que alimenta el TIN.';

-- ------------------------------------------------------------
-- Indices, RLS y permisos (mismo patron que la Fase II)
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['etapa_trillado','etapa_seleccion','etapa_empaque'] loop
    execute format('create index on %I (lote_id)', t);
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
    -- Permisos solo sobre estas tablas: un grant sobre todo el esquema
    -- devolveria UPDATE y DELETE sobre blockchain_registros.
    execute format('grant select on %I to anon, authenticated', t);
    execute format('grant insert, update, delete on %I to authenticated', t);
    execute format('grant all on %I to service_role', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Avance de la fase III por lote
-- ------------------------------------------------------------
create or replace view v_avance_fase_iii as
select
  l.id as lote_id, l.codigo, l.certificacion, l.campania_id,
  exists(select 1 from envios x
         where x.lote_id = l.id and x.kg_pergamino_recibido is not null) as recepcion,
  exists(select 1 from limpiezas_equipo x where x.lote_siguiente_id = l.id) as limpieza,
  exists(select 1 from etapa_trillado x  where x.lote_id = l.id) as trillado,
  exists(select 1 from etapa_seleccion x where x.lote_id = l.id) as seleccion,
  exists(select 1 from etapa_empaque x   where x.lote_id = l.id) as empaque,
  exists(select 1 from despacho_lotes x  where x.lote_id = l.id) as exportacion
from lotes l;

grant select on v_avance_fase_iii to anon, authenticated;

-- ------------------------------------------------------------
-- Un destino mas para la sultana
--
-- En campo la pulpa tambien se entrega a las familias socias para sus
-- parcelas. No es venta ni compost de planta: es su propia salida.
-- ------------------------------------------------------------
alter type destino_sultana add value if not exists 'entrega_familias';

insert into parametros (clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor)
values ('sultana_precio_entrega_familias', '0', 'numero', 'sultana',
        'Valor estimado por kg de la pulpa entregada a las familias socias', 'Bs/kg', 0, 100)
on conflict (clave) do nothing;
