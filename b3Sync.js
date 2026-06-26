// ═══════════════════════════════════════════════════
//  Controle D-1 / anti-repetição + cache (Fase 17)
//  - Metadados de sync e cache por (envName, uidHash, type, referenceDate).
//  - Cache guarda APENAS resumo numérico (count/productsUpdated); NUNCA payload
//    da B3, token, CPF, Authorization ou secrets.
//  - Store: Cloudflare KV (binding B3_SYNC_CACHE_KV) se presente; senão memória
//    do isolate (não confiável p/ produção/certificação persistente — documentado).
// ═══════════════════════════════════════════════════

const metaMem = new Map();   // key → meta
const cacheMem = new Map();  // key → { value, expiresAt }

function cacheKvOf(env) {
  return (env && env.B3_SYNC_CACHE_KV) || null;
}
function safeParse(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}
function ttlSeconds(env) {
  const x = parseInt((env && env.B3_SYNC_CACHE_TTL_SECONDS) || '172800', 10); // 48h
  return Number.isFinite(x) && x > 0 ? x : 172800;
}
// Só permite resumo numérico — barreira contra vazamento de payload no cache.
function sanitizeSummary(s) {
  const out = { count: 0, productsUpdated: 0 };
  if (s && typeof s === 'object') {
    if (Number.isFinite(s.count)) out.count = s.count;
    if (Number.isFinite(s.productsUpdated)) out.productsUpdated = s.productsUpdated;
  }
  return out;
}

export function b3SyncKey({ envName, uidHash, type, referenceDate }) {
  return `b3sync:${envName || 'local'}:${type}:${uidHash || 'anon'}:${referenceDate}`;
}
export function b3CacheKey({ envName, uidHash, type, referenceDate }) {
  return `b3cache:${envName || 'local'}:${type}:${uidHash || 'anon'}:${referenceDate}`;
}

// ── Metadados de sincronização ──
export async function getLastB3Sync({ env, envName, uidHash, type, referenceDate }) {
  const key = b3SyncKey({ envName, uidHash, type, referenceDate });
  const kv = cacheKvOf(env);
  if (kv) { const v = await kv.get(key); return v ? safeParse(v) : null; }
  return metaMem.get(key) || null;
}
export async function setLastB3Sync({ env, envName, uidHash, type, referenceDate, meta }) {
  const key = b3SyncKey({ envName, uidHash, type, referenceDate });
  const prev = await getLastB3Sync({ env, envName, uidHash, type, referenceDate });
  const m = {
    uidHash: uidHash || null,
    type,
    referenceDate,
    status: (meta && meta.status) || 'stub',
    mode: (meta && meta.mode) || null,
    updatedAt: new Date().toISOString(),
    count: ((prev && prev.count) || 0) + 1,
  };
  const kv = cacheKvOf(env);
  if (kv) await kv.put(key, JSON.stringify(m), { expirationTtl: 2 * 24 * 3600 });
  else metaMem.set(key, m);
  return m;
}

// ── Cache D-1 (resumo apenas) ──
export async function getB3SyncCache({ env, envName, uidHash, type, referenceDate }) {
  const key = b3CacheKey({ envName, uidHash, type, referenceDate });
  const kv = cacheKvOf(env);
  if (kv) { const v = await kv.get(key); return v ? safeParse(v) : null; }
  const e = cacheMem.get(key);
  if (!e || Date.now() >= e.expiresAt) { cacheMem.delete(key); return null; }
  return e.value;
}
export async function setB3SyncCache({ env, envName, uidHash, type, referenceDate, cache }) {
  const key = b3CacheKey({ envName, uidHash, type, referenceDate });
  const ttl = ttlSeconds(env);
  const value = {
    uidHash: uidHash || null,
    type,
    referenceDate,
    status: (cache && cache.status) || 'stub',
    mode: (cache && cache.mode) || null,
    updatedAt: new Date().toISOString(),
    summary: sanitizeSummary(cache && cache.summary),
    ttlSeconds: ttl,
  };
  const kv = cacheKvOf(env);
  if (kv) await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  else cacheMem.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  return value;
}

// true = ainda não sincronizou para este referenceDate.
export async function shouldAllowB3Sync({ env, envName, uidHash, type, referenceDate }) {
  const last = await getLastB3Sync({ env, envName, uidHash, type, referenceDate });
  return !last;
}

// Decide o que fazer numa repetição, conforme estratégia + gate de chamadas reais.
// Retorna { action: 'block' | 'cache' | 'allow_stub' | 'real_repeat_block' }
export async function resolveRepeatSync({ env, envName, uidHash, type, referenceDate, currentResult }) {
  const strategy = (env && env.B3_REPEAT_SYNC_STRATEGY) || 'cache';
  const realCalls = !!(env && env.B3_ENABLE_REAL_CALLS === 'true');
  if (strategy === 'block') return { action: 'block' };
  if (strategy === 'allow_stub_only') {
    return realCalls ? { action: 'real_repeat_block' } : { action: 'allow_stub' };
  }
  return { action: 'cache' }; // default seguro
}
