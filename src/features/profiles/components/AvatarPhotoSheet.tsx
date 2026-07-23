import { ImageUp, Move } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";
import { BottomSheet } from "../../../components/ui/BottomSheet";
import { Button } from "../../../components/ui/Button";
import { CROP_VIEW, baseScale, centerOffset, clampOffset, cropFromView, offsetAfterZoom, type Offset } from "../avatarCrop";
import { AVATAR_MAX_MB, avatarFileError, cropToWebp } from "../services/profileService";

const MAX_ZOOM = 3;
const KEY_STEP = 8;

type AvatarPhotoSheetProps = {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (image: Blob) => void;
};

/** Paso 1: elegir archivo (click o arrastrar). Paso 2: encuadrar. */
export function AvatarPhotoSheet({ isOpen, isSaving, onClose, onConfirm }: AvatarPhotoSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [isDropping, setIsDropping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragOrigin = useRef<Offset | null>(null);

  // El object URL es un recurso del navegador: se libera al cambiar de foto o cerrar.
  useEffect(() => {
    // Soltar el archivo tiene que volver al paso 1: si el url queda colgado,
    // "Elegir otra foto" no hace nada visible.
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  useEffect(() => {
    if (isOpen) return;
    setFile(null);
    setUrl(null);
    setNatural(null);
    setError(null);
  }, [isOpen]);

  const scale = natural ? baseScale(natural.width, natural.height) * zoom : 1;
  const displayWidth = natural ? natural.width * scale : 0;
  const displayHeight = natural ? natural.height * scale : 0;

  function acceptFile(picked: File | undefined) {
    if (!picked) return;
    const invalid = avatarFileError(picked);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setNatural(null);
    setZoom(1);
    setFile(picked);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    // Se limpia para poder reintentar con el mismo archivo despues de un error.
    event.target.value = "";
    acceptFile(picked);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDropping(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  function handleImageLoad(event: { currentTarget: HTMLImageElement }) {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    const initial = baseScale(naturalWidth, naturalHeight);
    setNatural({ width: naturalWidth, height: naturalHeight });
    setOffset(centerOffset(naturalWidth * initial, naturalHeight * initial));
  }

  /** Sin esto, una foto que el navegador no puede decodificar deja el recuadro
   *  en negro para siempre y sin explicacion. */
  function handleImageError() {
    setFile(null);
    setError("No se pudo abrir esa imagen. Probá con otra o con un JPG.");
  }

  function moveTo(next: Offset) {
    setOffset(clampOffset(next, displayWidth, displayHeight));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!natural) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const origin = dragOrigin.current;
    if (!origin) return;
    moveTo({ x: event.clientX - origin.x, y: event.clientY - origin.y });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    dragOrigin.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // Arrastrar con el mouse no es la unica forma de encuadrar: las flechas mueven igual.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, Offset> = {
      ArrowDown: { x: 0, y: -KEY_STEP },
      ArrowLeft: { x: KEY_STEP, y: 0 },
      ArrowRight: { x: -KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: KEY_STEP },
    };
    const step = steps[event.key];
    if (!step || !natural) return;
    event.preventDefault();
    moveTo({ x: offset.x + step.x, y: offset.y + step.y });
  }

  function handleZoomChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.target.value);
    if (!natural) return;
    const ratio = next / zoom;
    const nextScale = baseScale(natural.width, natural.height) * next;
    setOffset(clampOffset(offsetAfterZoom(offset, ratio), natural.width * nextScale, natural.height * nextScale));
    setZoom(next);
  }

  function handleCenter() {
    setOffset(centerOffset(displayWidth, displayHeight));
  }

  async function handleConfirm() {
    if (!file || !natural) return;
    try {
      onConfirm(await cropToWebp(file, cropFromView(offset, scale)));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "No se pudo procesar la imagen.");
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Foto de perfil">
      <div className="space-y-4">
        {url ? (
          <>
            <div
              aria-label="Arrastra para encuadrar la foto. Tambien puedes usar las flechas."
              className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-slate-200 active:cursor-grabbing"
              onKeyDown={handleKeyDown}
              onPointerCancel={handlePointerUp}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              role="group"
              style={{ height: CROP_VIEW, width: CROP_VIEW }}
              tabIndex={0}
            >
              <img
                alt=""
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                draggable={false}
                onError={handleImageError}
                onLoad={handleImageLoad}
                src={url}
                style={
                  natural
                    ? { height: displayHeight, transform: `translate(${offset.x}px, ${offset.y}px)`, width: displayWidth }
                    : { visibility: "hidden" }
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <Move aria-hidden="true" className="size-4 shrink-0 text-[var(--color-muted)]" />
              <input
                aria-label="Zoom"
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-[var(--color-primary)]"
                max={MAX_ZOOM}
                min={1}
                onChange={handleZoomChange}
                step={0.01}
                type="range"
                value={zoom}
              />
            </div>

            <p className="text-center text-xs text-[var(--color-muted)]">Arrastra la foto para elegir que parte se ve.</p>

            {error ? (
              <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex gap-3">
              <Button className="flex-1" disabled={isSaving} onClick={handleCenter} variant="secondary">
                Centrar
              </Button>
              <Button className="flex-1" disabled={!natural} loading={isSaving} onClick={handleConfirm}>
                Guardar foto
              </Button>
            </div>

            <button
              className="block w-full text-center text-xs font-bold text-[var(--color-muted)] underline"
              disabled={isSaving}
              onClick={() => setFile(null)}
              type="button"
            >
              Elegir otra foto
            </button>
          </>
        ) : (
          <>
            <label
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-8 text-center transition ${isDropping ? "border-[var(--color-primary)] bg-emerald-50" : "border-slate-300"}`}
              onDragLeave={() => setIsDropping(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropping(true);
              }}
              onDrop={handleDrop}
            >
              <ImageUp aria-hidden="true" className="size-8 text-[var(--color-muted)]" />
              <span className="text-sm font-bold">Arrastra una foto o toca para elegirla</span>
              <span className="text-xs text-[var(--color-muted)]">JPG, PNG o WebP, hasta {AVATAR_MAX_MB} MB</span>
              <input accept="image/*" className="sr-only" onChange={handleInputChange} type="file" />
            </label>

            {error ? (
              <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
