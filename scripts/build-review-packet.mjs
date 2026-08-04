#!/usr/bin/env node
// Render every claim as a single reviewable document, with each grounding quote
// resolved from its source at build time.
//
// Written because the portfolio reached 7 of 7 questions and zero independent
// reviews. A reviewer currently has to open 22 files and resolve byte offsets by
// hand to check one claim. That cost is a reason not to review, and it is a cost
// I can remove — unlike the reviewer's attention, which I cannot manufacture.
//
// Every quote below is dereferenced live. If a byte range no longer resolves,
// the packet says so instead of printing the claim's own copy of the text.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const claimDir = join(root, 'claims');
const claims = readdirSync(claimDir).filter((f) => f.endsWith('.json')).sort()
  .map((f) => ({ file: `claims/${f}`, doc: JSON.parse(readFileSync(join(claimDir, f), 'utf8')) }));

function resolveQuote(g) {
  const id = g.source?.id || '';
  const path = join(root, id);
  if (!id.includes('/') || !existsSync(path)) {
    return { resolved: false, reason: 'source is external or not in this repo', text: g.quote };
  }
  const { start, end } = g.byte_range || {};
  const actual = readFileSync(path).subarray(start, end).toString('utf8');
  return { resolved: actual === g.quote, text: actual, expected: g.quote, path: id, start, end };
}

const live = claims.filter((c) => c.doc.claim.status !== 'superseded');
const superseded = claims.filter((c) => c.doc.claim.status === 'superseded');

let broken = 0;
const lines = [];
lines.push('# Review packet — every live claim, evidence resolved');
lines.push('');
lines.push(`Generated ${new Date().toISOString()} by \`scripts/build-review-packet.mjs\`.`);
lines.push('');
lines.push('Each quote below was read from its source file at build time, not copied from the claim.');
lines.push('A quote marked **UNRESOLVED** means the byte range no longer matches — treat the claim as unsupported.');
lines.push('');
lines.push('## How to disagree');
lines.push('');
lines.push('Every claim states a position, a confidence, and an action. The useful review is not "is this well-formed" — a gate already checks that. It is:');
lines.push('');
lines.push('1. Does the evidence support the position, or a weaker one?');
lines.push('2. Is the confidence justified, or is it a number attached to a hunch?');
lines.push('3. Is the proposed action the right response, and is it safe?');
lines.push('');
lines.push(`${live.length} live claims, ${superseded.length} superseded.`);
lines.push('');

for (const { file, doc } of live) {
  const c = doc.claim;
  lines.push('---');
  lines.push('');
  lines.push(`## ${doc.question.id} — confidence ${c.confidence}, action \`${doc.action.status}\``);
  lines.push('');
  lines.push(`**Question.** ${doc.question.text}`);
  lines.push('');
  lines.push(`**Scope.** ${doc.question.scope}`);
  lines.push('');
  lines.push(`**Position.** ${c.position}`);
  lines.push('');
  lines.push(`**Proposed action.** ${doc.action.description}`);
  lines.push('');
  lines.push('**Evidence, resolved from source:**');
  lines.push('');
  for (const g of doc.grounding) {
    const r = resolveQuote(g);
    if (r.resolved) {
      lines.push(`- \`${r.text}\` — ${r.path} [${r.start}:${r.end}], ${g.locator}`);
    } else if (r.reason) {
      lines.push(`- \`${g.quote}\` — ${g.source.id} *(${r.reason})*`);
    } else {
      broken += 1;
      lines.push(`- **UNRESOLVED** expected \`${r.expected}\`, found \`${r.text}\` at ${r.path} [${r.start}:${r.end}]`);
    }
  }
  lines.push('');
  lines.push(`<sub>${file} · ${c.id}</sub>`);
  lines.push('');
}

if (superseded.length) {
  lines.push('---');
  lines.push('');
  lines.push('## Superseded');
  lines.push('');
  for (const { file, doc } of superseded) {
    lines.push(`- ${doc.question.id} — ${doc.claim.id} (superseded by a later claim; kept as history)`);
  }
  lines.push('');
}

writeFileSync(join(root, 'REVIEW-PACKET.md'), lines.join('\n'));
console.log(JSON.stringify({ live: live.length, superseded: superseded.length, unresolved_quotes: broken }, null, 2));
if (broken) process.exit(4);
