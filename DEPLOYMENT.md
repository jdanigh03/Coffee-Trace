# 🚀 Guía de Despliegue - CoffeeTrace

## 📋 Pre-Requisitos de Despliegue

- Node.js 18+ en servidor
- PostgreSQL 14+ instalado y corriendo
- Hyperledger Fabric network activa
- Docker & Docker Compose
- Nginx o Apache para reverso proxy
- SSL certificate (Let's Encrypt)

## 🏢 Despliegue en Desarrollo

### 1. Configuración Inicial

```bash
# Clonar repositorio
git clone <repository>
cd coffeetrace-erp

# Instalar dependencias
npm run install-all

# Copiar y configurar .env
cp .env.example .env

# Variables críticas:
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=coffeetrace
DB_USER=postgres
DB_PASSWORD=<password>
```

### 2. Base de Datos

```bash
# Crear base de datos
createdb coffeetrace -U postgres

# Ejecutar migraciones (cuando estén creadas)
npm run db:migrate

# Verificar conexión
psql -h localhost -U postgres -d coffeetrace
```

### 3. Servidor Développement

```bash
# Terminal 1: Backend
npm run dev:server
# Output: 🚀 CoffeeTrace API Server running on http://localhost:3000

# Terminal 2: Frontend
npm run dev:client
# Output: VITE v5.0.8  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

## 🌐 Despliegue en Producción

### 1. Optimizar Build

```bash
# Build del cliente
cd client
npm run build
# Output: ✓ 1234 modules transformed

# Build del servidor (si aplica)
# Node no requiere build, pero si uses TypeScript:
tsc
```

### 2. Configuración de Nginx

```nginx
# /etc/nginx/sites-available/coffeetrace
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name coffeetrace.example.com;
    
    # Redirect HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name coffeetrace.example.com;
    
    ssl_certificate /etc/letsencrypt/live/coffeetrace.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coffeetrace.example.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend static files
    location / {
        root /var/www/coffeetrace/client/dist;
        try_files $uri /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /api/health {
        proxy_pass http://backend;
        access_log off;
    }
}
```

### 3. Variables de Entorno (Producción)

```bash
# /home/coffeetrace/.env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=db.example.com
DB_PORT=5432
DB_NAME=coffeetrace_prod
DB_USER=coffeetrace
DB_PASSWORD=<very-strong-password>

# Fabric
FABRIC_NETWORK=coffeetrace-prod
FABRIC_CHANNEL=coffeetrace-channel
FABRIC_CHAINCODE=coffeetrace

# Security
JWT_SECRET=<generate-with>: openssl rand -base64 32
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=error
LOG_FILE=/var/log/coffeetrace/api.log

# CORS
API_BASE_URL=https://coffeetrace.example.com
CLIENT_URL=https://coffeetrace.example.com
```

### 4. PM2 Process Manager

```bash
# Instalar PM2 globally
sudo npm install -g pm2

# Crear archivo ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'coffeetrace-api',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/coffeetrace/error.log',
    out_file: '/var/log/coffeetrace/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 4000,
    max_memory_restart: '1G'
  }]
}
EOF

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Backups Automáticos

```bash
# Script: /home/coffeetrace/backup.sh
#!/bin/bash

BACKUP_DIR="/backups/coffeetrace"
DB_NAME="coffeetrace_prod"
DB_USER="coffeetrace"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Cleanup: Keep last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"

# Cron job para ejecutar diariamente
# 0 2 * * * /home/coffeetrace/backup.sh
```

### 6. Monitoreo

```bash
# Instalar herramientas de monitoreo
npm install pm2-plus

# Dashboard
pm2 plus

# Alertas automáticas via PM2+
pm2 link <secret_key> <public_key>
```

## 🔐 Checklist de Seguridad

- [ ] HTTPS habilitado con certificado válido
- [ ] Headers de seguridad configurados
- [ ] Rate limiting implementado
- [ ] CORS configurado restrictivamente
- [ ] Secretos en variables de entorno (no en código)
- [ ] Logs no contienen datos sensibles
- [ ] SQL injection protección
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Contraseñas hasheadas con bcrypt
- [ ] Firewall configurado
- [ ] Backups automáticos funcionando
- [ ] Monitoreo de errores activo

## 📊 Escalabilidad

### Para 1,000+ usuarios

```yaml
# docker-compose.yml escalado
version: '3.8'

services:
  # Multiple API instances
  api1:
    build: .
    environment:
      - INSTANCE=1
  
  api2:
    build: .
    environment:
      - INSTANCE=2
  
  api3:
    build: .
    environment:
      - INSTANCE=3
  
  # Load balancer
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
  
  # Caché distribuida
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  # Database con replicación
  postgres-primary:
    image: postgres:15
    environment:
      - POSTGRES_REPLICATION_MODE=master
  
  postgres-replica:
    image: postgres:15
    environment:
      - POSTGRES_REPLICATION_MODE=slave
    depends_on:
      - postgres-primary
```

## 🆘 Troubleshooting

### "Port 3000 already in use"
```bash
# Encontrar proceso usando puerto 3000
lsof -i :3000

# Terminar proceso
kill -9 <PID>
```

### "Database connection timeout"
```bash
# Verificar conexión a DB
telnet db.example.com 5432

# Verificar credenciales
psql -h db.example.com -U coffeetrace -d coffeetrace
```

### "Nginx 502 Bad Gateway"
```bash
# Verificar que API está corriendo
curl localhost:3000/api/health

# Revisar logs de Nginx
tail -f /var/log/nginx/error.log
```

### "PM2 app not restarting"
```bash
# Revisar logs
pm2 logs coffeetrace-api

# Reiniciar manualmente
pm2 restart coffeetrace-api

# Monitorear estado
pm2 monit
```

## 📈 Performance Tuning

### Node.js
```bash
# Aumentar file descriptors
ulimit -n 65536

# Usar máximo CPU
export NODE_OPTIONS=--max-old-space-size=4096
```

### PostgreSQL
```sql
-- Optimizar configuración en postgresql.conf
shared_buffers = 256MB
work_mem = 4MB
max_wal_size = 2GB
```

### Redis (Caché)
```bash
# Aumentar memoria máxima
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🔄 CI/CD Pipeline

### GitHub Actions Ejemplo

```yaml
# .github/workflows/deploy.yml
name: Deploy CoffeeTrace

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test
      
      - name: Deploy to Production
        run: |
          ssh user@coffeetrace.example.com << 'EOF'
          cd /var/www/coffeetrace
          git pull origin main
          npm run install-all
          npm run build
          pm2 restart coffeetrace-api
          EOF
```

---

**Últimas verificaciones antes de ir a producción:**

✅ Todos los tests pasando
✅ Build sin errores
✅ Backups configurados y testeados
✅ Logs centralizados
✅ Monitoreo activo
✅ Plan de rollback preparado
✅ Equipo notificado
✅ Time window para deployment acordado

🎉 ¡Listo para producción!
