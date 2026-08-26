# Recursos necesarios para la plataforma

Insumo para el estudio de viabilidad tecnica-economica de CoffeeTrace
(ASOCAFE Taipiplaya).

> **Sobre los precios.** Las cifras son ordenes de magnitud para dimensionar,
> no cotizaciones. Los servicios en la nube cambian de precio y el hardware
> hay que cotizarlo en el mercado boliviano. Todo lo que lleva `~` debe
> verificarse antes de usarse en el estudio.

---

## 1. Lo que YA esta cubierto (inversion hecha)

No cuesta dinero adicional, pero cuenta como valor aportado:

| Componente | Estado |
|---|---|
| Base de datos disenada y desplegada | 33 tablas, 8 migraciones, en Supabase |
| Datos historicos cargados | 1.352 entregas, 102 productores, 11 lotes |
| ETL desde los Excel | Scripts reutilizables para campanias futuras |
| Frontend | 20 pantallas, React + TypeScript |
| API | 25 endpoints |
| Indicadores TEE / TIN / TND | Calculados y verificados |
| Modelo de blockchain | Disenado, sin desplegar |
| Suite de pruebas | 20 pruebas de trazabilidad |

---

## 2. Servicios en la nube (OPEX — mensual)

### Minimo para operar

| Servicio | Para que | Plan | Costo aprox. |
|---|---|---|---|
| **Supabase** | Base de datos PostgreSQL, autenticacion, API | Pro | ~25 USD/mes |
| **Vercel** | Hosting del frontend | Hobby / Pro | 0 – 20 USD/mes |
| **Host de contenedor** | API + worker (Railway, Render, Fly.io) | Basico | ~5 – 20 USD/mes |
| **Dominio** | `.com` o `.org.bo` | anual | ~15 – 40 USD/ano |
| **GitHub** | Repositorio y respaldo del codigo | Free | 0 |

**Subtotal: ~30 – 65 USD/mes** (unos 210 – 450 Bs/mes)

Notas que importan para el estudio:

- El **plan gratuito de Supabase pausa el proyecto** tras una semana sin
  actividad y no hace respaldos diarios. Para produccion hace falta el plan
  pagado.
- **Vercel Hobby prohibe el uso comercial.** Si ASOCAFE lo usa como
  herramienta de trabajo, corresponde el plan Pro.
- El API **no puede vivir en Vercel** si se implementa Fabric: las funciones
  serverless no soportan conexiones de larga duracion. De ahi el host de
  contenedor aparte.

### Si se implementa Hyperledger Fabric

La licencia de Fabric es gratuita (open source), pero la infraestructura no:

| Componente | Cantidad | Costo aprox. |
|---|---|---|
| Servidor para peers de ASOCAFE | 2 (4 GB RAM c/u) | ~20 – 40 USD/mes c/u |
| Servidor orderer | 1 – 3 | ~10 – 20 USD/mes c/u |
| Peer de la certificadora | 1 | a cargo de ella, o subsidiado |
| Almacenamiento del ledger | crece con el tiempo | incremental |

**Subtotal adicional: ~60 – 150 USD/mes**

> **Punto critico para la viabilidad.** Una red Fabric donde ASOCAFE es la
> unica organizacion que valida no prueba nada que una base de datos firmada
> no pruebe mas barato. El valor aparece solo si un tercero independiente
> (la certificadora, el comprador o una institucion del sector) opera un
> nodo. Si eso no se consigue, la inversion en blockchain no se justifica.

---

## 3. Hardware — Planta Taipiplaya (Fase II)

| Equipo | Para que | Prioridad |
|---|---|---|
| **Balanza de plataforma** (500 kg o mas) | Pesar el cafe guinda en acopio | Imprescindible |
| **Balanza con salida de datos** (USB / RS-232) | Que el peso entre solo al sistema, sin tipeo | Alta |
| **Medidor de humedad de granos** (higrometro) | Validar el 10 – 12,5% al final del secado | Imprescindible |
| **Termometro de sonda** (0 – 50 °C) | Fermentacion: rango 22 – 28 °C | Alta |
| **Termohigrometro** | Temperatura y humedad de almacen | Media |
| **Computadora o tablet** | Captura en planta | Imprescindible |
| **Impresora de etiquetas** | Codigos de lote y QR | Media |
| **UPS** | Que un corte de luz no pierda el registro | Alta |

## 4. Hardware — Planta El Alto (Fase III)

| Equipo | Para que | Prioridad |
|---|---|---|
| **Balanza para pergamino y verde oro** | Convertir la estimacion en medicion | **La mas importante** |
| Computadora | Captura de trillado y seleccion | Imprescindible |
| Impresora de etiquetas | Identificar sacos y lotes de exportacion | Media |
| Lector de QR | Verificar lotes al despachar | Opcional |
| UPS | Respaldo electrico | Alta |

> **Lo mas rentable de toda la lista.** Hoy solo se pesan dos cosas: la guinda
> en acopio y el pergamino al cargar el camion. El rendimiento, el descarte y
> el caracol salen de multiplicar por factores fijos (0,20 / 0,80 / 0,055 /
> 0,045), identicos en los 10 archivos historicos. Una balanza en El Alto le
> daria mas valor real a la trazabilidad que la blockchain entera, y cuesta
> una fraccion. Si hay que priorizar, va primero.

---

## 5. Conectividad

| Item | Observacion |
|---|---|
| Internet en **El Alto** | Zona urbana, sin problema |
| Internet en **Taipiplaya** | **Riesgo alto.** Zona rural de Caranavi |
| Plan de contingencia | Captura offline con sincronizacion posterior |
| Router / repetidor | Segun el diagnostico de senal en sitio |

Esto merece una linea propia en el estudio: **si Taipiplaya no tiene conexion
estable, la Fase II no se puede registrar en linea** y hace falta desarrollo
adicional para captura offline. Conviene medir la senal antes de decidir.

---

## 6. Personal y capacitacion

| Rubro | Detalle |
|---|---|
| Desarrollo | Ya invertido; queda conectar 7 pantallas de Fase III |
| **Capacitacion de operadores** | Acopio, planta humeda, planta seca, comercializacion |
| Soporte y mantenimiento | Actualizaciones, respaldos, incidencias |
| Administrador del sistema | Alta de usuarios, roles, parametros |

La capacitacion no es menor: el sistema cambia la forma de trabajar de gente
que hoy usa Excel y papel.

---

## 7. Insumos que no son tecnologia (pero bloquean)

Cuestan tiempo, no dinero, y sin ellos el sistema queda incompleto:

| Insumo | Estado | Impacto |
|---|---|---|
| **Padron oficial de socios** | Existe, falta el archivo | Sin el, 8 nombres quedan sin emparejar y los codigos duplicados no se depuran |
| **Registros en papel** | Solicitados, no entregados | Limpieza de equipos, humedad, vehiculos, contenedores |
| **Depurar 171 entregas observadas** | Pendiente | La cola de blockchain las rechaza; incluye 141 pesos que no coinciden entre archivos |
| Decidir prefijo de "Barrio Nuevo" | Pendiente | `CVI` o `CBN` |
| Aclarar 34 entregas sin estatus | Pendiente | Junio 2025 |

---

## 8. Dos escenarios para comparar

### Escenario A — Plataforma sin blockchain

Trazabilidad completa en base de datos, con sellos de hash internos.

- **OPEX:** ~30 – 65 USD/mes
- **CAPEX:** balanzas, higrometro, termometros, equipos de captura
- **Entrega:** trazabilidad del productor al contenedor, indicadores TEE/TIN/TND,
  certificado de origen con desglose por productor
- **Limitacion:** la garantia depende de la confianza en ASOCAFE

### Escenario B — Plataforma con Hyperledger Fabric

Todo lo anterior mas notarizacion verificable por terceros.

- **OPEX:** ~90 – 215 USD/mes
- **CAPEX:** lo mismo, mas configuracion de la red
- **Entrega adicional:** un comprador aleman o coreano puede verificar por su
  cuenta que el registro no fue alterado, con la firma de la certificadora
- **Requisito ineludible:** que una organizacion independiente opere un nodo

---

## 9. Riesgos a declarar en el estudio

1. **Conectividad en Taipiplaya.** Si no hay senal estable, la Fase II
   necesita captura offline: desarrollo adicional no presupuestado.
2. **La certificadora debe participar.** Sin un segundo validador
   independiente, el Escenario B pierde su justificacion.
3. **Los socios se estan retirando.** Varios dejan la asociacion por la
   competencia de la empresa privada. El volumen que justifica la inversion
   puede caer; el sistema mismo permite medirlo (`v_socios_por_campania`).
4. **Datos historicos inconsistentes.** Desde el 2025-07-20 la planilla de
   acopio y el archivo de seguimiento discrepan en 141 entregas. Afecta al
   certificado de origen de OR-05 y OR-06.
5. **Todo el rendimiento es estimado.** Ningun lote tiene el verde oro pesado.
   Los indicadores TEE/TIN/TND se calculan sobre factores fijos hasta que
   haya balanza en El Alto.

---

## 10. Checklist resumido

**Recurrente (mensual)**
- [ ] Supabase Pro
- [ ] Vercel (Pro si es uso comercial)
- [ ] Host de contenedor para el API
- [ ] Servidores de Fabric *(solo Escenario B)*
- [ ] Internet en ambas plantas

**Una sola vez**
- [ ] Balanza de plataforma — Taipiplaya
- [ ] Balanza de pergamino y verde oro — El Alto
- [ ] Medidor de humedad de granos
- [ ] Termometro de sonda para fermentacion
- [ ] Termohigrometro de almacen
- [ ] Computadora o tablet por planta
- [ ] Impresora de etiquetas
- [ ] UPS por planta
- [ ] Dominio
- [ ] Capacitacion de operadores

**Sin costo, pero pendiente**
- [ ] Padron oficial de socios
- [ ] Registros en papel digitalizados
- [ ] Depuracion de las 171 entregas observadas
- [ ] Compromiso de la certificadora *(solo Escenario B)*
