# Xignis App - Handoff

## Estado actual

Proyecto iniciado como app mobile-first para empleados y paneles web para jefes y RH.

Stack decidido:

- React + Vite + TypeScript
- Capacitor para iOS/Android
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- React Hook Form + Zod para formularios/validaciones

## Roles definidos

- `employee`: trabajador. Crea solicitudes y ve su historial.
- `manager`: jefe. Revisa solicitudes de su equipo y ve calendario de ausencias.
- `hr_admin`: Recursos Humanos. Revisa solicitudes, audita, reporta y administra procesos.
- `admin`: rol tecnico o super admin futuro.

Flujo de aprobacion:

```txt
Empleado -> Jefe -> RH
```

Estados documentados:

```txt
pending_manager
approved_by_manager
rejected_by_manager
pending_hr
approved
rejected
cancelled
```

## Implementado en codigo

Rutas disponibles:

```txt
/login
/employee
/employee/request
/employee/requests/demo-001
/manager
/admin
/* -> 404
```

Pantallas implementadas:

- Login con selector Empleado/Jefe/RH y validacion contra Supabase.
- Dashboard empleado con datos reales.
- Crear solicitud empleado con validacion y envio a Supabase.
- Detalle de solicitud empleado con cancelacion.
- Dashboard manager con pendientes y calendario de equipo.
- Dashboard RH/admin con KPIs, tabla y panel de revision.
- Pantalla 404.

Supabase ya esta conectado para el flujo base:

- `.env` configurado con `VITE_SUPABASE_URL` y publishable key.
- Cliente Supabase tipado en `src/lib/supabase.ts`.
- Contexto de sesion y rutas protegidas por rol.
- Login real con Supabase Auth y validacion contra `profiles.role`.
- Dashboard empleado lee solicitudes reales.
- Crear solicitud inserta en `leave_requests`.
- Detalle empleado lee por id y permite cancelar.
- Manager lista solicitudes `pending_manager` de su equipo y puede aprobar/rechazar.
- RH/admin lista solicitudes y puede aprobar/rechazar con comentario.
- La UI ya tiene skip link, foco visible, bottom sheets accesibles y layout full-viewport en desktop.

## OpenPencil

Laminas creadas en el canvas:

- `Xignis - Mobile First Screens v0`
- `Xignis - UX Architecture and Screens v1`
- `Xignis - Manager UX v1`

El diseño v1 es la referencia visual actual para pasar a codigo.

## Supabase MCP y skills

MCP configurado:

```txt
supabase -> https://mcp.supabase.com/mcp?project_ref=wtycqdnrulknhzheqflq
Auth: OAuth
```

Skills instaladas en `.agents/skills/`:

- `accessibility`
- `capacitor-app-upgrades`
- `capacitor-apple-review-preflight`
- `capacitor-best-practices`
- `capacitor-plugins`
- `composition-patterns`
- `frontend-design`
- `nodejs-backend-patterns`
- `nodejs-best-practices`
- `react-best-practices`
- `react-hook-form`
- `seo`
- `supabase`
- `supabase-postgres-best-practices`
- `supabase-server`
- `tailwind-css-patterns`
- `typescript-advanced-types`
- `vite`
- `zod`

Nota: `capacitor-plugins` fue marcada por el CLI con Snyk High Risk. Revisar antes de usarla en cambios sensibles.

## Comandos utiles

```bash
npm install
npm run dev -- --host 127.0.0.1
npm run build
npx cap sync
npx cap open ios
```

Para probar iOS:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Luego correr en Xcode con simulador o dispositivo real.

## Documentos clave

- `docs/requirements.md`: PRD inicial.
- `docs/design.md`: UI kit y pantallas iniciales.
- `docs/screens.md`: mapa completo de pantallas.
- `docs/flows.md`: flujos empleado, manager y RH.
- `docs/rules.md`: reglas de negocio.
- `docs/api.md`: contratos de servicios.
- `docs/tech.md`: decisiones tecnicas.
- `docs/tasks.md`: backlog y estado.

## Migracion Supabase aplicada

Archivo local:

```txt
supabase/migrations/20260628163000_create_profiles_leave_requests.sql
```

Aplicado por MCP al proyecto:

```txt
wtycqdnrulknhzheqflq
```

Incluye:

- Enums `user_role`, `leave_type`, `leave_status`, `schedule_type`, `approval_decision`.
- Tablas `profiles`, `leave_requests`, `leave_request_approvals`.
- Trigger para crear `profiles` al registrar usuarios de Supabase Auth.
- Backfill idempotente para usuarios existentes de Supabase Auth sin perfil.
- Trigger para estado inicial de solicitudes: `pending_manager` si hay `manager_id`, `pending_hr` si no.
- RLS y grants para `authenticated`.

Nota: el proyecto remoto conserva tablas anteriores en espanol (`empleados`, `solicitudes_permiso`, etc.). No se borraron.

## Siguiente paso recomendado

1. Crear usuarios reales en Supabase Auth.
2. Confirmar/editar sus filas en `profiles` (`role`, `full_name`, `job_title`, `manager_id`).
3. Probar manualmente:
   - empleado crea solicitud
   - manager aprueba/rechaza
   - RH aprueba/rechaza
4. Terminar registro y recuperacion de password.
5. Agregar detalle manager dedicado y busqueda real en RH.
6. Decidir si se migran o eliminan las tablas anteriores en espanol.

## Cuentas de prueba

Las credenciales sugeridas estan en [docs/test-accounts.md](/Users/leoglez/Documents/Personal%20Trabajos%20Mac/app-xignis/docs/test-accounts.md).

La guia paso a paso para crearlas en Supabase esta en [docs/supabase-test-setup.md](/Users/leoglez/Documents/Personal%20Trabajos%20Mac/app-xignis/docs/supabase-test-setup.md).

## Estado de verificacion

Ultimas verificaciones realizadas durante el desarrollo:

```bash
npm run build
```

Tambien se verifico con Supabase MCP:

- `list_tables` confirmo `profiles`, `leave_requests` y `leave_request_approvals` con RLS.
- `get_advisors security` ya no reporta warnings nuevos por las tablas agregadas.
- `get_advisors performance` marca indices nuevos como `unused_index` porque aun no hay trafico/datos.
- Persisten warnings previos del proyecto remoto sobre tablas antiguas, bucket publico, `process_pending_invitations()` y leaked password protection.
