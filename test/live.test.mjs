import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobs, parseEcon, parseBlogFeed, parseBlogSearchXml, pickRepos, pickCommits, mergeCommits } from '../src/lib/live.js';

test('jobs: insights.json and the jobs.json fallback', () => {
  assert.deepEqual(parseJobs({ generatedAt: '2026-10-16T07:13:05Z', totals: { jobs: 8426 } }), { total: 8426, updatedAt: '2026-10-16T07:13:05Z' });
  assert.equal(parseJobs({ generatedAt: '2026-10-16T07:13:05Z', jobs: [{}, {}] }).total, 2);
  assert.throws(() => parseJobs({ totals: {} }));
});

test('econ: latest quarter, country count and newest snapshot date', () => {
  assert.deepEqual(parseEcon({ latestQuarter: '2026-Q2', snapshotDate: '2026-09-28' }, { snapshotDate: '2026-10-12', countries: [1, 2, 3] }),
    { latestQuarter: '2026-Q2', countries: 3, updatedAt: '2026-10-12' });
  assert.throws(() => parseEcon({ latestQuarter: 'Q2' }, { countries: [1] }));
});

test('blog: feed is sorted and limited; foreign links are dropped', () => {
  const feed = parseBlogFeed({ generatedAt: '2026-10-16T00:00:00Z', posts: [
    { title: 'a', date: '2026-10-01T00:00:00Z', url: 'https://blog.adenxie.com.cn/a/' },
    { title: 'b', date: '2026-10-03T00:00:00Z', url: 'https://blog.adenxie.com.cn/b/' },
    { title: 'x', date: '2026-10-05T00:00:00Z', url: 'https://evil.example/' },
  ] }, 3);
  assert.deepEqual(feed.posts.map(p => p.title), ['b', 'a']);
});

test('blog: search.xml fallback takes dates from permalinks and strips the site suffix', () => {
  const xml = `<search><entry><title>Old | Aden&apos;s Space</title><url>/en/2026/09/01/x/</url></entry>
    <entry><title>
      New &amp; shiny | Aden&apos;s Space
    </title><url>/en/2026/10/02/&#x65b0;/</url></entry></search>`;
  const { posts } = parseBlogSearchXml(xml, 'https://blog.adenxie.com.cn/', 3);
  assert.deepEqual(posts[0], { title: 'New & shiny', date: '2026-10-02', url: 'https://blog.adenxie.com.cn/en/2026/10/02/%E6%96%B0/' });
  assert.equal(posts.length, 2);
});

test('github: skips forks, bots and data-only commits; uses the source branch for the blog', () => {
  const repos = pickRepos([
    { name: 'job-website', owner: { login: 'AdenXie' }, pushed_at: '2026-10-16', default_branch: 'main', html_url: 'u1' },
    { name: 'Aden.github.io', owner: { login: 'AdenXie' }, pushed_at: '2026-10-15', default_branch: 'main', html_url: 'u2' },
    { name: 'forked', fork: true, owner: { login: 'AdenXie' }, pushed_at: '2026-10-17' },
  ]);
  assert.deepEqual(repos.map(r => [r.name, r.branch]), [['job-website', 'main'], ['Aden.github.io', 'source']]);
  const c = (message, date, author = { login: 'AdenXie', type: 'User' }) => ({ author, commit: { message, author: { name: author.login, date } }, html_url: 'h' });
  const list = pickCommits(repos[0], [
    c('Update campus job data', '2026-10-16T01:00:00Z', { login: 'github-actions[bot]', type: 'Bot' }),
    c('Update campus job data', '2026-10-16T02:00:00Z'),
    c('Add bilingual readings and refresh economic data\n\nbody', '2026-10-15T00:00:00Z'),
    c('post: publish daily brief 2026-10-16', '2026-10-16T03:00:00Z'),
    c('Refresh World Bank data', '2026-10-14T00:00:00Z'),
  ]);
  assert.deepEqual(list.map(x => x.message), ['Add bilingual readings and refresh economic data']);
  assert.equal(mergeCommits([list, list]).length, 2);
});
