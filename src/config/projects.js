// Everything the page lists comes from here. To add a work, add an entry to `projects`
// (and its text under `projects.<id>` in both src/i18n files). To add a section, add a category.
//
// Category `layout` picks the card template in src/lib/render.js:
//   website — screenshots, live figures, Visit / Source buttons
//   skill   — example image, install command, Source link
//   plugin  — install command, Source and package links (no image)

export const site = {
  url: 'https://adenxie.com.cn',
  github: 'https://github.com/AdenXie',
  blog: 'https://blog.adenxie.com.cn/',
  email: 'aden@adenxie.com.cn',
  githubUser: 'AdenXie',
};

export const categories = [
  { id: 'websites', layout: 'website' },
  { id: 'skills', layout: 'skill' },
  { id: 'harnessPlugins', layout: 'plugin' },
];

export const projects = [
  {
    id: 'jobs',
    category: 'websites',
    url: 'https://jobs.adenxie.com.cn/',
    // English page, used when the portfolio is in English (null = same as url).
    urlEn: null,
    source: 'https://github.com/AdenXie/job-website',
    // public/media/screens/<screenshot>-*.webp, made by `npm run screenshots`.
    screenshot: 'jobs',
    tech: ['React', 'Vite', 'GitHub Actions', 'Vercel'],
    // Which live figures to show (see src/lib/live.js).
    live: 'jobs',
  },
  {
    id: 'econ',
    category: 'websites',
    url: 'https://econ.adenxie.com.cn/',
    urlEn: 'https://econ.adenxie.com.cn/en/',
    source: 'https://github.com/AdenXie/everyday-economics',
    screenshot: 'econ',
    tech: ['JavaScript', 'SVG', 'Node.js', 'Vercel'],
    live: 'econ',
  },
  {
    id: 'photoCard',
    category: 'skills',
    source: 'https://github.com/AdenXie/photo-english-card',
    // public/media/<image>-*.webp, made by `npm run media`.
    image: 'photo-english-card',
    imageSize: [1080, 1907],
    tech: ['Agent Skill', 'Node.js', 'Headless Chrome'],
    // Taken from the project README.
    install: [
      { label: 'Claude Code', command: 'git clone https://github.com/AdenXie/photo-english-card.git ~/.claude/skills/photo-english-card' },
      { label: 'Codex', command: 'git clone https://github.com/AdenXie/photo-english-card.git "$HOME/.agents/skills/photo-english-card"' },
    ],
  },
  {
    id: 'headshot',
    category: 'skills',
    source: 'https://github.com/AdenXie/american-corporate-headshot',
    image: 'american-corporate-headshot',
    imageSize: [1080, 1080],
    tech: ['Agent Skill', 'Image Editing', 'Python'],
    install: [
      { label: 'Claude Code', command: 'git clone --depth 1 https://github.com/AdenXie/american-corporate-headshot.git "$HOME/.claude/skills/american-corporate-headshot"' },
      { label: 'Codex', command: 'git clone --depth 1 https://github.com/AdenXie/american-corporate-headshot.git "$HOME/.agents/skills/american-corporate-headshot"' },
    ],
  },
  {
    id: 'dshVercel',
    category: 'harnessPlugins',
    source: 'https://github.com/AdenXie/dsh-vercel',
    package: 'https://www.npmjs.com/package/@adenxie/dsh-vercel',
    tech: ['DSH Plugin', 'TypeScript', 'MCP', 'OAuth'],
    // Taken from the project README; update the version with each release.
    install: [
      { label: 'Desktop (PowerShell)', command: "$DshCli = Join-Path $env:LOCALAPPDATA 'Programs\\DeepSeek Harness\\resources\\runtime\\cli\\bin\\dsh.cmd'\n& $DshCli plugin --profile desktop add '@adenxie/dsh-vercel@0.3.1'" },
      { label: 'Web', command: 'dsh plugin --profile web add @adenxie/dsh-vercel@0.3.1' },
    ],
  },
];

// Live data. The page reads these same-origin paths at runtime (vercel.json rewrites them
// to the other sites; vite.config.js proxies them in development). `upstream` is used by
// scripts/fetch-live.mjs for the build-time snapshot.
export const liveSources = {
  jobs: { path: '/live/jobs.json', upstream: 'https://jobs.adenxie.com.cn/insights.json', fallback: 'https://jobs.adenxie.com.cn/jobs.json' },
  econQuarterly: { path: '/live/econ-quarterly.json', upstream: 'https://econ.adenxie.com.cn/data/quarterly.json' },
  econWorldBank: { path: '/live/econ-worldbank.json', upstream: 'https://econ.adenxie.com.cn/data/worldbank.json' },
  blogZh: { path: '/live/blog-zh.json', upstream: 'https://blog.adenxie.com.cn/latest-posts.json', fallback: 'https://blog.adenxie.com.cn/search.xml' },
  blogEn: { path: '/live/blog-en.json', upstream: 'https://blog.adenxie.com.cn/en/latest-posts.json', fallback: 'https://blog.adenxie.com.cn/en/search.xml' },
};

export const writing = { posts: 3 };

// "Recently" in the footer: latest commits across public, non-fork repositories.
export const activity = {
  commits: 5,
  // Repositories checked (most recently pushed first). More repos = more API calls per visit.
  repos: 4,
  // Branch to read when the default branch only holds generated output.
  branches: { 'Aden.github.io': 'source' },
  // Commits whose first line matches are skipped: data refreshes, generated builds,
  // and blog posts (already listed under Writing).
  ignoreMessages: [
    /^update campus job data\b/i,
    /^site updated:/i,
    /^first commit$/i,
    /^post: /i,
    /^(refresh|update|sync)\w* (\S+ ){0,3}(data|snapshots?|rates)$/i,
    /^data[:(]/i,
  ],
};
