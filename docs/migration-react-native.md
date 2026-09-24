# Plan por etapas: migración móvil a React Native

Este plan migra gradualmente la experiencia móvil de Xignis desde React + Capacitor hacia React Native, sin reemplazar el panel web de RR. HH./administración. La estrategia recomendada es construir una aplicación nueva para empleados y managers, compartir la lógica de negocio posible y mantener la aplicación Capacitor publicable hasta completar la transición.

> Las estimaciones son rangos orientativos para planificación. Deben recalibrarse después de los spikes técnicos y del inventario de la Fase 0.

## Recomendación ejecutiva

- Mantener React/Vite como aplicación web para RR. HH. y administración.
- Crear una aplicación React Native con Expo para empleados y managers.
- Usar Expo Prebuild y módulos nativos cuando WidgetKit, Glance u otra integración lo requieran.
- Extraer primero la lógica portable del frontend actual; no copiar componentes web dentro de React Native.
- Migrar mediante cortes verticales completos, no pantalla por pantalla sin backend, pruebas ni telemetría.
- Mantener Capacitor como fallback hasta que cada plataforma supere sus criterios de salida.

### Resultado buscado

Una aplicación móvil que use navegación, gestos, controles, tipografía, feedback háptico, estados de carga y transiciones coherentes con iOS y Android, con widgets de inicio útiles y seguros.

## Alcance

### Incluido

- Aplicación React Native para iOS y Android.
- Flujos móviles de empleados y managers.
- Supabase Auth, Postgres/RLS, Realtime, Storage y Edge Functions.
- Deep links, red, almacenamiento seguro, haptics y observabilidad.
- WidgetKit en iOS y Glance/App Widgets en Android.
- Estrategia de convivencia con las aplicaciones Capacitor.
- Distribución beta y migración gradual en App Store y Google Play.

### Fuera de alcance inicial

- Reescribir en React Native el panel desktop de RR. HH./administración.
- Migrar las Edge Functions o la base de datos sin una necesidad demostrada.
- Paridad visual exacta con la interfaz web.
- Offline-first completo con edición y sincronización bidireccional.
- Incorporar los módulos de producto que todavía figuran como futuros.

## Punto de partida

| Área | Estado actual | Consecuencia |
|---|---|---|
| UI | Aproximadamente 29 pantallas y 72 componentes web | La mayoría de la UI debe reimplementarse |
| Roles | Empleado, manager, RR. HH. y administración | Conviene migrar primero los dos roles móviles |
| Backend | Supabase directo desde el cliente | Gran parte del contrato puede conservarse |
| Estado remoto | TanStack Query y Realtime | Patrones reutilizables, integración por validar |
| Formularios | React Hook Form + Zod | Esquemas reutilizables; controles deben reescribirse |
| Estilos | Tailwind CSS, CSS y componentes propios | No se trasladan directamente a primitivas nativas |
| Animación | Framer Motion | Sustituir por Reanimated/Moti según el caso |
| Sheets | Vaul | Sustituir por una solución nativa de bottom sheets |
| Capacidades nativas | Preferences, Haptics, Network y deep links | Superficie nativa actual pequeña |
| Casos browser-only | PDF, CSV, canvas/avatar y descargas | Diseñar alternativas móviles específicas |
| Web | Panel responsive productivo | Debe permanecer desplegable de forma independiente |

## Arquitectura objetivo

```text
apps/
├── web/                    # React + Vite: RR. HH. y administración
└── mobile/                 # React Native + Expo
packages/
├── domain/                 # Entidades, reglas y casos de uso puros
├── data/                   # Contratos y adaptadores de Supabase
├── validation/             # Esquemas Zod compartidos
├── observability/          # Eventos, errores y nombres comunes
└── config/                 # Roles, módulos, rutas semánticas y flags
supabase/
├── functions/
└── migrations/
```

La adopción de un monorepo es recomendable, pero no obligatoria. Debe elegirse sólo si CI, versionado y ownership quedan más simples que manteniendo repositorios separados.

### Límites de responsabilidad

- `domain` no importa React, DOM, Capacitor, Expo ni Supabase.
- `data` expone contratos estables y oculta detalles de consultas y Realtime.
- Web y mobile poseen sus propios componentes, navegación y accesibilidad.
- Los widgets consumen snapshots mínimos; no son una segunda aplicación completa.
- RLS continúa siendo la autoridad de autorización.

## Reutilizar versus reescribir

| Elemento actual | Estrategia |
|---|---|
| Tipos de base de datos | Reutilizar o regenerar desde la misma fuente |
| Esquemas Zod | Reutilizar cuando no dependan del DOM |
| Reglas de permisos y fechas | Extraer y reutilizar con pruebas |
| Servicios Supabase | Adaptar detrás de interfaces; evitar copiado directo |
| TanStack Query | Reutilizar patrones, claves e invalidaciones validadas |
| React Hook Form | Reutilizar librería y reglas, reescribir controles |
| Componentes Tailwind/CSS | Reescribir con primitivas React Native |
| Framer Motion | Reescribir con Reanimated/Moti |
| Vaul/modales | Reescribir con componentes móviles accesibles |
| SVG y gráficos propios | Portar cálculos; renderizar con `react-native-svg` u otra opción |
| jsPDF/CSV browser | Reemplazar por archivo/compartir o generación server-side |
| Canvas de avatar | Reemplazar por picker/editor nativo |
| Capacitor Preferences | Reemplazar por SecureStore/AsyncStorage según sensibilidad |
| Haptics, Network y App | Reemplazar por APIs Expo/RN equivalentes |
| Tests de lógica pura | Conservar y mover junto con el código compartido |
| Tests DOM/a11y web | Mantener para web; crear pruebas móviles nuevas |

## Estrategia de convivencia

Durante la migración existirán tres entregables:

1. Web React/Vite para RR. HH. y administración.
2. Aplicación móvil Capacitor estable.
3. Aplicación React Native en desarrollo o beta.

Reglas de convivencia:

- Una funcionalidad backend debe conservar compatibilidad con ambos clientes móviles mientras Capacitor siga activo.
- Los cambios de esquema serán aditivos; las eliminaciones requieren telemetría que confirme que no existen versiones antiguas activas.
- Los feature flags deben poder habilitarse por plataforma, versión y grupo beta.
- Capacitor recibe correcciones críticas hasta finalizar el rollout de React Native.
- No se retira una ruta Capacitor por el mero hecho de existir en React Native.
- La reversión operativa consiste en detener el rollout y mantener disponible la versión Capacitor anterior.

## Equipo y supuestos

Equipo mínimo sostenible:

- 1 referente React Native/mobile.
- 1 desarrollador React/TypeScript con conocimiento del dominio.
- QA compartido desde las primeras fases.
- Apoyo puntual de backend/Supabase y diseño.

Con una sola persona, el calendario se vuelve serial y aumenta el riesgo de que Capacitor quede sin mantenimiento. Con dos desarrolladores y QA parcial, una primera versión móvil limitada a empleado puede tomar aproximadamente 3–4 meses; empleado + manager, widgets y rollout completo puede ubicarse alrededor de 5–8 meses. La Fase 0 debe recalibrar estos rangos.

## Fase 0 — Inventario, métricas y decisiones

**Duración orientativa:** 1–2 semanas.

### Objetivo

Transformar la intención “que se vea nativa” en objetivos medibles y reducir las incógnitas técnicas más costosas.

### Trabajo

- Inventariar rutas, componentes, permisos por rol y dependencias de cada flujo.
- Clasificar cada pantalla como mobile, web-only o compartida conceptualmente.
- Medir arranque, navegación, errores, sesiones, abandono y tiempos de tareas críticas.
- Registrar dispositivos y versiones mínimas soportadas.
- Auditar accesibilidad, gestos y patrones que hoy hacen que la app se sienta web.
- Definir tokens de diseño y diferencias permitidas entre iOS y Android.
- Identificar uso real de PDF, CSV, avatar, Realtime y preferencias locales.
- Documentar rutas de deep link actuales y futuras.

### Spikes obligatorios

1. Login, refresh de sesión y recuperación con Supabase en React Native.
2. Suscripción Realtime tras background/foreground y pérdida de red.
3. Widget iOS y Android leyendo un snapshot compartido y abriendo un deep link.
4. Build firmado con Expo Prebuild/EAS o pipeline nativo elegido.
5. Picker y recorte de avatar con subida a Supabase Storage.

No debe asumirse que cada capacidad de los SDK se comporta igual que en web; los spikes deben probar sesión, storage, lifecycle y errores reales.

### Entregables

- Mapa de funcionalidades y dependencias.
- Baseline de métricas.
- Matriz de compatibilidad de SDKs.
- ADR de Expo administrado versus Expo Prebuild.
- Backlog recalibrado y presupuesto por etapa.

### Criterio de salida

- Los cinco spikes funcionan en dispositivos reales de ambas plataformas.
- Existe una definición verificable de “experiencia nativa”.
- Producto acepta el alcance mobile-first sin panel administrativo.

### Rollback

No hay impacto productivo. Si un spike falla, se mantiene Capacitor y se evalúa módulo nativo puntual o continuidad sin migración.

## Fase 1 — Fundación compartida y shell móvil

**Duración orientativa:** 2–4 semanas.  
**Dependencia:** Fase 0 aprobada.

### Trabajo

- Crear workspace, aplicación mobile y paquetes compartidos.
- Extraer reglas puras, tipos, Zod, fechas, roles y contratos de datos.
- Definir navegación tipada, tabs/stacks, safe areas y manejo del teclado.
- Crear tokens de color, tipografía, espaciado, elevación y movimiento.
- Implementar componentes base: botón, texto, campo, selector, alerta, sheet, skeleton y estados vacíos.
- Configurar Sentry, analytics, feature flags y logging sin datos sensibles.
- Configurar secretos, builds internos y actualización de dependencias.

### Entregables

- Shell ejecutable en iOS y Android.
- Design system mínimo y catálogo de estados.
- Paquetes compartidos con pruebas.
- CI de lint, tipos, unit tests y builds de desarrollo.

### Criterio de salida

- Navegación y controles respetan convenciones de cada plataforma.
- VoiceOver/TalkBack, tamaño de fuente y reduced motion tienen una base funcional.
- Los paquetes compartidos no dependen de DOM ni Capacitor.

### Rollback

Eliminar el workspace mobile no afecta web ni Capacitor; las extracciones deben conservar adaptadores compatibles con la web.

## Fase 2 — Autenticación, sesión y deep links

**Duración orientativa:** 2–3 semanas.

### Trabajo

- Implementar login, activación, recuperación y logout.
- Separar datos sensibles en almacenamiento seguro y preferencias no sensibles en almacenamiento normal.
- Restaurar sesión al iniciar y al volver del background.
- Manejar expiración, refresh fallido, revocación y cambio de contraseña.
- Implementar deep links equivalentes y enlaces universales/App Links cuando corresponda.
- Instrumentar éxito, error y tiempo de autenticación.

### Entregables

- Flujo autenticado completo en builds internas.
- Matriz de estados de sesión.
- Contrato de rutas semánticas compartido con widgets.

### Criterio de salida

- No se muestran datos protegidos antes de validar sesión.
- Los links abren la pantalla correcta con app cerrada, en background y activa.
- RLS bloquea accesos no autorizados en pruebas de integración.

### Rollback

La feature permanece sólo en builds internas; Capacitor continúa siendo el cliente público.

## Fase 3 — Corte vertical de empleado

**Duración orientativa:** 4–6 semanas.

### Orden

1. Inicio/dashboard.
2. Saldo y resumen de vacaciones.
3. Crear solicitud.
4. Historial y detalle.
5. Cancelación o acciones permitidas.

### Trabajo

- Reimplementar flujos con controles nativos, no como réplica pixel-perfect.
- Portar reglas de fechas, validaciones y estados del request.
- Diseñar loading, refresh, empty, error y conectividad degradada.
- Añadir haptics sólo donde comuniquen una acción relevante.
- Validar calendarios con locales, zonas horarias y accesibilidad.

### Entregables

- Aplicación de empleado funcional de extremo a extremo.
- Tests de reglas, servicios y flujos críticos.
- Comparación de métricas contra Capacitor.

### Criterio de salida

- Crear y consultar solicitudes produce los mismos resultados autorizados.
- No hay regresiones severas de fechas, saldo o permisos.
- La tasa de éxito de tareas y estabilidad cumple el umbral definido en Fase 0.

### Rollback

Beta cerrada; usuarios no elegibles continúan en Capacitor.

## Fase 4 — Manager, aprobaciones y Realtime

**Duración orientativa:** 4–6 semanas.

### Trabajo

- Migrar bandeja, detalle, aprobación/rechazo y calendario del equipo.
- Reimplementar gráficos/heatmaps sólo si su uso móvil lo justifica.
- Integrar Realtime con deduplicación, invalidación de queries y reconexión.
- Evitar decisiones sensibles desde notificaciones o widgets sin abrir la app autenticada.
- Probar concurrencia: solicitud modificada o resuelta desde otro cliente.

### Entregables

- Flujo completo de manager.
- Política de sincronización y conflictos.
- Métricas de latencia y reconexión.

### Criterio de salida

- Las acciones son idempotentes o fallan de forma comprensible.
- Realtime se recupera tras background, pérdida de red y expiración de sesión.
- Los permisos por rol coinciden con RLS y reglas de producto.

### Rollback

Deshabilitar el rol manager mediante feature flag sin afectar empleado ni Capacitor.

## Fase 5 — Perfil, avatar, archivos y offline acotado

**Duración orientativa:** 2–4 semanas.

### Trabajo

- Implementar perfil, selección, recorte, compresión y subida de avatar.
- Reemplazar PDF/CSV por generación server-side o share sheet de archivos temporales.
- Definir caché permitida y política de limpieza.
- Mostrar datos cacheados con antigüedad visible cuando no haya red.
- Mantener las mutaciones offline fuera de alcance salvo aprobación específica.

### Criterio de salida

- Los archivos no exponen tokens ni datos de otros usuarios.
- Avatar funciona con permisos denegados y memoria limitada.
- La app diferencia sin ambigüedad “sin datos”, “sin conexión” y “error”.

### Rollback

Desactivar exportación/avatar por flag; conservar visualización y flujos esenciales.

## Fase 6 — Widgets nativos

**Duración orientativa:** 3–5 semanas después de estabilizar los contratos móviles.

### Casos iniciales recomendados

- Empleado: saldo disponible y próxima ausencia aprobada.
- Manager: cantidad de solicitudes pendientes, sin nombres ni motivos sensibles.
- Acciones: tocar para abrir la pantalla correspondiente; no aprobar directamente desde el widget inicial.

### Contrato de snapshot

```text
WidgetSnapshot
- schemaVersion
- generatedAt
- expiresAt
- userScopeHash
- role
- availableDays?         # configurable por privacidad
- nextApprovedLeave?     # fechas mínimas
- pendingApprovalCount?
- destinationRoute
- displayState           # ready, signedOut, stale, unavailable
```

El snapshot debe ser pequeño, versionado y derivado por la app autenticada o por un mecanismo de actualización explícitamente diseñado. Nunca debe contener access tokens, refresh tokens, emails, motivos de ausencia ni información detallada de terceros.

### iOS

- WidgetKit + SwiftUI dentro de una app extension.
- App Group para compartir el snapshot con la app principal.
- Keychain sólo si un caso aprobado exige credenciales compartidas; preferir que el widget no consulte Supabase directamente.
- Timeline Provider con placeholders y estados bloqueados/redactados.
- Deep links o Universal Links para abrir la ruta autenticada.
- Considerar ocultar contenido sensible en pantalla bloqueada.

### Android

- Glance/App Widgets.
- DataStore/almacenamiento compartido controlado para el snapshot.
- WorkManager para actualizaciones elegibles, respetando batería y restricciones del sistema.
- PendingIntent/deep link hacia la actividad y ruta correspondiente.
- Diseños responsive para tamaños disponibles.

### Limitaciones que producto debe aceptar

- El sistema operativo decide cuándo refrescar; no existe actualización en tiempo real garantizada.
- Realtime dentro del widget no es apropiado como proceso permanente.
- El dato puede estar vencido; debe mostrarse su antigüedad o un estado neutral.
- Logout, cambio de cuenta y revocación deben borrar el snapshot inmediatamente desde la app.

### Criterio de salida

- Widget probado con login/logout, cambio de rol, dispositivo bloqueado y datos vencidos.
- Tocar el widget abre la ruta correcta y vuelve a validar autorización.
- Revisión de privacidad aprobada.

### Rollback

No publicar la extensión o mostrar un estado neutral; la aplicación principal continúa operativa.

## Fase 7 — Hardening, beta y rollout

**Duración orientativa:** 3–5 semanas.

### Trabajo

- Pruebas de rendimiento, memoria, lifecycle y redes deficientes.
- Auditoría de accesibilidad y privacidad.
- TestFlight y tracks internos/cerrados de Google Play.
- Migración de cohortes mediante feature flags y versiones de store.
- Runbooks de incidentes y rollback.
- Preparar soporte, FAQ y comunicación de cambios.

### Secuencia de rollout

1. Equipo interno.
2. Grupo beta de empleados.
3. 5–10 % de empleados elegibles.
4. Expansión por cohortes.
5. Beta de managers.
6. Expansión de managers.
7. Retiro de Capacitor sólo después del período de estabilidad acordado.

No debe cambiarse el bundle/application ID sin analizar sesiones, links, store listing y actualización de usuarios existentes.

## Estrategia de pruebas

| Nivel | Cobertura |
|---|---|
| Unitarias | Fechas, permisos, reducers, validaciones y transformaciones |
| Contrato | Queries, RPC, Edge Functions, Storage y errores esperados |
| Componentes | Estados visuales, interacción, accesibilidad y formularios |
| Integración | Auth, lifecycle, Realtime, red y almacenamiento |
| E2E | Login, solicitar, aprobar, perfil y deep link |
| Dispositivo | Widgets, permisos, background, biometría futura y stores |

CI debe ejecutar lint, tipos, unitarias y contratos en cada cambio; builds firmadas y E2E se ejecutan en ramas protegidas o candidatos de release. Los widgets requieren pruebas en dispositivos/simuladores nativos, no sólo Jest.

## Métricas de éxito

- Crash-free users y sesiones sin ANR.
- Tiempo de arranque frío y navegación a contenido útil.
- Éxito y duración de solicitar/aprobar vacaciones.
- Errores de refresh de sesión y reconexión.
- Adopción y taps útiles de widgets.
- Retención de beta y volumen de soporte.
- Comparación explícita con la baseline Capacitor.

Evitar métricas vanidosas: instalar el widget no prueba que ayude al usuario.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dos clientes móviles durante meses | Contratos estables, flags y ownership explícito |
| Divergencia entre web y mobile | Compartir dominio, no componentes visuales |
| Problemas de sesión en lifecycle | Spike temprano y tests background/foreground |
| Realtime duplicado o perdido | Canal centralizado, deduplicación e invalidación |
| Apariencia uniforme pero no nativa | Permitir diferencias iOS/Android y validar con usuarios |
| Dependencia excesiva de Expo | Prebuild desde el inicio y prueba de módulos nativos |
| Datos sensibles en widgets | Snapshot mínimo, borrado en logout y revisión de privacidad |
| Calendarios/fechas incorrectos | Matriz de zonas horarias, locales y casos límite |
| Scope creep hacia administración | Mantener el no-objetivo y medir uso móvil real |
| Capacitor se deteriora | Reservar capacidad de mantenimiento hasta el retiro |

## Puertas de decisión

### Gate A — Después de Fase 0

Continuar sólo si los spikes funcionan y producto acepta el alcance. Si el problema puede resolverse con rediseño Capacitor, comparar ese costo antes de aprobar la reescritura.

### Gate B — Después de autenticación

Continuar sólo si sesión, deep links y builds firmadas son estables en ambas plataformas.

### Gate C — Después del corte de empleado

Comparar experiencia, estabilidad y tiempo de tareas con Capacitor. Si no existe mejora relevante, detener la expansión.

### Gate D — Antes de widgets

Confirmar casos de uso, datos permitidos y valor esperado. Los widgets no deben construirse únicamente como elemento visual.

### Gate E — Antes de retirar Capacitor

Exigir adopción suficiente, estabilidad sostenida, compatibilidad backend y rollback documentado.

## Checklist final

- [ ] Alcance empleado/manager aprobado; administración permanece web.
- [ ] Inventario y métricas baseline completos.
- [ ] Spikes de Supabase, Realtime, avatar, widgets y builds aprobados.
- [ ] Dominio compartido sin dependencias de DOM/Capacitor.
- [ ] Auth, sesión y deep links validados en dispositivos reales.
- [ ] Flujos de empleado y manager cumplen criterios de paridad funcional.
- [ ] Accesibilidad verificada con VoiceOver y TalkBack.
- [ ] Widget no contiene credenciales ni información sensible innecesaria.
- [ ] CI/CD, Sentry, analytics y alertas operativas.
- [ ] Beta y rollout gradual completados.
- [ ] Capacitor conserva soporte hasta aprobar su retiro.
- [ ] Runbook de rollback probado.

## Próximo paso recomendado

Ejecutar la Fase 0 y producir un prototipo vertical pequeño: login, dashboard de empleado, una solicitud, Realtime básico y un widget de saldo con deep link. Ese prototipo debe decidir la arquitectura, no convertirse automáticamente en producción.