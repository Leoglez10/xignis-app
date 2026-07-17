import { useEffect, useState } from "react";

const TOP_ZONE = 56; // px cerca del tope: siempre visible
const THRESHOLD = 8; // px mínimos de movimiento para reaccionar (anti-jitter)

/** Lógica pura: decide si la barra debe esconderse. Testeable. */
export function nextHidden(prevY: number, curY: number, prevHidden: boolean): boolean {
  if (curY < TOP_ZONE) return false; // cerca del tope siempre visible
  const delta = curY - prevY;
  if (delta > THRESHOLD) return true; // bajando → esconder
  if (delta < -THRESHOLD) return false; // subiendo → mostrar
  return prevHidden; // sin movimiento relevante → mantener
}

/** `true` cuando barras (top/bottom) deben ocultarse por scroll hacia abajo. */
export function useScrollDirection(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let prevY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const curY = window.scrollY;
        setHidden((prev) => nextHidden(prevY, curY, prev));
        prevY = curY;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
