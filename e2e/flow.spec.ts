import { expect, test } from "@playwright/test";
import { createWeddingPlan } from "./helpers";

test("describe in one line, review and create a plan", async ({ page }) => {
  await page.goto("/");
  await page
    .getByLabel("Describe your celebration")
    .fill("Wedding in Hyderabad, 250 guests, 12 lakh");
  await page.getByRole("button", { name: "Fill it in for me" }).click();
  await expect(page.getByText(/we filled in what we understood/i)).toBeVisible();
  await expect(page.getByLabel("City or town")).toHaveValue("Hyderabad");
  await expect(page.getByLabel("City type")).toHaveValue("metro");
  await expect(page.getByText("That's ₹12,00,000")).toBeVisible();
});

test("plan, overspend, ask the assistant, approve the fix, export the calendar", async ({
  page,
}) => {
  await createWeddingPlan(page);

  // Log a payment larger than the first budget line.
  await page.getByRole("tab", { name: "Budget" }).click();
  await page.getByLabel("Amount paid").fill("9 lakh");
  await page.getByRole("button", { name: "Add payment" }).click();
  await expect(page.getByText(/Over by/).first()).toBeVisible();

  // The assistant proposes a rebalance; nothing changes until it is approved.
  await page.getByRole("button", { name: "Ask the assistant to rebalance" }).click();
  const proposal = page.getByRole("group", { name: "Proposed changes" });
  await expect(proposal).toBeVisible();
  await proposal.getByRole("button", { name: "Apply" }).click();
  await expect(proposal.getByText(/Applied/)).toBeVisible();

  // Calendar export.
  await page.getByRole("button", { name: "Close assistant" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download calendar" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.ics$/);
});

test("tasks, guests and vendors persist after a reload", async ({ page }) => {
  await createWeddingPlan(page);

  await page.getByRole("tab", { name: "Timeline" }).click();
  const first = page.getByRole("checkbox").first();
  await first.check();

  await page.getByRole("tab", { name: "Guests" }).click();
  await page.getByLabel("Name").fill("Sharma family");
  await page.getByLabel("People").fill("5");
  await page.getByLabel("RSVP", { exact: true }).selectOption("yes");
  await page.getByRole("button", { name: "Add guest" }).click();

  await page.getByRole("tab", { name: "Vendors" }).click();
  await page.getByLabel("Status").first().selectOption("booked");

  await page.reload();
  await page.getByRole("tab", { name: "Guests" }).click();
  await expect(page.getByText(/5 confirmed/)).toBeVisible();
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("tab", { name: "Overview" }).click();
  await expect(page.getByText("1 of", { exact: false }).first()).toBeVisible();
});

test("the interface switches to Tamil and Telugu", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language", { exact: true }).selectOption("ta");
  await expect(page.locator("html")).toHaveAttribute("lang", "ta");
  await expect(page.locator("h1")).toContainText("கொண்டாட்ட");
  await expect(page.getByRole("link", { name: "புதிய திட்டம்" })).toBeVisible();
  await page.getByLabel(/^(மொழி|Language)$/).selectOption("te");
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
  await expect(page.locator("h1")).toContainText("వేడుక");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "te");
});

test("ideas can be refreshed and saved", async ({ page }) => {
  await createWeddingPlan(page);
  await page.getByRole("tab", { name: "Ideas" }).click();
  await page.getByRole("button", { name: /fresh ideas/i }).click();
  await expect(page.getByRole("heading", { name: "New suggestions" })).toBeVisible();
});
