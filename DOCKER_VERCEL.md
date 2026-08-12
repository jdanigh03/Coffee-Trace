# Despliegue: Docker y Vercel

Son dos destinos distintos y no intercambiables. **Vercel no ejecuta imagenes
Docker**: despliega estaticos y funciones serverless. El `Dockerfile` sirve para
correr el stack completo en local o para hostear el API donde si corren
contenedores (Railway, Render, Fly.io, un VPS).

---

## Opcion A — Docker (stack completo)

Levanta frontend + API + PostgreSQL:

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: solo accesible por la red interna, a traves de `/api/` en nginx

### Como esta armado

| Servicio | Imagen | Rol |
|---|---|---|
| `client` | nginx 1.27 alpine | Sirve el build de Vite y hace proxy de `/api/` al API |
| `server` | node 20 alpine | Express, sin puerto publicado al host |
| `db` | postgres 16 alpine | Datos, con volumen `pgdata` persistente |

El API no publica puertos: solo nginx lo alcanza por la red interna de compose.
Reduce la superficie expuesta.

### Variables

Compose lee `DB_NAME`, `DB_USER` y `DB_PASSWORD` del entorno o de un `.env` en
la raiz. Los valores por defecto son de desarrollo — cambialos antes de exponer
esto a una red real.

---

## Opcion B — Vercel

```bash
npm i -g vercel
vercel        # preview
vercel --prod # produccion
```

`vercel.json` hace tres cosas:

1. Compila `client/` y publica `client/dist` como estatico.
2. Manda `/api/*` a la funcion serverless `api/index.js`, que reexporta la app
   de Express desde `server/app.js`.
3. Devuelve `index.html` en cualquier otra ruta, para que React Router resuelva.

### Limitaciones reales en Vercel

**Los datos no persisten.** Los routers guardan en arreglos en memoria
(`server/routes/*.js`). Cada invocacion serverless puede correr en una instancia
nueva, asi que un `POST` puede no verse en el `GET` siguiente. Funciona para una
demo; no para uso real. Se resuelve al conectar PostgreSQL (Vercel Postgres,
Neon o Supabase).

**Hyperledger Fabric no va a funcionar ahi.** El SDK de Fabric necesita
conexiones gRPC de larga duracion, wallet en disco e identidad persistente.
Nada de eso existe en una funcion serverless con sistema de archivos efimero y
tiempo de ejecucion acotado.

### Arquitectura recomendada

Cuando entre Fabric, la division natural es:

- **Frontend en Vercel** — encaja perfecto, es estatico.
- **API en un contenedor** (`Dockerfile.server`) en Railway/Render/Fly.io, con
  acceso a PostgreSQL y a la red de Fabric.

En ese caso hay que apuntar el frontend al API externo en lugar de usar `/api`
relativo, y quitar el rewrite de `/api/` de `vercel.json`.

---

## Estado de verificacion

- `vite build` del cliente: correcto.
- API refactorizada (`server/app.js` + `server/index.js`): arranca y responde
  `/api/health` y el 404 JSON.
- **Imagenes Docker: sin construir.** Docker no estaba instalado en la maquina
  donde se escribio esto, asi que los Dockerfiles y el compose no se ejecutaron
  nunca. Revisalos con `docker compose up --build` antes de confiar en ellos.
- **Despliegue en Vercel: sin probar.** La configuracion no se ha ejecutado
  contra Vercel.
