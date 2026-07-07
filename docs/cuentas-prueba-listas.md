# Xignis - Cuentas de Prueba (LISTAS)

Creadas en Supabase (`wtycqdnrulknhzheqflq`). Confirmadas. Listas para login.

| Email | Password | Rol | Ruta tras login |
|---|---|---|---|
| `ana.employee@xignis.test` | `Xignis123!` | `employee` | `/employee` |
| `carlos.manager@xignis.test` | `Xignis123!` | `manager` | `/manager` |
| `maria.hr@xignis.test` | `Xignis123!` | `hr_admin` | `/admin` |
| `admin.tech@xignis.test` | `Xignis123!` | `admin` | `/admin` |

Relación: Ana (employee) → manager Carlos.

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
