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
import { shouldAllowB3Sync, setLastB3Sync } from './b3Sync.js';
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

// ── Contratos preparados (sem chamada real nesta fase) ──
// API Guia primeiro (racionaliza chamadas; D-1). Position/Movement só p/ documentos atualizados.
// Guarda anti-repetição: registra metadados por (uidHash, type, referenceDate) e sinaliza
// quando já houve sincronização para a mesma data de referência (D-1).
async function syncWithGuard(type, action, { auth, env }) {
  const base = b3StubResponse(action, auth, env);
  try {
    if (auth && auth.uid && base.mode !== 'unsupported_env') {
      const referenceDate = base.referenceDate || b3ReferenceDate(new Date());
      const uidHash = await hashUid(auth.uid, env);
      const allow = await shouldAllowB3Sync({ env, uidHash, type, referenceDate });
      base.alreadySyncedToday = !allow;
      if (!allow) {
        base.note =
          'Já há sincronização registrada para este referenceDate (D-1); no fluxo real, não repetir no mesmo dia.';
      }
      await setLastB3Sync({ env, uidHash, type, referenceDate, status: base.mode });
    }
  } catch (_) {
    /* governança não pode quebrar a resposta */
  }
  return base;
}

export async function syncGuide({ auth, env }) {
  return syncWithGuard('guide', 'sync-guide', { auth, env });
}
export async function syncPositions({ auth, env, guideResult }) {
  // Regra futura: não buscar Position sem a API Guia indicar atualização.
  return syncWithGuard('positions', 'sync-positions', { auth, env });
}
export async function syncMovements({ auth, env, guideResult }) {
  return syncWithGuard('movements', 'sync-movements', { auth, env });
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
