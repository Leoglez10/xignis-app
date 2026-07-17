import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook que emite un título de páginaorno vía el atributo `data-page-title`
 * en el `<main id="main-content">`. El `TopBar` lee este atributo si existe
 * para mostrar el título correcto en rutas de detalle que hoy caerían en
 * "Inicio" porque `titleForPath` solo conoce rutas tab.
 *
 * Uso:
 *   usePageTitle("Detalle de solicitud");
 */
export function usePageTitle(title: string | null | undefined) {
  const navigate = useNavigate();
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (title) main.setAttribute("data-page-title", title);
    return () => {
      main.removeAttribute("data-page-title");
    };
  }, [title, navigate]);
}