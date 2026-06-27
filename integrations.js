/* ═══════════════════════════════════════════════════════════════
 * integrations.js — Integrações frontend-only do FinançasPRO (Fase 20)
 * Script CLÁSSICO (sem ESM/build). Ordem de carga:
 *   utils.js → constants.js → reports.js → integrations.js → app.js
 * Declarações top-level são globais e compartilham escopo com app.js.
 * Tudo aqui é frontend-only: NENHUM token/segredo, NENHUM OAuth, NENHUMA
 * chamada real à B3/Open Finance. Google Agenda é apenas link (não lê a agenda);
 * BCB usa fontes públicas e falha sem quebrar o app (fallback manual);
 * OFX é processado localmente (payload tratado como não confiável).
 * Funções acopladas ao render da Central de Integrações e aos mappers
 * B3/Open Finance permanecem em app.js (resolvidas em runtime).
 * ═══════════════════════════════════════════════════════════════ */

// ── Google Agenda (link only — sem OAuth, sem leitura da agenda) ──
function googleCalendarLink({title,details,location,startDate,endDate}){
  const base='https://calendar.google.com/calendar/render?action=TEMPLATE';
  const parts=['&text='+encodeURIComponent(title||'Lembrete')];
  const ini=_gcalDate(startDate);
  if(ini){ const fim=_gcalDate(endDate)||_gcalPlus1(ini); parts.push('&dates='+encodeURIComponent(ini+'/'+fim)); }
  if(details)  parts.push('&details='+encodeURIComponent(details));
  if(location) parts.push('&location='+encodeURIComponent(location));
  return base+parts.join('');
}
function _abrirAgenda(opts){
  const url=googleCalendarLink(opts);
  window.open(url,'_blank','noopener,noreferrer');
  const I=_integ(); I.googleAgenda.ultimaAcao=new Date().toISOString();
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
}

// ── Parser OFX (local; usa _parseDataImport/_normalizeBRNumber de utils.js e _categoriza global) ──
function _parseOFX(text){
  const rows=[];
  const blocos=text.split(/<STMTTRN>/i).slice(1);
  const tag=(b,t)=>{ const m=b.match(new RegExp('<'+t+'>([^<\r\n]*)','i')); return m?m[1].trim():''; };
  blocos.forEach(b=>{
    const dt=_parseDataImport(tag(b,'DTPOSTED').slice(0,8));
    const val=_normalizeBRNumber(tag(b,'TRNAMT'));
    const memo=tag(b,'MEMO')||tag(b,'NAME')||'Transação';
    if(dt && !isNaN(val)){ const cz=_categoriza(memo,val); rows.push({data:dt, desc:memo, valor:val, destino:cz.destino, cat:cz.cat, ignorar:false}); }
  });
  return rows;
}

// ── Banco Central / BCB (fontes públicas; falha sem quebrar; fallback manual) ──
async function bcbFetch(serie, n=1) {
  const baseUrl = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/${n}?formato=json`;
  const enc = encodeURIComponent(baseUrl);

  // Múltiplos proxies CORS — tenta em sequência até um funcionar
  const endpoints = [
    // corsproxy.io — muito confiável, não encoda a URL
    `https://corsproxy.io/?${baseUrl}`,
    // allorigins modo raw — retorna o corpo direto
    `https://api.allorigins.win/raw?url=${enc}`,
    // cors.sh — alternativa popular
    `https://cors.sh/${baseUrl}`,
    // Direto — pode funcionar dependendo da rede/browser
    baseUrl,
  ];

  for(const url of endpoints) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(()=>ctrl.abort(), 7000);
      const headers = url.includes('cors.sh') ? {'x-cors-api-key':'temp_...'} : {};
      const r = await fetch(url, {signal: ctrl.signal, headers});
      clearTimeout(tid);
      if(!r.ok) continue;
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { continue; }
      // allorigins wraps in {contents}
      if(data && !Array.isArray(data) && data.contents) {
        try { data = JSON.parse(data.contents); } catch { continue; }
      }
      if(Array.isArray(data) && data.length > 0) return data[data.length-1];
    } catch { continue; }
  }
  throw new Error('API do BCB inacessível — use os campos manuais abaixo.');
}
