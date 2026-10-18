// Runs in Chromium, Firefox, and WebKit (Safari's engine). See playwright.config.js.
import { test, expect } from "@playwright/test";

// Fail any test if the page throws a JavaScript error.
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => { throw err; });
});

const noSideScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// Windows must never cover the name or each other.
const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const [w, h, label, mode] of [
  [1440, 900, "desktop", "around"],
  [1024, 700, "laptop (not full screen)", "below"],
  [800, 600, "small window", "below"],
]) {
  test(`${label} ${w}x${h}: windows stay on the desktop without covering the name`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    await expect(page.locator("#desktop")).toHaveAttribute("data-layout", mode);
    await expect(page.locator(".dock")).toBeVisible();
    const name = await page.locator(".hero h1").evaluate((el) => {
      const r = document.createRange(); r.selectNodeContents(el);
      const b = r.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height };
    });
    const boxes = [];
    for (const win of await page.locator("#windows .window").all()) boxes.push(await win.boundingBox());
    expect(boxes).toHaveLength(4);
    for (const b of boxes) expect(overlaps(b, name)).toBe(false);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false);
    expect(await noSideScroll(page)).toBe(true);
  });
}

test("filter tabs fade non-matching windows, and bring closed ones back", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.click('[data-id="sail"] .light.close');
  await expect(page.locator('[data-id="sail"]')).toBeHidden();
  await page.click('#tabs [data-tag="markets"]');
  await expect(page.locator('[data-id="sail"]')).toBeVisible();
  await expect(page.locator("#windows .window:not(.faded)")).toHaveCount(1);
  await page.click('#tabs [data-tag="all"]');
  await expect(page.locator("#windows .window.faded")).toHaveCount(0);
});

test("green button expands a window; clicking a window brings it to the front", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const reg = page.locator('[data-id="regulate"]');
  const before = (await reg.boundingBox()).width;
  await page.click('[data-id="regulate"] .light.max');
  expect((await reg.boundingBox()).width).toBeGreaterThan(before);
  await page.click('[data-id="nobe"] h2');
  const z = (id) => page.locator(`[data-id="${id}"]`).evaluate((el) => +getComputedStyle(el).zIndex);
  expect(await z("nobe")).toBeGreaterThan(await z("regulate"));
});

test("dock opens Free Time as a window; stats load; base popup opens and closes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.click('.dock [data-open="free"]');
  await expect(page.locator("#free-win")).toBeVisible();
  await expect(page.locator("#coc-name")).not.toHaveText("loading…");
  await page.click("#base-open");
  await expect(page.locator("#base-dialog")).toBeVisible();
  await page.click("#base-close");
  await expect(page.locator("#base-dialog")).toBeHidden();
  await page.click("#free-win .light.close");
  await expect(page.locator("#free-win")).toBeHidden();
});

test("dragging a window past the edge keeps it on the desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const bar = await page.locator('[data-id="nobe"] .titlebar').boundingBox();
  await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
  await page.mouse.down();
  await page.mouse.move(-500, -500, { steps: 8 });
  await page.mouse.up();
  const box = await page.locator('[data-id="nobe"]').boundingBox();
  const desk = await page.locator("#desktop").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(desk.x);
  expect(box.y).toBeGreaterThanOrEqual(desk.y);
});

test("phone: windows stack, Free Time fills the screen and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#desktop")).toHaveAttribute("data-layout", "stack");
  await page.click("#free-open");
  const sheet = page.locator("#free-win");
  await expect(sheet).toBeVisible();
  expect((await sheet.boundingBox()).width).toBeGreaterThan(360);
  await page.click("#free-win .light.close");
  await expect(sheet).toBeHidden();
  expect(await noSideScroll(page)).toBe(true);
});

test("the free-time folder can be dragged without opening, and a click opens it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const folder = page.locator("#free-open");
  const start = await folder.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x - 150, start.y - 120, { steps: 8 });
  await page.mouse.up();
  const end = await folder.boundingBox();
  expect(end.x).toBeLessThan(start.x - 100);
  await expect(page.locator("#free-win")).toBeHidden();   // dragging didn't open it
  await folder.click();
  await expect(page.locator("#free-win")).toBeVisible();
  await page.click("#free-win .light.close");
  await expect(page.locator("#free-win")).toBeHidden();
});

test("yellow minimizes into the dock; red closes into a desktop file icon", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const sail = page.locator('[data-id="sail"]');
  await page.click('[data-id="sail"] .light.min');
  await expect(sail).toBeHidden();
  const tile = page.locator('.dock-mini[data-win="sail"]');
  await expect(tile).toBeVisible();
  await tile.click();
  await expect(sail).toBeVisible();
  await expect(tile).toHaveCount(0);

  const reg = page.locator('[data-id="regulate"]');
  await page.click('[data-id="regulate"] .light.close');
  await expect(reg).toBeHidden();
  const icon = page.locator('.desk-file[data-win="regulate"]');
  await expect(icon).toBeVisible();
  await icon.click();
  await expect(reg).toBeVisible();
  await expect(icon).toHaveCount(0);
});
