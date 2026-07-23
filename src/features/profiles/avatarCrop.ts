/** Geometría del encuadre de la foto de perfil. Vive aparte del componente
 *  porque es la parte que falla en silencio: un signo cambiado recorta mal
 *  sin romper nada visible en el modal. */

/** Lado del recuadro de encuadre, en píxeles de pantalla. */
export const CROP_VIEW = 256;

export type Offset = { x: number; y: number };
export type AvatarCrop = { sx: number; sy: number; size: number };

/** Escala mínima para que la imagen siempre cubra el recuadro (tipo object-cover). */
export function baseScale(naturalWidth: number, naturalHeight: number): number {
  return CROP_VIEW / Math.min(naturalWidth, naturalHeight);
}

/** Impide que quede hueco: la imagen nunca se despega de los bordes del recuadro. */
export function clampOffset(offset: Offset, displayWidth: number, displayHeight: number): Offset {
  return {
    x: Math.min(0, Math.max(CROP_VIEW - displayWidth, offset.x)),
    y: Math.min(0, Math.max(CROP_VIEW - displayHeight, offset.y)),
  };
}

/** Encuadre centrado, el estado inicial y el del botón "Centrar". */
export function centerOffset(displayWidth: number, displayHeight: number): Offset {
  return { x: (CROP_VIEW - displayWidth) / 2, y: (CROP_VIEW - displayHeight) / 2 };
}

/** Traduce el encuadre en pantalla a un recorte en píxeles reales de la imagen. */
export function cropFromView(offset: Offset, scale: number): AvatarCrop {
  return { sx: -offset.x / scale, sy: -offset.y / scale, size: CROP_VIEW / scale };
}

/** Zoom anclado al centro del recuadro: acercar no "salta" la foto de lugar. */
export function offsetAfterZoom(offset: Offset, zoomRatio: number): Offset {
  const half = CROP_VIEW / 2;
  return { x: half - (half - offset.x) * zoomRatio, y: half - (half - offset.y) * zoomRatio };
}
