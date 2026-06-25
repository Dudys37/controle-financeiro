// ═══════════════════════════════════════════════════
//  Rotas B3 (Fase 14). Todas exigem autenticação (validada no index.js).
//  Cada rota responde com o stub de certificação (mode: 'certification_stub').
// ═══════════════════════════════════════════════════
import { jsonResponse, b3CertStub } from '../utils/responses.js';
import { b3Client } from '../services/b3Client.js';

// Mapa "MÉTODO /rota" → handler
const ROUTES = {
  'GET /b3/status': (env, ctx) => b3Client.status(env, ctx),
  'POST /b3/sync-guide': (env, ctx) => b3Client.syncGuide(env, ctx),
  'POST /b3/sync-positions': (env, ctx) => b3Client.syncPositions(env, ctx),
  'POST /b3/sync-movements': (env, ctx) => b3Client.syncMovements(env, ctx),
  'POST /b3/revoke-local': (env, ctx) => b3Client.revokeLocal(env, ctx),
};

export function isB3Path(path) {
  return path === '/b3' || path.startsWith('/b3/');
}

export function matchB3Route(method, path) {
  return Object.prototype.hasOwnProperty.call(ROUTES, method + ' ' + path);
}

export async function handleB3(method, path, env, ctx, auth, corsH) {
  const handler = ROUTES[method + ' ' + path];
  if (!handler) {
    return jsonResponse(b3CertStub({ mode: 'error', error: 'Rota B3 não encontrada.' }), {
      status: 404,
      headers: corsH,
    });
  }
  const body = await handler(env, ctx);
  // Metadado não sensível do solicitante autenticado.
  if (auth && auth.uid) body.requestedBy = String(auth.uid).slice(0, 8) + '…';
  return jsonResponse(body, { status: 200, headers: corsH });
}
