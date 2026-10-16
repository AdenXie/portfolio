// HTML templates. Used at build time (vite.config.js renders the whole page into static HTML)
// and in the browser (main.js re-renders the live parts with fresh data).
import { site, categories, projects, writing as writingConfig } from '../config/projects.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// "{n} 条" -> with values HTML-escaped; `strong` wraps each value in <strong>.
export function fmt(template, vars = {}, strong = false) {
  return esc(template).replace(/\{(\w+)\}/g, (_, k) => strong ? `<strong>${esc(vars[k])}</strong>` : esc(vars[k]));
}

// Date-only strings ("2026-10-12") are calendar dates; timestamps are shown in Beijing time,
// so the build-time HTML and the browser render agree.
export function formatDate(value, lang) {
  if (!value) return '';
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'short', day: 'numeric', timeZone: dateOnly ? 'UTC' : 'Asia/Shanghai' }).format(d);
}

const num = (n, lang) => new Intl.NumberFormat(lang).format(n);

const icon = {
  github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M8 7h9v9"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></g></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></g></svg>',
  sun: '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></g></svg>',
  moon: '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
};

const projectUrl = (p, t) => (t.lang === 'en' && p.urlEn) || p.url;

// ---- live parts (also rendered in the browser) ----

export function liveFigures(kind, data, t) {
  const L = t.live;
  const d = kind === 'jobs' ? data.jobs : kind === 'econ' ? data.econ : null;
  if (!d) return `<li>${esc(L.unavailable)}</li>`;
  if (kind === 'jobs') return `<li>${fmt(L.jobsTotal, { n: num(d.total, t.lang) }, true)}</li>`;
  return `<li>${fmt(L.econQuarter, { q: d.latestQuarter }, true)}</li><li>${fmt(L.econCountries, { n: d.countries }, true)}</li>`;
}

export function liveStamp(kind, data, t) {
  const d = kind === 'jobs' ? data.jobs : data.econ;
  return d?.updatedAt ? fmt(t.live.updated, { date: formatDate(d.updatedAt, t.lang) }) : '';
}

export function postList(feed, t) {
  if (!feed?.posts?.length) return `<li class="empty">${esc(t.live.unavailable)}</li>`;
  return feed.posts.slice(0, writingConfig.posts).map(p => `<li><a href="${esc(p.url)}"><span class="post-title">${esc(p.title)}</span><time datetime="${esc(p.date)}">${esc(formatDate(p.date, t.lang))}</time></a></li>`).join('');
}

export function commitList(github, t) {
  if (!github?.commits?.length) return `<li class="empty">${esc(t.activity.empty)}</li>`;
  return github.commits.map(c => `<li><a class="repo" href="${esc(c.repoUrl)}">${esc(c.repo)}</a><a class="msg" href="${esc(c.url)}">${esc(c.message)}</a><time datetime="${esc(c.date)}">${esc(formatDate(c.date, t.lang))}</time></li>`).join('');
}

export const fetchedStamp = (d, t) => d?.fetchedAt ? fmt(t.live.fetched, { date: formatDate(d.fetchedAt, t.lang) }) : '';

// ---- cards ----

function tags(p, text, t) {
  return `<ul class="tags" aria-label="${esc(t.card.techLabel)}">${p.tech.map(x => `<li>${esc(x)}</li>`).join('')}${text.highlights.map(x => `<li class="hl">${esc(x)}</li>`).join('')}</ul>`;
}

function websiteCard(p, t, data) {
  const text = t.projects[p.id];
  const url = projectUrl(p, t);
  const s = `/media/screens/${p.screenshot}`;
  const alt = device => fmt(t.card.screenshotAlt, { name: text.name, device });
  return `<article class="card card-website reveal" id="work-${esc(p.id)}">
  <a class="shots" href="${esc(url)}" tabindex="-1" aria-hidden="true">
    <img class="shot-desktop" src="${s}-desktop-800.webp" srcset="${s}-desktop-800.webp 800w, ${s}-desktop-1280.webp 1280w" sizes="(min-width: 960px) 520px, 100vw" width="1280" height="800" alt="${alt(t.card.desktop)}" loading="lazy" decoding="async">
    <img class="shot-mobile" src="${s}-mobile.webp" width="390" height="844" alt="${alt(t.card.mobile)}" loading="lazy" decoding="async">
  </a>
  <div class="card-body">
    <h3>${esc(text.name)}</h3>
    <p class="desc">${esc(text.desc)}</p>
    <div class="live">
      <ul class="figures" data-live="${esc(p.live)}">${liveFigures(p.live, data, t)}</ul>
      <p class="stamp" data-live-stamp="${esc(p.live)}">${liveStamp(p.live, data, t)}</p>
    </div>
    ${tags(p, text, t)}
    <div class="actions">
      <a class="btn btn-primary" href="${esc(url)}">${esc(t.card.visit)}${icon.arrow}</a>
      <a class="btn" href="${esc(p.source)}">${icon.code}${esc(t.card.source)}</a>
    </div>
  </div>
</article>`;
}

function skillCard(p, t) {
  const text = t.projects[p.id];
  const m = `/media/${p.image}`;
  const [w, h] = p.imageSize;
  const first = p.install[0];
  return `<article class="card card-skill reveal" id="work-${esc(p.id)}">
  <a class="poster" href="${m}-1080.webp" aria-label="${esc(t.card.viewFull)}">
    <img src="${m}-640.webp" srcset="${m}-640.webp 640w, ${m}-1080.webp 1080w" sizes="(min-width: 960px) 360px, 100vw" width="${w}" height="${h}" alt="${esc(t.card.posterAlt)}" loading="lazy" decoding="async">
  </a>
  <div class="card-body">
    <h3>${esc(text.name)}</h3>
    <p class="desc">${esc(text.desc)}</p>
    ${tags(p, text, t)}
    <div class="install" data-install>
      <div class="seg" role="group" aria-label="${esc(t.card.installFor)}">
        ${p.install.map((x, i) => `<button type="button" data-command="${esc(x.command)}" aria-pressed="${i === 0}">${esc(x.label)}</button>`).join('')}
      </div>
      <pre><code>${esc(first.command)}</code></pre>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-copy data-label="${esc(t.card.copyInstall)}" data-done="${esc(t.card.copied)}" data-fail="${esc(t.card.copyFailed)}">${icon.copy}<span>${esc(t.card.copyInstall)}</span></button>
        <a class="btn" href="${esc(p.source)}">${icon.code}${esc(t.card.source)}</a>
        <a class="link" href="${m}-1080.webp">${esc(t.card.viewFull)}</a>
      </div>
      <p class="sr-only" role="status" aria-live="polite" data-copy-status></p>
    </div>
  </div>
</article>`;
}

const layouts = { website: websiteCard, skill: skillCard };

// ---- page ----

export function renderPage(t, data, other) {
  const blog = t.lang === 'en' ? data.blogEn : data.blogZh;
  const blogHome = t.lang === 'en' ? `${site.blog}en/` : site.blog;
  const sections = categories.map(c => {
    const items = projects.filter(p => p.category === c.id);
    if (!items.length) return '';
    const s = t.sections[c.id];
    return `<section class="section" id="${esc(c.id)}" aria-labelledby="h-${esc(c.id)}">
  <div class="section-head reveal"><h2 id="h-${esc(c.id)}">${esc(s.title)}</h2><p>${esc(s.desc)}</p></div>
  <div class="cards cards-${esc(c.layout)}">${items.map(p => layouts[c.layout](p, t, data)).join('\n')}</div>
</section>`;
  }).join('\n');

  return `<a class="skip" href="#main">${esc(t.nav.skip)}</a>
<header class="topbar">
  <div class="wrap topbar-inner">
    <a class="brand" href="${esc(t.path)}">Aden Xie</a>
    <nav class="tools">
      <a class="pill" href="${esc(other.path)}" hreflang="${esc(other.lang)}" lang="${esc(other.lang)}" aria-label="${esc(t.nav.otherLangLabel)}" data-lang-link>${esc(t.nav.otherLang)}</a>
      <button class="pill icon-btn" type="button" data-theme-toggle aria-label="${esc(t.nav.theme)}" data-to-light="${esc(t.nav.themeToLight)}" data-to-dark="${esc(t.nav.themeToDark)}">${icon.sun}${icon.moon}</button>
    </nav>
  </div>
</header>
<main id="main" class="wrap">
  <section class="hero" aria-labelledby="h-name">
    <img class="avatar" src="/media/avatar-192.webp" width="96" height="96" alt="${esc(t.hero.avatarAlt)}" fetchpriority="high">
    <div>
      <h1 id="h-name">${esc(t.hero.name)}</h1>
      <p class="intro">${esc(t.hero.intro)}</p>
      <ul class="hero-links">
        <li><a class="btn" href="${esc(site.github)}">${icon.github}${esc(t.hero.github)}</a></li>
        <li><a class="btn" href="${esc(blogHome)}">${icon.pen}${esc(t.hero.blog)}</a></li>
        <li><a class="btn" href="mailto:${esc(site.email)}" aria-label="${esc(t.hero.email)}: ${esc(site.email)}">${icon.mail}${esc(site.email)}</a></li>
      </ul>
    </div>
  </section>
${sections}
  <section class="section" id="writing" aria-labelledby="h-writing">
    <div class="section-head reveal"><h2 id="h-writing">${esc(t.sections.writing.title)}</h2><p>${esc(t.sections.writing.desc)}</p></div>
    <div class="card card-writing reveal">
      <div class="writing-head"><h3><a href="${esc(blogHome)}">${esc(t.writing.blogName)}</a></h3><p class="desc">${esc(t.writing.blogDesc)}</p></div>
      <ol class="posts" data-posts>${postList(blog, t)}</ol>
      <div class="writing-foot"><p class="stamp" data-posts-stamp>${fetchedStamp(blog, t)}</p><a class="link" href="${esc(blogHome)}">${esc(t.sections.writing.more)}${icon.arrow}</a></div>
    </div>
  </section>
</main>
<footer class="footer">
  <div class="wrap">
    <section class="activity reveal" aria-labelledby="h-activity">
      <div class="section-head"><h2 id="h-activity">${esc(t.sections.activity.title)}</h2><p>${esc(t.sections.activity.desc)}</p></div>
      <ol class="commits" data-commits>${commitList(data.github, t)}</ol>
      <p class="stamp"><span data-commits-stamp>${fetchedStamp(data.github, t)}</span> · <a class="link" href="${esc(site.github)}">${esc(t.activity.viewAll)}</a></p>
    </section>
    <div class="colophon">
      <p>${esc(t.footer.dataNote)}</p>
      <p>${esc(t.footer.license)} <a class="link" href="${esc(site.github)}/portfolio">${esc(t.footer.sourceCode)}</a></p>
      <p>© ${new Date().getFullYear()} Aden Xie</p>
    </div>
  </div>
</footer>`;
}

export function renderHead(t, other) {
  const url = site.url + t.path;
  const og = `${site.url}/og.png`;
  return `<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.description)}">
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" hreflang="zh-CN" href="${site.url}/">
<link rel="alternate" hreflang="en" href="${site.url}/en/">
<link rel="alternate" hreflang="x-default" href="${site.url}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aden Xie">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="${esc(t.meta.ogLocale)}">
<meta property="og:locale:alternate" content="${esc(other.meta.ogLocale)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.meta.title)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#f6f5f1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111214" media="(prefers-color-scheme: dark)">`;
}
