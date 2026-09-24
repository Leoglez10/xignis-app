# Xignis App - Cuentas de Prueba

## Credenciales sugeridas

Usa estas cuentas para probar el flujo completo:

- `ana.employee@xignis.test` - `Xignis123!` - `employee`
- `carlos.manager@xignis.test` - `Xignis123!` - `manager`
- `maria.hr@xignis.test` - `Xignis123!` - `hr_admin`
- `admin.tech@xignis.test` - `Xignis123!` - `admin`
- `owner.test@xignis.test` - `Xignis123!` - `owner`

## Orden recomendado

1. Crear primero `carlos.manager@xignis.test`.
2. Crear luego `maria.hr@xignis.test` y `admin.tech@xignis.test`.
3. Crear al final `ana.employee@xignis.test`.
4. Crear al final `owner.test@xignis.test`.

## Que falta hacer en Supabase

1. Crear los usuarios en `Authentication -> Users`.
2. Ejecutar el seed de perfiles para que existan filas en `public.profiles`.
3. Asignar `manager_id` de Ana al perfil de Carlos.
4. En el proyecto alojado, crear la cuenta owner con `supabase/hosted_test_owner_account.sql`.

## SQL listo

El archivo para correr en Supabase es:

```txt
supabase/seed_test_accounts.sql
```

Para la cuenta owner en el proyecto alojado usar `supabase/hosted_test_owner_account.sql`.

## Verificacion rapida

- `ana.employee@xignis.test` debe entrar como `employee`.
- `carlos.manager@xignis.test` debe entrar como `manager`.
- `maria.hr@xignis.test` debe entrar como `hr_admin`.
- `admin.tech@xignis.test` debe entrar como `admin`.
- `owner.test@xignis.test` debe entrar como `owner`.
