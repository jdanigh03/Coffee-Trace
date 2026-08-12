# 🎯 Próximos Pasos - Hoja de Ruta

## 📌 Estado Actual (✅ COMPLETADO)

### Frontend React ✓
- ✅ Estructura base completa
- ✅ 13 páginas funcionales creadas
- ✅ Componentes Header y Sidebar
- ✅ Sistema de rutas con React Router
- ✅ Estado global con Zustand
- ✅ Tipos TypeScript definidos
- ✅ Tailwind CSS configurado
- ✅ Todas las pantallas del diseño mapeadas

### Backend Node.js ✓
- ✅ Servidor Express configurado
- ✅ 4 módulos de rutas (lots, producers, blockchain, analytics)
- ✅ Endpoints básicos implementados
- ✅ Estructura preparada para Hyperledger Fabric

### Documentación ✓
- ✅ README completo
- ✅ Guía técnica detallada
- ✅ Guía de deployment
- ✅ Ejemplos de código

---

## 🔜 Próximas Prioridades (En orden)

### FASE 1: Integración Básica (Semana 1-2)

#### 1.1 Base de Datos PostgreSQL
```bash
# Crear archivo: server/db/schema.sql
# Tareas:
- [ ] Crear tablas (lots, producers, blockchain_records, etc.)
- [ ] Configurar relaciones y constraints
- [ ] Crear índices para búsquedas rápidas
- [ ] Implementar seed data para testing
```

#### 1.2 Conexión a Base de Datos
```javascript
// Crear: server/db/connection.js
// Tareas:
- [ ] Configurar pool de conexiones con pg
- [ ] Crear queries helper functions
- [ ] Implementar error handling
- [ ] Crear migraciones (con knex o similar)
```

#### 1.3 Integración Cliente-Servidor
```javascript
// Crear: client/src/api/index.ts
// Tareas:
- [ ] Crear cliente HTTP con axios
- [ ] Implementar interceptores
- [ ] Manejo de errores global
- [ ] Cacheo de respuestas
```

#### 1.4 Conectar Vistas a API
```bash
# En client/src/pages/:
- [ ] Dashboard: Obtener datos de /api/analytics/metrics
- [ ] Productores: Obtener /api/producers
- [ ] Acopio: POST /api/lots
- [ ] Etc.
```

---

### FASE 2: Hyperledger Fabric (Semana 3-4)

#### 2.1 Setup de Fabric Network
```bash
# Tareas:
- [ ] Instalar Hyperledger Fabric locally o en servidor
- [ ] Crear network.yaml
- [ ] Generar certificados y MSP
- [ ] Crear channel 'coffeetrace'
- [ ] Deploy chaincode básico
```

#### 2.2 Implementar Cliente Fabric
```javascript
// Crear: server/fabric/client.js
// Tareas:
- [ ] Conectar a Fabric gateway
- [ ] Implementar submitTransaction()
- [ ] Implementar evaluateTransaction()
- [ ] Manejo de errores de red
```

#### 2.3 Chaincode (Smart Contract)
```javascript
// Crear: fabric-network/chaincode/coffeetrace.js
// Tareas:
- [ ] Función RegisterLot(data)
- [ ] Función UpdatePhase(lotId, phase)
- [ ] Función VerifyHash(hash)
- [ ] Función GetLotHistory(lotId)
- [ ] Función GetAllLots()
```

#### 2.4 Rutas Blockchain Completas
```javascript
// Actualizar: server/routes/blockchain.js
// Tareas:
- [ ] POST /api/blockchain/submit - Enviar hash a Fabric
- [ ] GET /api/blockchain/verify/:hash - Verificar integridad
- [ ] GET /api/blockchain/tx/:txId - Obtener transacción
- [ ] GET /api/blockchain/lot/:lotId - Historial completo
```

---

### FASE 3: Autenticación (Semana 5)

#### 3.1 Sistema de Usuarios
```sql
-- Crear tabla users en DB
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50),
  plant VARCHAR(50),
  active BOOLEAN DEFAULT TRUE
);
```

#### 3.2 JWT Authentication
```javascript
// Crear: server/middleware/auth.js
// Tareas:
- [ ] Función login que genera JWT
- [ ] Middleware verifyToken()
- [ ] Refresh token logic
- [ ] Logout y token blacklist
```

#### 3.3 Rutas de Autenticación
```javascript
// Crear: server/routes/auth.js
// POST /api/auth/login
// POST /api/auth/refresh
// POST /api/auth/logout
```

#### 3.4 Proteger Rutas
```javascript
// En todas las rutas sensibles:
router.post('/lots', authenticateToken, createLot)
router.put('/lots/:id', authenticateToken, authorizeLot, updateLot)
```

---

### FASE 4: Validaciones y Lógica de Negocio (Semana 6)

#### 4.1 Validaciones de Entrada
```javascript
// Crear: server/validators/lot.validator.js
// Tareas:
- [ ] Validar peso > 0
- [ ] Validar humedad 8-15%
- [ ] Validar que productor existe
- [ ] Validar fase válida
```

#### 4.2 Cálculos Automáticos
```javascript
// En trillado:
- [ ] Calcular rendimiento = (greenCoffee / parchment) * 100
- [ ] Calcular pérdida = (waste / parchment) * 100
- [ ] Validar balance de masa
```

#### 4.3 Reglas de Negocio
```javascript
// Tareas:
- [ ] No permitir cambiar fase hacia atrás
- [ ] Validar merma en transporte
- [ ] Requiere verificación blockchain antes de próxima fase
- [ ] Almacenamiento requiere clasificación completada
```

---

### FASE 5: Reportes y Analytics (Semana 7)

#### 5.1 Queries de Analytics
```javascript
// Crear: server/db/analytics.queries.js
// Tareas:
- [ ] Total lotes por mes
- [ ] Rendimiento promedio
- [ ] Distribución de calidad
- [ ] Exportaciones por país
- [ ] Histórico de merma
```

#### 5.2 Endpoints de Reportes
```javascript
// Ampliar: server/routes/analytics.js
- [ ] GET /analytics/production-report?period=month
- [ ] GET /analytics/quality-report?period=month
- [ ] GET /analytics/export-report?destination=country
- [ ] GET /analytics/plant-efficiency/:plantId
```

#### 5.3 Generación de PDFs
```javascript
// Crear: server/utils/pdf-generator.js
// Tareas:
- [ ] Usar pdfkit o puppeteer
- [ ] Template para certificados
- [ ] Template para reportes
- [ ] Incluir hashes blockchain
```

---

### FASE 6: Funcionalidades Avanzadas (Semana 8+)

#### 6.1 Búsqueda Avanzada
```javascript
// Crear: server/routes/search.js
- [ ] Buscar por hash
- [ ] Buscar por productor
- [ ] Filtro por fechas
- [ ] Filtro por fase
- [ ] Filtro por planta
```

#### 6.2 Notificaciones en Tiempo Real
```javascript
// Implementar WebSockets (socket.io)
// Tareas:
- [ ] Notificar cuando lote entra a fase
- [ ] Alertas de temperatura/humedad anormal
- [ ] Alertas de errores blockchain
- [ ] Notificaciones push
```

#### 6.3 Mapa Interactivo
```javascript
// Crear: client/src/pages/Mapa.tsx
// Tareas:
- [ ] Mostrar ubicación de plantas
- [ ] Monitorear transportes en tiempo real
- [ ] Rastreo GPS de vehículos
```

#### 6.4 Mobile App (React Native)
```bash
# Crear repo separado
# Tareas:
- [ ] Interfaz mobile de operadores
- [ ] Escaneo QR de lotes
- [ ] Registro offline con sync
- [ ] Notificaciones push
```

---

## 🚀 Roadmap Visualizado

```
FASE 1: Base Data       [████████████]  2 semanas
FASE 2: Blockchain      [████████████]  2 semanas
FASE 3: Auth            [███████]       1 semana
FASE 4: Validaciones    [███████]       1 semana
FASE 5: Reportes        [███████]       1 semana
FASE 6: Avanzado        [████████████]  2+ semanas

Timeline Total: ~10 semanas para MVP completo
```

---

## 💾 Estructura de Carpetas Pendiente

```
server/
├── db/
│   ├── schema.sql          # Definición de BD
│   ├── connection.js       # Pool de conexiones
│   ├── migrations/         # Migraciones
│   └── seeders/            # Datos de prueba
├── validators/
│   ├── lot.validator.js
│   ├── producer.validator.js
│   └── common.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── logger.js
├── fabric/
│   ├── client.js           # Cliente Fabric
│   └── config.js
├── utils/
│   ├── crypto.js           # Hash functions
│   ├── pdf-generator.js
│   └── email.js
└── models/
    ├── Lot.js
    ├── Producer.js
    └── BlockchainRecord.js

client/
└── src/
    ├── api/
    │   ├── index.ts        # Cliente HTTP
    │   ├── lots.ts
    │   ├── producers.ts
    │   └── blockchain.ts
    ├── components/
    │   ├── forms/
    │   │   ├── LotForm.tsx
    │   │   └── ProducerForm.tsx
    │   ├── modals/
    │   │   └── VerifyModal.tsx
    │   └── charts/
    │       └── ProductionChart.tsx
    └── hooks/
        ├── useLots.ts
        ├── useProducers.ts
        └── useBlockchain.ts
```

---

## 📚 Comandos Útiles para Siguientes Pasos

```bash
# Crear base de datos
createdb coffeetrace

# Ejecutar migraciones (una vez implementadas)
npm run db:migrate

# Generar tipos desde DB (optional, con type-graphql)
npm run generate-types

# Deploy de chaincode
npm run fabric:deploy

# Tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Build production
npm run build
npm run build:server
```

---

## 🎯 Métricas de Éxito

Al completar cada fase:

- [ ] FASE 1: ✅ CRUD completo funcionando con BD real
- [ ] FASE 2: ✅ Hashes registrándose en blockchain
- [ ] FASE 3: ✅ Login requerido para acceder
- [ ] FASE 4: ✅ Validaciones impidiendo datos inválidos
- [ ] FASE 5: ✅ Reportes generándose en PDF
- [ ] FASE 6: ✅ Búsqueda en tiempo real funcionando

---

## 👥 Equipo Recomendado

- **1 Fullstack Lead** - Orquestar desarrollo, DB, Fabric
- **1 Frontend Dev** - Pulir UI/UX, agregar charts
- **1 Backend Dev** - APIs, validaciones, integraciones
- **1 DevOps** - Deployment, CI/CD, monitoring
- **1 QA** - Testing, casos de prueba

---

## 📞 Recursos Útiles

- Documentación oficial en `/TECHNICAL_GUIDE.md`
- Deployment en `/DEPLOYMENT.md`
- Diseños en `stitch_trazabilidad_blockchain_asocaf_taipiplaya/*/screen.png`
- Workflow detallado en `Workflow de Trazabilidad...txt`

---

**¡El sistema está listo para desarrollarse! 🚀**

Siguiente paso recomendado: **Comenzar FASE 1 - Configurar PostgreSQL y conectar las vistas a datos reales.**

