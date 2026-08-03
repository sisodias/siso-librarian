#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const schema = JSON.parse(readFileSync(join(root, 'schemas/claim-packet-v1.schema.json'), 'utf8'));
const examplesDir = join(root, 'examples');

const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const errors = [];
const results = [];

function fail(path, message) {
  errors.push(`${path}: ${message}`);
}

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validate(value, node, path) {
  if (node.const !== undefined && value !== node.const) fail(path, `expected const ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) fail(path, `expected one of ${node.enum.join(', ')}`);

  if (node.type) {
    const actual = typeOf(value);
    if (node.type === 'integer') {
      if (!Number.isInteger(value)) fail(path, `expected integer, got ${actual}`);
    } else if (node.type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) fail(path, `expected number, got ${actual}`);
    } else if (actual !== node.type) {
      fail(path, `expected ${node.type}, got ${actual}`);
      return;
    }
  }

  if (typeof value === 'string') {
    if (node.minLength !== undefined && value.length < node.minLength) fail(path, `length ${value.length} < ${node.minLength}`);
    if (node.pattern && !(new RegExp(node.pattern).test(value))) fail(path, `does not match ${node.pattern}`);
    if (node.format === 'date-time' && !dateTime.test(value)) fail(path, 'expected RFC3339 UTC date-time');
  }

  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum) fail(path, `${value} < minimum ${node.minimum}`);
    if (node.maximum !== undefined && value > node.maximum) fail(path, `${value} > maximum ${node.maximum}`);
  }

  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems) fail(path, `items ${value.length} < ${node.minItems}`);
    if (node.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) fail(path, 'items are not unique');
    if (node.items) value.forEach((item, index) => validate(item, node.items, `${path}[${index}]`));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = node.required || [];
    for (const key of required) {
      if (!(key in value)) fail(path, `missing required property ${key}`);
    }
    const properties = node.properties || {};
    if (node.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) fail(`${path}.${key}`, 'additional property not allowed');
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) validate(value[key], child, `${path}.${key}`);
    }
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(examplesDir).filter((path) => path.endsWith('.json')).sort();
for (const file of files) {
  const before = errors.length;
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  validate(doc, schema, '$');
  const fileErrors = errors.length - before;
  const rel = relative(root, file);
  const shouldBeInvalid = rel.includes('invalid');
  const passed = shouldBeInvalid ? fileErrors > 0 : fileErrors === 0;
  results.push({ rel, fileErrors, shouldBeInvalid, passed });
  if (!passed && shouldBeInvalid) fail(rel, 'fixture was expected to be invalid but passed');
  if (!passed && !shouldBeInvalid) fail(rel, 'fixture was expected to be valid but failed');
}

const validFixtures = results.filter((r) => !r.shouldBeInvalid).length;
const invalidFixtures = results.filter((r) => r.shouldBeInvalid).length;
console.log(`claim packet verifier: ${files.length} fixture(s), ${validFixtures} valid fixture(s), ${invalidFixtures} invalid fixture(s)`);
for (const result of results) {
  console.log(`- ${result.rel}: ${result.passed ? 'ok' : 'failed'} (${result.fileErrors} schema error(s))`);
}

const unexpected = results.filter((r) => !r.passed).length;
if (unexpected > 0) {
  console.error('\nUnexpected verifier result(s):');
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
