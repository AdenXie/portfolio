// Parsers shared by the build-time snapshot (scripts/fetch-live.mjs) and the browser.
// Each returns a small normalized object or throws when the input is not what we expect.
import { activity, site } from '../config/projects.js';

const isNum = n => typeof n === 'number' && Number.isFinite(n);
const isDate = s => typeof s === 'string' && !Number.isNaN(Date.parse(s));

// jobs.adenxie.com.cn/insights.json, or the full jobs.json as a fallback.
export function parseJobs(json) {
  const total = json?.totals?.jobs ?? (Array.isArray(json?.jobs) ? json.jobs.length : undefined);
  if (!isNum(total) || !isDate(json.generatedAt)) throw new Error('jobs: unexpected shape');
  return { total, updatedAt: json.generatedAt };
}

export function parseEcon(quarterly, worldbank) {
  if (!/^\d{4}-Q[1-4]$/.test(quarterly?.latestQuarter) || !isDate(quarterly.snapshotDate)) throw new Error('econ: unexpected quarterly.json');
  if (!Array.isArray(worldbank?.countries) || !worldbank.countries.length) throw new Error('econ: unexpected worldbank.json');
  const updatedAt = [quarterly.snapshotDate, worldbank.snapshotDate].filter(isDate).sort().at(-1);
  return { latestQuarter: quarterly.latestQuarter, countries: worldbank.countries.length, updatedAt };
}

// blog.adenxie.com.cn/latest-posts.json (and /en/).
export function parseBlogFeed(json, limit) {
  if (!Array.isArray(json?.posts)) throw new Error('blog: unexpected latest-posts.json');
  const posts = json.posts
    .filter(p => p && typeof p.title === 'string' && isDate(p.date) && /^https:\/\/blog\.adenxie\.com\.cn\//.test(p.url))
    .map(p => ({ title: p.title.trim(), date: p.date, url: p.url }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  if (!posts.length) throw new Error('blog: no posts');
  return { posts, updatedAt: isDate(json.generatedAt) ? json.generatedAt : null };
}

const decodeXml = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Hexo search.xml has no dates; the permalink (/:year/:month/:day/:title/) does. Build-time only:
// the file is ~2 MB, so the browser never reads it.
export function parseBlogSearchXml(xml, base, limit) {
  const posts = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const title = decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').replace(/\s+/g, ' ').replace(/\s*\|\s*Aden's Space\s*$/, '').trim();
    const url = decodeXml(entry.match(/<url>([\s\S]*?)<\/url>/)?.[1] ?? '').trim();
    const d = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
    if (title && d) posts.push({ title, date: `${d[1]}-${d[2]}-${d[3]}`, url: new URL(encodeURI(url), base).href });
  }
  if (!posts.length) throw new Error('blog: no posts in search.xml');
  // Stable sort keeps the file's order for posts on the same day.
  return { posts: posts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit), updatedAt: null };
}

const isBot = c => c.author?.type === 'Bot' || /\[bot\]$/i.test(c.author?.login ?? '') || /\[bot\]$/i.test(c.commit?.author?.name ?? '');

// GitHub REST: /users/:user/repos and /repos/:owner/:repo/commits.
export function pickRepos(repos) {
  if (!Array.isArray(repos)) throw new Error('github: unexpected repos response');
  return repos
    .filter(r => !r.fork && !r.private && !r.archived && r.owner?.login === site.githubUser)
    .sort((a, b) => (b.pushed_at ?? '').localeCompare(a.pushed_at ?? ''))
    .slice(0, activity.repos)
    .map(r => ({ name: r.name, url: r.html_url, branch: activity.branches[r.name] ?? r.default_branch }));
}

export function pickCommits(repo, commits) {
  if (!Array.isArray(commits)) throw new Error(`github: unexpected commits response for ${repo.name}`);
  return commits
    .filter(c => !isBot(c))
    .map(c => ({ repo: repo.name, repoUrl: repo.url, message: (c.commit?.message ?? '').split('\n')[0].trim(), date: c.commit?.author?.date, url: c.html_url }))
    .filter(c => c.message && isDate(c.date) && !activity.ignoreMessages.some(re => re.test(c.message)));
}

export function mergeCommits(lists) {
  return lists.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, activity.commits);
}

export const githubApi = {
  repos: user => `https://api.github.com/users/${user}/repos?type=owner&sort=pushed&per_page=30`,
  commits: repo => `https://api.github.com/repos/${site.githubUser}/${repo.name}/commits?sha=${encodeURIComponent(repo.branch)}&per_page=30`,
};
