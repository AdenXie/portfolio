#!/usr/bin/env node
// Desktop and mobile screenshots of each website in src/config/projects.js -> public/media/screens/*.webp.
// Run by hand (`npm run screenshots [id ...]`) and commit the results; the build never runs it.
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { projects } from '../src/config/projects.js';
import { launch } from './browser.mjs';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/media/screens');
const only = process.argv.slice(2);
const targets = projects.filter(p => p.screenshot && p.url && (!only.length || only.includes(p.id)));
if (!targets.length) { console.error(`No matching projects. Ids: ${projects.filter(p => p.screenshot).map(p => p.id).join(', ')}`); process.exit(1); }

const shots = [
  // name, viewport, scale, output widths
  { name: 'desktop', viewport: { width: 1280, height: 800 }, scale: 2, widths: { 'desktop-1280': 1280, 'desktop-800': 800 } },
  { name: 'mobile', viewport: { width: 390, height: 844 }, scale: 2, widths: { mobile: 390 }, mobile: true },
];

mkdirSync(outDir, { recursive: true });
const browser = await launch();
try {
  for (const p of targets) {
    for (const s of shots) {
      const context = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.scale, isMobile: !!s.mobile, hasTouch: !!s.mobile, colorScheme: 'light', locale: 'zh-CN', reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(p.url, { waitUntil: 'load', timeout: 60000 });
      // Let data-driven content and fonts settle.
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(1500);
      const png = await page.screenshot({ type: 'png' });
      for (const [suffix, width] of Object.entries(s.widths)) {
        const file = resolve(outDir, `${p.screenshot}-${suffix}.webp`);
        await sharp(png).resize({ width }).webp({ quality: 80, effort: 6 }).toFile(file);
        console.log(`saved ${file}`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
