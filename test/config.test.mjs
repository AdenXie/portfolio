import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { categories, projects, liveSources } from '../src/config/projects.js';

const read = f => JSON.parse(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'));
const zh = read('src/i18n/zh.json'), en = read('src/i18n/en.json');

function shape(o) {
  if (Array.isArray(o)) return `array(${o.length})`;
  if (o && typeof o === 'object') return Object.fromEntries(Object.keys(o).sort().map(k => [k, shape(o[k])]));
  return typeof o;
}

test('both language files have the same keys', () => {
  assert.deepEqual(shape(zh), shape(en));
});

test('every project has a known category and text in both languages', () => {
  const ids = new Set(categories.map(c => c.id));
  for (const p of projects) {
    assert(ids.has(p.category), `${p.id}: unknown category ${p.category}`);
    for (const t of [zh, en]) {
      assert(t.projects[p.id]?.name && t.projects[p.id]?.desc, `${p.id}: missing text in ${t.lang}`);
    }
  }
  for (const c of categories) assert(zh.sections[c.id] && en.sections[c.id], `${c.id}: missing section text`);
});

test('vercel.json rewrites match the live sources in the config', () => {
  const { rewrites } = read('vercel.json');
  const expected = Object.values(liveSources).map(s => ({ source: s.path, destination: s.upstream }));
  assert.deepEqual(rewrites, expected);
});
