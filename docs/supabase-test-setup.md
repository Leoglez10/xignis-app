# Xignis App - Setup de Cuentas de Prueba en Supabase

## Objetivo

Dejar listas 4 cuentas para probar la app:

- empleado
- manager
- RH
- admin tecnico

## Datos de prueba

| Email | Password | Rol |
|---|---:|---|
| `ana.employee@xignis.test` | `Xignis123!` | `employee` |
| `carlos.manager@xignis.test` | `Xignis123!` | `manager` |
| `maria.hr@xignis.test` | `Xignis123!` | `hr_admin` |
| `admin.tech@xignis.test` | `Xignis123!` | `admin` |

## Paso 1: crear usuarios en Auth

1. Abre Supabase Dashboard.
2. Ve a `Authentication -> Users`.
3. Crea estos 4 usuarios con los emails y passwords de arriba.
4. Verifica que cada usuario quede activo.

## Paso 2: tomar los IDs

1. En la lista de usuarios, abre cada usuario.
2. Copia su `UUID` de Auth.
3. Guarda estos IDs en un bloc temporal para pegarlos en el SQL.

## Paso 3: poblar `profiles`

1. Abre el SQL editor.
2. Pega el contenido de `supabase/seed_test_accounts.sql`.
3. Reemplaza los emails solo si cambiaste alguno.
4. Ejecuta el SQL.

## Paso 4: revisar la relación manager -> empleado

1. Confirma que `ana.employee@xignis.test` tenga `manager_id` apuntando a `carlos.manager@xignis.test`.
2. Confirma que `carlos.manager@xignis.test` tenga rol `manager`.
3. Confirma que `maria.hr@xignis.test` tenga rol `hr_admin`.
4. Confirma que `admin.tech@xignis.test` tenga rol `admin`.

## Paso 5: probar login

1. Abre la app local.
2. Entra a `/login`.
3. Prueba cada cuenta.
4. Verifica que:
   - empleado va a `/employee`
   - manager va a `/manager`
   - RH va a `/admin`
   - admin va a `/admin`

## Si falla

- Si dice que no existe perfil, revisa `public.profiles`.
- Si dice que el rol no coincide, revisa `profiles.role`.
- Si entra pero no ve datos, revisa que la solicitud exista y que RLS esté activa.
