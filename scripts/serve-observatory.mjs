#!/usr/bin/env node
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

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
