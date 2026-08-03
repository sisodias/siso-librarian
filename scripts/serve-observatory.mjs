#!/usr/bin/env node
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = join(process.cwd(), 'public');
const port = Number(process.env.SISO_OBSERVATORY_PORT || 8765);
const types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  if (rel.includes('..')) { res.writeHead(400); res.end('bad path'); return; }
  const path = join(root, rel);
  if (!existsSync(path)) { res.writeHead(404); res.end('not found'); return; }
  const body = readFileSync(path);
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
});
server.listen(port, '127.0.0.1', () => console.log(`siso observatory listening on http://127.0.0.1:${port}`));
