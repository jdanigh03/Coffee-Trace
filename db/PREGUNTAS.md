# Reglas de negocio confirmadas y preguntas pendientes

Respuestas del cliente (agosto 2025) y su impacto en el modelo.

---

## CONFIRMADO

### 1. Estatus del cafe
`E` = cafe organico. `T1`, `T2`, `T3` = cafe de transicion.
El estatus es constante por productor dentro de una campania (verificado:
ninguno de los 117 productores cambia entre entregas).

> **Modelo:** vive en `certificaciones`, ligado a la parcela + campania, no a
> cada entrega.

### 2. Transicion NO se convierte en organico
Las 8 entregas `T3` dentro de la planilla organica (todas de `CCP-132`,
Benito Choque Ticona) son **un error del Excel**. Un cafe de transicion no
puede pasar a organico.

> **Modelo:** `entregas_acopio.revision` marca esas filas como `observado` al
> cargar, en vez de descartarlas o aceptarlas en silencio.

### 3. El codigo CFM no identifica a una persona
Una misma persona aparece con varios codigos (Fructosa Mamani Chivi con
`CFM-018` a `CFM-025`) y un mismo codigo con distintos nombres (`CFM-020` con
tres). Hay que separar persona, parcela y certificacion, y dejar los codigos
como historicos.

> **Modelo:** se elimino la tabla unica `productores`. Ahora son
> `personas` + `parcelas` + `certificaciones` + `codigos_productor`.
> `codigos_productor` a proposito NO tiene UNIQUE sobre `codigo`: conserva el
> dato crudo del Excel y sirve de puente hasta depurar el padron.

### 4. Organico y transicion van fisicamente separados
Se manejan con separacion fisica y senalizacion. El empaque (cajas, yutes,
bolsas) lo coordina el comprador en cada contrato.

> **Modelo:** `certificacion` vive en `lotes` y nunca se promedia. Un despacho
> puede llevar lotes de ambos tipos porque van separados y senalizados dentro
> del embarque. `contratos.tipo_empaque` guarda lo acordado con el comprador.

### 5. "LOTE 3/4/5/6/7" son los mismos lotes OR/TR
Escritos de forma incompleta. Otra inconsistencia de captura.

> **Modelo:** se mapean a los lotes existentes al cargar; no se crean lotes
> nuevos.

### 6. Muestra y contramuestra
Cantidades pequenas que se separan del lote para cateos y analisis de calidad.
No son un lote nuevo ni una venta. La contramuestra es la muestra testigo que
queda como evidencia.

> **Modelo:** tabla `muestras`, que descuenta del lote. Asi el sistema puede
> explicar donde termino cada kilo:
> LOTE 4 (2110,4) + LOTE 5 (292,16) + MUESTRA (2,56) = 2400 kg.

### 7. Clientes
`ANDES COFFEE` (Corea) compra generalmente organico.
`Ann Katterine` (Alemania) compra ambos tipos.

> **Modelo:** `clientes` sin restriccion de tipo; el tipo lo define el lote.

### 8. Codigo ICO
`1-83-1` es el codigo que usa la asociacion para documentacion de exportacion.

> **Modelo:** `organizacion.codigo_ico`, tabla de una sola fila.

### 9. Los coeficientes son estimaciones
Constantes en todos los registros. **No se registran rendimientos fisicos
reales, solo se estiman por ahora.**

> **Modelo:** `factores_conversion.es_estimado = true`. En `beneficio_seco` hay
> columnas `_calc` (estimado por factores) y `_real` (vacias hasta que planta
> pese). Comparar ambas es lo que permitira medir el rendimiento verdadero.

### 10. Diferencia de peso en transporte
Hay que registrar peso despachado, peso recibido y diferencia.

> **Modelo:** `envios.kg_pergamino_despachado`, `kg_pergamino_recibido` y
> `diferencia_kg` generada.

### 11. Lo que viaja a La Paz es PERGAMINO
El nombre `PLAN_ENVIO PERGAMINO` es correcto. El Excel muestra ademas guinda,
mote y verde porque calcula equivalencias:
guinda (acopio) -> mote (lavado) -> pergamino (seco) -> verde (final).

> **Modelo:** solo se guardan los DOS pesos realmente medidos: la guinda en
> acopio (`entregas_acopio.kg_guinda_real`) y el pergamino cargado al camion
> (`envios.kg_pergamino_despachado`). Las equivalencias se derivan en vista,
> no se almacenan.

### 12. Gestiones mezcladas
`OR-07` vacio es de 2025; `OR-07-24` pertenece a otra gestion.

> **Modelo:** `campania_id` obligatorio en lotes y entregas.

### 13. Los datos faltantes estan en papel
Limpieza de equipos, humedad, temperatura, vehiculo, conductor, contenedor y
precintos se registran en papel. El cliente los ha solicitado y aun no se los
entregan.

> **Modelo:** las tablas y columnas existen y son NULL. `limpiezas_equipo`
> arranca sin historico, captura desde cero.

---

### 14. La fecha de venta es independiente de la campania
El contrato del `2026-02-26` **no es un error**: vende cafe que se tenia de la
campania 2025. Es normal vender stock del anio anterior.

> **Modelo:** `contratos` NO lleva `campania_id`, y es deliberado. La campania
> de lo vendido se obtiene por los lotes, via `despacho_lotes`. Agregar
> `campania_id` al contrato clasificaria mal esa venta.

### 15. El padron oficial de socios existe
Es la fuente de verdad para deduplicar persona vs parcela.
Ademas: **varios socios estan dejando de entregar a la asociacion** por la
competencia de la empresa privada.

> **Modelo:** nueva tabla `afiliaciones` (persona + campania + estado). Permite
> responder cuantos socios entregaron en 2024 frente a 2025, quienes se
> retiraron y por que. Un booleano `activo` en `personas` perderia esa
> historia, y para la trazabilidad importa el estado al momento de la entrega.

### 16. La contabilidad va aparte, pero el pago se consulta aqui
Quien acopia registra cuanto se paga segun lo que trae el productor. La
contabilidad formal la lleva el area de contabilidad en su propio sistema.
Aun asi el dato de cuanto se pago **debe poder verse**.

> **Modelo:** `precio_unitario_bs` y `total_pagado_bs` se quedan en
> `entregas_acopio`. NO se modelan liquidaciones, anticipos ni saldos. El
> sistema entrega el acumulado pagado por productor y por campania.

---

## PENDIENTE

### P-A. Las 34 entregas con estatus vacio
Todas entre el 4 y el 20 de junio de 2025, de `CCLL-006` (Eleoterio Benigno
Mayta) y `CFM-018..025` (Fructosa Mamani Chivi).
**Se olvido llenar, o el vacio significa algo?**
Mientras no se aclare, se cargan con `revision = 'observado'`.

### P-B. Prefijo de "Barrio Nuevo"
Usa `CVI` en la planilla organica y `CBN` en la de transicion, y `CVI` ya es
el prefijo de "Villa Imperial". **Cual es el correcto?**

### P-C. Acceso al padron de socios
Confirmado que existe. **Hace falta el archivo** para poder deduplicar
`personas` y `parcelas`. Sin el, la carga deja `parcela_id` y `persona_id`
en NULL y se resuelven despues.

### P-D. Registros en papel
Limpieza de equipos, humedad, temperatura, vehiculo, conductor, contenedor y
precintos siguen sin entregarse. **Sin fecha comprometida.**
