#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const schema = JSON.parse(readFileSync(join(root, 'schemas/claim-packet-v1.schema.json'), 'utf8'));
const validationErrors = [];
const results = [];

const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function fail(path, message) {
  validationErrors.push(`${path}: ${message}`);
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validate(value, node, path, sink = validationErrors) {
  if (node.const !== undefined && value !== node.const) sink.push(`${path}: expected const ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) sink.push(`${path}: expected one of ${node.enum.join(', ')}`);

  if (node.type) {
    const actual = typeOf(value);
    if (node.type === 'integer') {
      if (!Number.isInteger(value)) sink.push(`${path}: expected integer, got ${actual}`);
    } else if (node.type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) sink.push(`${path}: expected number, got ${actual}`);
    } else if (actual !== node.type) {
      sink.push(`${path}: expected ${node.type}, got ${actual}`);
      return;
    }
  }

  if (typeof value === 'string') {
    if (node.minLength !== undefined && value.length < node.minLength) sink.push(`${path}: length ${value.length} < ${node.minLength}`);
    if (node.pattern && !(new RegExp(node.pattern).test(value))) sink.push(`${path}: does not match ${node.pattern}`);
    if (node.format === 'date-time' && !dateTime.test(value)) sink.push(`${path}: expected RFC3339 UTC date-time`);
  }

  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) sink.push(`${path}: ${value} < minimum ${node.minimum}`);
    if (node.maximum !== undefined && value > node.maximum) sink.push(`${path}: ${value} > maximum ${node.maximum}`);
  }

  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) sink.push(`${path}: items ${value.length} < ${node.minItems}`);
    if (node.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) sink.push(`${path}: items are not unique`);
    if (node.items) value.forEach((item, index) => validate(item, node.items, `${path}[${index}]`, sink));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = node.required || [];
    for (const key of required) {
      if (!(key in value)) sink.push(`${path}: missing required property ${key}`);
    }
    const properties = node.properties || {};
    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) sink.push(`${path}.${key}: additional property not allowed`);
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) validate(value[key], child, `${path}.${key}`, sink);
    }
  }
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function validateClaimFile(file, shouldBeInvalid) {
  const fileValidationErrors = [];
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  validate(doc, schema, '$', fileValidationErrors);
  const fileErrors = fileValidationErrors.length;
  const rel = relative(root, file);
  const passed = shouldBeInvalid ? fileErrors > 0 : fileErrors === 0;
  results.push({ rel, fileErrors, shouldBeInvalid, passed });
  if (!passed && shouldBeInvalid) fail(rel, 'fixture was expected to be invalid but passed');
  if (!passed && !shouldBeInvalid) {
    fail(rel, 'claim packet was expected to be valid but failed');
    for (const message of fileValidationErrors) validationErrors.push(`${rel}: ${message}`);
  }
  return doc;
}

const exampleFiles = walk(join(root, 'examples')).filter((path) => path.endsWith('.json')).sort();
for (const file of exampleFiles) validateClaimFile(file, relative(root, file).includes('invalid'));

const claimFiles = walk(join(root, 'claims')).filter((path) => path.endsWith('.json')).sort();
for (const file of claimFiles) validateClaimFile(file, false);

const portfolioPath = join(root, 'questions/portfolio.json');
let listedClaims = new Set();
if (existsSync(portfolioPath)) {
  const portfolio = JSON.parse(readFileSync(portfolioPath, 'utf8'));
  if (portfolio.schema_version !== 'question-portfolio-v1') fail('questions/portfolio.json', 'expected schema_version question-portfolio-v1');
  if (!Array.isArray(portfolio.questions) || portfolio.questions.length < 1) fail('questions/portfolio.json', 'expected at least one question');
  for (const [index, question] of (portfolio.questions || []).entries()) {
    const base = `questions/portfolio.json.questions[${index}]`;
    if (!question.id || typeof question.id !== 'string') fail(base, 'missing question id');
    if (!Array.isArray(question.claim_packets) || question.claim_packets.length < 1) fail(base, 'expected at least one claim packet');
    for (const claimPath of question.claim_packets || []) {
      listedClaims.add(claimPath);
      if (!existsSync(join(root, claimPath))) fail(base, `listed claim packet does not exist: ${claimPath}`);
    }
  }
} else {
  fail('questions/portfolio.json', 'missing portfolio manifest');
}

for (const file of claimFiles) {
  const rel = relative(root, file);
  if (!listedClaims.has(rel)) fail(rel, 'claim packet is not listed in questions/portfolio.json');
}

const ledgerPath = join(root, 'refresh/ledger.json');
let refreshCoveredClaims = new Set();
if (existsSync(ledgerPath)) {
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
  if (ledger.schema_version !== 'refresh-ledger-v1') fail('refresh/ledger.json', 'expected schema_version refresh-ledger-v1');
  if (!Array.isArray(ledger.entries) || ledger.entries.length < 1) fail('refresh/ledger.json', 'expected at least one entry');
  for (const [index, entry] of (ledger.entries || []).entries()) {
    const base = `refresh/ledger.json.entries[${index}]`;
    if (!entry.claim_packet || typeof entry.claim_packet !== 'string') fail(base, 'missing claim_packet');
    if (!entry.question_id || typeof entry.question_id !== 'string') fail(base, 'missing question_id');
    if (!dateTime.test(entry.checked_at || '')) fail(base, 'checked_at must be RFC3339 UTC date-time');
    if (!['fresh', 'stale', 'blocked', 'superseded'].includes(entry.result)) fail(base, 'result must be fresh, stale, blocked, or superseded');
    if (!Array.isArray(entry.selectors_used) || entry.selectors_used.length < 1) fail(base, 'expected selectors_used');
    if (!Array.isArray(entry.invalidate_on_considered)) fail(base, 'expected invalidate_on_considered array');
    if (entry.claim_packet) {
      refreshCoveredClaims.add(entry.claim_packet);
      if (!existsSync(join(root, entry.claim_packet))) fail(base, `claim packet does not exist: ${entry.claim_packet}`);
      if (!listedClaims.has(entry.claim_packet)) fail(base, `claim packet is not listed in questions/portfolio.json: ${entry.claim_packet}`);
    }
  }
} else {
  fail('refresh/ledger.json', 'missing refresh ledger');
}

for (const file of claimFiles) {
  const rel = relative(root, file);
  if (!refreshCoveredClaims.has(rel)) fail(rel, 'claim packet has no refresh ledger entry');
}

// Grounding must dereference. A byte range that no longer resolves to its quote
// is silent rot: the claim still validates structurally while its evidence has
// moved or changed underneath it. Only checked for in-repo sources — external
// ids (standing packets, upstream corpora) are not resolvable from here.
let groundingChecked = 0;
let groundingBroken = 0;
for (const file of claimFiles) {
  const rel = relative(root, file);
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  for (const [gi, g] of (doc.grounding || []).entries()) {
    const srcId = g.source?.id || '';
    const srcPath = join(root, srcId);
    if (!srcId.includes('/') || !existsSync(srcPath)) continue;
    groundingChecked += 1;
    const { start, end } = g.byte_range || {};
    const actual = readFileSync(srcPath).subarray(start, end).toString('utf8');
    if (actual !== g.quote) {
      groundingBroken += 1;
      fail(`${rel}.grounding[${gi}]`, `byte_range [${start}:${end}] in ${srcId} no longer matches the quote`);
    }
  }
}

// The observatory must have been rebuilt by THIS verify run. Chain order in
// package.json is a comment, and a comment is the weakest guarantee here: a
// reordering would silently return the gate to inspecting stale data. An age
// bound makes the dependency enforced rather than remembered.
const SNAPSHOT_MAX_AGE_S = Number(process.env.SNAPSHOT_MAX_AGE_S || 300);
const snapPath = join(root, 'observatory/snapshot.json');
if (existsSync(snapPath)) {
  try {
    const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
    const ageS = (Date.now() - Date.parse(snap.generated_at)) / 1000;
    if (!Number.isFinite(ageS)) {
      fail('observatory/snapshot.json', 'generated_at is missing or unparseable');
    } else if (ageS > SNAPSHOT_MAX_AGE_S) {
      fail('observatory/snapshot.json',
        `stale by ${Math.round(ageS)}s (limit ${SNAPSHOT_MAX_AGE_S}s) — run \`npm run observatory:build\` first; verify must rebuild it before checking`);
    }
  } catch (error) {
    fail('observatory/snapshot.json', `unreadable: ${error.message}`);
  }
} else {
  fail('observatory/snapshot.json', 'missing — the observatory has never been built');
}

const sourceContracts = walk(join(root, 'sources')).filter((path) => path.endsWith('adapter-contract.json')).sort();
for (const file of sourceContracts) {
  const rel = relative(root, file);
  const contract = JSON.parse(readFileSync(file, 'utf8'));
  if (contract.schema_version !== 'source-adapter-contract-v1') fail(rel, 'expected schema_version source-adapter-contract-v1');
  if (!contract.source?.id) fail(rel, 'missing source.id');
  if (contract.source?.status !== 'proposed' && contract.source?.status !== 'active') fail(rel, 'source.status must be proposed or active');
  if (!contract.access?.metadata_endpoint_template) fail(rel, 'missing access.metadata_endpoint_template');
  if (contract.legal_filter?.required_rights !== 'public domain') fail(rel, 'required_rights must be public domain');
  if (contract.legal_filter?.exclude_borrow_only !== true) fail(rel, 'exclude_borrow_only must be true');
  if (contract.legal_filter?.rights_provenance?.required_for_ingest !== true) fail(rel, 'rights_provenance.required_for_ingest must be true');
  if (contract.legal_filter?.rights_provenance?.missing_or_ambiguous_route !== 'review') fail(rel, 'missing rights evidence must route to review');
  if (contract.legal_filter?.rights_provenance?.carry_search_result_rights_into_want_list !== true) fail(rel, 'search-result rights must be carried into want-list');
  if (contract.selection?.mode !== 'named-want-list-only') fail(rel, 'selection.mode must be named-want-list-only');
  if (contract.selection?.required_file_format !== 'DjVuTXT') fail(rel, 'required_file_format must be DjVuTXT');
  if (contract.selection?.head_failure_route !== 'review') fail(rel, 'HEAD failure must route to review');
  if (!Array.isArray(contract.selection?.metadata_sidecar_evidence_fields) || !contract.selection.metadata_sidecar_evidence_fields.includes('md5')) fail(rel, 'metadata sidecar evidence must include md5');
  if (contract.selection?.category_browsing_allowed !== false) fail(rel, 'category_browsing_allowed must be false');
  if (!Array.isArray(contract.measurements_required?.before) || contract.measurements_required.before.length < 1) fail(rel, 'missing before measurements');
  if (!Array.isArray(contract.measurements_required?.after) || contract.measurements_required.after.length < 1) fail(rel, 'missing after measurements');
}

const validFixtures = results.filter((r) => !r.shouldBeInvalid && r.rel.startsWith('examples/')).length;
const invalidFixtures = results.filter((r) => r.shouldBeInvalid).length;
const productionClaims = results.filter((r) => r.rel.startsWith('claims/')).length;
console.log(`claim packet verifier: ${exampleFiles.length} fixture(s), ${validFixtures} valid fixture(s), ${invalidFixtures} invalid fixture(s), ${productionClaims} listed claim packet(s)`);
for (const result of results) {
  console.log(`- ${result.rel}: ${result.passed ? 'ok' : 'failed'} (${result.fileErrors} schema error(s))`);
}
console.log(`question portfolio: ${existsSync(portfolioPath) ? 'ok' : 'missing'} (${listedClaims.size} listed claim packet(s))`);
console.log(`refresh ledger: ${existsSync(ledgerPath) ? 'ok' : 'missing'} (${refreshCoveredClaims.size} covered claim packet(s))`);
console.log(`source adapter contracts: ${sourceContracts.length}`);
console.log(`grounding byte ranges: ${groundingChecked} checked, ${groundingBroken} broken`);

const unexpected = results.filter((r) => !r.passed).length;
if (unexpected > 0 || validationErrors.length > 0) {
  console.error('\nUnexpected verifier result(s):');
  for (const message of validationErrors) console.error(`- ${message}`);
  process.exit(1);
}
