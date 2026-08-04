// Apply an edit and PROVE it landed, or throw.
//
// WHY THIS EXISTS. Five times on 2026-08-04 a comment satisfied a check meant
// for code, and the fifth was inside my own patch script: I guarded an import
// insertion with `if (!text.includes('claim-paths.mjs'))`, but the comment I had
// just added contained that string, so the import was silently skipped. The
// audit then threw ReferenceError at runtime — after `node --check` passed.
//
// Reproduced in isolation the same day:
//   patch script exit  0   (reported success)
//   node --check       ok  (the file is valid — just missing the edit)
//   imports landed     0
//
// Both signals said success. That is the whole defect: a no-op edit is
// indistinguishable from an applied one unless something checks the RESULT.
//
// THE RULE. State what must be true after the edit, and verify it against the
// file on disk. Not "did the string appear somewhere" — that is what failed —
// but a predicate over the post-edit content that the pre-edit content does not
// already satisfy.
import { readFileSync, writeFileSync } from 'node:fs';

// Replace `find` with `replace` exactly once, and prove the file changed.
//
//   applyEdit('scripts/x.mjs', { find: 'a', replace: 'b' })
//   applyEdit('scripts/x.mjs', { find: 'a', replace: 'b', expect: (t) => /b/.test(t) })
export function applyEdit(path, { find, replace, expect, count = 1 }) {
  const before = readFileSync(path, 'utf8');

  const occurrences = before.split(find).length - 1;
  if (occurrences !== count) {
    throw new Error(`patch would not apply cleanly to ${path}: expected ${count} occurrence(s) of the anchor, found ${occurrences}`);
  }

  const after = before.split(find).join(replace);
  if (after === before) {
    // find === replace, or an empty replacement of nothing. Either way the edit
    // is a no-op and the caller believes it succeeded.
    throw new Error(`patch is a no-op on ${path}: the content is unchanged`);
  }

  writeFileSync(path, after);

  // Verify against DISK, not against the string we just built in memory. A
  // failed write, a read-only file or a racing process all look fine if you
  // only check your own variable.
  const written = readFileSync(path, 'utf8');
  if (written !== after) {
    throw new Error(`patch did not persist to ${path}: on-disk content differs from what was written`);
  }
  if (expect && !expect(written)) {
    writeFileSync(path, before);   // restore — an unverified edit is worse than none
    throw new Error(`patch applied to ${path} but the post-condition failed; file restored`);
  }
  return { path, bytesBefore: before.length, bytesAfter: written.length };
}

// Insert an import and prove it is REACHABLE code, not a mention in a comment.
// This is the exact case that failed: the guard must ignore comments, because
// the thing being guarded against is a comment.
export function ensureImport(path, { statement, anchor, symbol }) {
  const before = readFileSync(path, 'utf8');
  const code = stripComments(before);
  if (new RegExp(`^\\s*import[^\\n]*\\b${symbol}\\b`, 'm').test(code)) {
    return { path, alreadyPresent: true };
  }
  return applyEdit(path, {
    find: anchor,
    replace: `${statement}\n${anchor}`,
    expect: (t) => new RegExp(`^\\s*import[^\\n]*\\b${symbol}\\b`, 'm').test(stripComments(t)),
  });
}

// Line comments and block comments only. Enough for the guard case; deliberately
// not a parser, and not pretending to be one.
export function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((l) => l.replace(/(^|\s)(\/\/|#).*$/, ' ')).join('\n');
}
