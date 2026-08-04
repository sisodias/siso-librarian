// One place that knows how a derivation label maps to a snapshot value.
//
// This exists because the same defect appeared FIVE times in one session, most
// recently inside the script written to hunt it:
//
//   registry/source_inventories vs source-inventories  -> reported 0 of 6
//   person_content vs person_topic                     -> nearly refuted a true claim
//   snap.bucket_counts[g][k] hardcoded                 -> repo_health.* audited nothing
//   bucket_counts. prefix vs bare key                  -> reported 42 undeclared, true 24
//   the same prefix bug, in the collision analysis     -> every group read as null
//
// Every instance had the same cause: path resolution re-implemented at each
// call site, so a fix in one place left the others wrong, and each wrong copy
// AGREED WITH ITSELF rather than erroring. Consolidating removes the class,
// because there is now one implementation to get right.
//
// Derivation labels are `group.key` (e.g. `passages.books`). Snapshot values
// live either under `bucket_counts.<group>.<key>` or at `<group>.<key>` on the
// root. A label must resolve against exactly one of those, and nothing may
// guess a third shape.

const BUCKET = 'bucket_counts';

/** Walk a dotted path. Returns undefined if any segment is missing. */
export function walk(doc, dotted) {
  return String(dotted).split('.')
    .reduce((o, k) => (o == null ? undefined : o[k]), doc);
}

/**
 * Resolve a derivation label to its published value.
 * Tries the bare path and the bucket_counts-prefixed path, in that order.
 * Returns undefined when neither resolves — never a fallback zero, because a
 * confident zero is how the hyphen/underscore bug hid six source inventories.
 */
export function resolveLabel(snap, label) {
  const bare = walk(snap, label);
  if (bare !== undefined && typeof bare !== 'object') return bare;
  const prefixed = walk(snap, `${BUCKET}.${label}`);
  if (prefixed !== undefined && typeof prefixed !== 'object') return prefixed;
  return undefined;
}

/**
 * The label a snapshot path corresponds to — the inverse of resolveLabel.
 * `bucket_counts.passages.books` -> `passages.books`; anything else unchanged.
 */
export function labelForPath(path) {
  return path.startsWith(`${BUCKET}.`) ? path.slice(BUCKET.length + 1) : path;
}
