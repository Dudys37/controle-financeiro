// ═══════════════════════════════════════════════════
//  Segurança do Worker B3 (Fase 14): CORS allowlist, preflight, logs seguros
//  - Nunca usa Access-Control-Allow-Origin: '*'
//  - Logs NUNCA contêm token, CPF ou payload completo
// ═══════════════════════════════════════════════════

export function allowedOrigins(env) {
  return String((env && env.ALLOWED_ORIGINS) || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Resolve a origem permitida para a requisição (string vazia = não permitida).
export function resolveOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const list = allowedOrigins(env);
  // DEV: se nada configurado e B3_ENV=local, libera apenas localhost/127.0.0.1.
  if (!list.length && env && env.B3_ENV === 'local' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return origin;
  }
  return list.includes(origin) ? origin : '';
}

export function corsHeaders(request, env) {
  const origin = resolveOrigin(request, env);
  const h = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '600',
  };
  if (origin) h['Access-Control-Allow-Origin'] = origin; // nunca '*'
  return h;
}

// Preflight: só "aprova" se a origem estiver na allowlist.
export function handleOptions(request, env) {
  const headers = corsHeaders(request, env);
  const status = headers['Access-Control-Allow-Origin'] ? 204 : 403;
  return new Response(null, { status, headers });
}

// Log mínimo e não sensível.
export function safeLog(entry) {
  const e = entry || {};
  try {
    console.log(JSON.stringify({
      ts: e.ts || new Date().toISOString(),
      endpoint: e.endpoint || null,
      method: e.method || null,
      status: e.status || null,
      uid: e.uid ? String(e.uid).slice(0, 8) + '…' : null,
      error: e.error ? String(e.error).slice(0, 120) : null,
    }));
  } catch (_) {
    /* noop */
  }
}
