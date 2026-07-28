import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { Modal, type ModalOrigin } from "./Modal";

type ZoomableAvatarProps = {
  className?: string;
  isRemoving?: boolean;
  name: string;
  onRemove?: () => void;
  shape?: string;
  size?: string;
  src?: string | null;
};

export function ZoomableAvatar({ className, isRemoving, name, onRemove, shape, size, src }: ZoomableAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState<ModalOrigin | null>(null);
  if (!src) return <Avatar className={className} name={name} shape={shape} size={size} />;
  return (
    <>
      <button
        className="press block shrink-0"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          setIsOpen(true);
        }}
        type="button"
      >
        <Avatar className={className} name={name} shape={shape} size={size} src={src} />
        <span className="sr-only">Ver foto de {name} en grande</span>
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} origin={origin} title="Foto de perfil">
        <img alt={name} className="mx-auto w-full max-w-sm rounded-[22px] object-contain" src={src} />
        {onRemove ? (
          <button
            className="press mx-auto mt-4 flex w-fit min-h-11 items-center gap-2 rounded-full bg-red-50 px-5 text-sm font-bold text-red-700 ring-1 ring-red-100 disabled:opacity-50"
            disabled={isRemoving}
            onClick={() => {
              setIsOpen(false);
              onRemove();
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Quitar foto
          </button>
        ) : null}
      </Modal>
    </>
  );
}
