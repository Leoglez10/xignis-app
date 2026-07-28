import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Punto en viewport desde el que el modal crece (centro del elemento que lo abrio). */
export type ModalOrigin = { x: number; y: number };

/** Debe cubrir la animacion de salida mas larga de globals.css (240ms) mas margen. */
const EXIT_DURATION_MS = 280;

export function Modal({ children, description, isOpen, onClose, origin, title }: { children: ReactNode; description?: string; isOpen: boolean; onClose: () => void; origin?: ModalOrigin | null; title: string }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [originReady, setOriginReady] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [isOpen, onClose]);
  // El desmontaje espera a la animacion de salida; entrar cancela un cierre a medias.
  useEffect(() => {
    if (isOpen) { setIsMounted(true); setIsClosing(false); return; }
    setIsClosing((wasClosing) => wasClosing || isMounted);
    if (!isMounted) return;
    const timer = window.setTimeout(() => { setIsMounted(false); setIsClosing(false); }, EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, isMounted]);
  // Se mide antes del primer paint para que el rect no venga ya escalado por la animacion.
  useLayoutEffect(() => {
    // Al cerrar se resetea: si no, al reabrir el panel ya vendria escalado y el origin saldria mal.
    if (!isOpen) { setOriginReady(false); return; }
    if (!origin || !panelRef.current) { setOriginReady(false); return; }
    const rect = panelRef.current.getBoundingClientRect();
    panelRef.current.style.transformOrigin = `${origin.x - rect.left}px ${origin.y - rect.top}px`;
    setOriginReady(true);
  }, [isOpen, origin]);
  if (!isMounted) return null;
  const exitAnimation = origin ? "animate-zoom-to-origin" : "animate-scale-out";
  const enterAnimation = origin ? (originReady ? "animate-zoom-from-origin" : "invisible") : "animate-scale-in";
  return createPortal(<div className={`${isClosing ? "animate-backdrop-out" : "animate-backdrop"} fixed inset-0 z-[70] grid items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-5`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-describedby={description ? "modal-description" : undefined} aria-labelledby="modal-title" aria-modal="true" className={`${isClosing ? exitAnimation : enterAnimation} max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--card-bg)] p-5 shadow-2xl sm:max-w-lg sm:rounded-[28px]`} onAnimationEnd={(event) => { if (isClosing && event.target === event.currentTarget) { setIsMounted(false); setIsClosing(false); } }} ref={panelRef} role="dialog"><header className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold" id="modal-title">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--color-muted)]" id="modal-description">{description}</p> : null}</div><button aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-surface)]" ref={closeRef} type="button" onClick={onClose}><X aria-hidden="true" className="size-5" /></button></header>{children}</section></div>, document.body);
}
