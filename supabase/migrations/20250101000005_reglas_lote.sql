-- ============================================================
-- Reglas de negocio sobre lotes
--
-- Las mismas que blockchain/MODELO.md pide al chaincode. Aplicarlas tambien
-- en Postgres deja el sistema correcto antes de que Fabric exista, y evita
-- que un UPDATE suelto rompa lo que la cadena despues dara por cierto.
-- ============================================================

-- ------------------------------------------------------------
-- 1. La certificacion de un lote es inmutable
-- ------------------------------------------------------------
-- Un lote organico no puede volverse de transicion ni al reves. Si se creo
-- mal, se anula y se crea otro: cambiarlo silenciosamente invalidaria los
-- certificados de origen ya emitidos.

create or replace function fn_lote_certificacion_inmutable()
returns trigger
language plpgsql
as $$
begin
  if new.certificacion is distinct from old.certificacion then
    raise exception
      'La certificacion del lote % es inmutable (% -> %). Anule el lote y cree uno nuevo.',
      old.codigo, old.certificacion, new.certificacion
      using errcode = 'check_violation';
  end if;
  if new.campania_id is distinct from old.campania_id then
    raise exception 'La campania del lote % es inmutable (% -> %)',
      old.codigo, old.campania_id, new.campania_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_lote_certificacion_inmutable
  before update on lotes
  for each row execute function fn_lote_certificacion_inmutable();

-- ------------------------------------------------------------
-- 2. El estado del lote no retrocede
-- ------------------------------------------------------------
-- El orden es el del flujo real; volver atras borraria trazabilidad ya sellada.

create or replace function fn_orden_estado_lote()
returns trigger
language plpgsql
as $$
declare
  orden constant estado_lote[] := array[
    'acopio','en_transito','recibido','trillado','seleccionado',
    'almacenado','despachado','exportado'
  ]::estado_lote[];
  i_old int;
  i_new int;
begin
  if new.estado = old.estado then
    return new;
  end if;
  i_old := array_position(orden, old.estado);
  i_new := array_position(orden, new.estado);
  if i_new < i_old then
    raise exception 'El lote % no puede retroceder de % a %',
      old.codigo, old.estado, new.estado
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger trg_orden_estado_lote
  before update on lotes
  for each row execute function fn_orden_estado_lote();

comment on table lotes is
  'Organico y transicion van SIEMPRE en lotes separados. La certificacion y la '
  'campania son inmutables una vez creado el lote, y el estado solo avanza: '
  'ambas reglas las aplican triggers, no solo la aplicacion.';
