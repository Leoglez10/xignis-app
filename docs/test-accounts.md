# Xignis App - Cuentas de Prueba

## Credenciales sugeridas

Usa estas cuentas para probar el flujo completo:

- `ana.employee@xignis.test` - `Xignis123!` - `employee`
- `carlos.manager@xignis.test` - `Xignis123!` - `manager`
- `maria.hr@xignis.test` - `Xignis123!` - `hr_admin`
- `admin.tech@xignis.test` - `Xignis123!` - `admin`

## Orden recomendado

1. Crear primero `carlos.manager@xignis.test`.
2. Crear luego `maria.hr@xignis.test` y `admin.tech@xignis.test`.
3. Crear al final `ana.employee@xignis.test`.

## Que falta hacer en Supabase

1. Crear los usuarios en `Authentication -> Users`.
2. Ejecutar el seed de perfiles para que existan filas en `public.profiles`.
3. Asignar `manager_id` de Ana al perfil de Carlos.

## SQL listo

El archivo para correr en Supabase es:

```txt
supabase/seed_test_accounts.sql
```

## Verificacion rapida

- `ana.employee@xignis.test` debe entrar como `employee`.
- `carlos.manager@xignis.test` debe entrar como `manager`.
- `maria.hr@xignis.test` debe entrar como `hr_admin`.
- `admin.tech@xignis.test` debe entrar como `admin`.
