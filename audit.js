// ═══════════════════════════════════════════════════
//  Métricas + Auditoria do Worker B3 (Fase 16)
//  - Métricas em memória do isolate (contadores agregados, sem dados pessoais).
//  - Auditoria resumida: nunca token/CPF/payload/secret; uid sempre como uidHash.
// ═══════════════════════════════════════════════════

const metrics = {
  startedAt: new Date().toISOString(),
  total: 0,
  authorized: 0,
  rejected_auth: 0,
  rejected_cors: 0,
  rejected_rate: 0,
  mode_certification_stub: 0,
  mode_certification_config_missing: 0,
  mode_unsupported_env: 0,
  byEndpoint: {},
  byDay: {},
  lastError: '',
};

export function recordMetric(m) {
  const e = m || {};
  metrics.total += 1;
  const ep = e.endpoint || 'unknown';
  metrics.byEndpoint[ep] = (metrics.byEndpoint[ep] || 0) + 1;
  const day = new Date().toISOString().slice(0, 10);
  metrics.byDay[day] = (metrics.byDay[day] || 0) + 1;

  if (e.rejected === 'auth') metrics.rejected_auth += 1;
  else if (e.rejected === 'cors') metrics.rejected_cors += 1;
  else if (e.rejected === 'rate') metrics.rejected_rate += 1;
  else metrics.authorized += 1;

  if (e.mode === 'certification_stub') metrics.mode_certification_stub += 1;
  else if (e.mode === 'certification_config_missing') metrics.mode_certification_config_missing += 1;
  else if (e.mode === 'unsupported_env') metrics.mode_unsupported_env += 1;

  if (e.error) metrics.lastError = String(e.error).slice(0, 80);
}

export function getMetrics() {
  // Cópia rasa; não contém uid, token, CPF ou payload.
  return JSON.parse(JSON.stringify(metrics));
}

// Campos permitidos no evento de auditoria (whitelist).
export function auditEvent(env, ev) {
  if (env && env.B3_AUDIT_ENABLED === 'false') return null;
  const e = ev || {};
  const safe = {
    event: e.event || null,
    uidHash: e.uidHash || null,
    endpoint: e.endpoint || null,
    method: e.method || null,
    status: e.status || null,
    mode: e.mode || null,
    referenceDate: e.referenceDate || null,
    timestamp: new Date().toISOString(),
    errorCode: e.errorCode ? String(e.errorCode).slice(0, 60) : '',
  };
  try {
    console.log('AUDIT ' + JSON.stringify(safe));
  } catch (_) {
    /* noop */
  }
  return safe;
}
