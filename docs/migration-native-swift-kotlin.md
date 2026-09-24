# Plan por etapas: migración móvil nativa con Swift y Kotlin

Este plan reemplaza gradualmente las aplicaciones móviles React + Capacitor por dos clientes nativos: SwiftUI para iOS y Jetpack Compose para Android. El panel web React/Vite de RR. HH. y administración permanece como producto independiente.

> Swift sólo cubre iOS. Para sostener iOS y Android de forma nativa son necesarios dos proyectos, dos ecosistemas de UI y una estrategia explícita para evitar que la lógica y el comportamiento diverjan.

> Las estimaciones son rangos de planificación, no compromisos. Deben recalibrarse después de los spikes de la Fase 0.

## Recomendación ejecutiva

La migración nativa completa ofrece el mayor control sobre apariencia, widgets, lifecycle y APIs del sistema, pero también tiene el costo y riesgo más altos. Sólo conviene aprobarla si existe una ventaja estratégica que React Native o un rediseño de Capacitor no puedan cumplir.

La estrategia recomendada, si se elige este camino, es:

- Conservar la web actual para RR. HH./administración.
- Migrar primero la experiencia de empleado y después manager.
- Crear contratos de dominio y backend independientes de cada lenguaje.
- Desarrollar iOS y Android en paralelo, con paridad contractual y diferencias visuales deliberadas.
- Incorporar WidgetKit y Glance desde la arquitectura, pero publicar widgets después de estabilizar sesión y datos.
- Mantener Capacitor publicable durante toda la transición.

## Resultado buscado

- iOS construido con Swift, SwiftUI y patrones propios de Apple.
- Android construido con Kotlin, Jetpack Compose y patrones Material/adaptativos.
- Widgets nativos, profundos y mantenibles en ambas plataformas.
- Backend Supabase y reglas RLS compartidos.
- Experiencia y comportamiento equivalentes, sin exigir interfaces idénticas.

## Alcance

### Incluido

- Aplicaciones nuevas para iOS y Android.
- Flujos móviles de empleados y managers.
- Integración con Supabase Auth, Postgres/RLS, Realtime, Storage y Edge Functions.
- Deep links/Universal Links/App Links.
- Keychain, Keystore/Encrypted Storage y preferencias locales.
- WidgetKit en iOS y Glance/App Widgets en Android.
- Observabilidad, CI/CD, betas, stores y rollout gradual.
- Contratos de prueba compartidos entre web, iOS y Android.

### Fuera de alcance inicial

- Reescribir el panel web de RR. HH./administración.
- Compartir componentes visuales entre SwiftUI y Compose.
- Offline-first con mutaciones complejas.
- Migrar Supabase a otro backend sin evidencia.
- Agregar módulos futuros de producto durante la reescritura.
- Igualdad pixel-perfect entre iOS y Android.

## Punto de partida y efecto sobre la migración

| Área actual | Qué se conserva | Qué cambia |
|---|---|---|
| Supabase y RLS | Esquema, políticas, funciones y contratos | Integración y modelos por plataforma |
| React/TypeScript | Web y referencia funcional | No se ejecuta dentro de las apps nativas |
| Lógica de dominio | Comportamiento y casos de prueba como especificación | Reimplementación en Swift y Kotlin |
| TanStack Query | Semántica de caché e invalidación | Capa de datos nativa por plataforma |
| React Hook Form/Zod | Reglas como referencia | Validación y formularios nativos |
| Tailwind/components | Tokens e intención visual | SwiftUI y Compose nuevos |
| Framer Motion/Vaul | Intención de movimiento y sheets | APIs nativas de cada plataforma |
| Sentry | Taxonomía y backend de observabilidad | SDKs nativos |
| Capacitor plugins | Requisitos funcionales | APIs nativas directas |
| PDF/CSV/avatar | Reglas y resultados esperados | Implementación móvil o server-side nueva |
| Web administrativa | Todo el producto actual | Continúa en React/Vite |

La existencia de aproximadamente 29 pantallas y 72 componentes no significa que todos deban migrarse. La Fase 0 debe separar claramente los flujos móviles de empleado/manager de las herramientas desktop de administración.

## Arquitectura objetivo

Una organización posible:

```text
apps/
├── web/                         # React + Vite existente
├── ios/
│   ├── XignisApp/
│   ├── XignisWidget/
│   ├── Features/
│   ├── Core/
│   └── Tests/
└── android/
    ├── app/
    ├── core/
    ├── feature-employee/
    ├── feature-manager/
    ├── widget/
    └── tests/
contracts/
├── api/                         # Contratos, ejemplos y errores
├── domain/                      # Reglas neutrales y casos de prueba
└── deep-links/                  # Rutas semánticas versionadas
supabase/
├── functions/
└── migrations/
```

### Capas por cliente

```text
Presentation → Application/Use Cases → Domain → Data Interfaces
                                          ↑
                  Supabase / Storage / Realtime adapters
```

- SwiftUI y Compose poseen sus estados de pantalla y navegación.
- El dominio no conoce SDKs de UI ni clientes Supabase.
- Los adaptadores traducen DTOs externos a modelos de dominio.
- Los contratos neutrales definen fechas, roles, estados, errores y permisos.
- Los widgets consumen snapshots reducidos producidos por la app o por un servicio diseñado para ello.

## Estrategia para evitar divergencia

No habrá reutilización binaria de lógica entre Swift y Kotlin salvo que en el futuro se apruebe Kotlin Multiplatform. Inicialmente se recomienda compartir **contratos y pruebas**, no un runtime adicional.

- Definir fixtures JSON canónicos para solicitudes, perfiles y errores.
- Ejecutar los mismos escenarios de contrato en web, iOS y Android.
- Mantener una matriz de capacidades y estados por plataforma.
- Aceptar diferencias de UI cuando siguen las convenciones del sistema.
- Exigir paridad en reglas, autorización, datos y resultados.
- Versionar deep links y snapshots de widgets.

Kotlin Multiplatform puede evaluarse después del primer corte vertical. Introducirlo desde el día uno suma una tercera decisión arquitectónica y puede retrasar la validación.

## Estrategia de convivencia

Durante la migración operan:

1. Web React/Vite para administración.
2. Aplicación Capacitor de producción.
3. Aplicación SwiftUI interna/beta.
4. Aplicación Compose interna/beta.

Reglas:

- Backend compatible con versiones antiguas mediante cambios aditivos.
- Feature flags por plataforma, rol, versión y cohorte.
- No retirar endpoints, columnas o estados hasta medir clientes activos.
- Correcciones críticas continúan llegando a Capacitor.
- iOS y Android pueden avanzar a velocidades distintas sin bloquearse, pero no se declara finalizada una etapa común hasta que ambas cumplan el contrato.
- El rollout puede detenerse por plataforma sin afectar la otra.

## Equipo y calendario orientativo

Equipo mínimo recomendable:

- 1 desarrollador iOS senior.
- 1 desarrollador Android senior.
- 1 referente de backend/Supabase compartido, parcial.
- QA con dispositivos iOS/Android desde el inicio.
- Diseño de producto con experiencia en Human Interface Guidelines y Material Design.

Escenarios aproximados después de Fase 0:

| Equipo | Primera versión empleado | Empleado + manager + widgets + rollout |
|---|---:|---:|
| 1 persona intentando ambas plataformas | 8–12 meses | 16–24 meses o más |
| 1 iOS + 1 Android | 4–6 meses | 8–12 meses |
| 2 por plataforma + QA dedicado | 3–4 meses | 6–9 meses |

Los rangos incluyen aprendizaje del dominio y hardening, pero no módulos futuros ni offline-first. La velocidad no escala linealmente: coordinación, contrato y releases agregan trabajo.

## Fase 0 — Inventario y prueba de viabilidad

**Duración orientativa:** 2–3 semanas.

### Objetivo

Determinar si el beneficio nativo justifica sostener dos clientes y validar la integración backend antes de construir el design system.

### Trabajo

- Inventariar pantallas, roles, rutas, permisos, datos y dependencias.
- Clasificar funciones como mobile, web-only o candidatas futuras.
- Medir métricas de Capacitor: arranque, errores, tiempo de tareas y abandono.
- Definir versiones mínimas de iOS/Android y política de dispositivos.
- Documentar contratos de Auth, tablas, RPC, Edge Functions, Realtime y Storage.
- Enumerar estados de lifecycle, conectividad y expiración de sesión.
- Definir qué significa “nativa” mediante criterios observables.
- Auditar privacidad y contenido permitido en widgets.

### Spikes obligatorios por plataforma

1. Login, persistencia y refresh de sesión.
2. Consulta RLS y manejo de errores tipados.
3. Realtime después de background/foreground y reconexión.
4. Subida de avatar a Storage.
5. Invocación de una Edge Function.
6. Widget que lee un snapshot y abre un deep link.
7. Build firmado instalado mediante canal interno.

No debe asumirse que los clientes Supabase de Swift y Kotlin tienen idéntica cobertura, madurez o semántica. Cada capacidad crítica debe probarse. Si una brecha obliga a escribir Auth o Realtime de bajo nivel, debe presupuestarse explícitamente o moverse detrás de una API/BFF.

### Entregables

- Matriz de SDK/capacidad por plataforma.
- Contrato inicial de dominio y errores.
- Métricas baseline.
- Prototipos descartables.
- Estimación recalibrada y decisión go/no-go.

### Criterio de salida

- Spikes exitosos en dispositivos reales.
- Estrategia acordada para cualquier brecha de SDK.
- Producto acepta costo de dos equipos y alcance móvil acotado.

### Rollback

No hay impacto en producción. Si el valor no justifica el costo, continuar con Capacitor o evaluar React Native.

## Fase 1 — Contratos y plataformas base

**Duración orientativa:** 3–5 semanas.

### Trabajo común

- Definir modelos, estados, fechas, errores, permisos y fixtures neutrales.
- Especificar rutas de deep link y versión de contratos.
- Definir taxonomía de analytics/Sentry sin datos sensibles.
- Configurar flags y entornos.

### iOS

- Crear targets de app, tests y futura extensión WidgetKit.
- Configurar Swift Concurrency, networking, Keychain y persistencia.
- Implementar navegación y composición de dependencias.
- Crear tokens y componentes SwiftUI base.

### Android

- Crear módulos Gradle, app, core, features, tests y widget.
- Configurar coroutines/Flow, networking, Keystore/DataStore y DI.
- Implementar Navigation Compose.
- Crear theme y componentes Compose base.

### Entregables

- Shells nativos instalables.
- Contratos y fixtures ejecutados por ambas plataformas.
- CI de compilación, análisis estático y unit tests.
- Design system mínimo.

### Criterio de salida

- Navegación, tipografía dinámica, dark mode si aplica y accesibilidad base.
- Ningún módulo de dominio depende de SwiftUI/Compose o del SDK externo.
- Builds reproducibles y firmadas para distribución interna.

### Rollback

Los nuevos proyectos pueden detenerse sin cambiar web ni Capacitor.

## Fase 2 — Auth, sesión y deep links

**Duración orientativa:** 3–5 semanas.

### Trabajo

- Login, activación, recuperación, logout y revocación.
- Persistencia segura y restauración de sesión.
- Refresh coordinado para evitar solicitudes duplicadas.
- Manejo de background, foreground, cierre y pérdida de red.
- Universal Links en iOS y App Links en Android.
- Navegación post-login conservando una intención segura.
- Borrado de datos locales y widgets al cerrar sesión.

### Criterio de salida

- Mismos escenarios contractuales en iOS y Android.
- Ningún dato protegido aparece antes de validar la sesión.
- Deep links funcionan con app cerrada, activa y en background.
- RLS impide accesos por rol incorrecto.

### Rollback

Sólo builds internas; Capacitor sigue siendo el cliente público.

## Fase 3 — Corte vertical de empleado

**Duración orientativa:** 6–9 semanas en paralelo.

### Orden

1. Dashboard y saldo.
2. Crear solicitud.
3. Historial y detalle.
4. Cancelación/acciones habilitadas.
5. Notificaciones relacionadas.

### iOS

- SwiftUI con NavigationStack, sheets, controles y feedback propios.
- Adaptación a Dynamic Type, VoiceOver y reduced motion.
- Estados de lifecycle y refresh apropiados.

### Android

- Compose con Material adaptativo, navegación y sheets apropiados.
- TalkBack, escalado de fuente y back navigation.
- Estados de proceso y conectividad coherentes con Android.

### Trabajo contractual

- Reimplementar reglas de fechas y saldo con fixtures comunes.
- Normalizar zonas horarias y fechas ISO.
- Mantener equivalencia de errores y permisos.
- Instrumentar éxito y duración de tareas.

### Criterio de salida

- Solicitar, listar y consultar produce resultados equivalentes.
- Calendarios superan casos límite de zona horaria y locale.
- Métricas de estabilidad y tarea mejoran o igualan la baseline.

### Rollback

Beta cerrada; empleados públicos permanecen en Capacitor.

## Fase 4 — Manager, aprobaciones y Realtime

**Duración orientativa:** 6–9 semanas en paralelo.

### Trabajo

- Bandeja, detalle, aprobación, rechazo y vistas de equipo.
- Adaptar calendarios, timeline, charts y heatmaps sólo donde aporten valor móvil.
- Centralizar Realtime por sesión y lifecycle.
- Deduplicar eventos e invalidar caché de manera explícita.
- Manejar acciones concurrentes y estados obsoletos.
- Diseñar notificaciones push como proyecto separado si se aprueban; Realtime no sustituye push.

### Criterio de salida

- Paridad contractual de decisiones y permisos.
- Reconexión estable después de background y cambio de red.
- Acciones duplicadas no provocan estados inconsistentes.
- UI puede diferir entre plataformas sin cambiar el resultado de negocio.

### Rollback

Deshabilitar manager por plataforma mediante flags; empleado y Capacitor continúan.

## Fase 5 — Perfil, avatar, archivos y caché

**Duración orientativa:** 3–5 semanas.

### Trabajo

- Picker, permisos, edición, compresión y subida de avatar.
- Estrategia para PDF/CSV: preferentemente generación server-side y share sheet.
- Caché cifrada o no cifrada según sensibilidad.
- Política de expiración, logout y cambio de cuenta.
- Lectura offline acotada con antigüedad visible.
- Mantener mutaciones offline fuera de alcance salvo especificación independiente.

### Criterio de salida

- Permisos denegados y memoria limitada no bloquean la app.
- Archivos temporales se limpian y no exponen credenciales.
- Estados stale/offline/error son distinguibles.

### Rollback

Deshabilitar capacidades secundarias por flag y conservar los flujos principales.

## Fase 6 — Widgets nativos

**Duración orientativa:** 3–5 semanas por plataforma, parcialmente paralelas.

### Casos iniciales

- Empleado: saldo y próxima ausencia aprobada.
- Manager: cantidad agregada de aprobaciones pendientes.
- Tap: abrir una ruta autenticada dentro de la aplicación.
- No incluir aprobación/rechazo interactivo en la primera versión.

### Contrato neutral

```text
WidgetSnapshot
- schemaVersion
- generatedAt
- expiresAt
- accountScopeHash
- role
- availableDays?
- nextApprovedLeave?
- pendingApprovalCount?
- destinationRoute
- displayState
```

El snapshot no incluye tokens, email, motivos de ausencia, comentarios ni identidad detallada de terceros. La app lo genera después de autenticar y lo borra al cerrar sesión, revocar acceso o cambiar cuenta.

### iOS: WidgetKit

- Target de app extension con SwiftUI.
- App Group para compartir el snapshot.
- Timeline Provider, placeholder y estados signed-out/stale.
- Protección/redacción en pantalla bloqueada cuando corresponda.
- Universal Link o custom route hacia la app.
- Actualización solicitada por la app después de cambios relevantes.
- No mantener conexiones Realtime desde la extensión.

### Android: Glance/App Widgets

- Módulo widget con Glance.
- Snapshot en DataStore o almacenamiento controlado.
- WorkManager para refresh elegible.
- PendingIntent/App Link hacia el destino.
- Soporte de tamaños y estados del launcher.
- Sin procesos persistentes ni Realtime permanente.

### Limitaciones

- El sistema controla el presupuesto de actualización.
- “Tiempo real” no puede prometerse en pantalla de inicio.
- El widget debe representar datos vencidos de forma segura.
- Toda acción sensible vuelve a autenticar/autorizAR en la app.
- Cada plataforma puede mostrar distinta cantidad de información.

### Criterio de salida

- Login/logout/cambio de cuenta limpian datos correctamente.
- Widget funciona bloqueado, offline y con snapshot vencido.
- Tap abre la ruta correcta y RLS vuelve a validar la lectura.
- Revisión de privacidad aprobada.

### Rollback

Retirar el widget del release siguiente o mostrar estado neutral; la app principal no depende de él.

## Fase 7 — Hardening y preparación de stores

**Duración orientativa:** 4–6 semanas.

### Trabajo

- Rendimiento, memoria, batería y lifecycle.
- Accesibilidad con VoiceOver y TalkBack.
- Seguridad de almacenamiento, logs, screenshots y archivos.
- Sentry, dashboards, alertas y símbolos de crash.
- Políticas de privacidad y declaraciones de stores.
- TestFlight y tracks internos/cerrados.
- Runbooks de incidentes y soporte.

### Criterio de salida

- Crash-free y ANR dentro de umbrales acordados.
- Flujos críticos pasan en matriz de dispositivos.
- No hay bloqueadores severos de accesibilidad o privacidad.
- Rollback probado por plataforma.

## Fase 8 — Rollout y retiro de Capacitor

**Duración orientativa:** 4–8 semanas de observación y expansión.

### Secuencia

1. Equipo interno por plataforma.
2. Beta cerrada de empleados.
3. 5–10 % de empleados elegibles.
4. Expansión por cohortes.
5. Beta y expansión de managers.
6. Período de estabilidad.
7. Retiro de Capacitor sólo con aprobación explícita.

El rollout de iOS y Android no necesita avanzar al mismo porcentaje. Una plataforma puede detenerse si presenta incidentes.

### Criterio de retiro

- Adopción mínima acordada.
- Estabilidad sostenida durante el período definido.
- Backend compatible y telemetría de versiones antiguas.
- Soporte preparado.
- Plan para usuarios que no pueden actualizar.
- Confirmación de que bundle IDs, deep links y listings preservan la ruta de actualización.

### Rollback

Detener rollout o revertir la versión por plataforma según las capacidades de cada store. Mantener backend compatible y Capacitor soportado hasta cerrar la ventana de reversión.

## Estrategia de pruebas

### Pirámide común

| Nivel | Propósito |
|---|---|
| Contratos neutrales | Misma interpretación de datos, errores y permisos |
| Unitarias nativas | Casos de uso, reducers/state y transformaciones |
| Integración | SDK Supabase, Auth, Storage, Realtime y lifecycle |
| UI | Estados, formularios, accesibilidad y navegación |
| E2E | Login, solicitar, aprobar, perfil y deep links |
| Dispositivo/store | Widgets, permisos, background, upgrade y firma |

### iOS

- XCTest/Swift Testing según versión adoptada.
- Pruebas de UI para flujos críticos.
- Snapshot tests sólo en componentes estables y con valor.
- Tests de WidgetKit y App Group.

### Android

- JUnit y pruebas de coroutines/Flow.
- Compose UI tests y pruebas instrumentadas.
- Tests de WorkManager, DataStore y widget.
- Baseline Profiles/Macrobenchmark si las métricas lo justifican.

Los tests web existentes continúan protegiendo web. Sus escenarios de negocio pueden convertirse en fixtures contractuales, pero no sustituyen pruebas nativas.

## CI/CD

### Pull requests

- Compilación, formato y análisis estático.
- Unit tests y contratos.
- Verificación de cambios de migraciones/contratos.
- Detección de secretos.

### Candidatos de release

- Builds firmadas.
- Integración y E2E en dispositivos/simuladores.
- Símbolos y source mapping en Sentry.
- Notas de release y matriz de flags.
- Validación de widgets y deep links.

### Separación de releases

- Web, iOS y Android tienen pipelines independientes.
- Los contratos backend incluyen compatibilidad mínima declarada.
- Una release de backend no depende de que ambas stores aprueben al mismo tiempo.

## Métricas de éxito

- Crash-free users y sesiones.
- ANR, memoria y consumo de batería.
- Arranque frío y tiempo a contenido útil.
- Éxito/duración de solicitar y aprobar.
- Fallos de sesión, reconexión y Realtime.
- Adopción y utilidad de widgets.
- Tickets de soporte por plataforma.
- Diferencias contractuales detectadas entre clientes.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Tres clientes mantenidos temporalmente | Ownership, flags y fecha de reevaluación |
| Divergencia Swift/Kotlin | Fixtures y contract tests comunes |
| Brechas de SDK Supabase | Spikes; adaptadores; BFF sólo si se justifica |
| Duplicación de reglas | Contrato neutral y revisión cruzada |
| Ritmos distintos por plataforma | Gates independientes y releases desacopladas |
| UI nativa pero comportamiento inconsistente | Paridad contractual, no pixel-perfect |
| Datos sensibles en widgets | Snapshot mínimo, borrado y redacción |
| Calendarios y zonas horarias | Fixtures exhaustivos y fuente temporal definida |
| Scope creep hacia admin | Administración continúa web |
| Equipo insuficiente | No iniciar ambas plataformas sin ownership real |
| Mantenimiento Capacitor abandonado | Capacidad reservada hasta retiro |
| Migración interminable | Cortes verticales y gates go/no-go |

## Puertas de decisión

### Gate A — Viabilidad

Después de Fase 0, comparar nativo, React Native y mejora de Capacitor. Aprobar nativo sólo si el beneficio adicional compensa dos clientes.

### Gate B — Fundación

No construir todas las pantallas hasta validar builds, contratos, sesión y deep links en ambas plataformas.

### Gate C — Empleado

Comparar UX y métricas con Capacitor. Si no existe una mejora clara, detener manager y revisar estrategia.

### Gate D — Manager

Confirmar uso móvil real de heatmaps, reportes y herramientas complejas; no migrar automáticamente funciones desktop.

### Gate E — Widgets

Aprobar caso de uso, privacidad y datos. El widget debe resolver una consulta frecuente, no ser sólo decorativo.

### Gate F — Retiro

No retirar Capacitor sin adopción, estabilidad, compatibilidad backend y rollback formalmente aprobados.

## Checklist final

- [ ] Está aceptado que Swift no reemplaza Android y que Kotlin es obligatorio para el alcance nativo completo.
- [ ] Existe ownership separado de iOS y Android.
- [ ] RR. HH./administración permanece web.
- [ ] Inventario y baseline completos.
- [ ] Spikes de Supabase aprobados por plataforma.
- [ ] Contratos, fixtures y errores neutrales versionados.
- [ ] Sesión, lifecycle y deep links probados en dispositivos.
- [ ] Empleado y manager cumplen paridad funcional.
- [ ] VoiceOver, TalkBack y escalado de texto validados.
- [ ] Widgets no guardan credenciales ni datos innecesarios.
- [ ] CI/CD, Sentry y alertas funcionan por plataforma.
- [ ] Rollout gradual y rollback probados.
- [ ] Capacitor sigue soportado hasta aprobar su retiro.
- [ ] El backend conserva compatibilidad con versiones activas.

## Próximo paso recomendado

Ejecutar una Fase 0 de tres semanas con dos prototipos equivalentes: login, dashboard de empleado, una solicitud, Realtime básico y un widget con deep link en SwiftUI y Compose. Al cierre, comparar ese resultado contra un prototipo React Native equivalente antes de comprometer el presupuesto completo.