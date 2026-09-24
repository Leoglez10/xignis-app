import { describe, expect, it } from "vitest";
import { navGroups, ownerTeamTab, tabsByRole, tabsFor, titleForPath } from "./navConfig";

describe("tabsFor", () => {
  it("agrega 'Mi equipo' al dueño con reportes directos, antes de Perfil", () => {
    const tabs = tabsFor("owner", { hasDirectReports: true });
    expect(tabs).toContain(ownerTeamTab);
    expect(ownerTeamTab.to).toBe("/manager/requests");
    expect(tabs.indexOf(ownerTeamTab)).toBe(tabs.findIndex((t) => t.to === "/profile") - 1);
  });

  it("no agrega 'Mi equipo' al dueño sin reportes directos", () => {
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
  it("incluye 'Mi equipo' en la sidebar del dueño y titula la ruta de jefe", () => {
    const items = navGroups("owner", { hasDirectReports: true }).flatMap((g) => g.items);
    expect(items.map((t) => t.label)).toContain("Mi equipo");
    expect(titleForPath("owner", "/manager/requests", { hasDirectReports: true })).toBe("Mi equipo");
  });
});
