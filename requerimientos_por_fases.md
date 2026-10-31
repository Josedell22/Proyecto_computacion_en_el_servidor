# Especificación de Fases y Criterios de Aceptación - StudyMatch

Plataforma web de asesoría académica entre estudiantes de la Universidad Surcolombiana.
Estructura alineada a la hoja de ruta de desarrollo en 6 Fases.

---

## 🛠️ Stack Tecnológico y Restricciones Generales

* **Frontend:** React + Vite + Tailwind CSS + Lucide React.
* **Backend:** Node.js + Express.js.
* **Base de Datos:** PostgreSQL (Puerto local por defecto: `5432` / Puerto Docker: `5433`).
* **Autenticación:** JSON Web Tokens (JWT) + Hash de contraseñas con `bcrypt`.
* **Archivos:** Soporte para adjuntos en formato PDF, DOC, DOCX y JPG/PNG (Límite máximo: 5 MB).
* **Regla de Rol:** Un único usuario registrado puede actuar tanto como **solicitante de ayuda** como **asesor académico** dentro de la misma cuenta.

---

## 🚀 Fases de Desarrollo

### 📍 FASE 1: Autenticación, Gestión de Usuarios, Perfil Académico y Materias

**Objetivo:** Establecer la base de usuarios, control de acceso y la información académica fundamental.

#### Requerimientos Funcionales:
* **RF-1.1 (Autenticación):** Registro e inicio de sesión de estudiantes con correo institucional (`@usco.edu.co` / `@studymatch.edu`) y contraseña encriptada con `bcrypt`.
* **RF-1.2 (JWT):** Autenticación mediante tokens JWT enviados en la cabecera `Authorization: Bearer <token>`.
* **RF-1.3 (Perfil Académico):** Edición de datos personales (Nombre completo, Programa académico, Semestre actual y Biografía).
* **RF-1.4 (Materias Dominadas):** Selección de materias que domina el estudiante desde el catálogo activo para postularse como asesor.
* **RF-1.5 (Catálogo de Materias - Admin):** CRUD (Crear, Leer, Actualizar y Eliminar) de asignaturas académicas asignado exclusivamente al rol `Admin`.

#### Criterios de Aceptación:
- [ ] Las contraseñas en producción deben tener un mínimo de 12 caracteres para `Admin` y 8 para `Student`.
- [ ] El payload del token JWT debe contener `id`, `email` y `rol`.
- [ ] Solo las materias marcadas por el estudiante en su perfil lo habilitan como asesor disponible para dicha asignatura.
- [ ] Intentos de manipulación del catálogo de materias por usuarios con rol `Student` retornan código HTTP `403 Forbidden`.

---

### 📍 FASE 2: Búsqueda de Asesores, Solicitudes de Ayuda y Asesoría

**Objetivo:** Permitir que los estudiantes encuentren asesores capacitados y puedan solicitar apoyo académico.

#### Requerimientos Funcionales:
* **RF-2.1 (Búsqueda de Asesores):** Explorador con filtros por materia, disponibilidad horaria y promedio de valoración.
* **RF-2.2 (Solicitudes Abiertas):** Publicar solicitudes indicando materia, tema específico a reforzar y fecha/horario preferido (visibles para todos los asesores capacitados).
* **RF-2.3 (Solicitudes Directas):** Enviar una solicitud de asesoría dirigida exclusivamente a un estudiante en particular según su perfil.

#### Criterios de Aceptación:
- [ ] Cada tarjeta en el catálogo de asesores muestra: Avatar, Nombre, Programa, Valoración promedio (estrellas 1-5) y Badges de materias dominadas.
- [ ] El formulario de solicitudes valida que la fecha y hora preferida sea igual o posterior a la fecha actual.
- [ ] La vista de solicitudes incluye pestañas de navegación: *Enviadas* (como solicitante), *Recibidas* (como asesor) y *Abiertas de mis materias*.

---

### 📍 FASE 3: Disponibilidad y Gestión de Sesiones

**Objetivo:** Coordinar horarios, responder a solicitudes y gestionar las asesorías confirmadas.

#### Requerimientos Funcionales:
* **RF-3.1 (Disponibilidad):** Configuración de bloques de horarios disponibles por parte del asesor en su perfil.
* **RF-3.2 (Aceptar / Rechazar):** El asesor puede responder a solicitudes entrantes (directas o abiertas).
* **RF-3.3 (Generación de Sesión):** La aceptación de una solicitud crea automáticamente un registro de **Sesión de Asesoría** vinculada.

#### Criterios de Aceptación:
- [ ] Al aceptar una solicitud abierta, su estado cambia a `Aceptada` y se remueve de la lista de solicitudes abiertas para los demás asesores.
- [ ] Se genera una entrada en la tabla `sesiones` con estado `Programada` indicando fecha, hora, materia, solicitante y asesor.

---

### 📍 FASE 4: Valoraciones e Historial de Asesorías

**Objetivo:** Consultar el registro histórico de actividades académicas finalizadas y evaluar las asesorías recibidas.

#### Requerimientos Funcionales:
* **RF-4.1 (Cierre de Sesión):** El solicitante o el asesor pueden marcar la sesión como `Finalizada`.
* **RF-4.2 (Calificación y Feedback):** El solicitante puede calificar al asesor con un puntaje de 1 a 5 estrellas y un comentario opcional.
* **RF-4.3 (Historial Académico):** Vista consolidada de asesorías pasadas (finalizadas o canceladas) con filtros por rol (como solicitante / como asesor), fechas y materias.

#### Criterios de Aceptación:
- [ ] Tras registrar una calificación, la base de datos recalcula en tiempo real el valor `promedio_valoracion` del asesor.
- [ ] El sistema impide calificar sesiones que no estén en estado `Finalizada` o enviar más de una calificación por sesión.

---

### 📍 FASE 5: Publicaciones, Recursos Académicos, Reportes y Moderación

**Objetivo:** Compartir material de estudio (apuntes, guías, parciales) y moderar el contenido de la plataforma.

#### Requerimientos Funcionales:
* **RF-5.1 (Publicaciones):** Crear publicaciones con título, materia asociada, descripción y archivo adjunto (PDF, DOC, DOCX, PNG, JPG).
* **RF-5.2 (Descarga):** Acceso directo para descargar los recursos académicos subidos por la comunidad.
* **RF-5.3 (Reportes):** Los estudiantes pueden reportar publicaciones o usuarios por contenido inadecuado.
* **RF-5.4 (Panel Moderación Admin):** El administrador cuenta con una interfaz para gestionar reportes, desactivar cuentas de usuario y eliminar publicaciones inapropiadas.

#### Criterios de Aceptación:
- [ ] El servidor valida y rechaza cualquier archivo adjunto que supere los 5 MB de tamaño.
- [ ] Desactivar una cuenta de usuario desde el panel administrativo revoca inmediatamente su token JWT e impide su inicio de sesión.

---

### 📍 FASE 6: Notificaciones

**Objetivo:** Informar a los usuarios sobre acontecimientos e hitos importantes dentro de la plataforma.

#### Requerimientos Funcionales:
* **RF-6.1 (Alertas de Eventos):** Generación automática de notificaciones para el usuario en casos de:
  - Recepción de una nueva solicitud directa o abierta.
  - Aceptación o rechazo de una solicitud enviada.
  - Recordatorio de sesión programada próxima a ejecutarse.
  - Recepción de un reporte o sanción administrativa.
* **RF-6.2 (Centro de Notificaciones):** Indicador visual en la Navbar con lista desplegable de notificaciones leídas y no leídas.

#### Criterios de Aceptación:
- [ ] El contador de la Navbar se actualiza al recibir una notificación no leída.
- [ ] Hacer clic en una notificación permite marcarla como leída y redirige a la vista correspondiente (solicitud, sesión o perfil).