#!/usr/bin/env node
// Establishes the naive baseline GQ-005's falsifier 1 requires.
//
// That falsifier says: "Dated predictions, once scored, do no better than a
// naive 'current trends continue' baseline." When I wrote it I recorded that
// the baseline did not exist, which made the falsifier unusable — a contract
// that looks complete but cannot fire is the failure I had just spent a loop
// removing, so leaving it there was not acceptable.
//
// WHAT THIS IS NOT. The graph carries star_velocity, star_delta and
// momentum_day, which look like a momentum signal and are not one:
//
//     star_delta null on 406,297 of 463,230 rows, zero on 56,904, positive on 28
//     distinct momentum_day values: 1  (2026-07-11)
//
// One observation day is a snapshot. A delta needs two, so nothing built on
// those fields could be a time series no matter how it were aggregated.
//
// WHAT THIS IS. `created_at` is a dense, real time axis — repository birth
// dates, populated across every cohort. So the measurable quantity is not "what
// is gaining stars now" but "what share of each year's NEW repositories chose
// this technology", which is a genuine dated delta and needs only one
// observation to compute, because the time is carried in the data rather than
// in when I happened to look.
//
// The naive baseline is deliberately dumb: next cohort's share equals this
// cohort's. A movement map that cannot beat "assume no change" has not
// identified movement.
//
// Read-only. Emits metrics/<date>-movement-baseline.json.
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const GRAPH = `${process.env.HOME}/foundry-data/domains/people/people_v2.sqlite`;
if (!existsSync(GRAPH)) { console.error('people graph not present'); process.exit(1); }

const q = (sql) => execFileSync('sqlite3', [`file:${GRAPH}?mode=ro`, sql],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

// Cohorts with enough volume to be worth reading. 2026 is partial by
// construction — the year is not over — so it is reported but flagged, because
// a partial cohort looks like a trend break if you forget why it is short.
const COHORTS = ['2021', '2022', '2023', '2024', '2025', '2026'];
const PARTIAL = '2026';

// Minimum rows before a cohort share is trustworthy. Same reasoning as the
// 100-request floor on the routing evidence: a 4-request outlier nearly became
// a headline once, and a thin cohort produces the same kind of confident noise.
const MIN_COHORT = 5000;

const rows = q(`
  with c as (
    select substr(json_extract(meta_json,'$.created_at'),1,4) yr,
           json_extract(meta_json,'$.language') lang
    from person_content
    where domain='github' and json_extract(meta_json,'$.created_at') is not null
  )
  select yr, coalesce(lang,'(none)'), count(*)
  from c where yr in (${COHORTS.map((y) => `'${y}'`).join(',')})
  group by yr, lang;
`).split('\n').filter(Boolean).map((l) => l.split('|'));

const byYear = new Map();
for (const [yr, lang, n] of rows) {
  if (!byYear.has(yr)) byYear.set(yr, { total: 0, langs: new Map() });
  const e = byYear.get(yr);
  e.total += Number(n);
  e.langs.set(lang, Number(n));
}

// Track languages that are material somewhere in the window, not a fixed list,
// so a technology that appears mid-window is not invisible by construction.
const tracked = new Set();
for (const [, e] of byYear) {
  for (const [lang, n] of e.langs) {
    // Both sentinels must be excluded. `(none)` is my coalesce for a SQL NULL;
    // the empty string is a JSON null that sqlite3 renders as '' and coalesce
    // therefore does NOT catch. Missing the second put "" in the tracked set at
    // an 8.68% share — a language that does not exist, ranked above Rust.
    if (lang !== '(none)' && lang !== '' && n / e.total >= 0.02) tracked.add(lang);
  }
}

const cohorts = COHORTS.filter((y) => byYear.has(y)).map((yr) => {
  const e = byYear.get(yr);
  const shares = {};
  for (const lang of tracked) {
    shares[lang] = Math.round((e.langs.get(lang) || 0) / e.total * 10000) / 100;
  }
  // Report the unlabelled share rather than dropping it. Excluding it from the
  // tracked set is correct — it is not a technology — but leaving it out of the
  // record entirely would imply the tracked languages sum to the whole cohort.
  const unlabelled = (e.langs.get('') || 0) + (e.langs.get('(none)') || 0);
  return {
    cohort: yr,
    repos: e.total,
    partial: yr === PARTIAL,
    below_floor: e.total < MIN_COHORT,
    unlabelled_pct: Math.round(unlabelled / e.total * 10000) / 100,
    share_pct: shares,
  };
});

// The baseline itself: for each tracked language, predict the next cohort's
// share as equal to the last COMPLETE cohort's. Anything claiming to identify
// movement must be scored against this and beat it.
const complete = cohorts.filter((c) => !c.partial && !c.below_floor);
const last = complete[complete.length - 1];
const prev = complete[complete.length - 2];

const baseline = {};
for (const lang of tracked) {
  const now = last.share_pct[lang];
  const before = prev ? prev.share_pct[lang] : null;
  baseline[lang] = {
    naive_next_share_pct: now,
    last_observed_delta_pp: before === null ? null : Math.round((now - before) * 100) / 100,
  };
}

const out = {
  measured_at: new Date().toISOString(),
  question: 'GQ-005',
  purpose: 'Naive baseline required by GQ-005 falsifier 1. Predictions must beat this to count as identifying movement.',
  source: '~/foundry-data/domains/people/people_v2.sqlite',
  method: 'Share of each creation-year cohort by primary language, read-only over person_content.',
  time_axis: 'created_at (repository birth date). NOT star velocity — see rejected_signal.',
  rejected_signal: {
    fields: ['star_delta', 'star_velocity', 'momentum_day'],
    reason: 'One distinct momentum_day (2026-07-11) and star_delta null on 406,297 of 463,230 rows. A single observation day cannot yield a delta.',
    star_delta_null: 406297,
    star_delta_zero: 56904,
    star_delta_positive: 28,
    distinct_momentum_days: 1,
  },
  baseline_rule: 'next cohort share = last complete cohort share',
  baseline_from_cohort: last.cohort,
  cohorts,
  baseline,
  caveats: [
    `${PARTIAL} is a partial cohort (year incomplete) and is excluded from the baseline.`,
    `Cohorts below ${MIN_COHORT} repos are flagged and excluded from the baseline.`,
    'Language is a proxy for technology direction, not for capability or quality.',
    'This is one corpus of curated repositories, not the whole field.',
  ],
  derivations: {
    'rejected_signal.distinct_momentum_days': {
      kind: 'sqlite',
      source: '~/foundry-data/domains/people/people_v2.sqlite',
      query: "select count(distinct json_extract(meta_json,'$.momentum_day')) from person_content where domain='github' and json_extract(meta_json,'$.momentum_day') is not null;",
    },
    'rejected_signal.star_delta_null': {
      kind: 'sqlite',
      source: '~/foundry-data/domains/people/people_v2.sqlite',
      query: "select sum(case when json_extract(meta_json,'$.star_delta') is null then 1 else 0 end) from person_content where domain='github';",
    },
  },
};

const stamp = new Date().toISOString().slice(0, 10);
const path = `metrics/${stamp}-movement-baseline.json`;
writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ written: path, baseline_from_cohort: last.cohort, tracked: [...tracked].sort(), baseline }, null, 2));
