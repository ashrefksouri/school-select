#!/usr/bin/env node
/**
 * School Select — Test suite
 *
 * Lance le build complet, puis vérifie :
 *   1. Chaque fiche école rend un JSON-LD parsable avec @context + @type.
 *   2. Chaque slug dans similar_schools[] existe comme fichier source.
 *   3. Aucun video.youtube_id ne contient la valeur Rickroll dQw4w9WgXcQ.
 *   4. Chaque page HTML générée (27) a canonical + og:image + twitter:card.
 *
 * Exit code 1 si au moins un test échoue (utilisable en CI).
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const SCHOOLS_DIR = path.join(ROOT, 'data', 'schools');

let passed = 0;
let failed = 0;
const failures = [];

function ok(msg) { passed++; console.log(`  ✓ ${msg}`); }
function fail(msg) { failed++; failures.push(msg); console.log(`  ✗ ${msg}`); }

// ───── 0. Run build ───────────────────────────────────────────
console.log('─── Step 0: full build ───');
const build = spawnSync('node', ['scripts/build-schools.mjs', '--quiet'], { cwd: ROOT, encoding: 'utf8' });
if (build.status !== 0) {
  console.error('Build failed:', build.stderr || build.stdout);
  process.exit(1);
}
ok('build completed');

// ───── 1. JSON-LD per fiche ───────────────────────────────────
console.log('\n─── Step 1: JSON-LD validity for 17 fiches ───');
const slugs = fs.readdirSync(SCHOOLS_DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace(/\.json$/, ''));

for (const slug of slugs) {
  const ficheFile = path.join(PUBLIC, slug, 'index.html');
  if (!fs.existsSync(ficheFile)) {
    fail(`fiche absente: ${slug}`);
    continue;
  }
  const html = fs.readFileSync(ficheFile, 'utf8');
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) {
    fail(`${slug}: aucun bloc JSON-LD`);
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch (e) {
    fail(`${slug}: JSON-LD non parsable (${e.message.slice(0, 60)})`);
    continue;
  }
  if (!parsed['@context']) { fail(`${slug}: JSON-LD sans @context`); continue; }
  if (!parsed['@type'])    { fail(`${slug}: JSON-LD sans @type`); continue; }
  ok(`${slug}: JSON-LD valide`);
}

// ───── 2. similar_schools cross-refs ──────────────────────────
console.log('\n─── Step 2: cross-références similar_schools ───');
const slugSet = new Set(slugs);
for (const slug of slugs) {
  const data = JSON.parse(fs.readFileSync(path.join(SCHOOLS_DIR, `${slug}.json`), 'utf8'));
  for (const sim of (data.similar_schools || [])) {
    if (!slugSet.has(sim.slug)) {
      fail(`${slug} → similar_schools.slug "${sim.slug}" inexistant`);
    }
  }
}
if (failed === 0 || !failures.some(f => f.includes('similar_schools'))) {
  ok('toutes les références similar_schools sont valides');
}

// ───── 3. Pas de Rickroll ─────────────────────────────────────
console.log('\n─── Step 3: pas de Rickroll dans video.youtube_id ───');
let rickrolls = 0;
for (const slug of slugs) {
  const data = JSON.parse(fs.readFileSync(path.join(SCHOOLS_DIR, `${slug}.json`), 'utf8'));
  if (data.video?.youtube_id === 'dQw4w9WgXcQ') {
    fail(`${slug}: Rickroll détecté dans video.youtube_id`);
    rickrolls++;
  }
}
if (rickrolls === 0) ok('aucun Rickroll dans les fiches');

// ───── 4. SEO meta sur 27 pages ───────────────────────────────
console.log('\n─── Step 4: canonical + og:image + twitter:card sur 27 pages ───');
const editorialDirs = ['', 'ecoles', 'comparer', 'quiz', 'blog', 'a-propos', 'contact', 'cgu', 'confidentialite', 'mentions-legales'];
const allPages = [
  ...editorialDirs.map(d => path.join(PUBLIC, d, 'index.html')),
  ...slugs.map(s => path.join(PUBLIC, s, 'index.html')),
];

for (const p of allPages) {
  const rel = path.relative(ROOT, p);
  if (!fs.existsSync(p)) {
    fail(`${rel}: fichier absent`);
    continue;
  }
  const html = fs.readFileSync(p, 'utf8');
  const checks = [
    [/<link\s+rel="canonical"\s+href="https:\/\/schoolselect\.online\//, 'canonical'],
    [/<meta\s+property="og:image"\s+content="https?:\/\//, 'og:image'],
    [/<meta\s+name="twitter:card"\s+content="summary_large_image"/, 'twitter:card'],
  ];
  const missing = checks.filter(([re]) => !re.test(html)).map(([, name]) => name);
  if (missing.length) fail(`${rel}: manque ${missing.join(', ')}`);
  else ok(`${rel}: canonical + og:image + twitter:card`);
}

// ───── Summary ────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`Résultat : ${passed} OK, ${failed} ÉCHEC(S)`);
if (failed > 0) {
  console.log('\nÉchecs :');
  for (const f of failures) console.log(`  • ${f}`);
  process.exit(1);
}
console.log('Tous les tests sont passés.');
