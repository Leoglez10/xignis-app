# Estado de mejoras — 2026-07-12

Resultado de implementar `mejoras-2026-07-12.md`. Solo se tocó lo que quedó
completo al 100%; el resto queda apuntado aquí con su fase original.

Build ✅ · `tsc --noEmit` ✅ · 22 tests ✅

## ✅ Verificación remota Supabase — 2026-07-14

- MCP autenticado contra `wtycqdnrulknhzheqflq`; se comparó el historial remoto
  antes de escribir. Las cinco migraciones hasta `employment_status` ya estaban
  aplicadas con versiones remotas `20260712224918`–`20260712225036`.
- Se aplicó únicamente la migración realmente faltante
  `add_coverage_contact` (remota `20260714214345`) y se verificó la columna
  `public.leave_requests.coverage_contact`.
- Se añadió y aplicó `20260714170000_harden_p1_remote_schema.sql` (remota
  `20260714214352`): políticas con `TO authenticated`, operaciones de escritura
  separadas, revocación total a `anon`, privilegios mínimos para
  `authenticated` e índices de las FK `app_settings.updated_by` y
  `employment_events.created_by`.
- Verificado: RLS activa en las tres tablas; `authenticated` solo tiene SELECT
  sobre `employment_events`; las funciones `SECURITY DEFINER` revisadas no son
  ejecutables por `PUBLIC`, `anon` ni `authenticated`; el esquema `public` no
  permite CREATE a esos roles.
- Advisors posteriores: seguridad conserva un warning externo — activar Leaked
  Password Protection en Auth; rendimiento quedó sin warnings, solo avisos INFO
  de índices todavía no usados.
- No se modificaron datos de negocio. El flujo multirol sigue bloqueado por
  cuentas/fixtures dedicados.

---

## ✅ Completado en esta sesión (P0 + quick wins)

| Ticket | Qué se hizo | Archivos |
|---|---|---|
| P0-1 | Migración: trigger `notify_leave_status_change` ahora notifica a RRHH en `approved`/`rejected` (excluye al revisor que ejecutó la acción, reusa tipo `request_update`) | `supabase/migrations/20260712120000_notify_hr_on_closure.sql` |
| P0-2 | Deep link: rama `!profile` de `RequireAuth` conserva `state={{from}}` | `src/app/RequireAuth.tsx` |
| P0-4 | Reglas operativas en backend: tabla `app_settings` + RLS (lectura autenticados, escritura hr_admin/admin) + `route_leave_request` lee `requireManagerApproval` + `settingsService` + `AdminRulesScreen` lee/escribe backend con loading/error | migración `20260712130200_app_settings.sql`, `settingsService.ts`, `AdminRulesScreen.tsx`, `database.types.ts` |
| P0-5 | ErrorBoundary global alrededor de `<Suspense>`: chunk lazy fallido → fallback "Algo falló" + recargar | `src/app/ErrorBoundary.tsx`, `App.tsx` |
| P0-7 | Rechazo requiere motivo: Manager ahora tiene textarea (flujo de 2 pasos, botón bloqueado sin texto); Admin bloquea "Rechazar" con comentario vacío | `ManagerRequestDetailScreen.tsx`, `AdminRequestDetailScreen.tsx` |
| P0-8 | `leaveTypeLabel` única fuente en `leave-requests/config.ts`; borrado helper duplicado de `leaveRequestProgressService` | `leaveRequestProgressService.ts` |
| P0-10 | `SetPasswordScreen`: estado "Verificando enlace…" mientras hidrata sesión, sin flash de "enlace inválido"; borrado estado muerto `ready` | `SetPasswordScreen.tsx` |
| P0-12 | `successHaptic()` tras cancelar solicitud; añadido también tras aprobar/rechazar (manager y admin) | `LeaveRequestDetailScreen.tsx` y detail screens |
| P2-8 | PWA instalable: `manifest.webmanifest` completo (name, start_url, display standalone, theme_color, iconos con rutas correctas servidas desde `public/icons/`), `apple-touch-icon.png` 180px generado, meta iOS (`apple-mobile-web-app-*`) y `description` en `index.html` | `index.html`, `public/manifest.webmanifest`, `public/icons/`, `public/apple-touch-icon.png` |
| P4-5 (parcial) | `PageTransition` respeta `prefers-reduced-motion` vía `useReducedMotion` de framer-motion: sin slide programático ni gesto de arrastre (el CSS ya lo cubría para keyframes, pero no para animaciones JS) | `src/app/PageTransition.tsx` |

### Ya estaban hechos en el código (doc desactualizado)
- **P0-3** CSV: ambos screens ya exportan `filtered`.
- **P0-6** Edge functions ya validan `getUser(token)` → 401 y rol → 403.
- **P0-9** `InviteSheet` ya deshabilita botón + spinner con estado `saving`.
- **P0-11** `eachDayIso` ya tiene guard (`< 400`).
- Base nativa ya sólida: `overscroll-behavior: none`, `-webkit-tap-highlight-color`,
  `viewport-fit=cover` + safe-area insets, `prefers-reduced-motion` en CSS,
  font stack de sistema (San Francisco/Roboto según plataforma), easing estilo iOS.

---

## ✅ Completado en iteración 2 (P1 + P3 cierre)

| Ticket | Qué se hizo | Archivos |
|---|---|---|
| P1-4 | Reports: filtro por área (`<ReportSelect label="Área">`) poblado desde `listActiveDepartments()`, `filtered` filtra por `employee.department_id`; nuevo widget `DepartmentBreakdown` (barras horizontales por área con aprobadas/pendientes/rechazadas) debajo de KPIs; grid filtros ahora 5 columnas | `AdminReportsScreen.tsx`, `components/DepartmentBreakdown.tsx` |
| P3-4 | `getRecentTerminations(30)` en dashboardService + `RecentTerminationsWidget` (top-6 bajas, avatar rojo, separación tipo label, fecha). Montado en `AdminDashboardScreen` junto a onboarding/inactivos | `dashboardService.ts`, `components/RecentTerminationsWidget.tsx`, `AdminDashboardScreen.tsx` |
| P3-5 | `listEmploymentEvents(userId)` service + componente `EmploymentTimeline` (timeline visual con icono/tone por tipo: alta, cambios de área/jefe, baja, descripción from→to); montado en `ProfileScreen` para usuarios con eventos. La tabla `employment_events` ya se llenaba por trigger `log_employment_event` de la migración P3 | `profileService.ts`, `components/EmploymentTimeline.tsx`, `ProfileScreen.tsx` |

---

## ✅ Completado en iteración 3 (P2 responsive desktop)

| Ticket | Qué se hizo | Archivos |
|---|---|---|
| P2-1 | `AdminShell` ahora envuelve contenido en grid `lg:grid-cols-[220px_1fr]` con `AdminSidebar` visible en lg+. `AdminSidebar` reestilada `lg:sticky lg:top-0 lg:h-dvh`. Borre `AdminBottomNav` (no se usaba). La migración incluye `AdminDashboardScreen` (antes tenía `<main>` propio) → ahora usa `AdminShell` | `components/adminNav.tsx`, `AdminDashboardScreen.tsx` |
| P2-2 | Nuevo `managerNav.tsx` con `managerNavItems` (Inicio, Equipo, Agenda) + `ManagerSidebar` (clon visual de Admin) + `ManagerShell`. Migradas 4 pantallas manager de `<main>` directo a `ManagerShell`: `ManagerDashboardScreen`, `ManagerTeamScreen`, `ManagerCalendarScreen`, `ManagerMemberDetailScreen` (incluye branches loading/error). `ManagerRequestDetailScreen` sigue usando `RequestDetailLayout` (tiene su propio `<main>` para full-screen enfocado) | `features/manager/components/managerNav.tsx` (nuevo), 4 pantallas |
| P2-3 | `BottomSheet` muta a modal centrado en lg+: `lg:bottom-auto lg:inset-y-0 lg:my-auto lg:h-fit lg:max-h-[85dvh] lg:max-w-lg lg:rounded-[28px]`. Handle oculto en desktop (`lg:hidden`). Sigue siendo bottom drawer en mobile con arrastre/inercia | `components/ui/BottomSheet.tsx` |
| P2-4 | `EmployeesScreen` grid responsivo ampliado: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (antes 2 fijos en sm+). Más densidad en desktop real. Pendiente hacer componentización `DataTable` -> P4-2 | ` EmployeesScreen.tsx` |
| P2-5 | TopBar fila de pestañas ahora `lg:hidden`: en desktop el sidebar provee la navegación, el topbar queda solo con avatar + título + búsqueda + notificaciones + switcher. Elimina duplicidad visual | `components/TopBar.tsx` |
| P2-6 | Nuevo hook `usePageTitle(title)` que escribe `data-page-title` en el `<main id="main-content">`. `TopBar` lee ese atributo vía `MutationObserver` y lo usa como título en lugar del fallback de `titleForPath`. Montado en: `AdminRequestDetailScreen` ("Detalle RH"), `ManagerRequestDetailScreen` ("Detalle"), `ManagerMemberDetailScreen` (nombre del miembro, dinámico), `LeaveRequestScreen` ("Nuevo permiso"), `LeaveRequestDetailScreen` ("Mi solicitud"). Resuelve bug de "Inicio" falso en rutas detalle. | `lib/usePageTitle.ts` (nuevo), `TopBar.tsx`, 5 pantallas |
| P2-7 | Tokens `--content-max-employee` (32rem), `--content-max-manager` (64rem), `--content-max-admin` (80rem) en `:root`. `--topbar-h` ahora 6.5rem en lg+ (sidebar reemplaza fila de pestañas) | `styles/globals.css` |
| P2-8 | Ya estaba completo de la iteración anterior (PWA meta). | — |

### Pendiente P2 (no bloqueante)
- `DataTable` componentizada con sort + sticky header -> P4-2.
- `EmployeesScreen` tabla dedicada en xl (hoy 4 cards en grid). Prefiero cards densos — decisión de diseño abierta.
- `BottomSheet` en desktop sigue siendo arrastrable via vaul (gesture mouse). Aceptable.

---

## 📊 Estado global tras iteración 3

## ✅ Implementado en iteración 4 (P4 + P5)

### P4 — UX, accesibilidad y UI kit

| Ticket | Resultado |
|---|---|
| P4-1 | `QueryClientProvider`, keys compartidas, retry/cache y hooks `useLeaveRequests`, `useLiveLeaveRequest`, `useTeam`, `useDashboardStats`. Dashboards empleado/manager/admin, reports, equipo, detalle live, reglas, timeline y lista paginada usan React Query; Realtime invalida caché. Se eliminaron los `mountedRef` de features (AuthContext conserva un guard de bootstrap de sesión). |
| P4-2 | UI kit nuevo: `Select`, `TextArea`, `PasswordField`, `DateInput`, `Modal`, `Avatar`, `Badge/Chip`, `Card`, `Skeleton`, `EmptyState`, `Tabs`, `Toast`, `ConfirmDialog`; `Button` tiene `danger`, `ghost` y `loading`; `TextInput` tiene hint y asterisco required. Selects e iniciales quedaron centralizados. |
| P4-3 | `USER_ROLES` es fuente única; `soonModulesById` fue reemplazado por `getModules/getModuleById`; iniciales viven en `lib/avatar.ts`; colores nuevos usan tokens. |
| P4-4 | Providers globales Toast/Confirm. Confirmación aplicada a cancelar solicitud, logout y acciones en lote; feedback global en cancelación y lote. |
| P4-5 | Un solo `h1` autenticado (TopBar); foco post-transición; reduced motion/transparency; `StepDots` expone valores ARIA; BottomSheet conserva focus ring; borrado swipe anuncia por `aria-live`; contraste primario usa texto oscuro semántico. |
| P4-6/7 | Dark mode por sistema/manual y pantalla `/settings` con tema, idioma, preferencias de notificación, privacidad de cumpleaños, tablero y versión/build. |
| P4-8/9 | Wizard persiste draft versionado en `sessionStorage` y advierte solapamientos con solicitudes propias activas. |
| P4-10/11 | Saldo muestra días pendientes por separado y submit termina en pantalla “Solicitud enviada” con resumen antes del detalle. |
| P4-12/13 | Toggle de privacidad de cumpleaños; estados vacíos/CTA por rol conservados para primer uso. |
| P4-14 | Vitest + jsdom + Testing Library + jest-dom + axe. 14 archivos / 32 pruebas previstas al cierre; cubre TopBar, BottomSheet, RequireAuth, AuthContext, UI y validación del wizard. |

### P5 — Producción

| Ticket | Resultado |
|---|---|
| P5-1 | Sentry React + Capacitor inicializa solo con `VITE_SENTRY_DSN`; ErrorBoundary reporta excepciones sin PII. Requiere DSN de producción para recibir eventos. |
| P5-2 | `@capacitor/network` + banner offline global; plugins Android/iOS sincronizados. |
| P5-3 | `/buscar` real, con alcance por RLS/rol para personas y solicitudes por nombre, fecha o UUID. |
| P5-4 | i18next/react-i18next con español, stub inglés y primer namespace auth migrado; selector en Settings. |
| P5-5 | `range()` server-side en solicitudes/notificaciones; lista empleado usa infinite query “Ver más” y campana carga bloques adicionales. Consultas agregadas siguen sin límite para no truncar reportes. |
| P5-6 | Exportación PDF lazy (`jspdf` + autotable) además de CSV filtrado. |
| P5-7 | Responsable suplente en wizard, resumen y detalle. Migración nueva `20260713033636_add_coverage_contact.sql`. |
| P5-8 | Versión/build en Settings + `public/version.json` con check `no-store`. Es alternativa web/Capacitor al OTA propietario; no requiere Capawesome Cloud. |
| P5-9 | Advisors remotos ejecutados mediante MCP. Seguridad: un warning de Leaked Password Protection desactivado. Rendimiento: sin warnings tras endurecer políticas e indexar las dos FK detectadas; quedan avisos INFO de índices aún no usados. |
| P5-10 | Auth storage usa Capacitor Preferences (UserDefaults/SharedPreferences) en nativo y localStorage en web; Privacy Manifest iOS incluido. |
| P5-11 | Playwright + CI; smoke desktop y Pixel 7: 4/4 verde. El flujo multirol con datos reales requiere credenciales/fixtures E2E dedicados. |
| P5-12 | Storybook se mantiene opcional y no se agregó para evitar otra superficie de build. |
| P5-13 | Deep links `xignis://` configurados en iOS/Android y manejados por `@capacitor/app`. |

### Verificación iteración 4

- `npx tsc --noEmit` ✅
- `npm test` ✅ (32 pruebas)
- `npm run build` ✅
- `npm run test:e2e` ✅ (4/4 Chromium desktop + Pixel 7)
- `npx cap sync` ✅ (App, Haptics, Network, Preferences y Sentry en iOS/Android)
- Cobertura V8: 36.03% statements global. El objetivo histórico de 80% en todos los servicios aún no se cumple; no se falseó el umbral.
- `npm audit`: 8 avisos (6 high, 2 moderate), todos en tooling de desarrollo transitivo de `@capacitor/assets`/`@trapezedev`; npm no ofrece fix completo actualmente.

### Bloqueos externos restantes

Verificación del 2026-07-14: el MCP autenticado responde para el proyecto remoto
`wtycqdnrulknhzheqflq` y el advisor sigue reportando únicamente
`auth_leaked_password_protection`. El MCP instalado no ofrece operaciones para
modificar Auth o Integrations/Data API. Supabase CLI no está disponible en el
`PATH` de esta sesión, por lo que no existe una sesión CLI autenticada que pueda
usarse ni comandos locales que permitan cerrar esos toggles sin adivinar flags.

1. Activar Leaked Password Protection en Supabase Auth (configuración de
   Dashboard; [documentación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).
2. Proveer `VITE_SENTRY_DSN` en el entorno de despliegue y verificar un evento
   controlado sin PII.
3. Proveer cuentas/fixtures de employee, manager y admin para automatizar y
   verificar el E2E multirol completo.
4. Confirmar en Dashboard la configuración de exposición automática de Data
   API. Los privilegios remotos ya quedaron explícitos y mínimos, pero el MCP no
   expone ese toggle de Integrations.

La configuración de Sentry está implementada (`@sentry/react` y
`@sentry/capacitor`), es opt-in mediante `VITE_SENTRY_DSN`, desactiva PII por
defecto y solo envía eventos en builds de producción. Los smoke E2E no requieren
credenciales; el flujo multirol todavía sí requiere fixtures/cuentas dedicadas.

En esta sesión no fue posible refrescar TypeScript/tests/build/E2E: Node intenta
abrir `/System/Library/OpenSSL/openssl.cnf`, ruta denegada por el entorno, y con
`OPENSSL_CONF=/dev/null` Vitest/TypeScript finalizan con código 255 sin
diagnóstico. Se conservan como última evidencia válida los resultados verdes de
la iteración 4; no se declaran revalidados hoy.

---

| Fase | Estado | Detalle |
|---|---|---|
| P0 (12 tickets) | ✅ completo | Notif RRHH, deep link, CSV, settings backend, ErrorBoundary |
| P1 (1-5) | ✅ completo | Filtro área en reports + breakdown + paid + wizard + assign |
| P1-6 seed | ⏳ bloqueado Leo | Falta lista de áreas reales para seed |
| P2 (1-8) | ✅ completo en código | Sidebar manager, modal desktop, PWA, títulos, tokens |
| P3-1,2,4,5 | ✅ completo | Soft-delete + SeparationSheet + widget bajas + timeline |
| P3-3 reactivación | ⏳ pendiente | Requiere nueva edge function `admin-reactivate-user` |
| P3-6 placeholder | ⏳ futuro | `social_security_number`, `salary_history` sin tocar |
| P4 | 🟡 implementado, DoD parcial | UI kit, React Query, dark mode y tests listos; cobertura global/servicios aún bajo 80% |
| P5 | 🟡 implementado, requiere configuración | Código listo; faltan DSN, advisors remotos y fixtures E2E multirol |

### Acción requerida
- Aplicar las **5 migraciones nuevas** a Supabase (sin cambios respecto iteración 2).
- Verificar en navegador desktop (≥1024px) que el sidebar manager/admin aparece a la izquierda.
- Verificar que `BottomSheet` se ve centrado en desktop (lg+).
- Verificar título de "Detalle de Miembro" en TopBar cambia según el nombre del miembro.
- Pedir a Leo la lista de áreas reales para el seed P1-6.

### Migraciones nuevas (no aplicadas todavía)
- `20260712120000_notify_hr_on_closure.sql` (P0-1)
- `20260712130000_departments.sql` (P1-1)
- `20260712130200_app_settings.sql` (P0-4)
- `20260712140000_leave_requests_paid.sql` (P1-5)
- `20260712150000_employment_status.sql` (P3-1, incluye `employment_events` + trigger)

**Total:** 5 migraciones nuevas. Aplicar todas juntas vía `supabase db push`
o pegar en SQL editor del proyecto (`wtycqdnrulknhzheqflq`).

Sin aplicarlas: pantalla Reglas cae al fallback de defaults (no crashea),
RRHH no recibe notif de cierre, departamentos no existen (DepartmentsScreen
vacío, listActiveDepartments devuelve []), wizard no persiste `paid`, widget
de bajas recientes vacío, timeline laboral vacío.

---

## 📋 Pendiente consolidado

### P0 restante
- **P0-4 (extensión)**: edge function `admin-upsert-settings` omitida; la RLS
  de `app_settings` ya restringe escritura. Solo añadir si se necesita validación
  adicional de payload.
- **P0-6 (extensión)**: mover `PROTECTED_EMAILS` de hardcode a `app_settings`.

### P1 restante
- **P1-6**: seed de departamentos reales — bloqueado por Leo pasando la lista
  de áreas actuales de la agencia. Mientras tanto el CRUD de
  `DepartmentsScreen` permite crearlas a mano.

### P3 restante
- **P3-3 (InviteSheet reactivación)**: requiere nueva edge function
  `admin-reactivate-user` para des-banear auth user + resetear
  `employment_status` a `active` + limpiar `terminated_at`/`separation_type`/
  `termination_reason`. Hoy `admin-create-user` ya upserta profile, pero
  `auth.admin.inviteUserByEmail` falla si el auth user ya existe. Flujo propuesto:
  1. `InviteSheet` al escribir email, consulta si ya existe perfil terminado
     (requiere RPC nueva `lookup_archived_email` SECURITY DEFINER, o edge
     function con service role).
  2. Si existe: muestra aviso "Este empleado ya estuvo registrado, fue dado
     de baja el X" + botón "Reactivar".
  3. "Reactivar" invoca `admin-reactivate-user` que
     `admin.auth.admin.updateUserById(id, { ban_duration: 'none' })` + upserta
     profile con `employment_status='active'`, `terminated_at=null`, etc.
- **P3-5 (extensión)**: timeline laboral hoy solo en `ProfileScreen` (perfil
  propio). Montarlo también en `EmployeesScreen` edit/detail sheet o crear
  `AdminEmployeeDetailScreen` dedicada (futuro P4).
- **P3-6 (placeholder futuro)**: `social_security_number text`,
  `salary_history jsonb` en profiles — no agregados todavía. Reunión mencionó
  "futuras expansiones más allá de los datos básicos de empleo" — pospuesto.

### P2 restante (no bloqueante)
- `DataTable` componentizada con sort + sticky header → P4-2.
- `EmployeesScreen` tabla dedicada en xl (hoy 4 cards en grid). Decisión de
  diseño abierta.
- `BottomSheet` en desktop sigue arrastrable via vaul (gesture mouse).
  Aceptable.
- `ManagerRequestDetailScreen` / `AdminRequestDetailScreen` no muestran
  sidebar (usan `RequestDetailLayout` con `<main>` propio full-screen).
  Aceptable para vista enfocada.

### P4 — UX / a11y / UI kit (implementado; cobertura 80% pendiente)
- React Query migration (borrar patrones mountedRef).
- UI kit: `Select`, `TextArea`, `Modal`, `Avatar`, `Toast`+`useToast`,
  `ConfirmDialog`, variantes de `Button`, etc.
- Dark mode (`[data-theme="dark"]` — los tokens semánticos ya existen).
- Settings screen, wizard draft en `sessionStorage`, warning de solapamiento,
  multi-h1, focus management post-transición, contraste `#0DEC0D` (auditar
  WCAG AA — probable fallo con texto blanco), tests de componentes.

### P5 — Producción (implementado; configuración externa pendiente)
- Sentry, offline banner (`@capacitor/network`), búsqueda real `/buscar`,
  i18n scaffold, paginación server-side, PDF export, OTA / version display,
  Supabase advisors audit, storage durable iOS, Playwright E2E.

---

## Novedades detectadas (candidatas a P4 / P5)

- **View Transitions API** como alternativa nativa al slide de framer-motion en
  navegadores que la soportan (menos JS en hilo principal).
- **`Notification` API web + badge PWA** para el contador de notificaciones
  cuando corre instalada como PWA de escritorio.
- **`content-visibility: auto`** en listas largas de solicitudes (render perf
  gratis, sin virtualización).
- **Skeleton coherente**: ya hay `--skeleton-base`; extraer componente cuando
  se haga el UI kit (P4-2).
