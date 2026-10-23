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

## Cuentas de prueba

Estas credenciales son solo para desarrollo local; no las uses en producción.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | admin@studymatch.edu | Admin1234 |
| Asesora (Álgebra / BD) | ana@usco.edu.co | Estudiante1 |
| Solicitante | carlos@usco.edu.co | Estudiante1 |
| Asesora (Programación) | laura@usco.edu.co | Estudiante1 |

En producción, configura `NODE_ENV=production`, `DATABASE_URL`, un `JWT_SECRET` aleatorio de al menos 32 caracteres,
`CLIENT_ORIGIN` con el origen público del frontend y credenciales administrativas propias
(`ADMIN_EMAIL` y `ADMIN_PASSWORD`, de al menos 12 caracteres) en el entorno de despliegue.
No publiques archivos `.env` ni compartas sus valores.

## Funcionalidades del MVP

- Registro e inicio de sesión (JWT + contraseñas con bcrypt)
- Perfil académico y materias dominadas
- Catálogo de materias (CRUD para administrador)
- Solicitudes de ayuda abiertas y solicitudes directas a un asesor
- Búsqueda de asesores por materia, disponibilidad y valoración promedio
- Aceptar/rechazar solicitudes y generación automática de sesión
- Finalización y valoración 1-5
- Historial con filtros
- Publicaciones con archivo (PDF/DOC/imagen, máx. 5 MB)
- Reportes y moderación administrativa
