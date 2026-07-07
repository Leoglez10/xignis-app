# Xignis App - Arquitectura Tecnica

## Decision actual

Para la primera version mobile-first se usa:

- **Frontend:** React + Vite + TypeScript
- **Mobile shell:** Capacitor
- **Estilos:** Tailwind CSS
- **Backend:** Supabase Auth + Postgres + RLS
- **Estado/forms:** React Hook Form + Zod
- **Fechas:** date-fns

Capacitor no convierte la app a Swift. Genera un proyecto nativo de iOS/Android que carga la app web dentro de un contenedor nativo y permite usar APIs nativas mediante plugins. Para esta app, donde el core son formularios, auth, listas, modales y dashboards internos, eso encaja bien.

La UI actual ya esta conectada a Supabase para:

- autenticacion real
- lectura de `profiles`
- creacion, lectura y cancelacion de `leave_requests`
- aprobaciones y rechazos por manager y RH

## Estrategia empleado / admin

- **Empleado:** experiencia principal mobile-first, simple, enfocada en pedir permisos y ver historial.
- **Manager:** experiencia desktop-friendly para revisar solicitudes del equipo.
- **RH / admin:** experiencia desktop-friendly con tablas, filtros y revision detallada.
- **Codebase inicial:** una sola app React con rutas separadas por rol. Si el panel de RH crece mucho, se puede separar despues sin mover Supabase.

## Recuperacion de password

Se usa el flujo nativo de Supabase por email. No hay OTP propio de 4 digitos en la primera version.

## Por que no iniciar con Next.js

El PRD original mencionaba Next.js, pero para una app empaquetada con Capacitor, Vite + React es mas directo:

- menos complejidad para compilar assets estaticos
- mejor encaje con Capacitor
- menos decisiones de server rendering que no aportan mucho a formularios internos

## Estructura actual

```txt
src/
  app/
    App.tsx
    RequireAuth.tsx
  components/
    ui/
      Button.tsx
      ActionRow.tsx
      BottomSheet.tsx
      TextInput.tsx
  features/
    auth/
      screens/
      services/
    admin/
      screens/
    employee/
      screens/
    leave-requests/
      services/
    manager/
      screens/
    profiles/
      services/
    session/
      AuthContext.tsx
  lib/
    supabase.ts
    database.types.ts
  styles/
    globals.css
```

## Produccion mobile

1. Construir web app con `npm run build`.
2. Sincronizar Capacitor con `npx cap sync`.
3. Abrir iOS con `npx cap open ios`.
4. Configurar signing en Xcode.
5. Probar en simulador y dispositivo real.
6. Subir a TestFlight.
7. Publicar en App Store cuando el flujo core este validado.

## Produccion web opcional

Si se quiere una version web interna, se puede publicar el build estatico en Vercel, Netlify o Supabase Hosting. La app debe usar las mismas politicas RLS de Supabase para no depender de seguridad en el cliente.

## Accesibilidad y UI

- La pantalla debe llenar el viewport en desktop y mobile; no usar un frame de telefono para rutas funcionales.
- Todo formulario debe tener labels, mensajes de error anunciables y foco visible.
- Los bottom sheets deben cerrar con boton visible y Escape.
- Los estados vacios y de carga deben ser explicitos.
- El lenguaje visual debe seguir siendo utilitario, no de landing page.
