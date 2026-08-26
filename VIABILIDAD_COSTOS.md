# Costos del stack tecnologico

Detalle por categoria para el estudio de viabilidad tecnica-economica.
Precios verificados en agosto de 2026.

---

## Frontend: React, TypeScript, Vite, React Router, Axios

**Costo: 0 USD. Todos son librerias open source con licencia MIT o Apache 2.0.**

| Herramienta | Funcion | Costo | Mantenimiento |
|---|---|---|---|
| React 18.2 | Construir la interfaz | Gratis | Actualizaciones opcionales |
| TypeScript 5.3 | Tipado que evita errores | Gratis | Actualizaciones opcionales |
| Vite 5.0 | Compilar y servir en desarrollo | Gratis | Actualizaciones opcionales |
| React Router 6.20 | Navegacion entre pantallas | Gratis | Actualizaciones opcionales |
| Axios 1.6 | Comunicacion con el API | Gratis | Actualizaciones opcionales |

No hay licencias, ni pago por usuario, ni costo por instalacion. El unico gasto
asociado es el hosting, que se cubre en la seccion de Despliegue.

**Peso del frontend compilado:** 377 kB (348 kB de JavaScript y 28 kB de CSS).
Se descarga una sola vez y queda en cache del navegador.

---

## Backend: Node.js, Express

**Costo: 0 USD. Ambos son open source.**

| Herramienta | Funcion | Costo | Mantenimiento |
|---|---|---|---|
| Node.js 22.14 | Ejecutar el servidor | Gratis | Actualizar version LTS cada ~1 ano |
| Express 4.18 | Framework del API | Gratis | Actualizaciones opcionales |

**Lo que si se paga es donde corre el backend.** Ver la seccion de Despliegue.

---

## Base de datos: PostgreSQL + Supabase

**PostgreSQL: 0 USD.** Motor open source, sin licencias.

**Supabase: 0 o 25 USD/mes.** Es el hosting de esa base.

| | Free | **Pro (recomendado)** | Team |
|---|---|---|---|
| Precio | 0 USD | **25 USD/mes** | 599 USD/mes |
| Espacio de base | 500 MB | **8 GB** | 8 GB |
| Transferencia | 5 GB/mes | 250 GB/mes | 250 GB/mes |
| Respaldos | **no incluye** | **7 dias** | 14 dias |
| Se pausa por inactividad | **si, a la semana** | **nunca** | nunca |
| Espacio extra | — | 0,125 USD/GB | 0,125 USD/GB |

### Por que no alcanza el plan gratuito

Dos razones concretas, no de capacidad:

1. **Pausa el proyecto tras una semana sin actividad.** El acopio es
   estacional: hay meses de poca operacion y el sistema quedaria apagado.
2. **No hace respaldos.** Perder la base seria perder toda la trazabilidad.

### Cuanto almacenamiento se necesita (medido, no estimado)

| Concepto | Valor real |
|---|---|
| Tamano actual de la base | **14,38 MB** |
| Entregas cargadas | 1.352 (campania 2025) |
| Tabla mas grande (`entregas_acopio`) | 496 kB |
| Peso por entrega, con indices | ~11 kB |
| **Proyeccion a 10 campanias** | **~144 MB** |

El plan Pro incluye 8 GB. A este ritmo la asociacion tardaria **mas de 500
anos** en llenarlo.

**Conclusion: el almacenamiento no es un factor de costo en este proyecto.**
Se paga por los respaldos y por que el servicio no se apague, no por espacio.
Esto cambiaria si en el futuro se guardan fotos o documentos escaneados.

---

## Blockchain: Hyperledger Fabric

**Licencia: 0 USD.** Es open source (Apache 2.0).
**Infraestructura: 60 a 150 USD/mes.**

| Componente | Cantidad minima | Costo mensual |
|---|---|---|
| Peers de ASOCAFE (4 GB RAM) | 2 | 20 – 40 USD c/u |
| Orderer (Raft) | 1 en piloto, 3 en produccion | 10 – 20 USD c/u |
| CouchDB | 1 por peer | incluido en el servidor |
| Fabric CA | 1 por organizacion | incluido |
| Peer de la certificadora | 1 | a cargo de ella |

### Condicion que decide si vale la pena

Fabric solo aporta valor **si una organizacion independiente opera un nodo y
co-firma**: la certificadora organica, el comprador o una institucion del
sector.

Si ASOCAFE es el unico validador, la red no prueba nada que una base de datos
con hashes firmados no pruebe mas barato, y esos 60–150 USD/mes no se
justifican. Conviene declararlo asi en el estudio.

### Nota tecnica con impacto en costo

Fabric **no puede correr en Vercel**. Necesita procesos de larga duracion con
estado en disco, y las funciones serverless no lo permiten. Por eso el API
debe mudarse a un contenedor si se implementa.

---

## Despliegue: Vercel, Docker, Nginx

### Vercel — 0 o 20 USD/mes

| | Hobby | **Pro** |
|---|---|---|
| Precio | 0 USD | **20 USD/mes por usuario** |
| Transferencia | 100 GB/mes | 1 TB/mes |
| Invocaciones | 1M/mes | 0,60 USD por millon extra |
| **Uso comercial** | **NO permitido** | permitido |

**Cual corresponde depende del uso:**

- Solo tesis o demostracion academica: **Hobby (gratis)** alcanza.
- ASOCAFE lo usa como herramienta de trabajo: corresponde **Pro**, porque el
  plan Hobby prohibe explicitamente el uso comercial.

Es una condicion de licencia, no una limitacion tecnica. Conviene declararla.

### Docker — 0 USD

Gratis para uso personal, educativo y empresas pequenas (Docker Desktop es
gratuito para organizaciones de menos de 250 empleados o menos de 10 millones
USD de facturacion anual). ASOCAFE entra holgadamente en ese rango.

### Nginx — 0 USD

Servidor web open source. Sin licencias.

### Host del contenedor — 5 a 10 USD/mes

Hace falta porque el API no puede vivir en Vercel si se implementa Fabric.

| Proveedor | Plan de entrada | Costo real para este API |
|---|---|---|
| **Railway** | Hobby 5 USD/mes | 6 – 13 USD/mes segun RAM |
| **Render** | Starter 7 USD/mes | 7 USD/mes (el gratis se duerme a los 15 min) |
| **Fly.io** | por uso | desde ~5 USD/mes |

### Dominio — 15 a 40 USD/ano

Un `.com` o `.org.bo` para que la plataforma tenga direccion propia.

---

## Herramientas: Git/GitHub, dbdiagram.io

**Costo: 0 USD.**

| Herramienta | Funcion | Costo |
|---|---|---|
| Git | Control de versiones | Gratis, open source |
| GitHub | Alojar el codigo y respaldarlo | Gratis, incluye repositorios privados ilimitados |
| dbdiagram.io | Diagrama entidad-relacion | Gratis hasta 10 diagramas |

GitHub solo se paga si se necesitan funciones de equipo avanzadas (4 USD por
usuario al mes), que este proyecto no requiere.

---

## Internet: que tipo se necesita

### Cuanto consume la aplicacion (medido sobre el sistema real)

| Accion | Trafico |
|---|---|
| Cargar la aplicacion la primera vez | **377 kB** |
| Recargas posteriores | ~0 kB (queda en cache) |
| Abrir el Dashboard | 2,3 kB |
| Ver indicadores TEE/TIN/TND | 0,9 kB |
| Consultar alertas | 0,9 kB |
| Listar lotes | 3,2 kB |
| Listar productores | 25,1 kB |
| Ver el detalle de un lote | 8,5 kB |
| Listar 500 entregas de acopio | 213,5 kB |
| **Jornada completa por operador** | **2 a 5 MB** |

### Requisitos

| Requisito | Valor |
|---|---|
| Velocidad minima | **1 Mbps** de bajada |
| Velocidad comoda | 3 a 5 Mbps |
| Latencia tolerable | hasta 500 ms |
| Consumo mensual por operador | **50 a 150 MB** |
| Tipo de conexion | Fibra, 4G o incluso 3G estable |

El sistema transmite texto (JSON), no video ni imagenes. Un plan de datos
moviles de 2 GB al mes alcanza de sobra para varios operadores.

### El riesgo no es la velocidad, es la estabilidad

**El Alto:** zona urbana, sin problema.

**Taipiplaya:** zona rural de Caranavi. Aqui esta el riesgo, y no es de ancho
de banda sino de **continuidad**. Si la conexion se corta a media jornada, el
operador no puede registrar el acopio y vuelve al papel.

Tres recomendaciones para el estudio:

1. **Medir la senal en sitio** a distintas horas durante una semana, antes de
   decidir.
2. **Contingencia:** modem 4G con chip de otro operador como respaldo.
3. **Si no hay conexion estable**, hace falta desarrollo adicional para captura
   offline con sincronizacion posterior. Es un costo no presupuestado y debe
   declararse como riesgo.

---

## Resumen de costos mensuales

### Escenario A — Sin blockchain

| Concepto | USD/mes |
|---|---|
| Supabase Pro | 25 |
| Vercel Pro | 20 |
| Host del API | 5 – 10 |
| Dominio (prorrateado) | ~2 |
| **Total** | **52 – 57 USD/mes** |

Aproximadamente **360 a 400 Bs/mes**.

### Escenario B — Con Hyperledger Fabric

| Concepto | USD/mes |
|---|---|
| Todo lo anterior | 52 – 57 |
| Servidores de Fabric | 60 – 150 |
| **Total** | **112 – 207 USD/mes** |

Aproximadamente **780 a 1.440 Bs/mes**.

### Escenario C — Solo academico

| Concepto | USD/mes |
|---|---|
| Supabase Free | 0 |
| Vercel Hobby | 0 |
| Fabric local con Docker | 0 |
| **Total** | **0 USD/mes** |

Sirve para demostrar y defender el sistema. **No sirve para operacion real:**
sin respaldos, con pausa por inactividad y sin uso comercial permitido.

---

## Nota sobre los precios

- Supabase y Vercel: verificados en sus paginas oficiales, agosto de 2026.
- Railway, Render y Fly.io: rangos de comparativas publicas de 2026.
- Los precios en la nube cambian; reverificarlos antes de la presentacion
  final del estudio.
- El hardware (balanzas, higrometro, computadoras) se detalla en
  `VIABILIDAD_RECURSOS.md` y debe cotizarse en el mercado boliviano.
- La conversion a bolivianos usa un tipo de cambio aproximado de 6,96 Bs/USD.
  Verificar el vigente.
