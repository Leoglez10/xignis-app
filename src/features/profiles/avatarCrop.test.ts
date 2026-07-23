import { describe, expect, it } from "vitest";
import { CROP_VIEW, baseScale, centerOffset, clampOffset, cropFromView, offsetAfterZoom } from "./avatarCrop";

describe("avatarCrop", () => {
  it("escala el lado corto hasta cubrir el recuadro", () => {
    expect(baseScale(1000, 500)).toBe(CROP_VIEW / 500);
    expect(baseScale(500, 1000)).toBe(CROP_VIEW / 500);
  });

  it("no deja huecos en los bordes", () => {
    expect(clampOffset({ x: 50, y: 10 }, 512, 256)).toEqual({ x: 0, y: 0 });
    expect(clampOffset({ x: -999, y: 0 }, 512, 256)).toEqual({ x: CROP_VIEW - 512, y: 0 });
  });

  it("centrado + recorte devuelve el cuadrado central de la imagen", () => {
    // Imagen 1000x500: el cuadrado central arranca en x=250 y mide 500.
    const scale = baseScale(1000, 500);
    const offset = centerOffset(1000 * scale, 500 * scale);
    const crop = cropFromView(offset, scale);
    expect(crop.sx).toBeCloseTo(250);
    expect(crop.sy).toBeCloseTo(0);
    expect(crop.size).toBeCloseTo(500);
  });

  it("el zoom mantiene fijo el centro del recuadro", () => {
    // Con la foto centrada, duplicar el zoom no debe correr el punto central.
    expect(offsetAfterZoom(centerOffset(512, 512), 2)).toEqual(centerOffset(1024, 1024));
  });
});
