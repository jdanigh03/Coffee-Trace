-- ============================================================
-- Segunda pasada: procedencia del beneficio + cola de blockchain
-- ============================================================

-- ------------------------------------------------------------
-- Procedencia de beneficio_productor
-- ------------------------------------------------------------
-- Los datos por productor salen de dos archivos con semantica distinta:
--   SALDO DE ALMACENES     -> lo que queda en bodega, sin vender
--   TRAZABILIDAD DE VENTA  -> lo que se vendio y a quien
-- No son duplicados: en OR-05 la particion es exacta (26.549 vendido +
-- 3.651 en stock = 30.200, el lote entero). Pero en TR-01 los dos archivos
-- se solapan y no reconcilian con el acopio, asi que hay que poder decir de
-- que archivo vino cada fila.

create type fuente_beneficio as enum ('saldo_almacen', 'trazabilidad_venta');

alter table beneficio_productor
  add column fuente        fuente_beneficio,
  add column nombre_excel  varchar(120),
  add column revision      estado_revision not null default 'ok',
  add column revision_nota text;

comment on column beneficio_productor.nombre_excel is
  'Nombre tal cual figura en el Excel. En estos archivos los productores '
  'aparecen solo por nombre escrito a mano, sin codigo: es la unica clave '
  'de emparejamiento disponible.';
comment on column beneficio_productor.revision is
  'observado = el desglose no reconcilia con el acopio, o el nombre no se '
  'pudo emparejar contra el padron.';

create index on beneficio_productor (revision) where revision <> 'ok';
create index on beneficio_productor (fuente);

-- Reconciliacion beneficio vs acopio, por lote.
create or replace view v_reconciliacion_lote as
select
  l.codigo,
  l.certificacion,
  t.kg_guinda_real                              as kg_acopio,
  coalesce(b.kg_beneficio, 0)                   as kg_beneficio,
  coalesce(b.kg_beneficio, 0) - t.kg_guinda_real as diferencia,
  case
    when b.kg_beneficio is null then 'sin beneficio cargado'
    when t.kg_guinda_real = 0 then 'sin acopio cargado'
    when abs(coalesce(b.kg_beneficio,0) - t.kg_guinda_real) < 0.5 then 'cuadra'
    else 'no cuadra'
  end as estado
from lotes l
left join v_lote_totales t on t.lote_id = l.id
left join lateral (
  select sum(bp.kg_guinda) as kg_beneficio
  from beneficio_seco bs
  join beneficio_productor bp on bp.beneficio_id = bs.id
  where bs.lote_id = l.id
) b on true;

comment on view v_reconciliacion_lote is
  'Compara los kg que el acopio dice que entraron al lote contra los que el '
  'desglose por productor reparte. Donde no cuadra, el certificado de origen '
  'se apoya en numeros que no coinciden entre archivos.';

-- ------------------------------------------------------------
-- Cola de sellado en blockchain
-- ------------------------------------------------------------
-- blockchain_registros es append-only con UPDATE y DELETE revocados, asi que
-- no puede servir de cola: una cola necesita pendiente -> enviado ->
-- confirmado. En vez de aflojar la inmutabilidad, se separan las dos cosas.

create type estado_outbox as enum ('pendiente', 'enviado', 'confirmado', 'error');

create table blockchain_outbox (
  id               bigserial primary key,
  tabla_origen     varchar(40) not null,
  registro_id      varchar(64) not null,
  lote_id          uuid references lotes(id),
  fase             varchar(20),
  payload_canonico text not null,
  hash_sha256      char(64) not null,
  estado           estado_outbox not null default 'pendiente',
  intentos         smallint not null default 0,
  ultimo_error     text,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

comment on table blockchain_outbox is
  'Cola mutable. La fase y su encolado se escriben en la misma transaccion de '
  'Postgres; el worker reintenta contra Fabric. Nunca se llama a Fabric dentro '
  'de la transaccion.';
comment on column blockchain_outbox.payload_canonico is
  'El texto exacto que se hasheo. Sin el no se puede reverificar meses despues '
  'si la logica de serializacion cambia.';

create index on blockchain_outbox (estado) where estado <> 'confirmado';
create index on blockchain_outbox (lote_id);

alter table blockchain_outbox enable row level security;

grant select on blockchain_outbox to anon, authenticated;
grant insert, update, delete on blockchain_outbox to authenticated;
grant all on blockchain_outbox to service_role;

create policy "lectura_autenticados" on blockchain_outbox
  for select to authenticated using (true);

create policy "escritura_outbox" on blockchain_outbox
  for all to authenticated
  using (auth_rol() is not null)
  with check (auth_rol() is not null);

-- Solo se encola lo que paso revision: sellar un dato que sabemos que esta
-- mal lo vuelve inmutablemente mal.
create or replace function fn_outbox_solo_revisado()
returns trigger
language plpgsql
as $$
declare v_revision estado_revision;
begin
  if new.tabla_origen = 'entregas_acopio' then
    select revision into v_revision from entregas_acopio where id = new.registro_id::bigint;
    if v_revision is distinct from 'ok' then
      raise exception 'No se puede encolar la entrega % : revision = %', new.registro_id, v_revision;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_outbox_solo_revisado
  before insert on blockchain_outbox
  for each row execute function fn_outbox_solo_revisado();
