-- ============================================================
-- CoffeeTrace - Esquema base
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

create type estatus_certificacion as enum ('E', 'T1', 'T2', 'T3');
create type tipo_certificacion    as enum ('organico', 'transicion');
create type estado_revision       as enum ('ok', 'observado', 'corregido');
create type estado_afiliacion     as enum ('activo', 'retirado', 'suspendido');
create type estado_lote           as enum ('acopio', 'en_transito', 'recibido', 'trillado',
                                           'seleccionado', 'almacenado', 'despachado', 'exportado');
create type tipo_producto         as enum ('guinda', 'mote', 'pergamino', 'verde_sin_seleccionar',
                                           'verde_oro', 'caracol', 'descarte');
create type tipo_muestra          as enum ('muestra', 'contramuestra');
create type tipo_empaque          as enum ('yute', 'caja', 'bolsa', 'granel');
create type rol_usuario           as enum ('admin', 'operador_acopio', 'transportista',
                                           'recepcionista', 'encargado_maquinas',
                                           'encargada_seleccion', 'comercializacion', 'visualizador');

-- ------------------------------------------------------------
-- Organizacion y catalogos
-- ------------------------------------------------------------

create table organizacion (
  id         smallint primary key default 1,
  nombre     varchar(120) not null default 'ASOCAFE',
  codigo_ico varchar(20),
  nit        varchar(20),
  direccion  varchar(200),
  constraint organizacion_fila_unica check (id = 1)
);
comment on column organizacion.codigo_ico is 'Codigo de exportador para documentacion. Valor real: 1-83-1';

create table campanias (
  id           smallint primary key,
  fecha_inicio date,
  fecha_fin    date,
  activa       boolean not null default false
);
comment on table campanias is 'Anio de cosecha. Los Excel mezclan gestiones: OR-07 vacio es 2025, OR-07-24 es otra gestion.';

create table comunidades (
  id             smallserial primary key,
  nombre         varchar(80) not null unique,
  prefijo_codigo varchar(8),
  municipio      varchar(80),
  latitud        decimal(9,6),
  longitud       decimal(9,6)
);

-- ------------------------------------------------------------
-- Persona / Parcela / Certificacion / Codigo historico
-- ------------------------------------------------------------

create table personas (
  id        uuid primary key default gen_random_uuid(),
  nombre    varchar(120) not null,
  ci        varchar(20) unique,
  telefono  varchar(20),
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);
comment on table personas is
  'La persona real. El padron oficial de socios es la fuente de verdad para deduplicar, no las planillas.';

create table afiliaciones (
  id          uuid primary key default gen_random_uuid(),
  persona_id  uuid not null references personas(id) on delete cascade,
  campania_id smallint not null references campanias(id),
  estado      estado_afiliacion not null default 'activo',
  fecha_alta  date,
  fecha_baja  date,
  motivo_baja varchar(200),
  unique (persona_id, campania_id)
);
comment on table afiliaciones is
  'Afiliacion por campania. Permite medir cuantos socios dejaron de entregar y por que '
  '(hoy la causa habitual es la competencia de la empresa privada). '
  'Un booleano en personas perderia esa historia.';
create index on afiliaciones (estado);

create table parcelas (
  id           uuid primary key default gen_random_uuid(),
  persona_id   uuid not null references personas(id),
  comunidad_id smallint not null references comunidades(id),
  nombre       varchar(120),
  hectareas    decimal(8,3),
  altitud_msnm integer,
  latitud      decimal(9,6),
  longitud     decimal(9,6),
  activa       boolean not null default true
);
comment on table parcelas is 'La unidad que se certifica es la parcela, no la persona.';
create index on parcelas (persona_id);
create index on parcelas (comunidad_id);

create table codigos_productor (
  id            uuid primary key default gen_random_uuid(),
  codigo        varchar(16) not null,
  parcela_id    uuid references parcelas(id),
  persona_id    uuid references personas(id),
  campania_id   smallint references campanias(id),
  vigente_desde date,
  vigente_hasta date,
  nombre_excel  varchar(120)
);
comment on table codigos_productor is
  'Codigos historicos del Excel. SIN unique sobre codigo a proposito: CFM-020 figura con tres '
  'nombres distintos y Fructosa Mamani Chivi con ocho codigos. Conserva el dato crudo hasta depurar.';
create index on codigos_productor (codigo);
create index on codigos_productor (parcela_id);

create table certificaciones (
  id            uuid primary key default gen_random_uuid(),
  parcela_id    uuid not null references parcelas(id) on delete cascade,
  campania_id   smallint not null references campanias(id),
  estatus       estatus_certificacion not null,
  tipo          tipo_certificacion not null,
  certificadora varchar(80),
  vigente_desde date,
  vigente_hasta date,
  unique (parcela_id, campania_id),
  -- E es siempre organico; T1/T2/T3 son siempre transicion.
  constraint certificacion_coherente check (
    (estatus = 'E' and tipo = 'organico') or
    (estatus in ('T1','T2','T3') and tipo = 'transicion')
  )
);

-- ------------------------------------------------------------
-- Factores de conversion
-- ------------------------------------------------------------

create table factores_conversion (
  id          smallserial primary key,
  campania_id smallint not null references campanias(id),
  origen      tipo_producto not null,
  destino     tipo_producto not null,
  factor      decimal(8,5) not null check (factor > 0),
  es_estimado boolean not null default true,
  nota        text,
  unique (campania_id, origen, destino)
);
comment on table factores_conversion is
  'es_estimado = true porque hoy no se pesa el rendimiento fisico, solo se estima. '
  'Cuando planta pese de verdad, los pesos reales van en beneficio_seco.*_real.';

-- ------------------------------------------------------------
-- Lotes
-- ------------------------------------------------------------

create table lotes (
  id              uuid primary key default gen_random_uuid(),
  codigo          varchar(20) not null unique,
  campania_id     smallint not null references campanias(id),
  certificacion   tipo_certificacion not null,
  correlativo     smallint not null,
  estado          estado_lote not null default 'acopio',
  kg_guinda_total decimal(12,2),
  fecha_apertura  date,
  fecha_cierre    date,
  creado_en       timestamptz not null default now(),
  unique (campania_id, certificacion, correlativo)
);
comment on table lotes is
  'Organico y transicion van SIEMPRE en lotes separados: separacion fisica y senalizacion en planta.';
comment on column lotes.kg_guinda_total is
  'Total cacheado. La suma autoritativa esta en la vista v_lote_totales.';
create index on lotes (estado);

-- ------------------------------------------------------------
-- Fase 1: Acopio  (PESO REAL #1)
-- ------------------------------------------------------------

create table entregas_acopio (
  id                  bigserial primary key,
  campania_id         smallint not null references campanias(id),
  fecha               date not null,
  codigo_productor_id uuid not null references codigos_productor(id),
  parcela_id          uuid references parcelas(id),
  persona_id          uuid references personas(id),
  kg_guinda_real      decimal(10,2) not null check (kg_guinda_real > 0),
  precio_unitario_bs  decimal(8,2) not null check (precio_unitario_bs >= 0),
  -- 1 lata = 14 kg de guinda. Verificado en las 1.352 filas.
  latas               decimal(12,4) generated always as (kg_guinda_real / 14) stored,
  -- No puede referenciar `latas` porque Postgres prohibe encadenar columnas generadas.
  total_pagado_bs     decimal(14,4) generated always as
                        ((kg_guinda_real / 14) * precio_unitario_bs) stored,
  estatus_declarado   estatus_certificacion,
  lote_id             uuid references lotes(id),
  revision            estado_revision not null default 'ok',
  revision_nota       text,
  observaciones       text,
  creado_en           timestamptz not null default now()
);
comment on table entregas_acopio is
  'Tabla de hechos principal: 1.352 entregas. Verificado en el 100%: latas = kg/14 y '
  'total_pagado = latas * precio_unitario. El pago se registra aqui para poder consultarlo, '
  'pero liquidaciones y saldos los lleva contabilidad en su propio sistema.';
comment on column entregas_acopio.revision is
  'observado = fila contradictoria detectada al cargar. No se descarta, se marca.';
create index on entregas_acopio (campania_id, fecha);
create index on entregas_acopio (codigo_productor_id);
create index on entregas_acopio (parcela_id);
create index on entregas_acopio (lote_id);
create index on entregas_acopio (revision) where revision <> 'ok';

-- ------------------------------------------------------------
-- Fase 2: Envio Taipiplaya -> La Paz  (PESO REAL #2)
-- ------------------------------------------------------------

create table envios (
  id                      uuid primary key default gen_random_uuid(),
  lote_id                 uuid not null references lotes(id),
  fecha_salida            timestamptz not null,
  fecha_llegada           timestamptz,
  origen                  varchar(60) not null default 'Taipiplaya',
  destino                 varchar(60) not null default 'La Paz',
  kg_pergamino_despachado decimal(12,3),
  kg_pergamino_recibido   decimal(12,3),
  diferencia_kg           decimal(12,3) generated always as
                            (kg_pergamino_despachado - kg_pergamino_recibido) stored,
  nota_remision           varchar(40),
  vehiculo                varchar(40),
  conductor               varchar(120),
  responsable             varchar(120),
  observaciones           text,
  constraint envio_fechas_coherentes check (fecha_llegada is null or fecha_llegada >= fecha_salida)
);
comment on table envios is
  'Lo que viaja a La Paz es pergamino seco. Las columnas de guinda/mote/verde del Excel son '
  'equivalencias calculadas: no se almacenan, se derivan en v_equivalencias_lote.';
create index on envios (lote_id);
create index on envios (fecha_salida);

-- ------------------------------------------------------------
-- Fase 3: Limpieza de equipos (sin historico)
-- ------------------------------------------------------------

create table limpiezas_equipo (
  id                uuid primary key default gen_random_uuid(),
  equipo            varchar(80) not null,
  fecha_hora        timestamptz not null,
  tipo_limpieza     varchar(20) check (tipo_limpieza in ('profunda', 'rapida')),
  duracion_min      smallint check (duracion_min > 0),
  insumos           text,
  responsable       varchar(120),
  lote_previo_id    uuid references lotes(id),
  lote_siguiente_id uuid references lotes(id)
);
comment on table limpiezas_equipo is
  'Sin datos historicos: no existe ningun registro de limpieza en los Excel. Captura desde cero. '
  'Obligatoria entre lotes de distinta certificacion.';

-- ------------------------------------------------------------
-- Fase 4: Beneficio seco
-- ------------------------------------------------------------

create table beneficio_seco (
  id                   uuid primary key default gen_random_uuid(),
  lote_id              uuid not null references lotes(id),
  fecha_inicio         timestamptz,
  fecha_fin            timestamptz,
  kg_pergamino_entrada decimal(12,3) not null check (kg_pergamino_entrada > 0),
  kg_trillado_calc     decimal(12,3),
  kg_verde_calc        decimal(12,3),
  kg_caracol_calc      decimal(12,3),
  kg_descarte_calc     decimal(12,3),
  kg_trillado_real     decimal(12,3),
  kg_verde_real        decimal(12,3),
  kg_caracol_real      decimal(12,3),
  kg_descarte_real     decimal(12,3),
  -- Usa el peso real si existe; si no, cae al estimado.
  rendimiento_pct      decimal(8,4) generated always as (
                         coalesce(kg_verde_real, kg_verde_calc) / kg_pergamino_entrada * 100
                       ) stored,
  responsable          varchar(120),
  observaciones        text
);
comment on table beneficio_seco is
  'Las columnas _calc son la estimacion por factores (lo unico que existe hoy). Las _real quedan '
  'vacias hasta que planta pese. Comparar ambas es lo que dara el rendimiento verdadero.';
create index on beneficio_seco (lote_id);

create table beneficio_productor (
  id                bigserial primary key,
  beneficio_id      uuid not null references beneficio_seco(id) on delete cascade,
  parcela_id        uuid references parcelas(id),
  persona_id        uuid references personas(id),
  latas             decimal(12,4),
  kg_guinda         decimal(12,3),
  kg_pergamino_seco decimal(12,3),
  kg_trillado       decimal(12,3),
  kg_descarte       decimal(12,3),
  kg_caracol        decimal(12,3),
  kg_verde_export   decimal(12,3)
);
comment on table beneficio_productor is
  'Desglose del lote por productor: es lo que hace posible el certificado de origen.';
create index on beneficio_productor (beneficio_id);
create index on beneficio_productor (parcela_id);

-- ------------------------------------------------------------
-- Fase 5: Almacen y muestras
-- ------------------------------------------------------------

create table almacenes (
  id           smallserial primary key,
  nombre       varchar(80) not null,
  ubicacion    varchar(120),
  capacidad_kg decimal(12,2)
);

create table existencias (
  id            bigserial primary key,
  almacen_id    smallint not null references almacenes(id),
  lote_id       uuid not null references lotes(id),
  producto      tipo_producto not null,
  kg_ingreso    decimal(12,3) not null,
  kg_saldo      decimal(12,3) not null check (kg_saldo >= 0),
  fecha_ingreso date not null,
  ubicacion     varchar(60),
  temperatura   decimal(5,2),
  humedad       decimal(5,2),
  responsable   varchar(120)
);
create index on existencias (almacen_id, lote_id, producto);

create table muestras (
  id          uuid primary key default gen_random_uuid(),
  lote_id     uuid not null references lotes(id),
  tipo        tipo_muestra not null,
  kg          decimal(8,3) not null check (kg > 0),
  fecha       date not null,
  motivo      varchar(120),
  responsable varchar(120),
  ubicacion   varchar(80),
  muestra_id  uuid references muestras(id)
);
comment on table muestras is
  'Las muestras no son un lote nuevo ni una venta: son kilos que salen del lote para control de '
  'calidad. Registrarlas permite explicar donde termino cada kilo. '
  'Ej: LOTE 4 (2110,4) + LOTE 5 (292,16) + MUESTRA (2,56) = 2400 kg.';
create index on muestras (lote_id);
create index on muestras (tipo);

-- ------------------------------------------------------------
-- Fase 6: Venta y exportacion
-- ------------------------------------------------------------

create table clientes (
  id       smallserial primary key,
  nombre   varchar(120) not null unique,
  pais     varchar(60),
  contacto varchar(120),
  email    varchar(120),
  activo   boolean not null default true
);
comment on table clientes is
  'ANDES COFFEE (Corea) compra generalmente organico. Ann Katterine (Alemania) compra ambos. '
  'Un cliente no esta restringido a un tipo: el tipo lo define el lote.';

create table contratos (
  id             uuid primary key default gen_random_uuid(),
  numero         varchar(40) not null unique,
  cliente_id     smallint not null references clientes(id),
  fecha          date not null,
  certificacion  tipo_certificacion,
  sacos          integer check (sacos > 0),
  kg_por_saco    decimal(8,2) check (kg_por_saco > 0),
  total_kg       decimal(14,4) generated always as (sacos * kg_por_saco) stored,
  tipo_empaque   tipo_empaque,
  precio_por_kg  decimal(10,4),
  moneda         varchar(3) default 'USD',
  incoterm       varchar(10),
  puerto_destino varchar(80)
);
comment on table contratos is
  'SIN campania_id, y es deliberado: la fecha de venta es independiente de la cosecha. Hay un '
  'contrato del 2026-02-26 que vende cafe de la campania 2025 y es correcto. La campania de lo '
  'vendido se obtiene por los lotes, via despacho_lotes.';
create index on contratos (cliente_id);
create index on contratos (fecha);

create table despachos (
  id             uuid primary key default gen_random_uuid(),
  contrato_id    uuid references contratos(id),
  almacen_id     smallint references almacenes(id),
  fecha_despacho date not null,
  contenedor     varchar(20),
  precintos      varchar(120),
  kg_neto        decimal(12,2),
  responsable    varchar(120),
  observaciones  text
);
create index on despachos (contrato_id);
create index on despachos (fecha_despacho);

create table despacho_lotes (
  id           bigserial primary key,
  despacho_id  uuid not null references despachos(id) on delete cascade,
  lote_id      uuid not null references lotes(id),
  kg_asignados decimal(12,3) not null check (kg_asignados > 0),
  unique (despacho_id, lote_id)
);
comment on table despacho_lotes is
  'Un despacho puede combinar lotes de distinta certificacion (EX_KOREA mezcla cinco lotes en '
  '14.100 kg). Van fisicamente separados y senalizados, por eso la certificacion se lee por lote '
  'y nunca se promedia.';

create table exportaciones (
  id              uuid primary key default gen_random_uuid(),
  despacho_id     uuid not null unique references despachos(id) on delete cascade,
  fecha_embarque  date,
  puerto_salida   varchar(80),
  puerto_llegada  varchar(80),
  naviera         varchar(80),
  bl_numero       varchar(40),
  certificaciones text[],
  volumen_kg      decimal(12,2)
);

-- ------------------------------------------------------------
-- Usuarios
-- ------------------------------------------------------------

create table perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  nombre    varchar(120) not null,
  rol       rol_usuario not null default 'visualizador',
  planta    varchar(60),
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Blockchain
-- ------------------------------------------------------------

create table blockchain_registros (
  id            bigserial primary key,
  tabla_origen  varchar(40) not null,
  registro_id   varchar(64) not null,
  lote_id       uuid references lotes(id),
  hash_sha256   char(64) not null,
  tx_id         varchar(80),
  block_number  bigint,
  hash_anterior char(64),
  sellado_en    timestamptz not null default now(),
  sellado_por   uuid references perfiles(id),
  unique (tabla_origen, registro_id)
);
comment on table blockchain_registros is
  'Solo INSERT. Sin UPDATE ni DELETE para nadie, ni siquiera admin: un sello editable no sirve.';
create index on blockchain_registros (lote_id);
create index on blockchain_registros (hash_sha256);

-- ------------------------------------------------------------
-- Regla de negocio: transicion no se convierte en organico
-- ------------------------------------------------------------

create or replace function fn_validar_certificacion_entrega()
returns trigger
language plpgsql
as $$
declare
  v_tipo_parcela tipo_certificacion;
  v_tipo_lote    tipo_certificacion;
begin
  if new.lote_id is null or new.parcela_id is null then
    return new;
  end if;

  select c.tipo into v_tipo_parcela
    from certificaciones c
   where c.parcela_id = new.parcela_id
     and c.campania_id = new.campania_id;

  select l.certificacion into v_tipo_lote
    from lotes l
   where l.id = new.lote_id;

  -- Marca en vez de rechazar: la fila se carga igual, pero queda visible para revision.
  if v_tipo_parcela is not null and v_tipo_lote is not null and v_tipo_parcela <> v_tipo_lote then
    new.revision := 'observado';
    new.revision_nota := coalesce(new.revision_nota || ' | ', '')
      || format('Parcela certificada como %s pero el lote es %s. Cafe de transicion no puede '
                || 'pasar a organico.', v_tipo_parcela, v_tipo_lote);
  end if;

  return new;
end;
$$;

create trigger trg_validar_certificacion_entrega
  before insert or update on entregas_acopio
  for each row execute function fn_validar_certificacion_entrega();
