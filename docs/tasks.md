# Xignis App - Backlog Inicial

## Fase 0 - Definicion

- [x] Leer PRD y especificacion visual existente.
- [x] Cargar guia de diseno en OpenPencil.
- [x] Crear primeras pantallas mobile-first en OpenPencil.
- [x] Documentar recomendacion de stack.
- [x] Confirmar stack final: Capacitor.
- [x] Confirmar recuperacion de password simple con Supabase.
- [x] Confirmar admin/RH con experiencia principal en computadora.
- [x] Documentar mapa completo de pantallas.
- [x] Crear propuesta UX v1 en OpenPencil con mobile, RH desktop y 404.
- [x] Documentar rol jefe/manager.
- [x] Crear propuesta Manager UX v1 en OpenPencil.

## Fase 1 - Scaffold

- [x] Crear app React + Vite + TypeScript.
- [x] Instalar Tailwind CSS.
- [x] Instalar Capacitor.
- [x] Configurar rutas base.
- [x] Configurar Supabase client.
- [x] Crear variables de tema.
- [x] Crear componentes UI base.

## Fase 2 - Auth

- [x] Login UI mock.
- [x] Login conectado a Supabase.
- [ ] Registro.
- [ ] Recuperacion de password.
- [x] Validacion de rol real contra perfil.
- [x] Proteccion de rutas.

## Fase 3 - Solicitudes empleado

- [x] Dashboard de empleado conectado a datos reales.
- [x] Formulario de solicitud conectado a Supabase.
- [x] Bottom sheet accesible de fechas.
- [x] Bottom sheet accesible de tipo de permiso.
- [x] Detalle de solicitud conectado a Supabase.
- [x] Pantalla 404.
- [x] Selector de horario.
- [x] Campo/lista de actividades pendientes.
- [x] Crear solicitud en Supabase.
- [x] Historial de solicitudes.

## Fase 4 - Admin

- [x] Dashboard admin conectado a datos reales.
- [x] Lista de solicitudes pendientes conectada a Supabase.
- [x] Detalle de solicitud conectado a Supabase.
- [x] Aprobar solicitud.
- [x] Rechazar solicitud con motivo.

## Fase 4.5 - Jefe / Manager

- [x] Dashboard manager conectado a datos reales.
- [x] Lista de solicitudes del equipo conectada a Supabase.
- [x] Calendario de ausencias del equipo.
- [ ] Detalle manager en ruta dedicada.
- [x] Aprobar solicitud como manager.
- [x] Rechazar solicitud como manager.
- [x] Pasar solicitud aprobada a RH.

## Fase 5 - Produccion

- [x] Configurar proyecto Supabase.
- [x] Crear migraciones SQL.
- [x] Activar RLS.
- [ ] Configurar iOS con Capacitor.
- [ ] Probar en simulador.
- [ ] Probar en dispositivo fisico.
- [ ] Preparar TestFlight.

---

# Backlog profesional — Mejoras 2026-07-12

Plan completo en `docs/mejoras-2026-07-12.md`. 59 tickets en 6 fases.
Rama `main` + una rama por fase, PR individual.

## P0 — Estabiliza (rama `mejora/p0-estabiliza`)

- [ ] P0-1 Notificaciones a RRHH en cierre de solicitud (approve/reject)
- [ ] P0-2 Deep link roto en RequireAuth (`state={{from}}` perdido)
- [ ] P0-3 CSV exporta todo, no lo filtrado (Reports + Dashboard)
- [ ] P0-4 Reglas operativas en backend (tabla `app_settings` + trigger)
- [ ] P0-5 Error Boundary global en App.tsx
- [ ] P0-6 Edge functions: auditar claim JWT + PROTECTED_EMAILS de settings
- [ ] P0-7 Reject requiere comentario en UI (manager + admin)
- [ ] P0-8 Dedup `leaveTypeLabel` (3 fuentes → 1)
- [ ] P0-9 InviteSheet: disable + spinner anti doble-tap
- [ ] P0-10 SetPasswordScreen: estado loading distinto a invalid
- [ ] P0-11 `eachDayIso` guard safety + limitar query backend
- [ ] P0-12 CancelLeaveRequest: successHaptic tras exit

**DoD:** deep link funciona, CSV respeta filtros, reglas backend, RRHH
notificada en cierre, chunk roto cae en ErrorBoundary, reject sin motivo
bloqueado.

## P1 — Departamentos y tipos de permiso (rama `mejora/p1-departamentos`)

- [ ] P1-1 Tabla `departments` + `profiles.department_id` + RLS + realtime
- [ ] P1-2 Pantalla CRUD `/admin/departaments` + servicio + nav
- [ ] P1-3 Asignar departamento en Employees (Edit + Invite + edge fn)
- [ ] P1-4 Filtro + breakdown por área en Reports
- [ ] P1-5 `leave_requests.paid boolean` + wizard toggle + balance solo paid
- [ ] P1-6 Seed de departamentos ( cuando Leo pase la lista )

**DoD:** RRHH crea/edita/archiva áreas, reports filtran por área, wizard
pregunta con/sin goce.

## P2 — Responsive desktop (rama `mejora/p2-responsive-desktop`)

- [ ] P2-1 Layout system por rol (manager sidebar, admin shell unificado)
- [ ] P2-2 `ManagerSidebar` + `ManagerShell`, nav desktop
- [ ] P2-3 `BottomSheet` muta a `Modal` centrado en desktop
- [ ] P2-4 `DataTable` componente + table/cards por breakpoint
- [ ] P2-5 TopBar desktop: sin tabs amontonados, tabs van al sidebar
- [ ] P2-6 `usePageTitle()` hook para títulos de detalle
- [ ] P2-7 Layout breakpoints audit + tokens de content-max
- [ ] P2-8 PWA meta + manifest + apple-touch-icon

**DoD:** manager ve sidebar en ≥1024px, modales centrados en desktop,
PWA instalable, Lighthouse responsive 100.

## P3 — Alta / Baja con razón de separación (rama `mejora/p3-alta-baja`)

- [ ] P3-1 `employment_status` + `terminated_at` + `termination_reason` +
      `separation_type` en profiles
- [ ] P3-2 `SeparationSheet` wizard (aviso + ack + razón + ejecutar soft-delete)
- [ ] P3-3 `InviteSheet` muestra historial de reactivación
- [ ] P3-4 Filtros de estado de empleo en Employees + Reports + dashboard
- [ ] P3-5 Tabla `employment_events` + trigger + timeline en profile admin
- [ ] P3-6 Placeholder schema: `social_security_number`, `salary_history`
      (no llenar todavía)

**DoD:** RRHH da de baja con razón, empleado terminado no loguea, datos
hist orales conservados, widget bajas recientes.

## P4 — UX, a11y, UI kit, React Query (rama `mejora/p4-ux-a11y-kit`)

- [ ] P4-1 React Query provider + migrar servicios a hooks
- [ ] P4-2 UI kit: Select, TextArea, PasswordField, DateInput, Modal, Avatar,
      Badge, Card, Skeleton, EmptyState, Tabs, Toast, ConfirmDialog
- [ ] P4-3 Dedup fuentes de verdad (`soonModulesById`, `ALL_ROLES`, hover
      literals → tokens)
- [ ] P4-4 Toast provider + `useToast()` + `useConfirm()` reemplaza alerts
- [ ] P4-5 A11y: multi-h1, focus mgmt PageTransition, reduced-motion
      framer, BottomSheet focus ring, StepDots aria-valuenow,
      SplashScreen reduced-transparency, notif delete aria-live,
      live region global, contraste audit
- [ ] P4-6 Dark mode completo + system preference + toggle en Settings
- [ ] P4-7 `SettingsScreen` separada de Profile
- [ ] P4-8 Wizard draft persistente en `sessionStorage`
- [ ] P4-9 Solapamiento propio advertido en wizard
- [ ] P4-10 `VacationBalanceCard` pendientes aparte
- [ ] P4-11 Confirmación de submit wizard (sub-pantalla checkmark)
- [ ] P4-12 `BirthdayStrip` privacy toggle
- [ ] P4-13 Onboarding primer login (team vacío, 0 solicitudes)
- [ ] P4-14 Vitest jsdom + tests TopBar/BottomSheet/RequireAuth/AuthContext
      + wizard + umbral 80% cobertura

**DoD:** React Query cache, 0 duplicación Avatar/initials/Select, Toast
reemplaza alerts, Lighthouse a11y 100, axe 0 violations, dark mode completo.

## P5 — Producción, observabilidad, i18n (rama `mejora/p5-produccion`)

- [ ] P5-1 Sentry React + Capacitor native
- [ ] P5-2 `@capacitor/network` + offline banner
- [ ] P5-3 Búsqueda real `/buscar` (profiles + leave_requests)
- [ ] P5-4 i18n provider + `es` completo + `en` stub
- [ ] P5-5 Pagination server-side en listas largas
- [ ] P5-6 PDF export en AdminReports (jspdf + autotable)
- [ ] P5-7 Pending tasks handover (responsable suplente en wizard)
- [ ] P5-8 Version display + OTA (`@capabundles/live-update`)
- [ ] P5-9 Supabase advisor audit (security + performance) → 0 warnings
- [ ] P5-10 Session persistence durable (storageKey seguro)
- [ ] P5-11 Playwright e2e (login → crear → aprobar → notificar)
- [ ] P5-12 Storybook (opcional)
- [ ] P5-13 Deep linking Capacitor (Supabase email → app)

**DoD:** Sentry captura errores, búsqueda real, i18n scaffold, pagination
server-side, PDF export, e2e verde, advisor 0 warnings.

---

## Tareas de acción de la reunión

| Propietario | Tarea | Estado |
|---|---|---|
| Leo | Pasar lista actual de departamentos/áreas | [ ] pendiente |
| Equipo Dev | CRUD de áreas/departamentos | [ ] P1-2 |
| Equipo Dev | Búsqueda/filtro por área en reports | [ ] P1-4 |
| Equipo Dev | Permiso sin pago + con pago | [ ] P1-5 |
| Equipo Dev | Notif empleado + RRHH en approve/reject | [ ] P0-1 |
| Leo | Feedback iterativo | continuo |
