// One place that knows where the vault is — and lets a test point elsewhere.
//
// WHY THIS EXISTS. Measured 2026-08-05: eight scripts hardcoded the vault path
// and exactly one could be redirected. That is not a stylistic problem. Three
// separate times this session a probe pointed a copy at a script, the script
// ignored it and read the real database, and the test reported PASS having
// measured nothing:
//
//   - corpus-integrity: a duplicate-detection probe that tested the query,
//     not the script
//   - build-library-page: a "does it fail without passage_modern" probe that
//     returned exit 0 because it had checked the real, healthy database
//   - rebuild-selftest: 4 of 7 cases passed with the pipeline deleted
//
// A script that cannot be pointed at a fixture cannot be tested. The defect is
// the hardcoding, not the three probes.
//
// PRECEDENT. lib/snapshot-paths.mjs was written after four snapshot mis-keys and
// that class stopped recurring; lib/claim-paths.mjs after five claim mis-keys.
// Same mechanism, third application.
//
// USE
//   import { vaultRoot, corpusDb, ingestDir, booksDb } from './lib/vault-paths.mjs';
//
// TEST
//   VAULT_ROOT=/tmp/fixture node scripts/whatever.mjs
//   CORPUS_DB=/tmp/copy.db  node scripts/whatever.mjs   (overrides just the index)

const DEFAULT_VAULT = '/Volumes/SISO-STORAGE-VAULT/SISO-VAULT/librarian-vault';

// VAULT_ROOT redirects everything below it; the narrower vars override one path
// each. Narrow beats broad, so a test can move the corpus index without moving
// the ingest directory.
export function vaultRoot() {
  return process.env.VAULT_ROOT || DEFAULT_VAULT;
}

export function ingestDir() {
  return process.env.INGEST_DIR || `${vaultRoot()}/ia-ingest`;
}

export function corpusDb() {
  return process.env.CORPUS_DB || `${ingestDir()}/external-passages.sqlite`;
}

export function textDir() {
  return process.env.TEXT_DIR || `${ingestDir()}/text`;
}

// The catalogue is NOT on the vault — it is the Library's own database on the
// internal disk. Included here because the same tests need to redirect it, and
// having two modules for "where things are" is how they drift apart.
export function booksDb() {
  return process.env.BOOKS_DB || `${process.env.HOME}/foundry-data/domains/books/books.sqlite`;
}

// A read-only URI. immutable=1 for archives specifically: they are snapshots
// nothing writes to, and a WAL-header copy cannot open read-only without
// creating a -shm sidecar beside it. NOT applied to live databases, where it
// would let a reader see a stale page and agree with a number that has moved.
export function readOnlyUri(path, { archived = false } = {}) {
  return archived ? `file:${path}?mode=ro&immutable=1` : `file:${path}?mode=ro`;
}
