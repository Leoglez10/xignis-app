import { useState } from "react";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";

type ZoomableAvatarProps = { className?: string; name: string; shape?: string; size?: string; src?: string | null };

export function ZoomableAvatar({ className, name, shape, size, src }: ZoomableAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  if (!src) return <Avatar className={className} name={name} shape={shape} size={size} />;
  return (
    <>
      <button className="press block shrink-0" onClick={() => setIsOpen(true)} type="button">
        <Avatar className={className} name={name} shape={shape} size={size} src={src} />
        <span className="sr-only">Ver foto de {name} en grande</span>
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Foto de perfil">
        <img alt={name} className="mx-auto w-full max-w-sm rounded-[22px] object-contain" src={src} />
      </Modal>
    </>
  );
}
