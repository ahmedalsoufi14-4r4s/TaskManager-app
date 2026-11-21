// ─── TASK MANAGER AI ─────────────────────────────────
// A small proxy between the Task Manager app and the Claude API. It does
// three fixed jobs (POST /parse, /suggest and /plan, see routes.js) with
// their instructions kept here, and turns voice recordings into text
// through Workers AI (POST /transcribe, transcribe.js). It answers only the
// app's own origin, limits sizes and request rates, and checks every
// answer before passing it on.
// The API key is the ANTHROPIC_API_KEY secret, set in the Cloudflare
// dashboard. Logs hold token counts and error types, never text.

import Anthropic from '@anthropic-ai/sdk';
import { ROUTES } from './routes.js';
import { AUDIO_TYPES } from './transcribe.js';

export { Guard } from './guard.js';

const MODEL = 'claude-haiku-5-5';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== env.ALLOWED_ORIGIN) return json({ error: 'origin' }, 403, { Vary: 'Origin' });
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const route = ROUTES[url.pathname];
    if (!route) return json({ error: 'not_found' }, 404, cors);
    if (request.method !== 'POST') return json({ error: 'method' }, 405, { ...cors, Allow: 'POST, OPTIONS' });
    // JSON, or for /transcribe a recording in one of the audio types
    const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (route.audio ? !AUDIO_TYPES.includes(type) : type !== 'application/json') {
      return json({ error: 'content_type' }, 415, cors);
    }

    const body = await readBody(request, route.maxBytes);
    if (body === null) return json({ error: 'too_large' }, 413, cors);
    const checked = route.audio ? route.check(body, url.searchParams.get('lang')) : checkJson(route, body);
    if (checked.error) return json({ error: checked.error }, checked.error === 'too_large' ? 413 : 400, cors);

    if (route.audio ? !env.AI : !env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503, cors);

    // Counted only now, so rejected requests never use up the limits
    const guard = env.GUARD.get(env.GUARD.idFromName('global'));
    // A missing or mistyped limit falls back to the default, never to none.
    // Recordings have their own daily cap, so voice never uses up Claude's.
    const pass = route.audio
      ? await guard.take(clientKey(request), Number(env.PER_MINUTE) || 20, Number(env.TRANSCRIBE_CAP) || 300, 'transcribe')
      : await guard.take(clientKey(request), Number(env.PER_MINUTE) || 20, Number(env.DAILY_CAP) || 300);
    if (!pass.ok) {
      return json({ error: pass.error, retryAfter: pass.retryAfter }, 429, { ...cors, 'Retry-After': String(pass.retryAfter) });
    }

    try {
      const answer = route.audio ? await route.run(env, checked.input) : await ask(env, route, checked.input);
      // Only /transcribe answers with an error of its own (too_long)
      if (answer.error) return json(answer, 413, cors);
      return json(answer, 200, cors);
    } catch (err) {
      const failure = describeFailure(err);
      // Workers AI errors say what was wrong with the audio, never what was said
      console.log(JSON.stringify({ route: route.name, error: failure.log, ...(route.audio && { detail: String(err?.message).slice(0, 160) }) }));
      return json({ error: failure.error }, failure.status, cors);
    }
  },
};

async function ask(env, route, input) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 20_000 });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: route.maxTokens,
    // Short, fixed-format answers at low effort; only /plan thinks
    thinking: { type: route.think ? 'adaptive' : 'disabled' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema: route.schema } },
    system: route.system,
    messages: [{ role: 'user', content: route.message(input) }],
  });
  console.log(JSON.stringify({
    route: route.name, in: response.usage.input_tokens, out: response.usage.output_tokens, stop: response.stop_reason,
  }));
  if (response.stop_reason !== 'end_turn') throw new AnswerError(response.stop_reason);
  const text = response.content.find(block => block.type === 'text')?.text;
  try {
    return route.clean(JSON.parse(text), input);
  } catch {
    throw new AnswerError('invalid');
  }
}

class AnswerError extends Error {}

// Status and error code for the app, and a short note for the log
function describeFailure(err) {
  if (err instanceof AnswerError) return { status: 502, error: 'bad_answer', log: `answer ${err.message}` };
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { status: 503, error: 'not_configured', log: `auth ${err.status}` };
  }
  if (err instanceof Anthropic.RateLimitError) return { status: 503, error: 'busy', log: 'rate 429' };
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { status: 504, error: 'timeout', log: 'timeout' };
  if (err instanceof Anthropic.APIError) {
    return { status: err.status === 529 ? 503 : 502, error: err.status === 529 ? 'busy' : 'upstream', log: `api ${err.status}` };
  }
  return { status: 502, error: 'upstream', log: err && err.name };
}

function checkJson(route, bytes) {
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { error: 'bad_request' };
  }
  return route.check(data);
}

// Reads at most limit bytes, or null if the body is bigger
async function readBody(request, limit) {
  if (Number(request.headers.get('Content-Length')) > limit) return null;
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return bytes;
}

// IPv4 as is; IPv6 by its /64, which one person usually holds whole
function clientKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return groups.slice(0, 4).join(':');
}

function json(data, status, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}
