import { test, expect } from '@playwright/test';

const jarCount = (page) => page.evaluate(() => window.__game.scene.getScene('MainScene').jar.count);

test('boots without console errors and renders a canvas', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/firefly-jar/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/smoke.png' });
  expect(errors).toEqual([]);
});

test('tapping a firefly puts it in the jar', async ({ page }) => {
  await page.goto('/firefly-jar/');
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0);
  expect(await jarCount(page)).toBe(0);
  const pt = await page.evaluate(() => {
    const s = window.__game.scene.getScene('MainScene');
    const f = s.fireflies[0];
    const r = s.game.canvas.getBoundingClientRect();
    return { x: r.left + (f.x / s.scale.gameSize.width) * r.width, y: r.top + (f.y / s.scale.gameSize.height) * r.height };
  });
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(700);
  // mid-flight the firefly must still be visible and shrinking (regression: scale was NaN)
  const mid = await page.evaluate(() => {
    const s = window.__game.scene.getScene('MainScene');
    return s.children.list.filter((c) => c.type === 'Container').map((c) => c.scaleX).filter((v) => !(v >= 0.3 && v <= 1));
  });
  expect(mid).toEqual([]);
  await page.waitForTimeout(1900);
  expect(await jarCount(page)).toBe(1);
  await page.screenshot({ path: 'test-results/caught.png' });
});

test('ten catches celebrate, then the round resets', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/firefly-jar/');
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0);
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      const s = window.__game.scene.getScene('MainScene');
      s.catchFirefly(s.fireflies.find((f) => !f.caught));
    });
    await page.waitForTimeout(1700);
  }
  expect(await page.evaluate(() => window.__game.scene.getScene('MainScene').celebrating)).toBe(true);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'test-results/celebrate.png' });
  await page.waitForTimeout(8500);
  expect(await jarCount(page)).toBe(0);
  expect(await page.evaluate(() => window.__game.scene.getScene('MainScene').celebrating)).toBe(false);
  expect(await page.evaluate(() => window.__game.scene.getScene('MainScene').fireflies.length)).toBe(10);
});

test.describe('Android phone, portrait, touch', () => {
  test.use({ viewport: { width: 393, height: 851 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.75 });

  test('finger-sized tap targets; a real touch tap catches a firefly', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/firefly-jar/');
    await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0);
    // on-screen tap circle diameter must be >= 96 CSS px even though the stage is scaled down
    const info = await page.evaluate(() => {
      const s = window.__game.scene.getScene('MainScene');
      const f = s.fireflies[0];
      const r = s.game.canvas.getBoundingClientRect();
      return {
        portrait: s.scale.gameSize.height > s.scale.gameSize.width,
        hitCss: (f.zone.input.hitArea.radius * 2 * r.width) / s.scale.gameSize.width,
        x: r.left + (f.x / s.scale.gameSize.width) * r.width,
        y: r.top + (f.y / s.scale.gameSize.height) * r.height,
      };
    });
    expect(info.portrait).toBe(true);
    expect(info.hitCss).toBeGreaterThanOrEqual(96);
    await page.touchscreen.tap(info.x, info.y);
    await page.waitForTimeout(2600);
    expect(await jarCount(page)).toBe(1);
    await page.screenshot({ path: 'test-results/phone.png' });
    expect(errors).toEqual([]);
  });
});

test('rotating a phone to landscape fills the screen in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/firefly-jar/');
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0);
  expect(await page.evaluate(() => window.__game.scale.gameSize.height)).toBeGreaterThan(1024);
  await page.setViewportSize({ width: 851, height: 393 });
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0 && window.__game.scale.gameSize.width > 1024);
  const canvas = await page.evaluate(() => { const r = window.__game.canvas.getBoundingClientRect(); return r.width / r.height; });
  expect(canvas).toBeCloseTo(851 / 393, 1); // canvas fills the screen shape, no stretching
  await page.screenshot({ path: 'test-results/rotated.png' });
});

test('rotating landscape -> portrait fills the screen again (no tiny frame)', async ({ page }) => {
  await page.setViewportSize({ width: 851, height: 393 });
  await page.goto('/firefly-jar/');
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0);
  await page.setViewportSize({ width: 393, height: 851 });
  await page.waitForFunction(() => window.__game?.scene.getScene('MainScene')?.fireflies?.length > 0 && window.__game.scale.gameSize.height > window.__game.scale.gameSize.width);
  const r = await page.evaluate(() => { const c = window.__game.canvas.getBoundingClientRect(); return { w: c.width, h: c.height }; });
  expect(r.w).toBeGreaterThan(380);
  expect(r.h).toBeGreaterThan(830);
});
