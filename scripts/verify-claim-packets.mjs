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

const validFixtures = results.filter((r) => !r.shouldBeInvalid && r.rel.startsWith('examples/')).length;
const invalidFixtures = results.filter((r) => r.shouldBeInvalid).length;
const productionClaims = results.filter((r) => r.rel.startsWith('claims/')).length;
console.log(`claim packet verifier: ${exampleFiles.length} fixture(s), ${validFixtures} valid fixture(s), ${invalidFixtures} invalid fixture(s), ${productionClaims} listed claim packet(s)`);
for (const result of results) {
  console.log(`- ${result.rel}: ${result.passed ? 'ok' : 'failed'} (${result.fileErrors} schema error(s))`);
}
console.log(`question portfolio: ${existsSync(portfolioPath) ? 'ok' : 'missing'} (${listedClaims.size} listed claim packet(s))`);

const unexpected = results.filter((r) => !r.passed).length;
if (unexpected > 0 || validationErrors.length > 0) {
  console.error('\nUnexpected verifier result(s):');
  for (const message of validationErrors) console.error(`- ${message}`);
  process.exit(1);
}
