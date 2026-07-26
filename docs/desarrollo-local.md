# Desarrollo local con Docker

Una copia completa de Supabase corriendo en tu maquina, para probar migraciones
sin tocar la base real.

**No corre siempre.** Se prende cuando lo necesitas y se apaga al terminar.
Por defecto la app apunta al proyecto en la nube.

## Cuando usarlo

Prendelo cuando vayas a:

- escribir una migracion nueva
- probar un cambio de esquema o de RLS
- rehacer la base desde cero para ver como arranca un proyecto limpio

Para trabajar solo en pantallas, estilos o logica de front no hace falta. La app
contra la nube funciona igual.

## Que es

Supabase no es un servicio cerrado: es Postgres, autenticacion, storage y una
API REST empaquetados. Todo eso es software libre. La nube es Supabase
corriendolo por ti; Docker lo corre en tu laptop. El mismo software, otra
direccion.

A la app le da igual: recibe una URL y le habla. Cambias la URL, le habla a otra
base.

## Prender

```bash
npx supabase start
```

La primera vez descarga las imagenes y tarda varios minutos. Despues arranca en
segundos.

Cuando termina imprime las direcciones. Las fijas son:

| Servicio | URL |
|---|---|
| API | `http://127.0.0.1:54321` |
| Studio (el panel) | `http://127.0.0.1:54323` |
| Correos de prueba | `http://127.0.0.1:54324` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

Los correos no salen a internet: los atrapa Mailpit en el 54324. Ahi ves los
mails de recuperacion de contraseña y demas.

## Apuntar la app a local

La app lee dos variables y nada mas (`src/lib/supabase.ts`):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Vite carga `.env.local` **despues** de `.env`, asi que lo que pongas en
`.env.local` gana. Ese archivo esta en `.gitignore`.

Crea `.env.local` con:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

Esa llave es el default de Supabase, identica en todas las maquinas del mundo y
solo sirve contra `127.0.0.1`. No es un secreto.

**Para volver a la nube:** renombra el archivo a `.env.local.off` y reinicia
`npm run dev`. Para volver a local, lo renombras de regreso. No se toca codigo.

## Apagar

```bash
npx supabase stop
```

Los contenedores siguen prendidos hasta que corras esto. Consumen RAM mientras
tanto, asi que apagalo al terminar.

Los datos quedan guardados en un volumen de Docker: la proxima vez que prendas,
la base esta como la dejaste.

## El ciclo de trabajo

Este es el punto de tener todo esto:

1. Escribes la migracion en `supabase/migrations/`.
2. `npx supabase db reset` — borra la base local, reaplica **todas** las
   migraciones en orden y vuelve a sembrar los datos de prueba.
3. Si truena, corriges y repites. Es tu boton de deshacer.
4. Cuando pasa limpio, `npx supabase db push` la manda a la nube.

`db reset` es el paso que importa. Aplica todo desde cero, asi que detecta
migraciones que dependen de un estado que no existe en una base nueva.

## Datos de prueba

`db reset` siembra 4 cuentas, en este orden:

1. `supabase/seed_auth_users.sql` — crea los usuarios de autenticacion.
2. `supabase/seed_test_accounts.sql` — les asigna rol y jefe.

El orden importa: el segundo hace `join auth.users` por correo, asi que sin el
primero no encuentra a nadie y no hace nada.

| Correo | Rol |
|---|---|
| `maria.hr@xignis.test` | RH |
| `carlos.manager@xignis.test` | jefe |
| `ana.employee@xignis.test` | empleada (su jefe es Carlos) |
| `admin.tech@xignis.test` | admin |

Contraseña para todas: `Xignis123!`

Los seeds solo corren en `db reset`, que solo existe en local. `db push` no los
ejecuta, asi que no hay forma de que estas cuentas lleguen a produccion.

## Consultar la base local

```bash
docker exec supabase_db_app-xignis psql -U postgres -d postgres -c "select * from public.profiles;"
```

O entra por el navegador a Studio en `http://127.0.0.1:54323`, sin contraseña.

## Cuidado: migraciones aplicadas por MCP

Cuando una migracion se aplica desde el MCP de Supabase en vez del CLI, el
remoto le pone **su propio timestamp**, que no es el del nombre de tu archivo.

Para `db push` esas son dos migraciones distintas: ve tu archivo local como
nunca aplicado, lo vuelve a correr y truena con `already exists`.

Si aplicas algo por MCP, despues compara la lista remota contra
`supabase/migrations/` y renombra los archivos locales para que los timestamps
coincidan.

## Problemas comunes

**`Cannot connect to the Docker daemon`** — Docker Desktop esta cerrado.
`open -a Docker`, espera a que arranque y reintenta.

**Los redirects de login fallan** — `site_url` en `supabase/config.toml` tiene
que coincidir con el puerto de Vite (5173).

**Un puerto ocupado** — otro proyecto de Supabase esta prendido. `npx supabase
stop` en esa carpeta, o cambia los puertos en `config.toml`.
