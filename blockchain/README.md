# Blockchain: configuracion y despliegue

El diseno esta en [MODELO.md](MODELO.md). Aqui esta lo que hay construido y
como levantarlo.

```
blockchain/
  MODELO.md              el diseno y sus decisiones
  chaincode/             contrato en TypeScript (compila)
    src/tipos.ts         activos del ledger
    src/trazabilidad.ts  reglas de negocio
  network/
    configtx.yaml        organizaciones, canal y politicas
    docker-compose.yaml  peers, orderer, CouchDB, CAs
    collections.json     colecciones privadas
server/worker/
  sellador.js            drena blockchain_outbox hacia Fabric
```

## Estado

| Pieza | Estado |
|---|---|
| Chaincode | escrito y **compila** (`tsc --noEmit` sin errores) |
| Config de red | escrita, **sin ejecutar**: no hay Docker en la maquina |
| Worker | escrito y probado en su ruta de fallo |
| Cola en Postgres | **funcionando**: encola, rechaza lo observado, el worker la lee |
| Red Fabric | **no desplegada** |

Lo verificado de punta a punta hoy: se encola una entrega real por API, se le
calcula el hash canonico, queda en la cola, y el worker la ve y espera. Lo que
falta es la red.

## Versiones reales de los paquetes

Comprobadas contra npm, porque aqui ya hubo un error que rompio la instalacion:

| Paquete | Version | Uso |
|---|---|---|
| `fabric-contract-api` | 2.5.8 | chaincode |
| `fabric-shim` | 2.5.8 | chaincode |
| `@hyperledger/fabric-gateway` | 1.12.0 | cliente del worker |
| ~~`fabric-network`~~ | 2.2.20 | **obsoleto**, no existe 2.5 |

`fabric-network@^2.5.0` **no existe**. Es el paquete que rompio `npm install`
al inicio del proyecto. Para Fabric 2.5 el cliente correcto es
`@hyperledger/fabric-gateway`.

## Organizaciones

| Org | Rol | Puerto |
|---|---|---|
| `AsocafeMSP` | escribe todas las fases | 7051 |
| `CertificadoraMSP` | **co-firma lo que afecta a la certificacion** | 9051 |
| `CompradorMSP` | solo lectura | 11051 |

La certificadora no es opcional. Una red donde ASOCAFE es la unica que endosa
no prueba nada que una base de datos firmada no pruebe mas barato.

## Politicas de endoso

| Operacion | Endoso |
|---|---|
| `IniciarLote`, `SellarFase` (acopio..almacenamiento) | `AsocafeMSP` |
| `RegistrarLimpieza`, `RegistrarMuestra` | `AsocafeMSP` |
| `SellarFase` (despacho, exportacion) | `AND(AsocafeMSP, CertificadoraMSP)` |
| `EmitirCertificado` | `AND(AsocafeMSP, CertificadoraMSP)` |

Las dos ultimas se fijan con **state-based endorsement** sobre las claves
`certificado~*`, mas estricto que la politica del chaincode.

## Reglas que el chaincode rechaza

1. **Orden de fases**: no se salta ni retrocede.
2. **Certificacion inmutable**: se fija en `IniciarLote` y no hay funcion que
   la cambie. Ademas el prefijo del codigo tiene que concordar: un `OR-` de
   transicion se rechaza al crear el lote.
3. **Balance de masa**: `kgVerde + kgCaracol + kgDescarte` no puede superar lo
   que entro mas 1% de tolerancia, contando las muestras.
4. **Limpieza obligatoria** entre lotes de distinta certificacion antes de
   trillar.
5. **`EmitirCertificado`** exige que todos los lotes hayan llegado a despacho.

Las reglas 2 y el orden de estados **tambien** estan en Postgres
(`20250101000005_reglas_lote.sql`), para que el sistema sea correcto antes de
que Fabric exista.

## Determinismo

El chaincode usa `ctx.stub.getTxTimestamp()` y `ctx.stub.getTxID()`, nunca
`Date.now()` ni `Math.random()`. Cada peer endosante ejecuta el codigo por
separado; con fuentes no deterministas cada uno daria un resultado distinto y
el endoso fallaria siempre.

## Levantar la red

Hace falta Docker y los binarios de Fabric 2.5.

```bash
cd blockchain/network
```

```bash
docker compose up -d
```

Despues: generar el material criptografico con `cryptogen`, crear el canal con
`osnadmin`, y desplegar el chaincode con `peer lifecycle chaincode`. Los pasos
concretos dependen de la version de los binarios; conviene seguir la guia
oficial de Fabric 2.5 con este `configtx.yaml`.

## Conectar el worker

Variables en el `.env`:

```
FABRIC_ENDPOINT=localhost:7051
FABRIC_HOST_ALIAS=peer0.asocafe.coffeetrace.bo
FABRIC_MSPID=AsocafeMSP
FABRIC_TLS_CERT=./blockchain/organizations/.../tls/ca.crt
FABRIC_CERT=./blockchain/organizations/.../signcerts/cert.pem
FABRIC_KEY=./blockchain/organizations/.../keystore/priv_sk
FABRIC_CHANNEL=trazabilidad
FABRIC_CHAINCODE=trazabilidad
```

```bash
npm i @hyperledger/fabric-gateway @grpc/grpc-js
```

```bash
node server/worker/sellador.js
```

Sin esas variables el worker **no simula nada**: sale con un mensaje diciendo
que falta y deja la cola intacta. Un sello inventado seria peor que ninguno.

## Donde NO puede correr

Fabric necesita procesos de larga duracion con estado en disco y conexiones
gRPC persistentes. **No corre en Vercel ni en ninguna funcion serverless.** El
frontend puede seguir en Vercel; los peers y el worker necesitan contenedores.
