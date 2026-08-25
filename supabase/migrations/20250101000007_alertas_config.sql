-- ============================================================
-- Alertas operativas y parametros de configuracion
-- ============================================================

-- ------------------------------------------------------------
-- Parametros editables desde la pantalla de configuracion
-- ------------------------------------------------------------
-- Las tolerancias estaban repartidas por el codigo del frontend. Aqui quedan
-- en un solo lugar, versionadas y auditables, para que cambiar un rango no
-- exija tocar y redesplegar la aplicacion.

create table if not exists parametros (
  clave        varchar(60) primary key,
  valor        text        not null,
  tipo         varchar(12) not null default 'texto'
               check (tipo in ('texto', 'numero', 'booleano')),
  grupo        varchar(40) not null default 'general',
  descripcion  text,
  unidad       varchar(20),
  min_valor    decimal(12,4),
  max_valor    decimal(12,4),
  actualizado_en timestamptz not null default now(),
  actualizado_por uuid references perfiles(id)
);

comment on table parametros is
  'Configuracion del sistema. Los factores de conversion NO viven aqui: '
  'estan en factores_conversion, versionados por campania.';

insert into parametros (clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor) values
  ('humedad_min',            '10',   'numero',  'calidad',   'Humedad minima aceptable del pergamino seco', '%', 0, 30),
  ('humedad_max',            '12.5', 'numero',  'calidad',   'Humedad maxima aceptable del pergamino seco', '%', 0, 30),
  ('temp_almacen_min',       '15',   'numero',  'calidad',   'Temperatura minima de almacen', 'C', 0, 40),
  ('temp_almacen_max',       '22',   'numero',  'calidad',   'Temperatura maxima de almacen', 'C', 0, 40),
  ('temp_fermentacion_min',  '22',   'numero',  'calidad',   'Temperatura minima de fermentacion', 'C', 0, 40),
  ('temp_fermentacion_max',  '28',   'numero',  'calidad',   'Temperatura maxima de fermentacion', 'C', 0, 40),
  ('merma_transporte_max',   '2',    'numero',  'tolerancia','Merma maxima admitida en transporte', '%', 0, 20),
  ('balance_masa_tolerancia','1',    'numero',  'tolerancia','Descuadre maximo admitido en el balance de masa', '%', 0, 10),
  ('tnd_umbral_alerta',      '5',    'numero',  'tolerancia','TND a partir del cual se genera alerta', '%', 0, 100),
  ('sellar_solo_revisado',   'true', 'booleano','blockchain','Impedir que se selle un registro observado', null, null, null)
on conflict (clave) do nothing;

create or replace function fn_parametro_num(p_clave text)
returns numeric
language sql
stable
as $$
  select valor::numeric from parametros where clave = p_clave and tipo = 'numero'
$$;

-- ------------------------------------------------------------
-- Alertas: se calculan de los datos, no se almacenan
-- ------------------------------------------------------------
-- Una tabla de notificaciones se desincroniza en cuanto alguien corrige el
-- dato de origen. Como vista, la alerta desaparece sola al resolverse.

create or replace view v_alertas as

-- Registros que no pueden sellarse en blockchain hasta depurarse
select
  'revision'::text                          as tipo,
  'alta'::text                              as severidad,
  'Entregas pendientes de revision'::text   as titulo,
  count(*)::int                             as cantidad,
  'entregas con datos contradictorios que la cola de blockchain rechaza'::text as detalle,
  '/consultas'::text                        as ruta
from entregas_acopio where revision <> 'ok'
having count(*) > 0

union all

-- Lotes donde el desglose por productor no coincide con el acopio
select 'reconciliacion', 'alta', 'Lotes que no cuadran', count(*)::int,
       'el beneficio por productor no coincide con los kilos acopiados',
       '/reportes'
from v_reconciliacion_lote where estado = 'no cuadra'
having count(*) > 0

union all

-- Producto cuya disposicion final no puede acreditarse
select 'tnd', 'critica',
       'Producto sin destino documentado', count(*)::int,
       'categorias con TND sobre el umbral configurado',
       '/'
from v_indicadores_exportacion
where tnd is not null and tnd > coalesce(fn_parametro_num('tnd_umbral_alerta'), 5)
having count(*) > 0

union all

-- Incoherencia: exportado + almacenado supera lo producido
select 'inconsistencia', 'critica',
       'Volumenes incoherentes', count(*)::int,
       'lo exportado mas el saldo supera lo producido en esa categoria',
       '/'
from v_indicadores_exportacion where inconsistente
having count(*) > 0

union all

-- Cola de sellado atascada
select 'blockchain_error', 'critica', 'Errores al sellar en blockchain', count(*)::int,
       'registros que fallaron al enviarse a Fabric', '/verificacion'
from blockchain_outbox where estado = 'error'
having count(*) > 0

union all

select 'blockchain_pendiente', 'media', 'Registros esperando sello', count(*)::int,
       'en cola: se sellaran cuando la red Fabric este operativa', '/verificacion'
from blockchain_outbox where estado = 'pendiente'
having count(*) > 0

union all

-- Envios despachados que nunca se confirmaron como recibidos
select 'envio_sin_recepcion', 'media', 'Envios sin confirmar recepcion', count(*)::int,
       'salieron de Taipiplaya pero no se registro el peso recibido en La Paz',
       '/procesos/recepcion'
from envios where kg_pergamino_recibido is null
having count(*) > 0

union all

-- Merma de transporte sobre la tolerancia
select 'merma', 'alta', 'Merma de transporte sobre lo admitido', count(*)::int,
       'diferencia entre peso despachado y recibido por encima de la tolerancia',
       '/procesos/recepcion'
from envios
where kg_pergamino_recibido is not null
  and kg_pergamino_despachado > 0
  and (diferencia_kg / kg_pergamino_despachado * 100)
      > coalesce(fn_parametro_num('merma_transporte_max'), 2)
having count(*) > 0

union all

-- Humedad de almacen fuera del rango configurado
select 'humedad', 'alta', 'Humedad de almacen fuera de rango', count(*)::int,
       'existencias con humedad fuera del rango configurado', '/procesos/almacenamiento'
from existencias
where humedad is not null
  and (humedad < coalesce(fn_parametro_num('humedad_min'), 10)
    or humedad > coalesce(fn_parametro_num('humedad_max'), 12.5))
having count(*) > 0

union all

select 'temperatura', 'media', 'Temperatura de almacen fuera de rango', count(*)::int,
       'existencias con temperatura fuera del rango configurado', '/procesos/almacenamiento'
from existencias
where temperatura is not null
  and (temperatura < coalesce(fn_parametro_num('temp_almacen_min'), 15)
    or temperatura > coalesce(fn_parametro_num('temp_almacen_max'), 22))
having count(*) > 0

union all

-- Lotes ya exportados sin ningun sello en la cadena
select 'sin_sellar', 'media', 'Lotes exportados sin sello en blockchain', count(*)::int,
       'completaron la cadena pero no tienen ningun registro sellado', '/verificacion'
from lotes l
where l.estado = 'exportado'
  and not exists (select 1 from blockchain_registros b where b.lote_id = l.id)
having count(*) > 0;

comment on view v_alertas is
  'Alertas derivadas de los datos, no almacenadas: al corregir el origen la '
  'alerta desaparece sola. Una tabla de notificaciones se desincronizaria.';

grant select on v_alertas to anon, authenticated;
grant select on parametros to anon, authenticated;
grant insert, update on parametros to authenticated;

alter table parametros enable row level security;

create policy "lectura_autenticados" on parametros
  for select to authenticated using (true);

create policy "escritura_admin" on parametros
  for all to authenticated using (es_admin()) with check (es_admin());
