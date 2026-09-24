import { describe, expect, it } from "vitest";
import { navGroups, ownerTeamTab, tabsByRole, tabsFor, titleForPath } from "./navConfig";

describe("tabsFor", () => {
  it("agrega 'Aprobaciones' al dueño con reportes directos, antes de Análisis", () => {
    const tabs = tabsFor("owner", { hasDirectReports: true });
    expect(tabs).toContain(ownerTeamTab);
    expect(ownerTeamTab.to).toBe("/manager/requests");
    expect(tabs.indexOf(ownerTeamTab)).toBe(tabs.findIndex((t) => t.group === "Análisis") - 1);
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
    expect(groups.find((g) => g.name === "Mi equipo")?.items).toEqual([ownerTeamTab]);
    expect(titleForPath("owner", "/manager/requests", { hasDirectReports: true })).toBe("Aprobaciones");
  });

  it("no muestra el grupo 'Mi equipo' al dueño sin reportes directos", () => {
    expect(navGroups("owner").map((g) => g.name)).not.toContain("Mi equipo");
  });
});
