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
    return { x: r.left + (f.x / 1024) * r.width, y: r.top + (f.y / 768) * r.height };
  });
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(2600);
  expect(await jarCount(page)).toBe(1);
  await page.screenshot({ path: 'test-results/caught.png' });
});

test('ten catches celebrate, then the round resets', async ({ page }) => {
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
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/celebrate.png' });
  await page.waitForTimeout(6500);
  expect(await jarCount(page)).toBe(0);
  expect(await page.evaluate(() => window.__game.scene.getScene('MainScene').celebrating)).toBe(false);
  expect(await page.evaluate(() => window.__game.scene.getScene('MainScene').fireflies.length)).toBe(10);
});
