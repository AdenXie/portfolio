#!/usr/bin/env node
// Build-time snapshot of the live figures -> src/data/live.json.
// The page shows this snapshot first and replaces it with fresh data in the browser.
// Every source is independent: a failed fetch keeps that source's previous snapshot and
// never fails the build. LIVE_FETCH=fail simulates every request failing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { liveSources, site, writing } from '../src/config/projects.js';
import { parseJobs, parseEcon, parseBlogFeed, parseBlogSearchXml, pickRepos, pickCommits, mergeCommits, githubApi } from '../src/lib/live.js';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/live.json');
const previous = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch { return {}; } })();

async function get(url, type = 'json', headers = {}) {
  if (process.env.LIVE_FETCH === 'fail') throw new Error('simulated failure (LIVE_FETCH=fail)');
  const res = await fetch(url, { headers: { 'User-Agent': 'adenxie-portfolio-build', ...headers }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return type === 'json' ? res.json() : res.text();
}

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

const tasks = {
  jobs: async () => {
    try { return { ...parseJobs(await get(liveSources.jobs.upstream)), from: 'insights.json' }; }
    catch (e) {
      console.warn(`  jobs: ${e.message}; trying jobs.json`);
      return { ...parseJobs(await get(liveSources.jobs.fallback)), from: 'jobs.json' };
    }
  },
  econ: async () => parseEcon(...await Promise.all([get(liveSources.econQuarterly.upstream), get(liveSources.econWorldBank.upstream)])),
  blogZh: () => blog(liveSources.blogZh, 'https://blog.adenxie.com.cn/'),
  blogEn: () => blog(liveSources.blogEn, 'https://blog.adenxie.com.cn/'),
  github: async () => {
    const repos = pickRepos(await get(githubApi.repos(site.githubUser), 'json', githubHeaders));
    const lists = await Promise.all(repos.map(async r => pickCommits(r, await get(githubApi.commits(r), 'json', githubHeaders))));
    return { commits: mergeCommits(lists) };
  },
};

async function blog(source, base) {
  try { return { ...parseBlogFeed(await get(source.upstream), writing.posts), from: 'latest-posts.json' }; }
  catch (e) {
    console.warn(`  blog: ${e.message}; trying search.xml`);
    return { ...parseBlogSearchXml(await get(source.fallback, 'text'), base, writing.posts), from: 'search.xml' };
  }
}

const result = { ...previous };
let failed = 0;
await Promise.all(Object.entries(tasks).map(async ([key, task]) => {
  try {
    result[key] = { ...await task(), fetchedAt: new Date().toISOString() };
    console.log(`live: ${key} ok`);
  } catch (e) {
    failed++;
    console.warn(`live: ${key} failed (${e.message}); ${previous[key] ? `keeping snapshot from ${previous[key].fetchedAt}` : 'no previous snapshot'}`);
  }
}));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(`live: wrote ${out} (${Object.keys(tasks).length - failed} updated, ${failed} kept)`);
