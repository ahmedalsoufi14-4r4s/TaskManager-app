// ─── GUARD ───────────────────────────────────────────
// One Durable Object counts every request before it reaches Claude: a
// per-IP limit per minute (kept in memory, so it resets if the object is
// evicted) and a daily cap for everyone together (kept in storage, reset
// at midnight UTC), counted apart for Claude and for /transcribe. Only requests that passed every other check get here.

import { DurableObject } from 'cloudflare:workers';

const MINUTE = 60_000;

export class Guard extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // IP -> times of its requests in the last minute
    this.recent = new Map();
  }

  // counter is the storage key of the daily count: usage (Claude) or transcribe
  async take(ip, perMinute, dailyCap, counter = 'usage') {
    const now = Date.now();
    const times = (this.recent.get(ip) || []).filter(time => now - time < MINUTE);
    if (times.length >= perMinute) {
      this.recent.set(ip, times);
      return { ok: false, error: 'rate_limited', retryAfter: Math.ceil((times[0] + MINUTE - now) / 1000) };
    }

    const day = new Date(now).toISOString().slice(0, 10);
    const usage = (await this.ctx.storage.get(counter)) || { day, count: 0 };
    const count = usage.day === day ? usage.count : 0;
    if (count >= dailyCap) {
      const midnight = Date.parse(`${day}T00:00:00Z`) + 24 * 60 * MINUTE;
      return { ok: false, error: 'daily_limit', retryAfter: Math.ceil((midnight - now) / 1000) };
    }
    await this.ctx.storage.put(counter, { day, count: count + 1 });

    times.push(now);
    this.recent.set(ip, times);
    // Forget IPs that have been quiet for a minute
    if (this.recent.size > 500) {
      for (const [key, list] of this.recent) {
        if (now - list[list.length - 1] >= MINUTE) this.recent.delete(key);
      }
    }
    return { ok: true };
  }
}
