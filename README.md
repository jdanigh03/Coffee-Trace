# 🌍 CoffeeTrace - Sistema ERP de Trazabilidad con Blockchain

**CoffeeTrace** es un sistema empresarial completo de trazabilidad de café que integra **Hyperledger Fabric** para garantizar la autenticidad y trazabilidad inmutable de cada lote desde el productor hasta el cliente final.

## 📋 Características Principales

### ✅ Módulos Implementados

1. **Dashboard de Control General** - Monitoreo en tiempo real de todas las operaciones
2. **Gestión de Productores** - Registro y verificación de productores de café
3. **Registro de Acopio** - Captura de datos de origen y certificación
4. **Planta Taipiplaya** - Operaciones de despulpado, lavado y secado
5. **Planta El Alto** - Trillado, clasificación y almacenamiento
6. **Registro de Transporte** - Monitoreo de envíos entre plantas
7. **Registro de Limpieza** - Control de higiene entre lotes
8. **Gestión de Exportación** - Documentación y preparación de despachos
9. **Consultas y Reportes** - Búsqueda avanzada y generación de reportes
10. **Verificación Blockchain** - Validación de integridad de datos

### 🔐 Seguridad y Blockchain

- **Hash SHA-256** inmutable para cada transacción
- **Hyperledger Fabric** para registro distribuido
- **Verificación de integridad** en tiempo real
- **Certificados digitales** para exportaciones

## 🚀 Stack Tecnológico

### Frontend
- **React 18** + TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Zustand** para estado global
- **Lucide React** para iconografía

### Backend
- **Node.js** con **Express.js**
- **PostgreSQL** para datos persistentes
- **Hyperledger Fabric 2.5** para blockchain
- **Crypto** para generación de hashes

## 📦 Instalación

### Requisitos Previos
- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Hyperledger Fabric >= 2.5

### Pasos de Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd coffeetrace-erp

# Instalar dependencias
npm run install-all

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar en desarrollo
npm run dev

# O ejecutar separadamente
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

## 🏗️ Estructura del Proyecto

```
coffeetrace-erp/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── types/         # Tipos TypeScript
│   │   └── App.tsx        # Componente raíz
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                 # Backend Express
│   ├── routes/            # Rutas API
│   │   ├── lots.js        # Gestión de lotes
│   │   ├── producers.js   # Gestión de productores
│   │   ├── blockchain.js  # Integración Fabric
│   │   └── analytics.js   # Reportes y análisis
│   ├── models/            # Modelos de datos
│   ├── middleware/        # Middleware personalizado
│   └── index.js           # Punto de entrada
│
├── package.json           # Dependencias root
├── .env.example          # Variables de entorno
└── README.md             # Este archivo
```

## 📊 Flujo de Trazabilidad

```
PRODUCTOR
    ↓
ACOPIO (Registro de Origen)
    ↓
TRANSPORTE (Taipiplaya → El Alto)
    ↓
RECEPCIÓN (Control de peso y humedad)
    ↓
LIMPIEZA DE EQUIPOS (Preparación)
    ↓
TRILLADO MECÁNICO (Separación del grano)
    ↓
CLASIFICACIÓN FÍSICA (Selección de calidad)
    ↓
ALMACENAMIENTO (Control de condiciones)
    ↓
DESPACHO (Preparación de exportación)
    ↓
EXPORTACIÓN (Embarque y tránsito)
```

Cada etapa genera un **hash SHA-256 único** que se registra en **Hyperledger Fabric**, garantizando que los datos no puedan ser alterados.

## 🔌 API Endpoints

### Lotes
```
GET  /api/lots                  # Obtener todos los lotes
GET  /api/lots/:id              # Obtener lote específico
POST /api/lots                  # Crear nuevo lote
PUT  /api/lots/:id/phase        # Actualizar fase del lote
POST /api/lots/:id/blockchain   # Registrar en blockchain
```

### Productores
```
GET  /api/producers             # Obtener todos los productores
GET  /api/producers/:id         # Obtener productor específico
POST /api/producers             # Crear nuevo productor
POST /api/producers/:id/verify  # Verificar productor
```

### Blockchain
```
GET  /api/blockchain/status     # Estado de la red
POST /api/blockchain/verify     # Verificar hash
POST /api/blockchain/submit     # Enviar a blockchain
GET  /api/blockchain/tx/:txId   # Obtener transacción
```

### Análisis
```
GET  /api/analytics/metrics          # Métricas generales
GET  /api/analytics/plants/:plantId  # Estadísticas de planta
GET  /api/analytics/traceability/:lotId  # Trazabilidad completa
GET  /api/analytics/quality          # Reporte de calidad
GET  /api/analytics/exports          # Reporte de exportaciones
```

## 🔐 Autenticación (Próximo)

- JWT basado en tokens
- Roles: Admin, Operador, Visualizador
- Permisos granulares por módulo

## 📈 Próximas Mejoras

- [ ] Integración completa con Hyperledger Fabric
- [ ] Autenticación y autorización
- [ ] Base de datos PostgreSQL
- [ ] Generación de certificados PDF
- [ ] Dashboard de analytics avanzado
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Integración QR para verificación rápida
- [ ] API de terceros para compradores

## 🛠️ Desarrollo

### Crear una nueva página

```bash
# 1. Crear el componente en src/pages/
# 2. Importar en App.tsx
# 3. Agregar ruta en React Router
# 4. Agregar enlace en Sidebar.tsx
```

### Agregar una nueva ruta API

```bash
# 1. Crear archivo en server/routes/
# 2. Importar en server/index.js
# 3. Registrar con app.use()
```

## 📝 Convenciones de Código

- **Tipos TypeScript** siempre
- **Componentes funcionales** con hooks
- **Nombres en español** para términos del negocio
- **Componentes reutilizables** en `/components`
- **CSS con Tailwind** - sin CSS externo

## 🤝 Contribuir

1. Hacer fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es de uso exclusivo de Asociación Bio-Arábica y Taipiplaya Coffee.

## 📞 Soporte

Para problemas o preguntas sobre el sistema, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para garantizar la trazabilidad del café de calidad**
