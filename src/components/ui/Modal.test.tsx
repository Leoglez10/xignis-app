import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal, type ModalOrigin } from "./Modal";

const ORIGIN: ModalOrigin = { x: 40, y: 90 };

function markup(isOpen: boolean, origin?: ModalOrigin) {
  return (
    <Modal isOpen={isOpen} onClose={() => {}} origin={origin} title="Foto de perfil">
      <p>contenido</p>
    </Modal>
  );
}

describe("Modal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps the panel mounted while the exit animation runs", () => {
    const { rerender } = render(markup(true));
    expect(screen.getByRole("dialog")).toBeTruthy();

    rerender(markup(false));
    expect(screen.getByRole("dialog").className).toContain("animate-scale-out");

    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // Regresion: el panel se monta un render despues de isOpen, asi que medir el origin
  // solo al cambiar isOpen dejaba el modal en "invisible" para siempre.
  it("becomes visible when it is opened after being closed", () => {
    const { rerender } = render(markup(false, ORIGIN));
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(markup(true, ORIGIN));
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("animate-zoom-from-origin");
    expect(dialog.className).not.toContain("invisible");
  });

  it("shrinks back toward the origin when one was given", () => {
    const { rerender } = render(markup(true, ORIGIN));
    rerender(markup(false, ORIGIN));
    expect(screen.getByRole("dialog").className).toContain("animate-zoom-to-origin");
  });
});
