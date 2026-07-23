import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Drawer } from "vaul";
import { useIsDesktop } from "../../lib/useIsDesktop";

type BottomSheetProps = {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

/** Cabecera compartida (título + cerrar) para móvil y escritorio. */
function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xl font-bold text-[var(--color-text)]">{title}</h2>
      <button
        aria-label="Cerrar"
        className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
        type="button"
        onClick={onClose}
      >
        <X aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}

// Móvil: drawer vaul (arrastre, inercia, tap-fuera, Esc, scroll-lock, focus, portal).
// Escritorio: modal centrado real — no se estira al borde superior. Mismos props.
export function BottomSheet({ children, isOpen, onClose, title }: BottomSheetProps) {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop || !isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop, isOpen, onClose]);

  if (isDesktop) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 grid place-items-center p-6">
        <div
          aria-hidden="true"
          className="animate-backdrop absolute inset-0 bg-slate-950/35"
          onClick={onClose}
        />
        <div
          aria-label={title}
          aria-modal="true"
          className="animate-scale-in relative flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-[var(--card-bg)] p-6 shadow-2xl"
          role="dialog"
        >
          <Header title={title} onClose={onClose} />
          <div className="min-w-0 overflow-y-auto overflow-x-hidden">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-950/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-full flex-col overflow-hidden rounded-t-[28px] bg-[var(--card-bg)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:mb-4 sm:max-w-md sm:rounded-[28px]">
          <Drawer.Handle className="mx-auto mb-4 mt-1 h-1.5 w-11 shrink-0 rounded-full bg-slate-300" />
          <div className="mb-5 flex items-center justify-between">
            <Drawer.Title className="text-xl font-bold text-[var(--color-text)]">{title}</Drawer.Title>
            <button
              aria-label="Cerrar"
              className="grid size-11 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)]"
              type="button"
              onClick={onClose}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="min-w-0 overflow-x-hidden overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
