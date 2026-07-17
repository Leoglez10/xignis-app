# Siguiente sesión — cierre de mejoras P4/P5

El código principal de P0–P5 ya está implementado. La siguiente sesión debe
concentrarse primero en alinear Supabase remoto, ejecutar los advisors y probar
el flujo completo con los tres roles. Después se atienden cobertura, i18n y los
pendientes funcionales que quedaron fuera del cierre.

## Inicio rápido

1. Leer este archivo y `docs/mejoras-estado-2026-07-12.md`.
2. Ejecutar `/mcp` y confirmar que `supabase` aparece conectado al proyecto
   `wtycqdnrulknhzheqflq`.
3. Consultar el historial remoto de migraciones antes de escribir en la base.
4. Revisar y aplicar únicamente las migraciones realmente faltantes, en orden.
5. Ejecutar advisors de seguridad y rendimiento, corregir hallazgos y probar el
   flujo employee → manager → admin.

> El MCP de Supabase quedó agregado y autenticado globalmente en Codex el
> 2026-07-14. Si una sesión nueva no muestra sus herramientas, reiniciar Codex y
> volver a ejecutar `/mcp`.

## Estado confirmado

| Área | Estado |
|---|---|
| P0 | Completo en código: estabilidad, reglas backend, notificaciones y errores |
| P1 | Completo salvo el seed con las áreas reales |
| P2 | Responsive desktop implementado |
| P3 | Alta/baja e historial implementados; reactivación pendiente |
| P4 | React Query, UI kit, accesibilidad, dark mode y Settings implementados |
| P5 | Código base implementado; falta configuración y validación de producción |
| Supabase MCP | Agregado, autenticado y limitado al project ref correcto |

Última verificación registrada:

- `npx tsc --noEmit` — verde.
- `npm test` — 14 archivos, 32 pruebas.
- `npm run build` — verde.
- `npm run test:e2e` — 4/4 smoke tests desktop y Pixel 7.
- `npx cap sync` — verde para iOS y Android.
- Cobertura global — 36.03% de statements; objetivo pendiente: 80% en servicios.

Estos resultados son el último registro, no sustituyen volver a ejecutar la
verificación después de tocar Supabase o el código.

## Prioridad 1 — Supabase remoto

**Estado 2026-07-14: completada en lo verificable mediante MCP.** Las cinco
migraciones anteriores ya estaban remotas; se aplicó solo
`add_coverage_contact` y una migración adicional de hardening. Se verificaron
columnas, RLS, políticas, grants, triggers, funciones y advisors. No se ejecutó
el flujo multirol sin cuentas reales ni se asumió el toggle de exposición
automática de Data API, que debe confirmarse en Dashboard.

### 1. Inspeccionar antes de aplicar

Usar el MCP para listar las migraciones remotas y comparar con
`supabase/migrations/`. El documento anterior tiene una línea desactualizada
que dice cinco; el total correcto previsto es **seis**:

1. `20260712120000_notify_hr_on_closure.sql`
2. `20260712130000_departments.sql`
3. `20260712130200_app_settings.sql`
4. `20260712140000_leave_requests_paid.sql`
5. `20260712150000_employment_status.sql`
6. `20260713033636_add_coverage_contact.sql`

No asumir que siguen pendientes solo porque están en este documento. Confirmar
el estado remoto. Si el historial remoto no coincide con las migraciones
anteriores del repositorio, detenerse y diagnosticar antes de reparar el
historial o usar opciones equivalentes a `--include-all`.

### 2. Revisión de seguridad previa

Antes de aplicar, revisar estos puntos:

- `departments` y `app_settings` usan `auth.role()` en políticas SELECT. Cambiar
  al patrón actual `TO authenticated` y mantener los predicados de autorización
  necesarios para las escrituras de RRHH/admin.
- Revisar toda función `SECURITY DEFINER`, su `search_path` y los permisos
  `EXECUTE`. Revocar también a `PUBLIC` cuando corresponda.
- Confirmar que RLS esté activa en cada tabla nueva del esquema `public`.
- Verificar en **Integrations → Data API → Settings** si las tablas nuevas se
  exponen automáticamente. Desde abril de 2026 esto puede estar desactivado.
- Si no hay privilegios automáticos, crear una migración explícita de `GRANT`
  para `authenticated`; RLS seguirá decidiendo qué filas y operaciones permite.
- No exponer jamás `service_role` ni secretos en variables `VITE_*`.

Tablas nuevas que necesitan verificación de Data API:

- `departments`: lectura autenticada; escrituras solo RRHH/admin por RLS.
- `app_settings`: lectura autenticada; escrituras solo RRHH/admin por RLS.
- `employment_events`: lectura del propio usuario o RRHH/admin; escritura solo
  mediante trigger.

### 3. Aplicar y verificar

Ruta preferida: usar las herramientas del MCP autenticado para consultar la
base, aplicar las migraciones faltantes en orden y ejecutar advisors.

Alternativa con CLI, si se decide autenticarla por separado:

```bash
npx supabase login
npx supabase link --project-ref wtycqdnrulknhzheqflq
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase migration list --linked
npx supabase db advisors --linked --type security --level warn
npx supabase db advisors --linked --type performance --level warn
```

El `--dry-run` debe mostrar únicamente las migraciones esperadas. Antes del
push real, confirmar que existe un backup/snapshot recuperable. No pegar tokens
en chats, archivos del proyecto ni commits.

Después de aplicar, comprobar con consultas reales:

- Existen `departments`, `app_settings` y `employment_events`.
- `leave_requests` tiene `paid` y `coverage_contact`.
- `profiles` tiene departamento y estado/razón de baja.
- Un usuario normal no puede modificar reglas, departamentos ajenos ni campos
  privilegiados de perfil.
- RRHH sí puede administrar áreas y reglas.
- Aprobar o rechazar genera notificación para empleado y RRHH.
- Cambiar área, jefe o estado laboral crea el evento correspondiente.
- Los advisors quedan sin warnings o con excepciones justificadas por escrito.

## Prioridad 2 — configuración de producción

Comprobación del 2026-07-14: el MCP continúa autenticado contra el proyecto
remoto y el advisor confirma que Leaked Password Protection sigue desactivado.
El MCP disponible no incluye operaciones de configuración de Auth/Data API y
Supabase CLI no está instalado o accesible en el `PATH` de esta sesión. Ambos
ajustes deben realizarse y verificarse en Dashboard, sin adivinar comandos.

- [ ] Crear/configurar el proyecto de Sentry y añadir `VITE_SENTRY_DSN` al
  entorno de despliegue. No se debe guardar el DSN en código si el proveedor de
  hosting permite variables de entorno.
- [ ] Confirmar en producción que ErrorBoundary y errores no controlados llegan
  a Sentry sin PII.
- [ ] Crear cuentas o fixtures E2E dedicados para `employee`, `manager` y
  `admin`/`hr_admin`.
- [ ] Automatizar el flujo completo: login, solicitud, aprobación de manager,
  aprobación de RRHH y notificación al empleado.
- [ ] Volver a ejecutar TypeScript, unit tests, build, E2E y Capacitor sync.
  Intentado el 2026-07-14, pero bloqueado por la política local que impide a
  Node leer `/System/Library/OpenSSL/openssl.cnf`; el workaround con
  `OPENSSL_CONF=/dev/null` termina con código 255 sin diagnóstico.

## Prioridad 3 — Definition of Done todavía incompleta

### Necesario para cerrar formalmente P4/P5

- Subir cobertura de servicios del 36.03% registrado al objetivo de 80%, sin
  bajar ni falsear el umbral.
- Completar i18n. Hoy existe la infraestructura y auth; inglés sigue siendo un
  stub y faltan solicitudes, dashboards y el resto de strings visibles.
- Ejecutar Lighthouse a11y y confirmar 100, además de axe sin violaciones en
  las pantallas principales.
- Completar E2E multirol con datos reales/fixtures; los 4 smoke tests actuales
  no cubren el circuito de aprobación completo.
- Advisors remotos documentados: queda activar Leaked Password Protection; no
  quedan warnings de rendimiento.
- Revisar `npm audit`: el último registro reportó 8 avisos de tooling de
  desarrollo (6 high, 2 moderate) bajo `@capacitor/assets`/`@trapezedev`, sin
  solución completa ofrecida por npm.

### Pendientes funcionales

- **P1-6:** recibir de Leo la lista real de áreas y crear el seed de
  departamentos. El CRUD permite crearlas manualmente mientras tanto.
- **P3-3:** implementar reactivación de exempleados con una Edge Function
  `admin-reactivate-user`, consulta segura del perfil archivado, desbaneo del
  usuario Auth y limpieza de los campos de baja.
- Mostrar el timeline laboral también en la vista administrativa del empleado;
  hoy está disponible en el perfil propio.
- Decidir si `PROTECTED_EMAILS` se mueve del hardcode a `app_settings`.
- Añadir `admin-upsert-settings` solo si se requiere validación de payload más
  estricta que la RLS actual.

## Pendientes opcionales o futuros

- `social_security_number` y `salary_history` siguen pospuestos; requieren
  definición de negocio, privacidad y acceso antes de crear columnas.
- Storybook es opcional y no se instaló.
- El OTA propietario no se añadió; se implementó `public/version.json` como
  actualización compatible con web/Capacitor.
- `EmployeesScreen` conserva cards densas en desktop; una `DataTable` con sort
  y sticky header sigue siendo una decisión de diseño.
- BottomSheet continúa aceptando arrastre con mouse en desktop.
- Las vistas de detalle manager/admin permanecen full-screen sin sidebar por
  decisión de enfoque.
- Candidatos futuros: View Transitions API, badge de notificaciones PWA y
  `content-visibility: auto` en listas largas.

## Precauciones del repositorio

- El worktree contiene muchos cambios previos de P0–P5 y assets nativos.
- No ejecutar `git reset --hard`, no restaurar archivos ajenos y no borrar
  cambios sin confirmar su autoría.
- `ChatGPT.dmg` es ajeno al trabajo y debe permanecer intacto.
- No hay commits creados para este bloque de mejoras.

## Criterio de cierre de la próxima sesión

La sesión puede considerarse cerrada cuando:

- [x] Se verificó el estado remoto y se aplicaron solo las migraciones faltantes.
- [ ] Las tablas, columnas, RLS, grants y triggers están verificados; falta la
  prueba funcional con JWT multirol y confirmar el toggle Data API en Dashboard.
- [x] Advisors de seguridad/rendimiento están documentados.
- [ ] El flujo crítico de los tres roles funciona de extremo a extremo.
- [ ] Sentry recibe un evento controlado en el entorno objetivo.
- [ ] Tests, build y E2E vuelven a estar verdes.
- [ ] Todo bloqueo restante queda actualizado en
  `docs/mejoras-estado-2026-07-12.md`.

Prompt sugerido para continuar:

> Lee `docs/siguiente-sesion-2026-07-14.md`, verifica primero Supabase remoto
> mediante el MCP ya autenticado y ejecuta la Prioridad 1 sin aplicar cambios a
> ciegas. Después actualiza el estado y continúa con los bloqueos de producción.
