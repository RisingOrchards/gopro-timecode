'use strict';
// Optional browser verification. Use a tooling environment with Playwright;
// it is not an application/build dependency. Start scripts/serve.cjs first.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const G = require('../public/settings-core.js');
const P = require('../public/settings-presets.js');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const shots = process.env.TEST_SCREENSHOT_DIR;
async function run() {
  const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/settings.html');
    await page.locator('#camera-generate').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    async function generate(expected) {
      await page.locator('#camera-generate').click();
      assert.equal(await page.locator('#camera-command').textContent(), expected);
      assert.equal(await page.locator('#camera-qr').isVisible(), true);
    }
    for (const id of Object.keys(P.definitions)) {
      await page.locator('#camera-preset').selectOption(id);
      await generate(G.buildGoProCommand(P.resolve(id, 'mission-1-pro'), 'mission-1-pro'));
    }
    await page.locator('#camera-preset').selectOption('cinema');
    await generate('mVr8p24e0d1hH0cLbHw55i4s180sL');
    await page.locator('#setting-whiteBalance').selectOption('3200');
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    assert.equal(await page.locator('#camera-copy').isDisabled(), true);
    assert.equal(await page.locator('#camera-preset').inputValue(), 'custom');
    await generate('mVr8p24e0d1hH0cLbHw32i4s180sL');
    await page.locator('#camera-remember').check();
    await page.reload();
    assert.equal(await page.locator('#setting-whiteBalance').inputValue(), '3200');
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    await page.locator('#setting-frameRate').selectOption('60');
    await page.locator('#camera-model').selectOption('mission-1');
    assert.equal(await page.locator('#camera-generate').isDisabled(), true);
    assert.match(await page.locator('#camera-form-status').textContent(), /combination/);
    await page.locator('#camera-preset').selectOption('cinema');
    await generate('mVr8p24e0d1hH0cLbHw55i4s180sL');
    await page.locator('#camera-mode').selectOption('photo');
    assert.equal(await page.locator('#camera-video-fields').isVisible(), false);
    await page.locator('#setting-rawPhoto').selectOption('on');
    await generate('mPrw55');
    await page.locator('#camera-mode').selectOption('video');
    await generate('mVr8p24e0d1hH0cLbHw55i4s180sL');
    await page.locator('#camera-reset').click();
    assert.equal(await page.locator('#camera-remember').isChecked(), false);
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    assert.equal(await page.evaluate(() => localStorage.getItem('igorbox.camera-settings.v1')), null);
    await page.locator('#camera-model').selectOption('mission-1-pro-ils');
    await page.locator('#camera-preset').selectOption('run');
    assert.equal(await page.locator('#setting-stabilization').inputValue(), 'off');
    await page.locator('#setting-stabilization').selectOption('on');
    assert.equal(await page.locator('#camera-generate').isDisabled(), true);
    await page.locator('#camera-ils-lens').check();
    await generate('mVr8p30e1d1hH0cLbHwAi16s0sL');
    await page.locator('#camera-fullscreen').click();
    assert.equal(await page.locator('#camera-fullscreen').textContent(), 'Exit full screen');
    await page.locator('#camera-fullscreen').click();
    // Also cover the CSS enlargement used by iPhone/iPad browser configurations
    // without the element Fullscreen API, without changing the live user's browser.
    await page.locator('#camera-qr-panel').evaluate(element => { element.requestFullscreen = undefined; });
    await page.locator('#camera-fullscreen').click();
    assert.equal(await page.locator('#camera-qr-panel').evaluate(element => element.classList.contains('expanded')), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#camera-qr-panel').evaluate(element => element.classList.contains('expanded')), false);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.testCopiedCommand = text; } } }));
    await page.locator('#camera-copy').click();
    assert.equal(await page.evaluate(() => window.testCopiedCommand), 'mVr8p30e1d1hH0cLbHwAi16s0sL');
    // Exercise the clipboard fallback independently of platform clipboard permissions.
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.locator('#camera-copy').click();
    assert.match(await page.locator('#camera-copy-status').textContent(), /selected/);
    await page.locator('#camera-model').selectOption('mission-1-pro');
    await page.locator('#camera-preset').selectOption('cinema');
    await page.locator('#camera-advanced').evaluate(element => { element.open = true; });
    await generate('mVr8p24e0d1hH0cLbHw55i4s180sL');
    if (shots) {
      fs.mkdirSync(shots, { recursive: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(shots, 'camera-settings-desktop.png'), fullPage: true });
    }
    await page.locator('#camera-advanced').evaluate(element => { element.open = false; });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Horizontal overflow at ' + width);
      await page.locator('#camera-generate').click();
      const box = await page.locator('#camera-qr').boundingBox();
      assert.ok(box.width >= 220 && box.width <= width);
      if (shots && width === 390) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(shots, 'camera-settings-mobile.png'), fullPage: true });
        await page.screenshot({ path: path.join(shots, 'camera-settings-mobile-viewport.png') });
      }
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(base + '/');
    await page.locator('#toggle').click();
    await page.locator('#qr').waitFor({ state: 'visible' });
    assert.match(await page.locator('#payload').textContent(), /^oT/);
    await page.locator('#source').selectOption('manual');
    assert.equal(await page.locator('#qr').isVisible(), false);
    await page.locator('#source').selectOption('device');
    assert.equal(await page.locator('#rate-label').textContent(), '30');
    await page.locator('#toggle').click();
    await page.locator('#qr').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Camera Settings QR', exact: true }).click();
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    // Broken/crafted stored values cannot become a QR on reload.
    await page.evaluate(() => localStorage.setItem('igorbox.camera-settings.v1', '{"version":1,"model":"mission-1-pro","settings":{"mode":"video","resolution":"!FORMAT"}}'));
    await page.reload();
    assert.equal(await page.locator('#camera-preset').inputValue(), 'cinema');
    assert.match(await page.locator('#camera-storage-status').textContent(), /could not be restored/);
    assert.equal(await page.locator('#camera-qr').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('Browser checks passed: presets, edits, validation, photo/video, local storage, reset, ILS, fullscreen, copy fallback, mobile 390/320px and timecode navigation.');
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
