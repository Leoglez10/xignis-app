import { Capacitor } from "@capacitor/core";
import { memo, useCallback, useRef, useState, type ReactNode } from "react";

const THRESHOLD = 70;
const RESISTANCE = 0.55;

type RefreshBoundaryProps = {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
};

async function hapticLight() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics opcional */
  }
}

/** Pull-to-refresh nativo: touch events sobre el contenedor, sin librería externa.
 *  Solo dispara si scrollTop===0 y delta > THRESHOLD. Haptic al cruzar threshold. */
export const RefreshBoundary = memo(function RefreshBoundary({ children, onRefresh }: RefreshBoundaryProps) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const crossed = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) {
      pulling.current = false;
      return;
    }
    startY.current = e.touches[0].clientY;
    pulling.current = true;
    crossed.current = false;
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const delta = (e.touches[0].clientY - startY.current) * RESISTANCE;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    setPull(delta);
    if (!crossed.current && delta > THRESHOLD) {
      crossed.current = true;
      void hapticLight();
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (crossed.current && pull > THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [onRefresh, pull]);

  const showIndicator = pull > 0 || refreshing;

  return (
    <div
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      style={{
        transform: showIndicator ? `translateY(${refreshing ? THRESHOLD : pull}px)` : undefined,
        transition: pulling.current ? "none" : "transform 240ms cubic-bezier(0.32,0.72,0,1)",
      }}
    >
      {showIndicator ? (
        <div
          aria-hidden="true"
          className="grid place-items-center text-xs font-bold text-[var(--color-muted)]"
          style={{ height: refreshing ? THRESHOLD : pull, overflow: "hidden" }}
        >
          {refreshing ? "Actualizando…" : pull > THRESHOLD ? "Suelta para refrescar" : "Desliza para refrescar"}
        </div>
      ) : null}
      {children}
    </div>
  );
});