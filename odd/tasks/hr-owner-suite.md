# Feature: HR Owner Suite (Fase 4)

**Estado**: en progreso · **Branch**: `feat/hr-ux-cleanup`

## Contexto
Fase 4 del plan de mejoras RRHH. Los dueños del negocio ven el panel admin en modo read-only con identidad propia y un canal de pedidos de ajuste hacia RH.

## Decisiones confirmadas
- **Suite completa**: home ejecutivo + panel read-only + pedido de ajuste a RH + badge dorado. Sin funciones de jefe.
- Rol nuevo `owner` en `user_role` (más seguro que flag: RLS por rol, sin escritura posible).
- Pedido de ajuste: tabla `owner_requests`, notifica a RH, con seguimiento de estado (abierto/resuelto).
- Tabs del dueño: Inicio, Empleados, Solicitudes, Ausentes, Reportes, Pedidos a RH, Perfil. Sin Reglas ni Áreas.
- Identidad visual dorada (amber), icono corona, banner "Vista de solo lectura".
- El dueño no aprueba ni rechaza nada.

## Tareas

- [x] T1: Migración SQL: rol `owner` en enum + policies de solo lectura + tabla `owner_requests` + trigger de notificación a RH
- [x] T2: Tipos cliente + `routeForRole`/`roleLabel`/nav + badge dorado en TopBar + rutas owner
- [x] T3: Home ejecutivo del dueño (KPIs) + banner de solo lectura
- [x] T4: Pantallas read-only: Empleados (+ ficha con saldos), Solicitudes, Ausentes, Reportes
- [x] T5: Pedidos a RH: sheet contextual "Solicitar ajuste" + pantalla de seguimiento + pantalla RH para resolver
- [x] T6: Verificación (tsc limpio + vite build) + commit de trabajo

## Evidencia de commits
- `7fd3e18` feat(hr): owner read-only suite with golden identity, executive home and RH request channel
