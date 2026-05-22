#!/usr/bin/env node
// Titan Launch Readiness Orchestrator
// Runs core validations in parallel where feasible and then summarizes results.
// This is a lightweight harness; it invokes existing npm scripts where available.

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

async function runCmd(cmd, title) {
  try {
    console.log(`\n=== ${title} ===`);
    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return { ok: true, title, output: stdout + stderr };
  } catch (err) {
    return { ok: false, title, output: (err.stdout || '') + (err.stderr || err.message) };
  }
}

async function ensureSkeletons() {
  const publicDir = path.join(__dirname, '../../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const files = [
    { name: 'robots.txt', content: 'User-agent: *\nAllow: /\n' },
    {
      name: 'sitemap.xml',
      content:
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    },
    {
      name: 'structured-data/webapp.jsonld',
      content: '{ "@context": "https://schema.org", "@type": "WebApplication" }',
    },
  ];
  for (const f of files) {
    const p = path.join(publicDir, f.name);
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, f.content, 'utf8');
    }
  }
}

async function main() {
  console.log('Titan Launch Orchestrator starting...');
  await ensureSkeletons();

  const tasks = [
    { cmd: 'npm run typecheck', title: 'TypeScript typecheck' },
    { cmd: 'npm test -s', title: 'Test Suite' },
    { cmd: 'npm run lint', title: 'Lint' },
    { cmd: 'npm run format:check', title: 'Format' },
  ];

  const results = await Promise.all(tasks.map((t) => runCmd(t.cmd, t.title)));
  results.push(await runCmd('npm run build', 'Production Build'));

  // STEP-agnostic quick checks for indexing assets
  const assets = [
    { name: 'robots.txt', ok: fs.existsSync(path.join(__dirname, '../../public/robots.txt')) },
    { name: 'sitemap.xml', ok: fs.existsSync(path.join(__dirname, '../../public/sitemap.xml')) },
  ];

  // Health summary
  const summary = {
    timestamp: new Date().toISOString(),
    results: results.map((r) => ({ name: r.title, ok: r.ok, detail: r.output.slice(0, 800) })),
    assets: assets.map((a) => ({ name: a.name, exists: a.ok })),
  };

  // Persist summary to docs for quick review
  const outPath = path.join(__dirname, '../../docs/launch-health-summary.json');
  fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log('\nLaunch health summary written to', outPath);
  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(
      `\n${failed.length} launch check(s) failed: ${failed.map((r) => r.title).join(', ')}`,
    );
    process.exit(1);
  }

  console.log('\nDone. Review docs/launch-health-summary.json for results.');
}

main().catch((err) => {
  console.error('Fatal error in launch orchestrator:', err);
  process.exit(2);
});
