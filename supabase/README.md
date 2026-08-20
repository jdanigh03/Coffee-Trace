# Implementacion Supabase

## Archivos

```
supabase/
  migrations/
    20250101000001_schema.sql   tablas, enums, columnas generadas, trigger de certificacion
    20250101000002_vistas.sql   vistas de consulta y control
    20250101000003_rls.sql      RLS por rol + alta automatica de perfil
  seed.sql                      catalogos: campanias, comunidades, factores, clientes
  load.sql                      carga los CSV del ETL
scripts/
  etl_excel.py                  Excel -> CSV normalizados
db/out/                         CSV generados (no se versionan)
```

## Credenciales

Hacen falta dos, y no son intercambiables:

| Variable | Para que sirve | Puede crear tablas |
|---|---|:---:|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | frontend, lee datos con RLS | no |
| `SUPABASE_DB_URL` | migraciones y carga | si |

La clave publishable **no puede ejecutar DDL**. Para migrar hace falta la cadena
de conexion de la base:

*Panel de Supabase > Project Settings > Database > Connection string > URI*

Usar el puerto **5432** (conexion directa o session pooler). El transaction
pooler del 6543 no maneja bien el DDL.

```
SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres
```

## Pasos

Con `SUPABASE_DB_URL` en el `.env`, todo corre desde Node (sin psql ni CLI):

```bash
node scripts/migrate.js --check
```

```bash
python scripts/etl_excel.py
```

```bash
node scripts/migrate.js --load
```

`--check` solo prueba la conexion y cuenta las tablas existentes.
Sin argumentos aplica migraciones y seed. Con `--load` ademas carga los CSV,
todo dentro de una transaccion: si algo falla, no queda nada a medias.

El script se niega a continuar si el esquema `public` ya tiene tablas, para no
chocar contra un proyecto que ya tenga datos.

### Alternativa con psql

Si prefieres el CLI oficial, `supabase/load.sql` hace lo mismo con `\copy`.
Hay que ejecutarlo con psql, no desde el editor web:

```bash
psql "$SUPABASE_DB_URL" -v ruta=./db/out -f supabase/load.sql
```

## Lo que produce el ETL hoy

| CSV | Filas |
|---|---:|
| personas | 102 |
| parcelas | 127 |
| codigos_productor | 127 |
| certificaciones | 116 |
| lotes | 9 |
| entregas_acopio | 1.352 |
| envios | 9 |

225.233,90 kg de guinda y 1.717.494,69 Bs pagados en la campania 2025.
Integridad referencial entre CSV verificada: 0 claves rotas.

## Filas marcadas para revisar

No se descarta ninguna. Quedan con `revision = 'observado'` y se consultan con
`select * from v_inconsistencias`.

| Motivo | Filas |
|---|---:|
| Peso discrepante entre archivos | 141 |
| Estatus vacio en la planilla | 32 |
| Estatus T3 dentro de la planilla organica | 8 |
| Sin lote asignado | 1 |

### El peso discrepante es el hallazgo importante

Desde el **2025-07-20**, la planilla de acopio y el archivo de seguimiento
**no dicen los mismos kilos** para la misma entrega:

- Los codigos de productor coinciden en las 207 fechas.
- Los pesos difieren en 51 fechas, todas a partir del 20 de julio.
- Ejemplo: `CIS-016` el 2025-07-21 figura con **3.114 kg** en la planilla de
  acopio y **219 kg** en el seguimiento.
- Los totales globales casi cuadran (157.996,9 vs 158.041,0 kg, -44,1 de
  diferencia), pero el reparto por productor cambia por completo.

El ETL **conserva el peso de la planilla de acopio**, con este razonamiento:
es la planilla donde se calculo el pago, y ese numero ya se le pago al
productor. Es una decision que hay que confirmar.

Esto afecta directamente al certificado de origen, que se apoya en cuantos
kilos aporto cada socio. Los lotes afectados son **OR-05 y OR-06**.

## Segunda pasada: beneficio y ventas

`scripts/etl_beneficio.py` carga el desglose por productor, las existencias y
las ventas. Los productores ahi aparecen **solo por nombre escrito a mano**, sin
codigo: el emparejamiento es por nombre normalizado contra `personas`.

**102 de 110 nombres coinciden exacto.** Los 8 restantes (2,7% de los kg) se
cargan con `persona_id` nulo y `revision = 'observado'`, no se adivinan.

Los dos archivos tienen semantica distinta y **no son duplicados**:

- `SALDO DE ALMACENES` = lo que queda en bodega sin vender
- `TRAZABILIDAD DE VENTA` = lo que se vendio y a quien

En OR-05 la particion es exacta: 26.549 vendido + 3.651 en stock = 30.200, el
lote entero. Por eso `beneficio_productor.fuente` guarda de cual vino cada fila.

### Ventas cargadas

Solo las dos anclables a lotes concretos:

| Contrato | Cliente | Fecha | kg | Lotes |
|---|---|---|---:|---|
| ANDES-2025-09 | ANDES COFFEE (Corea) | 2025-09-19 | 14.100 | TR-02-24, OR-07-24, OR-01-25, OR-02-25, TR-01-25 |
| ANNK-2026-02 | Ann Katterine (Alemania) | 2026-02-26 | 18.000 | OR-03-25, OR-04-25, OR-05-25 |

`LOTE 3` y `LOTE 4` se confirmaron por aritmetica exacta contra el verde del
lote: 30.390 x 0,16 = 4.862,4 y 28.680 x 0,16 = 4.588,8.

**Quedan fuera** las seis ventas de diciembre 2024 de `hoja_1` y la de enero
2025 de `hoja_2`: referencian `LOTE 4/5/6/7` que no corresponden
aritmeticamente a ningun lote de 2025, y no hay acopio de 2024 para anclarlas.
Asignarlas seria inventar trazabilidad.

## Reconciliacion beneficio vs acopio

`select * from v_reconciliacion_lote`

| Estado | Lotes |
|---|---:|
| cuadra | 5 |
| no cuadra | 4 (OR-05-25, TR-01-25, TR-02-25, TR-03-25) |
| sin acopio cargado | 2 (OR-07-24, TR-02-24, de gestiones previas) |

En TR-01 el desglose por productor difiere del acopio entre -1.375 y +1.305 kg
por persona. Es el mismo problema de fondo que los 141 pesos discrepantes.

## Roles y permisos

RLS activo en las 25 tablas. Lectura para cualquier usuario autenticado;
escritura acotada por rol:

| Rol | Escribe en |
|---|---|
| `admin` | todo |
| `operador_acopio` | padron, entregas, lotes |
| `transportista` | envios |
| `recepcionista` | envios, existencias, muestras |
| `encargado_maquinas` | limpiezas, beneficio |
| `encargada_seleccion` | beneficio, existencias, muestras |
| `comercializacion` | clientes, contratos, despachos, exportaciones, lotes |
| `visualizador` | nada, solo lectura |

Un usuario nuevo entra como `visualizador`: el rol con permisos lo asigna un
admin, nunca se auto-asigna.

`blockchain_registros` es append-only. No tiene policy de UPDATE ni DELETE, y
ademas se revocan los privilegios: un sello editable no prueba nada.

## Estado: MIGRADO Y VERIFICADO

Aplicado sobre el proyecto `mxafjhfegqevrakaiotw` (PostgreSQL 17.6).

| Tabla | Filas |
|---|---:|
| personas | 102 |
| parcelas | 127 |
| codigos_productor | 127 |
| certificaciones | 116 |
| comunidades | 19 |
| factores_conversion | 14 |
| lotes | 9 |
| envios | 9 |
| entregas_acopio | 1.352 |
| afiliaciones | 99 |

Comprobado contra la base ya cargada:

- **Totales exactos**: 225.233,90 kg de guinda y 1.717.494,69 Bs, identicos a
  los del ETL y a los Excel.
- **Columnas generadas correctas**: 47 kg -> 3,3571 latas -> 147,71 Bs,
  igual que la planilla.
- **Vistas funcionando**: `v_equivalencias_lote` reproduce las equivalencias
  (OR-01: 27.567 kg guinda -> 5.513,4 pergamino -> 4.410,7 verde).
- **RLS activo en las 25 tablas.** Sin login la API devuelve `200 []`; un
  usuario autenticado ve las 1.352 entregas. Escribir sin el rol adecuado
  queda bloqueado.
- **`blockchain_registros` es append-only de verdad**: UPDATE y DELETE dan
  `permission denied` incluso para `authenticated`.

`afiliaciones` (99) es menor que `personas` (102) porque tres personas existen
solo como nombre alternativo de un codigo compartido y no tienen entregas
propias. Se resuelve al depurar el padron.

## Backend y pruebas

El API ya no usa datos mock: lee de Supabase.

```bash
npm run test:traza
```

20 pruebas de trazabilidad, todas dentro de una transaccion que termina en
`ROLLBACK`: se pueden correr contra la base con datos reales sin ensuciarla.
Cubren las reglas de negocio (transicion que no pasa a organico, certificacion
inmutable, estado que no retrocede), las columnas generadas, el balance de masa,
las muestras, la cola que rechaza lo observado, la serializacion canonica
(incluida la normalizacion NFC) y la deteccion de alteracion en la cadena de
hashes.

Endpoints disponibles:

```
GET  /api/health
GET  /api/lots                          filtros: certificacion, campania, estado
GET  /api/lots/:codigo                  cadena completa del lote
GET  /api/lots/:codigo/entregas         el acopio que lo compone
GET  /api/lots/:codigo/trazabilidad     resumen para el certificado
GET  /api/producers                     filtros: campania, comunidad, buscar
GET  /api/producers/comunidades
GET  /api/producers/:id
GET  /api/analytics/dashboard
GET  /api/analytics/rendimiento         estimado vs medido
GET  /api/analytics/reconciliacion
GET  /api/analytics/socios
GET  /api/analytics/inconsistencias
GET  /api/blockchain/status
POST /api/blockchain/encolar            calcula el hash canonico y encola
POST /api/blockchain/verify
GET  /api/blockchain/cadena/:codigoLote verifica el encadenado
GET  /api/blockchain/outbox
```

## Lo que falta para que el frontend vea datos

Las policies de lectura son `to authenticated`: **sin login no se ve nada**,
por diseno. La app todavia no tiene autenticacion, asi que hoy recibiria
listas vacias. Hace falta conectar Supabase Auth y que cada usuario tenga su
fila en `perfiles` (se crea sola al registrarse, con rol `visualizador`).
