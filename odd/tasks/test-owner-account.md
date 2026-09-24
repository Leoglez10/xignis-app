# Feature: Cuenta de prueba con rol `owner`

**Estado**: en progreso · **Branch**: `main` (sin rama: no se autorizo commit todavia)

## Contexto
Las semillas locales y la documentacion cubren cuatro roles de demostracion
(`employee`, `manager`, `hr_admin`, `admin`), pero la app ya tiene un quinto rol,
`owner` (suite de solo lectura de la fase 4). No existe cuenta de prueba para
probarlo. Se agrega una cuenta `owner` que solo sea visible dentro del conjunto
de datos de prueba.

## Decisiones confirmadas
- Identidad: `owner.test@xignis.test` / `Xignis123!` (misma contrasena compartida).
- Nombre para mostrar: `Owner Test`; cargo: `Direccion General`.
- Alcance: semillas locales **y** script SQL idempotente para el proyecto
  hosteado `wtycqdnrulknhzheqflq`.
- `is_test`: se marca explicitamente `true` para **las cinco** cuentas en la
  semilla de perfiles.

## Hallazgo que motiva parte del cambio
`docs/desarrollo-local.md` afirma que `db reset` siembra cuentas marcadas como
datos de prueba, pero la semilla **no** escribe `is_test`. La migracion
`20260723055648_profiles_is_test_flag.sql` hace el `update ... set is_test = true`
en tiempo de migracion, y las semillas corren **despues** de las migraciones, asi
que en un `db reset` limpio las cuentas quedan con `is_test = false`. En el
proyecto hosteado quedaron en `true` solo porque la migracion corrio cuando los
usuarios ya existian. T2 cierra ese hueco.

## Tareas

- [x] T1: Semilla Auth: agregar `owner.test@xignis.test` en `supabase/seed_auth_users.sql`
- [x] T2: Semilla de perfiles: rol `owner` + `is_test = true` explicito para las 5 cuentas en `supabase/seed_test_accounts.sql`
- [x] T3: Script SQL idempotente para el proyecto hosteado (`supabase/hosted_test_owner_account.sql`)
- [x] T4: Documentacion: 5 cuentas + fila `owner` + nota de solo lectura (README + 4 docs)
- [x] T4b: Ronda de correccion de 5 inexactitudes de documentacion + nota de hardening del script
- [x] T5: Verificacion de consistencia y cierre

## Verificacion (T5)

Estatica, por lectura de SQL y trazado de semantica. La CLI de Supabase no esta
en PATH, asi que **no** se ejecuto `db reset` ni se toco el proyecto hosteado.

Confirmado con evidencia:
- Orden real de `db reset`: migraciones primero, semillas despues
  (`supabase/config.toml`); el `update ... set is_test = true` de
  `20260723055648` corre antes de que exista ninguna cuenta y no afecta a las
  semillas. La semilla ahora escribe `is_test` en el INSERT y en el
  `do update set`, asi que la correctitud ya no depende del tiempo de migracion.
- `guard_profile_privileged_fields` es BEFORE UPDATE y **si** se dispara en el
  `on conflict (id) do update`; con `auth.uid()` nulo la condicion evalua NULL y
  PL/pgSQL no toma la rama, por lo que el upsert sobrevive. El script hosteado
  ahora documenta ese requisito y la ruta de fallo.
- Policy final (`20260924130000`): la cuenta nueva ve todas las filas por
  `private.is_owner()` y queda oculta de todo viewer con `is_test = false`,
  incluidos `hr_admin` y `admin` reales. Requisito cumplido.
- La ruta `/owner` existe de verdad (`src/app/App.tsx`, `RequireAuth allowedRoles={["owner"]}`)
  y `roleRoute.owner` la resuelve.
- Ningun test unitario ni e2e fija los correos de demostracion ni la contrasena.

No verificado (fuera de alcance): si las migraciones `20260723055648` y
`20260923190123` estan aplicadas en el proyecto hosteado, y si el SQL Editor de
Supabase envuelve el script en una transaccion explicita.

## Alertas

- **Escritor concurrente en el mismo worktree.** Mientras se trabajaba esta
  feature, otra sesion modifico `src/features/admin/screens/AdminRequestsScreen.tsx`,
  `src/features/leave-requests/services/leaveRequestService.ts` y creo tres
  archivos en `src/features/admin/components/` (refactor `AdminRequestCard` ->
  `AdminRequestRow`, mtime 10:10). No hay solapamiento con las superficies de
  esta feature, pero no deben commitearse juntos.
- **Reporte de verificacion con afirmaciones falsas.** El verificador reporto
  "46 archivos duplicados" y "5 migraciones duplicadas"; comprobado a mano:
  `supabase/migrations/` tiene 18 archivos sin duplicados y el repo solo tiene
  2 archivos `* 2.*`, ambos ignorados dentro de `.codegraph/`. Esas afirmaciones
  se descartaron; el resto del reporte si se confirmo.

## Notas de riesgo
- El rol `owner` es **solo lectura** por diseno (RLS en `20260923190123_owner_suite.sql`):
  ve todo, no escribe nada. La cuenta sirve para probar la suite del dueno, no
  para flujos de aprobacion.
- `is_test` solo lo pueden cambiar roles privilegiados
  (`guard_profile_privileged_fields`); el script hosteado escribe el valor
  directamente, sin pasar por el guard de cliente.
- La cuenta de prueba `owner` es `is_test = true`, por lo que **no** se muestra a
  usuarios reales; y como es `is_test`, ve tambien los datos reales (esa es la
  semantica vigente de la policy).

## Evidencia de commits
- Pendiente de autorizacion explicita del usuario.
