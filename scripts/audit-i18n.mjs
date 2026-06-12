import fs from 'fs';
import path from 'path';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && !['node_modules', '.next', '.git'].includes(ent.name)) walk(p, files);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const content = fs.readFileSync('lib/i18n/translations.ts', 'utf8');
function parseLocaleBlock(locale) {
  const start = content.indexOf(`${locale}: {`);
  const braceStart = content.indexOf('{', start);
  let depth = 0;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return eval(`(${content.slice(braceStart, i + 1)})`);
    }
  }
}
function flatten(obj, prefix = '') {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(result, flatten(v, full));
    else result[full] = v;
  }
  return result;
}

const bgFlat = flatten(parseLocaleBlock('bg'));
const enFlat = flatten(parseLocaleBlock('en'));

const tKeyRegex = /\bt\(\s*['"]([^'"]+)['"]\s*\)/g;
const usedKeys = new Map();
const hardcodedAlerts = [];
const hardcodedLoading = [];
const cyrillicInComponents = [];

for (const file of walk('.')) {
  if (file.includes('translations.ts') || file.includes('privacyPolicyContent.ts') || file.includes('node_modules')) continue;
  const rel = file.replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = tKeyRegex.exec(src))) {
    const key = m[1];
    if (!usedKeys.has(key)) usedKeys.set(key, []);
    usedKeys.get(key).push(rel);
  }
  const alertRegex = /(?:alert|confirm)\(\s*['"]([^'"]{3,})['"]/g;
  while ((m = alertRegex.exec(src))) hardcodedAlerts.push({ file: rel, text: m[1] });
  if (/Loading\.\.\./.test(src) && !file.includes('audit-i18n')) hardcodedLoading.push(rel);
  if (/[\u0400-\u04FF]/.test(src) && (rel.startsWith('components/') || rel.startsWith('app/'))) {
    const lines = src.split('\n').map((line, i) => ({ line: i + 1, text: line.trim() }))
      .filter(({ text }) => /[\u0400-\u04FF]/.test(text) && !text.startsWith('//') && !text.startsWith('*'));
    if (lines.length) cyrillicInComponents.push({ file: rel, lines: lines.slice(0, 5) });
  }
}

const missingUsed = [...usedKeys.keys()].filter((k) => !(k in enFlat));
const enSameAsBg = Object.keys(enFlat).filter((k) => enFlat[k] === bgFlat[k] && typeof enFlat[k] === 'string' && enFlat[k].length > 3);

console.log('=== Translation key parity ===');
console.log(`BG: ${Object.keys(bgFlat).length}, EN: ${Object.keys(enFlat).length}`);
console.log(`Used t() keys: ${usedKeys.size}`);
console.log(`Missing from EN (used in code): ${missingUsed.length}`);
missingUsed.forEach((k) => console.log(`  ${k}`));

console.log('\n=== Hardcoded alert/confirm ===');
hardcodedAlerts.forEach(({ file, text }) => console.log(`  ${file}: "${text}"`));

console.log('\n=== Hardcoded "Loading..." ===');
[...new Set(hardcodedLoading)].forEach((f) => console.log(`  ${f}`));

console.log('\n=== Cyrillic in app/components (sample) ===');
cyrillicInComponents.forEach(({ file, lines }) => {
  console.log(`  ${file}`);
  lines.forEach(({ line, text }) => console.log(`    L${line}: ${text.slice(0, 100)}`));
});
