import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({ children, description, isOpen, onClose, title }: { children: ReactNode; description?: string; isOpen: boolean; onClose: () => void; title: string }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return createPortal(<div className="fixed inset-0 z-[70] grid items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-describedby={description ? "modal-description" : undefined} aria-labelledby="modal-title" aria-modal="true" className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] bg-[var(--card-bg)] p-5 shadow-2xl sm:max-w-lg sm:rounded-[28px]" role="dialog"><header className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-black" id="modal-title">{title}</h2>{description ? <p className="mt-1 text-sm text-[var(--color-muted)]" id="modal-description">{description}</p> : null}</div><button aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--color-surface)]" ref={closeRef} type="button" onClick={onClose}><X aria-hidden="true" className="size-5" /></button></header>{children}</section></div>, document.body);
}
