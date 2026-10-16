import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { liveSources } from './src/config/projects.js';
import { renderPage, renderHead } from './src/lib/render.js';

const read = f => JSON.parse(readFileSync(resolve(import.meta.dirname, f), 'utf8'));

// Renders each language's page into static HTML from src/i18n/*.json, src/config/projects.js
// and the build-time snapshot src/data/live.json.
function staticPages() {
  return {
    name: 'static-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const en = read('src/i18n/en.json'), zh = read('src/i18n/zh.json');
        const [t, other] = ctx.path.startsWith('/en/') ? [en, zh] : [zh, en];
        let data = {};
        try { data = read('src/data/live.json'); } catch { /* first run: page shows "not available" until fetched */ }
        return html.replace('%LANG%', t.lang).replace('<!--head-->', renderHead(t, other)).replace('<!--app-->', renderPage(t, data, other));
      },
    },
  };
}

// Vercel Web Analytics (same as the other sites). Added after bundling: it is not a module.
const analytics = {
  name: 'vercel-analytics',
  apply: 'build',
  transformIndexHtml: { order: 'post', handler: html => html.replace('</head>', '  <script defer src="/_vercel/insights/script.js"></script>\n  </head>') },
};

// Same-origin paths for live data; on Vercel these are rewrites in vercel.json.
const proxy = Object.fromEntries(Object.values(liveSources).map(s => {
  const u = new URL(s.upstream);
  return [s.path, { target: u.origin, changeOrigin: true, rewrite: () => u.pathname }];
}));

export default defineConfig(() => ({
  plugins: [staticPages(), analytics],
  server: { proxy },
  preview: { proxy },
  build: {
    rollupOptions: { input: { main: resolve(import.meta.dirname, 'index.html'), en: resolve(import.meta.dirname, 'en/index.html') } },
  },
}));
