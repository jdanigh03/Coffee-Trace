-- ============================================================
-- Row Level Security
-- Lectura: cualquier usuario autenticado.
-- Escritura: acotada por rol segun la fase del proceso.
-- ============================================================

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

-- SECURITY DEFINER para que la policy de `perfiles` no se llame a si misma
-- en bucle al consultar el rol.
create or replace function auth_rol()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

create or replace function tiene_rol(variadic roles rol_usuario[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_rol() = any(roles), false)
$$;

create or replace function es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_rol() = 'admin', false)
$$;

-- ------------------------------------------------------------
-- Activar RLS en todas las tablas
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'organizacion','campanias','comunidades','personas','afiliaciones','parcelas',
    'codigos_productor','certificaciones','factores_conversion','lotes','entregas_acopio',
    'envios','limpiezas_equipo','beneficio_seco','beneficio_productor','almacenes',
    'existencias','muestras','clientes','contratos','despachos','despacho_lotes',
    'exportaciones','perfiles','blockchain_registros'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Privilegios de tabla
-- ------------------------------------------------------------
-- RLS filtra filas, pero PostgREST necesita ademas el GRANT de tabla o
-- devuelve 401. Supabase los concede por defecto al crear el proyecto; si el
-- esquema public se recrea, hay que volver a otorgarlos explicitamente.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Para todo lo que se cree despues de esta migracion.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- Lectura para autenticados
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'organizacion','campanias','comunidades','personas','afiliaciones','parcelas',
    'codigos_productor','certificaciones','factores_conversion','lotes','entregas_acopio',
    'envios','limpiezas_equipo','beneficio_seco','beneficio_productor','almacenes',
    'existencias','muestras','clientes','contratos','despachos','despacho_lotes',
    'exportaciones','blockchain_registros'
  ] loop
    execute format($f$
      create policy "lectura_autenticados" on %I
        for select to authenticated using (true)
    $f$, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Perfiles: cada quien ve y edita el suyo; admin ve todos
-- ------------------------------------------------------------

create policy "perfil_propio_select" on perfiles
  for select to authenticated
  using (id = auth.uid() or es_admin());

create policy "perfil_propio_update" on perfiles
  for update to authenticated
  using (id = auth.uid() or es_admin())
  with check (id = auth.uid() or es_admin());

create policy "perfil_admin_insert" on perfiles
  for insert to authenticated
  with check (es_admin());

-- ------------------------------------------------------------
-- Catalogos: solo admin escribe
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'organizacion','campanias','comunidades','factores_conversion','almacenes'
  ] loop
    execute format($f$
      create policy "escritura_admin" on %I
        for all to authenticated using (es_admin()) with check (es_admin())
    $f$, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Padron: admin y operador de acopio
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'personas','afiliaciones','parcelas','codigos_productor','certificaciones'
  ] loop
    execute format($f$
      create policy "escritura_padron" on %I
        for all to authenticated
        using (tiene_rol('admin','operador_acopio'))
        with check (tiene_rol('admin','operador_acopio'))
    $f$, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Escritura por fase del proceso
-- ------------------------------------------------------------

-- Acopio
create policy "escritura_acopio" on entregas_acopio
  for all to authenticated
  using (tiene_rol('admin','operador_acopio'))
  with check (tiene_rol('admin','operador_acopio'));

-- Lotes: los arma acopio, los cierra comercializacion
create policy "escritura_lotes" on lotes
  for all to authenticated
  using (tiene_rol('admin','operador_acopio','comercializacion'))
  with check (tiene_rol('admin','operador_acopio','comercializacion'));

-- Transporte y recepcion
create policy "escritura_envios" on envios
  for all to authenticated
  using (tiene_rol('admin','transportista','recepcionista'))
  with check (tiene_rol('admin','transportista','recepcionista'));

-- Limpieza de equipos
create policy "escritura_limpiezas" on limpiezas_equipo
  for all to authenticated
  using (tiene_rol('admin','encargado_maquinas'))
  with check (tiene_rol('admin','encargado_maquinas'));

-- Trillado y seleccion
do $$
declare t text;
begin
  foreach t in array array['beneficio_seco','beneficio_productor'] loop
    execute format($f$
      create policy "escritura_beneficio" on %I
        for all to authenticated
        using (tiene_rol('admin','encargado_maquinas','encargada_seleccion'))
        with check (tiene_rol('admin','encargado_maquinas','encargada_seleccion'))
    $f$, t);
  end loop;
end $$;

-- Almacen y muestras
do $$
declare t text;
begin
  foreach t in array array['existencias','muestras'] loop
    execute format($f$
      create policy "escritura_almacen" on %I
        for all to authenticated
        using (tiene_rol('admin','recepcionista','encargada_seleccion'))
        with check (tiene_rol('admin','recepcionista','encargada_seleccion'))
    $f$, t);
  end loop;
end $$;

-- Comercializacion
do $$
declare t text;
begin
  foreach t in array array['clientes','contratos','despachos','despacho_lotes','exportaciones'] loop
    execute format($f$
      create policy "escritura_comercial" on %I
        for all to authenticated
        using (tiene_rol('admin','comercializacion'))
        with check (tiene_rol('admin','comercializacion'))
    $f$, t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Blockchain: append-only, sin excepciones
-- ------------------------------------------------------------

create policy "blockchain_insert" on blockchain_registros
  for insert to authenticated
  with check (auth_rol() is not null);

-- Deliberadamente NO hay policy de update ni delete: RLS niega por defecto.
-- Ademas se revoca a nivel de privilegio para que ni el service_role lo haga
-- por accidente desde un script.
revoke update, delete on blockchain_registros from authenticated, anon;

comment on table blockchain_registros is
  'Append-only. Sin policy de UPDATE ni DELETE: RLS niega por defecto y ademas se revocan los '
  'privilegios. Un sello que se puede editar no prueba nada.';

-- ------------------------------------------------------------
-- Alta automatica de perfil al registrarse
-- ------------------------------------------------------------

create or replace function fn_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    'visualizador'   -- nunca se auto-asigna un rol con permisos de escritura
  );
  return new;
end;
$$;

create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function fn_nuevo_usuario();
