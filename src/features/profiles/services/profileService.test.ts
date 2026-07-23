import { describe, expect, it } from "vitest";
import { AVATAR_MAX_MB, avatarFileError, roleLabel } from "./profileService";

describe("roleLabel", () => {
  it("traduce cada rol al espanol del producto", () => {
    expect(roleLabel.admin).toBe("Admin");
    expect(roleLabel.employee).toBe("Empleado");
    expect(roleLabel.hr_admin).toBe("RH");
    expect(roleLabel.manager).toBe("Jefe");
  });
});

describe("avatarFileError", () => {
  function fakeFile(type: string, size: number) {
    return Object.defineProperty(new File([""], "foto", { type }), "size", { value: size }) as File;
  }

  it("acepta una foto de celular grande: el original nunca se sube tal cual", () => {
    expect(avatarFileError(fakeFile("image/jpeg", 12 * 1024 * 1024))).toBeNull();
  });

  it("rechaza lo que no es imagen", () => {
    expect(avatarFileError(fakeFile("application/pdf", 1000))).toMatch(/imagen/);
  });

  it("corta donde decodificar se vuelve peligroso para la memoria", () => {
    expect(avatarFileError(fakeFile("image/png", (AVATAR_MAX_MB + 1) * 1024 * 1024))).toMatch(`${AVATAR_MAX_MB} MB`);
  });
});
