-- ============================================================
-- Fase II, etapa 8: Despacho hacia El Alto
--
-- Esta etapa genera la NOTA DE REMISION oficial. Se amplia `envios` en vez de
-- crear una tabla nueva: el despacho y el envio son el mismo hecho fisico, y
-- separarlos obligaria a mantener dos registros del mismo camion.
-- ============================================================

-- Correlativo de la nota de remision. Una secuencia garantiza que no se
-- repita aunque dos personas despachen al mismo tiempo.
create sequence if not exists nota_remision_seq;

alter table envios
  add column if not exists numero_bolsas integer check (numero_bolsas > 0),
  add column if not exists tipo_vehiculo varchar(40),
  add column if not exists temperatura_vehiculo varchar(40),
  add column if not exists documentos_verificados boolean not null default false,
  add column if not exists responsable_transportista varchar(120),
  add column if not exists remitente varchar(120)
    default 'ASOCAFE Taipiplaya',
  add column if not exists destinatario varchar(120)
    default 'ASOCAFE Beneficio Seco El Alto',
  add column if not exists direccion_destino varchar(200)
    default 'Calle Rio Mapiri 1115, El Alto';

-- La NR se numera sola: NR-2026-0001, NR-2026-0002...
alter table envios
  alter column nota_remision set default
    'NR-' || to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('nota_remision_seq')::text, 4, '0');

comment on column envios.nota_remision is
  'Numero oficial de la nota de remision. Se genera solo con una secuencia; '
  'no se escribe a mano para que no se repita ni se salte.';
comment on column envios.numero_bolsas is
  'Cantidad de bolsas despachadas. Permite cotejar el conteo fisico contra el '
  'peso al recibir en El Alto.';
comment on column envios.documentos_verificados is
  'El conductor presento y se verificaron sus documentos antes de salir.';

-- El lote SIEMPRE debe quedar identificado en la nota de remision: es lo que
-- conecta el papel del transportista con la trazabilidad del sistema.
create or replace view v_notas_remision as
select
  e.id,
  e.nota_remision,
  l.codigo            as lote,
  l.certificacion,
  e.remitente,
  e.destinatario,
  e.direccion_destino,
  e.fecha_salida,
  e.kg_pergamino_despachado as peso_salida,
  e.numero_bolsas,
  e.vehiculo,
  e.tipo_vehiculo,
  e.conductor,
  e.documentos_verificados,
  e.temperatura_vehiculo,
  e.responsable             as responsable_planta,
  e.responsable_transportista,
  e.kg_pergamino_recibido,
  e.diferencia_kg,
  (e.kg_pergamino_recibido is null) as pendiente_recepcion
from envios e
join lotes l on l.id = e.lote_id
order by e.fecha_salida desc;

comment on view v_notas_remision is
  'Nota de remision lista para imprimir o exportar, con el lote identificado.';

grant select on v_notas_remision to anon, authenticated;
grant usage, select on sequence nota_remision_seq to authenticated, service_role;
