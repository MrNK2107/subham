import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG 2.2 AA audit of the current page; fails with the list of violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  expect(summary).toEqual([]);
}

/** Creates a wedding plan through the wizard (mock AI) and waits for the dashboard. */
export async function createWeddingPlan(page: Page) {
  await page.goto("/plan/new");
  await page.getByRole("radio", { name: /wedding/i }).check();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("list", { name: /functions/i }).getByRole("listitem")).toHaveCount(5);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Name of the celebration").fill("Lakshmi & Vikram");
  await page.getByLabel("City or town").fill("Madurai");
  const next = new Date();
  next.setMonth(next.getMonth() + 4);
  await page.getByLabel("Main date").fill(next.toISOString().slice(0, 10));
  await page.getByLabel("Number of guests").fill("250");
  await page.getByLabel("Total budget").fill("10 lakh");
  await page.getByRole("button", { name: "Create my plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Lakshmi & Vikram" })).toBeVisible({
    timeout: 20_000,
  });
}
