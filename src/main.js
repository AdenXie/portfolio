import './style.css';
import zh from './i18n/zh.json';
import en from './i18n/en.json';
import { liveSources, site, writing } from './config/projects.js';
import { parseJobs, parseEcon, parseBlogFeed, pickRepos, pickCommits, mergeCommits, githubApi } from './lib/live.js';
import { liveFigures, liveStamp, postList, commitList, fetchedStamp } from './lib/render.js';

const t = document.documentElement.lang === 'en' ? en : zh;
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const store = {
  get(storage, k) { try { return JSON.parse(window[storage].getItem(k)); } catch { return null; } },
  set(storage, k, v) { try { window[storage].setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

// ---- theme ----
const root = document.documentElement;
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
const toggle = $('[data-theme-toggle]');
function syncToggle() {
  const dark = currentTheme() === 'dark';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? toggle.dataset.toLight : toggle.dataset.toDark);
  toggle.title = toggle.getAttribute('aria-label');
}
toggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  syncToggle();
});
systemDark.addEventListener('change', syncToggle);
syncToggle();

// ---- entrance animation ----
const reveal = $$('.reveal');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  root.classList.add('anim');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  reveal.forEach(el => io.observe(el));
}

// ---- install command ----
for (const box of $$('[data-install]')) {
  const code = $('code', box);
  const status = $('[data-copy-status]', box);
  for (const b of $$('[data-command]', box)) {
    b.addEventListener('click', () => {
      $$('[data-command]', box).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      code.textContent = b.dataset.command;
    });
  }
  const copy = $('[data-copy]', box);
  copy.addEventListener('click', async () => {
    const label = $('span', copy);
    let ok = false;
    try { await navigator.clipboard.writeText(code.textContent); ok = true; }
    catch {
      const range = document.createRange(); range.selectNodeContents(code);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      try { ok = document.execCommand('copy'); } catch { ok = false; }
    }
    const msg = ok ? copy.dataset.done : copy.dataset.fail;
    label.textContent = msg; status.textContent = msg;
    copy.classList.toggle('done', ok);
    clearTimeout(copy.timer);
    copy.timer = setTimeout(() => { label.textContent = copy.dataset.label; copy.classList.remove('done'); }, 2000);
  });
}

// ---- live data (same-origin, see vercel.json) ----
const getJson = async url => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};
const now = () => new Date().toISOString();
const data = {};
const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };

async function refreshWorks() {
  const [jobs, econ] = await Promise.allSettled([
    getJson(liveSources.jobs.path).then(parseJobs),
    Promise.all([getJson(liveSources.econQuarterly.path), getJson(liveSources.econWorldBank.path)]).then(([q, w]) => parseEcon(q, w)),
  ]);
  for (const [kind, r] of [['jobs', jobs], ['econ', econ]]) {
    if (r.status !== 'fulfilled') continue;
    data[kind] = r.value;
    set(`[data-live="${kind}"]`, liveFigures(kind, data, t));
    set(`[data-live-stamp="${kind}"]`, liveStamp(kind, data, t));
  }
}

async function refreshPosts() {
  const feed = parseBlogFeed(await getJson(t.lang === 'en' ? liveSources.blogEn.path : liveSources.blogZh.path), writing.posts);
  feed.fetchedAt = now();
  set('[data-posts]', postList(feed, t));
  set('[data-posts-stamp]', fetchedStamp(feed, t));
}

// GitHub has CORS and a per-visitor limit of 60 requests an hour; one visit uses about five,
// and the result is kept for the browser session.
async function refreshCommits() {
  const key = 'portfolio:commits:v1';
  let github = store.get('sessionStorage', key);
  if (!github || Date.now() - Date.parse(github.fetchedAt) > 15 * 60 * 1000) {
    const repos = pickRepos(await getJson(githubApi.repos(site.githubUser)));
    const lists = await Promise.all(repos.map(async r => pickCommits(r, await getJson(githubApi.commits(r)))));
    github = { commits: mergeCommits(lists), fetchedAt: now() };
    store.set('sessionStorage', key, github);
  }
  set('[data-commits]', commitList(github, t));
  set('[data-commits-stamp]', fetchedStamp(github, t));
}

// Failures keep the build-time snapshot that is already in the HTML.
const quiet = p => p.catch(e => console.info('[live] kept snapshot:', e.message));
const start = () => { quiet(refreshWorks()); quiet(refreshPosts()); quiet(refreshCommits()); };
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 2000 }); else setTimeout(start, 300);
