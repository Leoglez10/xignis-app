import { describe, expect, it } from "vitest";
import { isOwnerCompanyPath, navGroups, ownerTeamTab, ownerTeamTabs, ownerTeamViewTabs, tabsByRole, tabsFor, titleForPath } from "./navConfig";

describe("tabsFor", () => {
  it("agrega 'Aprobaciones' al dueño con reportes directos, antes de Análisis", () => {
    const tabs = tabsFor("owner", { hasDirectReports: true });
    expect(tabs).toContain(ownerTeamTab);
    expect(ownerTeamTab.to).toBe("/manager/requests");
    expect(tabs.indexOf(ownerTeamTab)).toBe(tabs.findIndex((t) => t.group === "Análisis") - ownerTeamTabs.length);
  });

  it("da al dueño con reportes las mismas pantallas de equipo que al jefe", () => {
    const team = tabsFor("owner", { hasDirectReports: true }).filter((t) => t.group === "Mi equipo");
    expect(team.map((t) => [t.label, t.to])).toEqual([
      ["Aprobaciones", "/manager/requests"],
      ["Equipo", "/manager/team"],
      ["Agenda", "/manager/calendar"],
    ]);
    const managerRoutes = tabsByRole.manager.map((t) => t.to);
    expect(team.every((t) => managerRoutes.includes(t.to))).toBe(true);
  });

  it("no agrega 'Aprobaciones' al dueño sin reportes directos", () => {
    expect(tabsFor("owner")).toEqual(tabsByRole.owner);
    expect(tabsFor("owner", { hasDirectReports: false })).not.toContain(ownerTeamTab);
  });

  it("no cambia la navegación de otros roles aunque tengan reportes", () => {
    expect(tabsFor("manager", { hasDirectReports: true })).toEqual(tabsByRole.manager);
    expect(tabsFor("admin", { hasDirectReports: true })).toEqual(tabsByRole.admin);
  });

  it("no muta las tabs base del dueño", () => {
    tabsFor("owner", { hasDirectReports: true });
    expect(tabsByRole.owner).not.toContain(ownerTeamTab);
  });
});

describe("navGroups / titleForPath con reportes directos", () => {
  it("agrupa 'Mi equipo' entre Principal y Análisis y titula la ruta de jefe", () => {
    const groups = navGroups("owner", { hasDirectReports: true });
    expect(groups.map((g) => g.name)).toEqual(["Principal", "Mi equipo", "Análisis"]);
    expect(groups.find((g) => g.name === "Mi equipo")?.items).toEqual(ownerTeamTabs);
    expect(titleForPath("owner", "/manager/requests", { hasDirectReports: true })).toBe("Aprobaciones");
    expect(titleForPath("owner", "/manager/team", { hasDirectReports: true })).toBe("Equipo");
    expect(titleForPath("owner", "/manager/calendar", { hasDirectReports: true })).toBe("Agenda");
  });

  it("no muestra el grupo 'Mi equipo' al dueño sin reportes directos", () => {
    expect(navGroups("owner").map((g) => g.name)).not.toContain("Mi equipo");
  });
});

describe("Cuenta (perfil + ajustes unificados)", () => {
  const roles = ["employee", "manager", "hr_admin", "admin", "owner"] as const;

  it("no agrega un grupo 'Cuenta' ni tabs a /cuenta (se llega desde el avatar y Ajustes)", () => {
    for (const role of roles) {
      for (const options of [{}, { hasDirectReports: true }, { hasDirectReports: true, teamView: true }]) {
        const tabs = tabsFor(role, options);
        expect(tabs.some((t) => t.group === "Cuenta")).toBe(false);
        expect(tabs.some((t) => t.to.startsWith("/cuenta"))).toBe(false);
        expect(navGroups(role, options).map((g) => g.name)).not.toContain("Cuenta");
      }
    }
  });

  it("titula 'Cuenta' todas las secciones, no 'Inicio'", () => {
    for (const role of roles) {
      for (const path of ["/cuenta", "/cuenta/perfil", "/cuenta/apariencia", "/cuenta/notificaciones", "/cuenta/privacidad", "/cuenta/acerca"]) {
        expect(titleForPath(role, path)).toBe("Cuenta");
      }
    }
    expect(titleForPath("owner", "/cuenta/apariencia", { hasDirectReports: true })).toBe("Cuenta");
  });

  it("no confunde rutas que solo empiezan igual", () => {
    expect(titleForPath("employee", "/cuentas")).toBe("Inicio");
  });
});

describe("vista 'solo equipo' del dueño", () => {
  it("muestra solo el equipo", () => {
    const tabs = tabsFor("owner", { hasDirectReports: true, teamView: true });
    expect(tabs).toBe(ownerTeamViewTabs);
    expect(tabs.map((t) => [t.label, t.to])).toEqual([
      ["Inicio", "/manager"],
      ["Aprobaciones", "/manager/requests"],
      ["Equipo", "/manager/team"],
      ["Agenda", "/manager/calendar"],
    ]);
    expect(tabs.some((t) => isOwnerCompanyPath(t.to))).toBe(false);
    expect(navGroups("owner", { hasDirectReports: true, teamView: true }).map((g) => g.name)).toEqual(["Mi equipo"]);
    expect(titleForPath("owner", "/manager", { hasDirectReports: true, teamView: true })).toBe("Inicio");
    expect(titleForPath("owner", "/manager/team", { hasDirectReports: true, teamView: true })).toBe("Equipo");
  });

  it("se ignora sin reportes directos o para otros roles", () => {
    expect(tabsFor("owner", { teamView: true })).toEqual(tabsByRole.owner);
    expect(tabsFor("manager", { hasDirectReports: true, teamView: true })).toEqual(tabsByRole.manager);
  });

  it("reconoce las rutas de toda la empresa del dueño", () => {
    expect(isOwnerCompanyPath("/owner")).toBe(true);
    expect(isOwnerCompanyPath("/owner/requests/1")).toBe(true);
    expect(isOwnerCompanyPath("/manager/requests")).toBe(false);
    expect(isOwnerCompanyPath("/owners")).toBe(false);
  });
});
