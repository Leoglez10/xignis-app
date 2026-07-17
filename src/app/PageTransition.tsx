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
const ease = [0.32, 0.72, 0, 1] as const;

/** Índice de la pestaña activa para un pathname (mismo criterio que titleForPath). */
function tabIndexFor(tabs: NavTab[], pathname: string): number {
  return tabs.findIndex((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
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
  const [dragging, setDragging] = useState(false);
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
  const armed = useRef(false);

  function onTouchStart(e: TouchEvent) {
    if (!prevRef.current || dragging || reducedMotion) return;
    const t = e.touches[0];
    if (t.clientX > EDGE) return;
    startX.current = t.clientX;
    startY.current = t.clientY;
    armed.current = true;
  }

  function onTouchMove(e: TouchEvent) {
    if (!armed.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    if (!dragging) {
      if (Math.abs(dy) > Math.abs(dx)) {
        armed.current = false; // gesto vertical → es scroll, abortar
        return;
      }
      if (dx < 6) return;
      setDragging(true);
    }
    x.set(Math.max(0, dx));
  }

  function onTouchEnd() {
    if (!armed.current) return;
    armed.current = false;
    if (!dragging) return;
    const w = window.innerWidth;
    if (x.get() > w * COMMIT) {
      bumpHaptic();
      animate(x, w, {
        duration: 0.2,
        ease,
        onComplete: () => {
          fromDrag.current = true;
          navigate(-1);
          setDragging(false);
        },
      });
    } else {
      animate(x, 0, { duration: 0.2, ease, onComplete: () => setDragging(false) });
    }
  }

  return (
    <div
      className="relative min-h-dvh overflow-x-clip"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {dragging && prevRef.current ? (
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
