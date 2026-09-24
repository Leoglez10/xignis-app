import { describe, expect, it } from "vitest";
import { scopeToDirectReports } from "./teamScope";

const rows = [
  { employee_id: "a", id: "1" },
  { employee_id: "b", id: "2" },
  { employee_id: null, id: "3" },
];

describe("scopeToDirectReports", () => {
  it("acota al dueño a sus reportes directos", () => {
    expect(scopeToDirectReports(rows, "owner", ["a"]).map((r) => r.id)).toEqual(["1"]);
  });

  it("el dueño sin equipo no ve solicitudes de jefe", () => {
    expect(scopeToDirectReports(rows, "owner", [])).toEqual([]);
  });

  it("deja intacto lo que RLS ya acota para el jefe", () => {
    expect(scopeToDirectReports(rows, "manager", ["a"])).toBe(rows);
  });
});
