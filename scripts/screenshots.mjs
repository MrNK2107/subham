// Regenerates the README screenshots against a running production server with the mock AI:
//   AI_PROVIDER=mock npm run build && AI_PROVIDER=mock npx next start -p 3518
//   node scripts/screenshots.mjs http://localhost:3518
import { fileURLToPath } from "node:url";
import { chromium, devices } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3518";
const out = new URL("../docs/screenshots/", import.meta.url);
const shot = (page, name, opts = {}) =>
  page.screenshot({
    path: fileURLToPath(new URL(`${name}.jpg`, out)),
    type: "jpeg",
    quality: 82,
    ...opts,
  });

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

async function createPlan(page) {
  await page.goto(`${base}/plan/new`);
  await page.getByRole("radio", { name: /wedding/i }).check();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Name of the celebration").fill("Lakshmi & Vikram");
  await page.getByLabel("City or town").fill("Madurai");
  const next = new Date();
  next.setMonth(next.getMonth() + 4);
  await page.getByLabel("Main date").fill(next.toISOString().slice(0, 10));
  await page.getByLabel("Number of guests").fill("250");
  await page.getByLabel("Total budget").fill("10 lakh");
  await page.getByRole("button", { name: "Create my plan" }).click();
  await page
    .getByRole("heading", { level: 1, name: "Lakshmi & Vikram" })
    .waitFor({ timeout: 30_000 });
}

try {
  // Desktop: landing hero (WebGL street), wizard, dashboard tabs.
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await desktop.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator(".street-canvas canvas").waitFor({ timeout: 20_000 });
  await page.waitForTimeout(3500);
  await shot(page, "landing");

  await page.goto(`${base}/plan/new`);
  await page.getByRole("radio", { name: /wedding/i }).check();
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForTimeout(800);
  await shot(page, "wizard");

  await createPlan(page);
  await page.waitForTimeout(1200);
  await shot(page, "dashboard");
  await page.getByRole("tab", { name: "Budget" }).click();
  await page.waitForTimeout(1000);
  await shot(page, "budget");
  await page.getByRole("tab", { name: "Timeline" }).click();
  await page.waitForTimeout(1000);
  await shot(page, "timeline");
  await desktop.close();

  // Phone: landing.
  const phone = await browser.newContext({ ...devices["Pixel 7"] });
  const mobile = await phone.newPage();
  await mobile.goto(base, { waitUntil: "networkidle" });
  await mobile.locator(".street-canvas canvas").waitFor({ timeout: 20_000 });
  await mobile.waitForTimeout(3500);
  await shot(mobile, "landing-mobile");
  await phone.close();
} finally {
  await browser.close();
}
