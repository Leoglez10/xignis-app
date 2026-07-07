# Xignis App - Mapa de Pantallas

## Principio de experiencia

- **Empleado:** mobile-first, pocos pasos, lenguaje simple y acciones claras.
- **Jefe/Manager:** desktop-first ligero y usable en tablet, enfocado en aprobar solicitudes de su equipo y ver ausencias proximas.
- **RH/Admin:** desktop-first, con tablas, filtros, revision detallada, reportes y auditoria.
- **Sistema:** estados cuidados para errores, vacios, permisos denegados y rutas no encontradas.

## MVP empleado mobile

1. `LoginScreen`
   - Acceso por rol visible y validacion contra `profiles.role`.
4. `EmployeeDashboardScreen`
   - Resumen de solicitudes y CTA principal.
5. `LeaveRequestCreateScreen`
   - Formulario principal de permiso.
6. `LeaveRequestDetailScreen`
   - Estado, detalle y cancelacion de solicitud.

## MVP RH/Admin desktop

1. `AdminDashboardScreen`
   - KPIs, solicitudes pendientes y actividad reciente.
2. `AdminRequestsListScreen`
   - Tabla con filtros por estado, empleado, tipo y fecha.
3. `AdminRequestDetailScreen`
   - Revision de una solicitud, acciones aprobar/rechazar y motivo.
4. `AdminEmployeesScreen`
   - Directorio de empleados.
5. `AdminEmployeeDetailScreen`
   - Historial de permisos por empleado.
6. `AdminReportsScreen`
   - Exportacion CSV/PDF y filtros por periodo.
7. `AdminSettingsScreen`
   - Roles, tipos de permiso y reglas operativas.

## MVP Jefe/Manager

1. `ManagerDashboardScreen`
   - Pendientes de aprobacion, ausencias proximas y resumen del equipo.
2. `ManagerTeamRequestsScreen`
   - Solicitudes de empleados a cargo, con filtros por estado y fecha.
3. `ManagerRequestDetailScreen`
   - Detalle de solicitud, aprobacion/rechazo y comentario.
4. `ManagerTeamCalendarScreen`
   - Calendario de ausencias del equipo.
5. `ManagerTeamScreen`
   - Lista de empleados bajo su cargo.

## Estados del sistema

1. `NotFoundScreen`
   - Ruta inexistente / pantalla 404.
2. `AccessDeniedScreen`
   - Usuario autenticado sin permisos.
3. `EmptyState`
   - Sin solicitudes, sin resultados de busqueda o sin empleados.
4. `ErrorState`
   - Error de conexion o Supabase.
5. `LoadingState`
   - Carga inicial de sesion/datos.

## Rutas reales en codigo

```txt
/login
/employee
/employee/request
/employee/requests/:requestId
/manager
/admin
/* -> 404
```

## Prioridad de diseno

### Alta fidelidad inmediata

- Login.
- Dashboard empleado.
- Crear solicitud.
- Detalle/estado de solicitud.
- Dashboard jefe.
- Detalle de solicitud jefe.
- Dashboard RH.
- Lista RH.
- Detalle de solicitud RH.
- 404.

### Wireframe suficiente por ahora

- Registro.
- Recuperacion de password.
- Calendario de equipo jefe.
- Equipo jefe.
- Empleados RH.
- Reportes RH.
- Configuracion RH.
