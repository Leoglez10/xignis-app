# Feature: HR Manager Review (Fase 3)

**Estado**: en progreso · **Branch**: `feat/hr-ux-cleanup`

## Contexto
Fase 3 del plan de mejoras RRHH aprobado. Mejorar la vista de autorización del jefe.

## Decisiones confirmadas
- Mostrar saldo de vacaciones y banco de horas del solicitante en el detalle de aprobación.
- Mostrar historial reciente de solicitudes del solicitante.
- Mostrar solapamientos con el equipo en el rango de fechas (servicio `listTeamAbsencesInRange` ya existe).
- Advertencia visible si la solicitud excede el saldo (advertir, no bloquear).
- Comentario opcional al aprobar (hoy solo es obligatorio al rechazar).

## Tareas

- [x] T1: Servicio: balance de vacaciones para un empleado dado + helper banco de horas por empleado
- [x] T2: Detalle de aprobación: panel de contexto del solicitante (saldos, historial, solapamientos, advertencia)
- [x] T3: Verificación (vite build) + tests enfocados si vitest responde

## Evidencia de commits
- `aa435d9` feat(hr): manager approval context panel with balances, history and team overlaps
