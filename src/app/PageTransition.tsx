import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import type { Location } from "react-router-dom";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { bumpHaptic } from "../lib/haptics";
import { useAuth } from "../features/session/AuthContext";
import { tabsByRole, type NavTab } from "./navConfig";

const EDGE = 28; // px desde el borde izquierdo donde arranca el gesto
const COMMIT = 0.4; // fracción de ancho arrastrada para confirmar "atrás"
const TAB_COMMIT = 0.3; // fracción de ancho para confirmar cambio de pestaña
const ease = [0.32, 0.72, 0, 1] as const;

/** Índice de la pestaña activa para un pathname (mismo criterio que titleForPath). */
function tabIndexFor(tabs: NavTab[], pathname: string): number {
  return tabs.findIndex((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
}

/** Índice exacto: el swipe entre pestañas solo aplica en la raíz de cada tab,
 *  no en sus pantallas de detalle (ahí el gesto sigue siendo "atrás"). */
function exactTabIndex(tabs: NavTab[], pathname: string): number {
  return tabs.findIndex((t) => t.to === pathname);
}

/** ¿El gesto nace dentro de un carrusel horizontal (strips, nav scrollable)?
 *  Entonces el scroll es de ese elemento, no del router. */
function insideHorizontalScroller(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    if (node.scrollWidth > node.clientWidth + 1) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") return true;
    }
    node = node.parentElement;
  }
  return false;
}

/** Transición deslizante entre rutas + arrastre interactivo tipo iOS.
   Un único motion value (`x`) gobierna tanto el gesto como la animación
   programática → sin conflictos. La página anterior se muestra debajo con
   parallax mientras arrastras. */
export function PageTransition({ children }: { children: (loc: Location) => ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const { profile } = useAuth();
  const tabs = profile?.role ? tabsByRole[profile.role] : [];

  const x = useMotionValue(0);
  // "back" = arrastre desde el borde (volver). "tab" = swipe libre entre pestañas.
  const [drag, setDrag] = useState<null | "back" | "tab">(null);
  const reducedMotion = useReducedMotion();

  // Página de la que venimos = destino del gesto "atrás".
  const curRef = useRef(location);
  const prevRef = useRef<Location | null>(null);
  if (curRef.current.key !== location.key) {
    prevRef.current = curRef.current;
    curRef.current = location;
  }

  const firstRef = useRef(true);
  const fromDrag = useRef(false);

  // Animación de entrada en navegación programática (no-arrastre).
  useLayoutEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    if (fromDrag.current || reducedMotion) {
      fromDrag.current = false;
      x.set(0);
      return;
    }
    const w = window.innerWidth;
    let from = w; // PUSH por defecto: entra desde la derecha (push iOS)
    if (navType === "POP") {
      from = -w * 0.3; // volver: parallax desde la izquierda
    } else {
      // Salto entre pestañas hermanas → dirección según su orden (carrusel).
      const prev = prevRef.current;
      const pi = prev ? tabIndexFor(tabs, prev.pathname) : -1;
      const ci = tabIndexFor(tabs, location.pathname);
      if (pi !== -1 && ci !== -1 && pi !== ci) from = ci > pi ? w : -w;
    }
    x.set(from);
    const controls = animate(x, 0, { duration: 0.32, ease });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key]);

  // Parallax: la página inferior entra desde -25% hacia su sitio.
  const underX = useTransform(x, (v) => {
    const w = window.innerWidth || 1;
    return -0.25 * (w - v);
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const armed = useRef<null | "back" | "tab">(null);
  const tabTarget = useRef<string | null>(null);

  function onTouchStart(e: TouchEvent) {
    if (drag || reducedMotion) return;
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    armed.current = null;
    if (prevRef.current && t.clientX <= EDGE) {
      armed.current = "back";
      return;
    }
    if (exactTabIndex(tabs, location.pathname) !== -1 && !insideHorizontalScroller(e.target)) {
      armed.current = "tab";
    }
  }

  function onTouchMove(e: TouchEvent) {
    const mode = armed.current;
    if (!mode) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (!drag) {
      if (Math.abs(dy) > Math.abs(dx)) {
        armed.current = null; // gesto vertical → es scroll, abortar
        return;
      }
      if (mode === "back" ? dx < 6 : Math.abs(dx) < 6) return;
      setDrag(mode);
    }
    if (mode === "back") {
      x.set(Math.max(0, dx));
      return;
    }
    // Sin pestaña vecina en esa dirección → resistencia, no arrastre.
    const i = exactTabIndex(tabs, location.pathname);
    const neighbour = tabs[dx < 0 ? i + 1 : i - 1];
    tabTarget.current = neighbour?.to ?? null;
    x.set(neighbour ? dx : dx * 0.2);
  }

  function onTouchEnd() {
    const mode = armed.current;
    armed.current = null;
    if (!mode || !drag) return;
    const w = window.innerWidth;
    const dx = x.get();

    if (mode === "back") {
      if (dx > w * COMMIT) {
        bumpHaptic();
        animate(x, w, {
          duration: 0.2,
          ease,
          onComplete: () => {
            fromDrag.current = true;
            navigate(-1);
            setDrag(null);
          },
        });
        return;
      }
    } else {
      const to = tabTarget.current;
      tabTarget.current = null;
      if (to && Math.abs(dx) > w * TAB_COMMIT) {
        bumpHaptic();
        // Sale hacia el lado del swipe; la nueva pestaña entra desde el opuesto
        // gracias a la animación de orden de tabs del efecto de arriba.
        animate(x, dx < 0 ? -w : w, {
          duration: 0.2,
          ease,
          onComplete: () => {
            navigate(to);
            setDrag(null);
          },
        });
        return;
      }
    }
    animate(x, 0, { duration: 0.2, ease, onComplete: () => setDrag(null) });
  }

  return (
    <div
      className="relative min-h-dvh overflow-x-clip"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {drag === "back" && prevRef.current ? (
        <motion.div className="absolute inset-0" style={{ x: underX }}>
          {children(prevRef.current)}
        </motion.div>
      ) : null}
      <motion.div className="relative min-h-dvh w-full" style={{ x }}>
        {children(location)}
      </motion.div>
    </div>
  );
}
