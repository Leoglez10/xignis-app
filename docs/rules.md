# Xignis App - Reglas de Producto

## Auth

- El rol visible en login no debe ser la fuente de verdad.
- El rol real se lee desde `profiles.role`.
- Nuevos registros entran como `employee` por defecto.
- Crear managers, RH y admins debe ser una accion controlada fuera del registro publico.

## Solicitudes de permiso

- Una solicitud nueva entra como `pending_manager` si el empleado tiene jefe asignado.
- Una solicitud nueva entra como `pending_hr` si no hay jefe asignado.
- `start_date` no puede ser mayor que `end_date`.
- Fechas en pasado deben bloquearse en UI y validarse antes de insertar.
- `leave_type` es obligatorio.
- `schedule_type` es obligatorio.
- Si `schedule_type = time_range`, `start_time` y `end_time` son obligatorios.
- `end_time` debe ser mayor que `start_time`.
- `pending_tasks` puede ser opcional en v1, pero la UI debe promover capturarlo.

## Estados

- Empleado puede crear solicitudes propias.
- Empleado puede ver solo sus solicitudes.
- Jefe puede ver solicitudes de empleados bajo su cargo.
- Jefe puede aprobar o rechazar solicitudes `pending_manager`.
- RH puede ver todas las solicitudes.
- RH puede aprobar o rechazar solicitudes `pending_hr` o `approved_by_manager`.
- Rechazo requiere motivo.
- Una solicitud approved no debe editarse desde cliente empleado.

## UI y accesibilidad

- La app se disena primero para 375px de ancho.
- Bottom sheets deben poder cerrarse con boton visible.
- Acciones primarias usan verde `#00D25B`.
- Botones destructivos o de limpiar no deben colocarse junto a la accion primaria.
- Campos requeridos deben mostrar errores claros bajo el campo o dentro del bottom sheet.
- El boton `Continuar` se mantiene deshabilitado hasta cumplir validaciones minimas.
