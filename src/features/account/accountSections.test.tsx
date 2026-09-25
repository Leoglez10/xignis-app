import { render, screen } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { accountPath, accountSections, isAccountPath, isAccountSection, legacyAccountRedirects } from "./accountSections";

function Where() {
  return <p>at:{useLocation().pathname}</p>;
}

/** Mismo cableado de redirecciones que App.tsx. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {Object.entries(legacyAccountRedirects).map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate replace to={to} />} />
        ))}
        <Route path="/cuenta/:section" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("accountSections", () => {
  it("ordena las secciones con Perfil primero", () => {
    expect(accountSections.map((s) => s.label)).toEqual(["Perfil", "Apariencia", "Notificaciones", "Privacidad", "Acerca de"]);
    expect(accountPath()).toBe("/cuenta/perfil");
  });

  it("valida secciones y rutas de cuenta", () => {
    expect(isAccountSection("apariencia")).toBe(true);
    expect(isAccountSection("otra")).toBe(false);
    expect(isAccountSection(undefined)).toBe(false);
    expect(isAccountPath("/cuenta")).toBe(true);
    expect(isAccountPath("/cuenta/acerca")).toBe(true);
    expect(isAccountPath("/cuentas")).toBe(false);
  });

  it("redirige /profile a /cuenta/perfil", () => {
    renderAt("/profile");
    expect(screen.getByText("at:/cuenta/perfil")).toBeInTheDocument();
  });

  it("redirige /settings a /cuenta/apariencia", () => {
    renderAt("/settings");
    expect(screen.getByText("at:/cuenta/apariencia")).toBeInTheDocument();
  });
});
