# Roadmap

## Selector de módulos ("Módulos de Xignis")

Quitado de la UI el 2026-09-25 por decisión de producto: hoy solo existe el módulo de Vacaciones.

- Componente conservado: `src/components/ModuleSwitcherSheet.tsx`
- Catálogo de módulos: `src/app/modules.ts` (Vacaciones `live`; Control de gastos, Reportes, Nómina y Documentos `soon`)
- Para reactivarlo: volver a montar el botón `Grid2x2` + `ModuleSwitcherSheet` en `TopBar.tsx` (móvil) y `Sidebar.tsx` (escritorio). Ver commit que lo quitó.
