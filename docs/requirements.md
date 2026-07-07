# Product Requirements Document (PRD) - Xignis App

## 1. Visión General del Producto
Xignis es una aplicación orientada a la gestión interna de empleados, enfocada en su primera fase en la solicitud y administración de permisos de ausencia (vacaciones, enfermedad, temas personales). La interfaz principal es mobile-first para empleados y desktop-friendly para manager/RH.

## 2. Roles de Usuario
* **Empleado:** usuario estándar. Puede autenticarse, gestionar su perfil básico y crear/ver/cancelar solicitudes propias.
* **Manager:** jefe directo. Revisa solicitudes de su equipo y decide la primera aprobacion o rechazo.
* **RH / hr_admin:** recursos humanos. Revisa solicitudes aprobadas por manager o que no tienen jefe asignado.
* **Admin:** rol tecnico o super admin futuro. Mantiene acceso a paneles privilegiados.

## 3. Requerimientos Funcionales (Core Features)

### 3.1. Autenticación y Seguridad
* Supabase Auth es la fuente de identidad.
* El rol visible en login es solo una pista de UX; la autoridad real sale de `profiles.role`.
* Los nuevos usuarios se crean como `employee` por defecto.
* La recuperacion de contraseña se hace con el flujo nativo de Supabase por email.
* El registro publico solo debe crear empleados; manager, RH y admin se asignan fuera del registro publico.

### 3.2. Gestión de Permisos (Flujo del Empleado)
* El usuario debe poder seleccionar un rango de fechas.
* El sistema debe impedir la seleccion de fechas en el pasado.
* El usuario debe seleccionar un tipo de permiso desde una lista excluyente.
* El usuario debe poder especificar el horario del permiso: jornada completa o rango de horas.
* El usuario debe poder listar actividades pendientes para mitigar el impacto de su ausencia.
* La solicitud debe enviarse a Supabase y quedar en `pending_manager` o `pending_hr` segun si el empleado tiene jefe asignado.
* El empleado puede cancelar solicitudes que aun no hayan sido cerradas.

## 4. Requerimientos Técnicos y Arquitectura

* **Frontend:** React + Vite + TypeScript.
* **Mobile shell:** Capacitor.
* **Estilos:** Tailwind CSS.
* **Backend y Base de Datos:** Supabase Auth + Postgres + RLS.
* **Forms:** React Hook Form + Zod.
* **Fechas:** date-fns.

## 5. Requerimientos No Funcionales
* **Diseño responsivo / mobile-first:** la interfaz debe verse bien en 375px y escalar a desktop sin quedar encerrada en un marco de telefono.
* **Accesibilidad (a11y):** bottom sheets navegables por teclado/lectores de pantalla, foco visible, labels asociados, errores anunciables y skip link.
* **Prevención de errores:** evitar botones destructivos cerca de botones primarios.
* **Estado de carga y vacio:** toda pantalla principal debe tener respuesta clara para loading, empty y error.

## 6. Modelo de Datos (Borrador)

**Tabla: `profiles`**
* `id` (UUID, PK, FK -> `auth.users.id`)
* `role` (Enum: admin, hr_admin, manager, employee)
* `full_name` (String)
* `job_title` (String)
* `manager_id` (UUID, FK -> `profiles.id`)

**Tabla: `leave_requests`**
* `id` (UUID, PK)
* `employee_id` (UUID, FK -> `profiles.id`)
* `start_date` (Date)
* `end_date` (Date)
* `leave_type` (Enum: vacation, sick, personal, other)
* `schedule_type` (Enum: full_day, time_range)
* `start_time` (Time, nullable)
* `end_time` (Time, nullable)
* `pending_tasks` (Text)
* `status` (Enum: pending_manager, approved_by_manager, rejected_by_manager, pending_hr, approved, rejected, cancelled)
* `reviewed_by` (UUID, FK -> `profiles.id`)
* `reviewed_at` (Timestamp, nullable)
* `rejection_reason` (Text, nullable)
* `created_at` (Timestamp)

**Tabla: `leave_request_approvals`**
* `id` (UUID, PK)
* `leave_request_id` (UUID, FK -> `leave_requests.id`)
* `reviewer_id` (UUID, FK -> `profiles.id`)
* `reviewer_role` (Enum)
* `decision` (Enum: approved, rejected)
* `comment` (Text, nullable)
* `created_at` (Timestamp)
