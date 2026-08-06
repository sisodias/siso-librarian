#!/usr/bin/env node
// A browsable, searchable page for the Internet Archive corpus.
//
// WHY. The corpus became searchable on 2026-08-04 and reachable only through a
// CLI on this machine. The observatory — the page Shaan actually opens over the
// tailnet — carried ZERO search exposure. That is the fourth instance in two
// days of building something and leaving it unreachable: outbox messages,
// corpus counts, the indexes themselves, now search.
//
// WHY CLIENT-SIDE. public/ is served by a static file server (python
// http.server under launchd). There is no backend to query, and adding one
// means a process to keep alive, a port, and a failure mode. A pre-computed
// index shipped with the page has none of that and works offline.
//
// WHAT IS SHIPPED. Book titles, and the headings under which passages sit —
// NOT the 9.8M words of body text. Headings are the table of contents of a
// scanned book: enough to find what a volume covers and which identifier to
// hand to `npm run library:search` for the full text.
//
//   build-library-page.mjs        write public/library.html
import { writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { corpusDb } from './lib/vault-paths.mjs';

const root = process.cwd();
const DB = corpusDb();
const OUT = join(root, 'public/library.html');

if (!existsSync(DB)) {
  console.error(`index not available (vault mounted?): ${DB}`);
  process.exit(70);
}
// BUSY TIMEOUT. Measured 2026-08-06: no script in this pipeline waited for a
// lock, so any concurrent reader could end a long build with "database is
// locked (5)" — it killed a 45-minute modern-index build after 1.39M of 4.13M
// rows. Writers wait; the corpus stays readable while it rebuilds.
const sq = (sql) => execFileSync('sqlite3', ['-cmd', '.timeout 60000', `file:${DB}?mode=ro`], { input: sql, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim();

// json_group_array so sqlite escapes its own output — passage headings contain
// quotes and newlines, and a delimited format shreds them.
const books = JSON.parse(sq(`select json_group_array(json_object(
  'id', ext_id, 'title', title, 'passages', passages, 'chars', chars)) from book_ext;`) || '[]');

// Headings worth listing: substantive ones, deduplicated, with the passage
// count they cover. Sub-8-char headings were measured as 19.6% noise (page
// numbers, "BEE", stray capitals) so they are excluded from the browse index —
// they remain fully searchable in the database itself.
const headings = JSON.parse(sq(`select json_group_array(json_array(ext_id, heading, n)) from (
  select ext_id, heading, count(*) n from passage_ext
  where heading is not null and length(replace(heading,'  ',' ')) >= 8
  group by ext_id, heading order by ext_id, n desc);`) || '[]');

const words = sq("select coalesce((select v from corpus_stats where k='words'),0);");
const passages = sq("select coalesce((select v from corpus_stats where k='passages'),0);");
// Read the stored count. A filtered count(*) on an FTS5 table must scan it —
// measured 2026-08-05, it did not return in five minutes at ~1M rows.
// add-longs-variants records the number it already computed.
const longS = sq("select coalesce((select v from modern_stats where k='changed'),0);");

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The index the browser searches. Kept deliberately small: ids are indexes into
// the books array, not repeated strings.
const bookIndex = new Map(books.map((b, i) => [b.id, i]));
const compact = headings.map(([id, h, n]) => [bookIndex.get(id) ?? -1, h, n]).filter((r) => r[0] >= 0);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Library — Internet Archive corpus</title>
<style>
 body{font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:2rem 1.5rem;max-width:60rem;color:#1a1a1a}
 h1{font-size:1.5rem;margin:0 0 .25rem} .sub{color:#666;margin:0 0 1.5rem}
 input{width:100%;font-size:1rem;padding:.6rem .75rem;border:1px solid #ccc;border-radius:6px;margin-bottom:.5rem}
 .hint{color:#888;font-size:.85rem;margin-bottom:1.5rem}
 .bk{border-top:1px solid #eee;padding:.85rem 0}
 .bt{font-weight:600} .bm{color:#777;font-size:.85rem}
 .hd{color:#444;font-size:.9rem;margin:.3rem 0 0 1rem}
 .hd span{color:#999}
 mark{background:#ffe680;padding:0 1px}
 .none{color:#888;padding:2rem 0}
 code{background:#f4f4f4;padding:.1rem .3rem;border-radius:3px;font-size:.85em}
</style></head><body>
<p style="margin:0 0 .75rem"><a href="/">&larr; Observatory</a></p>
<h1>The Library — Internet Archive corpus</h1>
<p class="sub">${Number(books.length).toLocaleString()} books &middot; ${Number(passages).toLocaleString()} passages &middot; ${Number(words).toLocaleString()} words &middot; ${Number(longS).toLocaleString()} passages in long-s spelling</p>
<input id="q" placeholder="Search titles and chapter headings…" autocomplete="off" autofocus>
<p class="hint">This searches <strong>titles and headings</strong> — the table of contents. For full text across all ${Number(words).toLocaleString()} words, including 18th-century long-s spellings, run <code>npm run library:search "your terms"</code> on the Mac mini.</p>
<div id="out"></div>
<script>
const BOOKS=${JSON.stringify(books.map((b) => [b.title, b.passages, b.id]))};
const HEADS=${JSON.stringify(compact)};
const out=document.getElementById('out'), q=document.getElementById('q');
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function mark(s,t){if(!t)return esc(s);const i=s.toLowerCase().indexOf(t);if(i<0)return esc(s);
  return esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+t.length))+'</mark>'+esc(s.slice(i+t.length));}
function render(){
  const t=q.value.trim().toLowerCase();
  const hitsFor={};
  if(t) HEADS.forEach(([bi,h,n])=>{if(h.toLowerCase().includes(t)){(hitsFor[bi]=hitsFor[bi]||[]).push([h,n]);}});
  const rows=BOOKS.map((b,i)=>[b,i]).filter(([b,i])=>!t||b[0].toLowerCase().includes(t)||hitsFor[i]);
  if(!rows.length){out.innerHTML='<p class="none">No book title or heading matches '+esc(q.value)+'.</p>';return;}
  out.innerHTML=rows.map(([b,i])=>{
    const hs=(hitsFor[i]||[]).slice(0,6).map(([h,n])=>
      '<div class="hd">'+mark(h.replace(/\\s+/g,' ').trim(),t)+' <span>('+n+' passages)</span></div>').join('');
    const more=(hitsFor[i]||[]).length>6?'<div class="hd"><span>… and '+((hitsFor[i]||[]).length-6)+' more headings</span></div>':'';
    return '<div class="bk"><div class="bt">'+mark(b[0],t)+'</div>'+
           '<div class="bm">'+b[2]+' &middot; '+b[1].toLocaleString()+' passages</div>'+hs+more+'</div>';
  }).join('')+'<p class="bm" style="margin-top:1.5rem">'+rows.length+' of '+BOOKS.length+' books</p>';
}
q.addEventListener('input',render); render();
</script></body></html>`;

writeFileSync(OUT, html);
console.error(`wrote ${OUT}`);
console.error(`  ${books.length} books, ${compact.length.toLocaleString()} headings, ${(html.length / 1024).toFixed(0)} KB`);
