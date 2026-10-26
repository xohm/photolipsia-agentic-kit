import { textStats } from '../src/stats.js';

export const options = { readyTimeoutMs: 10_000 };

const STAT_KEYS = ['words', 'characters', 'sentences', 'readingMinutes'];

async function readStats(page) {
  const stats = {};
  for (const key of STAT_KEYS) {
    const el = page.locator(`[data-stat="${key}"]`).first();
    stats[key] = (await el.textContent())?.trim();
  }
  return stats;
}

function formatStats(stats) {
  return STAT_KEYS.map((k) => `${k}=${stats[k]}`).join(' ');
}

function compareStats(got, want) {
  return STAT_KEYS.map((key) => ({
    name: `${key} matches textStats() (${want[key]})`,
    ok: String(got[key]) === String(want[key]),
    detail: `got ${JSON.stringify(got[key])}`,
  }));
}

export default async function appChecks({ page }) {
  const results = [];
  const text = 'Hello world. This is a sample text with two sentences!';
  await page.fill('#text', text);
  await page.waitForTimeout(100);

  const want = textStats(text);
  const got = await readStats(page);
  results.push(...compareStats(got, want));

  const secondText = 'Numbers count too: 42 items, 3 boxes, and one 100% done!';
  await page.fill('#text', secondText);
  await page.waitForTimeout(100);
  const want2 = textStats(secondText);
  const got2 = await readStats(page);
  results.push(...compareStats(got2, want2));

  await page.fill('#text', '');
  await page.waitForTimeout(100);
  const empty = await readStats(page);
  const wantEmpty = textStats('');
  results.push({
    name: 'empty text shows all counters as 0',
    ok: formatStats(empty) === formatStats(wantEmpty),
    detail: `got ${formatStats(empty)}, want ${formatStats(wantEmpty)}`,
  });

  const labels = await page.$$eval('.stat dt', (els) =>
    els.map((el) => ({
      text: el.textContent.trim(),
      transform: getComputedStyle(el).textTransform,
    })),
  );
  const sentenceCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  results.push({
    name: 'stat labels render in sentence case',
    ok:
      labels.every((l) => l.transform === 'none') &&
      labels.every((l) => sentenceCase(l.text) === l.text),
    detail: JSON.stringify(labels),
  });
  const buttonLabel = (await page.locator('#clear').textContent())?.trim();
  results.push({
    name: 'clear button is in sentence case',
    ok: buttonLabel === sentenceCase(buttonLabel ?? ''),
    detail: `got ${JSON.stringify(buttonLabel)}`,
  });

  return results;
}
