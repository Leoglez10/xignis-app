# Xignis - Cuentas de Prueba (LISTAS)

Cuatro cuentas ya estan creadas y confirmadas en Supabase (`wtycqdnrulknhzheqflq`) y listas para login. La cuenta owner (`owner.test@xignis.test`) esta pendiente: crearla ejecutando `supabase/hosted_test_owner_account.sql` en el proyecto alojado.

| Email | Password | Rol | Ruta tras login |
|---|---|---|---|
| `ana.employee@xignis.test` | `Xignis123!` | `employee` | `/employee` |
| `carlos.manager@xignis.test` | `Xignis123!` | `manager` | `/manager` |
| `maria.hr@xignis.test` | `Xignis123!` | `hr_admin` | `/admin` |
| `admin.tech@xignis.test` | `Xignis123!` | `admin` | `/admin` |
| `owner.test@xignis.test` | `Xignis123!` | `owner` | `/owner` |

Relación: Ana (employee) → manager Carlos.

Nota: el rol `owner` es de solo lectura por diseño (ve todo, no escribe nada),
así que no sirve para ejercitar flujos de aprobación.

## Login

1. App local → `/login`.
2. Cualquier email + `Xignis123!`.

## Cambiar rol al vuelo (sin crear cuenta nueva)

```sql
update public.profiles
set role = 'manager'
where id = (select id from auth.users where email = 'ana.employee@xignis.test');
```

## Nota

Trigger `handle_new_user` estaba roto (insertaba en `profiles.email`, columna inexistente) — rompía todo signup nuevo. Arreglado.
