import { expect, test } from "@playwright/test";
import { createWeddingPlan, expectAccessible } from "./helpers";

test("landing page is accessible in English and Tamil", async ({ page }) => {
  await page.goto("/");
  await expectAccessible(page);
  await page.getByLabel("Language").selectOption("ta");
  await expectAccessible(page);
});

test("wizard steps are accessible, including error states", async ({ page }) => {
  await page.goto("/plan/new");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Next" }).click();
  await expectAccessible(page);
  await page.getByRole("radio", { name: /birthday/i }).check();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Create my plan" }).click();
  await expectAccessible(page);
});

test("every dashboard tab and the assistant are accessible", async ({ page }) => {
  await createWeddingPlan(page);
  for (const tab of ["Overview", "Budget", "Timeline", "Vendors", "Guests", "Ideas"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expectAccessible(page);
  }
  await page.getByRole("button", { name: "Ask the assistant" }).click();
  await expectAccessible(page);
});

test("my plans page is accessible", async ({ page }) => {
  await createWeddingPlan(page);
  await page.goto("/plans");
  await expectAccessible(page);
});

test("no page scrolls sideways on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile layout only");
  await createWeddingPlan(page);
  for (const tab of ["Overview", "Budget", "Timeline", "Vendors", "Guests", "Ideas"]) {
    await page.getByRole("tab", { name: tab }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, tab).toBeLessThanOrEqual(1);
  }
});
