# Feature: HR Leave/Time Bank (Fase 2)

**Estado**: en progreso · **Branch**: `feat/hr-ux-cleanup`

## Contexto
Fase 2 del plan de mejoras RRHH aprobado. Separar vacaciones de permisos con banco de horas.

## Decisiones confirmadas
- Permisos → banco de horas por empleado; RH carga horas manualmente; los permisos aprobados descuentan automáticamente.
- Descuento: `time_range` descuenta horas del rango; `full_day` descuenta 8h.
- Solo `leave_type='personal'` descuenta banco (sick/other/vacation no).
- Exceso de saldo de vacaciones → advertir y dejar pasar (no bloquear).
- Banco sin saldo suficiente → advertir y dejar pasar; el saldo puede quedar negativo.
- Descuento al momento de aprobar, atómico en SQL (trigger), con guarda anti doble-descarga.

## Tareas

- [x] T1: Migración SQL `time_bank` (tabla transacciones + saldo + trigger de descuento + RLS)
- [x] T2: Tipos cliente + servicio `getMyTimeBank` / `adjustTimeBank`
- [x] T3: Wizard separado: "Vacaciones" vs "Permiso" (horas) con saldos y advertencias no bloqueantes
- [x] T4: UI RH: sección banco de horas en `EmployeeDetailScreen` (ajuste + historial)
- [x] T5: Dashboard empleado: card de banco de horas
- [x] T6: Verificación (`vite build` exitoso; vitest/tsc rotos en este host)

## Evidencia de commits
- `dd0ea2d` feat(hr): separate vacations from permits with per-employee hour bank
