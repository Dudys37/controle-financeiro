// ═══════════════════════════════════════════════════
//  Autenticação Firebase no Worker B3 (Fase 15) — validação REAL do ID Token
//  - Verifica assinatura RS256 contra as chaves públicas (JWKS) do Google.
//  - Valida iss, aud, sub, exp, iat (com tolerância) e estrutura.
//  - Cache em memória do JWKS, respeitando Cache-Control (max-age).
//  - NUNCA loga o token nem o devolve ao frontend.
//  - Endpoints B3 nunca aceitam chamada anônima (token ausente → 401).
//  - Modo DEV não verificado só com B3_ENV=local + B3_DEV_ALLOW_UNVERIFIED=true.
// ═══════════════════════════════════════════════════

// JWKS oficial dos Firebase ID Tokens (formato JWK, importável direto no WebCrypto).
const DEFAULT_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const IAT_SKEW_SECONDS = 60; // tolerância p/ iat no futuro (relógios)

// ── base64url helpers ──
function b64urlToString(b64url) {
  const b64 = String(b64url || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil((b64url || '').length / 4) * 4, '=');
  const bin = atob(b64);
  let out = '';
  for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
  try {
    return decodeURIComponent(escape(out));
  } catch (_) {
    return out;
  }
}
function b64urlToBytes(b64url) {
  const b64 = String(b64url || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil((b64url || '').length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function getBearerToken(request) {
  const h =
    request.headers.get('Authorization') ||
    request.headers.get('authorization') ||
    '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : '';
}

export function decodeJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(b64urlToString(parts[0]));
    const payload = JSON.parse(b64urlToString(parts[1]));
    return {
      header,
      payload,
      signingInput: parts[0] + '.' + parts[1],
      signatureB64url: parts[2],
    };
  } catch (_) {
    return null;
  }
}

// ── Cache do JWKS em memória do isolate ──
let _jwksCache = { keys: null, expiresAt: 0, url: '' };

async function fetchJwks(env, force) {
  const url = (env && env.FIREBASE_JWKS_URL) || DEFAULT_JWKS_URL;
  const now = Date.now();
  if (!force && _jwksCache.keys && _jwksCache.url === url && now < _jwksCache.expiresAt) {
    return _jwksCache.keys;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('jwks_fetch_failed');
  const body = await res.json(); // { keys: [ { kid, kty:'RSA', n, e, alg:'RS256', use:'sig' } ] }
  const keys = (body && Array.isArray(body.keys)) ? body.keys : [];
  // TTL a partir do Cache-Control (max-age); fallback 1h.
  const cc = res.headers.get('cache-control') || '';
  const m = /max-age=(\d+)/i.exec(cc);
  const ttlMs = (m ? parseInt(m[1], 10) : 3600) * 1000;
  _jwksCache = { keys, expiresAt: now + ttlMs, url };
  return keys;
}

async function getJwkByKid(kid, env) {
  let keys = await fetchJwks(env, false);
  let jwk = keys.find((k) => k.kid === kid);
  if (!jwk) {
    // kid desconhecido → tenta um refresh do cache, uma vez.
    keys = await fetchJwks(env, true);
    jwk = keys.find((k) => k.kid === kid);
  }
  return jwk || null;
}

async function verifyRS256(decoded, jwk) {
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sig = b64urlToBytes(decoded.signatureB64url);
  const data = new TextEncoder().encode(decoded.signingInput);
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data);
}

function minClaims(p) {
  return {
    sub: p.sub,
    email: p.email || null,
    email_verified: p.email_verified === true,
    auth_time: p.auth_time || null,
    iss: p.iss || null,
    aud: p.aud || null,
  };
}

// Retorna { ok, status, uid?, email?, verified?, mode?, claims?, reason? }
export async function verifyFirebaseToken(request, env) {
  const token = getBearerToken(request);
  if (!token) return { ok: false, status: 401, reason: 'missing_token' };

  const decoded = decodeJwt(token);
  if (!decoded) return { ok: false, status: 401, reason: 'malformed_token' };

  const { header, payload } = decoded;
  if (header.alg !== 'RS256') return { ok: false, status: 401, reason: 'bad_alg' };

  const projectId = (env && env.FIREBASE_PROJECT_ID) || '';
  const now = Math.floor(Date.now() / 1000);

  // Claims (baratas) primeiro
  if (projectId) {
    if (payload.iss !== `https://securetoken.google.com/${projectId}`)
      return { ok: false, status: 401, reason: 'invalid_iss' };
    if (payload.aud !== projectId) return { ok: false, status: 401, reason: 'invalid_aud' };
  }
  if (!payload.sub) return { ok: false, status: 401, reason: 'missing_sub' };
  if (!payload.exp || now >= payload.exp) return { ok: false, status: 401, reason: 'expired' };
  if (payload.iat && payload.iat > now + IAT_SKEW_SECONDS)
    return { ok: false, status: 401, reason: 'iat_in_future' };

  const isLocal = !!(env && env.B3_ENV === 'local');
  const devUnverified = isLocal && !!(env && env.B3_DEV_ALLOW_UNVERIFIED === 'true');

  // Modo DEV não verificado: pula assinatura. SÓ em local + flag. Nunca em certification/production.
  if (devUnverified) {
    return {
      ok: true,
      status: 200,
      uid: payload.sub,
      email: payload.email || null,
      verified: false,
      mode: 'dev_unverified',
      claims: minClaims(payload),
    };
  }

  // Verificação real de assinatura
  if (!projectId) return { ok: false, status: 401, reason: 'project_not_configured' };
  if (!header.kid) return { ok: false, status: 401, reason: 'missing_kid' };
  try {
    const jwk = await getJwkByKid(header.kid, env);
    if (!jwk) return { ok: false, status: 401, reason: 'unknown_kid' };
    const valid = await verifyRS256(decoded, jwk);
    if (!valid) return { ok: false, status: 401, reason: 'bad_signature' };
  } catch (_) {
    return { ok: false, status: 401, reason: 'verify_error' };
  }

  return {
    ok: true,
    status: 200,
    uid: payload.sub,
    email: payload.email || null,
    verified: true,
    mode: 'verified',
    claims: minClaims(payload),
  };
}

// Exposto para testes/uso futuro.
export { fetchJwks as _fetchJwks };
