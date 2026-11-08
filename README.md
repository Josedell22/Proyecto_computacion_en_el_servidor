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

## Despliegue (Oracle Cloud Always Free)

No existe un hosting realmente ilimitado y 100 % gratis. Render, Koyeb y similares duermen el servicio o caducan la base. Lo más cercano para esta app (Express + PostgreSQL + archivos, sin apagarse por inactividad) es **Oracle Cloud Always Free**: una VM Ampere A1 (hasta 2 OCPU y 12 GB RAM), 200 GB de disco y 10 TB de tráfico al mes, sin costo si te quedas en esos cupos. Oracle pide tarjeta para verificar identidad, no cobra el Always Free, y puede recuperar VMs inactivas.

La carpeta `frontend/` y `backend/` no se mueven. En producción Docker construye la interfaz, Express la sirve junto a la API en el puerto 80 y PostgreSQL queda en la misma VM.

1. Cree una cuenta en [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Cree una instancia Ubuntu Always Free: forma **VM.Standard.A1.Flex**, 2 OCPU, 12 GB, IP pública y clave SSH.
3. En la VCN (Security List o NSG) permita TCP **22** y **80** desde internet.
4. Suba el repositorio a la VM y prepare Docker:

```bash
git clone <url-del-repo> studymatch
cd studymatch
sh deploy/oracle-setup.sh
```

5. Cierre la sesión SSH, vuelva a entrar y configure secretos:

```bash
cp .env.production.example .env.production
nano .env.production
```

`CLIENT_ORIGIN` debe ser exactamente `http://IP_PUBLICA` (sin barra final). `JWT_SECRET` ≥ 32 caracteres. `ADMIN_PASSWORD` ≥ 12 caracteres y distinta de `Admin1234`. `POSTGRES_PASSWORD` es la clave interna de PostgreSQL.

6. Levante la app (construya **en la VM** para que coincida con ARM):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

La app queda en `http://IP_PUBLICA`. La API y los archivos se sirven en el mismo origen (`/api`, `/uploads`), así que el frontend no necesita proxy de Vite.

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
