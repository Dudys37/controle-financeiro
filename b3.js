// ═══════════════════════════════════════════════════
//  Rotas B3 (Fase 15). Todas exigem autenticação (validada no index.js).
//  Cada rota delega ao b3Client, que devolve resposta padronizada conforme
//  config de certificação (config_missing / certification_stub / unsupported_env).
// ═══════════════════════════════════════════════════
import { jsonResponse, b3CertStub } from '../utils/responses.js';
import { b3Client } from '../services/b3Client.js';

const ROUTES = {
  'GET /b3/status': (env, ctx, auth) => b3Client.status({ env, ctx, auth }),
  'POST /b3/sync-guide': (env, ctx, auth) => b3Client.syncGuide({ env, ctx, auth }),
  'POST /b3/sync-positions': (env, ctx, auth) => b3Client.syncPositions({ env, ctx, auth }),
  'POST /b3/sync-movements': (env, ctx, auth) => b3Client.syncMovements({ env, ctx, auth }),
  'POST /b3/revoke-local': (env, ctx, auth) => b3Client.revokeLocal({ env, ctx, auth }),
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
      status: 404, headers: corsH,
    });
  }
  const body = await handler(env, ctx, auth);
  return jsonResponse(body, { status: 200, headers: corsH });
}
