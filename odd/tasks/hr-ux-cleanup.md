# Feature: HR UX Cleanup (Fase 1)

**Estado**: en progreso · **Branch**: `feat/hr-ux-cleanup`

## Contexto
Fase 1 del plan de mejoras RRHH aprobado. Cambios de UI copy sin migraciones de base de datos.

## Decisiones confirmadas
- Permisos → banco de horas (Fase 2, no acá).
- Exceso de vacaciones → advertir y dejar pasar (Fase 2).
- Reporte RH → checkbox de anonimato, RH siempre ve autor (Fase 5).
- Owners → flag read-only + aviso rápido a RH (Fase 4).

## Tareas

- [x] T1: Quitar letrero "Si tienes jefe asignado..." en `LeaveRequestScreen.tsx`
- [x] T2: Cambiar texto de pantalla de éxito a "Tu solicitud será enviada..."
- [x] T3: Quitar etiquetas de sección "Trabajo" / "Personal" en `ProfileSheet.tsx`
- [x] T4: Destacar fecha de ingreso (y vacaciones por año/pendientes) en `ProfileScreen.tsx`

## Evidencia de commits
- `9cdbdf5` fix(hr): remove assigned-manager notice, flatten profile labels, surface hire date and vacation balance

## Verificación
- `vite build`: OK (1m33s)
- `tsc --noEmit`: BLOQUEADO por entorno (cuelga en este host)
- `vitest run`: BLOQUEADO por entorno (workers no responden; probado forks/threads/vmThreads y test ajeno a los cambios)
- El único test que toca `LeaveRequestScreen` no referencia los textos cambiados; no hay tests de ProfileSheet/ProfileScreen.
