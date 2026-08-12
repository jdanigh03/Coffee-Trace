# 📚 Guía Técnica - CoffeeTrace ERP

## 1️⃣ Arquitectura del Sistema

### Diagrama de Capas

```
┌─────────────────────────────────────────────┐
│        FRONTEND (React + TypeScript)        │
│  - Dashboard                                 │
│  - Forms para registro de operaciones       │
│  - Consultas y Reportes                     │
└───────────────┬─────────────────────────────┘
                │ HTTP/REST
┌───────────────▼─────────────────────────────┐
│     BACKEND API (Node.js + Express)         │
│  - Rutas: lots, producers, blockchain      │
│  - Lógica de negocio                        │
│  - Integración con Fabric                   │
└───────────────┬─────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────────────┐  ┌──────▼──────────┐
│  PostgreSQL    │  │ Hyperledger     │
│  (Datos)       │  │ Fabric (Ledger) │
└────────────────┘  └─────────────────┘
```

## 2️⃣ Configuración de Hyperledger Fabric

### Requisitos
- Docker & Docker Compose
- Hyperledger Fabric >= 2.5
- Node.js SDK para Fabric

### Conexión al Blockchain

```javascript
// server/fabric/connect.js (Próximo)
import { Gateway, Wallets } from 'fabric-network'
import path from 'path'

export async function connectToFabric() {
  const gateway = new Gateway()
  
  const walletPath = path.join(process.cwd(), 'wallet')
  const wallet = await Wallets.newFileSystemWallet(walletPath)
  
  const connectionProfile = require('./connection-profile.json')
  
  await gateway.connect(connectionProfile, {
    wallet,
    identity: 'coffeetrace-admin',
    discovery: { enabled: true, asLocalhost: true }
  })
  
  const network = await gateway.getNetwork('coffeetrace-channel')
  const contract = network.getContract('coffeetrace')
  
  return { gateway, contract }
}
```

### Chaincode (Smart Contract)

```javascript
// Pseudocódigo del chaincode de ejemplo

contract RegisterLot(lotData) {
  const hash = SHA256(lotData)
  const txId = context.stub.getTxID()
  const timestamp = new Date()
  
  const record = {
    lotId: lotData.id,
    hash: hash,
    txId: txId,
    timestamp: timestamp,
    phase: 'acopio',
    verified: true
  }
  
  await context.stub.putState(lotData.id, JSON.stringify(record))
  return record
}

contract VerifyLot(lotId, hash) {
  const stored = await context.stub.getState(lotId)
  return stored.hash === hash
}
```

## 3️⃣ Modelo de Datos

### Tabla: lots
```sql
CREATE TABLE lots (
  id VARCHAR(50) PRIMARY KEY,
  producer_id VARCHAR(50) NOT NULL,
  current_phase VARCHAR(50),
  quantity DECIMAL(10, 2),
  weight DECIMAL(10, 2),
  humidity DECIMAL(5, 2),
  temperature DECIMAL(5, 2),
  plant_id VARCHAR(50),
  blockchain_hash VARCHAR(255),
  blockchain_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: producers
```sql
CREATE TABLE producers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  community VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  blockchain_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: blockchain_records
```sql
CREATE TABLE blockchain_records (
  id SERIAL PRIMARY KEY,
  lot_id VARCHAR(50),
  producer_id VARCHAR(50),
  hash VARCHAR(255) NOT NULL,
  tx_id VARCHAR(255),
  block_number INTEGER,
  phase VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 4️⃣ Flujo de Registros

### 1. Acopio
**Entrada:** Productor entrega café a Taipiplaya
**Datos Capturados:**
- ID Productor
- Peso bruto
- Cantidad de bolsas
- Comunidad
- Observaciones

**Blockchain:**
```javascript
const acopioData = {
  lotId: lot.id,
  producerId: producer.id,
  weight: lot.weight,
  phase: 'acopio',
  timestamp: new Date()
}
const hash = generateHash(acopioData)
await submitToFabric(hash, acopioData)
```

### 2. Transporte
**Entrada:** Envío de Taipiplaya a El Alto
**Datos Capturados:**
- Fecha y hora de salida
- Vehículo
- Conductor
- Peso
- Observaciones

**Validaciones:**
```javascript
// Verificar que existe la nota de remisión
// Calcular merma
const merma = peso_enviado - peso_recibido
```

### 3. Recepción
**Entrada:** Llegada a El Alto
**Datos Capturados:**
- Peso recibido
- Humedad
- Temperatura
- Estado del lote

**Blockchain Verification:**
```javascript
const receivedHash = generateHash(receptionData)
const isValid = await verifyHashInBlockchain(receivedHash)
```

### 4. Limpieza
**Entrada:** Preparación de máquinas
**Datos Capturados:**
- Equipo/Línea
- Tipo de limpieza
- Productos utilizados
- Sensor de PLC (temperatura, flujo)

### 5. Trillado
**Entrada:** Procesamiento mecánico
**Datos Capturados:**
- Peso pergamino
- Peso café verde
- Peso cascarilla
- Peso descarte
- Cálculo automático de rendimiento

**Cálculos:**
```javascript
const yield = (greenCoffeeWeight / pergaminoWeight) * 100
const loss = ((wasteWeight + descartWeight) / pergaminoWeight) * 100
```

### 6. Clasificación
**Entrada:** Selección de calidad
**Datos Capturados:**
- Peso asignado
- Peso clasificado
- Peso rechazado
- Defectos encontrados
- Eficiencia

### 7. Almacenamiento
**Entrada:** Guarda de café procesado
**Datos Capturados:**
- Ubicación
- Temperatura
- Humedad
- Responsable

### 8. Despacho
**Entrada:** Preparación de exportación
**Datos Capturados:**
- Lotes seleccionados
- Comprador
- País destino
- Documentos

### 9. Exportación
**Entrada:** Embarque final
**Datos Capturados:**
- Puerto de embarque
- Contenedor
- Certificaciones
- Documento digital con firma blockchain

## 5️⃣ Generación de Hashes

### Algoritmo SHA-256

```javascript
import crypto from 'crypto'

function generateHash(data) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex')
}

// Ejemplo
const lotData = {
  id: '#LOT-2024-001',
  producer: 'Roberto Quispe',
  weight: 1300,
  phase: 'acopio'
}

const hash = generateHash(lotData)
// Resultado: 7f3d127f2a5f10281a3d01f6d8321a3b7d4569f28c96e85b8d...
```

## 6️⃣ Verificación de Integridad

### Verificar Localmente

```javascript
// Comparar hash recalculado vs blockchain
function verifyIntegrity(originalData, blockchainHash) {
  const recalculatedHash = generateHash(originalData)
  return recalculatedHash === blockchainHash
}
```

### Verificar en Blockchain

```javascript
// Llamada a smart contract en Fabric
async function verifyInBlockchain(lotId, hash) {
  const contract = await getContract()
  const result = await contract.evaluateTransaction('VerifyLot', lotId, hash)
  return JSON.parse(result.toString())
}
```

## 7️⃣ Roles y Permisos

### Roles del Sistema

| Rol | Acopio | Transporte | Recepción | Limpieza | Trillado | Clasificación | Exportación |
|-----|:------:|:----------:|:---------:|:--------:|:--------:|:-------------:|:-----------:|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Operador Acopio | ✓ | - | - | - | - | - | - |
| Transportista | - | ✓ | - | - | - | - | - |
| Recepcionista | - | - | ✓ | ✓ | - | - | - |
| Encargado Máquinas | - | - | - | ✓ | ✓ | - | - |
| Encargada Selección | - | - | - | - | - | ✓ | - |
| Comercialización | - | - | - | - | - | - | ✓ |
| Visualizador | ✓ (solo lectura) | - | - | - | - | - | - |

## 8️⃣ Testing

### Unit Tests (Jest)

```javascript
// __tests__/blockchain.test.js
import { generateHash, verifyHash } from '../utils/crypto'

describe('Blockchain Hash', () => {
  it('should generate consistent hash', () => {
    const data = { id: '1', value: 'test' }
    const hash1 = generateHash(data)
    const hash2 = generateHash(data)
    expect(hash1).toBe(hash2)
  })

  it('should detect data tampering', () => {
    const data = { id: '1', value: 'test' }
    const hash = generateHash(data)
    data.value = 'tampered'
    const newHash = generateHash(data)
    expect(hash).not.toBe(newHash)
  })
})
```

## 9️⃣ Deployment

### Variables de Entorno (Production)

```bash
NODE_ENV=production
PORT=3000
DB_HOST=prod-db.example.com
DB_USER=coffeetrace
FABRIC_NETWORK=prod-network
JWT_SECRET=<very-strong-secret>
```

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: coffeetrace
      POSTGRES_USER: coffeetrace
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://coffeetrace:password@postgres:5432/coffeetrace
```

## 🔟 Monitoreo y Logs

### Logger (Winston)

```javascript
// server/utils/logger.js
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### Métricas de Sistema

```javascript
// Monitorear:
- Tiempo de respuesta API
- Cantidad de transacciones blockchain
- Tasa de error
- Disponibilidad
- Sincronización de nodos
```

## 1️⃣1️⃣ Seguridad

### Best Practices

✅ **Implementar:**
- Validación de entrada en todo endpoint
- Rate limiting en API
- HTTPS en producción
- JWT con expiración
- Hashing de contraseñas con bcrypt
- CORS configurado correctamente
- SQL injection prevention (prepared statements)

❌ **Evitar:**
- Exponer secrets en código
- Loguear datos sensibles
- SQL dinámico sin validar
- Confiar en datos del cliente

## 1️⃣2️⃣ Troubleshooting

### Error: "Fabric Network Unreachable"
```bash
# Verificar que Docker está ejecutando
docker ps

# Verificar connection-profile.json
cat fabric-config/connection-profile.json
```

### Error: "Database Connection Failed"
```bash
# Verificar credenciales PostgreSQL
psql -h localhost -U coffeetrace -d coffeetrace

# Revisar .env
echo $DATABASE_URL
```

### Error: "Hash Mismatch"
```bash
# Verificar que los datos no fueron modificados
# Verificar orden de propiedades en JSON (usar sorted-json)
// Ambos deben generar igual hash
generateHash({ a: 1, b: 2 })
generateHash({ b: 2, a: 1 })
```

---

**Para más información**, consulta la documentación de:
- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
