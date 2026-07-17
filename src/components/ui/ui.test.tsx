import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { StepDots } from "./StepDots";

describe("UI accesible", () => {
  it("expone progreso del wizard", () => {
    render(<StepDots current={1} total={4} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
  });
  it("bloquea Button durante loading", () => {
    render(<Button loading>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });
  it("abre y cierra BottomSheet", async () => {
    const onClose = vi.fn();
    render(<BottomSheet isOpen title="Editar empleado" onClose={onClose}><p>Contenido</p></BottomSheet>);
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
