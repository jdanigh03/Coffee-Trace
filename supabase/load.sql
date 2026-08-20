-- ============================================================
-- Carga de los CSV generados por scripts/etl_excel.py
--
-- Ejecutar con psql (NO desde el editor web: usa \copy, que es del cliente):
--   psql "$SUPABASE_DB_URL" -v ruta=./db/out -f supabase/load.sql
--
-- Requiere que ya se hayan aplicado las migraciones y el seed.
-- ============================================================

\set ON_ERROR_STOP on
begin;

-- ------------------------------------------------------------
-- Staging: se carga en crudo y luego se resuelve contra los catalogos.
-- ------------------------------------------------------------

create temp table stg_personas (id uuid, nombre text) on commit drop;
create temp table stg_parcelas (id uuid, persona_id uuid, comunidad text) on commit drop;
create temp table stg_codigos (id uuid, codigo text, parcela_id uuid, persona_id uuid, nombre_excel text) on commit drop;
create temp table stg_cert (parcela_id uuid, campania_id smallint, estatus text, tipo text) on commit drop;
create temp table stg_lotes (id uuid, codigo text, campania_id smallint, certificacion text, correlativo smallint) on commit drop;
create temp table stg_entregas (
  campania_id smallint, fecha date, codigo_productor_id uuid, parcela_id uuid, persona_id uuid,
  kg_guinda_real numeric, precio_unitario_bs numeric, estatus_declarado text,
  lote_id uuid, revision text, revision_nota text
) on commit drop;
create temp table stg_envios (lote_id uuid, fecha_salida date, kg_pergamino_despachado numeric) on commit drop;

\copy stg_personas from :'ruta'/personas.csv           with (format csv, header, encoding 'UTF8')
\copy stg_parcelas from :'ruta'/parcelas.csv           with (format csv, header, encoding 'UTF8')
\copy stg_codigos  from :'ruta'/codigos_productor.csv  with (format csv, header, encoding 'UTF8')
\copy stg_cert     from :'ruta'/certificaciones.csv    with (format csv, header, encoding 'UTF8')
\copy stg_lotes    from :'ruta'/lotes.csv              with (format csv, header, encoding 'UTF8')
\copy stg_entregas from :'ruta'/entregas_acopio.csv    with (format csv, header, encoding 'UTF8')
\copy stg_envios   from :'ruta'/envios.csv             with (format csv, header, encoding 'UTF8')

-- ------------------------------------------------------------
-- Insercion en orden de dependencias
-- ------------------------------------------------------------

insert into personas (id, nombre)
select id, nombre from stg_personas
on conflict (id) do nothing;

-- La comunidad viene como texto; se resuelve contra el catalogo del seed.
insert into parcelas (id, persona_id, comunidad_id)
select p.id, p.persona_id, c.id
from stg_parcelas p
join comunidades c on c.nombre = p.comunidad
on conflict (id) do nothing;

insert into codigos_productor (id, codigo, parcela_id, persona_id, campania_id, nombre_excel)
select k.id, k.codigo, k.parcela_id, k.persona_id, 2025, k.nombre_excel
from stg_codigos k
join parcelas pa on pa.id = k.parcela_id
on conflict (id) do nothing;

insert into certificaciones (parcela_id, campania_id, estatus, tipo)
select s.parcela_id, s.campania_id, s.estatus::estatus_certificacion, s.tipo::tipo_certificacion
from stg_cert s
join parcelas pa on pa.id = s.parcela_id
on conflict (parcela_id, campania_id) do nothing;

insert into lotes (id, codigo, campania_id, certificacion, correlativo, estado)
select id, codigo, campania_id, certificacion::tipo_certificacion, correlativo,
       'exportado'::estado_lote
from stg_lotes
on conflict (codigo) do nothing;

-- El trigger de certificacion puede volver a marcar filas como observadas:
-- es lo esperado, refuerza lo que ya detecto el ETL.
insert into entregas_acopio (
  campania_id, fecha, codigo_productor_id, parcela_id, persona_id,
  kg_guinda_real, precio_unitario_bs, estatus_declarado, lote_id, revision, revision_nota)
select
  e.campania_id, e.fecha, e.codigo_productor_id, e.parcela_id, e.persona_id,
  e.kg_guinda_real, e.precio_unitario_bs,
  nullif(e.estatus_declarado, '')::estatus_certificacion,
  e.lote_id,
  e.revision::estado_revision,
  nullif(e.revision_nota, '')
from stg_entregas e;

insert into envios (lote_id, fecha_salida, kg_pergamino_despachado)
select lote_id, fecha_salida, kg_pergamino_despachado
from stg_envios;

-- Cache del total por lote (la fuente autoritativa es v_lote_totales).
update lotes l
set kg_guinda_total = t.kg_guinda_real
from v_lote_totales t
where t.lote_id = l.id;

-- Afiliacion inicial: todo el que entrego en 2025 estaba activo.
insert into afiliaciones (persona_id, campania_id, estado)
select distinct persona_id, 2025, 'activo'::estado_afiliacion
from entregas_acopio
where persona_id is not null
on conflict (persona_id, campania_id) do nothing;

commit;

-- ------------------------------------------------------------
-- Verificacion
-- ------------------------------------------------------------

select 'personas'   as tabla, count(*) from personas
union all select 'parcelas',          count(*) from parcelas
union all select 'codigos_productor', count(*) from codigos_productor
union all select 'certificaciones',   count(*) from certificaciones
union all select 'lotes',             count(*) from lotes
union all select 'entregas_acopio',   count(*) from entregas_acopio
union all select 'envios',            count(*) from envios
union all select 'afiliaciones',      count(*) from afiliaciones;

select revision, count(*) from entregas_acopio group by revision order by 2 desc;

select codigo, entregas, kg_guinda_real, entregas_observadas
from v_lote_totales order by codigo;
