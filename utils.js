// ═══════════════════════════════════════════════════
//  🧰 utils.js — Helpers puros (Fase 12 — Modularização)
//  Carregado ANTES de app.js (script clássico). Não depende de D nem de
//  estado da app: apenas funções-folha de sanitização, formatação, datas e
//  parsing. Movido para cá a partir de app.js para reduzir o monólito e
//  centralizar segurança/formatação. As funções continuam globais (escopo
//  global compartilhado entre scripts clássicos) e também são expostas em
//  window no fim deste arquivo, para handlers inline e futura migração.
// ═══════════════════════════════════════════════════

// ── IDs ───────────────────────────────────────────
function genId(prefix) { return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── FORMATAÇÃO ────────────────────────────────────
const R  = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const RK = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
const P  = v => Number(v).toFixed(2)+'%';
const P9 = v => Number(v).toFixed(3)+'%';
const fmt=R, fmtK=RK, fmtP=P;

// ── SANITIZAÇÃO ANTI-XSS ──────────────────────────
// Escapa texto livre (de usuários ou do Firestore) antes de injetar via innerHTML.
function escapeHTML(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
// Atalho para valores usados dentro de atributos HTML
const attr = v => escapeHTML(v);
// URL segura: só http(s); bloqueia javascript:, data:, etc.
function _safeUrl(u){ const s=String(u||'').trim(); return /^https?:\/\//i.test(s)?s:''; }

// ── DATAS (puras) ─────────────────────────────────
function _isPast(dateStr){
  if(!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return false;
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  return new Date(dateStr+'T00:00:00') < hoje;
}
function _diasAte(dateStr){
  if(!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  return Math.round((new Date(dateStr+'T00:00:00')-hoje)/86400000);
}
function _gcalDate(d){
  // aceita Date | 'yyyy-mm-dd' | 'Mmm/aa' → 'YYYYMMDD'; null se inválido
  if(!d) return null;
  if(d instanceof Date){ if(isNaN(d)) return null; return d.toISOString().slice(0,10).replace(/-/g,''); }
  const s=String(d).trim();
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m) return m[1]+m[2]+m[3];
  m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return m[3]+m[2]+m[1];
  const pm=(typeof parseMes==='function')?parseMes(s):null; // parseMes vive em app.js (resolvido em runtime)
  if(pm&&pm.y&&pm.m) return String(pm.y)+String(pm.m).padStart(2,'0')+'01';
  return null;
}
function _gcalPlus1(yyyymmdd){
  const y=+yyyymmdd.slice(0,4), mo=+yyyymmdd.slice(4,6)-1, da=+yyyymmdd.slice(6,8);
  const dt=new Date(Date.UTC(y,mo,da)); dt.setUTCDate(dt.getUTCDate()+1);
  return dt.toISOString().slice(0,10).replace(/-/g,'');
}

// ── PARSING CSV / NÚMEROS BR (puros) ──────────────
function _detectDelimiter(text){
  const head=text.split(/\r?\n/).slice(0,5).join('\n');
  const counts={';':(head.match(/;/g)||[]).length, ',':(head.match(/,/g)||[]).length, '\t':(head.match(/\t/g)||[]).length};
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
}
function _splitCSVLine(line, delim){
  const out=[]; let cur='', q=false;
  for(let i=0;i<line.length;i++){ const c=line[i];
    if(q){ if(c==='"'){ if(line[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else { if(c==='"') q=true; else if(c===delim){ out.push(cur); cur=''; } else cur+=c; }
  }
  out.push(cur); return out.map(s=>s.trim());
}
function _normalizeBRNumber(s){
  if(s==null) return NaN;
  let t=String(s).trim().replace(/\s/g,'').replace(/r\$/i,'').replace(/[^\d.,\-]/g,'');
  let neg=false;
  if(/^\(.*\)$/.test(String(s).trim())) neg=true; // (1.234,56) = negativo
  if(t.indexOf('-')>0){ neg=true; } // valor com '-' ao final/meio
  t=t.replace(/-/g,'');
  if(t.indexOf(',')>-1 && t.indexOf('.')>-1){ t=t.replace(/\./g,'').replace(',','.'); } // 1.234,56
  else if(t.indexOf(',')>-1){ t=t.replace(',','.'); } // 1234,56
  // senão assume formato com ponto decimal (1234.56) ou inteiro
  let n=parseFloat(t); if(isNaN(n)) return NaN;
  if(neg || String(s).trim().startsWith('-')) n=-Math.abs(n);
  return n;
}
function _parseDataImport(s){
  if(!s) return null;
  const t=String(s).trim();
  let m=t.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return `${m[1]}-${m[2]}-${m[3]}`;
  m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if(m) return `${m[3]}-${m[2]}-${m[1]}`;
  m=t.match(/^(\d{2})\/(\d{2})\/(\d{2})$/); if(m) return `20${m[3]}-${m[2]}-${m[1]}`;
  m=t.match(/^(\d{8})$/); if(m) return `${m[1].slice(0,4)}-${m[1].slice(4,6)}-${m[1].slice(6,8)}`; // OFX YYYYMMDD
  return null;
}

// ── COMPATIBILIDADE GLOBAL ────────────────────────
// Top-level `const` não vira propriedade de window automaticamente; expomos
// explicitamente para handlers inline e para a futura migração para módulos.
if (typeof window !== 'undefined') {
  Object.assign(window, {
    genId, R, RK, P, P9, fmt, fmtK, fmtP,
    escapeHTML, attr, _safeUrl,
    _isPast, _diasAte, _gcalDate, _gcalPlus1,
    _detectDelimiter, _splitCSVLine, _normalizeBRNumber, _parseDataImport,
  });
}
