// ═══════════════════════════════════════════════════
//  FinançasPRO — Cloudflare Worker B3 (Fase 14, esqueleto)
//  Ambiente de certificação. SEM produção, SEM segredos no repo, SEM chamada real.
//
//  Rotas:
//    GET  /health            → público, { ok:true, service, env, updatedAt }
//    GET  /b3/status         → exige Firebase ID Token → certification_stub
//    POST /b3/sync-guide     → exige token → certification_stub
//    POST /b3/sync-positions → exige token → certification_stub
//    POST /b3/sync-movements → exige token → certification_stub
//    POST /b3/revoke-local   → exige token → certification_stub
// ═══════════════════════════════════════════════════
import { jsonResponse, healthBody, errorBody } from './utils/responses.js';
import { corsHeaders, handleOptions, safeLog, resolveOrigin } from './utils/security.js';
import { verifyFirebaseToken } from './services/firebaseAuth.js';
import { isB3Path, matchB3Route, handleB3 } from './routes/b3.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();
    const cors = corsHeaders(request, env);

    // Preflight CORS
    if (method === 'OPTIONS') return handleOptions(request, env);

    // Health-check — público (sem auth)
    if (path === '/health' && method === 'GET') {
      safeLog({ endpoint: '/health', method, status: 200 });
      return jsonResponse(healthBody(env), { status: 200, headers: cors });
    }

    // Endpoints B3 — exigem Firebase ID Token (nunca anônimos)
    if (isB3Path(path)) {
      // Se houver Origin (chamada de navegador) e ela não estiver na allowlist, rejeita.
      const origin = request.headers.get('Origin');
      if (origin && !resolveOrigin(request, env)) {
        safeLog({ endpoint: path, method, status: 403, error: 'forbidden_origin' });
        return jsonResponse(errorBody('Origem não permitida.', { mode: 'forbidden_origin' }), {
          status: 403,
          headers: cors,
        });
      }
      if (!matchB3Route(method, path)) {
        safeLog({ endpoint: path, method, status: 405 });
        return jsonResponse(errorBody('Método ou rota B3 não permitidos.', { mode: 'method_not_allowed' }), {
          status: 405,
          headers: cors,
        });
      }
      const auth = await verifyFirebaseToken(request, env);
      if (!auth.ok) {
        const msg = auth.reason === 'missing_token' ? 'Token ausente.' : 'Token inválido ou expirado.';
        safeLog({ endpoint: path, method, status: auth.status, error: auth.reason });
        return jsonResponse(errorBody(msg, { mode: 'unauthorized' }), {
          status: auth.status,
          headers: cors,
        });
      }
      safeLog({ endpoint: path, method, status: 200, uid: auth.uid, mode: auth.mode });
      return handleB3(method, path, env, ctx, auth, cors);
    }

    // 404
    safeLog({ endpoint: path, method, status: 404 });
    return jsonResponse(errorBody('Rota não encontrada.', { mode: 'not_found' }), {
      status: 404,
      headers: cors,
    });
  },
};
