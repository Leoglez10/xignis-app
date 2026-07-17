import { expect, test } from "@playwright/test";

test("carga login sin errores visibles", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Algo falló");
});

test("una ruta protegida conserva el destino", async ({ page }) => {
  await page.goto("/employee/requests");
  await expect(page).toHaveURL(/\/login$/);
});
