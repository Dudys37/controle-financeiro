/* ═══════════════════════════════════════════════════
   FinançasPRO — app.js v5.0
   Entradas por mês, saídas com parcelas, faturas
═══════════════════════════════════════════════════ */

// ── MAPA DE MESES ─────────────────────────────────
const MMAP = {Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};
const MMAP_R = {1:'Jan',2:'Fev',3:'Mar',4:'Abr',5:'Mai',6:'Jun',7:'Jul',8:'Ago',9:'Set',10:'Out',11:'Nov',12:'Dez'};

// Converte "Mai/26" → {m:5, y:2026}
function parseMes(str) {
  const [mn, yr] = str.split('/');
  return {m: MMAP[mn]||1, y: 2000+parseInt(yr||26)};
}
// Gera "Mai/26" de {m:5, y:2026}
function mkMes(m, y) {
  if(m>12){m-=12;y++;}
  if(m<1){m+=12;y--;}
  return `${MMAP_R[m]}/${String(y).slice(2)}`;
}

// ── DADOS PADRÃO ──────────────────────────────────
const DEFAULT = {
  saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  invManual: Array(20).fill(null),
  entradas: [
    {id:'e1', nome:'Salário', valor:6500, tipo:'mensal', dia:15, ativo:true},
  ],
  cartoes:[
    {nome:'Nubank PF',    limite:3700,  bandeira:'Mastercard',cor:'#820ad1',diaFechamento:3, diaVencimento:10},
    {nome:'Nubank PJ',    limite:9700,  bandeira:'Mastercard',cor:'#820ad1',diaFechamento:3, diaVencimento:10},
    {nome:'Mercado Pago', limite:11000, bandeira:'Mastercard',cor:'#009ee3',diaFechamento:10,diaVencimento:17},
    {nome:'Renner',       limite:7200,  bandeira:'Mastercard',cor:'#e60000',diaFechamento:20,diaVencimento:27},
    {nome:'Amazon',       limite:2580,  bandeira:'Visa',      cor:'#ff9900',diaFechamento:5, diaVencimento:12},
    {nome:'SICREDI',      limite:6300,  bandeira:'Visa',      cor:'#006633',diaFechamento:10,diaVencimento:17},
  ],
  // Contas fixas (valor único, replica todos os meses)
  fixas: [
    {id:'f1', nome:'Faculdade', cat:'educacao', valor:644.05, ativo:true},
    {id:'f2', nome:'Claro',     cat:'servicos', valor:120,    ativo:true},
    {id:'f3', nome:'DAS',       cat:'impostos', valor:85,     ativo:true},
  ],
  // Compras variáveis / parceladas
  compras: [
    {id:'c1', nome:'Nubank PF - Fatura mai',  cat:'cartao', cartao:'Nubank PF',  valor:2148.08, parcelas:1, dataCompra:'2026-05-01', ativo:true},
    {id:'c2', nome:'Nubank PJ - Fatura mai',  cat:'cartao', cartao:'Nubank PJ',  valor:961.41,  parcelas:1, dataCompra:'2026-05-01', ativo:true},
    {id:'c3', nome:'SICREDI - Fatura mai',    cat:'cartao', cartao:'SICREDI',    valor:1370.44, parcelas:1, dataCompra:'2026-05-01', ativo:true},
    {id:'c4', nome:'Mercado Pago - Parcelas', cat:'cartao', cartao:'Mercado Pago',valor:4739.05,parcelas:9, dataCompra:'2026-05-01', ativo:true},
    {id:'c5', nome:'Renner - Parcelas',       cat:'cartao', cartao:'Renner',     valor:1859.64, parcelas:8, dataCompra:'2026-05-01', ativo:true},
    {id:'c6', nome:'Amazon - Parcelas',       cat:'cartao', cartao:'Amazon',     valor:634.20,  parcelas:6, dataCompra:'2026-05-01', ativo:true},
    {id:'c7', nome:'IR',                      cat:'impostos',cartao:'',          valor:675.29,  parcelas:7, dataCompra:'2026-06-01', ativo:true},
  ],
  // Legado — mantido para migração
  dividas: [],
  pagamentos: {},
  ativos:[
    {nome:'Tesouro Selic 2027',classe:'Renda Fixa',bucket:'C', valor:0,indice:'SELIC',pct:100,ticker:'TESOURO SELIC'},
    {nome:'FII XPML11',        classe:'FII',       bucket:'R', valor:0,indice:'CDI',  pct:90, ticker:'XPML11'},
    {nome:'IVVB11',            classe:'ETF',       bucket:'A2',valor:0,indice:'CDI',  pct:110,ticker:'IVVB11'},
    {nome:'BOVA11',            classe:'ETF',       bucket:'A', valor:0,indice:'CDI',  pct:100,ticker:'BOVA11'},
  ]
};

// ── TEMPLATE EM BRANCO ────────────────────────────
const BLANK = {
  saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  invManual: Array(20).fill(null),
  entradas:[], fixas:[], compras:[], dividas:[], pagamentos:{}, ativos:[], cartoes:[]
};

// ── ESTADO ────────────────────────────────────────
let D = JSON.parse(JSON.stringify(DEFAULT));
let selDash = 0;
let selEntradas = '';  // mês filtro entradas ('' = todos)
let selFaturas = -1;   // mês selecionado em faturas
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
const CATS_ENTRADA = {
  salario:    {label:'Salário',      icon:'💼', cor:'#10B981'},
  freelance:  {label:'Freelance',    icon:'💻', cor:'#8B5CF6'},
  investimento:{label:'Investimento',icon:'📈', cor:'#F59E0B'},
  aluguel:    {label:'Aluguel',      icon:'🏠', cor:'#3B82F6'},
  venda:      {label:'Venda',        icon:'🛒', cor:'#F97316'},
  bonus:      {label:'Bônus/13°',    icon:'🎁', cor:'#EC4899'},
  outros:     {label:'Outros',       icon:'📦', cor:'#6B7280'},
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
const CHART_COLORS=['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#F97316','#06B6D4','#84CC16','#EC4899','#10B981'];

// ── MIGRAÇÃO ──────────────────────────────────────
function migrateData(d) {
  if(!d) return JSON.parse(JSON.stringify(BLANK));
  // Migra campos novos
  if(!d.entradas)   d.entradas   = [];
  if(!d.fixas)      d.fixas      = [];
  if(!d.compras)    d.compras    = [];
  if(!d.cartoes)    d.cartoes    = [];
  if(!d.ativos)     d.ativos     = [];
  if(!d.arcaMeta)   d.arcaMeta   = {a:25,r:25,c:25,a2:25};
  if(!d.metaCC)     d.metaCC     = 2000;
  if(!d.meses)      d.meses      = [...BLANK.meses];
  if(!d.pagamentos) d.pagamentos = {};
  if(!d.invManual)  d.invManual  = Array(d.meses.length).fill(null);
  while(d.invManual.length < d.meses.length) d.invManual.push(null);

  // Migração legado: se tinha salario/outras, cria entrada mensal
  if((d.salario||d.outras) && d.entradas.length===0) {
    if(d.salario) d.entradas.push({id:'e_sal',nome:'Salário',valor:d.salario,tipo:'mensal',dia:15,cat:'salario',ativo:true});
    if(d.outras)  d.entradas.push({id:'e_out',nome:'Outras entradas',valor:d.outras,tipo:'mensal',dia:1,cat:'outros',ativo:true});
  }

  // Migração legado dividas → fixas/compras
  if(d.dividas && d.dividas.length > 0 && d.fixas.length === 0 && d.compras.length === 0) {
    d.dividas.forEach((dv,i) => {
      if(dv.tipo==='Fixo') {
        const v = dv.vals ? (dv.vals.find(x=>x>0)||0) : 0;
        d.fixas.push({id:'f_'+i, nome:dv.nome, cat:dv.cat||'outros', valor:v, ativo:true});
      } else {
        // Variável legacy — cria compra agregada
        const total = dv.vals ? dv.vals.reduce((s,v)=>s+(v||0),0) : 0;
        const mesesCom = dv.vals ? dv.vals.filter(v=>v>0).length : 1;
        if(total > 0) {
          d.compras.push({id:'c_'+i, nome:dv.nome, cat:dv.cat||'cartao',
            cartao:dv.limCartao||'', valor:total, parcelas:mesesCom||1,
            dataCompra:'2026-05-01', ativo:true, _legacyVals:dv.vals});
        }
      }
    });
  }

  d.entradas.forEach(e => { if(!e.cat) e.cat='outros'; if(e.ativo===undefined) e.ativo=true; if(!e.id) e.id='e'+Date.now()+Math.random(); });
  d.fixas.forEach(f => { if(!f.cat) f.cat='outros'; if(f.ativo===undefined) f.ativo=true; if(!f.id) f.id='f'+Date.now()+Math.random(); });
  d.compras.forEach(c => { if(!c.cat) c.cat='outros'; if(c.ativo===undefined) c.ativo=true; if(!c.id) c.id='c'+Date.now()+Math.random(); if(!c.parcelas) c.parcelas=1; });
  d.cartoes.forEach(c => { if(!c.cor) c.cor='#6B7280'; if(!c.diaFechamento) c.diaFechamento=10; if(!c.diaVencimento) c.diaVencimento=17; });
  d.ativos.forEach(x => { if(!x.indice) x.indice='CDI'; if(x.pct===undefined) x.pct=100; if(!x.ticker) x.ticker=''; delete x.rentab; });
  return d;
}

// ── CÁLCULOS DE ENTRADAS ─────────────────────────
function totalEMes(mi) {
  const mes = D.meses[mi];
  if(!mes) return 0;
  const {m, y} = parseMes(mes);
  return (D.entradas||[]).reduce((s,e) => {
    if(!e.ativo) return s;
    if(e.tipo==='mensal') return s+(e.valor||0);
    if(e.tipo==='anual'||e.tipo==='unico') {
      if(!e.mes) return s;
      const em = parseMes(e.mes);
      return em.m===m && em.y===y ? s+(e.valor||0) : s;
    }
    return s;
  }, 0);
}
const totalE = (mi=0) => totalEMes(mi);

// ── CÁLCULO DE PARCELAS ───────────────────────────
// Dada uma compra, retorna array com valor em cada mês de D.meses
function calcValsCompra(compra) {
  const n = nm();
  const vals = Array(n).fill(0);
  if(!compra.ativo) return vals;

  // Se tem _legacyVals (migrado do sistema antigo), usa direto
  if(compra._legacyVals) {
    compra._legacyVals.forEach((v,i) => { if(i<n) vals[i]=(v||0); });
    return vals;
  }

  const [yr, mo, dy] = (compra.dataCompra||'2026-05-01').split('-').map(Number);
  const parcelas = compra.parcelas || 1;
  const valorParc = Math.round((compra.valor||0) / parcelas * 100) / 100;

  // Acha o cartão para saber o dia de fechamento
  const cartao = D.cartoes.find(c=>c.nome===compra.cartao);
  const diaFech = cartao?.diaFechamento || 10;

  // Primeira fatura: se compra APÓS fechamento → próximo mês; senão → mês atual
  let fm = mo, fy = yr;
  if(dy > diaFech) { fm++; if(fm>12){fm=1;fy++;} }

  for(let p=0; p<parcelas; p++) {
    let bm=fm+p, by=fy;
    while(bm>12){bm-=12;by++;}
    const mesStr = mkMes(bm,by);
    const idx = D.meses.indexOf(mesStr);
    if(idx>=0 && idx<n) vals[idx] = Math.round((vals[idx]+valorParc)*100)/100;
  }
  return vals;
}

// Total de saídas no mês mi (fixas + compras variáveis)
function totalFixasMes(mi) {
  return (D.fixas||[]).reduce((s,f)=>f.ativo?s+(f.valor||0):s, 0);
}
function totalComprasMes(mi) {
  return (D.compras||[]).reduce((s,c)=>s+(calcValsCompra(c)[mi]||0), 0);
}
const totalDiv = (mi) => {
  const base = totalFixasMes(mi) + totalComprasMes(mi);
  // Desconta pagamentos
  const mes=D.meses[mi];
  const pag=D.pagamentos&&D.pagamentos[mes]||{};
  const desc = Object.values(pag).reduce((s,v)=>s+(v||0),0);
  return Math.max(0, base-desc);
};
const totalDivBruto = (mi) => totalFixasMes(mi) + totalComprasMes(mi);
const sobraM = (mi) => totalEMes(mi) - totalDiv(mi);
const nm = () => D.meses.length;
const getLim = d => { const c=D.cartoes.find(x=>x.nome===d.cartao); return c?c.limite:0; };

function calcInvest(i) {
  const e=totalEMes(i), c=totalDiv(i), meta=D.metaCC||2000, sobra=e-c;
  if(sobra<=0)   return {e,c,meta,saldo:0,sobra,regra:'negativo'};
  if(sobra<meta) return {e,c,meta,saldo:sobra*0.5,sobra,regra:'menor_meta'};
  return              {e,c,meta,saldo:sobra*0.5,sobra,regra:'maior_meta'};
}
const invDispCalc = i => calcInvest(i).saldo;
function invDisp(i) {
  if(!D.invManual) D.invManual=Array(nm()).fill(null);
  const m=D.invManual[i];
  return (m!==null&&m!==undefined&&!isNaN(m))?m:invDispCalc(i);
}
function isManual(i) { if(!D.invManual)return false; const v=D.invManual[i]; return v!==null&&v!==undefined&&!isNaN(v); }
function resetManual(i) { if(!D.invManual)D.invManual=Array(nm()).fill(null); D.invManual[i]=null; scheduleAutoSave(); renderInvestVisao(); }
function setManual(i,val) { if(!D.invManual)D.invManual=Array(nm()).fill(null); D.invManual[i]=(val===''||val===null)?null:(parseFloat(val)||0); scheduleAutoSave(); renderAll(); }
function resetTodosManual() { D.invManual=Array(nm()).fill(null); scheduleAutoSave(); renderInvestVisao(); renderAll(); }

function patrimonioLiquido() {
  const ativos=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const passivos=D.meses.reduce((s,_,i)=>s+totalComprasMes(i),0); // total em aberto
  return {ativos, passivos, liquido:ativos-passivos};
}
function scoreFinanceiro() {
  const n=nm(); if(!n)return 50;
  const totE=D.meses.reduce((s,_,i)=>s+totalEMes(i),0);
  const totD=D.meses.reduce((s,_,i)=>s+totalDivBruto(i),0);
  const ativos=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const mesesPos=D.meses.filter((_,i)=>sobraM(i)>=0).length;
  const pctMetaE=metaEmergencia()>0?Math.min(1,caixaAtual()/metaEmergencia()):0;
  let score=0;
  score+=Math.min(30,Math.round((mesesPos/n)*30));
  score+=Math.min(25,Math.round(Math.max(0,1-(totD/Math.max(totE,1)))*25));
  score+=Math.min(25,Math.round(pctMetaE*25));
  score+=Math.min(20,ativos>0?Math.min(20,Math.round((ativos/(totalEMes(0)*12||1))*20)):0);
  return Math.min(100,score);
}
function caixaAtual()     { return D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0); }
function custoFixoMes()   { return totalFixasMes(0); }
function metaEmergencia() { return custoFixoMes()*6; }
function arcaBloqueado()  { return caixaAtual()<metaEmergencia(); }
function taxaAnual(a) { const base=a.indice==='SELIC'?(D.cdi12||14.80):a.indice==='IPCA'?(D.ipca12||4.14):(D.cdi12||14.80); return (base*(a.pct||100)/100)/100; }
function projetar(v,r,n){ return v*Math.pow(1+r,n); }
function getYears() { const s=new Set(); D.meses.forEach(m=>{const p=m.match(/\/(\d+)/);if(p)s.add('20'+p[1]);}); return [...s].sort(); }
function getMesesAno(yr) { return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes('/'+yr.slice(2))); }
function genId(prefix) { return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── PAGAMENTOS ────────────────────────────────────
function isPago(id, mi) {
  if(!D.pagamentos) return false;
  const mes=D.meses[mi];
  return !!(D.pagamentos[mes]&&D.pagamentos[mes][id]);
}
function getPagoPct(mi) {
  const mes=D.meses[mi];
  const pag=D.pagamentos&&D.pagamentos[mes]||{};
  return Object.values(pag).reduce((s,v)=>s+(v||0),0);
}
// ── FORMATAÇÃO ────────────────────────────────────
const R  = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const RK = v => 'R$\u00a0'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
const P  = v => Number(v).toFixed(2)+'%';
const fmt=R, fmtK=RK, fmtP=P;
const sM = m => { const p=m.split('/'); return p[0].substring(0,3)+'/'+(p[1]||''); };
const pct = (v,t) => t>0?Math.round((v/t)*100)+'%':'0%';

// ── CHART HELPERS ─────────────────────────────────
const gc = () => getComputedStyle(document.documentElement).getPropertyValue('--gc').trim();
const tc = () => getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
const dc = id => { if(CH[id]){CH[id].destroy();delete CH[id];} };
const chartOpts = (extra={}) => ({
  responsive:true, maintainAspectRatio:false,
  interaction:{mode:'index',intersect:false},
  plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:11},boxWidth:12,padding:10}},...(extra.plugins||{})},
  scales:{
    x:{grid:{color:gc()},ticks:{color:tc(),font:{size:10},maxRotation:0,autoSkip:true,maxTicksLimit:12}},
    y:{grid:{color:gc()},ticks:{color:tc(),font:{size:10},callback:v=>RK(v)}},
    ...(extra.scales||{})
  },...extra
});

// ── TEMA ──────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  const btn=document.getElementById('theme-btn');
  if(btn) btn.textContent=isDark?'☀️':'🌙';
}
function toggleTheme() {
  isDark=!isDark; localStorage.setItem('cf_theme',isDark?'dark':'light');
  applyTheme(); Object.keys(CH).forEach(dc); renderAll();
}

// ── AUTO-SAVE ─────────────────────────────────────
function scheduleAutoSave() {
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{ if(window._firestoreSave) window._firestoreSave(false); },1500);
}

// ── ROTEAMENTO ────────────────────────────────────
function go(id,el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('on'));
  const pg=document.getElementById('page-'+id); if(pg) pg.classList.add('on');
  if(el) el.classList.add('on');
  renderPage(id);
}
function renderPage(id) {
  if(id==='dash')       renderDashboard();
  else if(id==='entradas') renderEntradas();
  else if(id==='carteira') renderCarteira();
  else if(id==='saidas')   renderSaidas();
  else if(id==='invest')   renderInvestAtiva();
  else if(id==='faturas')  renderFaturas();
  else if(id==='perfil')   { if(window._renderPerfil) window._renderPerfil(); }
  else if(id==='admin')    { if(window._renderAdmin)  window._renderAdmin(); }
}
function renderAll() {
  const a=document.querySelector('.page.on');
  const id=a?a.id.replace('page-',''):'dash';
  renderPage(id);
}
function switchSub(pid,sid,el) {
  document.querySelectorAll(`#page-${pid} .sub`).forEach(p=>p.classList.remove('on'));
  document.querySelectorAll(`#page-${pid} .stab`).forEach(t=>t.classList.remove('on'));
  const sub=document.getElementById('sub-'+sid); if(sub) sub.classList.add('on');
  if(el) el.classList.add('on');
  if(pid==='invest') renderInvestSub(sid);
  else if(pid==='dash') { if(sid==='geral') renderGeral(); else renderMes(); }
  else if(pid==='saidas') { if(sid==='fixas') renderSaidasFixas(); else renderSaidasVar(); }
}
function getActiveSub(pid) { const a=document.querySelector(`#page-${pid} .sub.on`); return a?a.id.replace('sub-',''):null; }
function renderInvestAtiva()  { const s=getActiveSub('invest')||'inv-visao'; renderInvestSub(s); }
function renderInvestSub(id) {
  if(id==='inv-visao')      renderInvestVisao();
  if(id==='inv-arca')       renderArca();
  if(id==='inv-carteira')   renderAtivos();
  if(id==='inv-indicadores')renderIndicadores();
}

// ── HELPERS ───────────────────────────────────────
function getEmptyStateAlerts() {
  const alerts=[];
  if(!D.entradas||D.entradas.length===0) alerts.push({icon:'💰',msg:'Você não tem entradas cadastradas.',page:'entradas'});
  if(!D.fixas||D.fixas.length===0) alerts.push({icon:'📌',msg:'Nenhuma conta fixa cadastrada.',page:'saidas'});
  if(!D.ativos||D.ativos.every(a=>!a.valor)) alerts.push({icon:'📈',msg:'Nenhum investimento cadastrado.',page:'invest'});
  if(!D.cartoes||D.cartoes.length===0) alerts.push({icon:'💳',msg:'Nenhum cartão cadastrado.',page:'carteira'});
  const metaE=metaEmergencia();
  if(metaE>0&&caixaAtual()<metaE*0.5) alerts.push({icon:'🛡️',msg:`Reserva de emergência em ${Math.round(caixaAtual()/metaE*100)}% da meta.`,page:''});
  return alerts;
}
function calcPatrimonioFuturo() {
  const yrs=getYears();
  const tot=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  if(tot===0) return null;
  const txMedia=D.ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/Math.max(tot,1);
  let saldo=tot;
  return yrs.map(yr=>{
    const meses=getMesesAno(yr);
    const aporte=meses.reduce((s,{i})=>s+invDisp(i),0);
    saldo=saldo*(1+txMedia)+aporte;
    return {yr,saldo:Math.round(saldo),aporte:Math.round(aporte)};
  });
}

// ── DASHBOARD ─────────────────────────────────────
function renderDashboard() {
  const sub=getActiveSub('dash')||'geral';
  if(sub==='geral') renderGeral(); else renderMes();
}

function renderGeral() {
  const n=nm();
  const totE=D.meses.reduce((s,_,i)=>s+totalEMes(i),0);
  const totD=D.meses.reduce((s,_,i)=>s+totalDivBruto(i),0);
  const totInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const totS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  const score=scoreFinanceiro();
  const pl=patrimonioLiquido();
  const pctE=metaEmergencia()>0?Math.min(100,Math.round((caixaAtual()/metaEmergencia())*100)):0;
  const scoreCor=score>=70?'#10B981':score>=40?'#F59E0B':'#EF4444';

  // Alerts
  const alerEl=document.getElementById('dash-alerts');
  const alerts=getEmptyStateAlerts();
  if(alerEl) {
    alerEl.innerHTML=alerts.length?`<div style="margin-bottom:16px">${alerts.map(a=>`<div onclick="${a.page?`go('${a.page}',document.querySelector('[onclick*=${a.page}]')`:''})" style="cursor:${a.page?'pointer':'default'};display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--warn-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--r8);margin-bottom:6px">
      <span>${a.icon}</span><span style="font-size:12px;flex:1">${a.msg}</span>${a.page?`<span style="font-size:11px;color:var(--warn)">→</span>`:''}
    </div>`).join('')}</div>`:'';
  }

  // Hero
  const hero=document.getElementById('dash-hero');
  if(hero) hero.innerHTML=`
    <div class="hero-top">
      <div>
        <div class="hero-label">Patrimônio Líquido Total</div>
        <div class="hero-amount">${RK(pl.liquido)}</div>
        <div class="hero-sub">Ativos ${RK(pl.ativos)} − Passivos em aberto</div>
      </div>
      <div class="hero-score">
        <div class="hero-score-val" style="color:${scoreCor}">${score}</div>
        <div class="hero-score-label">Score financeiro</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div>
      </div>
    </div>
    <div class="hero-pills">
      <div class="hero-pill green">💰 Renda: <strong>${RK(totalEMes(0))}/mês</strong></div>
      <div class="hero-pill ${totS>=0?'green':'red'}">📊 Sobra: <strong>${RK(totS)}</strong></div>
      <div class="hero-pill blue">🚀 P/ Investir: <strong>${RK(totInv)}</strong></div>
      <div class="hero-pill ${pctE>=100?'green':pctE>=50?'':'red'}">🛡️ Reserva: <strong>${pctE}%</strong></div>
    </div>`;

  // Metric cards
  const mc=document.getElementById('dash-mcards');
  if(mc) mc.innerHTML=`
    <div class="mcard mcard-pos"><div class="mlabel">💰 Renda total período</div><div class="mval mval-pos">${RK(totE)}</div><div class="msub">${n} meses</div></div>
    <div class="mcard mcard-neg"><div class="mlabel">💸 Saídas total período</div><div class="mval mval-neg">${RK(totD)}</div><div class="msub">${pct(totD,totE)} da renda</div></div>
    <div class="mcard mcard-teal"><div class="mlabel">🚀 Total p/ investir</div><div class="mval mval-teal">${RK(totInv)}</div></div>
    <div class="mcard ${totS>=0?'mcard-pos':'mcard-neg'}"><div class="mlabel">📊 Sobra acumulada</div><div class="mval ${totS>=0?'mval-pos':'mval-neg'}">${RK(totS)}</div></div>
    <div class="mcard mcard-accent"><div class="mlabel">📈 Score financeiro</div><div class="mval mval-accent">${score}<span style="font-size:14px">/100</span></div></div>
    <div class="mcard ${pctE>=100?'mcard-pos':pctE>=50?'mcard-warn':'mcard-neg'}"><div class="mlabel">🛡️ Reserva emergência</div><div class="mval ${pctE>=100?'mval-pos':pctE>=50?'mval-warn':'mval-neg'}">${pctE}%</div><div class="msub">meta: ${RK(metaEmergencia())}</div></div>
  `;

  renderYearBlocks();
  renderFluxoTable();
  renderGeralCharts();

  // Patrimônio futuro
  const pf=calcPatrimonioFuturo();
  const pfEl=document.getElementById('dash-patrimonio-futuro');
  if(pfEl&&pf&&pf.length) {
    pfEl.innerHTML=`
    <div class="divider"><span class="divider-text">📈 Patrimônio futuro esperado</span></div>
    <div class="panel mb">
      <div class="panel-head"><span class="panel-title">💎 Projeção seguindo recomendações do sistema</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:10px">
        ${pf.map((p,i)=>`<div class="mcard ${i===pf.length-1?'mcard-accent':''}">
          <div class="mlabel">${i===pf.length-1?'🎯 ':''}${p.yr}</div>
          <div class="mval ${i===pf.length-1?'mval-accent':'mval-teal'}" style="font-size:18px">${fmtK(p.saldo)}</div>
          <div class="msub">aportes: ${fmtK(p.aporte)}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text3)">⚠️ Projeção estimada. Não garante rentabilidade futura.</div>
    </div>`;
  } else if(pfEl) pfEl.innerHTML='';
}

function renderFluxoTable() {
  const ft=document.getElementById('fluxo-tbl');if(!ft)return;
  const yrs=getYears();
  const rows=D.meses.map((m,i)=>{
    const e=totalEMes(i),d=totalDivBruto(i),inv=invDisp(i),s=sobraM(i);
    const r=calcInvest(i);
    const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
    const yr=m.match(/\/(\d+)/);const yrN=yr?'20'+yr[1]:'';
    const clr=yrs[0]===yrN?'rgba(59,130,246,.3)':'rgba(139,92,246,.3)';
    return `<tr style="border-left:3px solid ${clr}">
      <td style="font-weight:600">${m}</td>
      <td class="tr tpos">${fmt(e)}</td>
      <td class="tr tneg">${fmt(d)}</td>
      <td class="tr ${s>=0?'tpos':'tneg'}">${fmt(s)}</td>
      <td class="tr tteal">${fmt(inv)} ${icon}</td>
    </tr>`;
  }).join('');
  const tD=D.meses.reduce((s,_,i)=>s+totalDivBruto(i),0);
  const tInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const tS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  ft.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Saídas</th><th class="tr">Sobra</th>
    <th class="tr" style="color:var(--teal)">💰 P/ Investir</th>
  </tr></thead><tbody>${rows}
  <tr style="background:var(--card2);font-weight:700">
    <td>TOTAL</td><td></td><td class="tr tneg">${fmt(tD)}</td>
    <td class="tr ${tS>=0?'tpos':'tneg'}">${fmt(tS)}</td>
    <td class="tr tteal">${fmt(tInv)}</td>
  </tr></tbody>`;
}

function renderGeralCharts() {
  // Doughnut saídas por categoria (fixas + compras)
  dc('cDough');
  const catTots={};
  D.fixas.forEach(f=>{ if(f.ativo){ const c=f.cat||'outros'; catTots[c]=(catTots[c]||0)+f.valor*nm(); } });
  D.compras.forEach(c=>{ if(c.ativo){ const cat=c.cat||'outros'; const tot=calcValsCompra(c).reduce((s,v)=>s+v,0); catTots[cat]=(catTots[cat]||0)+tot; } });
  const catE=Object.entries(catTots).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
  const cD=document.getElementById('cDough');
  if(cD) CH['cDough']=new Chart(cD,{type:'doughnut',data:{
    labels:catE.map(([k])=>(CATS[k]?.icon||'📦')+' '+(CATS[k]?.label||k)),
    datasets:[{data:catE.map(([,v])=>v),backgroundColor:catE.map(([k])=>CATS[k]?.cor||'#888'),borderWidth:0,hoverOffset:10}]
  },options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'right',labels:{color:tc(),font:{size:11},boxWidth:10,padding:8}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}}});

  // Ranking
  const rl=document.getElementById('rank-list');
  if(rl){
    const items=[
      ...D.fixas.filter(f=>f.ativo).map(f=>({nome:f.nome,cat:f.cat,total:f.valor*nm()})),
      ...D.compras.filter(c=>c.ativo).map(c=>({nome:c.nome,cat:c.cat,total:calcValsCompra(c).reduce((s,v)=>s+v,0)}))
    ].sort((a,b)=>b.total-a.total).slice(0,8);
    const maxT=items[0]?.total||1;
    rl.innerHTML=items.map((d,i)=>{
      const cat=CATS[d.cat]||CATS.outros;
      return `<div class="rank-row">
        <span class="rank-n">${i+1}</span><span class="rank-icon">${cat.icon}</span>
        <span class="rank-name">${d.nome}</span>
        <div class="rank-bar-wrap"><div class="rank-bar-fill" style="width:${Math.round((d.total/maxT)*100)}%;background:${cat.cor}"></div></div>
        <span class="rank-val">${fmt(d.total)}</span>
      </div>`;
    }).join('');
  }

  // Linha evolução
  dc('cEvol');
  const cEv=document.getElementById('cEvol');
  if(cEv) {
    const comprasAtivas=D.compras.filter(c=>c.ativo);
    CH['cEvol']=new Chart(cEv,{type:'line',data:{
      labels:D.meses.map(sM),
      datasets:[
        {label:'Fixas',data:D.meses.map(()=>totalFixasMes(0)),borderColor:'#3B82F6',backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:1.5,borderDash:[5,3]},
        ...comprasAtivas.slice(0,5).map((c,idx)=>({
          label:c.nome,data:calcValsCompra(c),
          borderColor:CHART_COLORS[idx%CHART_COLORS.length],backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:1.5
        }))
      ]
    },options:chartOpts()});
  }
}

function renderYearBlocks() {
  const container=document.getElementById('year-blocks');if(!container)return;
  container.innerHTML='';
  getYears().forEach((yr,yi)=>{
    const meses=getMesesAno(yr);if(!meses.length)return;
    const totE=meses.reduce((s,{i})=>s+totalEMes(i),0);
    const totD=meses.reduce((s,{i})=>s+totalDivBruto(i),0);
    const totInv=meses.reduce((s,{i})=>s+invDisp(i),0);
    const totS=meses.reduce((s,{i})=>s+sobraM(i),0);
    const isCol=yrCollapsed[yr]!==false;
    const acorCor=yi===0?'#3B82F6':'#8B5CF6';
    const tagCls=yi===0?'yr-tag-26':'yr-tag-27';
    const block=document.createElement('div');
    block.className='yrblock mb';
    block.innerHTML=`
      <div class="yrblock-head" onclick="toggleYr('${yr}')">
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span class="yr-tag ${tagCls}">${yr}</span>
          <span style="font-size:12px;color:var(--text2)">${meses.length} meses</span>
        </div>
        <div class="yr-meta-pills">
          <span class="yr-meta-pill">💰 <strong style="color:#10B981">${RK(totE)}</strong></span>
          <span class="yr-meta-pill">💸 <strong style="color:#EF4444">${RK(totD)}</strong></span>
          <span class="yr-meta-pill">🚀 <strong style="color:#06B6D4">${RK(totInv)}</strong></span>
          <span class="yr-meta-pill"><strong style="color:${totS>=0?'#10B981':'#EF4444'}">${RK(totS)}</strong></span>
        </div>
        <span class="yr-chev${isCol?'':' open'}">▾</span>
      </div>
      <div class="yr-body${isCol?' hidden':''}" id="yr-body-${yr}">
        <div class="timeline" id="tl-${yr}" style="margin:12px 0"></div>
        <div class="g2 mb">
          <div class="panel"><div class="panel-head"><span class="panel-title">📊 Saídas vs Disponível</span></div><div class="chart-wrap" style="height:180px"><canvas id="cBar${yr}"></canvas></div></div>
          <div class="panel"><div class="panel-head"><span class="panel-title">📈 Sobra acumulada</span></div><div class="chart-wrap" style="height:180px"><canvas id="cAcum${yr}"></canvas></div></div>
        </div>
      </div>`;
    container.appendChild(block);
    const tl=document.getElementById('tl-'+yr);
    if(tl) tl.innerHTML=meses.map(({m,i})=>{const s=sobraM(i);return `<div class="tlcell ${s>=0?'pos':'neg'}"><div class="tlm">${sM(m)}</div><div class="tlv ${s>=0?'pos':'neg'}">${RK(s)}</div><div class="tls" style="color:var(--teal)">🚀${RK(invDisp(i))}</div></div>`;}).join('');
    if(!isCol){
      dc('cBar'+yr);dc('cAcum'+yr);
      const cB=document.getElementById('cBar'+yr);
      if(cB) CH['cBar'+yr]=new Chart(cB,{type:'bar',data:{labels:meses.map(x=>sM(x.m)),datasets:[
        {label:'Saídas',   data:meses.map(x=>totalDivBruto(x.i)),backgroundColor:'rgba(239,68,68,.8)',borderRadius:4},
        {label:'P/Invest.',data:meses.map(x=>invDisp(x.i)),      backgroundColor:'rgba(6,182,212,.8)',borderRadius:4},
      ]},options:chartOpts()});
      let acc=0;const acumArr=meses.map(({i})=>{acc+=sobraM(i);return Math.round(acc*100)/100;});
      const cA=document.getElementById('cAcum'+yr);
      if(cA) CH['cAcum'+yr]=new Chart(cA,{type:'line',data:{labels:meses.map(x=>sM(x.m)),datasets:[{data:acumArr,borderColor:acorCor,backgroundColor:acorCor.replace('rgb','rgba').replace(')',',0.08)'),tension:.4,fill:true,pointRadius:4,borderWidth:2,pointBackgroundColor:acumArr.map(v=>v>=0?'#10B981':'#EF4444')}]},options:chartOpts({plugins:{legend:{display:false}}})});
    }
  });
}
function toggleYr(yr){yrCollapsed[yr]=!yrCollapsed[yr];renderYearBlocks();}

// ── POR MÊS ───────────────────────────────────────
function renderMes() {
  const i=selDash;
  const e=totalEMes(i),d=totalDivBruto(i),s=sobraM(i),inv=invDisp(i);
  const r=calcInvest(i);
  const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
  const pl=patrimonioLiquido();
  document.getElementById('dash-sec-label').textContent='Resumo de '+(D.meses[i]||'');
  buildMonths('dash-months',i,j=>{selDash=j;renderMes();});
  const mc=document.getElementById('mes-cards');
  if(mc) mc.innerHTML=`
    <div class="mcard mcard-pos"><div class="mlabel">💰 Entradas</div><div class="mval mval-pos">${fmt(e)}</div></div>
    <div class="mcard mcard-neg"><div class="mlabel">💸 Saídas</div><div class="mval mval-neg">${fmt(d)}</div><div class="msub">${pct(d,e)} da renda</div></div>
    <div class="mcard ${s>=0?'mcard-pos':'mcard-neg'}"><div class="mlabel">📊 Sobra</div><div class="mval ${s>=0?'mval-pos':'mval-neg'}">${fmt(s)}</div></div>
    <div class="mcard mcard-teal" style="border-color:rgba(6,182,212,.3)"><div class="mlabel">${icon} P/ investir</div><div class="mval mval-teal">${fmt(inv)}</div></div>
    <div class="mcard mcard-info"><div class="mlabel">🏦 Saldo CC</div><div class="mval mval-info">${fmt(D.saldo)}</div></div>
    <div class="mcard mcard-accent"><div class="mlabel">💎 Patrimônio líquido</div><div class="mval mval-accent">${fmt(pl.liquido)}</div></div>
  `;
  // Por categoria
  const cats={};
  D.fixas.filter(f=>f.ativo).forEach(f=>{ const c=f.cat||'outros'; if(!cats[c])cats[c]={total:0,items:[]}; cats[c].total+=f.valor; cats[c].items.push({nome:f.nome,v:f.valor}); });
  D.compras.filter(c=>c.ativo).forEach(c=>{ const v=calcValsCompra(c)[i]||0; if(!v)return; const cat=c.cat||'outros'; if(!cats[cat])cats[cat]={total:0,items:[]}; cats[cat].total+=v; cats[cat].items.push({nome:c.nome,v}); });
  const cc=document.getElementById('mes-cat-cards');
  if(cc) cc.innerHTML=Object.entries(cats).sort(([,a],[,b])=>b.total-a.total).map(([cat,{total,items}])=>{
    const info=CATS[cat]||CATS.outros;
    return `<div class="mcard" style="border-color:${info.cor}33"><div class="mlabel" style="color:${info.cor}">${info.icon} ${info.label}</div><div class="mval tneg" style="font-size:18px">${fmt(total)}</div><div style="font-size:10px;color:var(--text2);margin-top:6px;line-height:1.6">${items.map(x=>`${x.nome}: <strong>${fmt(x.v)}</strong>`).join(' · ')}</div></div>`;
  }).join('');
  renderCartoesTo(document.getElementById('mes-cartoes'),i);
  // Charts
  dc('cMesBar');dc('cMesDough');
  const cMB=document.getElementById('cMesBar');
  if(cMB) CH['cMesBar']=new Chart(cMB,{type:'bar',data:{labels:D.meses.map(sM),datasets:[
    {label:'Saídas',    data:D.meses.map((_,j)=>totalDivBruto(j)),backgroundColor:'rgba(239,68,68,.75)',borderRadius:4},
    {label:'P/Investir',data:D.meses.map((_,j)=>invDisp(j)),      backgroundColor:'rgba(6,182,212,.75)',borderRadius:4},
  ]},options:chartOpts()});
  const catTots={};
  D.fixas.filter(f=>f.ativo).forEach(f=>{ catTots[f.cat||'outros']=(catTots[f.cat||'outros']||0)+f.valor; });
  D.compras.filter(c=>c.ativo).forEach(c=>{ const v=calcValsCompra(c)[i]||0; if(v) catTots[c.cat||'outros']=(catTots[c.cat||'outros']||0)+v; });
  const cMD=document.getElementById('cMesDough');
  if(cMD){ const catE=Object.entries(catTots).filter(([,v])=>v>0); CH['cMesDough']=new Chart(cMD,{type:'doughnut',data:{labels:catE.map(([k])=>(CATS[k]?.icon||'📦')+' '+(CATS[k]?.label||k)),datasets:[{data:catE.map(([,v])=>v),backgroundColor:catE.map(([k])=>CATS[k]?.cor||'#888'),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'right',labels:{color:tc(),font:{size:10},boxWidth:10}},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}}}}); }
}
function buildMonths(cid,sel,cb){const el=document.getElementById(cid);if(!el)return;const ativos=getActiveMeses();el.innerHTML=ativos.map((m)=>{const i=D.meses.indexOf(m);return`<button class="msb${i===sel?' on':''}" onclick="(${cb.toString()})(${i})">${sM(m)}</button>`;}).join('');}

// ── ENTRADAS ──────────────────────────────────────
function renderEntradas() {
  // Filtro de mês
  const filtroEl=document.getElementById('entradas-filtro');
  if(filtroEl) {
    const ativosE=getActiveMeses();
    filtroEl.innerHTML=`<button class="msb${selEntradas===''?' on':''}" onclick="selEntradas='';renderEntradas()">Todos</button>`
      +ativosE.map(m=>`<button class="msb${selEntradas===m?' on':''}" onclick="selEntradas='${m}';renderEntradas()">${sM(m)}</button>`).join('');
  }

  const ativas=D.entradas.filter(e=>{
    if(!selEntradas) return true;
    if(e.tipo==='mensal') return true;
    return e.mes===selEntradas;
  });

  // Resumo
  const totalMes=selEntradas
    ? ativas.reduce((s,e)=>{ const mi=D.meses.indexOf(selEntradas); return s+totalEMes(mi===-1?0:mi); },0)
    : totalEMes(0);
  const totalAnual=D.meses.reduce((s,_,i)=>s+totalEMes(i),0);

  const sumEl=document.getElementById('entradas-summary');
  if(sumEl) sumEl.innerHTML=`
    <div class="mcard mcard-pos"><div class="mlabel">💰 ${selEntradas?selEntradas:'Média mensal'}</div><div class="mval mval-pos">${fmt(totalMes)}</div></div>
    <div class="mcard mcard-accent"><div class="mlabel">📅 Total no período</div><div class="mval mval-accent">${fmt(totalAnual)}</div><div class="msub">${D.meses.length} meses</div></div>
    <div class="mcard"><div class="mlabel">📋 Fontes de renda</div><div class="mval">${D.entradas.filter(e=>e.ativo).length}</div></div>
  `;

  // Lista
  const lista=document.getElementById('entradas-lista');
  if(!lista) return;
  if(!D.entradas.length) { lista.innerHTML=`<div class="empty"><div class="empty-icon">💰</div><div class="empty-text">Nenhuma entrada cadastrada.<br>Clique em "+ Nova entrada" para começar.</div></div>`; return; }
  lista.innerHTML=D.entradas.map((e,ei)=>{
    const info=CATS_ENTRADA[e.cat]||CATS_ENTRADA.outros;
    const tipoBadge=e.tipo==='mensal'?'<span class="badge badge-pos">Mensal</span>':e.tipo==='anual'?'<span class="badge badge-warn">Anual</span>':'<span class="badge badge-user">Único</span>';
    const visivel=!selEntradas||(e.tipo==='mensal')||(e.mes===selEntradas);
    if(!visivel) return '';
    const mesInfo=e.tipo!=='mensal'&&e.mes?` · ${e.mes}`:'';
    return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r12);margin-bottom:8px;${!e.ativo?'opacity:.5':''}transition:all .15s" onmouseenter="this.style.borderColor='var(--border2)'" onmouseleave="this.style.borderColor='var(--border)'">
      <span style="font-size:22px">${info.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">${e.nome} ${tipoBadge}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${info.label}${e.dia?` · Dia ${e.dia}`:''}${mesInfo}</div>
      </div>
      <div style="text-align:right;min-width:120px">
        <div style="font-size:20px;font-weight:700;color:var(--pos)">${fmt(e.valor)}</div>
        <div style="font-size:10px;color:var(--text2)">${e.tipo==='mensal'?'todo mês':e.tipo==='anual'?'todo ano':'ocorrência única'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarEntrada(${ei})">✏️</button>
        <button class="btn ${e.ativo?'btn-ghost':'btn-pos'}" style="height:32px;font-size:11px" onclick="toggleEntrada(${ei})">${e.ativo?'Pausar':'Ativar'}</button>
        <button class="btn-rm" onclick="removerEntrada(${ei})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function abrirModalEntrada(ei=-1) {
  const e=ei>=0?D.entradas[ei]:{id:'',nome:'',valor:0,tipo:'mensal',dia:1,mes:'',cat:'salario',ativo:true};
  document.getElementById('modal-entrada-overlay').style.display='flex';
  document.getElementById('me-nome').value=e.nome;
  document.getElementById('me-valor').value=e.valor||'';
  document.getElementById('me-tipo').value=e.tipo||'mensal';
  document.getElementById('me-dia').value=e.dia||1;
  document.getElementById('me-cat').value=e.cat||'salario';
  document.getElementById('me-mes').value=e.mes||'';
  toggleEntradaMes();
  document.getElementById('btn-salvar-entrada').onclick=()=>salvarEntrada(ei);
}
function editarEntrada(ei){abrirModalEntrada(ei);}
function toggleEntradaMes() {
  const tipo=document.getElementById('me-tipo').value;
  const mesField=document.getElementById('me-mes-field');
  if(mesField) mesField.style.display=(tipo!=='mensal')?'':'none';
}
function salvarEntrada(ei) {
  const nome=document.getElementById('me-nome').value.trim();
  const valor=parseFloat(document.getElementById('me-valor').value)||0;
  const tipo=document.getElementById('me-tipo').value;
  const dia=parseInt(document.getElementById('me-dia').value)||1;
  const cat=document.getElementById('me-cat').value;
  const mes=document.getElementById('me-mes').value;
  if(!nome){alert('Informe o nome da entrada.');return;}
  const obj={id:ei>=0?D.entradas[ei].id:genId('e'),nome,valor,tipo,dia,cat,mes:(tipo!=='mensal'?mes:''),ativo:true};
  if(ei>=0) D.entradas[ei]=obj; else D.entradas.push(obj);
  fecharModalEntrada(); scheduleAutoSave(); renderEntradas(); renderAll();
}
function fecharModalEntrada(){document.getElementById('modal-entrada-overlay').style.display='none';}
function toggleEntrada(ei){D.entradas[ei].ativo=!D.entradas[ei].ativo;scheduleAutoSave();renderEntradas();}
function removerEntrada(ei){if(!confirm(`Remover "${D.entradas[ei].nome}"?`))return;D.entradas.splice(ei,1);scheduleAutoSave();renderEntradas();}

// ── CARTEIRA ──────────────────────────────────────
function renderCarteira() {
  const el=document.getElementById('ef-saldo');if(el)el.value=D.saldo||0;
  const mc=document.getElementById('ef-metaCC');if(mc)mc.value=D.metaCC||2000;

  const pl=patrimonioLiquido();
  const totalLim=D.cartoes.reduce((s,c)=>s+(c.limite||0),0);
  const score=scoreFinanceiro();
  const scoreCor=score>=70?'#10B981':score>=40?'#F59E0B':'#EF4444';
  const e0=totalEMes(0);

  // Hero
  const h=document.getElementById('carteira-hero');
  if(h) h.innerHTML=`<div class="hero-banner">
    <div class="hero-top">
      <div>
        <div class="hero-label">Patrimônio Líquido</div>
        <div class="hero-amount">${RK(pl.liquido)}</div>
        <div class="hero-sub">Ativos ${RK(pl.ativos)}</div>
      </div>
      <div class="hero-score"><div class="hero-score-val" style="color:${scoreCor}">${score}</div><div class="hero-score-label">Score</div><div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div></div>
    </div>
    <div class="hero-pills">
      <div class="hero-pill green">💰 Renda: <strong>${RK(e0)}/mês</strong></div>
      <div class="hero-pill blue">🏦 Saldo CC: <strong>${RK(D.saldo)}</strong></div>
      <div class="hero-pill">💳 Limite total: <strong>${RK(totalLim)}</strong></div>
    </div>
  </div>`;

  const res=document.getElementById('carteira-resumo');
  if(res) res.innerHTML=`
    <div class="pstat"><span class="pstat-label">Renda mensal (mês 1)</span><strong style="color:#10B981">${fmt(e0)}</strong></div>
    <div class="pstat"><span class="pstat-label">Saldo conta corrente</span><strong>${fmt(D.saldo)}</strong></div>
    <div class="pstat"><span class="pstat-label">Meta conta corrente</span><strong style="color:var(--teal)">${fmt(D.metaCC)}</strong></div>
    <div class="pstat"><span class="pstat-label">Patrimônio líquido</span><strong style="color:${pl.liquido>=0?'#06B6D4':'#EF4444'}">${fmt(pl.liquido)}</strong></div>
    <div class="pstat"><span class="pstat-label">Score financeiro</span><strong style="color:${scoreCor}">${score}/100</strong></div>
  `;

  // Tabela cartões
  const ct=document.getElementById('cartoes-tbl');
  if(ct){
    const rows=D.cartoes.map((c,ci)=>`<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${c.cor||'#888'}"></div>
        <input type="text" value="${c.nome}" onchange="D.cartoes[${ci}].nome=this.value;scheduleAutoSave()" style="font-weight:600;min-width:100px">
      </div></td>
      <td><select onchange="D.cartoes[${ci}].bandeira=this.value;scheduleAutoSave()">${['Mastercard','Visa','Elo','Amex','Hipercard'].map(b=>`<option${c.bandeira===b?' selected':''}>${b}</option>`).join('')}</select></td>
      <td><input type="number" step="100" value="${c.limite||0}" onchange="D.cartoes[${ci}].limite=parseFloat(this.value)||0;scheduleAutoSave()" style="text-align:right"></td>
      <td><input type="number" min="1" max="31" value="${c.diaFechamento||10}" onchange="D.cartoes[${ci}].diaFechamento=parseInt(this.value)||10;scheduleAutoSave()" style="width:60px;text-align:center" title="Dia de fechamento da fatura"></td>
      <td><input type="number" min="1" max="31" value="${c.diaVencimento||17}" onchange="D.cartoes[${ci}].diaVencimento=parseInt(this.value)||17;scheduleAutoSave()" style="width:60px;text-align:center" title="Dia de vencimento"></td>
      <td><button class="btn-rm" onclick="removeCartao(${ci})">✕</button></td>
    </tr>`).join('');
    ct.innerHTML=`<thead><tr><th>Nome</th><th>Bandeira</th><th class="tr">Limite (R$)</th><th>Fechamento</th><th>Vencimento</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  // Recomendação ARCA
  const recEl=document.getElementById('carteira-arca-rec');
  if(recEl){
    const intel=calcARCAIntelligence();
    const dispMes=invDisp(0);
    const recAbs={A:Math.round(dispMes*(intel.rec.a/100)),R:Math.round(dispMes*(intel.rec.r/100)),C:Math.round(dispMes*(intel.rec.c/100)),A2:Math.round(dispMes*(intel.rec.a2/100))};
    recEl.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <div><div style="font-weight:700;font-size:15px">🧠 Como investir ${fmt(dispMes)} este mês</div><div style="font-size:12px;color:var(--text2);margin-top:2px">${intel.cicloEmoji} ${intel.cicloDesc}</div></div>
        <button class="btn btn-accent" onclick="applyARCARec(${intel.rec.a},${intel.rec.r},${intel.rec.c},${intel.rec.a2})" style="height:34px;font-size:12px">🎯 Aplicar nas metas</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${[{b:'A',l:'Ações'},{b:'R',l:'Real Estate'},{b:'C',l:'Caixa'},{b:'A2',l:'Internacional'}].map(x=>`
        <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);padding:10px;text-align:center">
          <div style="font-size:10px;font-weight:700;color:${ARCA.colors[x.b]};text-transform:uppercase;margin-bottom:4px">${x.l}</div>
          <div style="font-size:18px;font-weight:800;color:${ARCA.colors[x.b]}">${intel.rec[x.b==='A2'?'a2':x.b.toLowerCase()]}%</div>
          <div style="font-size:11px;color:var(--teal);margin-top:2px">${fmt(recAbs[x.b])}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:10px">⚠️ Sugestão baseada no ciclo de juros. Não é assessoria de investimento.</div>`;
  }
}
function addCartao()    { D.cartoes.push({nome:'Novo Cartão',bandeira:'Mastercard',limite:0,cor:'#6B7280',diaFechamento:10,diaVencimento:17}); renderCarteira(); scheduleAutoSave(); }
function removeCartao(i){ if(!confirm(`Remover "${D.cartoes[i].nome}"?`))return; D.cartoes.splice(i,1); renderCarteira(); scheduleAutoSave(); }

// ── SAÍDAS ────────────────────────────────────────
function renderSaidas() {
  const sub=getActiveSub('saidas')||'fixas';
  if(sub==='fixas') renderSaidasFixas(); else renderSaidasVar();
}
function renderSaidasFixas() {
  const el=document.getElementById('lista-fixas');if(!el)return;
  if(!D.fixas.length){ el.innerHTML=`<div class="empty"><div class="empty-icon">📌</div><div class="empty-text">Nenhuma conta fixa. Clique em + para adicionar.</div></div>`; return; }
  el.innerHTML=D.fixas.map((f,fi)=>{
    const info=CATS[f.cat]||CATS.outros;
    return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r12);margin-bottom:8px;${!f.ativo?'opacity:.5':''}">
      <span style="font-size:22px">${info.icon}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">${f.nome} <span class="badge badge-fixo">Fixo</span></div>
        <div style="font-size:11px;color:var(--text2)">${info.label} · todo mês</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:700;color:var(--neg)">${fmt(f.valor)}</div>
        <div style="font-size:10px;color:var(--text2)">${fmtK(f.valor*nm())} no período</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarFixa(${fi})">✏️</button>
        <button class="btn-rm" onclick="removerFixa(${fi})">✕</button>
      </div>
    </div>`;
  }).join('');
  // Totais
  const totFixed=D.fixas.filter(f=>f.ativo).reduce((s,f)=>s+(f.valor||0),0);
  document.getElementById('fixas-total').textContent=`Total fixo/mês: ${fmt(totFixed)}`;
}
function renderSaidasVar() {
  const el=document.getElementById('lista-var');if(!el)return;
  if(!D.compras.length){ el.innerHTML=`<div class="empty"><div class="empty-icon">🔄</div><div class="empty-text">Nenhuma compra/parcela. Clique em + para adicionar.</div></div>`; return; }
  el.innerHTML=D.compras.map((c,ci)=>{
    const info=CATS[c.cat]||CATS.outros;
    const valsC=calcValsCompra(c);
    const total=valsC.reduce((s,v)=>s+v,0);
    const primMes=D.meses.findIndex((_,i)=>valsC[i]>0);
    const ultMes=D.meses.reduce((b,_,i)=>valsC[i]>0?i:b,-1);
    const cartao=D.cartoes.find(ct=>ct.nome===c.cartao);
    const parStr=c.parcelas>1?`${c.parcelas}x de ${fmt((c.valor||0)/c.parcelas)}`:`à vista`;
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:8px;${!c.ativo?'opacity:.5':''}">
      <div style="display:flex;align-items:flex-start;gap:12px">
        <span style="font-size:22px">${info.icon}</span>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-weight:700;font-size:14px">${c.nome}</span>
            <span class="badge badge-var">Variável</span>
            ${c.cartao?`<span class="badge" style="background:var(--card3);color:var(--text2)">💳 ${c.cartao}</span>`:''}
          </div>
          <div style="font-size:11px;color:var(--text2);margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">
            <span>📅 Compra: ${c.dataCompra||'—'}</span>
            <span>${parStr}</span>
            ${cartao?`<span>📋 Fechamento: dia ${cartao.diaFechamento}</span>`:''}
            ${primMes>=0?`<span>📆 ${D.meses[primMes]}${ultMes>primMes?' → '+D.meses[ultMes]:''}</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:20px;font-weight:700;color:var(--neg)">${fmt(c.valor)}</div>
          <div style="font-size:10px;color:var(--text2)">total: ${fmt(total)}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarCompra(${ci})">✏️</button>
          <button class="btn-rm" onclick="removerCompra(${ci})">✕</button>
        </div>
      </div>
      ${c.parcelas>1?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:10px">${valsC.map((v,i)=>v>0?`<span class="cc-chip-sml">${sM(D.meses[i])}: ${fmtK(v)}</span>`:'').filter(Boolean).join('')}</div>`:''}
    </div>`;
  }).join('');
  // Anos
  renderAnosList();
}

function abrirModalFixa(fi=-1) {
  const f=fi>=0?D.fixas[fi]:{nome:'',cat:'outros',valor:0,ativo:true};
  document.getElementById('modal-fixa-overlay').style.display='flex';
  document.getElementById('mf-nome').value=f.nome;
  document.getElementById('mf-cat').value=f.cat||'outros';
  document.getElementById('mf-valor').value=f.valor||'';
  document.getElementById('btn-salvar-fixa').onclick=()=>salvarFixa(fi);
}
function salvarFixa(fi) {
  const nome=document.getElementById('mf-nome').value.trim();
  const cat=document.getElementById('mf-cat').value;
  const valor=parseFloat(document.getElementById('mf-valor').value)||0;
  if(!nome){alert('Informe o nome.');return;}
  const obj={id:fi>=0?D.fixas[fi].id:genId('f'),nome,cat,valor,ativo:true};
  if(fi>=0) D.fixas[fi]=obj; else D.fixas.push(obj);
  document.getElementById('modal-fixa-overlay').style.display='none';
  scheduleAutoSave(); renderSaidasFixas(); renderAll();
}
function editarFixa(fi){abrirModalFixa(fi);}
function removerFixa(fi){if(!confirm(`Remover "${D.fixas[fi].nome}"?`))return;D.fixas.splice(fi,1);scheduleAutoSave();renderSaidasFixas();}

function abrirModalCompra(ci=-1) {
  const c=ci>=0?D.compras[ci]:{nome:'',cat:'cartao',cartao:'',valor:0,parcelas:1,dataCompra:new Date().toISOString().slice(0,10),ativo:true};
  document.getElementById('modal-compra-overlay').style.display='flex';
  document.getElementById('mc-nome').value=c.nome;
  document.getElementById('mc-cat').value=c.cat||'cartao';
  document.getElementById('mc-cartao').innerHTML='<option value="">— Sem cartão (débito/pix) —</option>'+D.cartoes.map(ct=>`<option value="${ct.nome}"${c.cartao===ct.nome?' selected':''}>${ct.nome}</option>`).join('');
  document.getElementById('mc-cartao').value=c.cartao||'';
  document.getElementById('mc-valor').value=c.valor||'';
  document.getElementById('mc-parcelas').value=c.parcelas||1;
  document.getElementById('mc-data').value=c.dataCompra||new Date().toISOString().slice(0,10);
  document.getElementById('btn-salvar-compra').onclick=()=>salvarCompra(ci);
  atualizarPreviewCompra();
}
function atualizarPreviewCompra() {
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const parcelas=parseInt(document.getElementById('mc-parcelas').value)||1;
  const cartaoNome=document.getElementById('mc-cartao').value;
  const data=document.getElementById('mc-data').value;
  const prev=document.getElementById('mc-preview');
  if(!prev||!data) return;
  const tmpC={valor,parcelas,dataCompra:data,cartao:cartaoNome,ativo:true};
  const vals=calcValsCompra(tmpC);
  const mesesCom=D.meses.filter((_,i)=>vals[i]>0);
  if(!mesesCom.length){prev.innerHTML='<span style="color:var(--text3)">Nenhum mês no planejamento corresponde a esta data.</span>';return;}
  prev.innerHTML=`<div style="font-size:12px;color:var(--text2)">Será lançado em: <strong>${mesesCom.map(m=>sM(m)).join(', ')}</strong></div>${parcelas>1?`<div style="font-size:11px;color:var(--text3)">${parcelas}x de ${fmt(valor/parcelas)}</div>`:''}`;
}
function salvarCompra(ci) {
  const nome=document.getElementById('mc-nome').value.trim();
  const cat=document.getElementById('mc-cat').value;
  const cartao=document.getElementById('mc-cartao').value;
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const parcelas=parseInt(document.getElementById('mc-parcelas').value)||1;
  const dataCompra=document.getElementById('mc-data').value;
  if(!nome){alert('Informe o nome.');return;}
  const obj={id:ci>=0?D.compras[ci].id:genId('c'),nome,cat,cartao,valor,parcelas,dataCompra,ativo:true};
  if(ci>=0) D.compras[ci]=obj; else D.compras.push(obj);
  document.getElementById('modal-compra-overlay').style.display='none';
  scheduleAutoSave(); renderSaidasVar(); renderAll();
}
function editarCompra(ci){abrirModalCompra(ci);}
function removerCompra(ci){if(!confirm(`Remover "${D.compras[ci].nome}"?`))return;D.compras.splice(ci,1);scheduleAutoSave();renderSaidasVar();}

// Gestão de anos
function renderAnosList() {
  const el=document.getElementById('anos-list');if(!el)return;
  const yrs=getYears();
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
    <span style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">Anos no planejamento:</span>
    ${yrs.map(yr=>`<span class="msb" style="cursor:default">${yr} (${getMesesAno(yr).length} meses)</span>`).join('')}
    <button class="btn btn-pos" style="height:30px;font-size:12px" onclick="addAno()">+ Adicionar ano</button>
    ${yrs.length>1?`<button class="btn btn-neg" style="height:30px;font-size:12px" onclick="removerUltimoAno()">− Remover ${yrs[yrs.length-1]}</button>`:''}
  </div>`;
}
function addAno() {
  const anoStr=prompt('Digite o ano para adicionar (ex: 2028):');if(!anoStr)return;
  const ano=parseInt(anoStr);if(isNaN(ano)||ano<2024||ano>2040){alert('Ano inválido.');return;}
  const sufixo=String(ano).slice(2);
  const mesesNomes=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  let add=0;
  mesesNomes.forEach(m=>{const n=`${m}/${sufixo}`;if(!D.meses.includes(n)){D.meses.push(n);if(!D.invManual)D.invManual=[];D.invManual.push(null);add++;}});
  if(add===0){alert(`Meses de ${ano} já existem.`);return;}
  scheduleAutoSave();renderAll();if(window.toast)toast(`✅ ${add} meses de ${ano} adicionados!`);
}
function removerUltimoAno() {
  const yrs=getYears();if(yrs.length<=1){alert('Mínimo de 1 ano.');return;}
  const yr=yrs[yrs.length-1];
  const meses=D.meses.filter(m=>m.includes('/'+yr.slice(2)));
  if(!confirm(`Remover ${meses.length} meses de ${yr}?`))return;
  const qtd=meses.length;
  for(let i=0;i<qtd;i++){D.meses.pop();if(D.invManual)D.invManual.pop();}
  if(selDash>=nm())selDash=nm()-1;
  scheduleAutoSave();renderAll();if(window.toast)toast(`✅ Meses de ${yr} removidos.`);
}

// ── FATURAS ───────────────────────────────────────
function renderFaturas() {
  if(selFaturas===-1) selFaturas=getMesAtualIdx();
  const ms=document.getElementById('faturas-months');
  if(ms){const ativosF=getActiveMeses();ms.innerHTML=ativosF.map(m=>{const i=D.meses.indexOf(m);return`<button class="msb${i===selFaturas?' on':''}" onclick="selFaturas=${i};renderFaturas()">${sM(m)}</button>`;}).join('');}
  const mi=selFaturas;
  const mesNome=D.meses[mi]||'';
  const lbl=document.getElementById('faturas-mes-label');if(lbl)lbl.textContent=`Faturas de ${mesNome}`;

  // Monta lista de itens do mês
  const itens=[];
  D.fixas.filter(f=>f.ativo).forEach(f=>{ itens.push({id:'fx_'+f.id,nome:f.nome,cat:f.cat,valor:f.valor,tipo:'fixa',cartao:''}); });
  D.compras.filter(c=>c.ativo).forEach(c=>{ const v=calcValsCompra(c)[mi]||0; if(v>0) itens.push({id:'cp_'+c.id,nome:c.nome,cat:c.cat,valor:v,tipo:'variavel',cartao:c.cartao}); });

  const mes=D.meses[mi];
  const pag=D.pagamentos&&D.pagamentos[mes]||{};
  const pagas=itens.filter(it=>pag[it.id]);
  const pendentes=itens.filter(it=>!pag[it.id]);
  const totBruto=itens.reduce((s,it)=>s+it.valor,0);
  const totPago=pagas.reduce((s,it)=>s+it.valor,0);
  const totPend=pendentes.reduce((s,it)=>s+it.valor,0);
  const pctP=totBruto>0?Math.round((totPago/totBruto)*100):0;

  const sumEl=document.getElementById('faturas-summary');
  if(sumEl) sumEl.innerHTML=`
    <div class="mcard mcard-neg"><div class="mlabel">💸 Total do mês</div><div class="mval mval-neg">${fmt(totBruto)}</div></div>
    <div class="mcard mcard-warn"><div class="mlabel">⏳ Pendente</div><div class="mval mval-warn">${fmt(totPend)}</div><div class="msub">${pendentes.length} item(s)</div></div>
    <div class="mcard mcard-pos"><div class="mlabel">✅ Pago</div><div class="mval mval-pos">${fmt(totPago)}</div><div class="msub">${pagas.length} item(s) · ${pctP}%</div></div>
    <div class="mcard ${pctP===100&&itens.length>0?'mcard-pos':'mcard-accent'}"><div class="mlabel">📊 Progresso</div><div class="mval ${pctP===100?'mval-pos':'mval-accent'}">${pctP}%</div><div style="height:4px;background:var(--card3);border-radius:99px;margin-top:8px;overflow:hidden"><div style="height:4px;width:${pctP}%;background:${pctP===100?'var(--pos)':'var(--accent)'};border-radius:99px;transition:width .5s"></div></div></div>
  `;

  const allDone=document.getElementById('faturas-all-done');
  if(allDone) { if(pctP===100&&itens.length>0){allDone.style.display='';allDone.innerHTML=`<div style="text-align:center;padding:16px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.3);border-radius:var(--r12);color:var(--pos);font-weight:700">🎉 Todas as faturas de ${mesNome} foram pagas!</div>`;}else{allDone.style.display='none';} }

  const pagarItem=(it,paid)=>{
    const info=CATS[it.cat]||CATS.outros;
    return paid
      ? `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.2);border-radius:var(--r8);margin-bottom:6px;opacity:.7">
          <span>${info.icon}</span>
          <div style="flex:1"><div style="font-weight:600;text-decoration:line-through;font-size:13px">${it.nome}</div><div style="font-size:11px;color:var(--text2)">${info.label}${it.cartao?' · 💳 '+it.cartao:''} · <span class="badge badge-${it.tipo==='fixa'?'fixo':'var'}">${it.tipo==='fixa'?'Fixa':'Variável'}</span></div></div>
          <div style="font-weight:700;color:var(--pos)">${fmt(it.valor)}</div>
          <button class="btn btn-ghost" style="height:30px;font-size:11px" onclick="faturaDesfazer('${it.id}',${mi})">↩</button>
        </div>`
      : `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r8);margin-bottom:6px">
          <span style="font-size:18px">${info.icon}</span>
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${it.nome}</div><div style="font-size:11px;color:var(--text2)">${info.label}${it.cartao?' · 💳 '+it.cartao:''} · <span class="badge badge-${it.tipo==='fixa'?'fixo':'var'}">${it.tipo==='fixa'?'Fixa':'Variável'}</span></div></div>
          <div style="font-weight:700;color:var(--neg);margin-right:8px">${fmt(it.valor)}</div>
          <button class="btn btn-pos" style="height:34px;padding:0 14px" onclick="faturaPagar('${it.id}',${mi},${it.valor})">✓ Pagar</button>
        </div>`;
  };

  const listEl=document.getElementById('faturas-list');
  if(listEl){
    if(!itens.length){listEl.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhuma conta cadastrada para ${mesNome}</div></div>`;return;}
    listEl.innerHTML=
      (pendentes.length?`<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">⏳ Pendentes (${pendentes.length})</div>`+pendentes.map(it=>pagarItem(it,false)).join(''):'')
      +(pagas.length?`<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;margin:14px 0 8px">✅ Pagas (${pagas.length})</div>`+pagas.map(it=>pagarItem(it,true)).join(''):'');
  }
}
function faturaPagar(id,mi,valor) {
  if(!D.pagamentos) D.pagamentos={};
  const mes=D.meses[mi];if(!D.pagamentos[mes])D.pagamentos[mes]={};
  D.pagamentos[mes][id]=valor;
  scheduleAutoSave(); renderFaturas();
}
function faturaDesfazer(id,mi) {
  if(!D.pagamentos) return;
  const mes=D.meses[mi];
  if(D.pagamentos[mes]) delete D.pagamentos[mes][id];
  scheduleAutoSave(); renderFaturas();
}
function getMesAtualIdx() {
  const hoje=new Date();const dia=hoje.getDate();
  const m=hoje.getMonth()+1;const y=hoje.getFullYear();
  let idx=D.meses.findIndex(ms=>{const {m:mm,y:yy}=parseMes(ms);return mm===m&&yy===y;});
  if(idx===-1) idx=0;
  if(dia>15&&idx<nm()-1) idx++;
  return idx;
}

// ── FORM COLLECTION ───────────────────────────────
function collectFormFields(){
  const el=document.getElementById('ef-saldo');if(el)D.saldo=parseFloat(el.value)||0;
  const mc=document.getElementById('ef-metaCC');if(mc)D.metaCC=parseFloat(mc.value)||2000;
  Object.entries(fields).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)D[k]=parseFloat(el.value)||0; });
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id);if(el)D.arcaMeta[k]=parseFloat(el.value)||0; });
}
function saveData(){collectFormFields();if(window._firestoreSave)window._firestoreSave(true);renderAll();}
applyTheme();
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
  if(!D.invManual) D.invManual=Array(nm()).fill(null);
  const ativosInv=getActiveMeses();
  const rows=ativosInv.map((m)=>{const i=D.meses.indexOf(m);
    const r=calcInvest(i);
    const manual=isManual(i);
    const valFinal=invDisp(i);
    const valCalc=invDispCalc(i);
    const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
    return `<tr style="${manual?'background:rgba(245,158,11,.06)':''}">
      <td style="font-weight:600">${m}</td>
      <td class="tr tpos">${fmt(r.e)}</td>
      <td class="tr tneg">${fmt(r.c)}</td>
      <td class="tr" style="color:var(--text2)">${fmt(r.sobra)}</td>
      <td class="tr"><span>${icon}</span></td>
      <td class="tr" style="min-width:180px">
        <div style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
          ${manual?`<span title="Recomendado: ${fmt(valCalc)}" style="font-size:10px;color:var(--warn);cursor:pointer;white-space:nowrap" onclick="resetManual(${i})">⚡${fmt(valCalc)} ↩</span>`:''}
          <input type="number" min="0" step="0.01"
            value="${valFinal||''}"
            placeholder="${fmt(valCalc)}"
            title="${manual?'Valor manual (clique em ↩ para restaurar o automático)':'Calculado automaticamente — edite para sobrescrever'}"
            style="width:120px;text-align:right;font-weight:700;
              border-color:${manual?'var(--warn)':'var(--border2)'};
              color:${manual?'var(--warn)':'var(--teal)'};
              background:${manual?'var(--warn-bg)':'var(--card2)'}"
            onchange="setManual(${i},this.value);renderInvestVisao()">
        </div>
      </td>
    </tr>`;
  }).join('');
  const tot=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const temManual=D.meses.some((_,i)=>isManual(i));
  mt.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th>
    <th class="tr">Sobra bruta</th><th class="tr">Regra</th>
    <th class="tr" style="color:var(--teal)">
      💰 Disponível p/ investir
      ${temManual?`<button onclick="resetTodosManual()" title="Restaurar todos os valores automáticos" style="margin-left:6px;background:var(--warn-bg);color:var(--warn);border:1px solid rgba(245,158,11,.3);border-radius:4px;font-size:10px;padding:1px 6px;cursor:pointer;font-family:inherit">↩ resetar tudo</button>`:''}
    </th>
  </tr></thead><tbody>${rows}
  <tr style="background:var(--card2);font-weight:700">
    <td>TOTAL</td><td></td><td></td><td></td><td></td>
    <td class="tr tteal">${fmt(tot)}</td>
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
  const fields={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',
    ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fields).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)el.value=D[k]||0; });
  const selicEl=document.getElementById('ef-selic');if(selicEl)selicEl.value=D.selic||14.75;
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id);if(el)el.value=D.arcaMeta[k]||0; });

  const selic=D.selic||D.cdi12||14.75;
  const juroReal=(D.cdi12||14.75)-(D.ipca12||4.14);
  const ic=document.getElementById('ind-cards');
  if(ic) ic.innerHTML=`
    <div class="mcard mcard-neg" style="border-color:rgba(239,68,68,.2)">
      <div class="mlabel">🏦 SELIC meta</div>
      <div class="mval mval-neg">${P(selic)}</div>
      <div class="msub">taxa básica de juros</div>
    </div>
    <div class="mcard mcard-pos">
      <div class="mlabel">📊 CDI 12 meses</div>
      <div class="mval mval-pos">${P(D.cdi12)}</div>
      <div class="msub">referência para renda fixa</div>
    </div>
    <div class="mcard mcard-warn">
      <div class="mlabel">📋 IPCA 12 meses</div>
      <div class="mval mval-warn">${P(D.ipca12)}</div>
      <div class="msub">inflação oficial</div>
    </div>
    <div class="mcard ${juroReal>4?'mcard-pos':juroReal>2?'mcard-teal':'mcard-neg'}">
      <div class="mlabel">📈 Juro real (CDI−IPCA)</div>
      <div class="mval ${juroReal>4?'mval-pos':juroReal>2?'mval-teal':'mval-neg'}">${P(juroReal)}</div>
      <div class="msub">${juroReal>4?'excelente retorno real':juroReal>2?'retorno real positivo':'atenção: retorno real baixo'}</div>
    </div>
    <div class="mcard mcard-info">
      <div class="mlabel">💰 CDI mês ref.</div>
      <div class="mval mval-info">${P(D.cdifev)}</div>
    </div>
    <div class="mcard mcard-warn">
      <div class="mlabel">📋 IPCA mês ref.</div>
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

  // Renderiza inteligência ARCA
  renderARCAIntelligence();
}// ── BCB API + ARCA INTELLIGENCE ───────────────────

// Séries temporais do Banco Central (SGS/BCData)
const BCB_SERIES = {
  cdiMes:   4389,  // CDI acumulado no mês (% a.m.)
  cdi12m:   4391,  // CDI % a.a. (últimos 12 meses)
  selicMes: 4390,  // SELIC acumulada no mês
  selicMeta:432,   // Meta SELIC % a.a.
  ipcaMes:  433,   // IPCA mensal
  ipca12m:  13522, // IPCA acumulado 12 meses
};

async function bcbFetch(serie, n=1) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/${n}?formato=json`;
  // Tenta direto; se falhar por CORS, usa proxy
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('status '+r.status);
    const d = await r.json();
    return d[d.length-1];
  } catch(e) {
    // Fallback: proxy CORS público
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const r2 = await fetch(proxy);
    const d2 = await r2.json();
    const parsed = JSON.parse(d2.contents);
    return parsed[parsed.length-1];
  }
}

async function fetchBCB() {
  const btn  = document.getElementById('btn-bcb-fetch');
  const stat = document.getElementById('bcb-status');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando...'; }
  if (stat) { stat.style.display = ''; stat.innerHTML = '⏳ Conectando ao Banco Central do Brasil...'; }

  try {
    // Busca todas as séries em paralelo
    const [cdiMes, cdi12m, selicMeta, ipcaMes, ipca12m] = await Promise.all([
      bcbFetch(BCB_SERIES.cdiMes,  1),
      bcbFetch(BCB_SERIES.cdi12m,  1),
      bcbFetch(BCB_SERIES.selicMeta,1),
      bcbFetch(BCB_SERIES.ipcaMes, 1),
      bcbFetch(BCB_SERIES.ipca12m, 1),
    ]);

    // Calcula acumulado 2026 (meses disponíveis)
    const ano = new Date().getFullYear();
    const mesesAno = await bcbFetch(BCB_SERIES.ipcaMes, 12);
    // Acumulado anual = últimos meses do ano corrente
    const ipcaAcumArr = await Promise.all(
      Array.from({length: new Date().getMonth()+1}, (_,i) =>
        bcbFetch(BCB_SERIES.ipcaMes, new Date().getMonth()+1 - i)
      )
    );

    // Atualiza D
    D.cdi12   = parseFloat(cdi12m.valor)  || D.cdi12;
    D.cdifev  = parseFloat(cdiMes.valor)  || D.cdifev;
    D.ipca12  = parseFloat(ipca12m.valor) || D.ipca12;
    D.ipcafev = parseFloat(ipcaMes.valor) || D.ipcafev;
    D.selic   = parseFloat(selicMeta.valor)|| D.selic||14.75;

    // Acumulado no ano (CDI e IPCA)
    const cdi12mArr = await Promise.all(
      Array.from({length: new Date().getMonth()+1}, () =>
        bcbFetch(BCB_SERIES.cdiMes, 1)
      )
    );
    // Simplificado: usa 12m / 12 * meses_do_ano
    const mesesDecorridos = new Date().getMonth() + 1;
    D.cdi26  = parseFloat(((D.cdi12 / 12) * mesesDecorridos).toFixed(2));
    D.ipca26 = parseFloat(((D.ipca12 / 12) * mesesDecorridos).toFixed(2));

    if (!D.invManual) D.invManual = Array(nm()).fill(null);

    const dataRef = cdi12m.data || ipcaMes.data || '—';
    if (stat) stat.innerHTML = `✅ Dados atualizados com sucesso! Referência: <strong>${dataRef}</strong> · CDI 12m: <strong>${D.cdi12}%</strong> · IPCA 12m: <strong>${D.ipca12}%</strong> · SELIC meta: <strong>${D.selic}%</strong>`;

    scheduleAutoSave();
    renderIndicadores();
    if (window._firestoreSave) window._firestoreSave(false);

  } catch(e) {
    console.error('BCB fetch error:', e);
    if (stat) stat.innerHTML = `❌ Erro ao buscar dados: ${e.message}. Verifique sua conexão ou atualize manualmente.`;
    if (stat) stat.style.color = 'var(--neg)';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Atualizar indicadores agora'; }
  }
}

// ── MOTOR DE INTELIGÊNCIA ARCA ────────────────────
function calcARCAIntelligence() {
  const selic = D.selic || D.cdi12 || 14.75;
  const cdi12 = D.cdi12 || 14.75;
  const ipca12 = D.ipca12 || 4.14;
  const juroReal = cdi12 - ipca12; // juro real

  // Classifica o ciclo de juros
  let ciclo, cicloDesc, cicloEmoji, cicloColor;
  if (selic >= 13.5) {
    ciclo = 'juros_altos';
    cicloEmoji = '🔴';
    cicloColor = 'var(--neg)';
    cicloDesc = `SELIC em ${selic}% — ciclo de juros altos`;
  } else if (selic >= 10) {
    ciclo = 'juros_elevados';
    cicloEmoji = '🟡';
    cicloColor = 'var(--warn)';
    cicloDesc = `SELIC em ${selic}% — juros ainda elevados`;
  } else if (selic >= 7) {
    ciclo = 'juros_moderados';
    cicloEmoji = '🟠';
    cicloColor = 'var(--orange)';
    cicloDesc = `SELIC em ${selic}% — ciclo moderado`;
  } else {
    ciclo = 'juros_baixos';
    cicloEmoji = '🟢';
    cicloColor = 'var(--pos)';
    cicloDesc = `SELIC em ${selic}% — juros baixos, renda variável favorecida`;
  }

  // Recomendações ARCA baseadas no ciclo
  let rec, rationale, alertas = [];
  if (ciclo === 'juros_altos') {
    rec = { a: 10, r: 20, c: 50, a2: 20 };
    rationale = [
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — SELIC a ${selic}% remunera muito bem sem risco. Tesouro Selic e CDBs são excelentes.` },
      { bucket:'R', cor:'#F97316', txt:`Real Estate (${rec.r}%) — FIIs sofrem mais com juros altos, mas mantém diversificação e renda de dividendos.` },
      { bucket:'A2',cor:'#F59E0B', txt:`Internacionais (${rec.a2}%) — dólar como proteção e diversificação em mercados menos correlacionados.` },
      { bucket:'A', cor:'#3B82F6', txt:`Ações BR (${rec.a}%) — bolsa pressionada por juros altos, posição mínima para não perder o movimento de queda de juros.` },
    ];
    alertas = [
      { tipo:'warn', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — renda fixa gerando retorno real expressivo acima da inflação.` },
      { tipo:'warn', txt:'Momento de acumular Caixa. Quando a SELIC começar a cair, migre gradualmente para A e R.' },
    ];
  } else if (ciclo === 'juros_elevados') {
    rec = { a: 18, r: 25, c: 40, a2: 17 };
    rationale = [
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — juros ainda atrativos, manter parcela relevante em renda fixa de qualidade.` },
      { bucket:'R', cor:'#F97316', txt:`Real Estate (${rec.r}%) — FIIs de tijolo com desconto histórico. Bom momento de acumulação de cotas.` },
      { bucket:'A2',cor:'#F59E0B', txt:`Internacionais (${rec.a2}%) — diversificação cambial e exposição a mercados desenvolvidos.` },
      { bucket:'A', cor:'#3B82F6', txt:`Ações BR (${rec.a}%) — início de posição para capturar ciclo de queda de juros que virá.` },
    ];
    alertas = [
      { tipo:'info', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — momento de transição. Monitore as decisões do COPOM.` },
      { tipo:'info', txt:'Gradualmente reduza Caixa a cada corte de 0,5pp na SELIC e reinvista em A e R.' },
    ];
  } else if (ciclo === 'juros_moderados') {
    rec = { a: 28, r: 28, c: 25, a2: 19 };
    rationale = [
      { bucket:'A', cor:'#3B82F6', txt:`Ações BR (${rec.a}%) — juros em queda favorecem bolsa. Hora de aumentar exposição a renda variável.` },
      { bucket:'R', cor:'#F97316', txt:`Real Estate (${rec.r}%) — FIIs se valorizam com queda de juros. Renda de aluguéis + ganho de capital.` },
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — ainda relevante para liquidez e proteção, mas retorno real menor.` },
      { bucket:'A2',cor:'#F59E0B', txt:`Internacionais (${rec.a2}%) — diversificação geográfica importante independente do ciclo local.` },
    ];
    alertas = [
      { tipo:'pos', txt:'Ciclo favorável para renda variável. Priorize boas empresas com histórico de dividendos.' },
      { tipo:'info', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — verifique se a renda fixa ainda supera a inflação nos seus ativos.` },
    ];
  } else {
    rec = { a: 38, r: 32, c: 15, a2: 15 };
    rationale = [
      { bucket:'A', cor:'#3B82F6', txt:`Ações BR (${rec.a}%) — ambiente de juros baixos é o melhor para a bolsa. Maximize exposição.` },
      { bucket:'R', cor:'#F97316', txt:`Real Estate (${rec.r}%) — FIIs com excelente custo de oportunidade vs. renda fixa.` },
      { bucket:'A2',cor:'#F59E0B', txt:`Internacionais (${rec.a2}%) — manter diversificação global para proteção cambial.` },
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — apenas para emergências e oportunidades. Renda fixa perde para inflação.` },
    ];
    alertas = [
      { tipo:'pos', txt:'Ótimo momento para renda variável. Foque em empresas de crescimento e FIIs de papel.' },
      { tipo:'warn', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — cuidado: renda fixa pode perder para inflação. Revise Caixa.` },
    ];
  }

  return { ciclo, cicloDesc, cicloEmoji, cicloColor, rec, rationale, alertas, selic, cdi12, ipca12, juroReal };
}

function renderARCAIntelligence() {
  const intel = calcARCAIntelligence();
  const badge = document.getElementById('arca-intel-ciclo');
  if (badge) {
    badge.textContent = intel.cicloEmoji + ' ' + intel.cicloDesc;
    badge.style.background = 'none';
    badge.style.color = intel.cicloColor;
    badge.style.fontWeight = '600';
  }

  const el = document.getElementById('arca-intel-content');
  if (!el) return;

  const alertasHTML = intel.alertas.map(a => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 14px;border-radius:8px;margin-bottom:8px;
      background:${a.tipo==='warn'?'var(--warn-bg)':a.tipo==='pos'?'var(--pos-bg)':'var(--info-bg)'};
      border:1px solid ${a.tipo==='warn'?'rgba(245,158,11,.25)':a.tipo==='pos'?'rgba(16,185,129,.25)':'rgba(59,130,246,.25)'}">
      <span>${a.tipo==='warn'?'⚠️':a.tipo==='pos'?'✅':'💡'}</span>
      <span style="font-size:12px;color:var(--text);line-height:1.6">${a.txt}</span>
    </div>`).join('');

  const recHTML = intel.rationale.map(r => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:var(--card2);border-radius:var(--r8);border:1px solid var(--border);margin-bottom:6px">
      <div style="width:10px;height:10px;border-radius:50%;background:${r.cor};flex-shrink:0;margin-top:4px"></div>
      <div style="font-size:12px;line-height:1.6;color:var(--text2)">${r.txt}</div>
    </div>`).join('');

  const bucketColors = {A:'#3B82F6',R:'#F97316',C:'#6B7280',A2:'#F59E0B'};
  const recCards = [
    {b:'A',  label:'Ações BR',      pct:intel.rec.a},
    {b:'R',  label:'Real Estate',   pct:intel.rec.r},
    {b:'C',  label:'Caixa',         pct:intel.rec.c},
    {b:'A2', label:'Internacionais',pct:intel.rec.a2},
  ].map(x=>`
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r12);padding:14px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:${bucketColors[x.b]};text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${x.label}</div>
      <div style="font-size:28px;font-weight:800;color:${bucketColors[x.b]}">${x.pct}%</div>
      <div style="margin-top:8px;height:4px;background:var(--card3);border-radius:99px;overflow:hidden">
        <div style="height:4px;width:${x.pct}%;background:${bucketColors[x.b]};border-radius:99px"></div>
      </div>
    </div>`).join('');

  const totalRec = intel.rec.a + intel.rec.r + intel.rec.c + intel.rec.a2;
  const currentA = D.arcaMeta.a, currentR = D.arcaMeta.r, currentC = D.arcaMeta.c, currentA2 = D.arcaMeta.a2;

  el.innerHTML = `
    <div style="margin-bottom:16px">
      ${alertasHTML}
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">📊 Alocação recomendada para este cenário (soma = ${totalRec}%)</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      ${recCards}
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">📋 Racional da recomendação</div>
    ${recHTML}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:14px;border-top:1px solid var(--border);flex-wrap:wrap;gap:10px">
      <div style="font-size:12px;color:var(--text2)">
        Alocação atual: A ${currentA}% · R ${currentR}% · C ${currentC}% · A2 ${currentA2}%
      </div>
      <button class="btn btn-accent" onclick="applyARCARec(${intel.rec.a},${intel.rec.r},${intel.rec.c},${intel.rec.a2})"
        style="height:36px;padding:0 18px">
        🎯 Aplicar recomendação nas metas
      </button>
    </div>
    <div style="font-size:10px;color:var(--text3);margin-top:10px;line-height:1.6">
      ⚠️ Esta é uma recomendação baseada em regras do ciclo de juros brasileiro. Não constitui assessoria de investimentos. Consulte um profissional certificado antes de tomar decisões. Dados: BCB/SGS · SELIC meta ${intel.selic}% · CDI 12m ${intel.cdi12}% · IPCA 12m ${intel.ipca12}% · Juro real ${intel.juroReal.toFixed(2)}%
    </div>`;
}

function applyARCARec(a, r, c, a2) {
  if (!confirm(`Aplicar a alocação recomendada?\n\nA — Ações: ${a}%\nR — Real Estate: ${r}%\nC — Caixa: ${c}%\nA2 — Internacionais: ${a2}%\n\nIsso irá substituir suas metas atuais.`)) return;
  D.arcaMeta = { a, r, c, a2 };
  scheduleAutoSave();
  renderIndicadores();
  renderArca();
  // Atualiza inputs
  ['a','r','c','a2'].forEach(k => {
    const el = document.getElementById('ef-arca-'+k);
    if (el) el.value = D.arcaMeta[k];
  });
  if (window.toast) toast('✅ Metas ARCA atualizadas com a recomendação!');
}


function collectFormFields(){
  const el=document.getElementById('ef-saldo');if(el)D.saldo=parseFloat(el.value)||0;
  const mc=document.getElementById('ef-metaCC');if(mc)D.metaCC=parseFloat(mc.value)||2000;
  const fields={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',
    ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fields).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)D[k]=parseFloat(el.value)||0; });
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{ const el=document.getElementById(id);if(el)D.arcaMeta[k]=parseFloat(el.value)||0; });
}

function saveData(){collectFormFields();if(window._firestoreSave)window._firestoreSave(true);renderAll();}

// ── INIT ──────────────────────────────────────────
applyTheme();