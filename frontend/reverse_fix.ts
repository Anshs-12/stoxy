import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) results = results.concat(walk(fullPath));
    else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) results.push(fullPath);
  }
  return results;
}

const files = walk(path.join(process.cwd(), 'src'));
let count = 0;

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  const orig = c;

  c = c.replace(/bg-cta-bg text-cta-text/g, 'bg-black text-white');
  c = c.replace(/bg-cta-bg\/80 text-cta-text/g, 'bg-black/80 text-white');
  c = c.replace(/hover:bg-cta-bg\/80/g, 'hover:bg-black/80');
  c = c.replace(/hover:bg-cta-bg/g, 'hover:bg-black');
  
  c = c.replace(/\bbg-primary\b(?!\/)/g, 'bg-black');
  
  c = c.replace(/bg-primary\/5\b/g, 'bg-black/5');
  c = c.replace(/bg-primary\/8\b/g, 'bg-black/8');
  c = c.replace(/bg-primary\/10\b/g, 'bg-black/10');
  c = c.replace(/bg-primary\/20\b/g, 'bg-black/20');
  c = c.replace(/bg-primary\/60\b/g, 'bg-black/60');
  c = c.replace(/bg-primary\/70\b/g, 'bg-black/70');
  
  c = c.replace(/ring-surface/g, 'ring-white');
  c = c.replace(/bg-surface border-b border-border-light/g, 'bg-white border-b border-black/5');
  c = c.replace(/hover:bg-primary\/\[0\.03\]/g, 'hover:bg-black/[0.03]');
  c = c.replace(/bg-primary\/20 backdrop-blur/g, 'bg-black/20 backdrop-blur');

  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    count++;
    console.log(`Updated: ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`Done — updated ${count} files.`);
