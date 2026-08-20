-- ============================================================
-- Catalogos base, extraidos de los Excel de trazabilidad 2025
-- ============================================================

insert into organizacion (id, nombre, codigo_ico)
values (1, 'ASOCAFE - Asociacion de Caficultores Taipiplaya', '1-83-1')
on conflict (id) do nothing;

insert into campanias (id, fecha_inicio, fecha_fin, activa) values
  (2024, '2024-02-01', '2024-12-31', false),
  (2025, '2025-02-01', '2025-12-31', true)
on conflict (id) do nothing;

insert into almacenes (nombre, ubicacion) values
  ('Almacen El Alto', 'El Alto, La Paz'),
  ('Planta Taipiplaya', 'Taipiplaya, Caranavi')
on conflict do nothing;

insert into clientes (nombre, pais) values
  ('ANDES COFFEE',  'Corea del Sur'),
  ('Ann Katterine', 'Alemania')
on conflict (nombre) do nothing;

-- ------------------------------------------------------------
-- Comunidades (19 detectadas entre ambas planillas)
-- ------------------------------------------------------------
-- OJO: "Barrio Nuevo" figura con prefijo CVI en la planilla organica y CBN en
-- la de transicion, y CVI ya pertenece a "Villa Imperial". Se carga como CBN
-- por descarte, PENDIENTE de confirmar.

insert into comunidades (nombre, prefijo_codigo) values
  ('3ra Villa Victoria', 'CTVV'),
  ('Amor de Dios',       'CAD'),
  ('Barrio Nuevo',       'CBN'),
  ('Bello Horizonte',    'CBH'),
  ('Condor Llimpi',      'CCLL'),
  ('Flor cafetal',       'CFC'),
  ('Flor de Mayo',       'CFM'),
  ('Huayna Potosi',      'CHP'),
  ('Pacajes',            'CCP'),
  ('Patacamaya',         'CPT'),
  ('San Luis',           'CSL'),
  ('Tres Estrellas',     'CTE'),
  ('Union Broncesal',    'CUB'),
  ('Union Tunari',       'CUT'),
  ('Villa Asuncion',     'CVA'),
  ('Villa Imperial',     'CVI'),
  ('Villa Victoria C',   'CVVC'),
  ('Villa Victoria D',   'CVVD'),
  ('segunda ingavi',     'CIS')
on conflict (nombre) do nothing;

-- ------------------------------------------------------------
-- Factores de conversion
-- ------------------------------------------------------------
-- Verificados sin una sola excepcion en los 10 archivos.
-- es_estimado = true: hoy nadie pesa el rendimiento fisico.

insert into factores_conversion (campania_id, origen, destino, factor, es_estimado, nota)
select c.id, v.origen::tipo_producto, v.destino::tipo_producto, v.factor, true, v.nota
from campanias c
cross join (values
  ('guinda',    'mote',                  0.31300, 'Guinda lavada'),
  ('guinda',    'pergamino',             0.20000, 'Guinda seca. Es lo que viaja a La Paz'),
  ('guinda',    'verde_sin_seleccionar', 0.18000, null),
  ('guinda',    'verde_oro',             0.16000, 'Producto final exportable'),
  ('pergamino', 'verde_oro',             0.80000, null),
  ('pergamino', 'descarte',              0.05500, null),
  ('pergamino', 'caracol',               0.04500, null)
) as v(origen, destino, factor, nota)
on conflict (campania_id, origen, destino) do nothing;

-- Equivalencias de unidad, guardadas como factores para no incrustarlas en codigo:
--   1 lata = 14 kg de guinda   (verificado en las 1.352 entregas)
--   1 QQ   = 46 kg
-- La de latas vive en la columna generada entregas_acopio.latas.
