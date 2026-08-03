#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const endpoint = process.env.MM_BULK_ENDPOINT || 'http://127.0.0.1:8789/v1/chat/completions';
const model = process.env.MM_BULK_MODEL || 'MiniMax-M3';
const concurrency = Number(process.env.MM_BULK_CONCURRENCY || 8);
const maxTokens = Number(process.env.MM_BULK_MAX_TOKENS || 900);
const gateKey = process.env.MM_BULK_API_KEY || readGateKey();

function readGateKey() {
  const cfg = readFileSync(`${process.env.HOME}/.config/go-llm-proxy/minimax-codex.yaml`, 'utf8');
  const match = cfg.match(/keys:\s*\n\s*-\s*key:\s*["']?([^"'\s]+)/);
  if (!match) throw new Error('No go-llm-proxy gate key found');
  return match[1];
}

function parseJobs() {
  const input = readFileSync(0, 'utf8').trim();
  if (!input) return [];
  return input.split('\n').filter(Boolean).map((line, index) => ({ index, ...JSON.parse(line) }));
}

async function runJob(job) {
  const started = Date.now();
  const content = String(job.prompt || '');
  if (!content || content.length > Number(process.env.MM_BULK_MAX_PROMPT_CHARS || 24000)) {
    return { id: job.id || `job-${job.index}`, ok: false, error: 'missing_or_oversized_prompt', duration_ms: Date.now() - started };
  }
  const body = {
    model,
    max_tokens: job.max_tokens || maxTokens,
    messages: [
      {
        role: 'user',
        content,
        cache_control: job.cache_control === false ? undefined : { type: 'ephemeral' }
      }
    ]
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${gateKey}` },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  const usage = json.usage || {};
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
  const output = json.choices?.[0]?.message?.content || '';
  const ok = res.ok && json.model === model;
  return {
    id: job.id || `job-${job.index}`,
    ok,
    http_status: res.status,
    model: json.model,
    duration_ms: Date.now() - started,
    prompt_tokens: usage.prompt_tokens || 0,
    completion_tokens: usage.completion_tokens || 0,
    total_tokens: usage.total_tokens || 0,
    cached_tokens: cachedTokens,
    finish_reason: json.choices?.[0]?.finish_reason || null,
    output: output.slice(0, Number(process.env.MM_BULK_OUTPUT_CHARS || 3000)),
    error: ok ? null : (json.error || json.raw || 'unexpected_model_or_status')
  };
}

async function main() {
  const jobs = parseJobs();
  const results = new Array(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next++;
      results[i] = await runJob(jobs[i]);
      console.log(JSON.stringify(results[i]));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, () => worker()));
  const summary = results.reduce((acc, r) => {
    acc.jobs += 1;
    acc.ok += r.ok ? 1 : 0;
    acc.prompt_tokens += r.prompt_tokens || 0;
    acc.completion_tokens += r.completion_tokens || 0;
    acc.cached_tokens += r.cached_tokens || 0;
    return acc;
  }, { jobs: 0, ok: 0, prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0 });
  console.error(JSON.stringify({ summary }));
  if (summary.ok !== summary.jobs) process.exit(1);
}

main().catch((error) => { console.error(JSON.stringify({ fatal: error.message })); process.exit(1); });
