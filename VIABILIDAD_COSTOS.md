# Costos del stack tecnologico

Detalle por herramienta para el estudio de viabilidad tecnica-economica.
Precios verificados en agosto de 2026.

---

## 1. Que es gratis y que se paga

| Herramienta | Tipo | Costo |
|---|---|---|
| **React** | Libreria open source (MIT) | Gratis, siempre |
| **TypeScript** | Lenguaje open source (Apache 2.0) | Gratis, siempre |
| **Vite** | Bundler open source (MIT) | Gratis, siempre |
| **React Router** | Libreria open source (MIT) | Gratis, siempre |
| **Axios** | Libreria open source (MIT) | Gratis, siempre |
| **Node.js** | Entorno open source | Gratis, siempre |
| **Express** | Framework open source (MIT) | Gratis, siempre |
| **PostgreSQL** | Motor open source | Gratis, siempre |
| **Hyperledger Fabric** | Plataforma open source (Apache 2.0) | Gratis la licencia, **se paga el servidor** |
| **Docker** | Contenedores | Gratis para uso personal y empresas pequenas |
| **Nginx** | Servidor web open source | Gratis, siempre |
| **Git** | Control de versiones open source | Gratis, siempre |
| **dbdiagram.io** | Diagramas | Gratis hasta 10 diagramas |
| **GitHub** | Repositorio | Gratis, incluye repos privados |
| **Supabase** | Hosting de base de datos | **Free o 25 USD/mes** |
| **Vercel** | Hosting del frontend | **Free o 20 USD/mes** |
| Host de contenedor | API + Fabric | **5 a 25 USD/mes** |
| Dominio | Nombre `.com` o `.org.bo` | **15 a 40 USD/ano** |

**Punto clave:** todo el software es gratis. Lo que se paga es **donde corre**.
No hay licencias, no hay pago por usuario, no hay costo por transaccion.

---

## 2. Supabase — detalle

| | Free | **Pro** | Team |
|---|---|---|---|
| Precio | 0 USD | **25 USD/mes** | 599 USD/mes |
| Base de datos | 500 MB | **8 GB** | 8 GB |
| Transferencia | 5 GB/mes | **250 GB/mes** | 250 GB/mes |
| Respaldos | no incluye | **7 dias** | 14 dias |
| Se pausa por inactividad | **si, a la semana** | **nunca** | nunca |
| Excedente de disco | — | 0,125 USD/GB | 0,125 USD/GB |
| Excedente de transferencia | — | 0,09 USD/GB | 0,09 USD/GB |

**Recomendacion: Pro (25 USD/mes).** El plan Free no sirve para produccion por
dos razones concretas: pausa el proyecto tras una semana sin uso (y el acopio
es estacional, con meses de baja actividad) y **no hace respaldos**.

### Almacenamiento: cuanto se necesita de verdad

Medido sobre la base real ya cargada:

| Concepto | Valor medido |
|---|---|
| Tamano actual de la base | **14,38 MB** |
| Entregas de la campania 2025 | 1.352 |
| Tabla mas grande (`entregas_acopio`) | 496 kB |
| Peso promedio por entrega | ~11 kB (incluye indices y tablas relacionadas) |

**Proyeccion:** 10 campanias completas ocupan unos **144 MB**.

El plan Pro incluye 8 GB. A este ritmo, **la asociacion tardaria mas de 500
anos en llenarlo**. El almacenamiento no es un factor de costo en este
proyecto: se paga por los respaldos y por que el servicio no se apague, no por
espacio.

Si en el futuro se guardan fotos o PDF escaneados, eso si crece rapido y hay
que revisar el calculo.

---

## 3. Vercel — detalle

| | Hobby | **Pro** |
|---|---|---|
| Precio | 0 USD | **20 USD/mes por usuario** |
| Transferencia | 100 GB/mes | 1 TB/mes |
| Invocaciones | 1M/mes | desde 0,60 USD por millon extra |
| **Uso comercial** | **NO permitido** | permitido |

**Recomendacion: depende del uso.**

- Si es solo tesis o demostracion academica: **Hobby (gratis)** alcanza.
- Si ASOCAFE lo usa como herramienta de trabajo: corresponde **Pro**, porque
  el plan Hobby prohibe explicitamente el uso comercial.

Esta distincion conviene declararla en el estudio, porque cambia el costo
mensual y es una condicion de licencia, no una limitacion tecnica.

---

## 4. Host del API (Railway, Render o Fly.io)

Hace falta porque **el API no puede vivir en Vercel si se implementa Fabric**:
las funciones serverless no soportan conexiones de larga duracion.

| Proveedor | Plan de entrada | Costo real para este API |
|---|---|---|
| **Railway** | Hobby 5 USD/mes | 6 a 13 USD/mes segun RAM |
| **Render** | Starter 7 USD/mes | 7 USD/mes (el gratis se duerme a los 15 min) |
| **Fly.io** | por uso | desde ~5 USD/mes |

**Recomendacion: Railway o Render, ~5 a 10 USD/mes.**

---

## 5. Hyperledger Fabric — el costo real

La licencia es gratis. La infraestructura no.

| Componente | Cantidad minima | Costo mensual |
|---|---|---|
| Peers de ASOCAFE (4 GB RAM) | 2 | 20 a 40 USD c/u |
| Orderer (Raft) | 1 (3 en produccion) | 10 a 20 USD c/u |
| CouchDB | 1 por peer | incluido en el servidor |
| Fabric CA | 1 por organizacion | incluido |
| Peer de la certificadora | 1 | a cargo de ella |

**Subtotal: 60 a 150 USD/mes**, segun si el orderer es simple o triple.

> **Condicion que decide la viabilidad.** Fabric solo aporta valor si una
> organizacion independiente (la certificadora, el comprador o una institucion
> del sector) opera un nodo y co-firma. Si ASOCAFE es el unico validador, la
> red no prueba nada que una base de datos con hashes firmados no pruebe mas
> barato, y esos 60–150 USD/mes no se justifican.

---

## 6. Resumen de costos mensuales

### Escenario A — Sin blockchain

| Concepto | USD/mes |
|---|---|
| Supabase Pro | 25 |
| Vercel Pro | 20 |
| Host del API | 5 – 10 |
| Dominio (prorrateado) | ~2 |
| **Total** | **~52 – 57 USD/mes** |

Equivalente aproximado: **360 a 400 Bs/mes**.

### Escenario B — Con Hyperledger Fabric

| Concepto | USD/mes |
|---|---|
| Todo lo anterior | 52 – 57 |
| Servidores de Fabric | 60 – 150 |
| **Total** | **~112 – 207 USD/mes** |

Equivalente aproximado: **780 a 1.440 Bs/mes**.

### Escenario C — Solo academico (tesis)

| Concepto | USD/mes |
|---|---|
| Supabase Free | 0 |
| Vercel Hobby | 0 |
| Fabric en una sola maquina con Docker | 0 |
| **Total** | **0 USD/mes** |

Sirve para demostrar y defender el sistema. **No sirve para operacion real**:
sin respaldos, con pausa por inactividad y sin uso comercial permitido.

---

## 7. Internet: que tipo se necesita

### Cuanto consume la aplicacion (medido)

| Accion | Trafico |
|---|---|
| Cargar la aplicacion la primera vez | **377 kB** (348 kB de JavaScript + 28 kB de CSS) |
| Recargas posteriores | ~0 kB (queda en cache del navegador) |
| Abrir el Dashboard | 2,3 kB |
| Ver indicadores TEE/TIN/TND | 0,9 kB |
| Consultar alertas | 0,9 kB |
| Listar lotes | 3,2 kB |
| Listar productores | 25,1 kB |
| Ver el detalle de un lote | 8,5 kB |
| Listar 500 entregas de acopio | 213,5 kB |
| **Una jornada completa de trabajo** | **~2 a 5 MB por operador** |

### Conclusion

**El sistema consume muy poco.** Es texto (JSON), no video ni imagenes.

| Requisito | Valor |
|---|---|
| Velocidad minima | **1 Mbps** de bajada |
| Velocidad comoda | 3 a 5 Mbps |
| Latencia | hasta 500 ms es usable |
| Consumo mensual por operador | **~50 a 150 MB** |
| Tipo de conexion | Fibra, 4G o incluso 3G estable |

Un plan de datos moviles de 2 GB al mes alcanza de sobra para varios
operadores.

### El problema real no es la velocidad, es la estabilidad

**El Alto:** zona urbana, sin problema.

**Taipiplaya:** zona rural de Caranavi. Aqui esta el riesgo, y no es de ancho
de banda sino de **continuidad**. Si la conexion se corta a media jornada, el
operador no puede registrar el acopio y vuelve al papel.

Recomendaciones para el estudio:

1. **Medir la senal en sitio** antes de decidir. Una prueba de velocidad en
   distintos horarios durante una semana.
2. **Plan de contingencia:** modem 4G con chip de otro operador como respaldo.
3. **Si no hay conexion estable**, hace falta desarrollo adicional para captura
   offline con sincronizacion posterior. Es un costo no presupuestado y
   conviene declararlo como riesgo.

---

## 8. Costos que no son de software

Ya detallados en `VIABILIDAD_RECURSOS.md`. En resumen:

| Rubro | Tipo |
|---|---|
| Balanzas, higrometro, termometros | Una sola vez |
| Computadoras o tablets por planta | Una sola vez |
| UPS por planta | Una sola vez |
| Internet en ambas plantas | Mensual |
| Capacitacion de operadores | Una sola vez |
| Soporte y mantenimiento | Anual |

---

## 9. Nota sobre los precios

- Supabase y Vercel: verificados en sus paginas oficiales en agosto de 2026.
- Railway, Render y Fly.io: rangos de comparativas publicas de 2026.
- Los precios en la nube cambian. Conviene reverificarlos antes de la
  presentacion final del estudio.
- El hardware debe cotizarse en el mercado boliviano; las cifras de
  `VIABILIDAD_RECURSOS.md` son ordenes de magnitud, no cotizaciones.
- La conversion a bolivianos usa un tipo de cambio aproximado de 6,96 Bs/USD.
  Verificar el vigente.
