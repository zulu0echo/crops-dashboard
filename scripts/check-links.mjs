// Fails if any relative href/src in dist/ points at a file that does not exist.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
const OUT = process.argv[2] ?? 'dist';
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
let n = 0; const bad = [];
for (const f of walk(OUT).filter((f) => f.endsWith('.html'))) {
  for (const [, u] of readFileSync(f, 'utf8').matchAll(/(?:href|src)="([^"#?]*)[^"]*"/g)) {
    if (!u || /^(https?:|mailto:|data:)/.test(u)) continue;
    n++;
    const t = join(dirname(f), u) + (u.endsWith('/') ? 'index.html' : '');
    if (!existsSync(t)) bad.push(`${f} -> ${u}`);
  }
}
bad.slice(0, 20).forEach((b) => console.error(`broken link: ${b}`));
console.log(`${n} internal links, ${bad.length} broken`);
process.exit(bad.length ? 1 : 0);
