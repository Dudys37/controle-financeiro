// ═══════════════════════════════════════════════════
//  Controle D-1 / anti-repetição B3 (Fase 16)
//  - Guarda APENAS metadados de sincronização por (uidHash, type, referenceDate).
//  - NUNCA guarda payload da B3, token, CPF ou secrets.
//  - Armazenamento: KV (B3_RATE_LIMIT_KV) se presente; senão memória do isolate.
//  Regra: no fluxo real, não consultar o mesmo investidor mais de 1×/dia (D-1).
// ═══════════════════════════════════════════════════

const syncMem = new Map();

export function b3SyncKey({ uidHash, type, referenceDate }) {
  return `b3sync:${type}:${uidHash || 'anon'}:${referenceDate}`;
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (_) {
    return null;
  }
}

export async function getLastB3Sync({ env, uidHash, type, referenceDate }) {
  const key = b3SyncKey({ uidHash, type, referenceDate });
  const kv = env && env.B3_RATE_LIMIT_KV;
  if (kv) {
    const v = await kv.get(key);
    return v ? safeParse(v) : null;
  }
  return syncMem.get(key) || null;
}

export async function setLastB3Sync({ env, uidHash, type, referenceDate, status }) {
  const key = b3SyncKey({ uidHash, type, referenceDate });
  const prev = await getLastB3Sync({ env, uidHash, type, referenceDate });
  const meta = {
    uidHash: uidHash || null,
    type,
    referenceDate,
    status: status || 'stub',
    updatedAt: new Date().toISOString(),
    count: ((prev && prev.count) || 0) + 1,
  };
  const kv = env && env.B3_RATE_LIMIT_KV;
  if (kv) {
    await kv.put(key, JSON.stringify(meta), { expirationTtl: 2 * 24 * 3600 }); // TTL 48h
  } else {
    syncMem.set(key, meta);
  }
  return meta;
}

// true = pode sincronizar (ainda não houve sync para este referenceDate).
export async function shouldAllowB3Sync({ env, uidHash, type, referenceDate }) {
  const last = await getLastB3Sync({ env, uidHash, type, referenceDate });
  return !last;
}
