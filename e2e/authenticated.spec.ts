import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.skip(
  !email || !password,
  "Kræver E2E_USER_EMAIL og E2E_USER_PASSWORD på en isoleret testkonto.",
);

test("bruger kan logge ind, registrere et cykelpas og eksportere data", async ({
  page,
}) => {
  await page.goto("/auth/log-ind");
  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Adgangskode").fill(password!);
  await page.getByRole("button", { name: "Log ind" }).click();
  await expect(page).toHaveURL(/\/mine-annoncer/);

  await page.goto("/mine-cykler/ny");
  const nickname = `E2E cykel ${Date.now()}`;
  await page.getByLabel("Kaldenavn").fill(nickname);
  await page.getByLabel("Type").selectOption("road");
  await page.getByLabel("Mærke").selectOption("Canyon");
  await page.getByLabel("Model").fill("Ultimate CF SL");
  await page.getByLabel("Modelår").fill("2025");
  await page.getByLabel("Stelstørrelse, label").fill("M");
  await page.getByLabel("Stelstørrelse i cm").fill("56");
  await page.getByLabel("Stelmateriale").selectOption("carbon");
  await page.getByLabel("Gearmærke").selectOption("Shimano");
  await page.getByLabel("Geargruppe").fill("Ultegra");
  await page.getByLabel("Drivlinje").fill("2x12");
  await page.getByLabel("Bremsetype").selectOption("disc-hydraulic");
  await page.getByLabel("Anskaffelsesdato").fill("2025-01-15");
  await page.getByLabel("Købt gennem").selectOption("dealer");
  await page.getByLabel("Købspris i kr.").fill("32000");
  await page.getByRole("button", { name: "Gem under Mine cykler" }).click();

  await expect(page.getByRole("heading", { level: 1, name: nickname })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kvitteringer og bilag" })).toBeVisible();

  const exportResponse = await page.request.get("/api/account/export");
  expect(exportResponse.ok()).toBeTruthy();
  expect(exportResponse.headers()["content-type"]).toContain("application/json");
  const exportData = await exportResponse.json();
  expect(exportData.format).toBe("cykelbasen-account-export-v1");
  expect(
    exportData.registeredBikes.some(
      (bike: { nickname?: string }) => bike.nickname === nickname,
    ),
  ).toBeTruthy();
});
