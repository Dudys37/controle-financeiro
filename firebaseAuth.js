// ═══════════════════════════════════════════════════
//  Autenticação Firebase no Worker B3 (Fase 14)
//  - Endpoints B3 NUNCA aceitam chamada anônima (token ausente → 401).
//  - Esta fase valida PRESENÇA e CLAIMS (iss/aud/exp/sub).
//  - A verificação de ASSINATURA RS256 contra as chaves públicas do Google
//    está esboçada (verifySignatureRS256) e desligada por padrão até o
//    ambiente de certificação estar configurado, para nunca dar falso "verificado".
// ═══════════════════════════════════════════════════

function b64urlToString(b64url) {
  const b64 = String(b64url || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil((b64url || '').length / 4) * 4, '=');
  // atob existe no runtime do Cloudflare Worker
  const bin = atob(b64);
  let out = '';
  for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
  try {
    return decodeURIComponent(escape(out));
  } catch (_) {
    return out;
  }
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
      signature: parts[2],
      signingInput: parts[0] + '.' + parts[1],
    };
  } catch (_) {
    return null;
  }
}

// Esboço da verificação de assinatura RS256 (a finalizar na certificação).
// Busca as chaves públicas do Firebase, localiza por `kid` e verificaria a
// assinatura via Web Crypto. Retorna false até a implementação completa, para
// não classificar um token como verificado indevidamente.
async function verifySignatureRS256(decoded, env) {
  const JWKS_URL =
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
  try {
    const res = await fetch(JWKS_URL);
    if (!res.ok) return false;
    const certs = await res.json();
    const pem = certs[decoded.header.kid];
    if (!pem) return false;
    // TODO (certificação): converter o certificado X.509 (PEM) em chave pública
    // SPKI, importar com crypto.subtle.importKey('spki', ..., {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'})
    // e validar a assinatura com crypto.subtle.verify sobre `decoded.signingInput`.
    return false;
  } catch (_) {
    return false;
  }
}

// Retorna { ok, status, uid?, verified?, reason? }
export async function verifyFirebaseToken(request, env) {
  const token = getBearerToken(request);
  if (!token) return { ok: false, status: 401, reason: 'missing_token' };

  const decoded = decodeJwt(token);
  if (!decoded) return { ok: false, status: 401, reason: 'malformed_token' };

  const projectId = (env && env.FIREBASE_PROJECT_ID) || '';
  const now = Math.floor(Date.now() / 1000);
  const p = decoded.payload || {};

  // Claims (quando o projeto está configurado)
  if (projectId) {
    const issOk = p.iss === `https://securetoken.google.com/${projectId}`;
    const audOk = p.aud === projectId;
    if (!issOk || !audOk) return { ok: false, status: 401, reason: 'invalid_claims' };
  }
  if (!p.sub) return { ok: false, status: 401, reason: 'missing_sub' };
  if (p.exp && now >= p.exp) return { ok: false, status: 401, reason: 'expired' };

  // Assinatura: obrigatória fora de DEV local.
  let signatureVerified = false;
  if (!env || env.B3_ENV !== 'local') {
    signatureVerified = await verifySignatureRS256(decoded, env);
    if (!signatureVerified) return { ok: false, status: 401, reason: 'signature_unverified' };
  } else {
    // DEV local: aceita token estruturalmente válido SEM assinatura SOMENTE quando
    // B3_DEV_ALLOW_UNVERIFIED === 'true'. Nunca aceita chamada anônima.
    if (!env || env.B3_DEV_ALLOW_UNVERIFIED !== 'true') {
      return { ok: false, status: 401, reason: 'signature_unverified' };
    }
  }

  return { ok: true, status: 200, uid: p.sub, verified: signatureVerified };
}
