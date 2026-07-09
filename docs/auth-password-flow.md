# Flujo de acceso e invitaciones

## Decisión actual

- Crear cuentas públicas queda deshabilitado.
- RH/admin crea usuarios desde `Empleados > Agregar`.
- La persona recibe invitación por correo, define password en `/set-password` y después inicia sesión.
- Recuperar password usa el mismo destino `/set-password`.

## Flujo de invitación RH

1. RH/admin abre `Empleados`.
2. Presiona `Agregar`.
3. Captura nombre, correo, rol, jefe directo, puesto y días de vacaciones.
4. Frontend llama `inviteUser()`.
5. `inviteUser()` invoca Edge Function `admin-create-user`.
6. Edge Function valida que el usuario actual sea `hr_admin` o `admin`.
7. Edge Function llama `inviteUserByEmail()` y crea/actualiza `profiles`.
8. Usuario abre correo, llega a `/set-password`, define password y entra.

## Flujo de recuperación

1. Usuario abre `Recuperar password` desde login.
2. Ingresa correo.
3. App llama `resetPasswordForEmail()` con redirect a `/set-password`.
4. Supabase envía link.
5. Usuario abre link, Supabase crea sesión temporal.
6. Usuario define nueva password en `/set-password`.
7. App llama `updateUser({ password })` y redirige según rol.

## Pendiente para revisar antes de producción

- Confirmar Redirect URLs en Supabase Auth:
- `https://DOMINIO/set-password`
- `https://DOMINIO/login`
- `http://localhost:5173/set-password`
- `http://localhost:5173/login`
- Revisar Email Templates de invitación y recuperación.
- Confirmar que el link de invitación llega a `/set-password`.
- Confirmar que el link de recuperación llega a `/set-password`.
- Probar link expirado: debe mostrar botón `Solicitar nuevo enlace`.
- Probar usuario invitado con rol `employee`, `manager` y `hr_admin`.
- Probar que `/signup` redirige a `/login`.
