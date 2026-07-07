# Xignis App - Flujos

## Auth

### Login

1. Usuario abre la app.
2. Selecciona rol visible: `Empleado`, `Jefe` o `RH`.
3. Ingresa correo y password.
4. Supabase Auth valida credenciales.
5. La app consulta el perfil del usuario.
6. Si el rol real no coincide con el rol seleccionado, mostrar error claro.
7. Redirigir segun rol:
   - `employee` -> Dashboard de empleado.
   - `manager` -> Dashboard de jefe.
   - `hr_admin` -> Dashboard RH.
   - `admin` -> Dashboard RH o acceso tecnico, segun la ruta.

### Registro

1. Usuario abre `Crea tu cuenta`.
2. Ingresa nombre, correo, password y cargo.
3. Se crea usuario en Supabase Auth.
4. Se crea perfil en `profiles` con rol `employee` por defecto.
5. Se muestra confirmacion o se redirige al dashboard si la sesion queda activa.

### Recuperacion de password

1. Usuario toca `Olvide mi password`.
2. Ingresa correo.
3. Supabase envia el email de recuperacion.
4. Usuario abre el link y define nuevo password.
5. Vuelve a login.

Nota: no se implementa OTP propio de 4 digitos en v1. Se usa el flujo nativo de Supabase por email.

## Solicitud de permiso

1. Empleado entra al dashboard.
2. Toca `Nueva solicitud`.
3. Completa fecha inicial, fecha final, tipo de permiso, horario y actividades pendientes.
4. El formulario valida fechas, horario y campos requeridos antes de enviar.
5. Al enviar, se crea `leave_requests` con estado `pending_manager` si el empleado tiene jefe asignado.
6. Si no tiene jefe asignado, se crea con estado `pending_hr`.
7. El empleado puede abrir el detalle para revisar estado y cancelar mientras siga permitido.

## Revision jefe

1. Jefe entra al dashboard manager.
2. Ve solicitudes pendientes de empleados bajo su cargo.
3. Abre detalle de solicitud.
4. Revisa fechas, tipo, horario, pendientes y solapamientos del equipo.
5. Aprueba o rechaza.
6. Si aprueba, la solicitud pasa a `approved_by_manager`.
7. Luego RH termina la revision y marca `approved` o `rejected`.
8. Si rechaza, la solicitud pasa a `rejected_by_manager` y se guarda motivo.

## Revision admin

1. Admin/RH entra al dashboard admin, principalmente desde computadora.
2. Ve solicitudes aprobadas por jefe y pendientes de RH ordenadas por fecha de creacion, con filtros y busqueda.
3. Abre detalle de solicitud.
4. Revisa empleado, fechas, tipo, horario y pendientes.
5. Aprueba o rechaza.
6. Si rechaza, debe capturar motivo.
7. El empleado ve el cambio de estado en su historial.

## Estados de solicitud

- `draft`: estado local antes de enviar; no necesariamente se guarda en base de datos.
- `pending_manager`: enviada y esperando revision del jefe.
- `approved_by_manager`: aprobada por jefe y pendiente de procesamiento RH.
- `rejected_by_manager`: rechazada por jefe.
- `pending_hr`: esperando revision final de RH.
- `approved`: aprobada por RH.
- `rejected`: rechazada por RH.
- `cancelled`: cancelada por empleado antes de ser aprobada.
