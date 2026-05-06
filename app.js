/* ═══════════════════════════════════════════════════
   FinançasPRO — app.js v4.0
   Motor financeiro completo
═══════════════════════════════════════════════════ */

// ── DADOS PADRÃO ──────────────────────────────────
const DEFAULT = {
  salario:6500, outras:0, saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  cartoes:[
    {nome:'Nubank PF',    limite:3700,  bandeira:'Mastercard',cor:'#820ad1'},
    {nome:'Nubank PJ',    limite:9700,  bandeira:'Mastercard',cor:'#820ad1'},
    {nome:'Mercado Pago', limite:11000, bandeira:'Mastercard',cor:'#009ee3'},
    {nome:'Renner',       limite:7200,  bandeira:'Mastercard',cor:'#e60000'},
    {nome:'Amazon',       limite:2580,  bandeira:'Visa',      cor:'#ff9900'},
    {nome:'SICREDI',      limite:6300,  bandeira:'Visa',      cor:'#006633'},
  ],
  dividas:[
    {nome:'Faculdade',   tipo:'Fixo',     cat:'educacao',limCartao:'',
     vals:[0,644.05,644.05,644.05,644.05,644.05,644.05,644.05,400,400,400,400,400,400,400,400,400,400,400,400]},
    {nome:'Claro',       tipo:'Fixo',     cat:'servicos',limCartao:'',
     vals:[120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120]},
    {nome:'DAS',         tipo:'Fixo',     cat:'impostos',limCartao:'',
     vals:[0,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85]},
    {nome:'IR',          tipo:'Fixo',     cat:'impostos',limCartao:'',
     vals:[0,96.47,96.47,96.47,96.47,96.47,96.47,96.47,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PF',   tipo:'Variável', cat:'cartao',  limCartao:'Nubank PF',
     vals:[2148.08,366.78,117.34,117.34,117.34,117.34,117.34,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PJ',   tipo:'Variável', cat:'cartao',  limCartao:'Nubank PJ',
     vals:[961.41,678.08,678.08,565.09,298.16,298.16,298.16,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'SICREDI',     tipo:'Variável', cat:'cartao',  limCartao:'SICREDI',
     vals:[1370.44,355.26,229.26,74.9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Mercado Pago',tipo:'Variável', cat:'cartao',  limCartao:'Mercado Pago',
     vals:[527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,485.38,485.38,122.63,115.55,0,0,0,0,0,0,0]},
    {nome:'Renner',      tipo:'Variável', cat:'cartao',  limCartao:'Renner',
     vals:[467.86,362.27,314.31,314.31,200.35,200.35,200.35,200.35,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Amazon',      tipo:'Variável', cat:'cartao',  limCartao:'Amazon',
     vals:[105.7,105.7,105.7,105.7,105.7,105.7,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  ativos:[
    {nome:'Tesouro Selic 2027',classe:'Renda Fixa',bucket:'C', valor:0,indice:'SELIC',pct:100,ticker:'TESOURO SELIC'},
    {nome:'FII XPML11',        classe:'FII',       bucket:'R', valor:0,indice:'CDI',  pct:90, ticker:'XPML11'},
    {nome:'IVVB11',            classe:'ETF',       bucket:'A2',valor:0,indice:'CDI',  pct:110,ticker:'IVVB11'},
    {nome:'BOVA11',            classe:'ETF',       bucket:'A', valor:0,indice:'CDI',  pct:100,ticker:'BOVA11'},
  ]
};

// ── ESTADO ────────────────────────────────────────
let D = JSON.parse(JSON.stringify(DEFAULT));
let selDash = 0;
let CH = {};
let yrCollapsed = {};
let _saveTimer = null;
let isDark = (localStorage.getItem('cf_theme')||'dark') === 'dark';

// ── CATEGORIAS ────────────────────────────────────
const CATS = {
  moradia:    {label:'Moradia',     icon:'🏠', cor:'#3B82F6'},
  alimentacao:{label:'Alimentação', icon:'🍽️', cor:'#10B981'},
  transporte: {label:'Transporte',  icon:'🚗', cor:'#F97316'},
  saude:      {label:'Saúde',       icon:'💊', cor:'#EF4444'},
  educacao:   {label:'Educação',    icon:'🎓', cor:'#8B5CF6'},
  servicos:   {label:'Serviços',    icon:'📱', cor:'#06B6D4'},
  impostos:   {label:'Impostos',    icon:'📋', cor:'#F59E0B'},
  lazer:      {label:'Lazer',       icon:'🎮', cor:'#84CC16'},
  cartao:     {label:'Cartão',      icon:'💳', cor:'#EC4899'},
  outros:     {label:'Outros',      icon:'📦', cor:'#6B7280'},
};
const ARCA = {
  colors:{A:'#3B82F6',R:'#F97316',C:'#6B7280',A2:'#F59E0B'},
  names:{A:'A — Ações Brasileiras',R:'R — Real Estate',C:'C — Caixa',A2:'A — Ativos Internacionais'},
  desc:{
    A:'Ações da B3 — crescimento de longo prazo no mercado nacional',
    R:'Fundos Imobiliários — renda passiva e exposição ao mercado imobiliário',
    C:'Tesouro Selic, CDB, Fundos DI — liquidez imediata e proteção',
    A2:'ETFs globais, BDRs — diversificação internacional',
  },
};
const CHART_COLORS=['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#F97316','#06B6D4','#84CC16','#EC4899','#10B981','#EF4444'];

// ── TEMPLATE EM BRANCO para novos usuários ────────
const BLANK = {
  salario:0, outras:0, saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  cartoes:[], dividas:[], ativos:[]
};

// ── MIGRAÇÃO ──────────────────────────────────────
function migrateData(d) {
  // Novo usuário sem dados — retorna template em branco
  if(!d) return JSON.parse(JSON.stringify(BLANK));
  if(!d.cartoes)  d.cartoes  = [];
  if(!d.ativos)   d.ativos   = [];
  if(!d.arcaMeta) d.arcaMeta = {a:25,r:25,c:25,a2:25};
  if(!d.metaCC)   d.metaCC   = 2000;
  if(!d.meses)    d.meses    = [...BLANK.meses];
  if(!d.dividas)  d.dividas  = [];
  d.dividas.forEach(x => {
    if(!x.cat)        x.cat = 'outros';
    if(!x.limCartao)  x.limCartao = '';
    if(!x.vals)       x.vals = Array(d.meses.length).fill(0);
    while(x.vals.length < d.meses.length) x.vals.push(0);
    delete x.rentab;
  });
  d.ativos.forEach(x => {
    if(!x.indice)         x.indice = 'CDI';
    if(x.pct===undefined) x.pct    = 100;
    if(!x.ticker)         x.ticker = '';
    delete x.rentab;
  });
  d.cartoes.forEach(c => { if(!c.cor) c.cor='#6B7280'; });
  return d;
}

// ── CÁLCULOS FINANCEIROS ──────────────────────────
const nm       = () => D.meses.length;
const totalE   = () => (D.salario||0)+(D.outras||0);
const totalDiv = i  => D.dividas.reduce((s,d)=>s+(d.vals[i]||0),0);
const sobraM   = i  => totalE()-totalDiv(i);
const getLim   = d  => { const c=D.cartoes.find(x=>x.nome===d.limCartao); return c?c.limite:0; };

function calcInvest(i) {
  const e=totalE(), c=totalDiv(i), meta=D.metaCC||2000, sobra=e-c;
  if(sobra<=0)    return {e,c,meta,saldo:0,sobra,regra:'negativo'};
  if(sobra<=meta) return {e,c,meta,saldo:Math.max(0,sobra-meta),sobra,regra:'menor_meta'};
  return              {e,c,meta,saldo:sobra*.5,sobra,regra:'maior_meta'};
}
const invDisp  = i => calcInvest(i).saldo;

function patrimonioLiquido() {
  const ativos  = D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const passivos= D.dividas.filter(d=>d.cat==='cartao').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  return {ativos, passivos, liquido:ativos-passivos};
}

function scoreFinanceiro() {
  const n=nm();if(!n)return 50;
  const totE=totalE()*n, totD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const ativos=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const mesesPos=D.meses.filter((_,i)=>sobraM(i)>=0).length;
  const pctMetaE=metaEmergencia()>0?Math.min(1,caixaAtual()/metaEmergencia()):0;
  let score=0;
  score+=Math.min(30,Math.round((mesesPos/n)*30));
  score+=Math.min(25,Math.round(Math.max(0,1-(totD/totE))*25));
  score+=Math.min(25,Math.round(pctMetaE*25));
  score+=Math.min(20,ativos>0?Math.min(20,Math.round((ativos/(totalE()*12))*20)):0);
  return Math.min(100,score);
}

function caixaAtual()     { return D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0); }
function custoFixoMes()   { return D.dividas.filter(d=>d.tipo==='Fixo').reduce((s,d)=>s+(d.vals[0]||0),0); }
function metaEmergencia() { return custoFixoMes()*6; }
function arcaBloqueado()  { return caixaAtual()<metaEmergencia(); }

function taxaAnual(a) {
  const base=a.indice==='SELIC'?(D.cdi12||14.80):a.indice==='IPCA'?(D.ipca12||4.14):(D.cdi12||14.80);
  return (base*(a.pct||100)/100)/100;
}
function projetar(v,r,n){ return v*Math.pow(1+r,n); }

function getYears() {
  const s=new Set();
  D.meses.forEach(m=>{const p=m.match(/\/(\d+)/);if(p)s.add('20'+p[1]);});
  return [...s].sort();
}
function getMesesAno(yr) { return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes('/'+yr.slice(2))); }

// ── FORMATAÇÃO ────────────────────────────────────
const R  = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const RK = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
const P  = v => Number(v).toFixed(2)+'%';
const fmt=R, fmtK=RK, fmtP=P;
const sM = m => { const p=m.split('/');return p[0].substring(0,3)+(p[1]?'/'+p[1].substring(2):''); };
const pct= (v,t) => t>0?Math.round((v/t)*100)+'%':'0%';

// ── CHART HELPERS ─────────────────────────────────
const gc = () => getComputedStyle(document.documentElement).getPropertyValue('--gc').trim();
const tc = () => getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
const dc = id => { if(CH[id]){CH[id].destroy();delete CH[id];} };

const chartOpts = (extra={}) => ({
  responsive:true, maintainAspectRatio:false,
  interaction:{mode:'index',intersect:false},
  plugins:{
    legend:{position:'bottom',labels:{color:tc(),font:{size:11},boxWidth:12,padding:10}},
    ...extra.plugins
  },
  scales:{
    x:{grid:{color:gc()},ticks:{color:tc(),font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:12}},
    y:{grid:{color:gc()},ticks:{color:tc(),font:{size:10},callback:v=>RK(v)}},
    ...extra.scales
  },
  ...extra
});

// ── TEMA ──────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  const btn=document.getElementById('theme-btn');
  if(btn) btn.textContent=isDark?'☀️':'🌙';
}
function toggleTheme() {
  isDark=!isDark;
  localStorage.setItem('cf_theme',isDark?'dark':'light');
  applyTheme();
  Object.keys(CH).forEach(dc);
  renderAll();
}

// ── AUTO-SAVE ─────────────────────────────────────
function scheduleAutoSave() {
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{
    if(window._firestoreSave) window._firestoreSave(false);
  },1500);
}

// ── ROTEAMENTO ────────────────────────────────────
function go(id, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('on'));
  const pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('on');
  if(el) el.classList.add('on');
  renderPage(id);
}

function renderPage(id) {
  if(id==='dash')     renderDashboard();
  else if(id==='carteira')  renderCarteira();
  else if(id==='saidas')    renderSaidasAtiva();
  else if(id==='invest')    renderInvestAtiva();
  else if(id==='perfil')    { if(window._renderPerfil) window._renderPerfil(); }
  else if(id==='admin')     { if(window._renderAdmin)  window._renderAdmin(); }
}

function renderAll() {
  const active=document.querySelector('.page.on');
  const id=active?active.id.replace('page-',''):'dash';
  renderPage(id);
}

function switchSub(pageId, subId, el) {
  const prefix = pageId==='invest'?subId:'sub-'+subId;
  document.querySelectorAll(`#page-${pageId} .sub`).forEach(p=>p.classList.remove('on'));
  document.querySelectorAll(`#page-${pageId} .stab`).forEach(t=>t.classList.remove('on'));
  const sub=document.getElementById('sub-'+subId);
  if(sub) sub.classList.add('on');
  if(el) el.classList.add('on');
  if(pageId==='saidas') renderSaidaSub(subId);
  else if(pageId==='invest') renderInvestSub(subId);
  else if(pageId==='dash') {
    if(subId==='geral') renderGeral();
    else renderMes();
  }
}

function getActiveSub(pageId) {
  const a=document.querySelector(`#page-${pageId} .sub.on`);
  return a?a.id.replace('sub-',''):null;
}

function renderDashboard() {
  const sub=getActiveSub('dash')||'geral';
  if(sub==='geral') renderGeral();
  else renderMes();
}
function renderSaidasAtiva()  { const s=getActiveSub('saidas')||'fixas';  renderSaidaSub(s); }
function renderInvestAtiva()  { const s=getActiveSub('invest')||'inv-visao'; renderInvestSub(s); }
function renderSaidaSub(id) {
  if(id==='fixas')     renderSaidas('Fixo','tbl-fixas');
  if(id==='variaveis') renderSaidas('Variável','tbl-var');
  if(id==='periodos')  renderPeriodos();
}
function renderInvestSub(id) {
  if(id==='inv-visao')      renderInvestVisao();
  if(id==='inv-arca')       renderArca();
  if(id==='inv-carteira')   renderAtivos();
  if(id==='inv-indicadores')renderIndicadores();
}

// ── DASHBOARD GERAL ───────────────────────────────
function renderGeral() {
  const n=nm();
  const totE=totalE()*n;
  const totD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const totInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const totS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  const score=scoreFinanceiro();
  const pl=patrimonioLiquido();
  const caixa=caixaAtual();
  const metaE=metaEmergencia();
  const pctE=metaE>0?Math.min(100,Math.round((caixa/metaE)*100)):0;
  const scoreCor=score>=70?'#10B981':score>=40?'#F59E0B':'#EF4444';
  const melI=D.meses.reduce((b,_,i)=>sobraM(i)>sobraM(b)?i:b,0);
  const pioI=D.meses.reduce((b,_,i)=>sobraM(i)<sobraM(b)?i:b,0);

  // Hero banner
  const hero=document.getElementById('dash-hero');
  if(hero) hero.innerHTML=`
    <div class="hero-top">
      <div>
        <div class="hero-label">Patrimônio Líquido Total</div>
        <div class="hero-amount">${RK(pl.liquido)}</div>
        <div class="hero-sub">Ativos ${RK(pl.ativos)} − Passivos ${RK(pl.passivos)}</div>
      </div>
      <div class="hero-score">
        <div class="hero-score-val" style="color:${scoreCor}">${score}</div>
        <div class="hero-score-label">Score financeiro</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div>
      </div>
    </div>
    <div class="hero-pills">
      <div class="hero-pill ${totE>0?'green':''}">💰 Renda: <strong>${RK(totalE())}/mês</strong></div>
      <div class="hero-pill ${totS>=0?'green':'red'}">📊 Sobra: <strong>${RK(totS)}</strong></div>
      <div class="hero-pill blue">🚀 P/ Investir: <strong>${RK(totInv)}</strong></div>
      <div class="hero-pill ${pctE>=100?'green':pctE>=50?'':'red'}">🛡️ Reserva: <strong>${pctE}% da meta</strong></div>
      <div class="hero-pill">📅 ${n} meses planejados</div>
    </div>`;

  // Metric cards
  const mc=document.getElementById('dash-mcards');
  if(mc) mc.innerHTML=`
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas mensais</div>
      <div class="mval mval-pos">${RK(totalE())}</div>
      <div class="msub">salário + outras receitas</div>
    </div>
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Total dívidas período</div>
      <div class="mval mval-neg">${RK(totD)}</div>
      <div class="msub">${pct(totD,totE)} da renda total</div>
    </div>
    <div class="mcard mcard-teal">
      <div class="mlabel">🚀 Total p/ investir</div>
      <div class="mval mval-teal">${RK(totInv)}</div>
      <div class="msub">calculado pelas regras automáticas</div>
    </div>
    <div class="mcard ${totS>=0?'mcard-pos':'mcard-neg'}">
      <div class="mlabel">📊 Sobra acumulada</div>
      <div class="mval ${totS>=0?'mval-pos':'mval-neg'}">${RK(totS)}</div>
      <div class="msub">ao fim dos ${n} meses</div>
    </div>
    <div class="mcard mcard-accent">
      <div class="mlabel">⭐ Melhor mês</div>
      <div class="mval mval-accent" style="font-size:18px">${D.meses[melI]}</div>
      <div class="msub">sobra: ${fmt(sobraM(melI))}</div>
    </div>
    <div class="mcard mcard-neg" style="border-color:rgba(239,68,68,.15)">
      <div class="mlabel">⚠️ Mês mais apertado</div>
      <div class="mval mval-neg" style="font-size:18px">${D.meses[pioI]}</div>
      <div class="msub">sobra: ${fmt(sobraM(pioI))}</div>
    </div>
    <div class="mcard ${pctE>=100?'mcard-pos':pctE>=50?'mcard-warn':'mcard-neg'}">
      <div class="mlabel">🛡️ Reserva emergência</div>
      <div class="mval ${pctE>=100?'mval-pos':pctE>=50?'mval-warn':'mval-neg'}">${pctE}%</div>
      <div class="msub">meta: ${RK(metaE)} (6 meses fixos)</div>
    </div>
  `;

  renderYearBlocks();
  renderGeralCharts();
  renderFluxoTable();
  renderCartoesTo(document.getElementById('dash-cartoes-geral'),0);
}

function renderGeralCharts() {
  // Doughnut por categoria
  dc('cDough');
  const catTots={};
  D.dividas.forEach(d=>d.vals.forEach((v,i)=>{if(v){const c=d.cat||'outros';catTots[c]=(catTots[c]||0)+v;}}));
  const catE=Object.entries(catTots).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
  const cD=document.getElementById('cDough');
  if(cD) CH['cDough']=new Chart(cD,{type:'doughnut',data:{
    labels:catE.map(([k])=>(CATS[k]?.icon||'📦')+' '+(CATS[k]?.label||k)),
    datasets:[{data:catE.map(([,v])=>v),backgroundColor:catE.map(([k])=>CATS[k]?.cor||'#888'),borderWidth:0,hoverOffset:10}]
  },options:{
    responsive:true,maintainAspectRatio:false,cutout:'65%',
    plugins:{legend:{position:'right',labels:{color:tc(),font:{size:11},boxWidth:10,padding:8}},
    tooltip:{callbacks:{label:c=>' '+fmt(c.raw)+' ('+Math.round(c.raw/catE.reduce((s,[,v])=>s+v,0)*100)+'%)'}}}
  }});

  // Ranking
  const rl=document.getElementById('rank-list');
  if(rl){
    const tots=D.dividas.map(d=>({nome:d.nome,cat:d.cat||'outros',total:d.vals.reduce((s,v)=>s+(v||0),0)}))
      .filter(d=>d.total>0).sort((a,b)=>b.total-a.total).slice(0,8);
    const maxT=tots[0]?.total||1;
    rl.innerHTML=tots.map((d,i)=>{
      const cat=CATS[d.cat]||CATS.outros;
      return `<div class="rank-row">
        <span class="rank-n">${i+1}</span>
        <span class="rank-icon">${cat.icon}</span>
        <span class="rank-name">${d.nome}</span>
        <div class="rank-bar-wrap"><div class="rank-bar-fill" style="width:${Math.round((d.total/maxT)*100)}%;background:${cat.cor}"></div></div>
        <span class="rank-val">${fmt(d.total)}</span>
      </div>`;
    }).join('');
  }

  // Evolução linha
  dc('cEvol');
  const cEv=document.getElementById('cEvol');
  if(cEv) CH['cEvol']=new Chart(cEv,{type:'line',data:{
    labels:D.meses.map(sM),
    datasets:D.dividas.map((d,idx)=>({
      label:d.nome,data:d.vals.map(v=>v||0),
      borderColor:CHART_COLORS[idx%CHART_COLORS.length],
      backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:1.5
    }))
  },options:chartOpts()});
}

function renderFluxoTable() {
  const ft=document.getElementById('fluxo-tbl');if(!ft)return;
  const yrs=getYears();
  const rows=D.meses.map((m,i)=>{
    const e=totalE(),d=totalDiv(i),inv=invDisp(i),s=sobraM(i);
    const r=calcInvest(i);
    const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
    const yr=m.match(/\/(\d+)/);const yrN=yr?'20'+yr[1]:'';
    const acorLeft=yrs[0]===yrN?'4px solid #3B82F6':'4px solid #8B5CF6';
    return `<tr style="border-left:${acorLeft}">
      <td style="font-weight:600">${m}</td>
      <td class="tr tpos">${fmt(e)}</td>
      <td class="tr tneg">${fmt(d)}</td>
      <td class="tr" style="color:var(--text2)">${fmt(s)}</td>
      <td class="tr tteal" style="font-weight:600">${fmt(inv)} <span title="${r.regra}">${icon}</span></td>
    </tr>`;
  }).join('');
  const tD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const tInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const tS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  ft.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Dívidas</th>
    <th class="tr">Sobra bruta</th><th class="tr" style="color:var(--teal)">💰 P/ Investir</th>
  </tr></thead><tbody>${rows}
  <tr style="background:var(--card2);font-weight:700;border-top:2px solid var(--border)">
    <td>TOTAL</td><td></td>
    <td class="tr tneg">${fmt(tD)}</td>
    <td class="tr ${tS>=0?'tpos':'tneg'}">${fmt(tS)}</td>
    <td class="tr tteal">${fmt(tInv)}</td>
  </tr></tbody>`;
}

// Year blocks
function toggleYr(yr){yrCollapsed[yr]=!yrCollapsed[yr];renderYearBlocks();}

function renderYearBlocks() {
  const container=document.getElementById('year-blocks');if(!container)return;
  container.innerHTML='';
  getYears().forEach((yr,yi)=>{
    const meses=getMesesAno(yr);if(!meses.length)return;
    const totE=totalE()*meses.length;
    const totD=meses.reduce((s,{i})=>s+totalDiv(i),0);
    const totInv=meses.reduce((s,{i})=>s+invDisp(i),0);
    const totS=meses.reduce((s,{i})=>s+sobraM(i),0);
    const isCol=yrCollapsed[yr]!==false;
    const tagCls=yi===0?'yr-tag-26':'yr-tag-27';
    const acorCor=yi===0?'#3B82F6':'#8B5CF6';

    const block=document.createElement('div');
    block.className='yrblock mb';
    block.innerHTML=`
      <div class="yrblock-head" onclick="toggleYr('${yr}')">
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="yr-tag ${tagCls}">${yr}</span>
          <span style="font-size:12px;color:var(--text2);font-weight:500">${meses.length} meses</span>
        </div>
        <div class="yr-meta-pills">
          <span class="yr-meta-pill">💰 <strong style="color:#10B981">${RK(totE)}</strong></span>
          <span class="yr-meta-pill">💸 <strong style="color:#EF4444">${RK(totD)}</strong></span>
          <span class="yr-meta-pill">🚀 <strong style="color:#06B6D4">${RK(totInv)}</strong></span>
          <span class="yr-meta-pill" style="font-weight:700;color:${totS>=0?'#10B981':'#EF4444'}">${totS>=0?'↑':'↓'} ${RK(Math.abs(totS))}</span>
        </div>
        <span class="yr-chev${isCol?'':' open'}">▾</span>
      </div>
      <div class="yr-body${isCol?' hidden':''}" id="yr-body-${yr}">
        <div class="timeline" id="tl-${yr}" style="margin:12px 0"></div>
        <div class="g2 mb">
          <div class="panel">
            <div class="panel-head"><span class="panel-title">📊 Dívidas vs Disponível — ${yr}</span></div>
            <div class="chart-wrap" style="height:190px"><canvas id="cBar${yr}"></canvas></div>
          </div>
          <div class="panel">
            <div class="panel-head"><span class="panel-title">📈 Sobra acumulada — ${yr}</span></div>
            <div class="chart-wrap" style="height:190px"><canvas id="cAcum${yr}"></canvas></div>
          </div>
        </div>
      </div>`;
    container.appendChild(block);

    const tl=document.getElementById('tl-'+yr);
    if(tl) tl.innerHTML=meses.map(({m,i})=>{
      const s=sobraM(i),inv=invDisp(i);
      return `<div class="tlcell ${s>=0?'pos':'neg'}">
        <div class="tlm">${sM(m)}</div>
        <div class="tlv ${s>=0?'pos':'neg'}">${RK(s)}</div>
        <div class="tls" style="color:var(--teal)">🚀${RK(inv)}</div>
      </div>`;
    }).join('');

    if(!isCol){
      dc('cBar'+yr);dc('cAcum'+yr);
      const cB=document.getElementById('cBar'+yr);
      if(cB) CH['cBar'+yr]=new Chart(cB,{type:'bar',data:{
        labels:meses.map(x=>sM(x.m)),
        datasets:[
          {label:'Dívidas',   data:meses.map(x=>totalDiv(x.i)),backgroundColor:'rgba(239,68,68,.8)',borderRadius:4},
          {label:'P/ Investir',data:meses.map(x=>invDisp(x.i)), backgroundColor:'rgba(6,182,212,.8)', borderRadius:4},
        ]
      },options:chartOpts()});

      let acc=0;
      const acumArr=meses.map(({i})=>{acc+=sobraM(i);return Math.round(acc*100)/100;});
      const cA=document.getElementById('cAcum'+yr);
      if(cA) CH['cAcum'+yr]=new Chart(cA,{type:'line',data:{
        labels:meses.map(x=>sM(x.m)),
        datasets:[{data:acumArr,borderColor:acorCor,backgroundColor:acorCor.replace(')',',0.08)').replace('rgb','rgba'),
          tension:.4,fill:true,pointRadius:4,borderWidth:2,
          pointBackgroundColor:acumArr.map(v=>v>=0?'#10B981':'#EF4444')}]
      },options:chartOpts({plugins:{legend:{display:false}}})});
    }
  });
}

// ── POR MÊS ───────────────────────────────────────
function renderMes() {
  const i=selDash;
  const e=totalE(),d=totalDiv(i),s=sobraM(i),inv=invDisp(i);
  const r=calcInvest(i);
  const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
  const dscr=r.regra==='maior_meta'?`50% de ${fmt(r.sobra)}`:r.regra==='menor_meta'?`${fmt(r.sobra)} − meta CC`:'Contas > Entradas';
  const pl=patrimonioLiquido();

  const lbl=document.getElementById('dash-sec-label');
  if(lbl) lbl.textContent='Resumo de '+(D.meses[i]||'');
  buildMonths('dash-months',i,j=>{selDash=j;renderMes();});

  const mc=document.getElementById('mes-cards');
  if(mc) mc.innerHTML=`
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas</div>
      <div class="mval mval-pos">${fmt(e)}</div>
      <div class="msub">renda total do mês</div>
    </div>
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Dívidas</div>
      <div class="mval mval-neg">${fmt(d)}</div>
      <div class="msub">${pct(d,e)} da renda</div>
    </div>
    <div class="mcard ${s>=0?'mcard-pos':'mcard-neg'}">
      <div class="mlabel">📊 Sobra bruta</div>
      <div class="mval ${s>=0?'mval-pos':'mval-neg'}">${fmt(s)}</div>
      <div class="msub">entradas − dívidas</div>
    </div>
    <div class="mcard mcard-teal" style="border-color:rgba(6,182,212,.25);background:var(--teal-bg)">
      <div class="mlabel" style="color:var(--teal)">${icon} Disponível p/ investir</div>
      <div class="mval mval-teal">${fmt(inv)}</div>
      <div class="msub">${dscr}</div>
    </div>
    <div class="mcard mcard-info">
      <div class="mlabel">🏦 Saldo conta corrente</div>
      <div class="mval mval-info">${fmt(D.saldo)}</div>
      <div class="msub">posição atual em CC</div>
    </div>
    <div class="mcard mcard-accent">
      <div class="mlabel">💎 Patrimônio líquido</div>
      <div class="mval ${pl.liquido>=0?'mval-accent':'mval-neg'}">${fmt(pl.liquido)}</div>
      <div class="msub">ativos − passivos</div>
    </div>
  `;

  // Cards por categoria
  const cats={};
  D.dividas.forEach(dv=>{
    const v=dv.vals[i]||0;if(!v)return;
    const c=dv.cat||'outros';
    if(!cats[c])cats[c]={total:0,items:[]};
    cats[c].total+=v;cats[c].items.push({nome:dv.nome,v});
  });
  const cc=document.getElementById('mes-cat-cards');
  if(cc) cc.innerHTML=Object.entries(cats).sort(([,a],[,b])=>b.total-a.total).map(([cat,{total,items}])=>{
    const info=CATS[cat]||CATS.outros;
    return `<div class="mcard" style="border-color:${info.cor}33">
      <div class="mlabel" style="color:${info.cor}">${info.icon} ${info.label}</div>
      <div class="mval tneg" style="font-size:18px;font-weight:700">${fmt(total)}</div>
      <div style="font-size:10px;color:var(--text2);margin-top:6px;line-height:1.6">${items.map(x=>`${x.nome}: <strong>${fmt(x.v)}</strong>`).join(' · ')}</div>
    </div>`;
  }).join('');

  renderCartoesTo(document.getElementById('mes-cartoes'),i);
  renderMesCharts(i);
}

function buildMonths(cid,sel,cb){
  const el=document.getElementById(cid);if(!el)return;
  el.innerHTML=D.meses.map((m,i)=>`<button class="msb${i===sel?' on':''}" onclick="(${cb.toString()})(${i})">${sM(m)}</button>`).join('');
}

function renderMesCharts(i){
  const n=nm();
  const divA=Array.from({length:n},(_,j)=>totalDiv(j));
  const invA=Array.from({length:n},(_,j)=>invDisp(j));
  const catTots={};
  D.dividas.forEach(d=>{const v=d.vals[i]||0;if(v){const c=d.cat||'outros';catTots[c]=(catTots[c]||0)+v;}});

  dc('cMesBar');
  const cMB=document.getElementById('cMesBar');
  if(cMB) CH['cMesBar']=new Chart(cMB,{type:'bar',data:{
    labels:D.meses.map(sM),
    datasets:[
      {label:'Dívidas',    data:divA,backgroundColor:'rgba(239,68,68,.75)',borderRadius:4},
      {label:'P/ Investir',data:invA,backgroundColor:'rgba(6,182,212,.75)',borderRadius:4},
    ]
  },options:chartOpts()});

  dc('cMesDough');
  const cMD=document.getElementById('cMesDough');
  if(cMD){
    const catE=Object.entries(catTots).filter(([,v])=>v>0);
    CH['cMesDough']=new Chart(cMD,{type:'doughnut',data:{
      labels:catE.map(([k])=>(CATS[k]?.icon||'📦')+' '+(CATS[k]?.label||k)),
      datasets:[{data:catE.map(([,v])=>v),backgroundColor:catE.map(([k])=>CATS[k]?.cor||'#888'),borderWidth:0,hoverOffset:8}]
    },options:{
      responsive:true,maintainAspectRatio:false,cutout:'60%',
      plugins:{legend:{position:'right',labels:{color:tc(),font:{size:11},boxWidth:10,padding:6}},
      tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}
    }});
  }
}

// ── CARTEIRAS ─────────────────────────────────────
function renderCartoesTo(el,i) {
  if(!el)return;
  const cartoes=D.dividas.filter(d=>d.cat==='cartao');
  if(!cartoes.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">💳</div><div class="empty-text">Nenhum cartão de crédito cadastrado.<br>Categorize dívidas como "💳 Cartão" na aba Saídas.</div></div>`;
    return;
  }
  el.innerHTML=cartoes.map(d=>{
    const lim=getLim(d);
    const aberto=d.vals.reduce((s,v)=>s+(v||0),0);
    const atual=d.vals[i]||0;
    const livre=lim>0?Math.max(0,lim-aberto):null;
    const pctUsado=lim>0?Math.min(100,Math.round((aberto/lim)*100)):null;
    const barCor=pctUsado===null?'#6B7280':pctUsado>=80?'#EF4444':pctUsado>=50?'#F59E0B':'#10B981';
    const cardCls=pctUsado!==null&&pctUsado>=80?'alert-card':pctUsado!==null&&pctUsado>=50?'warn-card':'';
    const cartao=D.cartoes.find(c=>c.nome===d.limCartao);
    const cor=cartao?.cor||'#6B7280';
    const parcelas=D.meses.map((m,mi)=>({m,v:d.vals[mi]||0})).filter(x=>x.v>0);
    return `<div class="cc-card ${cardCls}" style="--cc-cor:${cor}">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${cor};border-radius:var(--r16) var(--r16) 0 0"></div>
      <div class="cc-name" style="margin-top:8px">
        <span style="font-size:18px">💳</span> ${d.nome}
        ${pctUsado!==null&&pctUsado>=80?'<span class="badge badge-neg" style="margin-left:auto">Atenção!</span>':''}
      </div>
      <div class="cc-amounts">
        <div class="cc-amounts-left">
          <div class="lbl">Fatura ${D.meses[i]||''}</div>
          <div class="val">${atual>0?fmt(atual):'—'}</div>
        </div>
        ${lim>0?`<div class="cc-amounts-right">
          <div class="lbl">Livre</div>
          <div class="val">${fmt(livre)}</div>
        </div>`:''}
      </div>
      ${lim>0?`
        <div class="cc-bar"><div class="cc-bar-fill" style="width:${pctUsado}%;background:${barCor}"></div></div>
        <div class="cc-meta">
          <span>Total aberto: <strong>${fmt(aberto)}</strong></span>
          <span>Limite: <strong>${fmt(lim)}</strong> · <strong>${pctUsado}%</strong> usado</span>
        </div>`:''}
      <div class="cc-parcelas">${parcelas.slice(0,6).map(x=>`<span class="cc-chip-sml">${sM(x.m)}: ${fmtK(x.v)}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

// ── CARTEIRA PAGE ─────────────────────────────────
function renderCarteira() {
  ['salario','outras','saldo'].forEach(k=>{
    const el=document.getElementById('ef-'+k);if(el)el.value=D[k]||0;
  });
  const mc=document.getElementById('ef-metaCC');if(mc)mc.value=D.metaCC||2000;

  const pl=patrimonioLiquido();
  const totalLim=D.cartoes.reduce((s,c)=>s+(c.limite||0),0);
  const totalAb=D.dividas.filter(d=>d.cat==='cartao').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  const score=scoreFinanceiro();
  const scoreCor=score>=70?'#10B981':score>=40?'#F59E0B':'#EF4444';
  const caixa=caixaAtual();
  const metaE=metaEmergencia();
  const pctE=metaE>0?Math.min(100,Math.round((caixa/metaE)*100)):0;

  // Hero da carteira
  const h=document.getElementById('carteira-hero');
  if(h) h.innerHTML=`
    <div class="hero-banner">
      <div class="hero-top">
        <div>
          <div class="hero-label">Patrimônio Líquido</div>
          <div class="hero-amount">${RK(pl.liquido)}</div>
          <div class="hero-sub">Ativos ${RK(pl.ativos)} − Passivos ${RK(pl.passivos)}</div>
        </div>
        <div class="hero-score">
          <div class="hero-score-val" style="color:${scoreCor}">${score}</div>
          <div class="hero-score-label">Score</div>
          <div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div>
        </div>
      </div>
      <div class="hero-pills">
        <div class="hero-pill green">💰 Renda: <strong>${RK(totalE())}/mês</strong></div>
        <div class="hero-pill blue">🏦 Saldo CC: <strong>${RK(D.saldo)}</strong></div>
        <div class="hero-pill">💳 Limites: <strong>${RK(totalLim)}</strong></div>
        <div class="hero-pill red">📋 Aberto: <strong>${RK(totalAb)}</strong></div>
        <div class="hero-pill ${pctE>=100?'green':pctE>=50?'':'red'}">🛡️ Reserva: <strong>${pctE}%</strong></div>
      </div>
    </div>`;

  const res=document.getElementById('carteira-resumo');
  if(res) res.innerHTML=`
    <div class="pstat"><span class="pstat-label">Renda mensal</span><strong style="color:#10B981">${fmt(totalE())}</strong></div>
    <div class="pstat"><span class="pstat-label">Saldo conta corrente</span><strong>${fmt(D.saldo)}</strong></div>
    <div class="pstat"><span class="pstat-label">Meta conta corrente</span><strong style="color:var(--teal)">${fmt(D.metaCC)}</strong></div>
    <div class="pstat"><span class="pstat-label">Total limite cartões</span><strong>${fmt(totalLim)}</strong></div>
    <div class="pstat"><span class="pstat-label">Total em aberto</span><strong style="color:#EF4444">${fmt(totalAb)} (${pct(totalAb,totalLim)} do limite)</strong></div>
    <div class="pstat"><span class="pstat-label">Total em ativos</span><strong style="color:#10B981">${fmt(pl.ativos)}</strong></div>
    <div class="pstat"><span class="pstat-label">Patrimônio líquido</span><strong style="color:${pl.liquido>=0?'#06B6D4':'#EF4444'}">${fmt(pl.liquido)}</strong></div>
    <div class="pstat"><span class="pstat-label">Score financeiro</span><strong style="color:${scoreCor}">${score}/100</strong></div>
  `;

  const ct=document.getElementById('cartoes-tbl');
  if(ct){
    const rows=D.cartoes.map((c,ci)=>`<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${c.cor||'#888'}"></div>
        <input type="text" value="${c.nome}" onchange="D.cartoes[${ci}].nome=this.value;scheduleAutoSave()" style="min-width:120px;font-size:13px;font-weight:600">
      </div></td>
      <td><select onchange="D.cartoes[${ci}].bandeira=this.value;scheduleAutoSave()">
        ${['Mastercard','Visa','Elo','Amex','Hipercard'].map(b=>`<option${c.bandeira===b?' selected':''}>${b}</option>`).join('')}
      </select></td>
      <td><input type="number" step="100" value="${c.limite||0}" onchange="D.cartoes[${ci}].limite=parseFloat(this.value)||0;scheduleAutoSave()" style="text-align:right"></td>
      <td><button class="btn-rm" onclick="removeCartao(${ci})">✕</button></td>
    </tr>`).join('');
    ct.innerHTML=`<thead><tr><th>Nome</th><th>Bandeira</th><th class="tr">Limite (R$)</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }
}

function addCartao()    { D.cartoes.push({nome:'Novo Cartão',bandeira:'Mastercard',limite:0,cor:'#6B7280'}); renderCarteira(); scheduleAutoSave(); }
function removeCartao(i){ if(!confirm(`Remover "${D.cartoes[i].nome}"?`))return; D.cartoes.splice(i,1); renderCarteira(); scheduleAutoSave(); }

// ── SAÍDAS ────────────────────────────────────────
function renderSaidas(tipo, tableId) {
  const el=document.getElementById(tableId);if(!el)return;
  const arr=D.dividas.filter(d=>d.tipo===tipo);
  const catOpts=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  const heads=D.meses.map(m=>`<th style="min-width:68px;text-align:right">${sM(m)}</th>`).join('');

  if(!arr.length){
    el.innerHTML=`<thead><tr><th>Nome</th><th>Categoria</th><th>${tipo==='Variável'?'Cartão':'—'}</th>${heads}<th class="tr">Total</th><th></th></tr></thead><tbody><tr><td colspan="100"><div class="empty"><div class="empty-icon">${tipo==='Fixo'?'📌':'🔄'}</div><div class="empty-text">Nenhuma conta ${tipo==='Fixo'?'fixa':'variável'} cadastrada</div></div></td></tr></tbody>`;
    return;
  }

  const rows=arr.map(d=>{
    const di=D.dividas.indexOf(d);
    const cells=D.meses.map((_,mi)=>
      `<td><input type="number" step="0.01" min="0" value="${d.vals[mi]||''}" placeholder="0"
        onchange="D.dividas[${di}].vals[${mi}]=parseFloat(this.value)||0;scheduleAutoSave()" style="text-align:right"></td>`
    ).join('');
    const catSel=`<td><select onchange="D.dividas[${di}].cat=this.value;scheduleAutoSave()">${catOpts.replace(`value="${d.cat||'outros'}"`,`value="${d.cat||'outros'}" selected`)}</select></td>`;
    const cartSel=tipo==='Variável'?`<td><select onchange="D.dividas[${di}].limCartao=this.value;scheduleAutoSave()">
      <option value="">— nenhum —</option>
      ${D.cartoes.map(c=>`<option value="${c.nome}"${d.limCartao===c.nome?' selected':''}>${c.nome}</option>`).join('')}
    </select></td>`:'<td style="color:var(--text3);font-size:12px;text-align:center">—</td>';
    const tot=d.vals.reduce((s,v)=>s+(v||0),0);
    const badge=tipo==='Fixo'?'<span class="badge badge-fixo" style="margin-left:6px">Fixo</span>':'<span class="badge badge-var" style="margin-left:6px">Var.</span>';
    return `<tr>
      <td><div style="display:flex;align-items:center;min-width:130px">
        <input type="text" value="${d.nome}" onchange="D.dividas[${di}].nome=this.value;scheduleAutoSave()" placeholder="Nome" style="font-weight:600;min-width:110px">
      </div></td>
      ${catSel}${cartSel}
      ${cells}
      <td class="dtbl-total">${fmtK(tot)}</td>
      <td><button class="btn-rm" onclick="removeDivida(${di})">✕</button></td>
    </tr>`;
  }).join('');
  el.innerHTML=`<thead><tr><th>Nome</th><th>Categoria</th><th>${tipo==='Variável'?'Cartão vinculado':'—'}</th>${heads}<th class="tr">Total</th><th></th></tr></thead><tbody>${rows}</tbody>`;
}

function addDivida(tipo){ D.dividas.push({nome:'Nova conta',tipo,cat:'outros',limCartao:'',vals:Array(nm()).fill(0)}); renderSaidaSub(tipo==='Fixo'?'fixas':'variaveis'); scheduleAutoSave(); }
function removeDivida(i){ if(!confirm(`Remover "${D.dividas[i].nome}"?`))return; D.dividas.splice(i,1); renderSaidasAtiva(); scheduleAutoSave(); }

function renderPeriodos(){
  const el=document.getElementById('meses-list');if(!el)return;
  el.innerHTML=D.meses.map((m,i)=>`<span class="msb" style="cursor:default">${i+1}. ${m}</span>`).join('');
}
function addMes(){ const n=prompt('Mês (ex: Jan/28):');if(!n)return; D.meses.push(n.trim()); D.dividas.forEach(d=>d.vals.push(0)); renderAll(); scheduleAutoSave(); }
function removeMes(){ if(nm()<=1)return; if(!confirm(`Remover "${D.meses[nm()-1]}"?`))return; D.meses.pop(); D.dividas.forEach(d=>d.vals.pop()); if(selDash>=nm())selDash=nm()-1; renderAll(); scheduleAutoSave(); }

// ── INVESTIMENTOS ─────────────────────────────────
function renderInvestVisao(){
  const ref=calcInvest(0);
  const pl=patrimonioLiquido();
  const totInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const icon=ref.regra==='negativo'?'🔴':ref.regra==='menor_meta'?'🟡':'🟢';

  const ic=document.getElementById('inv-cards');
  if(ic) ic.innerHTML=`
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas mensais</div>
      <div class="mval mval-pos">${fmt(ref.e)}</div>
      <div class="msub">base para cálculo</div>
    </div>
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Contas mês 1</div>
      <div class="mval mval-neg">${fmt(ref.c)}</div>
    </div>
    <div class="mcard mcard-warn">
      <div class="mlabel">🎯 Meta conta corrente</div>
      <div class="mval mval-warn">${fmt(ref.meta)}</div>
      <div class="msub">sempre manter em CC</div>
    </div>
    <div class="mcard mcard-teal" style="border-color:rgba(6,182,212,.3);background:var(--teal-bg)">
      <div class="mlabel" style="color:var(--teal)">${icon} Disponível p/ investir</div>
      <div class="mval mval-teal">${fmt(ref.saldo)}</div>
      <div class="msub">mês 1 como referência</div>
    </div>
    <div class="mcard mcard-accent">
      <div class="mlabel">💎 Total em ativos</div>
      <div class="mval mval-accent">${fmt(pl.ativos)}</div>
    </div>
    <div class="mcard mcard-pos">
      <div class="mlabel">🚀 Total a investir (período)</div>
      <div class="mval mval-teal">${fmt(totInv)}</div>
      <div class="msub">soma de todos os meses</div>
    </div>
  `;

  const mt=document.getElementById('inv-mes-tbl');if(!mt)return;
  const rows=D.meses.map((m,i)=>{
    const r=calcInvest(i);
    const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
    const tip=r.regra==='maior_meta'?'Sobra>Meta: 50% da sobra':r.regra==='menor_meta'?'Sobra≤Meta: sobra−meta CC':'Contas>Entradas: R$ 0';
    return `<tr>
      <td style="font-weight:600">${m}</td>
      <td class="tr tpos">${fmt(r.e)}</td>
      <td class="tr tneg">${fmt(r.c)}</td>
      <td class="tr" style="color:var(--text2)">${fmt(r.sobra)}</td>
      <td class="tr"><span title="${tip}">${icon}</span> <small style="color:var(--text2);font-size:10px">${tip.split(':')[0]}</small></td>
      <td class="tr tteal tbold">${fmt(r.saldo)}</td>
    </tr>`;
  }).join('');
  const tot=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  mt.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th><th class="tr">Sobra bruta</th><th class="tr">Regra</th><th class="tr" style="color:var(--teal)">💰 Disponível</th>
  </tr></thead><tbody>${rows}
  <tr style="background:var(--card2);font-weight:700">
    <td>TOTAL</td><td></td><td></td><td></td><td></td><td class="tr tteal">${fmt(tot)}</td>
  </tr></tbody>`;
}

function renderArca(){
  const buckets=['A','R','C','A2'];
  const tot=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const bloq=arcaBloqueado();
  const caixa=caixaAtual(),metaE=metaEmergencia();
  const pctE=metaE>0?Math.min(100,Math.round((caixa/metaE)*100)):0;

  const alertEl=document.getElementById('arca-alert');
  if(alertEl){
    if(bloq){
      alertEl.style.display='block';
      alertEl.innerHTML=`<div style="display:flex;gap:12px;align-items:flex-start">
        <span style="font-size:28px">⚠️</span>
        <div>
          <div style="font-weight:700;color:var(--warn);font-size:14px;margin-bottom:6px">Reserva de emergência insuficiente — ${pctE}% da meta</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.7">
            Custo fixo mensal: <strong>${fmt(custoFixoMes())}</strong> · Meta (6 meses): <strong>${fmt(metaE)}</strong><br>
            Caixa atual: <strong style="color:var(--teal)">${fmt(caixa)}</strong><br>
            <strong style="color:var(--warn)">Recomendação: invista 100% em C — Caixa até atingir a meta de emergência.</strong>
          </div>
          <div style="max-width:300px;margin-top:10px">
            <div style="height:6px;background:var(--card3);border-radius:99px;overflow:hidden">
              <div style="height:6px;width:${pctE}%;background:var(--warn);border-radius:99px"></div>
            </div>
            <div style="font-size:10px;color:var(--text2);margin-top:4px">${fmt(caixa)} de ${fmt(metaE)} · ${pctE}% concluído</div>
          </div>
        </div>
      </div>`;
    } else { alertEl.style.display='none'; }
  }

  const cards=document.getElementById('arca-cards');
  if(cards) cards.innerHTML=buckets.map(b=>{
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pctAtual=tot>0?Math.round((valB/tot)*100):0;
    const meta=bloq?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    const diff=pctAtual-meta;
    const diffCor=diff===0?'#10B981':diff>0?'#F59E0B':'#EF4444';
    const diffStr=diff===0?'✓ na meta':diff>0?`+${diff}pp acima`:`${diff}pp abaixo`;
    return `<div class="acard acard-${b}">
      <div class="acard-label" style="color:${ARCA.colors[b]}">${ARCA.names[b]}</div>
      <div class="acard-desc">${ARCA.desc[b]}</div>
      <div class="acard-val">${fmt(valB)}</div>
      <div class="acard-meta">
        <div class="acard-pct"><span>${pctAtual}% da carteira</span><span style="color:${diffCor};font-weight:700">${diffStr}</span></div>
        <div class="acard-bar"><div class="acard-bar-fill" style="width:${Math.min(100,pctAtual)}%;background:${ARCA.colors[b]}"></div></div>
        <div style="font-size:10px;color:var(--text2);margin-top:4px">Meta: ${meta}%${bloq&&b!=='C'?' · aguardando emergência':''}</div>
      </div>
    </div>`;
  }).join('');

  dc('cArcaDough');
  const cAD=document.getElementById('cArcaDough');
  if(cAD){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    CH['cArcaDough']=new Chart(cAD,{type:'doughnut',data:{
      labels:buckets.map(b=>ARCA.names[b]),
      datasets:[{data:vals,backgroundColor:buckets.map(b=>ARCA.colors[b]),borderWidth:0,hoverOffset:10}]
    },options:{
      responsive:true,maintainAspectRatio:false,cutout:'60%',
      plugins:{legend:{position:'right',labels:{color:tc(),font:{size:11},boxWidth:10,padding:8}},
      tooltip:{callbacks:{label:c=>' '+fmt(c.raw)+(tot>0?' ('+Math.round((c.raw/tot)*100)+'%)':'')}}}
    }});
  }

  const prog=document.getElementById('arca-prog');
  if(prog) prog.innerHTML=buckets.map(b=>{
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pctAtual=tot>0?Math.round((valB/tot)*100):0;
    const meta=bloq?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    return `<div class="prog">
      <div class="prog-head">
        <span class="prog-name" style="color:${ARCA.colors[b]};font-weight:600">${ARCA.names[b]}</span>
        <span class="prog-vals">${pctAtual}% atual · ${meta}% meta</span>
      </div>
      <div class="prog-bar"><div class="prog-bar-fill" style="width:${pctAtual}%;background:${ARCA.colors[b]}"></div></div>
    </div>`;
  }).join('');

  dc('cArcaBar');
  const cAB=document.getElementById('cArcaBar');
  if(cAB){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    const metas=buckets.map(b=>{const m=bloq?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);return tot*(m/100);});
    CH['cArcaBar']=new Chart(cAB,{type:'bar',data:{
      labels:buckets.map(b=>ARCA.names[b].split(' — ')[1]||b),
      datasets:[
        {label:'Atual (R$)', data:vals,  backgroundColor:buckets.map(b=>ARCA.colors[b]+'CC'),borderRadius:6},
        {label:'Meta (R$)',  data:metas, backgroundColor:'rgba(255,255,255,.06)',borderColor:'rgba(255,255,255,.2)',borderWidth:1,borderRadius:6},
      ]
    },options:chartOpts()});
  }
}

function renderAtivos(){
  renderInvestVisao();
  const el=document.getElementById('ativos-tbl');
  if(el){
    const classes=['Renda Fixa','Renda Variável','FII','Ações','ETF','Cripto','Previdência','Outro'];
    const buckets=['A','R','C','A2'];
    const arcaLbl={'A':'A — Ações','R':'R — Real Estate','C':'C — Caixa','A2':'A — Internacionais'};
    const indices=['CDI','SELIC','IPCA'];
    const rows=D.ativos.map((a,ai)=>`<tr>
      <td><input type="text" value="${a.nome}" onchange="D.ativos[${ai}].nome=this.value;scheduleAutoSave()" placeholder="Nome do ativo" style="min-width:160px;font-weight:600"></td>
      <td><select onchange="D.ativos[${ai}].classe=this.value;scheduleAutoSave()">${classes.map(c=>`<option${a.classe===c?' selected':''}>${c}</option>`).join('')}</select></td>
      <td><select onchange="D.ativos[${ai}].bucket=this.value;scheduleAutoSave()">${buckets.map(b=>`<option value="${b}"${a.bucket===b?' selected':''}>${arcaLbl[b]}</option>`).join('')}</select></td>
      <td><input type="number" step="0.01" min="0" value="${a.valor||''}" placeholder="0,00" onchange="D.ativos[${ai}].valor=parseFloat(this.value)||0;scheduleAutoSave();renderAtivos()" style="width:110px;text-align:right;font-weight:600"></td>
      <td><select onchange="D.ativos[${ai}].indice=this.value;scheduleAutoSave();renderAtivos()" style="width:80px">${indices.map(ind=>`<option${a.indice===ind?' selected':''}>${ind}</option>`).join('')}</select></td>
      <td><input type="number" step="0.1" value="${a.pct||100}" placeholder="100" onchange="D.ativos[${ai}].pct=parseFloat(this.value)||100;scheduleAutoSave();renderAtivos()" style="width:72px;text-align:right"></td>
      <td style="color:var(--text2);font-size:12px;white-space:nowrap">${P(taxaAnual(a)*100)}/ano</td>
      <td><input type="text" value="${a.ticker||''}" onchange="D.ativos[${ai}].ticker=this.value;scheduleAutoSave()" placeholder="TICKER" style="width:90px;font-family:monospace;font-size:12px"></td>
      <td><button class="btn-rm" onclick="removeAtivo(${ai})">✕</button></td>
    </tr>`).join('');
    el.innerHTML=`<thead class="thead-sticky"><tr><th>Ativo</th><th>Classe</th><th>Bucket ARCA</th><th class="tr">Valor (R$)</th><th>Índice</th><th class="tr">%</th><th>Taxa anual</th><th>Ticker</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  const res=document.getElementById('ativos-resumo');
  if(res){
    const tot=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
    const byB={'A':0,'R':0,'C':0,'A2':0};
    D.ativos.forEach(a=>{byB[a.bucket]=(byB[a.bucket]||0)+(a.valor||0);});
    res.innerHTML=`
      <div class="mcard mcard-teal">
        <div class="mlabel">📊 Total carteira</div>
        <div class="mval mval-teal">${fmt(tot)}</div>
      </div>
      ${Object.entries(byB).filter(([,v])=>v>0).map(([b,v])=>`
        <div class="mcard" style="border-color:${ARCA.colors[b]}33">
          <div class="mlabel" style="color:${ARCA.colors[b]}">${ARCA.names[b].split(' — ')[1]}</div>
          <div class="mval" style="font-size:18px;font-weight:700">${fmt(v)}</div>
          <div class="msub">${tot>0?Math.round((v/tot)*100):0}% da carteira</div>
        </div>`).join('')}
    `;
  }

  // Projeções
  const proj=document.getElementById('proj-tbl');
  if(proj){
    const ANOS=[1,2,3,5,10,20,30];
    const ativos=D.ativos.filter(a=>(a.valor||0)>0);
    const atTot=ativos.reduce((s,a)=>s+(a.valor||0),0);
    const txMedia=atTot>0?ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTot:0;
    const heads=ANOS.map(a=>`<th class="tr">${a}a</th>`).join('');
    const rows=[...ativos,{nome:'<strong>Total</strong>',valor:atTot,_tx:txMedia,_tot:true}].map(a=>{
      const tx=a._tx!==undefined?a._tx:taxaAnual(a);
      const cols=ANOS.map(n=>{
        const v=projetar(a.valor||0,tx,n);
        const g=v-(a.valor||0);
        return `<td class="tr"><div class="proj-val">${RK(v)}</div><div class="proj-gain">+${RK(g)}</div></td>`;
      }).join('');
      const sub=a._tot?`taxa média: ${P(tx*100)}`:`${a.indice} ${a.pct}% = ${P(tx*100)}/a`;
      return `<tr${a._tot?' style="background:var(--card2);border-top:2px solid var(--border)"':''}>
        <td><strong>${a.nome}</strong><div style="font-size:10px;color:var(--text2)">${sub}</div></td>
        <td class="tr" style="font-weight:600">${RK(a.valor||0)}</td>
        ${cols}
      </tr>`;
    }).join('');
    proj.innerHTML=`<thead class="thead-sticky"><tr><th>Ativo</th><th class="tr">Atual</th>${heads}</tr></thead><tbody>${rows}</tbody>`;
  }

  // Gráfico projeção
  dc('cProjLine');
  const cPL=document.getElementById('cProjLine');
  if(cPL){
    const ANOS=[0,1,2,3,5,10,20,30];
    const ativos=D.ativos.filter(a=>(a.valor||0)>0);
    const atTot=ativos.reduce((s,a)=>s+(a.valor||0),0);
    const txMedia=atTot>0?ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTot:0;
    const datasets=ativos.map((a,idx)=>({
      label:a.ticker||a.nome,data:ANOS.map(n=>Math.round(projetar(a.valor||0,taxaAnual(a),n))),
      borderColor:CHART_COLORS[idx%CHART_COLORS.length],backgroundColor:'transparent',tension:.4,pointRadius:3,borderWidth:2
    }));
    datasets.push({label:'Total',data:ANOS.map(n=>Math.round(projetar(atTot,txMedia,n))),
      borderColor:'#10B981',backgroundColor:'rgba(16,185,129,.08)',tension:.4,pointRadius:4,borderWidth:3,fill:true});
    CH['cProjLine']=new Chart(cPL,{type:'line',data:{labels:ANOS.map(a=>a===0?'Hoje':`${a}a`),datasets},options:chartOpts()});
  }
}

function addAtivo()    { D.ativos.push({nome:'Novo ativo',classe:'Renda Fixa',bucket:'C',valor:0,indice:'CDI',pct:100,ticker:''}); renderAtivos(); scheduleAutoSave(); }
function removeAtivo(i){ if(!confirm(`Remover "${D.ativos[i].nome}"?`))return; D.ativos.splice(i,1); renderAtivos(); scheduleAutoSave(); }

function renderIndicadores(){
  const fields={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fields).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)el.value=D[k]||0; });
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id);if(el)el.value=D.arcaMeta[k]||0; });

  const ic=document.getElementById('ind-cards');
  if(ic) ic.innerHTML=`
    <div class="mcard mcard-pos">
      <div class="mlabel">📊 CDI 12 meses</div>
      <div class="mval mval-pos">${P(D.cdi12)}</div>
      <div class="msub">taxa de referência</div>
    </div>
    <div class="mcard mcard-warn">
      <div class="mlabel">📋 IPCA 12 meses</div>
      <div class="mval mval-warn">${P(D.ipca12)}</div>
      <div class="msub">inflação oficial</div>
    </div>
    <div class="mcard mcard-teal">
      <div class="mlabel">📈 CDI − IPCA (real)</div>
      <div class="mval ${D.cdi12>D.ipca12?'mval-pos':'mval-neg'}">${P(D.cdi12-D.ipca12)}</div>
      <div class="msub">retorno real sobre inflação</div>
    </div>
    <div class="mcard mcard-info">
      <div class="mlabel">💰 CDI mês referência</div>
      <div class="mval mval-info">${P(D.cdifev)}</div>
    </div>
    <div class="mcard">
      <div class="mlabel">📋 IPCA mês referência</div>
      <div class="mval">${P(D.ipcafev)}</div>
    </div>
    <div class="mcard">
      <div class="mlabel">📊 CDI acum. 2026</div>
      <div class="mval">${P(D.cdi26)}</div>
    </div>
    <div class="mcard">
      <div class="mlabel">📋 IPCA acum. 2026</div>
      <div class="mval">${P(D.ipca26)}</div>
    </div>
  `;

  dc('cIndComp');
  const cIC=document.getElementById('cIndComp');
  if(cIC) CH['cIndComp']=new Chart(cIC,{type:'bar',data:{
    labels:['12 meses','Mês ref.','Acum. 2026'],
    datasets:[
      {label:'CDI',  data:[D.cdi12,D.cdifev,D.cdi26],  backgroundColor:'rgba(16,185,129,.85)',borderRadius:6},
      {label:'IPCA', data:[D.ipca12,D.ipcafev,D.ipca26],backgroundColor:'rgba(245,158,11,.85)',borderRadius:6},
    ]
  },options:chartOpts({scales:{
    x:{grid:{color:gc()},ticks:{color:tc()}},
    y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'}}
  }})});
}

// ── FORM COLLECTION ───────────────────────────────
function collectFormFields(){
  const fields={salario:'ef-salario',outras:'ef-outras',saldo:'ef-saldo',
    cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',
    ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fields).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)D[k]=parseFloat(el.value)||0; });
  const mc=document.getElementById('ef-metaCC');if(mc)D.metaCC=parseFloat(mc.value)||2000;
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id);if(el)D.arcaMeta[k]=parseFloat(el.value)||0; });
}

function saveData(){collectFormFields();if(window._firestoreSave)window._firestoreSave(true);renderAll();}

// ── INIT ──────────────────────────────────────────
applyTheme();
