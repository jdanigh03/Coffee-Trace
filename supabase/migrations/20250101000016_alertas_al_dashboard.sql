-- ============================================================
-- Las alertas del dashboard ya no apuntan a '/'
--
-- '/' es ahora la portada publica. Dos alertas (TND alto y volumenes
-- incoherentes) enviaban ahi al operador, que aterrizaba en la pagina del
-- comprador en vez de en el tablero. Pasan a '/dashboard'.
-- ============================================================

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
         'categorias con TND sobre el umbral configurado', '/dashboard'
  from v_indicadores_exportacion
  where tnd is not null and tnd > coalesce(fn_parametro_num('tnd_umbral_alerta'), 5)
  having count(*) > 0
  union all
  select 'inconsistencia', 'critica', 'Volumenes incoherentes', count(*)::int,
         'lo exportado mas el saldo supera lo producido en esa categoria', '/dashboard'
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
