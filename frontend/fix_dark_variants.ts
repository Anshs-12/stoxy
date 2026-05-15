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

  c = c.replace(/bg-black\/5\b/g, 'bg-black/5 dark:bg-white/5');
  c = c.replace(/bg-black\/8\b/g, 'bg-black/8 dark:bg-white/8');
  c = c.replace(/bg-black\/10\b/g, 'bg-black/10 dark:bg-white/10');
  c = c.replace(/bg-black\/20\b/g, 'bg-black/20 dark:bg-white/20');
  c = c.replace(/bg-black\/60\b/g, 'bg-black/60 dark:bg-white/60');
  c = c.replace(/bg-black\/70\b/g, 'bg-black/70 dark:bg-white/70');
  c = c.replace(/bg-black\/80\b/g, 'bg-black/80 dark:bg-white/80');

  // Fix buttons that have bg-black text-white
  c = c.replace(/bg-black text-white/g, 'bg-black dark:bg-white text-white dark:text-black');
  c = c.replace(/bg-black hover:bg-black\/80 text-white/g, 'bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black');

  // Any remaining generic bg-black
  c = c.replace(/\bbg-black\b(?!\/)(?! dark:bg-white)(?! text-white)/g, 'bg-black dark:bg-white');

  // Clean up any double dark classes from multiple runs
  c = c.replace(/dark:bg-white\/5 dark:bg-white\/5/g, 'dark:bg-white/5');
  c = c.replace(/dark:bg-white\/10 dark:bg-white\/10/g, 'dark:bg-white/10');
  c = c.replace(/dark:bg-white dark:bg-white/g, 'dark:bg-white');

  if (c !== orig) {
    fs.writeFileSync(file, c, 'utf8');
    count++;
  }
}
console.log(`Done — updated ${count} files with dark mode variants.`);
