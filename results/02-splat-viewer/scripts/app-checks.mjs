// Checks that only make sense for this app. Format at the top of scripts/check.mjs.
export const options = { readyTimeoutMs: 30_000 };

const TEST_SPLAT_PATH = 'public/splats/test.ply';

export default async function appChecks({ measure, page }) {
  const canvas = await measure('canvas');
  await page.keyboard.press('f');
  await page.waitForTimeout(500);
  const flipped = await measure('canvas');
  await page.keyboard.press('f');
  await page.waitForTimeout(500);
  const back = await measure('canvas');

  // The Open file button should load a splat chosen through the file picker.
  const loadsBefore = await page.evaluate(() => window.__SPLAT_LOADS__);
  const chooserPromise = page.waitForEvent('filechooser');
  await page.click('#open-file');
  const chooser = await chooserPromise;
  await chooser.setFiles(TEST_SPLAT_PATH);
  await page.waitForFunction(
    (before) => window.__SPLAT_LOADS__ > before,
    loadsBefore,
    { timeout: 15_000 },
  );
  const loadsAfterPick = await page.evaluate(() => window.__SPLAT_LOADS__);
  const afterPick = await measure('canvas');

  // Dropping a file that is not a splat should show a message and keep the
  // current splat.
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['not a splat'], 'bad.txt', { type: 'text/plain' }));
    window.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  });
  await page.waitForSelector('.message', { timeout: 5_000 });
  const loadsAfterDrop = await page.evaluate(() => window.__SPLAT_LOADS__);
  const dropMessage = await page.locator('.message').textContent();
  const afterDrop = await measure('canvas');

  // The Enter VR button only appears when the browser can do VR; in this
  // headless browser without a headset it must stay hidden.
  const vrHidden = await page.locator('#enter-vr').isHidden();
  const vrClass = await page.evaluate(() => document.getElementById('enter-vr')?.className);
  const splatMode = await page.evaluate(() => window.__SPLAT_MODE__);

  return [
    {
      name: 'canvas is not blank',
      ok: canvas.nonBackgroundRatio > 0.01,
      detail: `nonBackgroundRatio ${canvas.nonBackgroundRatio}, background ${canvas.background}`,
    },
    {
      name: 'F key flips the orientation',
      ok: JSON.stringify(flipped) !== JSON.stringify(canvas) && JSON.stringify(back) === JSON.stringify(canvas),
      detail: 'canvas stats changed after F and returned after a second F',
    },
    {
      name: 'Open file button loads a splat',
      ok: loadsAfterPick === loadsBefore + 1 && afterPick.nonBackgroundRatio > 0.01,
      detail: `loads ${loadsBefore} -> ${loadsAfterPick}, nonBackgroundRatio ${afterPick.nonBackgroundRatio}`,
    },
    {
      name: 'dropping a bad file shows a message and keeps the current splat',
      ok: Boolean(dropMessage?.includes('Unsupported splat format')) && loadsAfterDrop === loadsAfterPick && afterDrop.nonBackgroundRatio > 0.01,
      detail: `message: ${dropMessage}, loads stayed ${loadsAfterDrop}, nonBackgroundRatio ${afterDrop.nonBackgroundRatio}`,
    },
    {
      name: 'Enter VR button exists but stays hidden without a headset',
      ok: vrHidden && typeof vrClass === 'string' && vrClass.includes('hidden'),
      detail: `hidden: ${vrHidden}, class: "${vrClass}"`,
    },
    {
      name: 'test splat loads with levels of detail',
      ok: splatMode === 'lod',
      detail: `mode: ${splatMode}`,
    },
  ];
}
