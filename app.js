/* ═══════════════════════════════════════════════════
   FinançasPRO — app.js v5.0
   Entradas por mês, saídas com parcelas, faturas
═══════════════════════════════════════════════════ */

// ── MAPA DE MESES ─────────────────────────────────
const MMAP = {Jan:1,Fev:2,Mar:3,Abr:4,Mai:5,Jun:6,Jul:7,Ago:8,Set:9,Out:10,Nov:11,Dez:12};
const MMAP_R = {1:'Jan',2:'Fev',3:'Mar',4:'Abr',5:'Mai',6:'Jun',7:'Jul',8:'Ago',9:'Set',10:'Out',11:'Nov',12:'Dez'};

// Gera n meses a partir do mes atual (dinamicamente, nao hardcoded)
function gerarMesesFuturos(n) {
  n = n || 20;
  var r = [], d = new Date();
  var m = d.getMonth() + 1, y = d.getFullYear();
  for (var i = 0; i < n; i++) {
    r.push(MMAP_R[m] + '/' + String(y).slice(2));
    m++; if (m > 12) { m = 1; y++; }
  }
  return r;
}

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

// ── DADOS PADRÃO — limpo (sem dados pessoais) ─────
// BLANK e DEFAULT são iguais; dados reais vêm do Firestore
const BLANK = {
  saldo: 0,
  cdi12: 14.40, cdifev: 1.09, cdi26: 4.54,   // CDI correto (não 0.43%)
  ipca12: 4.39, ipcafev: 1.09, ipca26: 1.83,
  arcaMeta: {a:25, r:25, c:25, a2:25}, metaCC: 2000, selic: 14.50,
  meses: [], // preenchido dinamicamente em migrateData
  invManual: [],
  entradas: [], fixas: [], compras: [],
  dividas: [], pagamentos: {}, ativos: [], cartoes: [],
  orcamentos: {},   // {cat: valorMaxMensal}
  objetivos: [],    // [{id,nome,meta,atual,prazo,icone,cor}]
  historico: [],    // [{mes,saldo,patrimonio,sobra}] — evolução mensal
  _hasUnsaved: false
};
const DEFAULT = BLANK; // alias — sem dados pessoais hardcoded

// ── ESTADO ────────────────────────────────────────
let D = JSON.parse(JSON.stringify(DEFAULT));
let selDash = 0;
let selEntradas = '';  // mês filtro entradas ('' = todos)
let selFaturas = -1;   // mês selecionado em faturas (= pagar contas)
let CH = {};
let yrCollapsed = {};
let _saveTimer = null;
let isDark = (localStorage.getItem('cf_theme')||'dark') === 'dark';
let _adminCreatingUser = false; // flag para não resetar D durante criação de usuário

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
  if(!d) {
    // Novo usuário: gera meses dinamicamente a partir do mês atual
    const b = JSON.parse(JSON.stringify(BLANK));
    b.meses = gerarMesesFuturos(20);
    b.invManual = Array(20).fill(null);
    return b;
  }
  // Migra campos novos
  if(!d.entradas)   d.entradas   = [];
  if(!d.fixas)      d.fixas      = [];
  if(!d.compras)    d.compras    = [];
  if(!d.cartoes)    d.cartoes    = [];
  if(!d.ativos)     d.ativos     = [];
  if(!d.arcaMeta)   d.arcaMeta   = {a:25,r:25,c:25,a2:25};
  if(!d.metaCC)     d.metaCC     = 2000;
  if(!d.selic)      d.selic      = 14.50;
  if(!d.orcamentos) d.orcamentos = {};
  if(!d.objetivos)  d.objetivos  = [];
  if(!d.historico)  d.historico  = [];
  // Gera meses dinamicamente se não existir ou estiver vazio
  if(!d.meses || !d.meses.length) d.meses = gerarMesesFuturos(20);
  if(!d.pagamentos) d.pagamentos = {};
  if(!d.invManual)  d.invManual  = Array(d.meses.length).fill(null);
  while(d.invManual.length < d.meses.length) d.invManual.push(null);

  // Migração legado: se tinha salario/outras e entradas está vazio
  if(d.entradas.length === 0) {
    if(d.salario > 0) d.entradas.push({id:'e_sal', nome:'Salário', valor:d.salario, tipo:'mensal', dia:15, cat:'salario', ativo:true});
    if(d.outras  > 0) d.entradas.push({id:'e_out', nome:'Outras entradas', valor:d.outras, tipo:'mensal', dia:1, cat:'outros', ativo:true});
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

  d.entradas.forEach(e => {
    if(!e.cat) e.cat='outros';
    if(e.ativo===undefined) e.ativo=true;
    if(!e.id) e.id='e'+Date.now()+Math.random();
    // Normaliza e.mes de anual/unico: 'Dez/26' → 'Dez'
    if(e.tipo==='anual' && e.mes && e.mes.includes('/')) {
      e.mes = e.mes.split('/')[0];
    }
  });
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
    if(e.tipo==='anual') {
      if(!e.mes) return s;
      // Suporta 'Dez' (novo) e 'Dez/26' (legado anterior à correção)
      const mesAbrev = e.mes.includes('/') ? e.mes.split('/')[0] : e.mes;
      const mesNum = MMAP[mesAbrev] || 0;
      return mesNum===m ? s+(e.valor||0) : s;
    }
    if(e.tipo==='unico') {
      if(!e.mes) return s;
      // e.mes pode ser "Jan" (mês) ou "Mai/26" (mês+ano legado)
      if(e.mes.includes('/')) {
        const em = parseMes(e.mes);
        return em.m===m && em.y===y ? s+(e.valor||0) : s;
      }
      // Novo formato: só mês — considera apenas o mês (sem restrição de ano)
      const mesNum = MMAP[e.mes] || 0;
      return mesNum===m ? s+(e.valor||0) : s;
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

  // Se tem valores customizados por parcela
  if(compra.parcelasCustom && compra.parcelasCustom.length === parcelas) {
    for(let p=0; p<parcelas; p++) {
      let bm=fm+p, by=fy;
      while(bm>12){bm-=12;by++;}
      const mesStr=mkMes(bm,by);
      const idx=D.meses.indexOf(mesStr);
      if(idx>=0&&idx<n) vals[idx]=Math.round((vals[idx]+(compra.parcelasCustom[p]||0))*100)/100;
    }
    return vals;
  }

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

// ── PENDENTE DO MÊS ──────────────────────────────
// Calcula exatamente o mesmo que Faturas "Pendente"
// Usada tanto em calcInvest quanto em renderFaturas
function calcPendenteMes(mi) {
  const mes = D.meses[mi];
  if(!mes) return {bruto:0, pendente:0, pago:0};
  const pag = D.pagamentos && D.pagamentos[mes] || {};
  let bruto=0, pago=0;

  // Fixas
  D.fixas.filter(f=>f.ativo&&(f.valor||0)>0).forEach(f=>{
    const v=f.valor||0;
    const id='fx_'+f.id;
    bruto+=v;
    if(pag[id]) pago+=v;
  });

  // Compras agrupadas por cartão (idêntico ao renderFaturas)
  const porCartao={};
  D.compras.filter(c=>c.ativo).forEach(c=>{
    const v=calcValsCompra(c)[mi]||0;
    if(!v) return;
    const key=c.cartao||'__sem__';
    if(!porCartao[key]) porCartao[key]={total:0,itens:[]};
    porCartao[key].total+=v;
    porCartao[key].itens.push({valor:v});
  });

  // Sem cartão — itens individuais
  const semItens=porCartao['__sem__']?.itens||[];
  delete porCartao['__sem__'];
  semItens.forEach((it,idx)=>{
    const id='sc_'+idx+'_'+mi;
    bruto+=it.valor;
    if(pag[id]) pago+=it.valor;
  });

  // Por cartão — fatura agrupada
  Object.entries(porCartao).forEach(([nome,grp])=>{
    const id='cc_'+nome.replace(/\s/g,'_')+'_'+mi;
    bruto+=grp.total;
    if(pag[id]) pago+=grp.total;
  });

  return {bruto:Math.round(bruto*100)/100, pago:Math.round(pago*100)/100, pendente:Math.round((bruto-pago)*100)/100};
}

// BUG FIX: sobraM usa totalDivBruto (não pendente) — independe de pagamentos marcados
const sobraM = (mi) => totalEMes(mi) - totalDivBruto(mi);
const nm = () => D.meses.length;
const getLim = d => { const c=D.cartoes.find(x=>x.nome===d.cartao); return c?c.limite:0; };

function calcInvest(i) {
  // BUG FIX: usa totalDivBruto (total de contas), não apenas pendentes
  // Garante que "disponível p/ investir" é consistente independente de pagamentos marcados
  const e=totalEMes(i), c=totalDivBruto(i), meta=D.metaCC||2000, sobra=e-c;
  if(sobra<=0)   return {e,c,meta,saldo:0,sobra,regra:'negativo'};
  if(sobra<meta) return {e,c,meta,saldo:sobra*0.5,sobra,regra:'menor_meta'};
  return              {e,c,meta,saldo:sobra-meta,sobra,regra:'maior_meta'};
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
  const ativos = D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  // BUG FIX: passivos = apenas parcelas futuras (a partir do mês atual)
  // Antes somava TODOS os meses, contando parcelas já pagas/vencidas
  const hoje = getMesAtualIdx();
  const passivos = D.compras
    .filter(c=>c.ativo)
    .reduce((total,c) => {
      const vals = calcValsCompra(c);
      return total + vals.slice(hoje).reduce((s,v)=>s+(v||0),0);
    }, 0);
  return {ativos, passivos, liquido: ativos-passivos};
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
function taxaAnual(a) {
  // Taxa anual do ativo como decimal (0.1440 = 14.40% a.a.)
  const cdiAnual = (D.cdi12||14.40)/100;
  const base = a.indice==='SELIC' ? (D.selic||14.50)/100
             : a.indice==='IPCA'  ? (D.ipca12||4.39)/100
             : cdiAnual; // CDI padrão
  return base * ((a.pct||100)/100);
}
// Projeção com juros compostos anuais
function projetar(v, taxaAa, anos) { return v * Math.pow(1 + taxaAa, anos); }
// Valor real: desconta inflação do valor nominal
function valorReal(nominal, anos) {
  const inflacao = (D.ipca12||4.39)/100;
  return nominal / Math.pow(1 + inflacao, anos);
}
function getYears() { const s=new Set(); D.meses.forEach(m=>{const p=m.match(/\/(\d+)/);if(p)s.add('20'+p[1]);}); return [...s].sort(); }
function getMesesAno(yr) { return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes('/'+yr.slice(2))); }
function genId(prefix) { return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── MESES ATIVOS ──────────────────────────────────
// Retorna meses de 0 até o último que tem alguma compra/entrada lançada.
// Fixas repetem em todos os meses, então não limitam o range.
function getActiveMeses() {
  let last = Math.min(5, nm()-1); // mínimo: sempre mostra 6 meses
  for(let i=0; i<nm(); i++) {
    const temCompra = (D.compras||[]).some(c=>c.ativo&&(calcValsCompra(c)[i]||0)>0);
    const temEntrada = totalEMes(i) > 0;
    if(temCompra || temEntrada) last = i;
  }
  return D.meses.slice(0, last + 1);
}

// Índice do mês atual no array D.meses
function getMesAtualIdx() {
  const hoje = new Date();
  const mesAtualNome = MMAP_R[hoje.getMonth()+1]+'/'+String(hoje.getFullYear()).slice(2);
  const idx = D.meses.indexOf(mesAtualNome);
  return idx >= 0 ? idx : 0;
}

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
  _temAlteracoes = true; // marca que há alterações não salvas
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    collectFormFields(); // garante que campos do DOM estejam em D antes de salvar
    if (window._firestoreSave) window._firestoreSave(false);
    _temAlteracoes = false;
  }, 1500);
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
  else if(id==='pagar')    renderFaturas();
  else if(id==='faturas')  renderFaturas(); // compat legado
  else if(id==='metas')    renderMetas();
  else if(id==='perfil')   { if(window._renderPerfil) window._renderPerfil(); }
  else if(id==='admin')    { if(window._renderAdmin)  window._renderAdmin(); }
}

function renderMetas() {
  const sub = getActiveSub('metas') || 'objetivos';
  if(sub==='objetivos') renderObjetivos('objetivos-list');
  else if(sub==='orcamentos') renderOrcamentos('orcamentos-list');
}

// Helper para menu mobile — não precisa passar o elemento ntab
function goMobile(id) {
  go(id, null);
  if(window.closeMobileMenu) closeMobileMenu();
}

// ── ORÇAMENTOS (Metas por categoria) ─────────────
function getGastoCategoriaMes(cat, mi) {
  let total = 0;
  D.fixas.filter(f=>f.ativo&&f.cat===cat).forEach(f=>total+=f.valor||0);
  D.compras.filter(c=>c.ativo&&c.cat===cat).forEach(c=>total+=(calcValsCompra(c)[mi]||0));
  return total;
}

function renderOrcamentos(containerId) {
  const el = document.getElementById(containerId);
  if(!el) return;
  const mi = getMesAtualIdx();
  const cats = Object.keys(CATS);
  const orcItems = cats.map(cat=>{
    const gasto = getGastoCategoriaMes(cat, mi);
    const limite = D.orcamentos[cat] || 0;
    const pct = limite>0 ? Math.min(120, Math.round((gasto/limite)*100)) : 0;
    const cor = pct>=100?'var(--neg)':pct>=80?'var(--warn)':'var(--pos)';
    return {cat, gasto, limite, pct, cor, info:CATS[cat]};
  }).filter(o=>o.gasto>0||o.limite>0);

  if(!orcItems.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🎯</div>
      <div class="empty-text">Defina limites por categoria para controlar seus gastos.<br>
      <button class="btn btn-ghost" style="margin-top:10px;height:32px" onclick="abrirModalOrcamento()">+ Definir limites</button></div></div>`;
    return;
  }
  el.innerHTML=orcItems.map(o=>`
    <div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${o.cor};border-radius:var(--r12);padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">${o.info.icon}</span>
          <div>
            <div style="font-weight:600;font-size:13px">${o.info.label}</div>
            <div style="font-size:11px;color:var(--text2)">${fmt(o.gasto)}${o.limite>0?' de '+fmt(o.limite):' (sem limite definido)'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${o.pct>=100?`<span class="badge badge-neg">⚠️ ${o.pct}%</span>`:''}
          <input type="number" value="${o.limite||''}" placeholder="Limite R$" min="0" step="10"
            style="width:110px;text-align:right;font-size:12px;height:32px"
            onchange="D.orcamentos['${o.cat}']=parseFloat(this.value)||0;scheduleAutoSave();renderOrcamentos('${containerId}')"
            title="Limite mensal para ${o.info.label}">
          <button class="btn-rm" onclick="delete D.orcamentos['${o.cat}'];scheduleAutoSave();renderOrcamentos('${containerId}')">✕</button>
        </div>
      </div>
      ${o.limite>0?`<div style="margin-top:8px">
        <div style="height:5px;background:var(--card3);border-radius:99px;overflow:hidden">
          <div style="height:5px;width:${Math.min(100,o.pct)}%;background:${o.cor};border-radius:99px;transition:width .5s"></div>
        </div>
      </div>`:''}
    </div>`).join('');

  el.innerHTML+=`<button class="btn btn-ghost" style="height:32px;font-size:12px;margin-top:4px" onclick="abrirModalOrcamento()">+ Adicionar limite</button>`;
}

function abrirModalOrcamento() {
  const cats = Object.keys(CATS).filter(c=>!D.orcamentos[c]);
  if(!cats.length){alert('Todos os categorias já têm limites definidos.');return;}
  const catList=cats.map((c,i)=>`${i+1}. ${CATS[c].icon} ${CATS[c].label}`).join('\n');
  const cat=prompt('Categoria:\n'+catList+'\n\nDigite o número:');
  if(!cat) return;
  const idx=parseInt(cat)-1;
  if(idx<0||idx>=cats.length) return;
  const key=cats[idx];
  const val=parseFloat(prompt(`Limite mensal para ${CATS[key].label} (R$):`));
  if(!val||val<=0) return;
  D.orcamentos[key]=val;
  scheduleAutoSave();
  renderOrcamentos('orcamentos-list');
}

// ── OBJETIVOS (Metas financeiras) ────────────────
function renderObjetivos(containerId) {
  const el=document.getElementById(containerId);
  if(!el) return;
  const objs=D.objetivos||[];
  if(!objs.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🎯</div>
      <div class="empty-text">Nenhum objetivo cadastrado. Defina metas financeiras e acompanhe o progresso.
      <br><button class="btn btn-ghost" style="margin-top:10px;height:32px" onclick="abrirModalObjetivo()">+ Novo objetivo</button></div></div>`;
    return;
  }
  el.innerHTML=objs.map((obj,oi)=>{
    const pct=obj.meta>0?Math.min(100,Math.round((obj.atual/obj.meta)*100)):0;
    const falta=Math.max(0,obj.meta-obj.atual);
    const cor=obj.cor||'var(--accent)';
    const prazoStr=obj.prazo?new Date(obj.prazo).toLocaleDateString('pt-BR'):'Sem prazo';
    const diasRestantes=obj.prazo?Math.ceil((new Date(obj.prazo)-new Date())/(1000*60*60*24)):null;
    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${cor};border-radius:var(--r16);padding:20px;margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:22px">${obj.icone||'🎯'}</span>
            <div style="font-size:15px;font-weight:700">${obj.nome}</div>
            ${pct>=100?'<span class="badge badge-pos">✅ Concluído!</span>':''}
          </div>
          <div style="font-size:12px;color:var(--text2)">Meta: <strong>${fmt(obj.meta)}</strong> · Atual: <strong style="color:${cor}">${fmt(obj.atual)}</strong> · Faltam: <strong>${fmt(falta)}</strong></div>
          ${obj.prazo?`<div style="font-size:11px;color:${diasRestantes<30?'var(--warn)':'var(--text2)'};margin-top:3px">📅 Prazo: ${prazoStr}${diasRestantes!==null?' ('+diasRestantes+' dias)':''}</div>`:''}
        </div>
        <div style="display:flex;gap:6px;align-items:flex-start;flex-shrink:0">
          <button class="btn btn-ghost" style="height:30px;font-size:11px" onclick="editarObjetivo(${oi})">✏️</button>
          <button class="btn-rm" onclick="removerObjetivo(${oi})">✕</button>
        </div>
      </div>
      <div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:5px">
          <span>${pct}% concluído</span>
          <button class="btn btn-ghost" style="height:24px;font-size:10px;padding:0 10px" onclick="atualizarObjetivo(${oi})">Atualizar valor</button>
        </div>
        <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden">
          <div style="height:8px;width:${pct}%;background:${cor};border-radius:99px;transition:width .6s"></div>
        </div>
      </div>
    </div>`;
  }).join('');
  el.innerHTML+=`<button class="btn btn-accent" style="height:36px;margin-top:4px" onclick="abrirModalObjetivo()">+ Novo objetivo</button>`;
}

function abrirModalObjetivo(oi=-1) {
  const obj=oi>=0?D.objetivos[oi]:{nome:'',meta:0,atual:0,prazo:'',icone:'🎯',cor:'#8B5CF6'};
  const html=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px" id="modal-objetivo-overlay">
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:var(--r20);padding:28px;width:100%;max-width:400px;box-shadow:var(--shadow2)">
      <div style="font-size:20px;font-weight:700;margin-bottom:16px">🎯 ${oi>=0?'Editar objetivo':'Novo objetivo'}</div>
      <div class="field"><label class="flabel">Nome do objetivo</label><input type="text" id="ob-nome" value="${obj.nome}" placeholder="Ex: Viagem, Reserva, Carro..."></div>
      <div class="field"><label class="flabel">Ícone</label><input type="text" id="ob-icone" value="${obj.icone||'🎯'}" style="width:80px"></div>
      <div class="field"><label class="flabel">Meta (R$)</label><input type="number" id="ob-meta" value="${obj.meta||''}" step="100" placeholder="0,00"></div>
      <div class="field"><label class="flabel">Valor atual (R$)</label><input type="number" id="ob-atual" value="${obj.atual||''}" step="100" placeholder="0,00"></div>
      <div class="field"><label class="flabel">Prazo</label><input type="date" id="ob-prazo" value="${obj.prazo||''}"></div>
      <div class="field"><label class="flabel">Cor</label><input type="color" id="ob-cor" value="${obj.cor||'#8B5CF6'}" style="width:60px;height:36px;padding:2px;border-radius:8px"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="document.getElementById('modal-objetivo-overlay').remove()">Cancelar</button>
        <button class="btn btn-pri" onclick="salvarObjetivo(${oi})">Salvar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function salvarObjetivo(oi) {
  const nome=document.getElementById('ob-nome').value.trim();
  const meta=parseFloat(document.getElementById('ob-meta').value)||0;
  const atual=parseFloat(document.getElementById('ob-atual').value)||0;
  const prazo=document.getElementById('ob-prazo').value;
  const icone=document.getElementById('ob-icone').value||'🎯';
  const cor=document.getElementById('ob-cor').value||'#8B5CF6';
  if(!nome){alert('Informe o nome do objetivo.');return;}
  const obj={id:oi>=0?(D.objetivos[oi].id||genId('obj')):genId('obj'),nome,meta,atual,prazo,icone,cor};
  if(oi>=0) D.objetivos[oi]=obj; else D.objetivos.push(obj);
  document.getElementById('modal-objetivo-overlay').remove();
  scheduleAutoSave(); renderObjetivos('objetivos-list');
}

function atualizarObjetivo(oi) {
  const obj=D.objetivos[oi]; if(!obj) return;
  const val=parseFloat(prompt(`Valor atual de "${obj.nome}" (R$):`, obj.atual||0));
  if(val===null||isNaN(val)) return;
  D.objetivos[oi].atual=val;
  scheduleAutoSave(); renderObjetivos('objetivos-list');
}

function editarObjetivo(oi) { abrirModalObjetivo(oi); }
function removerObjetivo(oi) {
  if(!confirm(`Remover objetivo "${D.objetivos[oi].nome}"?`)) return;
  D.objetivos.splice(oi,1); scheduleAutoSave(); renderObjetivos('objetivos-list');
}

// ── ALERTAS DE VENCIMENTO ────────────────────────
function getAlertasVencimento() {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const mi = getMesAtualIdx();
  const alertas = [];

  D.cartoes.forEach(ct=>{
    const diasAteVenc = ct.diaVencimento >= diaHoje
      ? ct.diaVencimento - diaHoje
      : (30 - diaHoje + ct.diaVencimento);

    // Calcula fatura do cartão no mês atual
    const fatura = D.compras.filter(c=>c.ativo&&c.cartao===ct.nome)
      .reduce((s,c)=>(calcValsCompra(c)[mi]||0)+s,0);
    if(fatura>0 && diasAteVenc<=7) {
      alertas.push({tipo:'vencimento', cartao:ct.nome, valor:fatura, dias:diasAteVenc,
        cor:diasAteVenc<=2?'var(--neg)':diasAteVenc<=5?'var(--warn)':'var(--info)'});
    }
  });

  // Objetivos próximos do prazo
  (D.objetivos||[]).forEach(obj=>{
    if(!obj.prazo) return;
    const diasRestantes=Math.ceil((new Date(obj.prazo)-hoje)/(1000*60*60*24));
    if(diasRestantes>=0&&diasRestantes<=30&&obj.atual<obj.meta) {
      alertas.push({tipo:'objetivo', nome:obj.nome, diasRestantes, pct:Math.round((obj.atual/obj.meta)*100),
        cor:diasRestantes<=7?'var(--neg)':'var(--warn)'});
    }
  });

  return alertas;
}

// ── BUSCA/FILTRO EM COMPRAS ──────────────────────
let _comprasFiltro = '';
let _comprasOrdem = 'data'; // 'data' | 'valor' | 'nome'

// ── MODAL DE LANÇAMENTO RÁPIDO ───────────────────
function abrirLancamentoRapido() {
  const html=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:600;display:flex;align-items:center;justify-content:center;padding:16px" id="modal-rapido-overlay">
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:var(--r20);padding:28px;width:100%;max-width:420px;box-shadow:var(--shadow2)">
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">⚡ Lançamento rápido</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:20px">Adicione uma entrada ou saída rapidamente</div>
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="btn" id="lr-tipo-saida" style="flex:1;height:36px;background:var(--neg-bg);color:var(--neg);border:1px solid rgba(239,68,68,.3);font-weight:700" onclick="setLrTipo('saida')">💸 Saída</button>
        <button class="btn" id="lr-tipo-entrada" style="flex:1;height:36px;background:var(--card3);color:var(--text2);border:1px solid var(--border)" onclick="setLrTipo('entrada')">💰 Entrada</button>
      </div>
      <div class="field"><label class="flabel">Descrição</label><input type="text" id="lr-nome" placeholder="Ex: Farmácia, Jantar..."></div>
      <div class="field"><label class="flabel">Valor (R$)</label><input type="number" id="lr-valor" step="0.01" placeholder="0,00"></div>
      <div class="field" id="lr-cartao-field"><label class="flabel">Cartão (opcional)</label>
        <select id="lr-cartao"><option value="">— À vista / PIX —</option>${D.cartoes.map(c=>`<option value="${c.nome}">${c.nome}</option>`).join('')}</select>
      </div>
      <div class="field"><label class="flabel">Categoria</label>
        <select id="lr-cat">${Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn btn-ghost" onclick="document.getElementById('modal-rapido-overlay').remove()">Cancelar</button>
        <button class="btn btn-pri" onclick="salvarLancamentoRapido()">Salvar</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('lr-nome').focus();
}

let _lrTipo = 'saida';
function setLrTipo(tipo) {
  _lrTipo=tipo;
  const btnS=document.getElementById('lr-tipo-saida');
  const btnE=document.getElementById('lr-tipo-entrada');
  const cartaoF=document.getElementById('lr-cartao-field');
  if(tipo==='saida'){
    btnS.style.cssText='flex:1;height:36px;background:var(--neg-bg);color:var(--neg);border:1px solid rgba(239,68,68,.3);font-weight:700';
    btnE.style.cssText='flex:1;height:36px;background:var(--card3);color:var(--text2);border:1px solid var(--border)';
    if(cartaoF) cartaoF.style.display='';
    // Change cat to expense categories
    const catEl=document.getElementById('lr-cat');
    if(catEl) catEl.innerHTML=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  } else {
    btnE.style.cssText='flex:1;height:36px;background:var(--pos-bg);color:var(--pos);border:1px solid rgba(16,185,129,.3);font-weight:700';
    btnS.style.cssText='flex:1;height:36px;background:var(--card3);color:var(--text2);border:1px solid var(--border)';
    if(cartaoF) cartaoF.style.display='none';
    const catEl=document.getElementById('lr-cat');
    if(catEl) catEl.innerHTML=Object.entries(CATS_ENTRADA).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('');
  }
}

function salvarLancamentoRapido() {
  const nome=document.getElementById('lr-nome').value.trim();
  const valor=parseFloat(document.getElementById('lr-valor').value)||0;
  const cat=document.getElementById('lr-cat').value;
  if(!nome){alert('Informe a descrição.');return;}
  if(!valor){alert('Informe o valor.');return;}
  if(_lrTipo==='saida'){
    const cartao=document.getElementById('lr-cartao').value;
    D.compras.push({id:genId('c'),nome,cat,cartao,valor,parcelas:1,
      dataCompra:new Date().toISOString().slice(0,10),ativo:true});
    scheduleAutoSave(); renderSaidasVar();
  } else {
    D.entradas.push({id:genId('e'),nome,valor,tipo:'mensal',dia:1,cat,ativo:true});
    scheduleAutoSave(); renderEntradas();
  }
  document.getElementById('modal-rapido-overlay').remove();
  renderAll();
  toast('Lançamento salvo! ✓');
}

// ── AVISO ANTES DE SAIR SEM SALVAR ──────────────
let _temAlteracoes = false;
function marcarAlterado() { _temAlteracoes=true; }
function marcarSalvo()    { _temAlteracoes=false; }
window.addEventListener('beforeunload', function(e) {
  if(_temAlteracoes) {
    e.preventDefault();
    e.returnValue='Você tem alterações não salvas. Deseja sair mesmo assim?';
    return e.returnValue;
  }
});

function setBottomNav(page) {
  document.querySelectorAll('.bnav-btn[data-page]').forEach(b=>{
    b.classList.toggle('on', b.getAttribute('data-page')===page);
  });
  // Also update mobile menu
  document.querySelectorAll('.mobile-ntab').forEach(b=>b.classList.remove('on'));
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
  else if(pid==='metas') { if(sid==='objetivos') renderObjetivos('objetivos-list'); else renderOrcamentos('orcamentos-list'); }
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
  if(!D.entradas||D.entradas.filter(e=>e.ativo).length===0) alerts.push({icon:'💰',msg:'Você não tem entradas registradas. Cadastre suas fontes de renda.',page:'entradas',cta:'+ Adicionar entrada',cor:'var(--pos)'});
  if(!D.fixas||D.fixas.filter(f=>f.ativo).length===0) alerts.push({icon:'📌',msg:'Nenhuma conta fixa cadastrada. Adicione aluguel, internet, etc.',page:'saidas',cta:'+ Adicionar conta',cor:'var(--info)'});
  if(!D.ativos||D.ativos.every(a=>!(a.valor||0))) alerts.push({icon:'📈',msg:'Você não possui investimentos cadastrados. Registre seus ativos.',page:'invest',cta:'+ Registrar ativo',cor:'var(--accent)'});
  if(!D.cartoes||D.cartoes.length===0) alerts.push({icon:'💳',msg:'Nenhum cartão de crédito cadastrado.',page:'carteira',cta:'+ Adicionar cartão',cor:'var(--warn)'});
  const metaE=metaEmergencia();
  if(metaE>0&&caixaAtual()<metaE*0.5) alerts.push({icon:'🛡️',msg:`Reserva de emergência em ${Math.round(caixaAtual()/metaE*100)}% da meta (${fmt(metaEmergencia())} recomendado).`,page:'invest',cta:'Ver ARCA',cor:'var(--neg)'});
  return alerts;
}
function calcPatrimonioFuturo() {
  const yrs=getYears();
  if(!yrs.length) return null;
  const tot=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const txMedia=tot>0
    ? D.ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/tot
    : (D.cdi12||14.80)/100; // usa CDI como taxa padrão se não houver investimentos
  const txMensal = Math.pow(1+txMedia,1/12)-1;
  let saldo=tot;
  return yrs.map(yr=>{
    const meses=getMesesAno(yr);
    const aporte=meses.reduce((s,{i})=>s+invDisp(i),0);
    // Compounding mensal com aporte mensal
    meses.forEach(({i})=>{
      const ap=invDisp(i);
      saldo=saldo*(1+txMensal)+ap;
    });
    return {yr,saldo:Math.round(saldo),aporte:Math.round(aporte)};
  });
}

// ── DASHBOARD ─────────────────────────────────────
function renderDashboard() {
  const sub=getActiveSub('dash')||'geral';
  if(sub==='geral') renderGeral(); else renderMes();
}

function renderGeral() {
  // ── Dados do mês atual ──
  const hoje = new Date();
  const mesAtualNome = `${MMAP_R[hoje.getMonth()+1]}/${String(hoje.getFullYear()).slice(2)}`;
  let mi = D.meses.indexOf(mesAtualNome);
  if(mi === -1) mi = 0; // fallback para o primeiro mês

  const entrada   = totalEMes(mi);
  const saida     = totalDivBruto(mi);
  const sobra     = sobraM(mi);
  const investir  = invDisp(mi);
  const pl        = patrimonioLiquido();
  const score     = scoreFinanceiro();
  const caixa     = caixaAtual();
  const metaE     = metaEmergencia();
  const pctEmerg  = metaE > 0 ? Math.min(100, Math.round((caixa / metaE) * 100)) : 0;
  const scoreCor  = score>=70 ? '#10B981' : score>=40 ? '#F59E0B' : '#EF4444';
  const scoreLabel= score>=70 ? 'Ótimo' : score>=40 ? 'Regular' : 'Atenção';
  const ativos    = D.meses.length;
  const n         = getActiveMeses().length;

  // ── Alertas de vencimento (cartões nos próximos 7 dias) ──
  const alertasVenc = getAlertasVencimento();
  const vencEl = document.getElementById('dash-vencimentos');
  if(vencEl) {
    if(alertasVenc.length) {
      vencEl.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${alertasVenc.map(a=>{
          if(a.tipo==='vencimento') return `<div style="background:var(--card);border:1px solid ${a.cor.replace('var(','')}33;border-left:3px solid ${a.cor};border-radius:var(--r12);padding:10px 14px;display:flex;align-items:center;gap:10px;flex:1;min-width:200px">
            <span style="font-size:20px">💳</span>
            <div><div style="font-size:12px;font-weight:700;color:${a.cor}">${a.cartao} vence em ${a.dias===0?'HOJE!':a.dias===1?'amanhã':a.dias+' dias'}</div>
            <div style="font-size:11px;color:var(--text2)">Fatura: <strong>${fmt(a.valor)}</strong></div></div>
            <button class="btn btn-ghost" style="height:26px;font-size:10px;margin-left:auto" onclick="goMobile('pagar')">Pagar</button>
          </div>`;
          if(a.tipo==='objetivo') return `<div style="background:var(--card);border:1px solid rgba(245,158,11,.2);border-left:3px solid var(--warn);border-radius:var(--r12);padding:10px 14px;flex:1;min-width:200px">
            <div style="font-size:12px;font-weight:700;color:var(--warn)">🎯 Meta "${a.nome}" vence em ${a.diasRestantes} dias</div>
            <div style="font-size:11px;color:var(--text2)">Progresso: ${a.pct}%</div>
          </div>`;
          return '';
        }).join('')}
      </div>`;
    } else vencEl.innerHTML='';
  }

  // ── Alertas de configuração ──
  const alerts = getEmptyStateAlerts();
  const alertEl = document.getElementById('dash-alerts');
  if(alertEl) {
    if(alerts.length) {
      alertEl.innerHTML = `
        <div style="margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:var(--warn);margin-bottom:10px;display:flex;align-items:center;gap:8px">⚠️ Configure seu perfil financeiro</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
            ${alerts.map(a=>`<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${a.cor};border-radius:var(--r12);padding:14px;display:flex;align-items:flex-start;gap:10px">
              <span style="font-size:22px;flex-shrink:0">${a.icon}</span>
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text2);line-height:1.5;margin-bottom:8px">${a.msg}</div>
                ${a.page?`<button class="btn btn-ghost" style="height:28px;font-size:11px" onclick="goMobile('${a.page}')">${a.cta}</button>`:''}
              </div>
            </div>`).join('')}
          </div>
        </div>`;
    } else {
      alertEl.innerHTML = '';
    }
  }

  // ── HERO: Banner principal ──
  const hero = document.getElementById('dash-hero');
  if(hero) hero.innerHTML = `
    <div class="hero-top">
      <div>
        <div class="hero-label">Meu Patrimônio</div>
        <div class="hero-amount">${fmt(pl.liquido)}</div>
        <div class="hero-sub">${pl.ativos > 0 ? `${fmt(pl.ativos)} em investimentos` : 'Nenhum investimento cadastrado'}</div>
      </div>
      <div class="hero-score" title="Saúde Financeira: mede equilíbrio entre entradas, dívidas e reservas. Diferente do perfil de investidor.">
        <div class="hero-score-val" style="color:${scoreCor}">${score}</div>
        <div class="hero-score-label">💚 Saúde financeira</div>
        <div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div>
      </div>
    </div>
    <div class="hero-pills">
      <div class="hero-pill green">💰 ${fmt(entrada)}/mês</div>
      <div class="hero-pill ${sobra>=0?'green':'red'}">${sobra>=0?'✅':'⚠️'} Sobra: ${fmt(sobra)}</div>
      <div class="hero-pill blue">🚀 Investir: ${fmt(investir)}</div>
      <button onclick="abrirLancamentoRapido()" style="background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700;color:#fff;cursor:pointer;display:flex;align-items:center;gap:6px">⚡ Lançamento rápido</button>
    </div>`;

  // ── 4 CARDS PRINCIPAIS: o que importa agora ──
  const mc = document.getElementById('dash-mcards');
  if(mc) mc.innerHTML = `
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas em ${D.meses[mi]||'este mês'}</div>
      <div class="mval mval-pos">${fmt(entrada)}</div>
      <div class="msub">${D.entradas.filter(e=>e.ativo).length} fonte(s) de renda</div>
    </div>
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Saídas em ${D.meses[mi]||'este mês'}</div>
      <div class="mval mval-neg">${fmt(saida)}</div>
      <div class="msub">${pct(saida, entrada)} da renda</div>
    </div>
    <div class="mcard ${sobra>=0?'mcard-pos':'mcard-neg'}">
      <div class="mlabel">${sobra>=0?'✅':'⚠️'} Sobra do mês</div>
      <div class="mval ${sobra>=0?'mval-pos':'mval-neg'}">${fmt(sobra)}</div>
      <div class="msub">${sobra>=0?'Você está no positivo':'Despesas maiores que renda'}</div>
    </div>
    <div class="mcard mcard-teal">
      <div class="mlabel">🚀 Disponível p/ investir</div>
      <div class="mval mval-teal">${fmt(investir)}</div>
      <div class="msub">${investir>0?'50% da sobra':'Sem sobra este mês'}</div>
    </div>`;

  // ── SAÚDE FINANCEIRA ──
  const saude = document.getElementById('dash-saude');
  if(saude){
    const fixasMes  = totalFixasMes(mi);
    const varMes    = totalComprasMes(mi);
    const pctFixas  = entrada>0?Math.round((fixasMes/entrada)*100):0;
    const pctVar    = entrada>0?Math.round((varMes/entrada)*100):0;

    const indicadores = [
      { label:'Reserva de emergência', valor:`${pctEmerg}%`, sub:`${fmt(caixa)} de ${fmt(metaE)}`, cor: pctEmerg>=100?'#10B981':pctEmerg>=50?'#F59E0B':'#EF4444', pct: pctEmerg, icon:'🛡️' },
      { label:'Comprometimento fixo',  valor:`${pctFixas}%`, sub:`${fmt(fixasMes)} de ${fmt(entrada)}`, cor: pctFixas<=30?'#10B981':pctFixas<=50?'#F59E0B':'#EF4444', pct: pctFixas, icon:'📌' },
      { label:'Score financeiro',      valor:`${score}/100`, sub:scoreLabel, cor: scoreCor, pct: score, icon:'⭐' },
    ];

    saude.innerHTML = indicadores.map(ind=>`
      <div class="mcard">
        <div class="mlabel">${ind.icon} ${ind.label}</div>
        <div class="mval" style="color:${ind.cor};font-size:20px">${ind.valor}</div>
        <div style="height:4px;background:var(--card3);border-radius:99px;margin:8px 0 4px;overflow:hidden">
          <div style="height:4px;width:${Math.min(100,ind.pct)}%;background:${ind.cor};border-radius:99px;transition:width .6s"></div>
        </div>
        <div class="msub">${ind.sub}</div>
      </div>`).join('');
  }

  // ── PRÓXIMOS MESES: tabela simples ──
  const proxEl = document.getElementById('dash-proximos');
  if(proxEl){
    const proxMeses = getActiveMeses().slice(0, 6); // próximos 6 meses
    const rows = proxMeses.map(m=>{
      const i = D.meses.indexOf(m);
      const e = totalEMes(i), d = totalDivBruto(i), s = sobraM(i), inv = invDisp(i);
      const isAtual = i === mi;
      return `<tr style="${isAtual?'background:var(--accent-glow);font-weight:700':''}">
        <td style="font-weight:${isAtual?700:500}">${m}${isAtual?' <span style="font-size:10px;color:var(--accent);background:var(--accent-glow);padding:1px 6px;border-radius:99px">hoje</span>':''}</td>
        <td class="tr tpos">${fmt(e)}</td>
        <td class="tr tneg">${fmt(d)}</td>
        <td class="tr ${s>=0?'tpos':'tneg'}">${fmt(s)}</td>
        <td class="tr tteal">${fmt(inv)}</td>
      </tr>`;
    }).join('');
    proxEl.innerHTML = `<thead><tr>
      <th>Mês</th>
      <th class="tr">💰 Entradas</th>
      <th class="tr">💸 Saídas</th>
      <th class="tr">📊 Sobra</th>
      <th class="tr" style="color:var(--teal)">🚀 P/ Investir</th>
    </tr></thead><tbody>${rows}</tbody>`;
  }

  // ── MAIORES GASTOS DO MÊS ──
  renderTopGastosMes(mi);

  // ── PATRIMÔNIO FUTURO ──
  const pf = calcPatrimonioFuturo();
  const pfEl = document.getElementById('dash-patrimonio-futuro');
  if(pfEl && pf && pf.length){
    const temInv = D.ativos.reduce((s,a)=>s+(a.valor||0),0) > 0;
    const txRef = temInv ? '' : ` (usando CDI ${fmt(D.cdi12||14.80).replace('R$\u00a0','').trim()}% a.a.)`;
    pfEl.innerHTML = `
      <div class="divider"><span class="divider-text">📈 Patrimônio futuro — seguindo as recomendações${txRef}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:8px">
        ${pf.map((p,i)=>`<div class="mcard ${i===pf.length-1?'mcard-accent':''}">
          <div class="mlabel">${p.yr}</div>
          <div class="mval ${i===pf.length-1?'mval-accent':'mval-teal'}" style="font-size:18px">${fmtK(p.saldo)}</div>
          <div class="msub">aportes: ${fmtK(p.aporte)}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text3)">${temInv?'Projeção com juros compostos sobre seus ativos atuais + aportes recomendados.':'Projeção considerando os aportes recomendados investidos a CDI. Cadastre seus ativos na aba Investimentos para uma projeção mais precisa.'} Não garante rentabilidade futura.</div>`;
  } else if(pfEl) pfEl.innerHTML = '';
}

function renderTopGastosMes(mi) {
  const el = document.getElementById('dash-top-gastos');
  if(!el) return;

  // Coleta todos os gastos do mês
  const gastos = [];
  D.fixas.filter(f=>f.ativo && f.valor>0).forEach(f=>{
    gastos.push({nome:f.nome, valor:f.valor, cat:f.cat, tipo:'Fixo'});
  });
  D.compras.filter(c=>c.ativo).forEach(c=>{
    const v = calcValsCompra(c)[mi]||0;
    if(v>0) gastos.push({nome:c.nome, valor:v, cat:c.cat, tipo:'Variável', cartao:c.cartao});
  });

  if(!gastos.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhum gasto em ${D.meses[mi]||'este mês'}. Cadastre contas na aba Saídas.</div></div>`;
    return;
  }

  const totalM = gastos.reduce((s,g)=>s+g.valor,0);
  gastos.sort((a,b)=>b.valor-a.valor);

  el.innerHTML = gastos.map(g=>{
    const info = CATS[g.cat]||CATS.outros;
    const pctVal = totalM>0?Math.round((g.valor/totalM)*100):0;
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:18px;flex-shrink:0">${info.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.nome}</div>
        <div style="font-size:10px;color:var(--text2)">${info.label}${g.cartao?' · 💳 '+g.cartao:''} · <span class="badge ${g.tipo==='Fixo'?'badge-fixo':'badge-var'}">${g.tipo}</span></div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:14px;font-weight:700;color:var(--neg)">${fmt(g.valor)}</div>
        <div style="font-size:10px;color:var(--text3)">${pctVal}% das saídas</div>
      </div>
    </div>`;
  }).join('') + `<div style="padding:10px 0;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:12px;font-weight:700;color:var(--text2)">Total</span>
    <span style="font-size:16px;font-weight:700;color:var(--neg)">${fmt(totalM)}</span>
  </div>`;
}


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
    if(e.tipo==='anual'){ const mn=MMAP[e.mes]||0; const {m}=parseMes(selEntradas); return mn===m; }
    return e.mes===selEntradas;
  });

  // Resumo
  const totalMes = selEntradas
    ? (() => { const mi=D.meses.indexOf(selEntradas); return mi>=0?totalEMes(mi):0; })()
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
    const visivel=!selEntradas||(e.tipo==='mensal')||(e.tipo==='anual'&&(()=>{const mn=MMAP[e.mes]||0;const{m}=parseMes(selEntradas);return mn===m;})())||(e.mes===selEntradas);
    if(!visivel) return '';
    const MNAMES={'Jan':'Janeiro','Fev':'Fevereiro','Mar':'Março','Abr':'Abril','Mai':'Maio','Jun':'Junho','Jul':'Julho','Ago':'Agosto','Set':'Setembro','Out':'Outubro','Nov':'Novembro','Dez':'Dezembro'};
    const mesInfo=e.tipo!=='mensal'&&e.mes?(e.tipo==='anual'?` · todo ${MNAMES[e.mes]||e.mes}`:` · ${e.mes}`):'';
    return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r12);margin-bottom:8px;${!e.ativo?'opacity:.5':''}transition:all .15s" onmouseenter="this.style.borderColor='var(--border2)'" onmouseleave="this.style.borderColor='var(--border)'">
      <span style="font-size:22px">${info.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">${e.nome} ${tipoBadge}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${info.label}${e.dia?` · Dia ${e.dia}`:''}${mesInfo}</div>
      </div>
      <div style="text-align:right;min-width:120px">
        <div style="font-size:20px;font-weight:700;color:var(--pos)">${fmt(e.valor)}</div>
        <div style="font-size:10px;color:var(--text2)">${e.tipo==='mensal'?'todo mês':e.tipo==='anual'?`todo ano em ${MNAMES[e.mes]||e.mes||'—'}`:e.mes?`em ${e.mes}`:'ocorrência única'}</div>
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
  // Para anual/unico: e.mes é agora só o nome abreviado ("Jan","Fev"...)
  const mesVal=e.mes&&e.mes.includes('/')?e.mes.split('/')[0]:e.mes||'';
  document.getElementById('me-mes').value=mesVal;
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

// ── CARTÕES RENDER ────────────────────────────────
function renderCartoesTo(el, i) {
  if(!el) return;
  const cartoes = D.compras.filter(c=>c.ativo && c.cartao && (calcValsCompra(c)[i]||0)>0);
  const cartoesUnicos = [...new Set(cartoes.map(c=>c.cartao))];
  if(!cartoesUnicos.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">💳</div><div class="empty-text">Nenhuma fatura de cartão em ${D.meses[i]||'este mês'}.</div></div>`;
    return;
  }
  el.innerHTML = cartoesUnicos.map(nomeCartao=>{
    const cartao = D.cartoes.find(c=>c.nome===nomeCartao);
    const cor = cartao?.cor||'#6B7280';
    const lim = cartao?.limite||0;
    const itens = cartoes.filter(c=>c.cartao===nomeCartao);
    const totalMes = itens.reduce((s,c)=>s+(calcValsCompra(c)[i]||0),0);
    const totalAberto = D.compras.filter(c=>c.ativo&&c.cartao===nomeCartao).reduce((s,c)=>s+calcValsCompra(c).reduce((a,v)=>a+v,0),0);
    const pctUsado = lim>0?Math.min(100,Math.round((totalAberto/lim)*100)):null;
    const barCor = pctUsado===null?'#6B7280':pctUsado>=80?'#EF4444':pctUsado>=50?'#F59E0B':'#10B981';
    const cardCls = pctUsado!==null&&pctUsado>=80?'alert-card':pctUsado!==null&&pctUsado>=50?'warn-card':'';
    return `<div class="cc-card ${cardCls}">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${cor};border-radius:var(--r16) var(--r16) 0 0"></div>
      <div class="cc-name" style="margin-top:8px"><span style="font-size:18px">💳</span> ${nomeCartao}</div>
      <div class="cc-amounts">
        <div class="cc-amounts-left"><div class="lbl">Fatura ${D.meses[i]||''}</div><div class="val">${fmt(totalMes)}</div></div>
        ${lim>0?`<div class="cc-amounts-right"><div class="lbl">Livre</div><div class="val">${fmt(Math.max(0,lim-totalAberto))}</div></div>`:''}
      </div>
      ${lim>0?`<div class="cc-bar"><div class="cc-bar-fill" style="width:${pctUsado}%;background:${barCor}"></div></div>
      <div class="cc-meta"><span>Total aberto: <strong>${fmt(totalAberto)}</strong></span><span>Limite: <strong>${fmt(lim)}</strong> · <strong>${pctUsado}%</strong> usado</span></div>`:''}
      <div class="cc-parcelas">${itens.map(c=>`<span class="cc-chip-sml">${c.nome}: ${fmtK(calcValsCompra(c)[i])}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

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
      <div class="hero-score"><div class="hero-score-val" style="color:${scoreCor}">${score}</div><div class="hero-score-label">Saúde financeira</div><div class="score-bar"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div></div>
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
let selSaidasMes = ''; // filtro de mês na aba Saídas Variáveis

function renderSaidasVar() {
  const el=document.getElementById('lista-var');if(!el)return;

  // Renderiza gestão de anos
  renderAnosList();

  // Barra de busca e ordenação
  const searchBar = document.getElementById('var-searchbar');
  if(searchBar && !searchBar.innerHTML.trim()) {
    searchBar.innerHTML=`
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
        <input type="text" placeholder="🔍 Buscar compra..." style="flex:1;min-width:180px;height:34px"
          oninput="_comprasFiltro=this.value.toLowerCase();renderSaidasVar()" value="${_comprasFiltro}">
        <select style="height:34px;width:auto" onchange="_comprasOrdem=this.value;renderSaidasVar()">
          <option value="data"${_comprasOrdem==='data'?' selected':''}>📅 Por data</option>
          <option value="valor"${_comprasOrdem==='valor'?' selected':''}>💰 Por valor</option>
          <option value="nome"${_comprasOrdem==='nome'?' selected':''}>🔤 Por nome</option>
        </select>
        ${_comprasFiltro?`<button class="btn btn-ghost" style="height:34px" onclick="_comprasFiltro='';document.querySelector('#var-searchbar input').value='';renderSaidasVar()">✕ Limpar</button>`:''}
      </div>`;
  } else if(searchBar) {
    // Atualiza apenas o botão limpar sem reconstruir
    const clearBtn = searchBar.querySelector('.btn');
    if(_comprasFiltro && !clearBtn) {
      searchBar.innerHTML+=`<button class="btn btn-ghost" style="height:34px" onclick="_comprasFiltro='';document.querySelector('#var-searchbar input').value='';renderSaidasVar()">✕</button>`;
    }
  }

  // Monta seletor de meses com dados
  const mesesComDados = new Set();
  D.compras.filter(c=>c.ativo).forEach(c=>{
    calcValsCompra(c).forEach((v,i)=>{ if(v>0) mesesComDados.add(D.meses[i]); });
  });
  const mesesList = [...mesesComDados].sort((a,b)=>{
    const pa=parseMes(a),pb=parseMes(b);
    return pa.y!==pb.y?pa.y-pb.y:pa.m-pb.m;
  });

  const filtroEl=document.getElementById('var-filtro-meses');
  if(filtroEl) {
    filtroEl.innerHTML=`<button class="msb${selSaidasMes===''?' on':''}" onclick="selSaidasMes='';renderSaidasVar()">Todas</button>`
      +mesesList.map(m=>`<button class="msb${selSaidasMes===m?' on':''}" onclick="selSaidasMes='${m}';renderSaidasVar()">${sM(m)}</button>`).join('');
  }

  if(!D.compras.length){ el.innerHTML=`<div class="empty"><div class="empty-icon">🔄</div><div class="empty-text">Nenhuma compra/parcela. Clique em + para adicionar.</div></div>`; return; }

  // Filtra por mês selecionado
  let comprasFiltradas = selSaidasMes
    ? D.compras.filter(c=>{ const mi=D.meses.indexOf(selSaidasMes); return mi>=0 && (calcValsCompra(c)[mi]||0)>0; })
    : D.compras;

  // Aplica busca por texto
  if(_comprasFiltro) {
    comprasFiltradas = comprasFiltradas.filter(c=>
      c.nome.toLowerCase().includes(_comprasFiltro) ||
      (c.cartao||'').toLowerCase().includes(_comprasFiltro) ||
      (CATS[c.cat]?.label||'').toLowerCase().includes(_comprasFiltro)
    );
  }

  // Aplica ordenação
  if(_comprasOrdem==='valor') comprasFiltradas = [...comprasFiltradas].sort((a,b)=>(b.valor||0)-(a.valor||0));
  else if(_comprasOrdem==='nome') comprasFiltradas = [...comprasFiltradas].sort((a,b)=>a.nome.localeCompare(b.nome));
  else comprasFiltradas = [...comprasFiltradas].sort((a,b)=>new Date(b.dataCompra||0)-new Date(a.dataCompra||0));

  if(!comprasFiltradas.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">${_comprasFiltro?`Nenhum resultado para "${_comprasFiltro}"`:`Nenhuma parcela em ${selSaidasMes}`}.</div></div>`;
    return;
  }

  const mi = selSaidasMes ? D.meses.indexOf(selSaidasMes) : -1;

  el.innerHTML=comprasFiltradas.map((c)=>{
    const ci=D.compras.indexOf(c);
    const info=CATS[c.cat]||CATS.outros;
    const valsC=calcValsCompra(c);
    const total=valsC.reduce((s,v)=>s+v,0);
    const primMes=D.meses.findIndex((_,i)=>valsC[i]>0);
    const ultMes=D.meses.reduce((b,_,i)=>valsC[i]>0?i:b,-1);
    const cartao=D.cartoes.find(ct=>ct.nome===c.cartao);
    const parStr=c.parcelas>1?`${c.parcelas}x de ${fmt((c.valor||0)/c.parcelas)}`:`à vista`;
    const valorDestaque = mi>=0 ? (valsC[mi]||0) : c.valor;
    const labelValor = mi>=0 ? `Parcela ${sM(selSaidasMes)}` : 'Valor total';

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
          <div style="font-size:10px;color:var(--text2);margin-bottom:2px">${labelValor}</div>
          <div style="font-size:20px;font-weight:700;color:var(--neg)">${fmt(valorDestaque)}</div>
          ${mi>=0?`<div style="font-size:10px;color:var(--text3)">total: ${fmt(total)}</div>`:''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarCompra(${ci})">✏️</button>
          <button class="btn-rm" onclick="removerCompra(${ci})">✕</button>
        </div>
      </div>
      ${c.parcelas>1?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:10px">${valsC.map((v,i)=>v>0?`<span class="cc-chip-sml" style="${D.meses[i]===selSaidasMes?'background:var(--accent-glow);color:var(--accent);font-weight:700':''}">${sM(D.meses[i])}: ${fmtK(v)}</span>`:'').filter(Boolean).join('')}</div>`:''}
    </div>`;
  }).join('');
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

// Estado das parcelas editáveis no modal
let _parcelasVals = []; // valores individuais de cada parcela
let _parcelasLoaded = false; // true se pré-carregado por editarCompra (não redistribuir)

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
  // Inicializa valores individuais APENAS se não foram pré-carregados por editarCompra
  const n=c.parcelas||1;
  if(!_parcelasLoaded) {
    const parcVal=c.valor>0?Math.round((c.valor/n)*100)/100:0;
    _parcelasVals=Array(n).fill(parcVal);
  }
  _parcelasLoaded=false; // reset flag após uso
  document.getElementById('btn-salvar-compra').onclick=()=>salvarCompra(ci);
  renderParcelasFields();
  atualizarPreviewCompra();
}

function renderParcelasFields() {
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const valorTotal=parseFloat(document.getElementById('mc-valor').value)||0;
  // Redimensiona _parcelasVals SEM redistribuir (preserva valores customizados)
  const parcPadrao=valorTotal>0?Math.round((valorTotal/n)*100)/100:0;
  while(_parcelasVals.length<n) _parcelasVals.push(parcPadrao);
  while(_parcelasVals.length>n) _parcelasVals.pop();
  // NÃO redistribui automaticamente — o usuário pode ter editado parcelas individuais

  const container=document.getElementById('mc-parcelas-fields');
  if(!container) return;
  if(n<=1) { container.innerHTML=''; return; }
  container.innerHTML=`
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
      Valores por parcela <span style="color:var(--text3);font-weight:400">(edite individualmente se necessário)</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">
      ${_parcelasVals.map((v,i)=>`
        <div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:3px;text-align:center">${i+1}ª parcela</div>
          <input type="number" min="0" step="0.01" value="${v||''}" placeholder="R$ 0,00"
            style="text-align:right;padding:7px 8px;font-size:13px;font-weight:600"
            onchange="_parcelasVals[${i}]=parseFloat(this.value)||0;recalcTotalFromParcelas()">
        </div>`).join('')}
    </div>`;
}

function recalcTotalFromParcelas() {
  const total=_parcelasVals.reduce((s,v)=>s+(v||0),0);
  const el=document.getElementById('mc-valor');
  if(el) el.value=Math.round(total*100)/100;
  atualizarPreviewCompra();
}

function onValorChange() {
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const parcPadrao=valor>0?Math.round((valor/n)*100)/100:0;
  _parcelasVals=Array(n).fill(parcPadrao);
  renderParcelasFields();
  atualizarPreviewCompra();
}

function onParcelasChange() {
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const parcPadrao=valor>0?Math.round((valor/n)*100)/100:0;
  _parcelasVals=Array(n).fill(parcPadrao);
  renderParcelasFields();
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
  // Mostra preview com valores individuais se editados
  const totalParcelas=_parcelasVals.reduce((s,v)=>s+(v||0),0);
  const valorParc=parcelas>1?Math.round((valor/parcelas)*100)/100:valor;
  prev.innerHTML=`
    <div style="font-size:12px;color:var(--text2)">Será lançado em: <strong>${mesesCom.map(m=>sM(m)).join(', ')}</strong></div>
    ${parcelas>1?`<div style="font-size:11px;color:var(--text3);margin-top:2px">${parcelas}x · Valor total: ${fmt(totalParcelas>0?totalParcelas:valor)}</div>`:''}`;
}

function salvarCompra(ci) {
  const nome=document.getElementById('mc-nome').value.trim();
  const cat=document.getElementById('mc-cat').value;
  const cartao=document.getElementById('mc-cartao').value;
  const parcelas=parseInt(document.getElementById('mc-parcelas').value)||1;
  const dataCompra=document.getElementById('mc-data').value;
  if(!nome){alert('Informe o nome.');return;}
  // Usa soma das parcelas individuais como valor total
  const totalParcelas=_parcelasVals.reduce((s,v)=>s+(v||0),0);
  const valorInput=parseFloat(document.getElementById('mc-valor').value)||0;
  const valor=totalParcelas>0?totalParcelas:valorInput;
  if(!valor){alert('Informe o valor.');return;}
  // Armazena os valores individuais das parcelas se alguma diferir da média
  let parcelasCustom = null;
  if(parcelas>1 && _parcelasVals.length===parcelas) {
    const media = valor/parcelas;
    const temDiferente = _parcelasVals.some(v=>Math.abs((v||0)-media)>0.009);
    if(temDiferente) parcelasCustom=[..._parcelasVals];
  }
  const obj={id:ci>=0?D.compras[ci].id:genId('c'),nome,cat,cartao,valor,parcelas,dataCompra,ativo:true};
  if(parcelasCustom) obj.parcelasCustom=parcelasCustom;
  if(ci>=0) D.compras[ci]=obj; else D.compras.push(obj);
  document.getElementById('modal-compra-overlay').style.display='none';
  scheduleAutoSave(); renderSaidasVar(); renderAll();
}
function editarCompra(ci){
  // Carrega parcelasCustom se existir
  const c=D.compras[ci];
  if(c&&c.parcelasCustom&&c.parcelasCustom.length===c.parcelas) {
    _parcelasVals=[...c.parcelasCustom];
    _parcelasLoaded=true; // sinaliza para abrirModalCompra NÃO sobrescrever
  } else {
    const n=c?.parcelas||1;
    const pv=c?.valor>0?Math.round((c.valor/n)*100)/100:0;
    _parcelasVals=Array(n).fill(pv);
    _parcelasLoaded=false;
  }
  abrirModalCompra(ci);
}
function removerCompra(ci){if(!confirm(`Remover "${D.compras[ci].nome}"?`))return;D.compras.splice(ci,1);scheduleAutoSave();renderSaidasVar();}

// Gestão de anos
function renderAnosList() {
  // Tenta renderizar no elemento de saídas variáveis primeiro, depois no legado
  const el=document.getElementById('anos-list-var')||document.getElementById('anos-list');
  if(!el)return;
  const yrs=getYears();
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r12);margin-bottom:14px">
    <span style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0">📅 Anos no planejamento:</span>
    ${yrs.map(yr=>`<span class="msb" style="cursor:default">${yr} <span style="opacity:.5;font-size:10px">(${getMesesAno(yr).length}m)</span></span>`).join('')}
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

// ── PAGAR CONTAS (ex-Faturas) ─────────────────────────
function renderFaturas() {
  if(selFaturas===-1) selFaturas=getMesAtualIdx();
  const totalMeses = D.meses.length;
  // Monta seletor mostrando TODOS os meses (passados e futuros para adiantar)
  const ms=document.getElementById('faturas-months');
  if(ms){
    ms.innerHTML=D.meses.map((m,i)=>{
      const hoje=getMesAtualIdx();
      const isPast=i<hoje;
      const isFut=i>hoje;
      return `<button class="msb${i===selFaturas?' on':''}" onclick="selFaturas=${i};renderFaturas()"
        style="${isPast?'border-color:rgba(239,68,68,.3);color:var(--neg)':isFut?'border-color:rgba(139,92,246,.2);color:var(--accent)':''}"
        title="${isPast?'Mês passado — pagar pendências':isFut?'Mês futuro — adiantar pagamentos':'Mês atual'}">${sM(m)}</button>`;
    }).join('');
  }
  const mi=selFaturas;
  const mesNome=D.meses[mi]||'';
  const hoje=getMesAtualIdx();
  const lbl=document.getElementById('faturas-mes-label');
  if(lbl){
    const tipoLabel=mi<hoje?'⏪ Mês passado':mi>hoje?'⏩ Mês futuro':'📅 Mês atual';
    lbl.innerHTML=`<span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      Pagar Contas — <strong>${mesNome}</strong>
      <span class="badge ${mi<hoje?'badge-neg':mi>hoje?'badge-admin':'badge-pos'}">${tipoLabel}</span>
      ${mi>0?`<button class="btn btn-ghost" style="height:24px;font-size:11px" onclick="selFaturas=${mi-1};renderFaturas()">← anterior</button>`:''}
      ${mi<totalMeses-1?`<button class="btn btn-ghost" style="height:24px;font-size:11px" onclick="selFaturas=${mi+1};renderFaturas()">próximo →</button>`:''}
    </span>`;
  }
  const mes=D.meses[mi];
  if(!mes){return;}

  const pag=D.pagamentos&&D.pagamentos[mes]||{};

  // ── CONTAS FIXAS (uma linha por conta, não agrupadas) ──
  const fixasDoMes = D.fixas.filter(f=>f.ativo && (f.valor||0)>0);

  // ── FATURAS DE CARTÃO: agrupa por cartão ──
  const porCartao = {};
  D.compras.filter(c=>c.ativo).forEach(c=>{
    const v = calcValsCompra(c)[mi]||0;
    if(!v) return;
    const key = c.cartao||'__semcartao__';
    if(!porCartao[key]) porCartao[key]={cartao:c.cartao, itens:[], total:0};
    porCartao[key].itens.push({nome:c.nome, valor:v, cat:c.cat});
    porCartao[key].total+=v;
  });
  // Saídas sem cartão viram itens individuais como fixas
  const semCartao = porCartao['__semcartao__']?.itens||[];
  delete porCartao['__semcartao__'];

  // ── MONTA GRUPOS PAGÁVEIS ──
  const grupos = [];
  fixasDoMes.forEach(f=>{
    grupos.push({id:'fx_'+f.id, label:f.nome, sub:'Conta fixa · '+((CATS[f.cat]||CATS.outros).label), icon:(CATS[f.cat]||CATS.outros).icon, valor:f.valor, tipo:'fixa', itens:[]});
  });
  semCartao.forEach((it,idx)=>{
    grupos.push({id:'sc_'+idx+'_'+mi, label:it.nome, sub:(CATS[it.cat]||CATS.outros).label+' · sem cartão', icon:(CATS[it.cat]||CATS.outros).icon, valor:it.valor, tipo:'variavel', itens:[]});
  });
  Object.entries(porCartao).forEach(([nomeCartao, grp])=>{
    const cartao=D.cartoes.find(c=>c.nome===nomeCartao);
    const sub=cartao?`Vencimento dia ${cartao.diaVencimento} · Fechamento dia ${cartao.diaFechamento}`:'Cartão de crédito';
    grupos.push({id:'cc_'+nomeCartao.replace(/\s/g,'_')+'_'+mi, label:`💳 Fatura ${nomeCartao}`, sub, icon:'💳', valor:grp.total, tipo:'cartao', itens:grp.itens, cartao:nomeCartao});
  });

  const pagas = grupos.filter(g=>pag[g.id]);
  const pendentes = grupos.filter(g=>!pag[g.id]);
  const _cp = calcPendenteMes(mi);
  const totBruto = _cp.bruto;
  const totPago  = _cp.pago;
  const totPend  = _cp.pendente;
  const pctP = totBruto>0?Math.round((totPago/totBruto)*100):0;

  const sumEl=document.getElementById('faturas-summary');
  if(sumEl) sumEl.innerHTML=`
    <div class="mcard mcard-neg"><div class="mlabel">💸 Total do mês</div><div class="mval mval-neg">${fmt(totBruto)}</div></div>
    <div class="mcard mcard-warn"><div class="mlabel">⏳ Pendente</div><div class="mval mval-warn">${fmt(totPend)}</div><div class="msub">${pendentes.length} conta(s)</div></div>
    <div class="mcard mcard-pos"><div class="mlabel">✅ Pago</div><div class="mval mval-pos">${fmt(totPago)}</div><div class="msub">${pagas.length} conta(s) · ${pctP}%</div></div>
    <div class="mcard ${pctP===100&&grupos.length>0?'mcard-pos':'mcard-accent'}"><div class="mlabel">📊 Progresso</div><div class="mval ${pctP===100?'mval-pos':'mval-accent'}">${pctP}%</div><div style="height:4px;background:var(--card3);border-radius:99px;margin-top:8px;overflow:hidden"><div style="height:4px;width:${pctP}%;background:${pctP===100?'var(--pos)':'var(--accent)'};border-radius:99px;transition:width .5s"></div></div></div>
  `;

  const allDone=document.getElementById('faturas-all-done');
  if(allDone){
    if(pctP===100&&grupos.length>0){
      allDone.style.display='';
      allDone.innerHTML=`<div style="text-align:center;padding:20px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.3);border-radius:var(--r12);color:var(--pos)">
        <div style="font-size:28px;margin-bottom:8px">🎉</div>
        <div style="font-weight:700;font-size:16px">Todas as contas de ${mesNome} foram pagas!</div>
        <div style="font-size:12px;margin-top:4px;opacity:.8">Essas contas não estão somando em Dívidas</div>
      </div>`;
    } else {
      allDone.style.display='none';
    }
  }

  const buildGrupo = (g, pago) => {
    const bordaCor = g.tipo==='cartao'?'rgba(139,92,246,.2)':g.tipo==='fixa'?'rgba(59,130,246,.15)':'rgba(245,158,11,.15)';
    const itensHTML = g.itens&&g.itens.length>1
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">${g.itens.map(it=>`<span class="cc-chip-sml">${(CATS[it.cat]||CATS.outros).icon} ${it.nome}: ${fmtK(it.valor)}</span>`).join('')}</div>`
      : '';
    if(pago) return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.2);border-radius:var(--r12);margin-bottom:8px;opacity:.75">
      <span style="font-size:22px">${g.icon}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px;text-decoration:line-through">${g.label}</div>
        <div style="font-size:11px;color:var(--text2)">${g.sub}</div>
        ${itensHTML}
      </div>
      <div style="text-align:right;flex-shrink:0"><div style="font-size:18px;font-weight:700;color:var(--pos)">${fmt(g.valor)}</div><div style="font-size:10px;color:var(--pos)">✅ Pago</div></div>
      <button class="btn btn-ghost" style="height:30px;font-size:11px" onclick="faturaDesfazer('${g.id}',${mi})">↩ Desfazer</button>
    </div>`;

    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${bordaCor};border-radius:var(--r12);padding:16px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:22px">${g.icon}</span>
        <div style="flex:1;min-width:120px">
          <div style="font-weight:700;font-size:14px">${g.label}</div>
          <div style="font-size:11px;color:var(--text2)">${g.sub}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-right:10px">
          <div style="font-size:20px;font-weight:700;color:var(--neg)">${fmt(g.valor)}</div>
        </div>
        <button class="btn btn-pos" style="height:38px;padding:0 18px;font-size:13px;flex-shrink:0" onclick="faturaPagar('${g.id}',${mi},${g.valor})">✓ Pagar</button>
      </div>
      ${itensHTML}
    </div>`;
  };

  const listEl=document.getElementById('faturas-list');
  if(listEl){
    if(!grupos.length){
      listEl.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhuma conta em ${mesNome}.<br><small style="color:var(--text3)">Cadastre contas fixas e variáveis na aba Saídas.</small></div></div>`;
      return;
    }
    listEl.innerHTML=
      (pendentes.length?`<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">⏳ PENDENTES (${pendentes.length})</div>`+pendentes.map(g=>buildGrupo(g,false)).join(''):'')
      +(pagas.length?`<div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;margin:16px 0 10px">✅ PAGAS (${pagas.length})</div>`+pagas.map(g=>buildGrupo(g,true)).join(''):'');
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
  const yrs=getYears();
  const rows=[];
  yrs.forEach(yr=>{
    const mesesDoAno=ativosInv.filter(m=>m.includes('/'+yr.slice(2)));
    if(!mesesDoAno.length) return;
    let totE=0,totC=0,totSobra=0,totInv=0;
    mesesDoAno.forEach(m=>{
      const i=D.meses.indexOf(m);
      const r=calcInvest(i);
      const manual=isManual(i);
      const valFinal=invDisp(i);
      const valCalc=invDispCalc(i);
      const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
      totE+=r.e; totC+=r.c; totSobra+=r.sobra; totInv+=valFinal;
      rows.push(`<tr style="${manual?'background:rgba(245,158,11,.06)':''}">
        <td style="font-weight:500">${m}</td>
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
              title="${manual?'Valor manual — clique em ↩ para restaurar automático':'Calculado automaticamente — edite para sobrescrever'}"
              style="width:120px;text-align:right;font-weight:700;border-color:${manual?'var(--warn)':'var(--border2)'};color:${manual?'var(--warn)':'var(--teal)'};background:${manual?'var(--warn-bg)':'var(--card2)'}"
              onchange="setManual(${i},this.value);renderInvestVisao()">
          </div>
        </td>
      </tr>`);
    });
    // Linha de subtotal do ano
    rows.push(`<tr style="background:linear-gradient(90deg,${yr==='2026'?'rgba(59,130,246,.08)':'rgba(139,92,246,.08)'},transparent);font-weight:700;border-top:2px solid ${yr==='2026'?'rgba(59,130,246,.2)':'rgba(139,92,246,.2)'}">
      <td style="color:${yr==='2026'?'var(--info)':'var(--accent)'};font-size:12px">Σ ${yr}</td>
      <td class="tr tpos" style="font-size:12px">${fmt(totE)}</td>
      <td class="tr tneg" style="font-size:12px">${fmt(totC)}</td>
      <td class="tr" style="color:var(--text2);font-size:12px">${fmt(totSobra)}</td>
      <td></td>
      <td class="tr tteal" style="font-size:13px">${fmt(totInv)}</td>
    </tr>`);
  });
  const tot=ativosInv.reduce((s,m)=>s+invDisp(D.meses.indexOf(m)),0);
  const temManual=ativosInv.some(m=>isManual(D.meses.indexOf(m)));
  mt.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th>
    <th class="tr">Sobra bruta</th><th class="tr">Regra</th>
    <th class="tr" style="color:var(--teal)">
      💰 Disponível p/ investir
      ${temManual?`<button onclick="resetTodosManual()" title="Restaurar todos os valores automáticos" style="margin-left:6px;background:var(--warn-bg);color:var(--warn);border:1px solid rgba(245,158,11,.3);border-radius:4px;font-size:10px;padding:1px 6px;cursor:pointer;font-family:inherit">↩ resetar tudo</button>`:''}
    </th>
  </tr></thead><tbody>${rows.join('')}
  <tr style="background:var(--card2);font-weight:700;border-top:3px solid var(--border2)">
    <td>TOTAL</td><td></td><td></td><td></td><td></td>
    <td class="tr tteal" style="font-size:15px">${fmt(tot)}</td>
  </tr></tbody>`;
}

function renderArca(){
  const buckets=['A','R','C','A2'];
  const tot=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const bloq=arcaBloqueado();
  const caixa=caixaAtual(),metaE=metaEmergencia();
  const pctE=metaE>0?Math.min(100,Math.round((caixa/metaE)*100)):0;

  // Banner de perfil do investidor
  const perf=calcPerfilInvestidor();
  const perfBanner=document.getElementById('arca-perfil-banner');
  if(perfBanner) perfBanner.innerHTML=`<div style="background:linear-gradient(135deg,${perf.perfilCor}18,${perf.perfilCor}08);border:1px solid ${perf.perfilCor}30;border-radius:var(--r12);padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
    <div style="font-size:32px">${perf.perfilIcon}</div>
    <div style="flex:1">
      <div style="font-weight:700;font-size:16px;color:${perf.perfilCor}">Perfil ${perf.perfil.charAt(0).toUpperCase()+perf.perfil.slice(1)}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:3px;line-height:1.5">${perf.perfilDesc}</div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:10px;color:var(--text2)">🎯 Apetite a risco</div>
      <div style="font-size:22px;font-weight:800;color:${perf.perfilCor}">${perf.risco}/100</div>
    </div>
  </div>
  <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px">📋 Investimentos recomendados para seu perfil</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:4px">
    ${perf.perfilInv.map(inv=>`<div style="background:var(--card2);border:1px solid ${ARCA.colors[inv.bucket]}30;border-radius:var(--r8);padding:12px">
      <div style="font-size:10px;font-weight:700;color:${ARCA.colors[inv.bucket]};margin-bottom:4px">${ARCA.names[inv.bucket].split(' — ')[0]}</div>
      <div style="font-size:13px;font-weight:600;margin-bottom:3px">${inv.tipo}</div>
      <div style="font-size:10px;color:var(--text2);line-height:1.4">${inv.desc}</div>
      <div style="margin-top:6px"><span class="badge" style="background:${inv.risco==='Alto'?'var(--neg-bg)':inv.risco==='Médio'?'var(--warn-bg)':'var(--pos-bg)'};color:${inv.risco==='Alto'?'var(--neg)':inv.risco==='Médio'?'var(--warn)':'var(--pos)'}">Risco ${inv.risco}</span></div>
    </div>`).join('')}
  </div>`;

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

  // Projeções — juros compostos com valor real (deflacionado pelo IPCA)
  const proj=document.getElementById('proj-tbl');
  if(proj){
    const ANOS=[1,2,3,5,10,20,30];
    const ativosV=D.ativos.filter(a=>(a.valor||0)>0);
    const atTot=ativosV.reduce((s,a)=>s+(a.valor||0),0);
    const txMedia=atTot>0?ativosV.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTot:0;
    const heads=ANOS.map(a=>`<th class="tr" colspan="2" style="border-left:1px solid var(--border)">${a}a</th>`).join('');
    const subheads=ANOS.map(()=>`<th class="tr" style="font-size:9px;color:var(--teal)">Nominal</th><th class="tr" style="font-size:9px;color:var(--text2)">Real*</th>`).join('');
    const rows=[...ativosV,{nome:'<strong>Total</strong>',valor:atTot,_tx:txMedia,_tot:true}].map(a=>{
      const tx=a._tx!==undefined?a._tx:taxaAnual(a);
      const cols=ANOS.map(n=>{
        const nominal=projetar(a.valor||0,tx,n);
        const real=valorReal(nominal,n);
        const gNom=nominal-(a.valor||0);
        return `<td class="tr" style="border-left:1px solid var(--border)">
          <div class="proj-val" style="color:var(--teal)">${RK(nominal)}</div>
          <div class="proj-gain">+${RK(gNom)}</div>
        </td>
        <td class="tr">
          <div style="font-size:11px;color:var(--text2)">${RK(real)}</div>
        </td>`;
      }).join('');
      const sub=a._tot?`taxa média: ${P(tx*100)}/a`:`${a.indice} ${a.pct}% = ${P(tx*100)}/a`;
      return `<tr${a._tot?' style="background:var(--card2);border-top:2px solid var(--border)"':''}>
        <td><strong>${a.nome}</strong><div style="font-size:10px;color:var(--text2)">${sub}</div></td>
        <td class="tr" style="font-weight:600">${RK(a.valor||0)}</td>
        ${cols}
      </tr>`;
    }).join('');
    const inflNote=`<div style="font-size:10px;color:var(--text2);padding:10px 0">*Valor real descontando IPCA de ${P(D.ipca12||4.39)}/a. O dinheiro de hoje vale mais do que no futuro.</div>`;
    proj.innerHTML=`<thead class="thead-sticky">
      <tr><th rowspan="2">Ativo</th><th rowspan="2" class="tr">Atual</th>${heads}</tr>
      <tr>${subheads}</tr>
    </thead><tbody>${rows}</tbody>`;
    // Append inflation note after table
    const projWrap=proj.parentElement;
    let note=projWrap.querySelector('.proj-note');
    if(!note){note=document.createElement('div');note.className='proj-note';projWrap.appendChild(note);}
    note.innerHTML=inflNote;
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
// NOTA: série 4389 retorna CDI Over anualizado (% a.a.) ≈ 14.40 quando SELIC = 14.50
// O CDI mensal não existe como série direta confiável — calculamos via juros compostos
const BCB_SERIES = {
  cdiAnual:  4389,  // CDI Over anualizado (% a.a.) — ≈ 14.40%
  selicMeta: 432,   // Meta SELIC (% a.a.) — ≈ 14.50%
  ipcaMes:   433,   // IPCA mensal (% a.m.) — ≈ 0.67%
  ipca12m:   13522, // IPCA acumulado 12 meses (% a.a.) — ≈ 4.39%
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
    // Busca as 4 séries em paralelo — sem chamadas duplicadas
    const [cdiAnual, selicMeta, ipcaMes, ipca12m] = await Promise.all([
      bcbFetch(BCB_SERIES.cdiAnual,  1),  // CDI anualizado (% a.a.) ≈ 14.40
      bcbFetch(BCB_SERIES.selicMeta, 1),  // Meta SELIC (% a.a.) ≈ 14.50
      bcbFetch(BCB_SERIES.ipcaMes,   1),  // IPCA mensal (% a.m.) ≈ 0.67
      bcbFetch(BCB_SERIES.ipca12m,   1),  // IPCA 12 meses (% a.a.) ≈ 4.39
    ]);

    // ── CDI anual (% a.a.) ────────────────────────────────────────────────
    // Série 4389 retorna o CDI Over anualizado, ex: 14.40 = 14.40% ao ano
    D.cdi12  = parseFloat(cdiAnual.valor)  || D.cdi12;

    // ── CDI mensal — derivado do anual por juros compostos ─────────────────
    // Formula: ((1 + taxa_anual)^(1/12) - 1) × 100
    // Ex: ((1.1440)^(1/12) - 1) × 100 = 1.092% ao mês  ✓
    D.cdifev = parseFloat(((Math.pow(1 + D.cdi12 / 100, 1 / 12) - 1) * 100).toFixed(4));

    // ── SELIC meta ────────────────────────────────────────────────────────
    D.selic  = parseFloat(selicMeta.valor) || D.selic || 14.75;

    // ── IPCA ──────────────────────────────────────────────────────────────
    D.ipca12  = parseFloat(ipca12m.valor) || D.ipca12;
    D.ipcafev = parseFloat(ipcaMes.valor) || D.ipcafev;

    // ── Acumulado no ano via juros compostos ───────────────────────────────
    // Usa meses completos (dados BCB chegam com 1 mês de atraso)
    // getMonth() retorna 0=Jan…4=Mai → 4 meses completos disponíveis em Maio ✓
    const mesesCompletos = Math.max(1, new Date().getMonth()); // Jan=0→1, Mai=4→4
    D.cdi26  = parseFloat(((Math.pow(1 + D.cdi12  / 100, mesesCompletos / 12) - 1) * 100).toFixed(2));
    D.ipca26 = parseFloat(((Math.pow(1 + D.ipca12 / 100, mesesCompletos / 12) - 1) * 100).toFixed(2));

    if (!D.invManual) D.invManual = Array(nm()).fill(null);

    const dataRef = cdiAnual.data || ipcaMes.data || '—';
    if (stat) stat.innerHTML = `✅ Dados atualizados! Ref: <strong>${dataRef}</strong> · CDI a.a.: <strong>${D.cdi12.toFixed(2)}%</strong> · CDI mensal: <strong>${D.cdifev.toFixed(2)}%</strong> · SELIC: <strong>${D.selic}%</strong> · IPCA 12m: <strong>${D.ipca12.toFixed(2)}%</strong>`;

    scheduleAutoSave();
    renderIndicadores();
    if (window._firestoreSave) window._firestoreSave(false);

  } catch(e) {
    console.error('BCB fetch error:', e);
    if (stat) stat.innerHTML = `❌ Erro ao buscar dados: ${e.message}. Verifique sua conexão ou atualize manualmente.`;
    if (stat) stat.style.color = 'var(--neg)';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Atualizar agora'; }
  }
}

// ── MOTOR DE INTELIGÊNCIA ARCA ────────────────────

// ── PERFIL DE INVESTIDOR ─────────────────────────
function calcPerfilInvestidor() {
  const pl = patrimonioLiquido();
  const ativos = pl.ativos;
  const entrada = totalEMes(0);
  const caixa = caixaAtual();
  const metaE = metaEmergencia();
  const pctEmerg = metaE > 0 ? caixa / metaE : 0;
  const totInv = D.meses.reduce((s,_,i)=>s+invDisp(i),0);

  // Composição atual da carteira
  const tot = D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const pctRV = tot > 0
    ? D.ativos.filter(a=>a.bucket==='A'||a.bucket==='R'||a.bucket==='A2').reduce((s,a)=>s+(a.valor||0),0) / tot
    : 0;
  const pctRF = tot > 0
    ? D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0) / tot
    : 0;

  // Score de risco (0-100)
  let risco = 0;
  // Exposição a renda variável
  risco += pctRV * 40; // até 40pts por % em RV
  // Reserva de emergência (mais reserva = mais conservador)
  risco += (1 - Math.min(1, pctEmerg)) * 15; // menos reserva = mais arrojado
  // Patrimônio vs renda anual
  const patMeses = entrada > 0 ? ativos / (entrada * 12) : 0;
  risco += Math.min(20, patMeses * 5); // mais patrimônio relativo = mais arrojado
  // Score financeiro geral
  const score = scoreFinanceiro();
  risco += (score / 100) * 25; // score alto = capacidade de arriscar

  let perfil, perfilDesc, perfilIcon, perfilCor, perfilAloc;

  if (risco < 33) {
    perfil = 'conservador';
    perfilIcon = '🛡️';
    perfilCor = '#3B82F6';
    perfilDesc = 'Você prioriza segurança e liquidez. Prefere renda fixa mesmo com retornos menores.';
    perfilAloc = {
      juros_altos:    { a: 5,  r: 10, c: 70, a2: 15 },
      juros_elevados: { a: 5,  r: 10, c: 70, a2: 15 },
      juros_moderados:{ a: 10, r: 15, c: 60, a2: 15 },
      juros_baixos:   { a: 15, r: 20, c: 50, a2: 15 },
    };
    perfilInv = [
      { tipo:'Tesouro Selic', desc:'Liquidez diária e proteção, rendimento = SELIC', bucket:'C', risco:'Baixo' },
      { tipo:'CDB 100%+ CDI', desc:'Bancos médios com garantia do FGC até R$250k', bucket:'C', risco:'Baixo' },
      { tipo:'LCI/LCA',       desc:'Isentos de IR, boa opção para perfil conservador', bucket:'C', risco:'Baixo' },
      { tipo:'Tesouro IPCA+', desc:'Proteção contra inflação no longo prazo', bucket:'C', risco:'Baixo' },
      { tipo:'FII de papel',  desc:'Exposição imobiliária com mais previsibilidade', bucket:'R', risco:'Médio' },
    ];
  } else if (risco < 66) {
    perfil = 'moderado';
    perfilIcon = '⚖️';
    perfilCor = '#F59E0B';
    perfilDesc = 'Você busca equilíbrio entre segurança e crescimento, aceitando riscos moderados.';
    perfilAloc = {
      juros_altos:    { a: 15, r: 20, c: 45, a2: 20 },
      juros_elevados: { a: 20, r: 25, c: 35, a2: 20 },
      juros_moderados:{ a: 28, r: 28, c: 25, a2: 19 },
      juros_baixos:   { a: 30, r: 30, c: 20, a2: 20 },
    };
    perfilInv = [
      { tipo:'Tesouro Selic/IPCA+', desc:'Base da carteira — liquidez e proteção', bucket:'C', risco:'Baixo' },
      { tipo:'FII diversificado',   desc:'FIIs de tijolo e papel para renda passiva', bucket:'R', risco:'Médio' },
      { tipo:'ETF BOVA11',          desc:'Exposição ao Ibovespa com baixo custo', bucket:'A', risco:'Médio' },
      { tipo:'IVVB11',              desc:'S&P 500 em reais — diversificação internacional', bucket:'A2', risco:'Médio' },
      { tipo:'Ações dividendos',    desc:'Empresas sólidas com histórico de dividendos', bucket:'A', risco:'Médio' },
    ];
  } else {
    perfil = 'arrojado';
    perfilIcon = '🚀';
    perfilCor = '#10B981';
    perfilDesc = 'Você foca no longo prazo e aceita alta volatilidade em busca de retornos expressivos.';
    perfilAloc = {
      juros_altos:    { a: 20, r: 25, c: 30, a2: 25 },
      juros_elevados: { a: 25, r: 28, c: 22, a2: 25 },
      juros_moderados:{ a: 35, r: 30, c: 15, a2: 20 },
      juros_baixos:   { a: 40, r: 32, c: 10, a2: 18 },
    };
    perfilInv = [
      { tipo:'Small Caps BR',  desc:'Empresas menores com alto potencial de crescimento', bucket:'A', risco:'Alto' },
      { tipo:'FII de tijolo',  desc:'Shoppings, galpões, lajes — valorização + renda', bucket:'R', risco:'Médio' },
      { tipo:'IVVB11/BDRs',    desc:'Exposição a empresas tech globais em reais', bucket:'A2', risco:'Alto' },
      { tipo:'ETF temático',   desc:'Setores específicos: tecnologia, energia, saúde', bucket:'A2', risco:'Alto' },
      { tipo:'Ações crescimento',desc:'Empresas em expansão com foco em longo prazo', bucket:'A', risco:'Alto' },
    ];
  }

  return { perfil, perfilIcon, perfilCor, perfilDesc, perfilAloc, perfilInv, risco: Math.round(risco) };
}

let _perfilInv = []; // usado por renderArca
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

  // Perfil do investidor
  const perf = calcPerfilInvestidor();
  _perfilInv = perf.perfilInv;

  // Recomendações ARCA: ciclo de juros + perfil do investidor
  let rec, rationale, alertas = [];
  // Base pelo ciclo, ajustada pelo perfil
  const recBase = perf.perfilAloc[ciclo] || perf.perfilAloc['juros_altos'];
  alertas.push({ tipo:'info', txt:`Perfil detectado: ${perf.perfilIcon} <strong>${perf.perfil.charAt(0).toUpperCase()+perf.perfil.slice(1)}</strong> — ${perf.perfilDesc}` });
  if (ciclo === 'juros_altos') {
    rec = recBase;
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
    rec = recBase;
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
    rec = recBase;
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
    rec = recBase;
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
  // Saldo e meta CC
  const elSaldo=document.getElementById('ef-saldo');if(elSaldo)D.saldo=parseFloat(elSaldo.value)||0;
  const elMeta=document.getElementById('ef-metaCC');if(elMeta)D.metaCC=parseFloat(elMeta.value)||2000;
  // Indicadores — lê todos do DOM, mesmo que estejam em sub-aba oculta
  const indicFields={
    cdi12:'ef-cdi12', cdifev:'ef-cdifev', cdi26:'ef-cdi26',
    ipca12:'ef-ipca12', ipcafev:'ef-ipcafev', ipca26:'ef-ipca26',
    selic:'ef-selic'
  };
  Object.entries(indicFields).forEach(([k,id])=>{
    const el=document.getElementById(id);
    if(el&&el.value!=='') D[k]=parseFloat(el.value)||0;
  });
  // Metas ARCA
  const arcaMap={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaMap).forEach(([id,k])=>{
    const el=document.getElementById(id);
    if(el&&el.value!=='') D.arcaMeta[k]=parseFloat(el.value)||0;
  });
}

function saveData(){
  collectFormFields();
  if(window._firestoreSave) window._firestoreSave(true);
  renderAll();
}

// ── INIT ──────────────────────────────────────────
applyTheme();