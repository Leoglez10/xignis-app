import { describe, expect, it } from "vitest";
import { navGroups, ownerTeamTab, ownerTeamTabs, tabsByRole, tabsFor, titleForPath } from "./navConfig";

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
    expect(groups.map((g) => g.name)).toEqual(["Principal", "Mi equipo", "Análisis", "Cuenta"]);
    expect(groups.find((g) => g.name === "Mi equipo")?.items).toEqual(ownerTeamTabs);
    expect(titleForPath("owner", "/manager/requests", { hasDirectReports: true })).toBe("Aprobaciones");
    expect(titleForPath("owner", "/manager/team", { hasDirectReports: true })).toBe("Equipo");
    expect(titleForPath("owner", "/manager/calendar", { hasDirectReports: true })).toBe("Agenda");
  });

  it("no muestra el grupo 'Mi equipo' al dueño sin reportes directos", () => {
    expect(navGroups("owner").map((g) => g.name)).not.toContain("Mi equipo");
  });
});
