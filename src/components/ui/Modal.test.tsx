import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

function renderModal(isOpen: boolean, origin?: { x: number; y: number }) {
  return render(
    <Modal isOpen={isOpen} onClose={() => {}} origin={origin} title="Foto de perfil">
      <p>contenido</p>
    </Modal>,
  );
}

describe("Modal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("keeps the panel mounted while the exit animation runs", () => {
    const { rerender } = renderModal(true);
    expect(screen.getByRole("dialog")).toBeTruthy();

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Foto de perfil">
        <p>contenido</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("animate-scale-out");

    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shrinks back toward the origin when one was given", () => {
    const { rerender } = renderModal(true, { x: 40, y: 90 });
    expect(screen.getByRole("dialog").className).toContain("animate-zoom-from-origin");

    rerender(
      <Modal isOpen={false} onClose={() => {}} origin={{ x: 40, y: 90 }} title="Foto de perfil">
        <p>contenido</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog").className).toContain("animate-zoom-to-origin");
  });
});
