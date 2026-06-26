// ═══════════════════════════════════════════════════
//  FinançasPRO — Cloudflare Worker B3 (Fase 16: governança)
//  Ambiente de certificação. SEM produção, SEM segredos no repo, SEM chamada real.
//
//  Pipeline /b3/*: CORS → gate de origem → (metrics admin) → método → auth →
//                  rate limit → rota (stub) → headers/log/métricas/auditoria.
// ═══════════════════════════════════════════════════
import { jsonResponse, healthBody, errorBody } from './utils/responses.js';
import { corsHeaders, handleOptions, safeLog, resolveOrigin, hashUid } from './utils/security.js';
import { verifyFirebaseToken } from './services/firebaseAuth.js';
import { isB3Path, matchB3Route, runB3Route } from './routes/b3.js';
import { RateLimiter, rateLimitHeaders } from './services/rateLimit.js';
import { recordMetric, auditEvent, getMetrics } from './services/audit.js';

function adminUids(env) {
  return String((env && env.B3_METRICS_ADMIN_UIDS) || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
}

export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();
    const cors = corsHeaders(request, env);
    const dur = () => Date.now() - start;

    // Preflight CORS
    if (method === 'OPTIONS') return handleOptions(request, env);

    // Health — público
    if (path === '/health' && method === 'GET') {
      safeLog({ endpoint: '/health', method, status: 200, durationMs: dur() });
      recordMetric({ endpoint: '/health', status: 200 });
      return jsonResponse(healthBody(env), { status: 200, headers: cors });
    }

    // Endpoints B3
    if (isB3Path(path)) {
      // Gate de origem: navegador com Origin fora da allowlist → 403 (não consome rate limit)
      const origin = request.headers.get('Origin');
      if (origin && !resolveOrigin(request, env)) {
        recordMetric({ endpoint: path, status: 403, rejected: 'cors' });
        auditEvent(env, { event: 'b3.cors_denied', endpoint: path, method, status: 403, errorCode: 'forbidden_origin' });
        safeLog({ endpoint: path, method, status: 403, error: 'forbidden_origin', durationMs: dur() });
        return jsonResponse(errorBody('Origem não permitida.', { mode: 'forbidden_origin' }), { status: 403, headers: cors });
      }

      // /b3/metrics — admin (token + allowlist). Desativado por padrão.
      if (path === '/b3/metrics' && method === 'GET') {
        if (!env || env.B3_METRICS_ENABLED !== 'true') {
          safeLog({ endpoint: path, method, status: 404, error: 'metrics_disabled', durationMs: dur() });
          return jsonResponse(errorBody('Não encontrado.', { mode: 'not_found' }), { status: 404, headers: cors });
        }
        const auth = await verifyFirebaseToken(request, env);
        if (!auth.ok) {
          recordMetric({ endpoint: path, status: auth.status, rejected: 'auth' });
          safeLog({ endpoint: path, method, status: auth.status, error: auth.reason, durationMs: dur() });
          return jsonResponse(errorBody(auth.reason === 'missing_token' ? 'Token ausente.' : 'Token inválido ou expirado.', { mode: 'unauthorized' }), { status: auth.status, headers: cors });
        }
        const admins = adminUids(env);
        if (!admins.length || !admins.includes(auth.uid)) {
          const uidHash = await hashUid(auth.uid, env);
          safeLog({ endpoint: path, method, status: 403, uidHash, error: 'not_admin', durationMs: dur() });
          return jsonResponse(errorBody('Acesso restrito.', { mode: 'forbidden' }), { status: 403, headers: cors });
        }
        const uidHash = await hashUid(auth.uid, env);
        safeLog({ endpoint: path, method, status: 200, uidHash, durationMs: dur() });
        return jsonResponse({ ok: true, provider: 'b3', mode: 'metrics', source: 'Cloudflare Worker', updatedAt: new Date().toISOString(), data: getMetrics() }, { status: 200, headers: cors });
      }

      if (!matchB3Route(method, path)) {
        safeLog({ endpoint: path, method, status: 405, durationMs: dur() });
        return jsonResponse(errorBody('Método ou rota B3 não permitidos.', { mode: 'method_not_allowed' }), { status: 405, headers: cors });
      }

      // Autenticação (antes do rate limit: sem token → 401, não 429)
      const auth = await verifyFirebaseToken(request, env);
      if (!auth.ok) {
        recordMetric({ endpoint: path, status: auth.status, rejected: 'auth' });
        auditEvent(env, { event: 'b3.auth_denied', endpoint: path, method, status: auth.status, errorCode: auth.reason });
        safeLog({ endpoint: path, method, status: auth.status, error: auth.reason, durationMs: dur() });
        const msg = auth.reason === 'missing_token' ? 'Token ausente.' : 'Token inválido ou expirado.';
        return jsonResponse(errorBody(msg, { mode: 'unauthorized' }), { status: auth.status, headers: cors });
      }

      const uidHash = await hashUid(auth.uid, env);

      // Rate limit por uid+endpoint
      const rl = await RateLimiter.check({ env, uidHash, endpoint: path, now: start });
      const rlHeaders = rateLimitHeaders(rl);
      if (!rl.allowed) {
        recordMetric({ endpoint: path, status: 429, rejected: 'rate' });
        auditEvent(env, { event: 'b3.rate_limited', uidHash, endpoint: path, method, status: 429, errorCode: 'rate_limited' });
        safeLog({ endpoint: path, method, status: 429, uidHash, mode: 'rate_limited', durationMs: dur() });
        return jsonResponse(
          { ok: false, provider: 'b3', mode: 'rate_limited', source: 'Cloudflare Worker', updatedAt: new Date().toISOString(), data: null, error: 'Limite de chamadas atingido. Tente novamente mais tarde.' },
          { status: 429, headers: { ...cors, ...rlHeaders } }
        );
      }
      await RateLimiter.record({ env, uidHash, endpoint: path, now: start });

      // Rota (stub)
      const body = await runB3Route(method, path, env, ctx, auth);
      recordMetric({ endpoint: path, status: 200, mode: body.mode, error: body.error });
      auditEvent(env, { event: 'b3.' + (body.action || 'request') + '.' + (body.mode || 'ok'), uidHash, endpoint: path, method, status: 200, mode: body.mode, referenceDate: body.referenceDate || null });
      safeLog({ endpoint: path, method, status: 200, uidHash, mode: body.mode, referenceDate: body.referenceDate || null, durationMs: dur() });
      return jsonResponse(body, { status: 200, headers: { ...cors, ...rlHeaders } });
    }

    safeLog({ endpoint: path, method, status: 404, durationMs: dur() });
    return jsonResponse(errorBody('Rota não encontrada.', { mode: 'not_found' }), { status: 404, headers: cors });
  },
};
