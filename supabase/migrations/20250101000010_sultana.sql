-- ============================================================
-- Sultana (pulpa del cafe)
--
-- Sale del despulpado como subproducto: el 31% de la guinda. Hoy no se
-- registra a donde va, y sin ese dato el balance de masa de la Fase II no
-- cierra: de 45.230 kg de guinda, 14.025 kg desaparecen del sistema.
--
-- Se le da tabla propia y no una columna dentro de despulpado porque tiene
-- su propio destino, sus propios sacos y su propio valor economico.
-- ============================================================

create type destino_sultana as enum ('combustible', 'venta', 'compost');

create table sultana (
  id             uuid primary key default gen_random_uuid(),
  lote_id        uuid not null references lotes(id) on delete cascade,
  fecha          date not null default current_date,
  kg_sultana     decimal(12,2) not null check (kg_sultana > 0),
  destino        destino_sultana not null,
  numero_sacos   integer check (numero_sacos > 0),
  valor_estimado_bs decimal(12,2),
  responsable    varchar(120),
  observaciones  text,
  creado_en      timestamptz not null default now()
);

comment on table sultana is
  'Destino de la pulpa del cafe. Cerrar este dato es lo que permite que el '
  'balance de masa de la fase cuadre.';
comment on column sultana.kg_sultana is
  'Calculado como kg_guinda_total x 0.31. Se guarda el valor para conservar '
  'el dato historico aunque el factor cambie en campanias futuras.';
comment on column sultana.valor_estimado_bs is
  'Estimacion segun el precio por kg del destino elegido, tomado de parametros.';

create index on sultana (lote_id);
create index on sultana (destino);

alter table sultana enable row level security;

create policy "lectura_autenticados" on sultana
  for select to authenticated using (true);

create policy "escritura_planta" on sultana
  for all to authenticated
  using (tiene_rol('admin', 'encargado_maquinas', 'operador_acopio'))
  with check (tiene_rol('admin', 'encargado_maquinas', 'operador_acopio'));

grant select on sultana to anon, authenticated;
grant insert, update, delete on sultana to authenticated;

-- ------------------------------------------------------------
-- Precio por kg segun destino, para estimar el valor
-- ------------------------------------------------------------
insert into parametros (clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor) values
  ('sultana_factor',            '0.31', 'numero', 'sultana',
   'Proporcion de sultana sobre el cafe guinda', '', 0, 1),
  ('sultana_precio_combustible','0',    'numero', 'sultana',
   'Valor estimado por kg si se usa como combustible para hornos', 'Bs/kg', 0, 100),
  ('sultana_precio_venta',      '0',    'numero', 'sultana',
   'Precio por kg si se vende', 'Bs/kg', 0, 100),
  ('sultana_precio_compost',    '0',    'numero', 'sultana',
   'Valor estimado por kg si se usa como compost', 'Bs/kg', 0, 100)
on conflict (clave) do nothing;

-- ------------------------------------------------------------
-- Cuanta sultana corresponde a cada lote y cuanta se registro
-- ------------------------------------------------------------
create or replace view v_sultana_lote as
select
  l.id            as lote_id,
  l.codigo,
  l.certificacion,
  l.campania_id,
  t.kg_guinda_real,
  -- Lo que deberia haber salido, segun el factor de la campania.
  round(t.kg_guinda_real * coalesce(fn_parametro_num('sultana_factor'), 0.31), 2)
                  as kg_sultana_esperada,
  coalesce(sum(s.kg_sultana), 0)     as kg_sultana_registrada,
  coalesce(sum(s.numero_sacos), 0)::int as sacos,
  coalesce(sum(s.valor_estimado_bs), 0) as valor_estimado_bs,
  string_agg(distinct s.destino::text, ', ') as destinos,
  round(t.kg_guinda_real * coalesce(fn_parametro_num('sultana_factor'), 0.31), 2)
    - coalesce(sum(s.kg_sultana), 0) as kg_sin_registrar
from lotes l
join v_lote_totales t on t.lote_id = l.id
left join sultana s   on s.lote_id = l.id
group by l.id, l.codigo, l.certificacion, l.campania_id, t.kg_guinda_real;

comment on view v_sultana_lote is
  'kg_sin_registrar es el subproducto cuyo destino no esta acreditado. '
  'Mientras sea mayor que cero, el balance de masa de la fase no cierra.';

grant select on v_sultana_lote to anon, authenticated;

-- ------------------------------------------------------------
-- Alerta: sultana sin destino documentado
-- ------------------------------------------------------------
create or replace view v_alertas as
select * from (
  select 'revision'::text tipo, 'alta'::text severidad,
         'Entregas pendientes de revision'::text titulo, count(*)::int cantidad,
         'entregas con datos contradictorios que la cola de blockchain rechaza'::text detalle,
         '/consultas'::text ruta
  from entregas_acopio where revision <> 'ok' having count(*) > 0
  union all
  select 'reconciliacion', 'alta', 'Lotes que no cuadran', count(*)::int,
         'el beneficio por productor no coincide con los kilos acopiados', '/reportes'
  from v_reconciliacion_lote where estado = 'no cuadra' having count(*) > 0
  union all
  select 'tnd', 'critica', 'Producto sin destino documentado', count(*)::int,
         'categorias con TND sobre el umbral configurado', '/'
  from v_indicadores_exportacion
  where tnd is not null and tnd > coalesce(fn_parametro_num('tnd_umbral_alerta'), 5)
  having count(*) > 0
  union all
  select 'inconsistencia', 'critica', 'Volumenes incoherentes', count(*)::int,
         'lo exportado mas el saldo supera lo producido en esa categoria', '/'
  from v_indicadores_exportacion where inconsistente having count(*) > 0
  union all
  select 'blockchain_error', 'critica', 'Errores al sellar en blockchain', count(*)::int,
         'registros que fallaron al enviarse a Fabric', '/verificacion'
  from blockchain_outbox where estado = 'error' having count(*) > 0
  union all
  select 'blockchain_pendiente', 'media', 'Registros esperando sello', count(*)::int,
         'en cola: se sellaran cuando la red Fabric este operativa', '/verificacion'
  from blockchain_outbox where estado = 'pendiente' having count(*) > 0
  union all
  select 'envio_sin_recepcion', 'media', 'Envios sin confirmar recepcion', count(*)::int,
         'salieron de Taipiplaya pero no se registro el peso recibido en La Paz',
         '/procesos/recepcion'
  from envios where kg_pergamino_recibido is null having count(*) > 0
  union all
  select 'merma', 'alta', 'Merma de transporte sobre lo admitido', count(*)::int,
         'diferencia entre peso despachado y recibido por encima de la tolerancia',
         '/procesos/recepcion'
  from envios
  where kg_pergamino_recibido is not null and kg_pergamino_despachado > 0
    and (diferencia_kg / kg_pergamino_despachado * 100)
        > coalesce(fn_parametro_num('merma_transporte_max'), 2)
  having count(*) > 0
  union all
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
  select 'sin_sellar', 'media', 'Lotes exportados sin sello en blockchain', count(*)::int,
         'completaron la cadena pero no tienen ningun registro sellado', '/verificacion'
  from lotes l
  where l.estado = 'exportado'
    and not exists (select 1 from blockchain_registros b where b.lote_id = l.id)
  having count(*) > 0
  union all
  -- Nueva: el 31% de la guinda que sale como pulpa y no tiene destino anotado.
  select 'sultana', 'media', 'Sultana sin destino documentado', count(*)::int,
         'lotes donde no se registro a donde fue la pulpa del cafe',
         '/procesos/sultana'
  from v_sultana_lote where kg_sin_registrar > 1 having count(*) > 0
) a;

grant select on v_alertas to anon, authenticated;
