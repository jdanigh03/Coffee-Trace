-- ============================================================
-- Recepcion en la planta de El Alto
--
-- La recepcion no es un envio nuevo: es el mismo camion llegando. Por eso
-- amplia `envios` en vez de crear una tabla, igual que se hizo con el despacho.
--
-- Hasta ahora solo se guardaba el peso recibido. Lo que el control de llegada
-- necesita acreditar ademas es el conteo de bolsas, la humedad y temperatura
-- del grano al arribo, quien recibio y si la nota de remision presentada
-- coincide con la carga: sin eso, una merma fuera de tolerancia no tiene
-- ningun dato al lado que explique de donde salio.
-- ============================================================

alter table envios
  add column bolsas_recibidas         integer check (bolsas_recibidas >= 0),
  add column humedad_recepcion        decimal(5,2)
    check (humedad_recepcion between 0 and 100),
  add column temperatura_recepcion_c  decimal(5,2),
  add column recepcionista            varchar(120),
  add column estado_recepcion         varchar(20)
    check (estado_recepcion in ('conforme', 'observado', 'rechazado')),
  add column nota_remision_verificada boolean not null default false;

comment on column envios.bolsas_recibidas is
  'Conteo fisico al descargar. Comparado con numero_bolsas delata una perdida '
  'de bultos que el peso solo no distingue de la merma por humedad.';
comment on column envios.nota_remision_verificada is
  'El recepcionista confirma que el documento presentado coincide con la carga. '
  'Es lo que conecta el papel del transportista con el registro del sistema.';
comment on column envios.estado_recepcion is
  'conforme / observado / rechazado. Un lote observado sigue su curso pero '
  'queda marcado para revision antes de sellarse.';

-- ------------------------------------------------------------
-- Lo que falta recibir, para la pantalla de recepcion
-- ------------------------------------------------------------
create or replace view v_recepciones as
select
  en.id,
  l.codigo            as lote,
  l.certificacion,
  l.campania_id,
  en.fecha_salida,
  en.fecha_llegada,
  en.nota_remision,
  en.vehiculo,
  en.conductor,
  en.responsable_transportista,
  en.numero_bolsas,
  en.kg_pergamino_despachado,
  en.kg_pergamino_recibido,
  en.diferencia_kg,
  -- Merma en porcentaje del despacho: el umbral se configura en parametros.
  case when en.kg_pergamino_recibido is not null and en.kg_pergamino_despachado > 0
       then round(en.diferencia_kg / en.kg_pergamino_despachado * 100, 3)
  end                 as merma_pct,
  en.bolsas_recibidas,
  en.humedad_recepcion,
  en.temperatura_recepcion_c,
  en.recepcionista,
  en.estado_recepcion,
  en.nota_remision_verificada,
  en.observaciones,
  (en.kg_pergamino_recibido is null) as pendiente,
  -- Si ya tiene sello, la pantalla no debe volver a encolarlo.
  exists (select 1 from blockchain_outbox o
           where o.tabla_origen = 'envios' and o.registro_id = en.id::text) as encolado,
  (select o.estado::text from blockchain_outbox o
    where o.tabla_origen = 'envios' and o.registro_id = en.id::text
    order by o.creado_en desc limit 1)                                      as estado_sello,
  (select o.hash_sha256 from blockchain_outbox o
    where o.tabla_origen = 'envios' and o.registro_id = en.id::text
    order by o.creado_en desc limit 1)                                      as hash_sello
from envios en
join lotes l on l.id = en.lote_id
order by en.fecha_salida desc;

comment on view v_recepciones is
  'Una fila por envio con lo despachado, lo recibido y el estado de su sello. '
  'Es la lista de trabajo de la planta de El Alto.';

grant select on v_recepciones to anon, authenticated;
