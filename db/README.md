# Modelo de datos y carga a Supabase

`schema.dbml` se pega tal cual en https://dbdiagram.io/d para ver el diagrama.
Desde ahi se exporta a PostgreSQL con *Export > PostgreSQL*.

## Que hay en los Excel

| Archivo | Filas utiles | Alimenta |
|---|---|---|
| `PLANILLA DE ACOPIO ORG.2025` hoja `ACOPIO ORG_2025` | 881 | `entregas_acopio` (organico) |
| `PLANILLA DE ACOPIO TRANS_25` hoja `TRANS_2025` | 471 | `entregas_acopio` (transicion) |
| `SEGUIMIENTO ... organico2025` hojas `OR-01..OR-07` | ~1.200 | asigna `lote_id` a las entregas |
| `SEGUIMINETO ... TRASICION2025` hojas `T-01..T-07` | — | idem transicion |
| `REGISTRO DE ENVIO ... ORGANICO_25` | 6 | `envios` (OR-01..OR-06) |
| `REGISTRO DE ENVIO ... TRANSICION_25` | 3 | `envios` (TR-01..TR-03) |
| `SALDO DE CAFE ORGANICO 2024` | 26 | `beneficio_productor` |
| `SALDO DE CAFE EN TRANSICION 2024` | 54 | `beneficio_productor` |
| `TRAZABILIDAD DE CAFE ORGANICO` | 96 | `beneficio_productor` + `contratos` |
| `TRAZABILIDAD DE CAFE EN TRANSICION` | 136 | `beneficio_productor` + `contratos` |

Las hojas `Hoja1/2/3`, `T_OR` y las que empiezan con "Etiquetas de fila" son
tablas dinamicas: **no se cargan**, se regeneran con vistas SQL.

## Formulas verificadas (1.352 filas, 0 excepciones)

```
latas            = kilos_guinda / 14
total_pagado_bs  = latas * precio_unitario_bs
QQ               = kg / 46

mote                  = guinda * 0.313
pergamino             = guinda * 0.20
verde_sin_seleccionar = guinda * 0.18
verde_oro             = guinda * 0.16

trillado  = pergamino * 0.90
verde     = pergamino * 0.80
descarte  = pergamino * 0.055
caracol   = pergamino * 0.045
```

Ninguno de estos valores esta medido: **todos se calculan** desde los kilos de
guinda. Por eso van como columnas `GENERATED ALWAYS` o vistas, y los factores
viven en `factores_conversion`. El dia que se pese de verdad en planta habra que
agregar columnas `_real` al lado de las calculadas y comparar: ahi aparece el
rendimiento verdadero, que hoy el Excel no puede mostrar.

## Orden de carga

```
1. organizacion, campanias, comunidades, almacenes, clientes
2. factores_conversion
3. personas             <- deduplicar por nombre (ver P-D en PREGUNTAS.md)
4. parcelas
5. codigos_productor    <- el codigo crudo del Excel, SIN unique
6. certificaciones      <- estatus E/T1/T2/T3 por parcela y campania
7. lotes                <- normalizar codigo a {OR|TR}-NN-AA
8. entregas_acopio      <- lote_id desde las hojas OR-NN / TR-NN
9. envios
10. beneficio_seco, beneficio_productor
11. existencias, muestras
12. contratos, despachos, despacho_lotes, exportaciones
```

Los pasos 3 y 4 no salen limpios de los Excel: el codigo `CFM-020` figura con
tres nombres y Fructosa Mamani Chivi con ocho codigos. La carga puede hacerse
igual dejando `parcela_id` y `persona_id` en NULL en `entregas_acopio`, y
resolverlos despues contra el padron. Nada se pierde: `codigos_productor`
conserva el codigo y el nombre tal cual venian.

## Filas que se cargan marcadas como `observado`

No se descarta ninguna fila. Se marcan en `entregas_acopio.revision`:

- 8 entregas de `CCP-132` con estatus `T3` dentro de la planilla organica.
  Confirmado: es un error, transicion no se convierte en organico.
- 34 entregas de junio 2025 con estatus vacio (pendiente de aclarar).

## Problemas de datos a resolver antes de cargar

1. **17 codigos de productor con mas de un nombre.** `CFM-020` aparece como
   Fructosa Mamani Chivi, Pastor Yanahuaya Nina y Martin Arce Quinteros.
   `CVA-046`, `CVA-039`, `CSL-023`, `CFM-032` tambien. El codigo no identifica
   una persona hoy. Si se pone `UNIQUE` sin depurar, la carga falla.

2. **"Barrio Nuevo" tiene dos prefijos**: `CVI` en la planilla organica y `CBN`
   en la de transicion. `CVI` es ademas el prefijo de "Villa Imperial", asi que
   lo mas probable es que el organico este mal.

3. **Nomenclatura de lotes inconsistente**: conviven `OR-01`, `OR-01-25`,
   `OR-3-25` (sin cero) y `TR-02-24`. Normalizar a `{OR|TR}-NN-AA`.

4. **Nombres de archivo enganosos**: `SALDO DE CAFE ORGANICO 2024.xlsx`
   contiene la hoja `SALDO DE CAFE ORG_25`, con datos de 2025. Igual el de
   transicion. Guiarse por el contenido, no por el nombre.

5. **Fechas futuras**: el bloque de venta de `TRAZABILIDAD DE CAFE ORGANICO`
   trae `2026-02-26` para el cliente ann katrein. Puede ser fecha de contrato
   a futuro o un error de tipeo; hay que confirmarlo.

6. **Codificacion**: los Excel vienen en Latin-1, se leen `Iba�ez` y `Caf�`.
   Al exportar a CSV usar UTF-8 o los acentos entran corruptos a Postgres.

7. **Un lote de envio agrega varias entregas**, pero la relacion solo existe en
   las hojas `OR-NN` del seguimiento. Si esas hojas no cubren el 100% de las
   entregas, quedaran filas con `lote_id` nulo: son acopio sin despachar.

## Especifico de Supabase

- `perfiles.id` referencia `auth.users(id)` con `on delete cascade`.
- Activar RLS en todas las tablas. Lectura para cualquier usuario autenticado;
  escritura acotada por `rol` segun la fase (el operador de acopio no escribe
  en `beneficio_seco`).
- `blockchain_registros` sin `UPDATE` ni `DELETE` para nadie: solo `INSERT`.
  Un sello que se puede editar no sirve de nada.
- La carga inicial conviene hacerla con la `service_role key` desde un script,
  saltando RLS, y no por el editor web.
