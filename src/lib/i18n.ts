import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  fallbackLng: "es",
  interpolation: { escapeValue: false },
  lng: "es",
  resources: {
    es: {
      translation: {
        auth: {
          corporate: "Acceso corporativo",
          email: "Correo",
          emailPlaceholder: "correo@empresa.com",
          enter: "Entrar",
          entering: "Entrando…",
          forgot: "Recuperar contraseña",
          loginAsideBody: "Gestiona solicitudes, vacaciones y el trabajo de tu equipo desde un solo lugar.",
          loginAsideTitle: "Tu jornada, clara desde el primer momento.",
          loginEyebrow: "Portal de colaboradores",
          loginIntro: "Ingresa con tus credenciales corporativas para continuar.",
          loginSecurity: "Espacio seguro para tu equipo",
          loginTitle: "Bienvenido de vuelta",
          notConfigured:
            "Supabase no está configurado. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
          password: "Contraseña",
          passwordPlaceholder: "Contraseña",
        },
        common: { cancel: "Cancelar", confirm: "Confirmar", loading: "Cargando…", retry: "Reintentar" },
      },
    },
    en: {
      translation: {
        auth: {
          corporate: "Corporate access",
          email: "Email",
          emailPlaceholder: "name@company.com",
          enter: "Sign in",
          entering: "Signing in…",
          forgot: "Forgot password",
          loginAsideBody: "Manage requests, time off, and your team's work from one place.",
          loginAsideTitle: "Your workday, clear from the start.",
          loginEyebrow: "Employee portal",
          loginIntro: "Enter your corporate credentials to continue.",
          loginSecurity: "A secure space for your team",
          loginTitle: "Welcome back",
          notConfigured:
            "Supabase is not configured. Check the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.",
          password: "Password",
          passwordPlaceholder: "Password",
        },
        common: { cancel: "Cancel", confirm: "Confirm", loading: "Loading…", retry: "Retry" },
      },
    },
  },
});

export { i18n };
