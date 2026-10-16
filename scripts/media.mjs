#!/usr/bin/env node
// Static images -> public/. Run by hand (`npm run media`) and commit the results.
//   - avatar:  media-src/avatar.jpg            -> public/media/avatar-192.webp
//   - poster:  media-src/poster/*.content.json -> rendered with photo-english-card's scripts/render.mjs
//                                               -> public/media/photo-english-card-{640,1080}.webp
//   - share image and icons                    -> public/og.png, favicon-32.png, apple-touch-icon.png
// The poster photo (media-src/poster/photo.jpg) is not committed; without it the existing
// poster.png is reused, or the poster step is skipped. PHOTO_CARD_DIR points at the skill
// checkout (default: ../photo-english-card).
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { launch } from './browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => resolve(root, ...p);
mkdirSync(at('public/media'), { recursive: true });

// avatar
await sharp(at('media-src/avatar.jpg')).resize(192, 192).webp({ quality: 82 }).toFile(at('public/media/avatar-192.webp'));
console.log('saved public/media/avatar-192.webp');

// poster
const content = at('media-src/poster/photo.content.json');
const posterPng = at('media-src/poster/poster.png');
if (existsSync(at('media-src/poster/photo.jpg'))) {
  const render = resolve(process.env.PHOTO_CARD_DIR || at('../photo-english-card'), 'scripts/render.mjs');
  const r = spawnSync(process.execPath, [render, content, posterPng, '--scale', '1'], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('poster render failed');
}
if (existsSync(posterPng)) {
  for (const w of [640, 1080]) {
    await sharp(posterPng).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(at(`public/media/photo-english-card-${w}.webp`));
    console.log(`saved public/media/photo-english-card-${w}.webp`);
  }
} else console.warn('poster: no photo or poster.png in media-src/poster, keeping the committed images');

// share image + icons
const zh = JSON.parse(readFileSync(at('src/i18n/zh.json'), 'utf8'));
const en = JSON.parse(readFileSync(at('src/i18n/en.json'), 'utf8'));
const avatar = `data:image/jpeg;base64,${readFileSync(at('media-src/avatar.jpg')).toString('base64')}`;
const favicon = readFileSync(at('public/favicon.svg'), 'utf8');
const og = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; width: 1200px; height: 630px; font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif; background: #f6f5f1; color: #18181b; }
  .frame { position: absolute; inset: 0; padding: 84px 92px; display: flex; flex-direction: column; justify-content: space-between;
    background: radial-gradient(900px 500px at 105% -10%, #d9ebe3 0, transparent 60%), radial-gradient(700px 400px at -10% 120%, #ece6d8 0, transparent 60%); }
  .top { display: flex; align-items: center; gap: 36px; }
  img { width: 148px; height: 148px; border-radius: 50%; box-shadow: 0 0 0 6px #fff, 0 0 0 7px #e2dfd6; }
  h1 { margin: 0; font-size: 92px; letter-spacing: -2px; line-height: 1; }
  p { margin: 14px 0 0; font-size: 32px; color: #45454d; }
  .works { display: flex; gap: 14px; flex-wrap: wrap; }
  .works span { padding: 10px 20px; border-radius: 999px; background: #fff; border: 1px solid #e2dfd6; font-size: 24px; }
  .url { position: absolute; right: 92px; bottom: 92px; font-size: 26px; color: #1d6b58; font-weight: 600; }
</style><div class="frame"><div class="top"><img src="${avatar}"><div><h1>Aden Xie</h1><p>${zh.hero.intro}</p><p>${en.hero.intro}</p></div></div>
<div class="works"><span>${zh.projects.jobs.name}</span><span>Everyday Economics</span><span>Photo English Card</span></div><div class="url">adenxie.com.cn</div></div>`;

const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(og);
  await page.screenshot({ path: at('public/og.png') });
  console.log('saved public/og.png');
  for (const [file, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${favicon}`);
    await page.screenshot({ path: at('public', file), omitBackground: true });
    console.log(`saved public/${file}`);
  }
} finally {
  await browser.close();
}
