// ═══════════════════════════════════════════════════
//  Rotas B3 (Fase 16). Todas exigem autenticação (validada no index.js).
//  runB3Route devolve apenas o CORPO; o index.js monta a Response com CORS,
//  headers de rate limit, logs, métricas e auditoria.
// ═══════════════════════════════════════════════════
import { b3CertStub } from '../utils/responses.js';
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
export async function runB3Route(method, path, env, ctx, auth) {
  const handler = ROUTES[method + ' ' + path];
  if (!handler) return b3CertStub({ mode: 'error', error: 'Rota B3 não encontrada.' });
  return handler(env, ctx, auth);
}
