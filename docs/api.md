# Xignis App - Contratos de API / Servicios

La app usa Supabase directamente desde una capa de servicios en el cliente. Por ahora no hay endpoints propios.

## Auth service

```ts
type LoginInput = {
  email: string;
  password: string;
  selectedRole: "employee" | "manager" | "hr_admin";
};
```

Funciones actuales:

- `login(input)`: inicia sesion y valida que `profiles.role` coincida con el rol visible.
- `logout()`: cierra sesion.
- `routeForRole(role)`: calcula la ruta destino por rol.
- `loginRoleMatchesProfile(selectedRole, profileRole)`: helper de validacion.
- `getCurrentProfile()`: lee el perfil del usuario actual.

## Leave requests service

```ts
type LeaveRequestDraft = {
  startDate: string;
  endDate: string;
  leaveType: "vacation" | "sick" | "personal" | "other";
  scheduleType: "full_day" | "time_range";
  startTime?: string;
  endTime?: string;
  pendingTasks?: string;
};
```

Funciones actuales:

- `listMyLeaveRequests()`: lista las solicitudes del usuario actual.
- `getLeaveRequest(id)`: obtiene una solicitud visible por id.
- `createLeaveRequest(draft)`: crea una solicitud para el usuario autenticado.
- `cancelLeaveRequest(id)`: marca una solicitud como `cancelled`.
- `listManagerLeaveRequests()`: lista solicitudes pendientes de manager.
- `listHrLeaveRequests()`: lista solicitudes visibles para RH.
- `reviewLeaveRequest(input)`: aprueba o rechaza y registra auditoria en `leave_request_approvals`.
- `formatDateRange(request)`: helper de display.
- `leaveTypeLabel`, `statusLabel`: etiquetas de UI.

## Tipos de datos locales

El cliente usa tipos tipados en:

- `src/lib/database.types.ts`
- `src/lib/supabase.ts`

## Errores esperados

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_ROLE_MISMATCH`
- `PROFILE_NOT_FOUND`
- `LEAVE_INVALID_DATE_RANGE`
- `LEAVE_DATE_IN_PAST`
- `LEAVE_MISSING_REQUIRED_FIELDS`
- `LEAVE_NOT_ALLOWED_FOR_STATUS`
- `ADMIN_REJECTION_REASON_REQUIRED`

## Pendiente por decidir

- Registro publico de empleados.
- Recuperacion de password en UI.
- Detalle manager dedicado.
- Búsqueda y filtros reales en RH.
