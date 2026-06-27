/* ═══════════════════════════════════════════════════════════════
 * b3of_mod.js — Camada lógica mock/stub B3 / Open Finance do FinançasPRO (Fase 21a + 22)
 * Script CLÁSSICO (sem ESM/build). Ordem de carga:
 *   utils.js → constants.js → reports.js → integrations.js → b3of_mod.js → app.js
 * Contém SOMENTE funções PURAS de mapeamento/normalização (payload mock → sugestão).
 * NENHUMA chamada real à B3/Open Finance, NENHUM token/segredo, NENHUM acesso a rede.
 * Toda origem é marcada ('B3' / 'Open Finance'); o payload é tratado como NÃO confiável.
 * Rodam em runtime (durante import mock), então usam helpers globais de app.js
 * (_str/_num/_dt) resolvidos na chamada. O render da Central de Integrações,
 * B3Service/OpenFinanceService, preview/confirmar e os acessores de estado
 * (_b3/_of/logs/resumos) permanecem em app.js.
 * ═══════════════════════════════════════════════════════════════ */

// ── Mapeadores (puros, conceituais — origem marcada) ──
function mapPositionToInvestment(p){ return {
  ativo:_str(p.ativo||p.ticker||p.symbol||p.nome||p.instrument||''), tipoAtivo:_str(p.tipoAtivo||p.tipo||p.assetType||p.category||''),
  quantidade:_num(p.quantidade!=null?p.quantidade:(p.qtd!=null?p.qtd:p.quantity)), instituicao:_str(p.instituicao||p.participante||p.institution||p.broker||''),
  valor:_num(p.valor!=null?p.valor:(p.valorBruto!=null?p.valorBruto:p.value)), dataReferencia:_dt(p.dataReferencia||p.referenceDate||p.data||p.date),
  isin:_str(p.isin||p.ISIN||''), vencimento:_dt(p.vencimento||p.maturity||p.dueDate), origem:'B3', sincronizadoEm:new Date().toISOString() }; }
function mapMovementToTransaction(m){ return {
  data:_dt(m.data||m.date||m.referenceDate), descricao:_str(m.descricao||m.description||m.evento||m.movementType||''), tipo:_str(m.tipo||m.type||m.operationType||''),
  ativo:_str(m.ativo||m.ticker||m.symbol||m.instrument||''), quantidade:_num(m.quantidade!=null?m.quantidade:m.quantity), valor:_num(m.valor!=null?m.valor:m.value),
  evento:_str(m.evento||m.event||m.movementType||''), dataReferencia:_dt(m.dataReferencia||m.referenceDate), origem:'B3' }; }
function mapAccountToFinance(a){ return {
  conta:_str(a.conta||a.account||a.number||a.accountId||''), instituicao:_str(a.instituicao||a.institution||a.brand||a.bank||''), tipo:_str(a.tipo||a.type||a.accountType||''),
  saldo:_num(a.saldo!=null?a.saldo:(a.balance!=null?a.balance:a.availableAmount)), moeda:_str(a.moeda||a.currency||'BRL'), dataReferencia:_dt(a.dataReferencia||a.referenceDate||a.data), origem:'Open Finance' }; }
function mapTransactionToEntryOrExpense(t){ const valor=_num(t.valor!=null?t.valor:(t.amount!=null?t.amount:t.value)); const tipoRaw=_str(t.tipo||t.type||t.creditDebitType||'').toUpperCase();
  const entrada = /CRED|CREDIT|ENTRADA|IN/.test(tipoRaw) || valor>0 && !/DEB|DEBIT|SAIDA|OUT/.test(tipoRaw);
  return { direcao: entrada?'entrada':'saida', data:_dt(t.data||t.date||t.transactionDate), descricao:_str(t.descricao||t.description||t.merchant||''),
    valor:Math.abs(valor), categoriaSugerida:_str(t.categoria||t.category||''), conta:_str(t.conta||t.account||t.accountId||''), origem:'Open Finance' }; }
function mapCreditCardToCard(c){ return {
  cartao:_str(c.cartao||c.card||c.name||c.brand||''), limite:_num(c.limite!=null?c.limite:c.creditLimit), faturaValor:_num(c.fatura!=null?c.fatura:(c.invoice!=null?c.invoice:c.billAmount)),
  vencimento:_dt(c.vencimento||c.dueDate||c.invoiceDueDate), origem:'Open Finance' }; }

// ── Normalização por tipo (para preview/armazenamento) ──
function _normB3(tipo,row){
  const base={ _origem:'B3', _importadoEm:new Date().toISOString() };
  if(tipo==='posicao') return Object.assign(base, mapPositionToInvestment(row));
  if(tipo==='movimentacao') return Object.assign(base, mapMovementToTransaction(row));
  // garantias / eventos / ofertas / negociação: normalização genérica defensiva
  return Object.assign(base, {
    ativo:_str(row.ativo||row.ticker||row.symbol||row.nome||row.instrument||''), descricao:_str(row.descricao||row.description||row.evento||row.event||''),
    quantidade:_num(row.quantidade!=null?row.quantidade:row.quantity), valor:_num(row.valor!=null?row.valor:row.value),
    data:_dt(row.data||row.date||row.dataReferencia||row.referenceDate), instituicao:_str(row.instituicao||row.participante||row.institution||''), origem:'B3' });
}
function _normOF(tipo,row){
  const base={ _origem:'Open Finance', _importadoEm:new Date().toISOString() };
  if(tipo==='contas'||tipo==='saldos') return Object.assign(base, mapAccountToFinance(row));
  if(tipo==='transacoes') return Object.assign(base, mapTransactionToEntryOrExpense(row));
  if(tipo==='cartoes'||tipo==='faturas') return Object.assign(base, mapCreditCardToCard(row));
  if(tipo==='investimentos') return Object.assign(base, { ativo:_str(row.ativo||row.instrument||row.nome||''), tipo:_str(row.tipo||row.type||''), quantidade:_num(row.quantidade!=null?row.quantidade:row.quantity), valor:_num(row.valor!=null?row.valor:row.value), instituicao:_str(row.instituicao||row.institution||''), origem:'Open Finance' });
  // creditos
  return Object.assign(base, { contrato:_str(row.contrato||row.contract||row.nome||''), tipo:_str(row.tipo||row.type||''), saldoDevedor:_num(row.saldoDevedor!=null?row.saldoDevedor:row.outstandingBalance), parcela:_num(row.parcela!=null?row.parcela:row.installmentAmount), instituicao:_str(row.instituicao||row.institution||''), origem:'Open Finance' });
}

/* ═══════════════ Fase 22 — Camada lógica (services, estado, logs, resumos) ═══════════════
 * Movido do app.js: acessores de estado (_b3/_of/_b3cfg/_ofcfg), builders de resposta,
 * utilidades de parse (_num/_dt/_str/_payloadToArray/datas), logs resumidos (sem payload),
 * recálculo de resumos e os services mock/stub B3Service/OpenFinanceService.
 * Services retornam SOMENTE objetos de dados (nunca HTML). Sem chamada real, sem token.
 * O render visual (painéis, preview, cards) permanece em app.js. ═══════════════ */
const B3_AVISOS = [
  'Integração real exige backend seguro.',
  'Não informe sua senha B3 neste app.',
  'O consentimento real ocorre na Área Logada da B3.',
  'Os dados da B3 são D-1 (referência do dia anterior).',
  'A API Guia deve ser usada para evitar chamadas desnecessárias.',
];
const OF_AVISOS = [
  'Integração real exige backend seguro.',
  'Não informe sua senha bancária neste app.',
  'Este app não faz scraping de internet banking.',
  'O consentimento real exige fluxo seguro autorizado.',
  'Tokens nunca ficam no frontend.',
];
const OF_TIPOS = { contas:'Contas', saldos:'Saldos', transacoes:'Transações', cartoes:'Cartões', faturas:'Faturas', investimentos:'Investimentos', creditos:'Operações de crédito' };

function _b3(){ if(typeof D.b3!=='object'||!D.b3) D.b3={}; ['posicoes','movimentacoes','garantias','eventosProvisionados','ofertasPublicas','negociacoes','logsSincronizacao'].forEach(k=>{ if(!Array.isArray(D.b3[k])) D.b3[k]=[]; }); return D.b3; }
function _of(){ if(typeof D.openFinance!=='object'||!D.openFinance) D.openFinance={}; ['contas','saldos','transacoes','cartoes','faturas','investimentos','creditos','logsSincronizacao'].forEach(k=>{ if(!Array.isArray(D.openFinance[k])) D.openFinance[k]=[]; }); return D.openFinance; }
function _b3cfg(){ return (D.integracoes&&D.integracoes.b3)||{}; }
function _ofcfg(){ return (D.integracoes&&D.integracoes.openFinance)||{}; }

// ── Retornos padronizados ──
function _b3Resp(over){ return Object.assign({ok:true,provider:'b3',mode:'mock',source:'B3 Área do Investidor',updatedAt:new Date().toISOString(),referenceDate:'',data:{},error:null}, over||{}); }
function _ofResp(over){ return Object.assign({ok:true,provider:'open_finance',mode:'mock',source:'Open Finance Brasil',updatedAt:new Date().toISOString(),referenceDate:'',data:{},error:null}, over||{}); }
const B3_BACKEND_MSG = 'Integração real exige backend, pacote de acesso e contrato/licenciamento B3.';
const OF_BACKEND_MSG = 'Integração Open Finance real exige backend seguro, consentimento, OAuth/mTLS e provedor autorizado.';

// ── Utilidades seguras de parse ──
function _num(v){ if(v==null) return 0; if(typeof v==='number') return isFinite(v)?v:0; const n=(typeof _normalizeBRNumber==='function')?_normalizeBRNumber(v):parseFloat(v); return isFinite(n)?n:0; }
function _dt(v){ const p=(typeof _parseDataImport==='function')?_parseDataImport(v):null; return p||''; }
function _str(v){ return v==null?'':String(v); }
function _yesterdayISO(){ const d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }
function _todayISO(){ return new Date().toISOString().slice(0,10); }
function _payloadToArray(payload){
  if(Array.isArray(payload)) return payload;
  if(payload && typeof payload==='object'){
    for(const k of ['data','items','results','records','list','content']){ if(Array.isArray(payload[k])) return payload[k]; }
  }
  return null;
}


// ── Logs resumidos (sem payload sensível completo) ──
function _b3Log(status,origem,info){ _b3().logsSincronizacao.unshift({ data:new Date().toISOString(), status, origem:origem||'mock', info:_str(info).slice(0,120) }); if(_b3().logsSincronizacao.length>50) _b3().logsSincronizacao.length=50; }
function _ofLog(status,origem,info){ _of().logsSincronizacao.unshift({ data:new Date().toISOString(), status, origem:origem||'mock', info:_str(info).slice(0,120) }); if(_of().logsSincronizacao.length>50) _of().logsSincronizacao.length=50; }

// ── Recalcular resumos ──
function _b3RecalcResumo(){ const b=_b3(), c=_b3cfg(); if(!c.resumo) return;
  c.resumo.posicoes=b.posicoes.length; c.resumo.movimentacoes=b.movimentacoes.length; c.resumo.garantias=b.garantias.length;
  c.resumo.eventosProvisionados=b.eventosProvisionados.length; c.resumo.ofertasPublicas=b.ofertasPublicas.length; c.resumo.negociacoes=b.negociacoes.length; }
function _ofRecalcResumo(){ const o=_of(), c=_ofcfg(); if(!c.resumo) return;
  c.resumo.contas=o.contas.length; c.resumo.saldos=o.saldos.length; c.resumo.transacoes=o.transacoes.length;
  c.resumo.cartoes=o.cartoes.length; c.resumo.faturas=o.faturas.length; c.resumo.investimentos=o.investimentos.length; c.resumo.creditos=o.creditos.length; }

// ═══ B3Service ═══
const B3Service = {
  status(){ const c=_b3cfg(); const cs=(c.consentimento&&c.consentimento.status)||'nao_iniciado';
    let sync='backend_necessario';
    if(cs==='revogado') sync='consentimento_revogado'; else if(cs==='nao_iniciado'||cs==='pendente') sync='consentimento_ausente';
    else if(c.ultimaReferenciaD1===_yesterdayISO()) sync='atualizado'; else if(c.ultimaSincronizacao) sync='desatualizado'; else sync='aguardando_D1';
    return _b3Resp({ mode: c.modo==='api'?'api':'mock', referenceDate:c.ultimaReferenciaD1||'', data:{ statusIntegracao:c.status, consentimento:cs, sincronizacao:sync, resumo:c.resumo } }); },
  // Stubs de sincronização: SEMPRE backend_required (sem chamada real)
  syncGuide(){ _b3Log('backend_required','guia','Simulação: API Guia exige backend'); return _b3Resp({ok:false,mode:'backend_required',data:null,error:B3_BACKEND_MSG}); },
  syncPositions(){ _b3Log('backend_required','position','Simulação: Position exige backend'); return _b3Resp({ok:false,mode:'backend_required',data:null,error:B3_BACKEND_MSG}); },
  syncMovements(){ _b3Log('backend_required','movement','Simulação: Movement exige backend'); return _b3Resp({ok:false,mode:'backend_required',data:null,error:B3_BACKEND_MSG}); },
  importMockPayload(tipo, arr){ const col=B3_TIPO_COL[tipo]; if(!col) return _b3Resp({ok:false,mode:'manual',data:null,error:'Tipo B3 inválido.'});
    const b=_b3(); const norm=arr.map(r=>_normB3(tipo,r));
    // dedupe simples por ativo+instituicao+data
    const seen=new Set(b[col].map(x=>`${x.ativo||''}|${x.instituicao||''}|${x.data||x.dataReferencia||''}`));
    let add=0; norm.forEach(x=>{ const key=`${x.ativo||''}|${x.instituicao||''}|${x.data||x.dataReferencia||''}`; if(!seen.has(key)){ b[col].push(x); seen.add(key); add++; } });
    _b3RecalcResumo(); const c=_b3cfg(); c.fonte='manual'; c.ultimaSincronizacao=new Date().toISOString(); c.ultimaReferenciaD1=_yesterdayISO(); if(c.status==='nao_configurada') c.status='mock_importado';
    _b3Log('mock_importado',tipo,`${add} novo(s) de ${arr.length}`);
    return _b3Resp({mode:'mock',referenceDate:c.ultimaReferenciaD1,data:{tipo,adicionados:add,recebidos:arr.length}}); },
  mapPositionToInvestment, mapMovementToTransaction,
};


const OpenFinanceService = {
  status(){ const c=_ofcfg(); const cs=(c.consentimento&&c.consentimento.status)||'nao_iniciado';
    let sync='backend_necessario';
    if(cs==='revogado') sync='consentimento_revogado'; else if(cs==='expirado') sync='consentimento_expirado';
    else if(cs==='nao_iniciado'||cs==='pendente') sync='consentimento_ausente'; else if(c.ultimaSincronizacao) sync='desatualizado'; else sync='backend_necessario';
    return _ofResp({ mode: c.modo==='api'?'api':'mock', data:{ statusIntegracao:c.status, consentimento:cs, sincronizacao:sync, instituicao:(c.consentimento&&c.consentimento.instituicao)||'', resumo:c.resumo } }); },
  startConsentStub(){ const c=_ofcfg(); if(c.consentimento){ c.consentimento.status='backend_necessario'; } _ofLog('backend_required','consent','Início de consentimento exige fluxo seguro/backend');
    return _ofResp({ok:false,mode:'backend_required',data:null,error:OF_BACKEND_MSG}); },
  revokeLocalConsent(){ const c=_ofcfg(); if(c.consentimento){ c.consentimento.status='revogado'; c.consentimento.dataRevogacao=new Date().toISOString(); } _ofLog('revogado','consent','Consentimento marcado como revogado (local)');
    return _ofResp({mode:'manual',data:{consentimento:'revogado'}}); },
  syncAccounts(){ _ofLog('backend_required','accounts','Simulação: contas exige backend'); return _ofResp({ok:false,mode:'backend_required',data:null,error:OF_BACKEND_MSG}); },
  syncBalances(){ _ofLog('backend_required','balances','Simulação: saldos exige backend'); return _ofResp({ok:false,mode:'backend_required',data:null,error:OF_BACKEND_MSG}); },
  syncTransactions(){ _ofLog('backend_required','transactions','Simulação: transações exige backend'); return _ofResp({ok:false,mode:'backend_required',data:null,error:OF_BACKEND_MSG}); },
  syncCreditCards(){ _ofLog('backend_required','cards','Simulação: cartões exige backend'); return _ofResp({ok:false,mode:'backend_required',data:null,error:OF_BACKEND_MSG}); },
  importMockPayload(tipo, arr){ if(!OF_TIPOS[tipo]) return _ofResp({ok:false,mode:'manual',data:null,error:'Tipo Open Finance inválido.'});
    const o=_of(); const norm=arr.map(r=>_normOF(tipo,r));
    const keyOf=x=>`${x.conta||x.cartao||x.ativo||x.contrato||''}|${x.instituicao||''}|${x.data||x.dataReferencia||x.vencimento||''}|${x.valor||x.saldo||x.saldoDevedor||''}`;
    const seen=new Set(o[tipo].map(keyOf)); let add=0;
    norm.forEach(x=>{ const k=keyOf(x); if(!seen.has(k)){ o[tipo].push(x); seen.add(k); add++; } });
    _ofRecalcResumo(); const c=_ofcfg(); c.fonte='manual'; c.ultimaSincronizacao=new Date().toISOString(); if(c.status==='nao_configurada') c.status='mock_importado';
    _ofLog('mock_importado',tipo,`${add} novo(s) de ${arr.length}`);
    return _ofResp({mode:'mock',data:{tipo,adicionados:add,recebidos:arr.length}}); },
  mapAccountToFinance, mapTransactionToEntryOrExpense, mapCreditCardToCard,
};

/* ═══════════════ Exposição global (compatibilidade scripts clássicos) ═══════════════ */
if (typeof window !== "undefined") {
  window.B3Service = B3Service;
  window.OpenFinanceService = OpenFinanceService;
  window.B3OF = Object.assign(window.B3OF || {}, {
    // mappers (Fase 21a)
    mapPositionToInvestment, mapMovementToTransaction, mapAccountToFinance,
    mapTransactionToEntryOrExpense, mapCreditCardToCard, normB3: _normB3, normOF: _normOF,
    // estado + lógica (Fase 22)
    b3: _b3, openFinance: _of, b3Config: _b3cfg, openFinanceConfig: _ofcfg,
    summarizeB3: _b3RecalcResumo, summarizeOpenFinance: _ofRecalcResumo,
    revokeB3ConsentLocal: function(){ const c=_b3cfg(); if(c.consentimento){ c.consentimento.status="revogado"; c.consentimento.dataRevogacao=new Date().toISOString(); } _b3Log("revogado","consent","Consentimento B3 marcado como revogado (local)"); },
    revokeOpenFinanceConsentLocal: function(){ return OpenFinanceService.revokeLocalConsent(); },
    clearB3MockData: function(){ const b=_b3(); ["posicoes","movimentacoes","garantias","eventosProvisionados","ofertasPublicas","negociacoes"].forEach(k=>b[k]=[]); _b3RecalcResumo(); _b3Log("limpeza","manual","Dados B3 mock limpos"); },
    clearOpenFinanceMockData: function(){ const o=_of(); ["contas","saldos","transacoes","cartoes","faturas","investimentos","creditos"].forEach(k=>o[k]=[]); _ofRecalcResumo(); _ofLog("limpeza","manual","Dados Open Finance mock limpos"); },
    Services: { B3Service, OpenFinanceService }
  });
}
