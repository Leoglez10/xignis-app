# Feature: HR Personal Data, Acts & Reports (Fase 5)

**Estado**: en progreso · **Branch**: `feat/hr-ux-cleanup`

## Contexto
Fase 5 del plan de mejoras RRHH. Tres bloques independientes.

## Decisiones confirmadas
- **5a. Edición de datos personales**: el empleado edita sus datos personales (cumpleaños, nombre, avatar). Puesto y correo NO se editan: mensaje "Para editar puesto y correo, solicítalo a RH".
- **5b. Actas administrativas** (tarjeta amarilla): RH crea actas por empleado (tipo, fecha, motivo); el empleado las ve en su perfil con estilo de tarjeta amarilla; notificación al empleado.
- **5c. Reportes a RH**: cualquier empleado reporta a RH con checkbox "solicitar anonimato". RH SIEMPRE ve el autor; el flag viaja para que no se comparta la identidad. RH resuelve reportes.

## Tareas

- [x] T1 (5a): Edición de datos personales en perfil + mensaje "solicítalo a RH" en puesto/correo
- [x] T2 (5b): Migración `administrative_acts` + UI RH (crear/listar) + UI empleado (tarjeta amarilla) + notificación
- [x] T3 (5c): Migración `hr_reports` + formulario empleado (checkbox anonimato) + pantalla RH con resolución
- [x] T4: Verificación (tsc + vite build) + commits de trabajo

## Evidencia de commits
- `6ed670f` feat(hr): editable personal data with RH-only notice, administrative acts (yellow cards)
- `5061cce` feat(hr): employee-to-RH reports with anonymity request flag
