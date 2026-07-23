import { expect, test } from "@playwright/test";

test("forside, markedsplads og forum kan åbnes", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Den næste cykel/ }),
  ).toBeVisible();

  await page.goto("/cykler");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Find en cykel, der faktisk passer.",
    }),
  ).toBeVisible();

  await page.goto("/forum");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Viden bliver bedre, når den bliver delt.",
    }),
  ).toBeVisible();
});

test("markedspladsfiltre gemmes i URL'en", async ({ page }) => {
  await page.goto("/cykler");
  await page.getByRole("button", { name: "Vis og redigér filtre" }).click();
  await page.getByLabel("Type").selectOption("road");
  await page.getByLabel("Fra").fill("10000");
  await page.getByRole("button", { name: /Vis.*cykler/i }).click();

  await expect(page).toHaveURL(/category=road/);
  await expect(page).toHaveURL(/minPrice=10000/);
  await expect(page.getByLabel("Aktive filtre")).toContainText("Landevej");
});

test("login fra en annonce bevarer destinationen", async ({ page }) => {
  await page.goto("/cykler");
  const firstListing = page.locator('a[href^="/cykler/"]').first();
  await expect(firstListing).toBeVisible();
  await firstListing.click();

  const listingPath = new URL(page.url()).pathname;
  await page.getByRole("link", { name: "Log ind for at kontakte" }).click();

  await expect(page).toHaveURL(/\/auth\/log-ind\?returnTo=/);
  const returnTo = new URL(page.url()).searchParams.get("returnTo");
  expect(returnTo).toContain(listingPath);
});

test("robots, sitemap og legal-sider er tilgængelige", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("Disallow: /admin/");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/cykler");

  await page.goto("/privatliv");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Dine data",
  );
  await page.goto("/vilkaar");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Klare regler",
  );
});
