/**
 * Generates src/data/ranges.json from the rules in RANGES.md §3.
 * Run: npm run generate
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRanges, raisePct, TARGETS } from '../src/lib/generate';
import { POSITIONS } from '../src/lib/types';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../src/data/ranges.json');

const data = generateRanges();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
for (const pos of POSITIONS) {
  console.log(`  ${pos.padEnd(4)} target ${TARGETS[pos]}%  actual ${raisePct(data.RFI[pos]).toFixed(2)}%`);
}
