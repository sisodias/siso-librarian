#!/usr/bin/env node
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(process.cwd(), 'public');
const port = Number(process.env.SISO_OBSERVATORY_PORT || 8765);
// Always binds loopback (local checks and tunnel ingress both target 127.0.0.1).
// SISO_OBSERVATORY_HOST adds one extra address — use a Tailscale IP to reach the
// page from the tailnet. Never 0.0.0.0: this page is unauthenticated, and binding
// every interface would publish it to the LAN.
const extraHost = process.env.SISO_OBSERVATORY_HOST || null;
const hosts = ['127.0.0.1', ...(extraHost && extraHost !== '127.0.0.1' ? [extraHost] : [])];
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8' };
function createServer() {
  return http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

  // /search — full-text over the passage corpus.
  //
  // WHY. Measured 2026-08-06: library.html is a 10.5 MB STATIC file that searches
  // titles and chapter headings only. The CLI searches 3,135,554 passages across
  // both the printed and modern-spelling indexes. A reader on the page therefore
  // got a fundamentally weaker search than one at a terminal — the same
  // "capability exists, nothing surfaces it" defect the search CLI was written
  // to fix, one layer up.
  //
  // Delegates to the CLI rather than duplicating its SQL. That exclusion logic
  // took four failed attempts to get right (rowid join, per-term LIKE, candidate
  // cap); a second copy would drift from it, and the drift would be silent.
  if (url.pathname === '/search') {
    const q = (url.searchParams.get('q') || '').trim();
    const n = Math.min(Number(url.searchParams.get('limit') || 10) || 10, 50);
    if (!q) { res.writeHead(400, types['.json']); res.end('{"error":"missing q"}'); return; }
    try {
      const out = execFileSync('node', [join(process.cwd(), 'scripts', 'search-library.mjs'), q, '--limit', String(n)],
        { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
      res.writeHead(200, { 'Content-Type': types['.json'] });
      res.end(JSON.stringify({ query: q, text: out }));
    } catch (err) {
      // A timeout is not an empty result. Say which, so "no matches" can never be
      // confused with "the search did not finish".
      // Three outcomes, three codes. A reader's typo is not a server fault, and
      // a timeout is not an empty result — conflating them would make "no
      // matches" indistinguishable from "the search never finished".
      const timedOut = err?.killed || /ETIMEDOUT|timed out/i.test(String(err?.message || ''));
      const badQuery = err?.status === 65; // EX_DATAERR from search-library.mjs
      const detail = badQuery
        ? String(err?.stderr || '').split('\n').find((l) => l.startsWith('not a valid search expression'))
        : null;
      res.writeHead(badQuery ? 400 : timedOut ? 504 : 500, { 'Content-Type': types['.json'] });
      res.end(JSON.stringify({
        error: badQuery ? (detail || 'not a valid search expression') : timedOut ? 'search timed out' : 'search failed',
        query: q,
      }));
    }
    return;
  }

  const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  if (rel.includes('..')) { res.writeHead(400); res.end('bad path'); return; }
  const path = join(root, rel);
  if (!existsSync(path)) { res.writeHead(404); res.end('not found'); return; }
  const body = readFileSync(path);
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
  });
}

for (const h of hosts) {
  const server = createServer();
  server.on('error', (err) => console.error(`observatory bind failed on ${h}:${port}: ${err.message}`));
  server.listen(port, h, () => console.log(`siso observatory listening on http://${h}:${port}`));
}
