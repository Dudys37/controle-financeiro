/* ═══════════════════════════════════════════════════════════════
   CONTROLE FINANCEIRO — app.js  v3.0
   Dados padrão, lógica financeira, renderização completa
═══════════════════════════════════════════════════════════════ */

// ── DEFAULTS ──────────────────────────────────────────────────
const DEFAULT = {
  salario:6500, outras:0, saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25},
  metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  cartoes:[
    {nome:'Nubank PF',    limite:3700,  bandeira:'Mastercard', cor:'#820ad1'},
    {nome:'Nubank PJ',    limite:9700,  bandeira:'Mastercard', cor:'#820ad1'},
    {nome:'Mercado Pago', limite:11000, bandeira:'Mastercard', cor:'#009ee3'},
    {nome:'Renner',       limite:7200,  bandeira:'Mastercard', cor:'#e60000'},
    {nome:'Amazon',       limite:2580,  bandeira:'Visa',       cor:'#ff9900'},
    {nome:'SICREDI',      limite:6300,  bandeira:'Visa',       cor:'#006633'},
  ],
  dividas:[
    {nome:'Faculdade', tipo:'Fixo',     cat:'educacao', limCartao:'',
     vals:[0,644.05,644.05,644.05,644.05,644.05,644.05,644.05,400,400,400,400,400,400,400,400,400,400,400,400]},
    {nome:'Claro',     tipo:'Fixo',     cat:'servicos', limCartao:'',
     vals:[120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120]},
    {nome:'DAS',       tipo:'Fixo',     cat:'impostos', limCartao:'',
     vals:[0,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85]},
    {nome:'IR',        tipo:'Fixo',     cat:'impostos', limCartao:'',
     vals:[0,96.47,96.47,96.47,96.47,96.47,96.47,96.47,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PF', tipo:'Variável', cat:'cartao',   limCartao:'Nubank PF',
     vals:[2148.08,366.78,117.34,117.34,117.34,117.34,117.34,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PJ', tipo:'Variável', cat:'cartao',   limCartao:'Nubank PJ',
     vals:[961.41,678.08,678.08,565.09,298.16,298.16,298.16,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'SICREDI',   tipo:'Variável', cat:'cartao',   limCartao:'SICREDI',
     vals:[1370.44,355.26,229.26,74.9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Mercado Pago',tipo:'Variável',cat:'cartao',  limCartao:'Mercado Pago',
     vals:[527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,485.38,485.38,122.63,115.55,0,0,0,0,0,0,0]},
    {nome:'Renner',    tipo:'Variável', cat:'cartao',   limCartao:'Renner',
     vals:[467.86,362.27,314.31,314.31,200.35,200.35,200.35,200.35,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Amazon',    tipo:'Variável', cat:'cartao',   limCartao:'Amazon',
     vals:[105.7,105.7,105.7,105.7,105.7,105.7,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  ativos:[
    {nome:'Tesouro Selic 2027', classe:'Renda Fixa', bucket:'C',  valor:0, indice:'SELIC', pct:100, ticker:'TESOURO SELIC', obs:''},
    {nome:'FII XPML11',         classe:'FII',        bucket:'R',  valor:0, indice:'CDI',   pct:90,  ticker:'XPML11',       obs:''},
    {nome:'IVVB11',             classe:'ETF',        bucket:'A2', valor:0, indice:'CDI',   pct:110, ticker:'IVVB11',       obs:''},
    {nome:'BOVA11',             classe:'ETF',        bucket:'A',  valor:0, indice:'CDI',   pct:100, ticker:'BOVA11',       obs:''},
  ]
};

// ── ESTADO GLOBAL ─────────────────────────────────────────────
let D = JSON.parse(JSON.stringify(DEFAULT));
let selDash = 0;
let CH = {};
let yrCollapsed = {};
let _saveTimer = null;
let isDark = (localStorage.getItem('cf_theme')||'dark') === 'dark';

// ── CONSTANTES ────────────────────────────────────────────────
const CATS = {
  moradia:   {label:'Moradia',    icon:'🏠', cor:'#4a9eff'},
  alimentacao:{label:'Alimentação',icon:'🍽️',cor:'#22c77a'},
  transporte:{label:'Transporte', icon:'🚗', cor:'#f97316'},
  saude:     {label:'Saúde',      icon:'💊', cor:'#e05555'},
  educacao:  {label:'Educação',   icon:'🎓', cor:'#9b7ff4'},
  servicos:  {label:'Serviços',   icon:'📱', cor:'#2dd4bf'},
  impostos:  {label:'Impostos',   icon:'📋', cor:'#f0a020'},
  lazer:     {label:'Lazer',      icon:'🎮', cor:'#78c83a'},
  cartao:    {label:'Cartão',     icon:'💳', cor:'#c84a8e'},
  outros:    {label:'Outros',     icon:'📦', cor:'#72706a'},
};
const ARCA_COLORS = {A:'#4a9eff', R:'#f97316', C:'#9ca3af', A2:'#f0a020'};
const ARCA_NAMES  = {A:'A — Ações Brasileiras', R:'R — Real Estate', C:'C — Caixa', A2:'A — Ativos Internacionais'};
const ARCA_DESC   = {
  A: 'Ações B3 — crescimento de longo prazo',
  R: 'FIIs — renda passiva e exposição imobiliária',
  C: 'Tesouro Selic, CDB, fundos DI — liquidez e proteção',
  A2:'ETFs globais, BDRs — diversificação internacional',
};
const COLORS = ['#e05555','#f0a020','#4a9eff','#9b7ff4','#f97316','#2dd4bf','#78c83a','#c84a8e','#22c77a','#c83a7a','#3a78c8','#e8a020'];

// ── MIGRAÇÃO ──────────────────────────────────────────────────
function migrateData(d) {
  if (!d) return JSON.parse(JSON.stringify(DEFAULT));
  if (!d.cartoes)  d.cartoes  = JSON.parse(JSON.stringify(DEFAULT.cartoes));
  if (!d.ativos)   d.ativos   = JSON.parse(JSON.stringify(DEFAULT.ativos));
  if (!d.arcaMeta) d.arcaMeta = {a:25,r:25,c:25,a2:25};
  if (!d.metaCC)   d.metaCC   = 2000;
  if (!d.meses)    d.meses    = [...DEFAULT.meses];
  if (!d.dividas)  d.dividas  = [];
  d.dividas.forEach(x => {
    if (!x.cat)       x.cat = 'outros';
    if (!x.limCartao) x.limCartao = '';
    if (!x.vals)      x.vals = Array(d.meses.length).fill(0);
    while (x.vals.length < d.meses.length) x.vals.push(0);
  });
  d.ativos.forEach(x => {
    if (!x.indice)          x.indice = 'CDI';
    if (x.pct === undefined) x.pct   = 100;
    if (!x.ticker)          x.ticker = '';
    if (!x.cor)             x.cor    = ARCA_COLORS[x.bucket] || '#4a9eff';
    // Remove campo rentab legado
    delete x.rentab;
  });
  d.cartoes.forEach(c => {
    if (!c.cor) c.cor = '#4a9eff';
  });
  return d;
}

// ── HELPERS FINANCEIROS ───────────────────────────────────────
const nm       = () => D.meses.length;
const totalE   = () => (D.salario||0) + (D.outras||0);
const totalDiv = i  => D.dividas.reduce((s,d) => s + (d.vals[i]||0), 0);
const sobraM   = i  => totalE() - totalDiv(i);
const getLimite= d  => { const c=D.cartoes.find(x=>x.nome===d.limCartao); return c?c.limite:0; };

// Disponível para investir — regras de negócio
function calcInvest(mi) {
  const entrada = totalE();
  const contas  = totalDiv(mi);
  const meta    = D.metaCC || 2000;
  const sobra   = entrada - contas;
  if (sobra <= 0)     return {entrada, contas, meta, saldo:0, sobra, regra:'negativo'};
  if (sobra <= meta)  return {entrada, contas, meta, saldo:Math.max(0,sobra-meta), sobra, regra:'menor_meta'};
  return               {entrada, contas, meta, saldo:sobra*0.5, sobra, regra:'maior_meta'};
}
const invDisp  = i  => calcInvest(i).saldo;

// Patrimônio líquido = ativos − passivos (total em aberto cartões)
function patrimonioLiquido() {
  const ativos  = D.ativos.reduce((s,a) => s+(a.valor||0), 0);
  const passivos= D.dividas.filter(d=>d.cat==='cartao').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  return { ativos, passivos, liquido: ativos - passivos };
}

// Score financeiro 0-100
function scoreFinanceiro() {
  const n = nm();
  if (!n) return 50;
  const totE   = totalE() * n;
  const totD   = D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const ativos = D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const caixa  = caixaAtual();
  const metaE  = metaEmergencia();
  const mesesPositivos = D.meses.filter((_,i)=>sobraM(i)>=0).length;
  let score = 0;
  score += Math.min(30, Math.round((mesesPositivos/n)*30)); // % meses positivos
  score += Math.min(25, Math.round(Math.max(0,1-(totD/totE))*25)); // % renda livre de dívidas
  score += Math.min(25, metaE>0?Math.min(25,Math.round((caixa/metaE)*25)):0); // emergência
  score += Math.min(20, ativos>0?Math.min(20,Math.round((ativos/(totalE()*12))*20)):0); // patrimônio
  return Math.min(100, score);
}

// ARCA helpers
function caixaAtual()     { return D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0); }
function custoFixoMensal(){ return D.dividas.filter(d=>d.tipo==='Fixo').reduce((s,d)=>s+(d.vals[0]||0),0); }
function metaEmergencia() { return custoFixoMensal() * 6; }
function arcaBloqueado()  { return caixaAtual() - metaEmergencia() < 0; }

// Taxa de juros anual de um ativo
function taxaAnual(a) {
  const base = a.indice==='SELIC' ? (D.cdi12||14.80) :
               a.indice==='IPCA'  ? (D.ipca12||4.14)  :
               (D.cdi12||14.80); // CDI default
  return (base * (a.pct||100) / 100) / 100;
}
function projetar(valor, taxa, anos) { return valor * Math.pow(1+taxa, anos); }

// Anos no planejamento
function getYears() {
  const s = new Set();
  D.meses.forEach(m => { const p=m.match(/\/(\d+)/); if(p) s.add('20'+p[1]); });
  return [...s].sort();
}
function getMesesAno(yr) {
  return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes('/'+yr.slice(2)));
}

// ── FORMATAÇÃO ────────────────────────────────────────────────
const fmt  = v => isNaN(v)||v===null ? '—' : 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
const fmtP = v => Number(v).toFixed(2)+'%';
const fmtPct = (v,t) => t>0 ? Math.round((v/t)*100)+'%' : '0%';
const shortM = m => { const p=m.split('/'); return (p[0]||m).substring(0,3); };

// ── CHART HELPERS ─────────────────────────────────────────────
const gc = () => getComputedStyle(document.documentElement).getPropertyValue('--gc').trim();
const tc = () => getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
const dc = id => { if(CH[id]){ CH[id].destroy(); delete CH[id]; } };

function chartScale(labelFn) {
  return {
    x:{ grid:{color:gc()}, ticks:{color:tc(),font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:10, callback:labelFn||undefined} },
    y:{ grid:{color:gc()}, ticks:{color:tc(),callback:v=>fmtK(v)} }
  };
}
const CHART_OPTS = { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
  plugins:{ legend:{position:'bottom',labels:{color:()=>tc(),font:{size:10},boxWidth:10,padding:8}} } };

// ── TEMA ──────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark?'dark':'light');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}
function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem('cf_theme', isDark?'dark':'light');
  applyTheme();
  Object.keys(CH).forEach(dc);
  renderAll();
}

// ── AUTO-SAVE (debounced) ─────────────────────────────────────
function scheduleAutoSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    if (window._firestoreSave) window._firestoreSave(false); // silent save
  }, 1500);
}

// ── ROTEAMENTO ────────────────────────────────────────────────
function go(id, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  const page = document.getElementById('page-'+id);
  if (page) page.classList.add('on');
  if (el) el.classList.add('on');
  // Render só a aba ativa
  renderPage(id);
}
function renderPage(id) {
  if (id==='dash')      { renderDashboard(); }
  else if (id==='carteira') { renderCarteira(); }
  else if (id==='saidas')   { renderSaidasAtiva(); }
  else if (id==='invest')   { renderInvestAtiva(); }
  else if (id==='perfil')   { if(window._renderPerfil) window._renderPerfil(); }
  else if (id==='admin')    { if(window._renderAdmin)  window._renderAdmin(); }
}
function renderAll() {
  // Descobre qual aba está ativa
  const active = document.querySelector('.page.on');
  const id = active ? active.id.replace('page-','') : 'dash';
  renderPage(id);
  scheduleStatusBar();
}

// Sub-abas
function switchSub(pageId, subId, el) {
  document.querySelectorAll(`#page-${pageId} .subpage`).forEach(p=>p.classList.remove('on'));
  document.querySelectorAll(`#page-${pageId} .stab`).forEach(t=>t.classList.remove('on'));
  const sub = document.getElementById('sub-'+subId);
  if (sub) sub.classList.add('on');
  if (el) el.classList.add('on');
  // Render sub-aba
  if (pageId==='saidas') renderSaidaSub(subId);
  else if (pageId==='invest') renderInvestSub(subId);
}

function getActiveSub(pageId) {
  const active = document.querySelector(`#page-${pageId} .subpage.on`);
  return active ? active.id.replace('sub-','') : null;
}

function renderSaidasAtiva()  { renderSaidaSub(getActiveSub('saidas')||'fixas'); }
function renderInvestAtiva()  { renderInvestSub(getActiveSub('invest')||'visao'); }

function renderSaidaSub(id) {
  if (id==='fixas')     renderSaidas('Fixo','div-fixas-table');
  if (id==='variaveis') renderSaidas('Variável','div-var-table');
  if (id==='periodos')  renderPeriodos();
}
function renderInvestSub(id) {
  if (id==='visao')      renderInvestVisao();
  if (id==='arca')       renderArca();
  if (id==='carteira-inv') renderAtivos();
  if (id==='indicadores')  renderIndicadores();
}

// Status bar
function scheduleStatusBar() {
  const sb = document.getElementById('status-bar');
  if (!sb) return;
  const score = scoreFinanceiro();
  const pl = patrimonioLiquido();
  const scoreCor = score>=70?'var(--green)':score>=40?'var(--amber)':'var(--red)';
  sb.innerHTML = `
    <div style="display:flex;align-items:center;gap:20px;font-size:11px;color:var(--text2);flex-wrap:wrap">
      <span>💰 Entradas: <strong style="color:var(--green)">${fmt(totalE())}/mês</strong></span>
      <span>📊 Patrimônio líquido: <strong style="color:var(--teal)">${fmt(pl.liquido)}</strong></span>
      <span>🎯 Score: <strong style="color:${scoreCor}">${score}/100</strong></span>
      <span style="margin-left:auto;font-size:10px;color:var(--text3)" id="last-saved"></span>
    </div>`;
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const sub = getActiveSub('dash') || 'geral';
  if (sub==='geral') renderGeral();
  else renderMes();
}

function renderGeral() {
  const n = nm();
  const totE = totalE()*n;
  const totD = D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const totInv = D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const totS = D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  const score = scoreFinanceiro();
  const pl = patrimonioLiquido();
  const caixa = caixaAtual();
  const metaE = metaEmergencia();
  const pctE = metaE>0 ? Math.min(100,Math.round((caixa/metaE)*100)) : 0;
  const scoreCor = score>=70?'#22c77a':score>=40?'#f0a020':'#e05555';

  const hero = document.getElementById('annual-hero');
  if (hero) hero.innerHTML = `
    <div class="hero-card hg">
      <div class="hero-lbl">Total entradas</div>
      <div class="hero-val g">${fmtK(totE)}</div>
      <div class="hero-sub">${n} meses × ${fmtK(totalE())}</div>
    </div>
    <div class="hero-card hr">
      <div class="hero-lbl">Total dívidas</div>
      <div class="hero-val r">${fmtK(totD)}</div>
      <div class="hero-sub">${fmtPct(totD,totE)} da renda</div>
    </div>
    <div class="hero-card ht">
      <div class="hero-lbl">Disponível p/ investir</div>
      <div class="hero-val t">${fmtK(totInv)}</div>
      <div class="hero-sub">regras de alocação aplicadas</div>
    </div>
    <div class="hero-card ${totS>=0?'hg':'hr'}">
      <div class="hero-lbl">Sobra acumulada</div>
      <div class="hero-val ${totS>=0?'g':'r'}">${fmtK(totS)}</div>
      <div class="hero-sub">ao fim do período</div>
    </div>
    <div class="hero-card" style="position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${scoreCor}"></div>
      <div class="hero-lbl">Score financeiro</div>
      <div class="hero-val" style="color:${scoreCor};font-size:32px">${score}</div>
      <div class="hero-sub">de 100 pontos</div>
      <div style="height:4px;background:var(--s3);border-radius:2px;margin-top:6px;overflow:hidden">
        <div style="height:4px;width:${score}%;background:${scoreCor};border-radius:2px;transition:width .5s"></div>
      </div>
    </div>
    <div class="hero-card hp">
      <div class="hero-lbl">Patrimônio líquido</div>
      <div class="hero-val ${pl.liquido>=0?'p':'r'}">${fmtK(pl.liquido)}</div>
      <div class="hero-sub">ativos − passivos</div>
    </div>
    <div class="hero-card ${pctE>=100?'hg':pctE>=50?'ha':'hr'}">
      <div class="hero-lbl">Reserva de emergência</div>
      <div class="hero-val ${pctE>=100?'g':pctE>=50?'a':'r'}">${pctE}%</div>
      <div class="hero-sub">meta: ${fmtK(metaE)} (6 meses)</div>
      <div style="height:4px;background:var(--s3);border-radius:2px;margin-top:6px;overflow:hidden">
        <div style="height:4px;width:${Math.min(100,pctE)}%;background:${pctE>=100?'var(--green)':pctE>=50?'var(--amber)':'var(--red)'};border-radius:2px"></div>
      </div>
    </div>
  `;

  renderYearBlocks();
  renderFluxoTable();
  renderGeralCharts();
  renderCartoesTo(document.getElementById('annual-cartoes'), 0);
}

function renderFluxoTable() {
  const ft = document.getElementById('fluxo-table');
  if (!ft) return;
  const yrs = getYears();
  const rows = D.meses.map((m,i) => {
    const e=totalE(), d=totalDiv(i), inv=invDisp(i), s=sobraM(i);
    const r = calcInvest(i);
    const icon = r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
    const yr = m.match(/\/(\d+)/); const yrN = yr?'20'+yr[1]:'';
    const clr = yrs[0]===yrN?'rgba(74,158,255,.3)':'rgba(155,127,244,.3)';
    return `<tr style="border-left:3px solid ${clr}">
      <td style="font-weight:500">${m}</td>
      <td class="tr pos">${fmt(e)}</td>
      <td class="tr neg">${fmt(d)}</td>
      <td class="tr" style="color:var(--text2)">${fmt(s)}</td>
      <td class="tr grd">${fmt(inv)} <span title="${r.regra==='maior_meta'?'Sobra>meta: 50% da sobra':r.regra==='menor_meta'?'Sobra≤meta: sobra−meta':'Contas>entradas'}">${icon}</span></td>
    </tr>`;
  }).join('');
  const tD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const tInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const tS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  ft.innerHTML=`<thead><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Dívidas</th>
    <th class="tr">Sobra bruta</th>
    <th class="tr" style="color:var(--teal)">💰 P/ investir</th>
  </tr></thead><tbody>${rows}
  <tr style="background:var(--s2);font-weight:700">
    <td>Total</td><td></td>
    <td class="tr neg">${fmt(tD)}</td>
    <td class="tr ${tS>=0?'pos':'neg'}">${fmt(tS)}</td>
    <td class="tr grd">${fmt(tInv)}</td>
  </tr></tbody>`;
}

function renderGeralCharts() {
  // Dívidas por categoria (doughnut)
  dc('annualDough');
  const catTots = {};
  D.dividas.forEach(d => {
    const cat = d.cat||'outros';
    const tot = d.vals.reduce((s,v)=>s+(v||0),0);
    catTots[cat] = (catTots[cat]||0)+tot;
  });
  const catEntries = Object.entries(catTots).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
  const cAD = document.getElementById('cAnnualDough');
  if (cAD) CH['annualDough'] = new Chart(cAD, {
    type:'doughnut',
    data:{
      labels: catEntries.map(([k])=>CATS[k]?.label||k),
      datasets:[{ data:catEntries.map(([,v])=>v), backgroundColor:catEntries.map(([k])=>CATS[k]?.cor||'#888'), borderWidth:0, hoverOffset:8 }]
    },
    options:{...CHART_OPTS, cutout:'62%', plugins:{...CHART_OPTS.plugins, tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}}
  });

  // Ranking
  const rank = document.getElementById('annual-rank');
  if (rank) {
    const tots = D.dividas.map(d=>({nome:d.nome,total:d.vals.reduce((s,v)=>s+(v||0),0),cat:d.cat}))
      .filter(d=>d.total>0).sort((a,b)=>b.total-a.total);
    const maxT = tots[0]?.total||1;
    rank.innerHTML = tots.map((d,i) => {
      const cor = CATS[d.cat]?.cor||'var(--text3)';
      const icon = CATS[d.cat]?.icon||'📦';
      return `<div class="rank-row">
        <span class="rank-num">${i+1}</span>
        <span style="font-size:14px">${icon}</span>
        <span class="rank-name">${d.nome}</span>
        <div class="rank-bar-bg"><div class="rank-bar-fg" style="width:${Math.round((d.total/maxT)*100)}%;background:${cor}"></div></div>
        <span class="rank-val neg">${fmt(d.total)}</span>
      </div>`;
    }).join('');
  }

  // Evolução dívidas linha
  dc('evol');
  const cEv = document.getElementById('cEvol');
  if (cEv) CH['evol'] = new Chart(cEv, {
    type:'line',
    data:{
      labels:D.meses.map(shortM),
      datasets:D.dividas.map((d,idx)=>({
        label:d.nome, data:d.vals.map(v=>v||0),
        borderColor:COLORS[idx%COLORS.length], backgroundColor:'transparent',
        tension:.35, pointRadius:2, borderWidth:1.5
      }))
    },
    options:{...CHART_OPTS, scales:chartScale()}
  });
}

// Anos colapsáveis
function toggleYr(yr) { yrCollapsed[yr]=!yrCollapsed[yr]; renderYearBlocks(); }

function renderYearBlocks() {
  const container = document.getElementById('year-blocks');
  if (!container) return;
  container.innerHTML = '';
  getYears().forEach((yr,yi) => {
    const meses = getMesesAno(yr);
    if (!meses.length) return;
    const totE  = totalE()*meses.length;
    const totD  = meses.reduce((s,{i})=>s+totalDiv(i),0);
    const totInv= meses.reduce((s,{i})=>s+invDisp(i),0);
    const totS  = meses.reduce((s,{i})=>s+sobraM(i),0);
    const isCol = yrCollapsed[yr]!==false;
    const pill  = yi===0?'y26':'y27';
    const block = document.createElement('div');
    block.className='yr-block mb';
    block.innerHTML=`
      <div class="yr-header" onclick="toggleYr('${yr}')">
        <div class="yr-title">
          <span class="yr-pill ${pill}">${yr}</span>
          <span style="color:var(--text2);font-size:12px">${meses.length} meses</span>
        </div>
        <div class="yr-meta">
          <span>Entrada <strong style="color:var(--green)">${fmtK(totE)}</strong></span>
          <span>Dívidas <strong style="color:var(--red)">${fmtK(totD)}</strong></span>
          <span>P/ Investir <strong style="color:var(--teal)">${fmtK(totInv)}</strong></span>
          <span>Sobra <strong style="color:${totS>=0?'var(--green)':'var(--red)'}">${fmtK(totS)}</strong></span>
        </div>
        <span class="yr-chevron${isCol?'':' open'}">▾</span>
      </div>
      <div class="yr-body${isCol?' hidden':''}" id="yr-body-${yr}">
        <div class="timeline" id="tl-${yr}" style="margin:12px 0 8px"></div>
        <div class="grid2 mb">
          <div class="panel"><h3>Dívidas vs Disponível — ${yr}</h3><div style="height:190px;position:relative"><canvas id="cBar${yr}"></canvas></div></div>
          <div class="panel"><h3>Sobra acumulada — ${yr}</h3><div style="height:190px;position:relative"><canvas id="cAcum${yr}"></canvas></div></div>
        </div>
      </div>`;
    container.appendChild(block);

    // Timeline
    const tl = document.getElementById('tl-'+yr);
    if (tl) tl.innerHTML = meses.map(({m,i})=>{
      const s=sobraM(i);
      return `<div class="tl-cell ${s>=0?'tl-pos':'tl-neg'}">
        <div class="tl-mes">${shortM(m)}</div>
        <div class="tl-val ${s>=0?'pos':'neg'}">${fmtK(s)}</div>
        <div style="font-size:9px;color:var(--text3)">${fmtK(invDisp(i))}</div>
      </div>`;
    }).join('');

    // Charts
    if (!isCol) {
      dc('cBar'+yr); dc('cAcum'+yr);
      const cB = document.getElementById('cBar'+yr);
      if (cB) CH['cBar'+yr]=new Chart(cB,{type:'bar',data:{
        labels:meses.map(x=>shortM(x.m)),
        datasets:[
          {label:'Dívidas',   data:meses.map(x=>totalDiv(x.i)), backgroundColor:'rgba(224,85,85,.8)', borderRadius:3},
          {label:'P/ Invest.',data:meses.map(x=>invDisp(x.i)),  backgroundColor:'rgba(45,212,191,.8)', borderRadius:3},
          {label:'Sobra',     data:meses.map(x=>sobraM(x.i)),   backgroundColor:'rgba(34,199,122,.3)', borderRadius:3,type:'line',borderColor:'#22c77a',pointRadius:3,fill:false},
        ]
      },options:{...CHART_OPTS, scales:chartScale()}});

      let acc=0;
      const acumArr=meses.map(({i})=>{acc+=sobraM(i);return Math.round(acc*100)/100;});
      const cA=document.getElementById('cAcum'+yr);
      if(cA) CH['cAcum'+yr]=new Chart(cA,{type:'line',data:{
        labels:meses.map(x=>shortM(x.m)),
        datasets:[{data:acumArr, borderColor:yi===0?'#4a9eff':'#9b7ff4', backgroundColor:yi===0?'rgba(74,158,255,.1)':'rgba(155,127,244,.1)', tension:.4, fill:true, pointRadius:4, borderWidth:2,
          pointBackgroundColor:acumArr.map(v=>v>=0?'#22c77a':'#e05555')}]
      },options:{...CHART_OPTS, plugins:{legend:{display:false}}, scales:chartScale()}});
    }
  });
}

// ── POR MÊS ───────────────────────────────────────────────────
function renderMes() {
  const i = selDash;
  const e=totalE(), d=totalDiv(i), s=sobraM(i);
  const inv=invDisp(i), r=calcInvest(i);
  const pl=patrimonioLiquido();
  const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
  const dscr=r.regra==='maior_meta'?`50% de ${fmt(r.sobra)}`:r.regra==='menor_meta'?`${fmt(r.sobra)} − meta CC`:'contas > entradas';

  document.getElementById('dash-sec').textContent='Resumo — '+(D.meses[i]||'');
  buildMonths('dash-months', i, j=>{selDash=j;renderMes();});

  const top=document.getElementById('dash-cards-top');
  if(top) top.innerHTML=`
    <div class="card"><div class="card-lbl">Entradas</div><div class="card-val g">${fmt(e)}</div></div>
    <div class="card"><div class="card-lbl">Total dívidas</div><div class="card-val r">${fmt(d)}</div><div class="card-sub">${fmtPct(d,e)} da renda</div></div>
    <div class="card"><div class="card-lbl">Sobra bruta</div><div class="card-val ${s>=0?'g':'r'}">${fmt(s)}</div></div>
    <div class="card" style="border-color:rgba(45,212,191,.3);background:var(--teal-bg)">
      <div class="card-lbl" style="color:var(--teal)">${icon} P/ investir</div>
      <div class="card-val t">${fmt(inv)}</div>
      <div class="card-sub">${dscr}</div>
    </div>
    <div class="card"><div class="card-lbl">Saldo CC</div><div class="card-val a">${fmt(D.saldo)}</div></div>
    <div class="card"><div class="card-lbl">Patrimônio líquido</div><div class="card-val ${pl.liquido>=0?'p':'r'}">${fmt(pl.liquido)}</div></div>
  `;

  // Cards por categoria de gasto
  const catDiv=document.getElementById('dash-cards-div');
  if(catDiv){
    const cats={};
    D.dividas.forEach(dv=>{
      const v=dv.vals[i]||0;
      if(!v)return;
      const c=dv.cat||'outros';
      if(!cats[c])cats[c]={total:0,items:[]};
      cats[c].total+=v;
      cats[c].items.push({nome:dv.nome,v});
    });
    catDiv.innerHTML=Object.entries(cats).sort(([,a],[,b])=>b.total-a.total).map(([cat,{total,items}])=>{
      const info=CATS[cat]||CATS.outros;
      return `<div class="card">
        <div class="card-lbl">${info.icon} ${info.label}</div>
        <div class="card-val r" style="font-size:16px">${fmt(total)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">${items.map(x=>x.nome+': '+fmt(x.v)).join(' · ')}</div>
      </div>`;
    }).join('');
  }

  renderCartoesTo(document.getElementById('dash-cartoes'),i);
  renderMesCharts(i);
}

function buildMonths(cid, sel, cb) {
  const el=document.getElementById(cid);if(!el)return;
  el.innerHTML=D.meses.map((m,i)=>`<button class="msb${i===sel?' on':''}" onclick="(${cb.toString()})(${i})">${shortM(m)}</button>`).join('');
}

function renderMesCharts(i) {
  const n=nm();
  const divA=Array.from({length:n},(_,j)=>totalDiv(j));
  const invA=Array.from({length:n},(_,j)=>invDisp(j));
  const fixT=D.dividas.filter(d=>d.tipo==='Fixo').reduce((s,d)=>s+(d.vals[i]||0),0);
  const varT=D.dividas.filter(d=>d.tipo==='Variável').reduce((s,d)=>s+(d.vals[i]||0),0);
  const invT=invDisp(i);
  const catTots={};
  D.dividas.forEach(d=>{const v=d.vals[i]||0;if(v){const c=d.cat||'outros';catTots[c]=(catTots[c]||0)+v;}});

  dc('fluxo');
  const cFl=document.getElementById('cFluxo');
  if(cFl) CH['fluxo']=new Chart(cFl,{type:'bar',data:{
    labels:D.meses.map(shortM),
    datasets:[
      {label:'Dívidas',    data:divA, backgroundColor:'rgba(224,85,85,.75)',  borderRadius:3},
      {label:'P/ Investir',data:invA, backgroundColor:'rgba(45,212,191,.75)', borderRadius:3},
    ]
  },options:{...CHART_OPTS,scales:chartScale()}});

  dc('tipo');
  const cTi=document.getElementById('cTipo');
  if(cTi){
    const catE=Object.entries(catTots).filter(([,v])=>v>0);
    CH['tipo']=new Chart(cTi,{type:'doughnut',data:{
      labels:catE.map(([k])=>CATS[k]?.icon+' '+(CATS[k]?.label||k)),
      datasets:[{data:catE.map(([,v])=>v), backgroundColor:catE.map(([k])=>CATS[k]?.cor||'#888'), borderWidth:0, hoverOffset:6}]
    },options:{...CHART_OPTS,cutout:'58%',plugins:{...CHART_OPTS.plugins,tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}}});
  }
}

// ── CARTEIRA ──────────────────────────────────────────────────
function renderCarteira() {
  ['salario','outras','saldo'].forEach(k=>{
    const el=document.getElementById('ef-'+k);
    if(el) el.value=D[k]||0;
  });
  const mcEl=document.getElementById('ef-metaCC');
  if(mcEl) mcEl.value=D.metaCC||2000;

  // Resumo rápido
  const pl=patrimonioLiquido();
  const totalLimites=D.cartoes.reduce((s,c)=>s+(c.limite||0),0);
  const totalAberto=D.dividas.filter(d=>d.cat==='cartao').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  const res=document.getElementById('carteira-resumo');
  if(res) res.innerHTML=`
    <div class="card"><div class="card-lbl">Entradas/mês</div><div class="card-val g">${fmt(totalE())}</div></div>
    <div class="card"><div class="card-lbl">Saldo CC</div><div class="card-val a">${fmt(D.saldo)}</div></div>
    <div class="card"><div class="card-lbl">Limite total cartões</div><div class="card-val b">${fmt(totalLimites)}</div><div class="card-sub">${D.cartoes.length} cartões</div></div>
    <div class="card"><div class="card-lbl">Faturas em aberto</div><div class="card-val r">${fmt(totalAberto)}</div><div class="card-sub">${fmtPct(totalAberto,totalLimites)} do limite</div></div>
    <div class="card"><div class="card-lbl">Total ativos</div><div class="card-val t">${fmt(pl.ativos)}</div></div>
    <div class="card" style="border-color:rgba(155,127,244,.3)"><div class="card-lbl">Patrimônio líquido</div><div class="card-val ${pl.liquido>=0?'p':'r'}">${fmt(pl.liquido)}</div></div>
  `;

  // Cartões
  const ct=document.getElementById('cartoes-edit-table');
  if(ct) {
    const rows=D.cartoes.map((c,ci)=>`<tr>
      <td><input type="text" value="${c.nome}" onchange="D.cartoes[${ci}].nome=this.value" placeholder="Nome"></td>
      <td><select onchange="D.cartoes[${ci}].bandeira=this.value">
        ${['Mastercard','Visa','Elo','Amex','Hipercard'].map(b=>`<option${c.bandeira===b?' selected':''}>${b}</option>`).join('')}
      </select></td>
      <td><input type="number" step="100" value="${c.limite||0}" onchange="D.cartoes[${ci}].limite=parseFloat(this.value)||0" placeholder="Limite"></td>
      <td><button class="btn-rm" onclick="removeCartao(${ci})">✕</button></td>
    </tr>`).join('');
    ct.innerHTML=`<thead><tr><th>Nome</th><th>Bandeira</th><th>Limite (R$)</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }
}

function addCartao()    { D.cartoes.push({nome:'Novo Cartão',bandeira:'Mastercard',limite:0,cor:'#888'}); renderCarteira(); scheduleAutoSave(); }
function removeCartao(i){ if(!confirm(`Remover "${D.cartoes[i].nome}"?`))return; D.cartoes.splice(i,1); renderCarteira(); scheduleAutoSave(); }

// ── SAÍDAS ────────────────────────────────────────────────────
function renderSaidas(tipo, tableId) {
  const el=document.getElementById(tableId);if(!el)return;
  const arr=D.dividas.filter(d=>d.tipo===tipo);
  const catOpts=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  const heads=D.meses.map(m=>`<th style="min-width:70px">${shortM(m)}</th>`).join('');
  const rows=arr.map(d=>{
    const di=D.dividas.indexOf(d);
    const cells=D.meses.map((_,mi)=>
      `<td><input type="number" step="0.01" min="0" value="${d.vals[mi]||''}" placeholder="0"
        onchange="D.dividas[${di}].vals[${mi}]=parseFloat(this.value)||0;scheduleAutoSave()"></td>`
    ).join('');
    const catSel=`<td><select onchange="D.dividas[${di}].cat=this.value;scheduleAutoSave()">${catOpts.replace(`value="${d.cat||'outros'}"`,`value="${d.cat||'outros'}" selected`)}</select></td>`;
    const cartSel=tipo==='Variável'?`<td><select onchange="D.dividas[${di}].limCartao=this.value;scheduleAutoSave()">
      <option value="">— nenhum —</option>
      ${D.cartoes.map(c=>`<option value="${c.nome}"${d.limCartao===c.nome?' selected':''}>${c.nome}</option>`).join('')}
    </select></td>`:'<td>—</td>';
    const tot=d.vals.reduce((s,v)=>s+(v||0),0);
    return `<tr>
      <td style="white-space:nowrap"><input type="text" value="${d.nome}" onchange="D.dividas[${di}].nome=this.value;scheduleAutoSave()" placeholder="Nome" style="min-width:120px"></td>
      ${catSel}${cartSel}
      ${cells}
      <td class="tr" style="white-space:nowrap;font-size:11px;color:var(--text2)">${fmtK(tot)}</td>
      <td><button class="btn-rm" onclick="removeDivida(${di})">✕</button></td>
    </tr>`;
  }).join('');
  const totCol=`<td class="tr bold">${fmtK(arr.reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0))}</td>`;
  el.innerHTML=`<thead><tr><th>Nome</th><th>Categoria</th><th>${tipo==='Variável'?'Cartão':'—'}</th>${heads}<th class="tr">Total</th><th></th></tr></thead><tbody>${rows}</tbody>`;
}

function addDividaTipo(tipo){ D.dividas.push({nome:'Nova conta',tipo,cat:'outros',limCartao:'',vals:Array(nm()).fill(0)}); renderSaidaSub(tipo==='Fixo'?'fixas':'variaveis'); scheduleAutoSave(); }
function removeDivida(i){ if(!confirm(`Remover "${D.dividas[i].nome}"?`))return; D.dividas.splice(i,1); renderSaidasAtiva(); scheduleAutoSave(); }

function renderPeriodos() {
  const el=document.getElementById('meses-list');if(!el)return;
  el.innerHTML=D.meses.map((m,i)=>`<span style="background:var(--s2);border:1px solid var(--border2);border-radius:20px;padding:5px 12px;font-size:12px;color:var(--text2)">${i+1}. ${m}</span>`).join('');
}
function addMes(){ const n=prompt('Mês (ex: Jan/28):');if(!n)return; D.meses.push(n.trim()); D.dividas.forEach(d=>d.vals.push(0)); renderAll(); scheduleAutoSave(); }
function removeMes(){ if(nm()<=1)return; if(!confirm(`Remover "${D.meses[nm()-1]}"?`))return; D.meses.pop(); D.dividas.forEach(d=>d.vals.pop()); if(selDash>=nm())selDash=nm()-1; renderAll(); scheduleAutoSave(); }

// ── INVESTIMENTOS ─────────────────────────────────────────────
function renderInvestVisao() {
  // Cards de disponível p/ investir mês a mês
  const sc=document.getElementById('inv-saldo-cards');
  if(sc){
    const ref=calcInvest(0);
    const icon=ref.regra==='negativo'?'🔴':ref.regra==='menor_meta'?'🟡':'🟢';
    const pl=patrimonioLiquido();
    sc.innerHTML=`
      <div class="card"><div class="card-lbl">Entradas/mês</div><div class="card-val g">${fmt(ref.entrada)}</div></div>
      <div class="card"><div class="card-lbl">Contas mês 1</div><div class="card-val r">${fmt(ref.contas)}</div></div>
      <div class="card"><div class="card-lbl">Meta CC</div><div class="card-val a">${fmt(ref.meta)}</div></div>
      <div class="card" style="border-color:rgba(45,212,191,.3);background:var(--teal-bg)">
        <div class="card-lbl" style="color:var(--teal)">${icon} P/ investir (mês 1)</div>
        <div class="card-val t">${fmt(ref.saldo)}</div>
      </div>
      <div class="card"><div class="card-lbl">Total ativos</div><div class="card-val t">${fmt(pl.ativos)}</div></div>
      <div class="card"><div class="card-lbl">Patrimônio líquido</div><div class="card-val ${pl.liquido>=0?'p':'r'}">${fmt(pl.liquido)}</div></div>
    `;
  }

  // Tabela mês a mês
  const mt=document.getElementById('inv-mes-table');
  if(mt){
    const rows=D.meses.map((m,i)=>{
      const r=calcInvest(i);
      const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
      return `<tr>
        <td style="font-weight:500">${m}</td>
        <td class="tr pos">${fmt(r.entrada)}</td>
        <td class="tr neg">${fmt(r.contas)}</td>
        <td class="tr" style="color:var(--text2)">${fmt(r.sobra)}</td>
        <td class="tr">${icon}</td>
        <td class="tr grd" style="font-weight:600">${fmt(r.saldo)}</td>
      </tr>`;
    }).join('');
    const totSaldo=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
    mt.innerHTML=`<thead><tr><th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th><th class="tr">Sobra</th><th class="tr">Regra</th><th class="tr" style="color:var(--teal)">💰 P/ Investir</th></tr></thead>
    <tbody>${rows}<tr style="font-weight:700;background:var(--s2)"><td>Total</td><td></td><td></td><td></td><td></td><td class="tr grd">${fmt(totSaldo)}</td></tr></tbody>`;
  }
}

// ARCA
function renderArca() {
  const buckets=['A','R','C','A2'];
  const totAtivos=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const bloqueado=arcaBloqueado();
  const caixaAtu=caixaAtual();
  const metaE=metaEmergencia();
  const pctEmerg=metaE>0?Math.min(100,Math.round((caixaAtu/metaE)*100)):0;

  const alertEl=document.getElementById('arca-alert');
  if(alertEl){
    if(bloqueado){
      alertEl.style.display='';
      alertEl.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start">
        <span style="font-size:24px">⚠️</span>
        <div>
          <div style="font-weight:600;color:var(--amber);margin-bottom:4px">Reserva de emergência insuficiente</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.7">
            Custo fixo mensal: <strong>${fmt(custoFixoMensal())}</strong> · Meta 6 meses: <strong>${fmt(metaE)}</strong><br>
            Caixa atual: <strong style="color:var(--teal)">${fmt(caixaAtu)}</strong> · ${pctEmerg}% da meta
          </div>
          <div style="margin-top:8px;max-width:300px">
            <div style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden">
              <div style="height:6px;width:${pctEmerg}%;background:var(--amber);border-radius:3px"></div>
            </div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px">
              <strong style="color:var(--amber)">Recomendação: 100% em C — Caixa até atingir a meta.</strong>
            </div>
          </div>
        </div>
      </div>`;
    } else { alertEl.style.display='none'; }
  }

  // Cards ARCA
  const cards=document.getElementById('arca-cards');
  if(cards) cards.innerHTML=buckets.map(b=>{
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pct=totAtivos>0?Math.round((valB/totAtivos)*100):0;
    const meta=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    const diff=pct-meta;
    const diffCor=diff===0?'var(--green)':diff>0?'var(--amber)':'var(--red)';
    const diffStr=diff===0?'✓ na meta':diff>0?`+${diff}pp acima`:`${diff}pp abaixo`;
    return `<div class="arca-card arca-${b}">
      <div class="arca-lbl">${ARCA_NAMES[b]}</div>
      <div class="arca-desc">${ARCA_DESC[b]}</div>
      <div class="arca-val">${fmt(valB)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span style="font-size:11px;color:var(--text2)">${pct}% · meta ${meta}%</span>
        <span style="font-size:11px;color:${diffCor};font-weight:600">${diffStr}</span>
      </div>
      <div style="height:4px;background:var(--s3);border-radius:2px;margin-top:6px;overflow:hidden">
        <div style="height:4px;width:${Math.min(100,pct)}%;background:${ARCA_COLORS[b]};border-radius:2px"></div>
      </div>
    </div>`;
  }).join('');

  // Doughnut
  dc('arcaDough');
  const cAD=document.getElementById('cArcaDough');
  if(cAD){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    const metas=buckets.map(b=>{const m=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);return totAtivos*(m/100);});
    CH['arcaDough']=new Chart(cAD,{type:'doughnut',data:{
      labels:buckets.map(b=>ARCA_NAMES[b]),
      datasets:[
        {label:'Atual',data:vals,backgroundColor:buckets.map(b=>ARCA_COLORS[b]),borderWidth:0,hoverOffset:8},
      ]
    },options:{...CHART_OPTS,cutout:'60%',plugins:{...CHART_OPTS.plugins,tooltip:{callbacks:{label:c=>' '+fmt(c.raw)+` (${totAtivos>0?Math.round((c.raw/totAtivos)*100):0}%)`}}}}});
  }

  // Meta config
  const mc=document.getElementById('arca-meta-config');
  if(mc) mc.innerHTML=buckets.map(b=>{
    const meta=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pct=totAtivos>0?Math.round((valB/totAtivos)*100):0;
    return `<div class="prog-item">
      <div class="prog-header">
        <span class="prog-name" style="color:${ARCA_COLORS[b]}">${ARCA_NAMES[b]}</span>
        <span class="prog-vals">${pct}% atual · ${meta}% meta</span>
      </div>
      <div class="prog-bar-bg">
        <div class="prog-bar-fg" style="width:${pct}%;background:${ARCA_COLORS[b]}"></div>
      </div>
    </div>`;
  }).join('');

  // Bar atual vs meta
  dc('arcaBar');
  const cAB=document.getElementById('cArcaBar');
  if(cAB){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    const metas=buckets.map(b=>{const m=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);return totAtivos*(m/100);});
    CH['arcaBar']=new Chart(cAB,{type:'bar',data:{
      labels:buckets.map(b=>ARCA_NAMES[b]),
      datasets:[
        {label:'Atual (R$)', data:vals,  backgroundColor:buckets.map(b=>ARCA_COLORS[b]+'cc'), borderRadius:4},
        {label:'Meta (R$)',  data:metas, backgroundColor:'rgba(255,255,255,.06)', borderColor:'rgba(255,255,255,.2)', borderWidth:1, borderRadius:4},
      ]
    },options:{...CHART_OPTS,scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}}}});
  }
}

// Carteira de ativos
function renderAtivos() {
  // Cards de disponível
  renderInvestVisao();

  const el=document.getElementById('ativos-table');
  if(el){
    const classes=['Renda Fixa','Renda Variável','FII','Ações','ETF','Cripto','Previdência','Outro'];
    const buckets=['A','R','C','A2'];
    const arcaLbl={'A':'A — Ações Bras.','R':'R — Real Estate','C':'C — Caixa','A2':'A — Internacionais'};
    const indices=['CDI','SELIC','IPCA'];
    const rows=D.ativos.map((a,ai)=>`<tr>
      <td><input type="text" value="${a.nome}" onchange="D.ativos[${ai}].nome=this.value;scheduleAutoSave()" placeholder="Nome" style="width:140px"></td>
      <td><select onchange="D.ativos[${ai}].classe=this.value;scheduleAutoSave()">${classes.map(c=>`<option${a.classe===c?' selected':''}>${c}</option>`).join('')}</select></td>
      <td><select onchange="D.ativos[${ai}].bucket=this.value;scheduleAutoSave()">${buckets.map(b=>`<option value="${b}"${a.bucket===b?' selected':''}>${arcaLbl[b]}</option>`).join('')}</select></td>
      <td><input type="number" step="0.01" min="0" value="${a.valor||''}" placeholder="0"
        onchange="D.ativos[${ai}].valor=parseFloat(this.value)||0;scheduleAutoSave();renderAtivos()" style="width:110px;text-align:right"></td>
      <td><select onchange="D.ativos[${ai}].indice=this.value;scheduleAutoSave();renderAtivos()" style="width:80px">${indices.map(ind=>`<option${a.indice===ind?' selected':''}>${ind}</option>`).join('')}</select></td>
      <td><input type="number" step="0.1" min="0" value="${a.pct||100}" placeholder="100"
        onchange="D.ativos[${ai}].pct=parseFloat(this.value)||100;scheduleAutoSave();renderAtivos()" style="width:70px;text-align:right"></td>
      <td style="color:var(--text2);font-size:11px;white-space:nowrap">${fmtP(taxaAnual(a)*100)}/ano</td>
      <td><input type="text" value="${a.ticker||''}" onchange="D.ativos[${ai}].ticker=this.value;scheduleAutoSave()" placeholder="Ticker" style="width:80px"></td>
      <td><button class="btn-rm" onclick="removeAtivo(${ai})">✕</button></td>
    </tr>`).join('');
    el.innerHTML=`<thead><tr><th>Ativo</th><th>Classe</th><th>Bucket ARCA</th><th class="tr">Valor (R$)</th><th>Índice</th><th>% índice</th><th>Taxa efetiva</th><th>Ticker</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  // Resumo por bucket
  const res=document.getElementById('ativos-resumo');
  if(res){
    const total=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
    const byBucket={'A':0,'R':0,'C':0,'A2':0};
    D.ativos.forEach(a=>{byBucket[a.bucket]=(byBucket[a.bucket]||0)+(a.valor||0);});
    const arcaLbl={'A':'A — Ações','R':'R — Real Estate','C':'C — Caixa','A2':'A — Internacionais'};
    res.innerHTML=`
      <div class="card"><div class="card-lbl">Total carteira</div><div class="card-val t">${fmt(total)}</div></div>
      ${Object.entries(byBucket).filter(([,v])=>v>0).map(([b,v])=>`
        <div class="card" style="border-color:${ARCA_COLORS[b]}33">
          <div class="card-lbl" style="color:${ARCA_COLORS[b]}">${arcaLbl[b]}</div>
          <div class="card-val" style="font-size:17px">${fmt(v)}</div>
          <div class="card-sub">${total>0?Math.round((v/total)*100):0}% da carteira</div>
        </div>`).join('')}
    `;
  }

  // Projeções
  renderProjecoes();
}

function renderProjecoes() {
  const proj=document.getElementById('proj-table');
  if(!proj)return;
  const ANOS=[1,2,3,5,10,20,30];
  const ativos=D.ativos.filter(a=>(a.valor||0)>0);
  const atTotal=ativos.reduce((s,a)=>s+(a.valor||0),0);
  const taxaMedia=atTotal>0?ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTotal:0;
  const heads=ANOS.map(a=>`<th class="tr">${a}a</th>`).join('');
  const rows=[...ativos, {nome:'<strong>Total</strong>',valor:atTotal,_taxa:taxaMedia,_tot:true}].map(a=>{
    const taxa=a._taxa!==undefined?a._taxa:taxaAnual(a);
    const cols=ANOS.map(n=>{
      const v=projetar(a.valor||0,taxa,n);
      const g=v-(a.valor||0);
      return `<td class="tr">
        <div style="font-weight:600;color:var(--green)">${fmtK(v)}</div>
        <div style="font-size:9px;color:var(--text3)">+${fmtK(g)}</div>
      </td>`;
    }).join('');
    const sub=a._tot?`taxa média: ${fmtP(taxa*100)}`:`${a.indice} ${a.pct}% = ${fmtP(taxa*100)}/a`;
    return `<tr${a._tot?' style="background:var(--s2);font-weight:700"':''}>
      <td>${a.nome}<div style="font-size:10px;color:var(--text3)">${sub}</div></td>
      <td class="tr">${fmtK(a.valor||0)}</td>
      ${cols}
    </tr>`;
  }).join('');
  proj.innerHTML=`<thead><tr><th>Ativo</th><th class="tr">Atual</th>${heads}</tr></thead><tbody>${rows}</tbody>`;

  // Gráfico
  dc('projLine');
  const cPL=document.getElementById('cProjLine');
  if(cPL){
    const ANOS_C=[0,1,2,3,5,10,20,30];
    const datasets=ativos.map((a,idx)=>({
      label:a.ticker||a.nome, data:ANOS_C.map(n=>Math.round(projetar(a.valor||0,taxaAnual(a),n))),
      borderColor:COLORS[idx%COLORS.length], backgroundColor:'transparent', tension:.4, pointRadius:3, borderWidth:2
    }));
    datasets.push({label:'Total', data:ANOS_C.map(n=>Math.round(projetar(atTotal,taxaMedia,n))),
      borderColor:'#22c77a', backgroundColor:'rgba(34,199,122,.08)', tension:.4, pointRadius:4, borderWidth:3, fill:true});
    CH['projLine']=new Chart(cPL,{type:'line',data:{labels:ANOS_C.map(a=>a===0?'Hoje':`${a}a`),datasets},
      options:{...CHART_OPTS,scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}}}});
  }
}

function addAtivo()    { D.ativos.push({nome:'Novo ativo',classe:'Renda Fixa',bucket:'C',valor:0,indice:'CDI',pct:100,ticker:'',obs:''}); renderAtivos(); scheduleAutoSave(); }
function removeAtivo(i){ if(!confirm(`Remover "${D.ativos[i].nome}"?`))return; D.ativos.splice(i,1); renderAtivos(); scheduleAutoSave(); }

// Indicadores
function renderIndicadores() {
  const fmap={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fmap).forEach(([k,id])=>{ const el=document.getElementById(id); if(el)el.value=D[k]||0; });
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id); if(el)el.value=D.arcaMeta[k]||0; });

  const el=document.getElementById('ind-cards');
  if(el) el.innerHTML=`
    <div class="card"><div class="card-lbl">CDI 12 meses</div><div class="card-val g">${fmtP(D.cdi12)}</div></div>
    <div class="card"><div class="card-lbl">CDI mês ref.</div><div class="card-val">${fmtP(D.cdifev)}</div></div>
    <div class="card"><div class="card-lbl">CDI acum. 2026</div><div class="card-val">${fmtP(D.cdi26)}</div></div>
    <div class="card"><div class="card-lbl">IPCA 12 meses</div><div class="card-val a">${fmtP(D.ipca12)}</div></div>
    <div class="card"><div class="card-lbl">IPCA mês ref.</div><div class="card-val">${fmtP(D.ipcafev)}</div></div>
    <div class="card"><div class="card-lbl">IPCA acum. 2026</div><div class="card-val">${fmtP(D.ipca26)}</div></div>
    <div class="card"><div class="card-lbl">CDI vs IPCA (12m)</div><div class="card-val ${D.cdi12>D.ipca12?'g':'r'}">${fmtP(D.cdi12-D.ipca12)} <span style="font-size:11px">acima</span></div></div>
  `;

  dc('cIndComp');
  const cIC=document.getElementById('cIndComp');
  if(cIC) CH['cIndComp']=new Chart(cIC,{type:'bar',data:{
    labels:['12 meses','Mês ref.','Acum. 2026'],
    datasets:[
      {label:'CDI',  data:[D.cdi12,D.cdifev,D.cdi26],  backgroundColor:'rgba(34,199,122,.8)', borderRadius:4},
      {label:'IPCA', data:[D.ipca12,D.ipcafev,D.ipca26],backgroundColor:'rgba(240,160,32,.8)', borderRadius:4},
    ]
  },options:{...CHART_OPTS,scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'}}}}});
}

// ── CARTÕES RENDER ────────────────────────────────────────────
function renderCartoesTo(el, i) {
  if (!el) return;
  const cartoes=D.dividas.filter(d=>d.cat==='cartao');
  if(!cartoes.length){ el.innerHTML='<p style="font-size:12px;color:var(--text3);padding:8px 0">Nenhum cartão com fatura cadastrado. Categorize dívidas como "💳 Cartão" na aba Saídas.</p>'; return; }
  el.innerHTML=cartoes.map(d=>{
    const lim=getLimite(d);
    const aberto=d.vals.reduce((s,v)=>s+(v||0),0);
    const atual=d.vals[i]||0;
    const livre=lim>0?Math.max(0,lim-aberto):null;
    const pct=lim>0?Math.min(100,Math.round((aberto/lim)*100)):null;
    const barC=pct===null?'var(--text3)':pct>=80?'var(--red)':pct>=50?'var(--amber)':'var(--green)';
    const cls=pct!==null&&pct>=80?' alerta':pct!==null&&pct>=50?' aviso':'';
    const parcelas=D.meses.map((m,mi)=>({m,v:d.vals[mi]||0})).filter(x=>x.v>0);
    const limRow=lim>0
      ?`<div class="cartao-vals"><span class="usado">Aberto: ${fmt(aberto)}</span><span class="livre">Livre: ${fmt(livre)}</span></div>
         <div class="limit-bar-bg"><div class="limit-bar-fg" style="width:${pct}%;background:${barC}"></div></div>
         <div class="limit-label">Limite: ${fmt(lim)} · ${pct}% usado · Fatura ${D.meses[i]}: ${atual>0?fmt(atual):'—'}</div>`
      :`<div class="cartao-vals"><span class="usado">Total: ${fmt(aberto)}</span></div>`;
    return `<div class="cartao-card${cls}">
      <div class="cartao-nome">💳 ${d.nome}</div>
      ${limRow}
      <div class="parcelas-wrap">${parcelas.map(x=>`<span class="parcela-chip">${shortM(x.m)}: ${fmtK(x.v)}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

// ── FORM FIELDS ───────────────────────────────────────────────
function collectFormFields() {
  const fmap={salario:'ef-salario',outras:'ef-outras',saldo:'ef-saldo',
    cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',
    ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fmap).forEach(([k,id])=>{ const el=document.getElementById(id); if(el)D[k]=parseFloat(el.value)||0; });
  const mc=document.getElementById('ef-metaCC');if(mc)D.metaCC=parseFloat(mc.value)||2000;
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id); if(el)D.arcaMeta[k]=parseFloat(el.value)||0; });
}

function saveData()  { collectFormFields(); if(window._firestoreSave) window._firestoreSave(true); renderAll(); }
function resetData() { /* handled by Firebase script */ }

// ── INIT ──────────────────────────────────────────────────────
applyTheme();
