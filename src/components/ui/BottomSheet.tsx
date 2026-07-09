import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";

type BottomSheetProps = {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

// vaul: drawer con arrastre + inercia/velocidad, tap-fuera, Esc, scroll-lock,
// focus y portal (escapa ancestros con transform). Mismos props que antes.
export function BottomSheet({ children, isOpen, onClose, title }: BottomSheetProps) {
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-950/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-full flex-col overflow-hidden rounded-t-[28px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl outline-none sm:mb-4 sm:max-w-md sm:rounded-[28px]">
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
