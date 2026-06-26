// ═══════════════════════════════════════════════════
//  Rate limit do Worker B3 (Fase 16)
//  - Janela fixa por (endpoint, uidHash). Limites configuráveis por env.
//  - Armazenamento: Cloudflare KV (binding B3_RATE_LIMIT_KV) se presente;
//    senão, fallback em memória do isolate (bom p/ dev/smoke, não p/ produção).
//  - check() não muta; record() incrementa. /health não é limitado.
// ═══════════════════════════════════════════════════

const memStore = new Map(); // key → { count, resetAt }

function intOr(v, d) {
  const x = parseInt(v, 10);
  return Number.isFinite(x) && x > 0 ? x : d;
}

export function rateLimitEnabled(env) {
  return !env || env.B3_RATE_LIMIT_ENABLED !== 'false'; // default: habilitado
}

// Config por endpoint: limite + janela (ms).
export function limitsFor(env) {
  const e = env || {};
  const DAY = 24 * 60 * 60 * 1000;
  const syncDaily = intOr(e.B3_RATE_LIMIT_SYNC_DAILY, 3);
  return {
    '/b3/status': { limit: intOr(e.B3_RATE_LIMIT_STATUS_5M, 30), windowMs: 5 * 60 * 1000 },
    '/b3/sync-guide': { limit: intOr(e.B3_RATE_LIMIT_GUIDE_DAILY, 5), windowMs: DAY },
    '/b3/sync-positions': { limit: syncDaily, windowMs: DAY },
    '/b3/sync-movements': { limit: syncDaily, windowMs: DAY },
    '/b3/revoke-local': { limit: intOr(e.B3_RATE_LIMIT_REVOKE_DAILY, 10), windowMs: DAY },
  };
}

function bucketInfo(cfg, now) {
  const t = now || Date.now();
  const bucket = Math.floor(t / cfg.windowMs);
  const resetAt = (bucket + 1) * cfg.windowMs;
  return { bucket, resetAt, t };
}

async function readCount(env, key) {
  const kv = env && env.B3_RATE_LIMIT_KV;
  if (kv) {
    const v = await kv.get(key);
    return v ? parseInt(v, 10) || 0 : 0;
  }
  const e = memStore.get(key);
  if (!e || Date.now() >= e.resetAt) {
    memStore.delete(key);
    return 0;
  }
  return e.count;
}

async function writeCount(env, key, resetAt) {
  const kv = env && env.B3_RATE_LIMIT_KV;
  if (kv) {
    const cur = await kv.get(key);
    const next = (cur ? parseInt(cur, 10) || 0 : 0) + 1;
    const ttlSec = Math.max(60, Math.ceil((resetAt - Date.now()) / 1000));
    await kv.put(key, String(next), { expirationTtl: ttlSec });
    return next;
  }
  const e = memStore.get(key);
  if (!e || Date.now() >= e.resetAt) {
    memStore.set(key, { count: 1, resetAt });
    return 1;
  }
  e.count += 1;
  return e.count;
}

function keyFor(endpoint, uidHash, bucket) {
  return `rl:${endpoint}:${uidHash || 'anon'}:${bucket}`;
}

export const RateLimiter = {
  // Retorna { allowed, limit, remaining, resetAt, retryAfterSec, skipped }
  async check({ env, uidHash, endpoint, now }) {
    if (!rateLimitEnabled(env)) return { allowed: true, skipped: true, limit: 0, remaining: 0, resetAt: 0, retryAfterSec: 0 };
    const cfg = limitsFor(env)[endpoint];
    if (!cfg) return { allowed: true, skipped: true, limit: 0, remaining: 0, resetAt: 0, retryAfterSec: 0 };
    const { bucket, resetAt, t } = bucketInfo(cfg, now);
    const count = await readCount(env, keyFor(endpoint, uidHash, bucket));
    const allowed = count < cfg.limit;
    const remaining = Math.max(0, cfg.limit - count - (allowed ? 1 : 0));
    return {
      allowed, limit: cfg.limit, remaining, resetAt,
      retryAfterSec: Math.max(1, Math.ceil((resetAt - t) / 1000)),
    };
  },
  async record({ env, uidHash, endpoint, now }) {
    if (!rateLimitEnabled(env)) return;
    const cfg = limitsFor(env)[endpoint];
    if (!cfg) return;
    const { bucket, resetAt } = bucketInfo(cfg, now);
    await writeCount(env, keyFor(endpoint, uidHash, bucket), resetAt);
  },
};

// Headers padronizados de rate limit.
export function rateLimitHeaders(rl) {
  if (!rl || rl.skipped) return {};
  const h = {
    'X-RateLimit-Limit': String(rl.limit),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.floor((rl.resetAt || 0) / 1000)),
  };
  if (!rl.allowed) h['Retry-After'] = String(rl.retryAfterSec);
  return h;
}
