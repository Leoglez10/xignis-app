# Feature: Owner Team Approvals

**Estado**: en progreso · **Branch**: `feat/owner-team-approvals`

## Contexto
Un owner puede ser `manager_id` de encargados. Hoy esas solicitudes quedan trabadas en `pending_manager`: `private.can_manager_review` solo admite `manager`/`admin` y las rutas `/manager/*` solo admiten `manager`.

## Decisiones
- "Jefe" es una relación (`manager_id = yo`), no un rol. El owner con reportes directos revisa como jefe.
- Revierte parcialmente la decisión de Fase 4 ("el dueño no aprueba nada"): solo aplica a sus reportes directos; el resto del panel owner sigue read-only.
- Se reusan pantallas de manager; el shell se elige por rol para que el owner conserve su navegación.
- Descartado: saltar al owner y enviar directo a RH (pierde control de su equipo).

## Tareas
- [x] T1: Auditoría DB de policies/funciones usadas por pantallas de jefe que filtren por rol `manager` (inline/delegado: delegado, 4+ archivos)
- [x] T2: Migración: permitir `owner` donde la autoridad es `manager_id = auth.uid()` (no aplicada al remoto sin confirmación)
- [x] T3: Hook `useHasDirectReports`
- [x] T4: Rutas `/manager/*` admiten `owner` + shell por rol + ítem "Mi equipo" condicional en nav owner
- [ ] T5: Verificación: vitest + build; prueba manual con cuentas de test pendiente de migración aplicada

## Checks
- TDD: sin configuración explícita → checks funcionales. Runner: `npm test` (vitest), `npm run build`.

## Evidencia de commits
- `c89fb2e` fix(hr): allow owners to review their direct reports' requests
- `07a3c20` feat(owner): team approvals for owners with direct reports

## Verificación
- `npm test`: 25 archivos, 97 tests OK. `npm run build` (tsc + vite) OK.
- T5 pendiente: prueba manual con cuentas de test. Migración `20260924214007` aplicada al remoto (prod wtycqdnrulknhzheqflq); 0 owners con reportes hoy.

## Pendientes / riesgos
- `listManagers` excluye `owner`: RH no puede asignar owner como jefe desde la UI.
- Swipe de `PageTransition` no incluye "Mi equipo" (tap sí funciona).
- Búsqueda (`searchService`/`SearchScreen`) enlaza a `/admin/...` para owner.
- `/manager/calendar` muestra ausencias de toda la empresa al owner (coherente con su lectura global).

## Extra (aceptado por el usuario)
- `ecd9ed4` `listManagers` incluye `owner` (RH puede asignar owner como jefe).
- Migración `20260924214657` (aplicada a prod): si el jefe es `hr_admin`/`admin`, la solicitud salta a `pending_hr` (el panel RH no podía aprobar el paso de jefe). Verificado con transacción revertida: status = `pending_hr`.
