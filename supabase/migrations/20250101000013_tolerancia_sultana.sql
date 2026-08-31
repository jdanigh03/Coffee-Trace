-- ============================================================
-- La alerta de sultana necesita una tolerancia proporcional
--
-- Estaba fijada en 1 kg absoluto. Con los kilos anotados jornada por jornada,
-- el redondeo de cada jornada deja un resto de 5 a 23 kg sobre lotes de 8.500
-- kg: la alerta saltaba en los 9 lotes aunque el destino estuviera acreditado
-- al 99,8 %. Una alerta que salta siempre deja de leerse.
--
-- Pasa a ser el 1 % de lo esperado, con un minimo de 1 kg para los lotes
-- pequenos.
-- ============================================================

insert into parametros (clave, valor, tipo, grupo, descripcion, unidad, min_valor, max_valor)
values ('sultana_tolerancia_pct', '1', 'numero', 'sultana',
        'Margen admitido entre la sultana esperada y la registrada, antes de alertar',
        '%', 0, 100)
on conflict (clave) do nothing;

create or replace view v_sultana_lote as
select
  l.id            as lote_id,
  l.codigo,
  l.certificacion,
  l.campania_id,
  t.kg_guinda_real,
  round(t.kg_guinda_real * coalesce(fn_parametro_num('sultana_factor'), 0.31), 2)
                  as kg_sultana_esperada,
  coalesce(sum(s.kg_sultana), 0)     as kg_sultana_registrada,
  coalesce(sum(s.numero_sacos), 0)::int as sacos,
  coalesce(sum(s.valor_estimado_bs), 0) as valor_estimado_bs,
  string_agg(distinct s.destino::text, ', ') as destinos,
  round(t.kg_guinda_real * coalesce(fn_parametro_num('sultana_factor'), 0.31), 2)
    - coalesce(sum(s.kg_sultana), 0) as kg_sin_registrar,
  -- Lo que hay que superar para que valga la pena avisar.
  greatest(1, round(t.kg_guinda_real
    * coalesce(fn_parametro_num('sultana_factor'), 0.31)
    * coalesce(fn_parametro_num('sultana_tolerancia_pct'), 1) / 100, 2))
                  as tolerancia_kg
from lotes l
join v_lote_totales t on t.lote_id = l.id
left join sultana s   on s.lote_id = l.id
group by l.id, l.codigo, l.certificacion, l.campania_id, t.kg_guinda_real;

comment on view v_sultana_lote is
  'kg_sin_registrar es el subproducto cuyo destino no esta acreditado. Se '
  'compara contra tolerancia_kg: por debajo es redondeo de las jornadas, por '
  'encima es pulpa que salio de la planta sin quedar documentada.';

grant select on v_sultana_lote to anon, authenticated;

-- Y la alerta usa esa tolerancia en vez del kilo fijo.
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
  select 'sultana', 'media', 'Sultana sin destino documentado', count(*)::int,
         'lotes donde la pulpa registrada no llega a lo que salio del despulpado',
         '/procesos/sultana'
  from v_sultana_lote where kg_sin_registrar > tolerancia_kg having count(*) > 0
) a;

grant select on v_alertas to anon, authenticated;
