# Guia de uso — CoffeeTrace

Como hacer funcionar el sistema, paso a paso.

---

## Arrancar

Dos terminales, cada una con un comando:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Abrir http://localhost:5173

Si el servidor dice que el puerto esta ocupado, te indica en pantalla como
liberarlo.

---

## Workflow completo

### 1. Registrar acopio

**Pantalla:** Cadena de Trazabilidad > Fase II > Acopio

1. Abrir el panel **"Registrar entrega de acopio"**.
2. Llenar: fecha, **codigo de productor** (ej. `CBH-022`), peso neto en kg de
   guinda y precio por lata.
3. Opcional: asignar un lote y escribir observaciones.
4. Guardar.

El sistema hace tres cosas solo:

- Calcula **latas** = peso / 14 y **total a pagar** = latas x precio.
- Trae el **nombre y la comunidad** desde el codigo, del padron.
- Toma la **certificacion** (E, T1, T2, T3) de la parcela. No se elige a mano,
  para que nadie pueda declarar organico un cafe de transicion.

Si el codigo no existe en el padron, avisa y no guarda.
Si el productor es de transicion pero el lote es organico, guarda la entrega
**marcada como observada** en vez de aceptarla en silencio.

### 2. Registrar las etapas del beneficio humedo (Fase II)

**Pantallas:** Descarga en tolva -> Despulpado -> Fermentacion -> Lavado ->
Secado -> Almacen y lote

En cada una:

1. Elegir el **lote** al que corresponde.
2. Llenar los campos de esa etapa.
3. En **Fermentacion** y **Secado**, pulsar *Anadir lectura* por cada control
   de temperatura (cada 2-4 horas en fermentacion, diario en secado).
4. Guardar.

Ninguna de estas etapas tiene historico: la captura empieza desde cero.

### 3. Consultar la trazabilidad de un lote

**Pantalla:** Analisis > Consultas

1. Escribir o elegir el codigo del lote (ej. `OR-01-25`).
2. Se ve la cadena completa: acopio, envio, beneficio, muestras, despacho y
   los productores que lo componen.

Tambien se llega desde cualquier tabla: clic en el codigo del lote, o en el
icono del ojo de la columna **Acciones**.

### 4. Revisar los indicadores

**Pantalla:** Dashboard (es lo primero que sale)

- **TEE** — Tasa de Eficiencia Exportadora. El indicador principal.
- **TIN** — cuanto quedo inmovilizado en almacen.
- **TND** — producto sin destino documentado. La brecha de trazabilidad.

Van separados por organico y transicion, porque tienen mercados distintos.
Las tres suman 100%.

### 5. Atender las alertas

**Donde:** la campana de la barra superior

El numero del circulo son alertas activas, no registros. Cada una lleva a la
pantalla donde se resuelve. Rojo = critica o alta, azul = media.

Las alertas se calculan de los datos: al corregir el origen desaparecen solas.

### 6. Depurar las entregas observadas

**Pantalla:** Acopio, filtro *Solo observadas*

Las filas observadas salen con fondo ambar. El icono del triangulo muestra el
motivo. Hay 171 hoy, en su mayoria por pesos que no coinciden entre la
planilla de acopio y el archivo de seguimiento.

**Importante:** la cola de blockchain rechaza lo observado. Sellar un dato que
sabemos que esta mal lo vuelve inmutablemente mal.

### 7. Ajustar parametros

**Pantalla:** engranaje de la barra superior, o Configuracion en el menu

- Datos de la organizacion y codigo ICO.
- Campania activa.
- Rangos de calidad (humedad, temperaturas) y tolerancias (merma, TND).

Cambiar la tolerancia de merma cambia cuando salta la alerta, sin tocar codigo.

### 8. Exportar a Excel

Todas las tablas tienen **Exportar CSV** arriba a la derecha. El archivo abre
en Excel con los acentos correctos.

---

## Lo que TODAVIA no guarda

Estas pantallas existen y se ven, pero **el boton de guardar no hace nada**:
son formularios de la maqueta original que aun no estan conectados.

| Pantalla | Estado |
|---|---|
| Recepcion | formulario sin conectar |
| Limpieza de maquinas | formulario sin conectar |
| Trillado | formulario sin conectar |
| Seleccion | formulario sin conectar |
| Empaque y almacen | formulario sin conectar |
| Transporte | solo lectura, sin formulario |
| Despacho a exportacion | solo lectura, sin formulario |

Ademas:

- **No se puede crear un lote desde la aplicacion.** Los 11 lotes que hay
  vinieron de la carga de los Excel. Para registrar acopio de un lote nuevo,
  hoy hay que crearlo en la base.
- **El sellado en blockchain no ocurre.** El boton encola el registro, pero la
  red Fabric no esta desplegada, asi que la cola no se procesa.

---

## Resumen de un dia normal

```
Taipiplaya                          El Alto
-----------------------------       -----------------------------
1. Acopio (varias entregas)         (pendiente de conectar)
2. Descarga en tolva
3. Despulpado
4. Fermentacion + lecturas
5. Lavado
6. Secado + lecturas
7. Almacen y formacion de lote

En cualquier momento:
- Dashboard para ver TEE/TIN/TND
- Campana para alertas
- Consultas para la cadena de un lote
```
