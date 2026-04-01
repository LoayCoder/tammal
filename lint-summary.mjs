import fs from 'fs';

const d = JSON.parse(fs.readFileSync('lint_report.json', 'utf8'));
const rules = {};
for (const f of d) {
  for (const m of f.messages) {
    const key = m.ruleId || 'unknown';
    rules[key] = (rules[key] || 0) + 1;
  }
}
const sorted = Object.entries(rules).sort((a, b) => b[1] - a[1]).slice(0, 20);
fs.writeFileSync('lint_summary.txt', sorted.map(([r, c]) => `${c}\t${r}`).join('\n'), 'utf8');
console.log('Done - top 20 lint rules written to lint_summary.txt');
