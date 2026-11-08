# StudyMatch

Plataforma web para conectar estudiantes que necesitan apoyo académico con estudiantes que pueden ofrecer asesoría. Proyecto de Computación en el servidor (Universidad Surcolombiana).

## Stack

- Frontend: React + Vite
- Backend: Express.js
- Base de datos: PostgreSQL

## Cómo ejecutar

1. Instalar Docker Desktop (recomendado) o usar PostgreSQL local.
2. Levantar la base de datos. El contenedor usa el puerto **5433** para no chocar con PostgreSQL instalado en Windows:

```bash
docker compose up -d
```

Si prefieres PostgreSQL local, crea la base con `backend/sql/setup_local.sql` y ajusta `DATABASE_URL` en `backend/.env`.

3. Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run db:init
npm run dev
```

4. Frontend:

```bash
cd frontend
npm install
npm run dev
```

La API queda en `http://localhost:4000` y la interfaz en `http://localhost:5173`.

## Despliegue (Render Blueprint)

El archivo `render.yaml` define un servicio web Docker (frontend + API) y PostgreSQL en el plan gratuito. `frontend/` y `backend/` no se mueven: el `Dockerfile` construye la interfaz y Express la sirve junto a `/api` y `/uploads`.

Límites del plan free: el servicio se duerme a los 15 minutos sin tráfico (el primer request tarda ~1 minuto), Postgres free caduca a los 30 días (1 GB, una base por workspace) y los archivos de publicaciones se pierden al redesplegar (disco efímero).

1. Suba este repositorio a GitHub.
2. En [Render](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Elija el repo. Render leerá `render.yaml`.
4. Cuando pida secretos, defina `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres, distinta de `Admin1234`). `JWT_SECRET` y `DATABASE_URL` se generan solos.
5. Cree el Blueprint y espere el deploy. CORS usa `RENDER_EXTERNAL_URL` (`https://studymatch.onrender.com`).

La app queda en la URL `.onrender.com` del servicio. No publique `.env` ni las claves del panel.

## Cuentas de prueba

Estas credenciales son solo para desarrollo local; no las uses en producción.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@studymatch.edu | Admin1234 |
| Asesora (Álgebra / BD) | ana@usco.edu.co | Estudiante1 |
| Solicitante | carlos@usco.edu.co | Estudiante1 |
| Asesora (Programación) | laura@usco.edu.co | Estudiante1 |

En producción, configura `NODE_ENV=production`, `DATABASE_URL`, un `JWT_SECRET` aleatorio de al menos 32 caracteres,
`CLIENT_ORIGIN` (o `RENDER_EXTERNAL_URL` en Render) y credenciales administrativas propias
(`ADMIN_EMAIL` y `ADMIN_PASSWORD`, de al menos 12 caracteres) en el entorno de despliegue.
No publiques archivos `.env` ni compartas sus valores.

## Funcionalidades del MVP

La guía de entrega, reglas y pruebas de solicitudes, disponibilidad, sesiones, valoraciones e historial está en [Entrega de módulos 4–6](docs/entrega-modulos-4-6.md).
Para actualizar una base existente sin cargar datos demo, ejecute `npm run db:migrate` desde `backend`.

- Registro e inicio de sesión (JWT + contraseñas con bcrypt)
- Consultar y actualizar perfiles académicos
- Consultar materias; crear, modificar y desactivar materias (administrador)
- Registrar las materias que domina cada estudiante
- Buscar asesores por materia y listar estudiantes disponibles
- Consultar perfiles académicos, horarios de disponibilidad y valoraciones
- Solicitudes de ayuda abiertas y solicitudes directas a un asesor
- Aceptar/rechazar solicitudes y generación automática de sesión
- Finalización y valoración 1-5
- Historial con filtros
- Publicaciones con archivo (PDF/DOC/imagen, máx. 5 MB)
- Reportes y moderación administrativa
