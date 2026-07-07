# Xignis App - Especificaciones de Diseño y UI

## 1. Mapa de Pantallas (Screens)

El flujo se divide en dos áreas principales: Autenticación y Panel de Empleados.

Ver inventario completo en `docs/screens.md`.

* **Autenticación:**
    * `LoginScreen`: Pantalla de entrada con selección de rol ("Admin" / "Entrar") y enlace a registro.
    * `RegisterScreen`: Creación de cuenta nueva ("Crea tu cuenta").
    * `ForgotPasswordScreen`: Inicio de recuperación ("Reiniciar password").
    * `VerifyCodeScreen`: Ingreso de código de 4 dígitos ("Ingresar código").
    * `ResetPasswordScreen`: Creación de nueva contraseña y confirmación ("Nuevo password", "¡Listo!").
* **Aplicación (Core):**
    * `DashboardEmpleados`: Vista principal del empleado tras iniciar sesión.
    * `SolicitudPermisoScreen`: Vista principal del formulario de permisos. Muestra el perfil del usuario y 4 secciones colapsables/navegables.
    * `SeleccionFechaModal`: Interfaz de calendario para elegir el rango de fechas.
    * `TipoPermisoModal`: Lista de opciones con radio buttons para definir el motivo de la ausencia.

## 2. Flujo de Navegación

* **Auth Flow:** Navegación lineal estricta. Login -> Recuperación -> Verificación -> Reset -> Login.
* **Permisos Flow:** Desde el `DashboardEmpleados` se navega a `SolicitudPermisoScreen`. 
    * *Comportamiento esperado:* Al tocar "Fechas del permiso" o "Tipo de permiso", no se navega a una página nueva, sino que se despliega un *Bottom Sheet* o *Modal* sobre la pantalla actual. Al presionar "Guardar", el modal se cierra y los datos se reflejan en la pantalla principal de la solicitud.
    * *Acción final:* El botón "Continuar" procesa la solicitud completa.

## 3. Sistema de Componentes (UI Kit)

Identificación de componentes reutilizables (ideales para aislar en una carpeta `/components`):

* **Botones:**
    * `PrimaryButton`: Fondo verde sólido, texto blanco, bordes redondeados completos (pill-shape). Usado para "Continuar" y "Guardar".
    * `OutlineButton`: Fondo transparente, borde oscuro, texto oscuro. Usado para "Limpiar".
* **Inputs y Listas:**
    * `ActionRow` / `MenuListItem`: Contenedor gris claro con esquinas redondeadas, texto descriptivo y un ícono de flecha (`>`) a la derecha indicando interacción.
    * `RadioOption`: Fila con un Radio Button a la izquierda y el texto de la opción.
    * `PinInput`: Campos separados para el ingreso del código de 4 dígitos.
* **Módulos Complejos:**
    * `UserProfileCard`: Contiene el `Avatar` (foto del usuario circular), `Nombre` (bold) y `Cargo` (texto secundario).
    * `CalendarWidget`: Cuadrícula mensual con cabecera de días (Do, Lu, Ma...), con soporte para resaltar el día actual/seleccionado (marcador verde cuadrado).

## 4. Paleta de Colores (Estimación)

* **Primary Brand (Verde):** `#00D25B` o equivalente (Ej. Tailwind `bg-green-500`). Representa las acciones de éxito y llamadas a la acción principales.
* **Background (Fondo):** `#FFFFFF` (Blanco puro para las pantallas principales).
* **Surface (Elementos secundarios):** `#F3F4F6` (Gris muy claro, para los fondos de los botones colapsables en el menú de solicitud).
* **Text Primary:** `#111827` (Casi negro, para títulos y nombres).
* **Text Secondary:** `#6B7280` (Gris medio, para subtítulos como "Director General" y placeholders).
* **Borders:** `#D1D5DB` o `#000000` (Dependiendo de si es un borde estructural o el borde de un botón secundario activo).

## 5. Estructura de Formularios (Data Models)

### Solicitud de Permiso
Este es el formulario principal de la aplicación. Debe mantener un estado global o de contexto antes de enviarse.

**Campos:**
1.  `empleado_id` (Oculto, derivado de la sesión activa).
2.  `fechas`: Rango (Fecha inicio, Fecha fin) - *Input: CalendarWidget.*
3.  `tipo_permiso`: Enum/String (Ej. Enfermedad, Personal, Vacaciones) - *Input: RadioGroup.*
4.  `horario`: Rango de horas o jornada completa - *Input: (Pendiente de definir UI).*
5.  `actividades_pendientes`: Texto o array de tareas - *Input: (Pendiente de definir UI).*

**Validaciones sugeridas:**
* El botón "Continuar" debe estar deshabilitado (`disabled`) hasta que, como mínimo, `fechas` y `tipo_permiso` tengan un valor válido.
* Bloquear la selección de fechas en el pasado en el `CalendarWidget`.
