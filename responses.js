// ═══════════════════════════════════════════════════
//  Respostas padronizadas do Worker B3 (Fase 14)
//  Nenhuma resposta expõe dados reais da B3 nesta fase.
// ═══════════════════════════════════════════════════
const ISO = () => new Date().toISOString();

export function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

// /health — público, sem dados sensíveis.
export function healthBody(env) {
  return {
    ok: true,
    service: 'financaspro-b3-worker',
    env: (env && env.B3_ENV) || 'local',
    updatedAt: ISO(),
  };
}

// Stub padrão dos endpoints B3 — integração real ainda depende de configuração.
export function b3CertStub(extra = {}) {
  return {
    ok: false,
    provider: 'b3',
    mode: 'certification_stub',
    source: 'Cloudflare Worker',
    updatedAt: ISO(),
    referenceDate: null,
    data: null,
    error: 'Worker B3 criado, mas credenciais de certificação ainda não configuradas.',
    ...extra,
  };
}

export function errorBody(message, { provider = 'b3', mode = 'error' } = {}) {
  return {
    ok: false,
    provider,
    mode,
    source: 'Cloudflare Worker',
    updatedAt: ISO(),
    referenceDate: null,
    data: null,
    error: String(message || 'erro'),
  };
}
