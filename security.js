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

// Log mínimo e não sensível — SOMENTE campos permitidos (whitelist).
// Campos proibidos (token, authorization, password, senha, cpf, client_secret,
// access_token, refresh_token, private_key, payload, body, cert) são ignorados
// por construção, pois nunca são copiados para a saída.
export function safeLog(entry) {
  const e = entry || {};
  const out = { ts: e.ts || new Date().toISOString() };
  if (e.uidHash) out.uidHash = String(e.uidHash).slice(0, 16);
  else if (e.uid) out.uidHash = String(e.uid).slice(0, 8) + '\u2026';
  for (const k of ['endpoint', 'method', 'status', 'mode', 'referenceDate']) {
    if (e[k] != null) out[k] = e[k];
  }
  if (typeof e.durationMs === 'number') out.durationMs = e.durationMs;
  if (e.error) out.error = String(e.error).slice(0, 120);
  try {
    console.log(JSON.stringify(out));
  } catch (_) {
    /* noop */
  }
}

// Identificação de usuário sem expor o uid completo.
export function shortUid(uid) {
  return uid ? String(uid).slice(0, 8) + '\u2026' : null;
}

// Hash SHA-256 (com salt opcional via secret) → 16 chars hex. Fallback: shortUid.
export async function hashUid(uid, env) {
  if (!uid) return null;
  try {
    const salt = (env && env.B3_UID_HASH_SALT) || '';
    const data = new TextEncoder().encode(salt + ':' + uid);
    const buf = await crypto.subtle.digest('SHA-256', data);
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex.slice(0, 16);
  } catch (_) {
    return shortUid(uid);
  }
}
