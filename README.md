# Xignis App

App mobile-first para empleados y panel web responsive para RH/admin.

## Stack

- React + Vite + TypeScript
- Capacitor
- Tailwind CSS
- Supabase

## Comandos

```bash
bun install
bun run dev
bun run build
bun run test
bun run cap:sync
```

## Configuracion

Crear `.env` con:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Para probar migraciones contra una base local en vez de la nube, ver
`docs/desarrollo-local.md`.

## Continuar el proyecto

Leer primero:

```txt
docs/handoff.md
docs/tasks.md
docs/tech.md
docs/mejoras-2026-06-28.md   # animaciones, notificaciones, paneles, auth, tests
```
