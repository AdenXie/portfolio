// Headless browser for the media scripts. Uses an installed Chrome/Edge through playwright-core,
// so no browser download is needed. Set CHROME_PATH to use a specific executable.
import { chromium } from 'playwright-core';

export async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  for (const channel of ['chrome', 'msedge', 'chromium']) {
    try { return await chromium.launch({ channel }); } catch { /* try the next one */ }
  }
  throw new Error('No Chrome/Edge found. Install one or set CHROME_PATH.');
}
