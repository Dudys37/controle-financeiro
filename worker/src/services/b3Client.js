// ═══════════════════════════════════════════════════
//  Cliente B3 (Fase 15) — preparação para CERTIFICAÇÃO.
//  - NENHUMA chamada real à B3 nesta fase (B3_ENABLE_REAL_CALLS default = false).
//  - Lê configuração de forma segura (NUNCA expõe valores de secrets).
//  - Respostas padronizadas; helpers D-1 / API Guia preparados.
//  Fluxo real futuro: Pacote de Acesso → API Guia (Produtos Atualizados, D-1)
//  → Position/Movement só para documentos atualizados; respeitar D-1 e
//  não consultar o mesmo investidor mais de 1×/dia.
// ═══════════════════════════════════════════════════

const nowISO = () => new Date().toISOString();
import {
  getLastB3Sync, setLastB3Sync, getB3SyncCache, setB3SyncCache, resolveRepeatSync,
} from './b3Sync.js';
import { hashUid } from '../utils/security.js';

// ── Configuração (sem expor valores de secrets) ──
export function getB3Config(env) {
  const e = env || {};
  return {
    envName: e.B3_ENV || 'local',
    baseUrl: e.B3_BASE_URL || '',
    hasClientId: !!e.B3_CLIENT_ID,
    hasClientSecret: !!e.B3_CLIENT_SECRET,
    hasCert: !!e.B3_CERT,
    hasKey: !!e.B3_KEY,
    accessPackageId: e.B3_ACCESS_PACKAGE_ID || '',
    timeoutMs: parseInt(e.B3_TIMEOUT_MS || '10000', 10) || 10000,
    realCalls: e.B3_ENABLE_REAL_CALLS === 'true',
  };
}

// Valida o ambiente e a completude da configuração de certificação.
// Retorna { ok, mode, error?, missingCount? } — NUNCA lista nomes de secrets no corpo.
export function assertB3CertificationConfig(env) {
  const c = getB3Config(env);
  if (c.envName === 'production') {
    return { ok: false, mode: 'unsupported_env', error: 'Ambiente de produção não é suportado nesta fase.' };
  }
  if (c.envName !== 'local' && c.envName !== 'certification') {
    return { ok: false, mode: 'unsupported_env', error: 'B3_ENV inválido (use "local" ou "certification").' };
  }
  const required = [c.baseUrl, c.hasClientId, c.hasClientSecret, c.hasCert, c.hasKey, c.accessPackageId];
  const missingCount = required.filter((v) => !v).length;
  if (missingCount > 0) {
    return { ok: false, mode: 'certification_config_missing', error: 'Configuração de certificação B3 ausente ou incompleta.', missingCount };
  }
  return { ok: true, mode: 'ready', config: c };
}

export function b3Error(message, mode) {
  return {
    ok: false, provider: 'b3', mode: mode || 'error', source: 'Cloudflare Worker',
    updatedAt: nowISO(), referenceDate: null, data: null, error: String(message || 'erro'),
  };
}

// ── Helpers D-1 / disponibilidade / racionalização de chamadas ──
// OBS: getHours()/getDate() usam o fuso do runtime (UTC no Worker). Na implementação
// real, considerar America/Sao_Paulo. Aqui é apenas lógica conceitual preparada.
export function b3ReferenceDate(now) {
  const d = new Date(now || Date.now());
  d.setDate(d.getDate() - 1); // D-1
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
export function isB3DataAvailable(now) {
  const d = new Date(now || Date.now());
  return d.getHours() >= 8; // dados D-1 disponíveis a partir das 8h
}
export function shouldSyncB3(lastSync, referenceDate) {
  if (!lastSync) return true;
  const last = String(lastSync).slice(0, 10);
  return last < referenceDate; // evita repetir no mesmo dia de referência
}

// Resposta padronizada conforme estado de config/auth. NÃO faz chamada real.
export function b3StubResponse(action, auth, env) {
  const a = assertB3CertificationConfig(env);
  const base = {
    ok: false, provider: 'b3', source: 'Cloudflare Worker',
    updatedAt: nowISO(), referenceDate: b3ReferenceDate(new Date()), data: null,
    action: action || null,
  };
  if (auth && auth.uid) base.requestedBy = String(auth.uid).slice(0, 8) + '…';

  if (a.mode === 'unsupported_env') {
    return { ...base, mode: 'unsupported_env', referenceDate: null, error: a.error };
  }
  if (a.mode === 'certification_config_missing') {
    return { ...base, mode: 'certification_config_missing',
      error: 'Worker B3 autenticado, mas credenciais de certificação ainda não configuradas.' };
  }
  // Config completa, mas chamadas reais desativadas por padrão (B3_ENABLE_REAL_CALLS=false).
  const cfg = getB3Config(env);
  if (!cfg.realCalls) {
    return { ...base, mode: 'certification_stub',
      error: 'Worker B3 autenticado e configurado; chamadas reais desativadas (B3_ENABLE_REAL_CALLS=false).' };
  }
  // Flag ligada, mas a integração real de certificação ainda NÃO é implementada nesta fase.
  return { ...base, mode: 'certification_stub',
    error: 'Worker B3 autenticado; integração real de certificação ainda não implementada nesta fase.' };
}

// ── Respostas dos novos modos (Fase 17) ──
function withCommon(obj, auth) {
  obj.provider = 'b3';
  obj.source = 'Cloudflare Worker';
  obj.updatedAt = nowISO();
  if (auth && auth.uid) obj.requestedBy = String(auth.uid).slice(0, 8) + '\u2026';
  return obj;
}
function tag(obj, action) { obj.action = action; return obj; }
function alreadySynced(referenceDate, auth) {
  return withCommon({ ok: false, mode: 'already_synced', referenceDate, data: null,
    error: 'Sincronização já realizada para esta data de referência. Use o cache ou aguarde o próximo D-1.' }, auth);
}
function cacheHit(referenceDate, auth, summary) {
  return withCommon({ ok: true, mode: 'cache_hit', referenceDate,
    data: { cached: true, summary: summary || {} }, error: null }, auth);
}
function guideRequired(referenceDate, auth) {
  return withCommon({ ok: false, mode: 'guide_required', referenceDate, data: null,
    error: 'API Guia deve ser consultada antes de Position/Movement.' }, auth);
}
function realClientNotImplemented(referenceDate, auth) {
  return withCommon({ ok: false, mode: 'real_client_not_implemented', referenceDate, data: null,
    error: 'Cliente real B3 ainda não implementado; chamadas reais não disponíveis nesta fase.' }, auth);
}

// ── Contratos preparados (sem chamada real nesta fase) ──
// Fluxo: API Guia primeiro → Position/Movement só se houver Guia para o D-1.
// Anti-repetição rígido por estratégia (block | cache | allow_stub_only).
async function runSync(type, action, { auth, env }) {
  const base = b3StubResponse(action, auth, env);
  if (base.mode === 'unsupported_env') return base; // production/env inválido: não cacheia
  const cfg = getB3Config(env);
  const envName = cfg.envName;
  const realCalls = cfg.realCalls;
  const referenceDate = base.referenceDate || b3ReferenceDate(new Date());
  base.referenceDate = referenceDate;
  let uidHash = null;
  try { uidHash = await hashUid(auth && auth.uid, env); } catch (_) { /* noop */ }

  // 1) Position/Movement exigem Guia para o mesmo referenceDate.
  if (type === 'positions' || type === 'movements') {
    const gMeta = await getLastB3Sync({ env, envName, uidHash, type: 'guide', referenceDate });
    const gCache = await getB3SyncCache({ env, envName, uidHash, type: 'guide', referenceDate });
    if (!gMeta && !gCache) return tag(guideRequired(referenceDate, auth), action);
  }

  // 2) Repetição no mesmo D-1.
  const prior = await getLastB3Sync({ env, envName, uidHash, type, referenceDate });
  if (prior) {
    const dec = await resolveRepeatSync({ env, envName, uidHash, type, referenceDate });
    if (dec.action === 'block' || dec.action === 'real_repeat_block') {
      return tag(alreadySynced(referenceDate, auth), action);
    }
    if (dec.action === 'cache') {
      const cache = await getB3SyncCache({ env, envName, uidHash, type, referenceDate });
      if (cache) return tag(cacheHit(referenceDate, auth, cache.summary), action);
      return tag(alreadySynced(referenceDate, auth), action); // sem cache → bloqueio seguro
    }
    // allow_stub (somente quando real calls desativadas)
    base.alreadySyncedToday = true;
    base.note = 'Repetição permitida apenas em modo stub (allow_stub_only).';
    await setLastB3Sync({ env, envName, uidHash, type, referenceDate, meta: { status: 'stub', mode: base.mode } });
    await setB3SyncCache({ env, envName, uidHash, type, referenceDate, cache: { status: 'stub', mode: base.mode, summary: { count: 0, productsUpdated: 0 } } });
    return base;
  }

  // 3) Primeira vez para este D-1.
  if (realCalls) {
    // Gate: real calls ligadas, mas o cliente real ainda não existe nesta fase.
    await setLastB3Sync({ env, envName, uidHash, type, referenceDate, meta: { status: 'error', mode: 'real_client_not_implemented' } });
    return tag(realClientNotImplemented(referenceDate, auth), action);
  }
  base.alreadySyncedToday = false;
  await setLastB3Sync({ env, envName, uidHash, type, referenceDate, meta: { status: 'stub', mode: base.mode } });
  await setB3SyncCache({ env, envName, uidHash, type, referenceDate, cache: { status: 'stub', mode: base.mode, summary: { count: 0, productsUpdated: 0 } } });
  return base;
}

export async function syncGuide({ auth, env }) {
  return runSync('guide', 'sync-guide', { auth, env });
}
export async function syncPositions({ auth, env, guideResult }) {
  return runSync('positions', 'sync-positions', { auth, env });
}
export async function syncMovements({ auth, env, guideResult }) {
  return runSync('movements', 'sync-movements', { auth, env });
}

// Interface usada pelas rotas (routes/b3.js).
export const b3Client = {
  async status({ env, auth }) {
    return b3StubResponse('status', auth, env);
  },
  async syncGuide({ env, auth }) {
    return syncGuide({ auth, env });
  },
  async syncPositions({ env, auth, guideResult }) {
    return syncPositions({ auth, env, guideResult });
  },
  async syncMovements({ env, auth, guideResult }) {
    return syncMovements({ auth, env, guideResult });
  },
  async revokeLocal({ env, auth }) {
    const r = b3StubResponse('revoke-local', auth, env);
    r.note = 'A revogação real ocorre na Área Logada da B3 (não pela tela do contratante).';
    return r;
  },
};
