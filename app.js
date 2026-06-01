
// ── ANIMATED NUMBERS ─────────────────────────────
function animateValue(el, from, to, duration=600) {
  if(!el) return;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease out cubic
    const current = from + (to - from) * ease;
    el.textContent = fmt(current);
    if(progress < 1) requestAnimationFrame(update);
    else el.textContent = fmt(to);
  };
  requestAnimationFrame(update);
}

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
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000, diaCorte:20,
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
let mesRefIdx = -1;    // -1 = automático (calculado por getMesRefIdx)

// ── MÊS DE REFERÊNCIA ─────────────────────────────
// Retorna o índice do mês de referência:
// - Se mesRefIdx foi definido manualmente pelo usuário, usa ele
// - Caso contrário: usa mês atual, após dia 20 avança para o próximo
function getMesRefIdx() {
  if(mesRefIdx >= 0 && mesRefIdx < nm()) return mesRefIdx;
  return calcMesRefAuto();
}
function calcMesRefAuto() {
  const hoje = new Date();
  const m = hoje.getMonth()+1, y = hoje.getFullYear(), dia = hoje.getDate();
  let idx = D.meses.findIndex(ms=>{const p=parseMes(ms);return p.m===m&&p.y===y;});
  if(idx===-1) idx=0;
  // Após dia 20, avança para o próximo mês
  const diaCorte = D.diaCorte || 20;
  if(dia>=diaCorte && idx<nm()-1) idx++;
  return idx;
}
function setMesRef(idx) {
  mesRefIdx = parseInt(idx);
  // Salva no D para persistência
  D.mesRefIdx = mesRefIdx;
  scheduleAutoSave();
  renderCarteira();
  renderAll();
}
function resetMesRefAuto() {
  mesRefIdx = -1;
  D.mesRefIdx = -1;
  scheduleAutoSave();
  renderCarteira();
  renderAll();
}
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
  // Restaura mês de referência salvo
  if(d.mesRefIdx !== undefined) { mesRefIdx = d.mesRefIdx; }
  if(!d.compras)    d.compras    = [];
  if(!d.cartoes)    d.cartoes    = [];
  if(!d.ativos)     d.ativos     = [];
  if(!d.arcaMeta)   d.arcaMeta   = {a:25,r:25,c:25,a2:25};
  if(!d.metaCC)     d.metaCC     = 2000;
  if(!d.meses)      d.meses      = [...BLANK.meses];
  if(!d.pagamentos) d.pagamentos = {};
  if(!d.invManual)  d.invManual  = Array(d.meses.length).fill(null);
  if(!d.diaCorte)   d.diaCorte   = 20;
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
      // Suporta "Jun" (novo) e "Jun/26" (legado)
      const mesAbrevU = e.mes.includes('/') ? e.mes.split('/')[0] : e.mes;
      const mesNumU = MMAP[mesAbrevU] || 0;
      // Para único: aparece apenas no mês do ano correto se tiver ano, ou em qualquer mês com esse número
      if(e.mes.includes('/')) {
        // Legado com ano — restringe ao ano específico
        const em = parseMes(e.mes);
        return em.m===m && em.y===y ? s+(e.valor||0) : s;
      }
      // Novo formato: só mês — aparece em todos os anos (mesmo comportamento do anual)
      return mesNumU===m ? s+(e.valor||0) : s;
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
  const mes = D.meses[mi];
  if(!mes) return 0;
  const {m, y} = parseMes(mes);
  return (D.fixas||[]).reduce((s,f) => {
    if(!f.ativo) return s;
    // Sem período definido = sempre ativa
    if(!f.mesInicio && !f.mesFim) return s+(f.valor||0);
    // Verifica se o mês está dentro do período
    const desde = f.mesInicio ? parseMes(f.mesInicio) : null;
    const ate   = f.mesFim   ? parseMes(f.mesFim)    : null;
    const anosM  = y*12+m;
    const anosI  = desde ? desde.y*12+desde.m : -Infinity;
    const anosF  = ate   ? ate.y*12+ate.m     :  Infinity;
    return (anosM >= anosI && anosM <= anosF) ? s+(f.valor||0) : s;
  }, 0);
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

  // Fixas — respeita período (mesInicio/mesFim) igual ao renderFaturas
  const {m:mesM, y:mesY} = parseMes(mes);
  const anosM = mesY*12+mesM;
  D.fixas.filter(f=>{
    if(!f.ativo||(f.valor||0)<=0) return false;
    if(!f.mesInicio&&!f.mesFim) return true; // permanente
    const desde = f.mesInicio ? parseMes(f.mesInicio) : null;
    const ate   = f.mesFim    ? parseMes(f.mesFim)    : null;
    return anosM>=(desde?desde.y*12+desde.m:-Infinity) && anosM<=(ate?ate.y*12+ate.m:Infinity);
  }).forEach(f=>{
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

const sobraM = (mi) => totalEMes(mi) - calcPendenteMes(mi).pendente;
const nm = () => D.meses.length;
const getLim = d => { const c=D.cartoes.find(x=>x.nome===d.cartao); return c?c.limite:0; };

function calcInvest(i) {
  const e=totalEMes(i), c=calcPendenteMes(i).pendente, meta=D.metaCC||2000, sobra=e-c;
  if(sobra<=0)   return {e,c,meta,saldo:0,sobra,regra:'negativo'};
  if(sobra<meta) return {e,c,meta,saldo:sobra*0.5,sobra,regra:'menor_meta'};
  return              {e,c,meta,saldo:sobra-meta,sobra,regra:'maior_meta'};
}
const invDispCalc = i => calcInvest(i).saldo;
function invDisp(i) {
  if(!D.invManual) D.invManual=Array(nm()).fill(null);
  const m=D.invManual[i];
  if(m==='skip') return 0; // linha removida pelo usuário
  return (m!==null&&m!==undefined&&!isNaN(m))?m:invDispCalc(i);
}
function isSkipped(i) { return D.invManual&&D.invManual[i]==='skip'; }
function skipMes(i) {
  if(!D.invManual) D.invManual=Array(nm()).fill(null);
  D.invManual[i]='skip';
  scheduleAutoSave(); renderInvestVisao();
}
function unskipMes(i) {
  if(!D.invManual) D.invManual=Array(nm()).fill(null);
  D.invManual[i]=null;
  scheduleAutoSave(); renderInvestVisao();
}
function isManual(i) { if(!D.invManual)return false; const v=D.invManual[i]; return v!==null&&v!==undefined&&v!=='X'&&!isNaN(v); }
function resetManual(i) { if(!D.invManual)D.invManual=Array(nm()).fill(null); D.invManual[i]=null; scheduleAutoSave(); renderInvestVisao(); }
function setManual(i,val) { if(!D.invManual)D.invManual=Array(nm()).fill(null); D.invManual[i]=(val===''||val===null)?null:(parseFloat(val)||0); scheduleAutoSave(); renderAll(); }

function excluirMesInvest(i) {
  if(!D.invManual) D.invManual = Array(nm()).fill(null);
  // Marca como "excluído" com valor especial -1
  D.invManual[i] = 'X';
  scheduleAutoSave();
  renderInvestVisao();
}
function restaurarMesInvest(i) {
  if(!D.invManual) D.invManual = Array(nm()).fill(null);
  D.invManual[i] = null;
  scheduleAutoSave();
  renderInvestVisao();
}
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
  score+=Math.min(20,ativos>0?Math.min(20,Math.round((ativos/(totalEMes(getMesRefIdx())*12||1))*20)):0);
  return Math.min(100,score);
}
function caixaAtual()     { return D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0); }
// Custo fixo base = soma de TODAS as fixas ativas, independente de período
// É o custo de vida permanente — base para a reserva de emergência
function custoFixoMes()   { return (D.fixas||[]).filter(f=>f.ativo&&(f.valor||0)>0).reduce((s,f)=>s+(f.valor||0),0); }
function metaEmergencia() { return custoFixoMes()*(D.reservaMult||6); }
function arcaBloqueado()  { return caixaAtual()<metaEmergencia(); }

// Retorna o status da reserva de emergência
function statusReserva() {
  const caixa = caixaAtual();
  const meta  = metaEmergencia();
  const pct   = meta>0 ? Math.min(100, Math.round((caixa/meta)*100)) : 100;
  const falta = Math.max(0, meta-caixa);
  const fase  = caixa >= meta ? 'completa' : pct >= 50 ? 'em_progresso' : 'inicio';
  return { caixa, meta, pct, falta, fase, bloqueado: caixa < meta };
}

// Calcula como distribuir o disponível para investir neste mês
// Fase 1 (reserva incompleta): 100% vai para Caixa
// Fase 2 (reserva completa): distribui pelo ARCA, mas Caixa sempre recebe aporte mínimo
function calcDistribuicaoInvest(valorDisp) {
  const reserva = statusReserva();
  if(valorDisp <= 0) return null;

  if(reserva.bloqueado) {
    // FASE 1: Tudo para caixa — construindo reserva de emergência
    return {
      fase: 1,
      total: valorDisp,
      distribuicao: [
        { bucket:'C', label:'Caixa (Reserva)', valor:valorDisp, pct:100,
          cor:'#6B7280', desc:'100% para reserva de emergência até atingir '+fmt(reserva.meta) }
      ]
    };
  }

  // FASE 2: Reserva completa — distribui pelo ARCA
  // Caixa continua recebendo aporte (reserva é intocável, só cresce)
  const intel = calcARCAIntelligence();
  const rec = intel.rec;
  const buckets = [
    { bucket:'A',  label:'Ações BR',      pct:rec.a,  cor:ARCA.colors.A  },
    { bucket:'R',  label:'Real Estate',   pct:rec.r,  cor:ARCA.colors.R  },
    { bucket:'C',  label:'Caixa',         pct:rec.c,  cor:ARCA.colors.C  },
    { bucket:'A2', label:'Internacional', pct:rec.a2, cor:ARCA.colors.A2 },
  ];
  return {
    fase: 2,
    total: valorDisp,
    distribuicao: buckets.map(b=>({
      ...b,
      valor: Math.round(valorDisp*(b.pct/100)*100)/100,
      desc: ARCA.desc[b.bucket]||''
    }))
  };
}
function taxaAnual(a) { const base=a.indice==='SELIC'?(D.cdi12||14.80):a.indice==='IPCA'?(D.ipca12||4.14):(D.cdi12||14.80); return (base*(a.pct||100)/100)/100; }
function projetar(v,r,n){ return v*Math.pow(1+r,n); }
function getYears() { const s=new Set(); D.meses.forEach(m=>{const p=m.match(/\/(\d+)/);if(p)s.add('20'+p[1]);}); return [...s].sort(); }
function getMesesAno(yr) { return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes('/'+yr.slice(2))); }
function genId(prefix) { return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

// ── MESES ATIVOS ──────────────────────────────────
// Retorna meses de 0 até o último que tem dado lançado
function getActiveMeses() {
  let last = 0;
  for(let i=0; i<nm(); i++) {
    const temFixa = (D.fixas||[]).some(f=>f.ativo&&(f.valor||0)>0);
    const temCompra = (D.compras||[]).some(c=>c.ativo&&(calcValsCompra(c)[i]||0)>0);
    const temEntrada = totalEMes(i) > 0;
    if(temFixa || temCompra || temEntrada) last = i;
  }
  return D.meses.slice(0, last + 1);
}
function isExcluido(i) {
  return D.invManual && D.invManual[i] === 'X';
}

// ── PAGAMENTOS ────────────────────────────────────

// Verifica se o mês mi de uma compra já foi pago em Faturas
// Usa a mesma lógica de ID que renderFaturas usa ao agrupar
function isParcelaPaga(compra, mi) {
  if(!D.pagamentos) return false;
  const mes = D.meses[mi];
  if(!mes) return false;
  const pag = D.pagamentos[mes] || {};
  if(compra.cartao) {
    // Fatura de cartão — ID do grupo
    const id = 'cc_' + compra.cartao.replace(/\s/g,'_') + '_' + mi;
    return !!pag[id];
  } else {
    // Sem cartão — item individual (sc_idx_mi)
    // Procura qualquer chave sc_*_mi que bata com esse item
    return Object.keys(pag).some(k => k.endsWith('_'+mi) && k.startsWith('sc_'));
  }
}
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
  _saveTimer = setTimeout(() => {
    collectFormFields(); // garante que campos do DOM estejam em D antes de salvar
    if (window._firestoreSave) window._firestoreSave(false);
  }, 1500);
}

// ── ROTEAMENTO ────────────────────────────────────
// ── NAVIGATION & SIDEBAR ────────────────────────
const PAGE_META = {
  dash:      { label:'Dashboard',       section:'Análise',    icon:'📊' },
  invest:    { label:'Investimentos',   section:'Análise',    icon:'📈' },
  relatorio: { label:'Relatório',       section:'Análise',    icon:'📋' },
  entradas:  { label:'Entradas',        section:'Finanças',   icon:'💰' },
  carteira:  { label:'Carteira',        section:'Finanças',   icon:'💼' },
  saidas:    { label:'Saídas',          section:'Finanças',   icon:'💸' },
  faturas:   { label:'Faturas',         section:'Finanças',   icon:'✅' },
  metas:     { label:'Metas',           section:'Planejamento',icon:'🎯' },
  perfil:    { label:'Meu Perfil',      section:'Pessoal',    icon:'👤' },
  admin:     { label:'Usuários',        section:'Sistema',    icon:'👥' },
  config:    { label:'Configurações',   section:'Sistema',    icon:'⚙️' },
  cats:      { label:'Categorias',      section:'Sistema',    icon:'🏷️' },
  params:    { label:'Parâmetros',      section:'Sistema',    icon:'🔧' },
};

let _currentRole = 'user'; // perfil ativo ('user' ou 'superadmin')

function go(id, el) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.snav').forEach(t=>t.classList.remove('on'));
  const pg=document.getElementById('page-'+id); if(pg) pg.classList.add('on');
  const sn=document.getElementById('snav-'+id); if(sn) sn.classList.add('on');
  // Update nav breadcrumb
  const meta=PAGE_META[id]||{};
  const bc=document.getElementById('nav-breadcrumb');
  if(bc) bc.textContent=`/ ${meta.section||''} / ${meta.label||id}`;
  renderPage(id);
}

function goSide(id) {
  go(id, null);
  closeSidebar();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
}

function toggleProfileDropdown() {
  const dd=document.getElementById('profile-dropdown');
  dd.classList.toggle('show');
}
function closeProfileDropdown() {
  const dd=document.getElementById('profile-dropdown');
  if(dd) dd.classList.remove('show');
}

// Close dropdown on outside click
document.addEventListener('click', e=>{
  const trigger=document.getElementById('profile-trigger');
  const dd=document.getElementById('profile-dropdown');
  if(dd&&trigger&&!trigger.contains(e.target)) closeProfileDropdown();
  // Close sidebar on outside click (mobile)
  const sidebar=document.getElementById('sidebar');
  const toggle=document.getElementById('nav-toggle');
  if(sidebar&&sidebar.classList.contains('open')&&!sidebar.contains(e.target)&&toggle&&!toggle.contains(e.target)){
    closeSidebar();
  }
});

// Role switching (admin can view as user)
function switchRole(role) {
  _currentRole = role;
  closeProfileDropdown();
  const adminSection=document.getElementById('sidebar-admin-section');
  const mmAdmin=document.getElementById('snav-admin');
  const mmConfig=document.getElementById('snav-config');
  const isAdmin = role==='superadmin';
  if(adminSection) adminSection.style.display = isAdmin?'':'none';
  if(mmAdmin) mmAdmin.style.display = isAdmin?'':'none';
  if(mmConfig) mmConfig.style.display = isAdmin?'':'none';
  // Update badge
  const badge=document.getElementById('nav-role-badge');
  if(badge){
    badge.textContent=isAdmin?'Admin':'User';
    badge.style.background=isAdmin?'var(--accent)':'var(--card3)';
    badge.style.color=isAdmin?'#fff':'var(--text2)';
  }
  // Update role switch buttons
  document.getElementById('pd-switch-admin')?.classList.toggle('on', role==='superadmin');
  document.getElementById('pd-switch-user')?.classList.toggle('on', role==='user');
  // If currently on admin/config page and switched to user, go to dash
  const active=document.querySelector('.page.on');
  const activeId=active?active.id.replace('page-',''):'dash';
  if(!isAdmin&&(activeId==='admin'||activeId==='config')) goSide('dash');
}

function renderPage(id) {
  if(id==='dash')       renderDashboard();
  else if(id==='entradas') renderEntradas();
  else if(id==='carteira') renderCarteira();
  else if(id==='saidas')   renderSaidas();
  else if(id==='invest')   renderInvestAtiva();
  else if(id==='faturas')  renderFaturas();
  else if(id==='metas')    renderMetas();
  else if(id==='relatorio') renderRelatorio();
  else if(id==='cats')     renderAdminCategorias();
  else if(id==='params')   renderAdminParams();
  else if(id==='perfil')   { if(window._renderPerfil) window._renderPerfil(); }
  else if(id==='admin')    { if(window._renderAdmin)  window._renderAdmin(); }
  else if(id==='config')   renderConfig();
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
  // ── Dados do mês atual ──
  const mi = getMesRefIdx();

  const entrada   = totalEMes(getMesRefIdx());
  const saida     = calcPendenteMes(getMesRefIdx()).bruto;
  const sobra     = sobraM(getMesRefIdx());
  const investir  = invDisp(getMesRefIdx());
  const pl        = patrimonioLiquido();
  const score     = scoreFinanceiro();
  const caixa     = caixaAtual();
  const metaE     = metaEmergencia();
  const pctEmerg  = metaE > 0 ? Math.min(100, Math.round((caixa / metaE) * 100)) : 0;
  const scoreCor  = score>=70 ? '#10B981' : score>=40 ? '#F59E0B' : '#EF4444';
  const scoreLabel= score>=70 ? 'Ótimo' : score>=40 ? 'Regular' : 'Atenção';
  const ativos    = D.meses.length;
  const n         = getActiveMeses().length;

  // ── Alertas de configuração ──
  const alerts = getEmptyStateAlerts();
  const alertEl = document.getElementById('dash-alerts');
  if(alertEl) alertEl.innerHTML = alerts.length ? `
    <div style="background:var(--warn-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--r12);padding:14px 16px;margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:var(--warn);margin-bottom:8px">⚠️ Configure seu perfil financeiro</div>
      ${alerts.map(a=>`<div style="font-size:12px;color:var(--text2);padding:3px 0;display:flex;align-items:center;gap:8px">${a.icon} ${a.msg}</div>`).join('')}
    </div>` : '';

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
    ${(()=>{const _cp=calcPendenteMes(getMesRefIdx());const _tudoPago=_cp.bruto>0&&_cp.pendente===0;
    return _tudoPago
      ? `<div class="mcard" style="border-color:rgba(16,185,129,.3);background:var(--pos-bg)">
          <div class="mlabel" style="color:var(--pos)">✅ Tudo pago este mês!</div>
          <div class="mval mval-pos" style="font-size:16px">Parabéns!</div>
          <div class="msub">Todas as faturas de ${D.meses[getMesRefIdx()]||''} foram quitadas.</div>
        </div>`
      : `<div class="mcard mcard-teal">
          <div class="mlabel">🚀 Disponível p/ investir</div>
          <div class="mval mval-teal">${fmt(investir)}</div>
          <div class="msub">${investir>0?'Invista agora':'Sem sobra este mês'}</div>
        </div>`;
    })()}`;

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
    pfEl.innerHTML = `
      <div class="divider"><span class="divider-text">📈 Onde você estará no futuro</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:8px">
        ${pf.map((p,i)=>`<div class="mcard ${i===pf.length-1?'mcard-accent':''}">
          <div class="mlabel">${p.yr}</div>
          <div class="mval ${i===pf.length-1?'mval-accent':'mval-teal'}" style="font-size:18px">${fmtK(p.saldo)}</div>
          <div class="msub">aportes: ${fmtK(p.aporte)}</div>
        </div>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--text3)">Projeção estimada com juros compostos. Não garante rentabilidade futura.</div>`;
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
  const i = selDash;
  const e = totalEMes(i);
  const cp = calcPendenteMes(i);
  const inv = invDisp(i);
  const r = calcInvest(i);
  const pl = patrimonioLiquido();
  const tudoPago = cp.bruto > 0 && cp.pendente === 0;
  const mesNome = D.meses[i] || '';
  const isRefMes = i === getMesRefIdx();

  document.getElementById('dash-sec-label').textContent = 'Resumo de ' + mesNome + (isRefMes ? ' (referência)' : '');
  buildMonths('dash-months', i, j => { selDash = j; renderMes(); });

  const mc = document.getElementById('mes-cards');
  if(!mc) return;

  // ── SEÇÃO 1: Visão geral financeira do mês ──
  const sobraLiquida = e - cp.bruto;
  const icon = r.regra === 'negativo' ? '🔴' : r.regra === 'menor_meta' ? '🟡' : '🟢';
  const regrasDesc = { maior_meta: 'Sobra − Meta CC', menor_meta: '50% da sobra', negativo: 'Contas > Entradas' };

  mc.innerHTML = `
    <!-- Entradas -->
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas em ${mesNome}</div>
      <div class="mval mval-pos">${fmt(e)}</div>
      <div class="msub">${D.entradas.filter(e=>e.ativo).length} fonte(s) · salário e outros</div>
    </div>

    <!-- Total faturas -->
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Total de faturas</div>
      <div class="mval mval-neg">${fmt(cp.bruto)}</div>
      <div class="msub">${pct(cp.bruto, e)} da renda · fixas + variáveis</div>
    </div>

    ${tudoPago
      ? `<!-- Tudo pago: sem sobra, mostra patrimônio -->
        <div class="mcard" style="border-color:rgba(16,185,129,.3);background:var(--pos-bg)">
          <div class="mlabel" style="color:var(--pos)">✅ Todas as faturas pagas!</div>
          <div class="mval mval-pos" style="font-size:16px">${fmt(cp.pago)} pagos</div>
          <div class="msub">Mês quitado · Parabéns! 🎉</div>
        </div>`
      : `<!-- Pendente -->
        <div class="mcard mcard-warn">
          <div class="mlabel">⏳ Ainda pendente</div>
          <div class="mval mval-warn">${fmt(cp.pendente)}</div>
          <div class="msub">Pago: ${fmt(cp.pago)} · ${pct(cp.pago, cp.bruto)}</div>
        </div>

        <!-- Disponível para investir -->
        <div class="mcard mcard-teal" style="border-color:rgba(6,182,212,.3)">
          <div class="mlabel">${icon} Disponível p/ investir</div>
          <div class="mval mval-teal">${fmt(inv)}</div>
          <div class="msub">${regrasDesc[r.regra]}</div>
        </div>`
    }

    <!-- Patrimônio líquido -->
    <div class="mcard mcard-accent">
      <div class="mlabel">💎 Patrimônio líquido</div>
      <div class="mval ${pl.liquido >= 0 ? 'mval-accent' : 'mval-neg'}">${fmt(pl.liquido)}</div>
      <div class="msub">Ativos ${fmt(pl.ativos)}</div>
    </div>
  `;

  // ── SEÇÃO 2: Progresso das faturas ──
  const progEl = document.getElementById('mes-progresso');
  if(progEl && cp.bruto > 0) {
    const pctPago = Math.round((cp.pago / cp.bruto) * 100);
    progEl.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:13px">📊 Progresso das faturas em ${mesNome}</span>
          <span style="font-size:13px;font-weight:700;color:${pctPago===100?'var(--pos)':'var(--warn)'}">${pctPago}%</span>
        </div>
        <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden;margin-bottom:10px">
          <div style="height:8px;width:${pctPago}%;background:${pctPago===100?'var(--pos)':'var(--accent)'};border-radius:99px;transition:width .5s"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2)">
          <span>✅ Pago: <strong style="color:var(--pos)">${fmt(cp.pago)}</strong></span>
          <span>⏳ Pendente: <strong style="color:var(--warn)">${fmt(cp.pendente)}</strong></span>
          <span>💸 Total: <strong>${fmt(cp.bruto)}</strong></span>
        </div>
        <div style="margin-top:10px;text-align:center">
          <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="go('faturas',document.querySelectorAll('.ntab')[5])">
            📋 Ver faturas detalhadas →
          </button>
        </div>
      </div>`;
  } else if(progEl) progEl.innerHTML = '';

  // ── SEÇÃO 3: Gastos por categoria ──
  const cats = {};
  D.fixas.filter(f=>f.ativo).forEach(f=>{ const c=f.cat||'outros'; if(!cats[c])cats[c]={total:0,items:[]}; cats[c].total+=f.valor; cats[c].items.push({nome:f.nome,v:f.valor}); });
  D.compras.filter(c=>c.ativo).forEach(c=>{ const v=calcValsCompra(c)[i]||0; if(!v)return; const cat=c.cat||'outros'; if(!cats[cat])cats[cat]={total:0,items:[]}; cats[cat].total+=v; cats[cat].items.push({nome:c.nome,v}); });
  const cc = document.getElementById('mes-cat-cards');
  if(cc) cc.innerHTML = Object.entries(cats).sort(([,a],[,b])=>b.total-a.total).map(([cat,{total,items}])=>{
    const info = CATS[cat] || CATS.outros;
    return `<div class="mcard" style="border-color:${info.cor}33">
      <div class="mlabel" style="color:${info.cor}">${info.icon} ${info.label}</div>
      <div class="mval tneg" style="font-size:18px">${fmt(total)}</div>
      <div style="font-size:10px;color:var(--text2);margin-top:6px;line-height:1.6">${items.map(x=>`${x.nome}: <strong>${fmt(x.v)}</strong>`).join(' · ')}</div>
    </div>`;
  }).join('');

  renderCartoesTo(document.getElementById('mes-cartoes'), i);

  // ── SEÇÃO 4: Gráficos ──
  dc('cMesBar'); dc('cMesDough');
  const cMB = document.getElementById('cMesBar');
  const atM = getActiveMeses();
  if(cMB) CH['cMesBar'] = new Chart(cMB, {type:'bar', data:{
    labels: atM.map(sM),
    datasets:[
      {label:'Faturas',    data:atM.map(m=>totalDivBruto(D.meses.indexOf(m))), backgroundColor:'rgba(239,68,68,.75)', borderRadius:4},
      {label:'P/Investir', data:atM.map(m=>invDisp(D.meses.indexOf(m))),       backgroundColor:'rgba(6,182,212,.75)',  borderRadius:4},
    ]
  }, options:chartOpts()});

  const catTots = {};
  D.fixas.filter(f=>f.ativo).forEach(f=>{ catTots[f.cat||'outros']=(catTots[f.cat||'outros']||0)+f.valor; });
  D.compras.filter(c=>c.ativo).forEach(c=>{ const v=calcValsCompra(c)[i]||0; if(v) catTots[c.cat||'outros']=(catTots[c.cat||'outros']||0)+v; });
  const cMD = document.getElementById('cMesDough');
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
    if(e.tipo==='unico'){
      // e.mes pode ser "Jun" (novo) ou "Jun/26" (legado)
      const mesAbrev=e.mes&&e.mes.includes('/')?e.mes.split('/')[0]:e.mes;
      const mn=MMAP[mesAbrev]||0;
      const {m}=parseMes(selEntradas);
      return mn===m;
    }
    return false;
  });

  // Resumo
  const totalMes = selEntradas
    ? (() => { const mi=D.meses.indexOf(selEntradas); return mi>=0?totalEMes(mi):0; })()
    : totalEMes(getMesRefIdx());
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
    const visivel=!selEntradas||(e.tipo==='mensal')
      ||(e.tipo==='anual'&&(()=>{const mn=MMAP[e.mes]||0;const{m}=parseMes(selEntradas);return mn===m;})())
      ||(e.tipo==='unico'&&(()=>{
          const mesAbrev=e.mes&&e.mes.includes('/')?e.mes.split('/')[0]:e.mes;
          const mn=MMAP[mesAbrev]||0;const{m}=parseMes(selEntradas);return mn===m;
        })());
    if(!visivel) return '';
    const MNAMES={'Jan':'Janeiro','Fev':'Fevereiro','Mar':'Março','Abr':'Abril','Mai':'Maio','Jun':'Junho','Jul':'Julho','Ago':'Agosto','Set':'Setembro','Out':'Outubro','Nov':'Novembro','Dez':'Dezembro'};
    const mesInfo=e.tipo!=='mensal'&&e.mes?(e.tipo==='anual'?` · todo ${MNAMES[e.mes]||e.mes}`:` · ${MNAMES[e.mes]||e.mes}`):'';;
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
  toast('Entrada salva!', true, '💰');
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

    // Total aberto = soma de TODAS as parcelas futuras e pendentes (não pagas)
    // Descontamos as faturas que já foram pagas em cada mês
    let totalAberto = 0;
    D.compras.filter(c=>c.ativo&&c.cartao===nomeCartao).forEach(c=>{
      calcValsCompra(c).forEach((v,mi)=>{
        if(!v) return;
        // Só conta se não estiver pago
        if(!isParcelaPaga({cartao:nomeCartao}, mi)) totalAberto+=v;
      });
    });

    const pctUsado = lim>0?Math.min(100,Math.round((totalAberto/lim)*100)):null;
    const barCor = pctUsado===null?'#6B7280':pctUsado>=80?'#EF4444':pctUsado>=50?'#F59E0B':'#10B981';
    const cardCls = pctUsado!==null&&pctUsado>=80?'alert-card':pctUsado!==null&&pctUsado>=50?'warn-card':'';

    // Fatura deste mês — quanto ainda está pendente
    const fatMesId = 'cc_'+nomeCartao.replace(/\s/g,'_')+'_'+i;
    const mesPag = D.pagamentos?.[D.meses[i]]||{};
    const mesPago = !!mesPag[fatMesId];

    return `<div class="cc-card ${cardCls}">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${cor};border-radius:var(--r16) var(--r16) 0 0"></div>
      <div class="cc-name" style="margin-top:8px"><span style="font-size:18px">💳</span> ${nomeCartao} ${mesPago?'<span style="font-size:11px;color:var(--pos)">✅ pago</span>':''}</div>
      <div class="cc-amounts">
        <div class="cc-amounts-left">
          <div class="lbl">Fatura ${D.meses[i]||''}</div>
          <div class="val" style="${mesPago?'text-decoration:line-through;color:var(--text2)':''}">${fmt(totalMes)}</div>
        </div>
        ${lim>0?`<div class="cc-amounts-right"><div class="lbl">Limite livre</div><div class="val" style="color:var(--pos)">${fmt(Math.max(0,lim-totalAberto))}</div></div>`:''}
      </div>
      ${lim>0?`<div class="cc-bar"><div class="cc-bar-fill" style="width:${pctUsado}%;background:${barCor}"></div></div>
      <div class="cc-meta"><span>Em aberto: <strong>${fmt(totalAberto)}</strong></span><span>Limite: <strong>${fmt(lim)}</strong> · <strong style="color:${barCor}">${pctUsado}%</strong></span></div>`:''}
      <div class="cc-parcelas">${itens.map(c=>`<span class="cc-chip-sml">${c.nome}: ${fmtK(calcValsCompra(c)[i])}</span>`).join('')}</div>
    </div>`;
  }).join('');
}

// ── CARTEIRA ──────────────────────────────────────
function renderCarteira() {
  const el=document.getElementById('ef-saldo');if(el)el.value=D.saldo||0;
  const mc=document.getElementById('ef-metaCC');if(mc)mc.value=D.metaCC||2000;
  const dc=document.getElementById('ef-diacorte');if(dc)dc.value=D.diaCorte||20;

  // Mês de referência
  const refIdx = getMesRefIdx();
  const isAuto = mesRefIdx < 0;
  const autoIdx = calcMesRefAuto();
  const mesRefEl = document.getElementById('carteira-mes-ref');
  if(mesRefEl) {
    mesRefEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 16px;background:var(--card2);border-radius:var(--r12);border:1px solid ${!isAuto?'var(--accent)':'var(--border)'}">
        <span style="font-size:12px;font-weight:600;color:var(--text2)">📅 Mês de referência</span>
        <select onchange="setMesRef(this.value)" style="flex:1;max-width:160px;padding:7px 10px;font-size:13px;font-weight:600;${!isAuto?'border-color:var(--accent);color:var(--accent)':''}">
          ${D.meses.map((m,i)=>`<option value="${i}"${i===refIdx?' selected':''}>${m}${i===autoIdx?' ← hoje':''}</option>`).join('')}
        </select>
        ${!isAuto?`<button class="btn btn-ghost" style="height:32px;font-size:11px" onclick="resetMesRefAuto()">↺ Automático</button>`:''}
        <span style="font-size:11px;color:var(--text3)">${isAuto?`🔄 Avança automaticamente no dia ${D.diaCorte||20}`:'✏️ Definido manualmente'}</span>
      </div>`;
  }


  const pl=patrimonioLiquido();
  const totalLim=D.cartoes.reduce((s,c)=>s+(c.limite||0),0);
  const score=scoreFinanceiro();
  const scoreCor=score>=70?'#10B981':score>=40?'#F59E0B':'#EF4444';
  const e0=totalEMes(getMesRefIdx());

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

  const hoje = getMesRefIdx();

  el.innerHTML=D.fixas.map((f,fi)=>{
    const info=CATS[f.cat]||CATS.outros;
    const temPeriodo = !!(f.mesInicio||f.mesFim);

    // Calcula total real respeitando o período
    const totalReal = D.meses.reduce((s,_,i)=>s+totalFixasMes(i)*0+((()=>{
      const {m,y}=parseMes(D.meses[i]);
      const anosM=y*12+m;
      const desde=f.mesInicio?parseMes(f.mesInicio):null;
      const ate=f.mesFim?parseMes(f.mesFim):null;
      const anosI=desde?desde.y*12+desde.m:-Infinity;
      const anosF=ate?ate.y*12+ate.m:Infinity;
      return (f.ativo&&anosM>=anosI&&anosM<=anosF)?f.valor:0;
    })()),0);

    // Período legível
    const periodoStr = temPeriodo
      ? `${f.mesInicio||'início'} → ${f.mesFim||'sem fim'}`
      : 'todo mês, sempre';

    // Verifica se está ativa no mês de referência
    const ativaAgora = (()=>{
      if(!temPeriodo) return f.ativo;
      const mesRef = D.meses[hoje];if(!mesRef)return f.ativo;
      const {m,y}=parseMes(mesRef);const anosM=y*12+m;
      const desde=f.mesInicio?parseMes(f.mesInicio):null;
      const ate=f.mesFim?parseMes(f.mesFim):null;
      return f.ativo&&anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
    })();

    const mesesAtivos = temPeriodo ? D.meses.filter(m=>{
      const {m:mm,y}=parseMes(m);const anosM=y*12+mm;
      const desde=f.mesInicio?parseMes(f.mesInicio):null;
      const ate=f.mesFim?parseMes(f.mesFim):null;
      return anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
    }).length : nm();

    return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid ${temPeriodo?'rgba(245,158,11,.2)':'var(--border)'};border-radius:var(--r12);margin-bottom:8px;${!ativaAgora?'opacity:.55':''}">
      <span style="font-size:22px">${info.icon}</span>
      <div style="flex:1">
        <div style="font-weight:700;font-size:14px">
          ${f.nome}
          <span class="badge badge-fixo">Fixo</span>
          ${temPeriodo?`<span class="badge" style="background:rgba(245,158,11,.15);color:var(--warn)">📅 Com período</span>`:''}
          ${!ativaAgora&&temPeriodo?`<span class="badge" style="background:var(--card3);color:var(--text3)">Inativa</span>`:''}
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${info.label} · ${periodoStr}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:700;color:${ativaAgora?'var(--neg)':'var(--text3)'}">${fmt(f.valor)}</div>
        <div style="font-size:10px;color:var(--text2)">${fmtK(totalReal)} total · ${mesesAtivos} meses</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarFixa(${fi})">✏️</button>
        <button class="btn-rm" onclick="removerFixa(${fi})">✕</button>
      </div>
    </div>`;
  }).join('');

  // Totais do mês de referência
  const totRef = totalFixasMes(hoje);
  const totSempre = D.fixas.filter(f=>f.ativo&&!f.mesInicio&&!f.mesFim).reduce((s,f)=>s+(f.valor||0),0);
  document.getElementById('fixas-total').innerHTML=
    `Total fixo mês atual: <strong style="color:var(--neg)">${fmt(totRef)}</strong>`+
    (D.fixas.some(f=>f.mesInicio||f.mesFim)?` · <span style="color:var(--text3);font-size:11px">${fmt(totSempre)}/mês permanentes</span>`:'');
}
let selSaidasMes = ''; // filtro de mês na aba Saídas Variáveis

function renderSaidasVar() {
  const el=document.getElementById('lista-var');if(!el)return;

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
    // Filtra meses onde TODAS as compras com valor naquele mês já foram pagas
    const mesesPendentes = mesesList.filter(m => {
      const mi = D.meses.indexOf(m);
      if(mi < 0) return false;
      // Tem pelo menos uma compra não paga nesse mês
      return D.compras.filter(c=>c.ativo).some(c=>{
        const v = calcValsCompra(c)[mi]||0;
        return v > 0 && !isParcelaPaga(c, mi);
      });
    });
    // Se o mês selecionado ficou sem pendentes, volta para "Todas"
    if(selSaidasMes && !mesesPendentes.includes(selSaidasMes)) selSaidasMes='';
    filtroEl.innerHTML=`<button class="msb${selSaidasMes===''?' on':''}" onclick="selSaidasMes='';renderSaidasVar()">Todas</button>`
      +mesesPendentes.map(m=>`<button class="msb${selSaidasMes===m?' on':''}" onclick="selSaidasMes='${m}';renderSaidasVar()">${sM(m)}</button>`).join('');
  }

  if(!D.compras.length){ el.innerHTML=`<div class="empty"><div class="empty-icon">🔄</div><div class="empty-text">Nenhuma compra/parcela. Clique em + para adicionar.</div></div>`; return; }

  // Filtra compras que tem valor no mês selecionado
  const comprasFiltradas = selSaidasMes
    ? D.compras.filter(c=>{ const mi=D.meses.indexOf(selSaidasMes); return mi>=0 && (calcValsCompra(c)[mi]||0)>0; })
    : D.compras;

  if(!comprasFiltradas.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhuma parcela em ${selSaidasMes}.</div></div>`;
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
      ${c.parcelas>1?`<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:10px">${valsC.map((v,i)=>{
        if(!v) return '';
        const pago=isParcelaPaga(c,i);
        if(pago) return ''; // oculta meses já pagos
        return `<span class="cc-chip-sml" style="${D.meses[i]===selSaidasMes?'background:var(--accent-glow);color:var(--accent);font-weight:700':''}">${sM(D.meses[i])}: ${fmtK(v)}</span>`;
      }).filter(Boolean).join('')}${valsC.some((_,i)=>valsC[i]>0&&isParcelaPaga(c,i))?`<span class="cc-chip-sml" style="background:var(--pos-bg);color:var(--pos)">✅ ${valsC.filter((_,i)=>valsC[i]>0&&isParcelaPaga(c,i)).length} ${valsC.filter((_,i)=>valsC[i]>0&&isParcelaPaga(c,i)).length===1?'mês pago':'meses pagos'}</span>`:''}
      </div>`:''}
    </div>`;
  }).join('');
}

function abrirModalFixa(fi=-1) {
  const f=fi>=0?D.fixas[fi]:{nome:'',cat:'outros',valor:0,ativo:true,mesInicio:'',mesFim:''};
  document.getElementById('modal-fixa-overlay').style.display='flex';
  document.getElementById('mf-nome').value=f.nome;
  document.getElementById('mf-cat').value=f.cat||'outros';
  document.getElementById('mf-valor').value=f.valor||'';
  // Período
  const temPeriodo = !!(f.mesInicio || f.mesFim);
  const mfTipo = document.getElementById('mf-tipo');
  if(mfTipo) mfTipo.value = temPeriodo ? 'periodo' : 'sempre';
  toggleFixaPeriodo();
  const mfIni = document.getElementById('mf-inicio');
  const mfFim = document.getElementById('mf-fim');
  // Popula selects com D.meses
  const opts = D.meses.map(m=>`<option value="${m}">${m}</option>`).join('');
  if(mfIni) { mfIni.innerHTML='<option value="">— início —</option>'+opts; mfIni.value=f.mesInicio||''; }
  if(mfFim) { mfFim.innerHTML='<option value="">— fim —</option>'+opts; mfFim.value=f.mesFim||''; }
  document.getElementById('btn-salvar-fixa').onclick=()=>salvarFixa(fi);
}

function toggleFixaPeriodo() {
  const tipo = document.getElementById('mf-tipo')?.value;
  const periodoFields = document.getElementById('mf-periodo-fields');
  if(periodoFields) periodoFields.style.display = tipo==='periodo' ? '' : 'none';
}

function salvarFixa(fi) {
  const nome=document.getElementById('mf-nome').value.trim();
  const cat=document.getElementById('mf-cat').value;
  const valor=parseFloat(document.getElementById('mf-valor').value)||0;
  const tipo=document.getElementById('mf-tipo').value;
  if(!nome){alert('Informe o nome.');return;}
  const obj={id:fi>=0?D.fixas[fi].id:genId('f'),nome,cat,valor,ativo:true};
  if(tipo==='periodo'){
    obj.mesInicio = document.getElementById('mf-inicio').value || '';
    obj.mesFim    = document.getElementById('mf-fim').value    || '';
  }
  if(fi>=0) D.fixas[fi]=obj; else D.fixas.push(obj);
  document.getElementById('modal-fixa-overlay').style.display='none';
  scheduleAutoSave(); renderSaidasFixas(); renderAll();
  toast('Conta fixa salva!', true, '📌');
}
function editarFixa(fi){abrirModalFixa(fi);}
function removerFixa(fi){if(!confirm(`Remover "${D.fixas[fi].nome}"?`))return;D.fixas.splice(fi,1);scheduleAutoSave();renderSaidasFixas();}

// Estado das parcelas editáveis no modal
let _parcelasVals = []; // valores individuais de cada parcela
let _parcelasCustom = false; // flag: true = valores foram carregados do custom, não redistribuir
let _editandoCI = null; // índice da compra sendo editada (null = nova)

function abrirModalCompra(ci=-1) {
  _editandoCI = ci >= 0 ? ci : null; // rastreia qual compra está sendo editada
  const c=ci>=0?D.compras[ci]:{nome:'',cat:'cartao',cartao:'',valor:0,parcelas:1,dataCompra:new Date().toISOString().slice(0,10),ativo:true};
  document.getElementById('modal-compra-overlay').style.display='flex';
  document.getElementById('mc-nome').value=c.nome;
  document.getElementById('mc-cat').value=c.cat||'cartao';
  document.getElementById('mc-cartao').innerHTML='<option value="">— Sem cartão (débito/pix) —</option>'+D.cartoes.map(ct=>`<option value="${ct.nome}"${c.cartao===ct.nome?' selected':''}>${ct.nome}</option>`).join('');
  document.getElementById('mc-cartao').value=c.cartao||'';

  const n=c.parcelas||1;

  // Se _parcelasCustom está true, os valores já foram carregados por editarCompra — não sobrescrever
  if(!_parcelasCustom) {
    const parcVal=c.valor>0?Math.round((c.valor/n)*100)/100:0;
    _parcelasVals=Array(n).fill(parcVal);
  }

  // Valor total = soma dos valores das parcelas (para mostrar o valor real)
  const totalReal=Math.round(_parcelasVals.reduce((s,v)=>s+(Math.round((v||0)*100)/100),0)*100)/100;
  document.getElementById('mc-valor').value=totalReal>0?totalReal.toFixed(2):(c.valor||'');
  document.getElementById('mc-parcelas').value=n;
  document.getElementById('mc-data').value=c.dataCompra||new Date().toISOString().slice(0,10);
  document.getElementById('btn-salvar-compra').onclick=()=>salvarCompra(ci);
  renderParcelasFields(true); // true = não redistribuir
  atualizarPreviewCompra();
}

function renderParcelasFields(keepValues=false) {
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const valorTotal=parseFloat(document.getElementById('mc-valor').value)||0;
  const parcPadrao=valorTotal>0?Math.round((valorTotal/n)*100)/100:0;

  while(_parcelasVals.length<n) _parcelasVals.push(parcPadrao);
  while(_parcelasVals.length>n) _parcelasVals.pop();

  if(!keepValues && !_parcelasCustom && valorTotal>0) {
    _parcelasVals=Array(n).fill(parcPadrao);
    if(valorTotal>0){
      const diff=Math.round((valorTotal-_parcelasVals.reduce((s,v)=>s+v,0))*100);
      if(diff!==0) _parcelasVals[0]=Math.round((_parcelasVals[0]+diff/100)*100)/100;
    }
  }

  const container=document.getElementById('mc-parcelas-fields');
  if(!container) return;
  if(n<=1) { container.innerHTML=''; return; }

  const cartaoNome = document.getElementById('mc-cartao')?.value || '';
  const dataCompra = document.getElementById('mc-data')?.value;
  const tmpC = { valor: valorTotal, parcelas: n, dataCompra, cartao: cartaoNome, ativo: true };
  const valsPreview = calcValsCompra(tmpC);
  const idxsComValor = valsPreview.reduce((arr, pv, idx) => pv > 0 ? [...arr, idx] : arr, []);

  // Classifica cada parcela como paga ou pendente
  const parcelasInfo = _parcelasVals.map((v, i) => {
    const miReal = idxsComValor[i] !== undefined ? idxsComValor[i] : -1;
    const pago = miReal >= 0 && isParcelaPaga({ cartao: cartaoNome }, miReal);
    return { v, i, miReal, pago, mesNome: miReal >= 0 ? (D.meses[miReal]||'') : '' };
  });

  const pendentes = parcelasInfo.filter(p => !p.pago);
  const pagas     = parcelasInfo.filter(p => p.pago);
  const hasCustom = pendentes.some(p => Math.abs(p.v-(valorTotal/n)) > 0.02);

  // Campos das parcelas pendentes (editáveis)
  const camposPendentes = pendentes.map(({v, i, mesNome}) => `
    <div>
      <div style="font-size:10px;color:var(--text3);margin-bottom:3px;text-align:center">
        ${i+1}ª${mesNome?` <span style="color:var(--accent)">(${sM(mesNome)})</span>`:''}
      </div>
      <input type="number" min="0" step="0.01" value="${v?(Math.round(v*100)/100).toFixed(2):''}" placeholder="R$ 0,00"
        style="text-align:right;padding:7px 8px;font-size:13px;font-weight:600"
        onchange="_parcelasVals[${i}]=parseFloat(this.value)||0;_parcelasCustom=true;recalcTotalFromParcelas()">
    </div>`).join('');

  // Seção colapsável de parcelas pagas (somente leitura)
  const secaoPagas = pagas.length > 0 ? `
    <div style="margin-top:10px">
      <button type="button"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.chev').textContent=this.nextElementSibling.style.display==='none'?'▸':'▾'"
        style="display:flex;align-items:center;gap:6px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.2);border-radius:var(--r8);padding:7px 12px;width:100%;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;color:var(--pos)">
        <span class="chev">▸</span>
        ✅ ${pagas.length} ${pagas.length===1?'parcela paga':'parcelas pagas'} — clique para visualizar
      </button>
      <div style="display:none;padding:10px 12px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.15);border-radius:0 0 var(--r8) var(--r8);margin-top:-1px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;margin-bottom:10px">
          ${pagas.map(({v,i,mesNome})=>`
            <div>
              <div style="font-size:10px;color:var(--pos);margin-bottom:3px;text-align:center">
                ${i+1}ª${mesNome?` (${sM(mesNome)})`:''} ✅
              </div>
              <div style="text-align:right;padding:7px 8px;font-size:13px;font-weight:600;background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);color:var(--text2)">
                ${fmt(Math.round(v*100)/100)}
              </div>
            </div>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--text2);padding:8px 10px;background:var(--warn-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--r8);line-height:1.6">
          ⚠️ Para editar uma parcela paga, primeiro vá em <strong>Faturas</strong>, encontre a fatura do cartão naquele mês e clique em <strong>↩ Desfazer</strong> o pagamento. Depois volte aqui para editar.
        </div>
      </div>
    </div>` : '';

  container.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">
        Parcelas pendentes
      </div>
      ${hasCustom?`<button type="button" onclick="redistribuirIgual()" style="font-size:10px;color:var(--text3);background:var(--card3);border:1px solid var(--border);border-radius:var(--r8);padding:2px 8px;cursor:pointer">↺ Redistribuir igual</button>`:'<span style="font-size:10px;color:var(--text3)">edite individualmente se necessário</span>'}
    </div>
    ${pendentes.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">${camposPendentes}</div>`
      : `<div style="padding:10px;text-align:center;font-size:12px;color:var(--pos);background:var(--pos-bg);border-radius:var(--r8)">✅ Todas as parcelas foram pagas!</div>`
    }
    ${secaoPagas}`;
}

function redistribuirIgual() {
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const n=_parcelasVals.length;
  if(!valor||!n) return;
  const parc=Math.round((valor/n)*100)/100;
  _parcelasVals=Array(n).fill(parc);
  const diff=Math.round((valor-_parcelasVals.reduce((s,v)=>s+v,0))*100);
  if(diff!==0) _parcelasVals[0]=Math.round((_parcelasVals[0]+diff/100)*100)/100;
  _parcelasCustom=false;
  renderParcelasFields(true);
}


function recalcTotalFromParcelas() {
  const total=_parcelasVals.reduce((s,v)=>s+(Math.round((v||0)*100)/100),0);
  const el=document.getElementById('mc-valor');
  if(el) el.value=(Math.round(total*100)/100).toFixed(2);
  atualizarPreviewCompra();
}

function onValorChange() {
  _parcelasCustom=false; // user typed a new total → redistribute equally
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const parcPadrao=valor>0?Math.round((valor/n)*100)/100:0;
  _parcelasVals=Array(n).fill(parcPadrao);
  if(valor>0){
    const diff=Math.round((valor-_parcelasVals.reduce((s,v)=>s+v,0))*100);
    if(diff!==0) _parcelasVals[0]=Math.round((_parcelasVals[0]+diff/100)*100)/100;
  }
  renderParcelasFields(true);
  atualizarPreviewCompra();
}

function onParcelasChange() {
  _parcelasCustom=false; // parcelas changed → redistribute equally
  const n=parseInt(document.getElementById('mc-parcelas').value)||1;
  const valor=parseFloat(document.getElementById('mc-valor').value)||0;
  const parcPadrao=valor>0?Math.round((valor/n)*100)/100:0;
  _parcelasVals=Array(n).fill(parcPadrao);
  if(valor>0){
    const diff=Math.round((valor-_parcelasVals.reduce((s,v)=>s+v,0))*100);
    if(diff!==0) _parcelasVals[0]=Math.round((_parcelasVals[0]+diff/100)*100)/100;
  }
  renderParcelasFields(true);
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
  const totalParcelas=Math.round(_parcelasVals.reduce((s,v)=>s+(Math.round((v||0)*100)/100),0)*100)/100;
  const valorInput=Math.round((parseFloat(document.getElementById('mc-valor').value)||0)*100)/100;
  const valor=totalParcelas>0?totalParcelas:valorInput;
  if(!valor){alert('Informe o valor.');return;}
  // Armazena os valores individuais das parcelas se foram editados
  const parcelasCustom = parcelas>1&&_parcelasVals.some((v,i)=>Math.abs(v-(valor/parcelas))>0.01)
    ? [..._parcelasVals]
    : null;
  const obj={id:ci>=0?D.compras[ci].id:genId('c'),nome,cat,cartao,valor,parcelas,dataCompra,ativo:true};
  if(parcelasCustom) obj.parcelasCustom=parcelasCustom;
  if(ci>=0) D.compras[ci]=obj; else D.compras.push(obj);
  document.getElementById('modal-compra-overlay').style.display='none';
  _parcelasCustom=false;
  _editandoCI=null;
  scheduleAutoSave(); renderSaidasVar(); renderAll();
  toast('Compra salva!', true, '🛒');
}
function editarCompra(ci){
  const c=D.compras[ci];
  if(c&&c.parcelasCustom&&c.parcelasCustom.length===(c.parcelas||1)){
    _parcelasVals=[...c.parcelasCustom];
    _parcelasCustom=true; // protect from redistribution
  } else {
    const n=c?.parcelas||1;
    const pv=c?.valor>0?Math.round((c.valor/n)*100)/100:0;
    _parcelasVals=Array(n).fill(pv);
    _parcelasCustom=false;
  }
  abrirModalCompra(ci);
}
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
  const mes=D.meses[mi];
  if(!mes){return;}

  const pag=D.pagamentos&&D.pagamentos[mes]||{};

  // ── CONTAS FIXAS — só mostra as que estão ativas neste mês ──
  const fixasDoMes = D.fixas.filter(f=>{
    if(!f.ativo||(f.valor||0)<=0) return false;
    if(!f.mesInicio&&!f.mesFim) return true; // permanente
    const {m,y}=parseMes(mes);const anosM=y*12+m;
    const desde=f.mesInicio?parseMes(f.mesInicio):null;
    const ate=f.mesFim?parseMes(f.mesFim):null;
    return anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
  });

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
  // Cada grupo: fixas individuais + fatura por cartão + sem cartão individuais
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
  // Usa calcPendenteMes para garantir consistência com Investimentos
  const _cp = calcPendenteMes(mi);
  const totBruto = _cp.bruto;
  const totPago  = _cp.pago;
  const totPend  = _cp.pendente;
  const pctP = totBruto>0?Math.round((totPago/totBruto)*100):0;

  const sumEl=document.getElementById('faturas-summary');
  if(sumEl) sumEl.innerHTML=`
    <div class="mcard mcard-neg"><div class="mlabel">💸 Total do mês</div><div class="mval mval-neg">${fmt(totBruto)}</div></div>
    <div class="mcard mcard-warn"><div class="mlabel">⏳ Pendente</div><div class="mval mval-warn">${fmt(totPend)}</div><div class="msub">${pendentes.length} fatura(s)</div></div>
    <div class="mcard mcard-pos"><div class="mlabel">✅ Pago</div><div class="mval mval-pos">${fmt(totPago)}</div><div class="msub">${pagas.length} fatura(s) · ${pctP}%</div></div>
    <div class="mcard ${pctP===100&&grupos.length>0?'mcard-pos':'mcard-accent'}"><div class="mlabel">📊 Progresso</div><div class="mval ${pctP===100?'mval-pos':'mval-accent'}">${pctP}%</div><div style="height:4px;background:var(--card3);border-radius:99px;margin-top:8px;overflow:hidden"><div style="height:4px;width:${pctP}%;background:${pctP===100?'var(--pos)':'var(--accent)'};border-radius:99px;transition:width .5s"></div></div></div>
  `;

  const allDone=document.getElementById('faturas-all-done');
  if(allDone){if(pctP===100&&grupos.length>0){allDone.style.display='';allDone.innerHTML=`<div style="text-align:center;padding:16px;background:var(--pos-bg);border:1px solid rgba(16,185,129,.3);border-radius:var(--r12);color:var(--pos);font-weight:700">🎉 Todas as faturas de ${mesNome} foram pagas!</div>`;}else{allDone.style.display='none';}}

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
      <button class="btn btn-ghost" style="height:30px;font-size:11px" onclick="faturaDesfazer('${g.id}',${mi})">↩</button>
    </div>`;

    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${bordaCor};border-radius:var(--r12);padding:16px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:22px">${g.icon}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${g.label}</div>
          <div style="font-size:11px;color:var(--text2)">${g.sub}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-right:10px">
          <div style="font-size:20px;font-weight:700;color:var(--neg)">${fmt(g.valor)}</div>
        </div>
        <button class="btn btn-pos" style="height:38px;padding:0 18px;font-size:13px" onclick="faturaPagar('${g.id}',${mi},${g.valor})">✓ Pagar fatura</button>
      </div>
      ${itensHTML}
    </div>`;
  };

  const listEl=document.getElementById('faturas-list');
  if(listEl){
    if(!grupos.length){listEl.innerHTML=`<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">Nenhuma conta em ${mesNome}</div></div>`;return;}
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
  // Feedback visual
  toast(`✅ Fatura paga: ${fmt(valor)}`, true, '💳');
}
function faturaDesfazer(id,mi) {
  if(!D.pagamentos) return;
  const mes=D.meses[mi];
  if(D.pagamentos[mes]) delete D.pagamentos[mes][id];
  scheduleAutoSave(); renderFaturas();
  toast('↩ Pagamento desfeito', true, '🔄');
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

// ── CONFIG PAGE ─────────────────────────────────
function renderConfig() {
  // Dias de corte
  const dc=document.getElementById('config-diacorte');if(dc)dc.value=D.diaCorte||20;
  const hojeEl=document.getElementById('config-hoje');if(hojeEl)hojeEl.textContent=new Date().getDate();
  const mrEl=document.getElementById('config-mes-ref');if(mrEl)mrEl.textContent=D.meses[getMesRefIdx()]||'—';
  // Parâmetros
  const mcc=document.getElementById('config-metaCC');if(mcc)mcc.value=D.metaCC||2000;
  const sal=document.getElementById('config-saldo');if(sal)sal.value=D.saldo||0;
  // ARCA
  const arcaMap={a:'config-arca-a',r:'config-arca-r',c:'config-arca-c',a2:'config-arca-a2'};
  Object.entries(arcaMap).forEach(([k,id])=>{ const el=document.getElementById(id);if(el)el.value=D.arcaMeta[k]||0; });
  const sumEl=document.getElementById('config-arca-sum');
  if(sumEl){
    const soma=(D.arcaMeta.a||0)+(D.arcaMeta.r||0)+(D.arcaMeta.c||0)+(D.arcaMeta.a2||0);
    sumEl.innerHTML=`Soma atual: <strong style="color:${soma===100?'var(--pos)':'var(--neg)'}">${soma}%</strong> ${soma===100?'✅':'— deve totalizar 100%'}`;
  }
  // Gestão de meses
  const anosEl=document.getElementById('config-anos-list');
  if(anosEl){
    const yrs=getYears();
    anosEl.innerHTML=yrs.map(yr=>`<span class="msb" style="cursor:default">${yr} · ${getMesesAno(yr).length} meses</span>`).join('');
    const rmBtn=document.getElementById('btn-remove-ano');
    if(rmBtn) rmBtn.style.display=yrs.length>1?'':'none';
  }
}

// ── FIX: collectFormFields — never overwrite D.metaCC with 0/NaN ──
function collectFormFields(){
  // Saldo e meta CC — only update if field has a valid positive value
  const elSaldo=document.getElementById('ef-saldo');
  if(elSaldo&&elSaldo.value!=='') D.saldo=parseFloat(elSaldo.value)||0;

  const elMeta=document.getElementById('ef-metaCC');
  if(elMeta&&elMeta.value!==''&&parseFloat(elMeta.value)>0) D.metaCC=parseFloat(elMeta.value);

  const elDiaCorte=document.getElementById('ef-diacorte');
  if(elDiaCorte&&elDiaCorte.value!==''&&parseInt(elDiaCorte.value)>0) D.diaCorte=parseInt(elDiaCorte.value);

  // Config page fields also count
  const cfgMeta=document.getElementById('config-metaCC');
  if(cfgMeta&&cfgMeta.value!==''&&parseFloat(cfgMeta.value)>0) D.metaCC=parseFloat(cfgMeta.value);

  const cfgSaldo=document.getElementById('config-saldo');
  if(cfgSaldo&&cfgSaldo.value!=='') D.saldo=parseFloat(cfgSaldo.value)||0;

  const cfgDia=document.getElementById('config-diacorte');
  if(cfgDia&&cfgDia.value!==''&&parseInt(cfgDia.value)>0) D.diaCorte=parseInt(cfgDia.value);

  // Indicators
  const indicFields={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',
    ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26',selic:'ef-selic'};
  Object.entries(indicFields).forEach(([k,id])=>{
    const el=document.getElementById(id);
    if(el&&el.value!=='') D[k]=parseFloat(el.value)||0;
  });
  // ARCA
  const arcaMap={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaMap).forEach(([id,k])=>{
    const el=document.getElementById(id);
    if(el&&el.value!=='') D.arcaMeta[k]=parseFloat(el.value)||0;
  });
  const arcaCfgMap={'config-arca-a':'a','config-arca-r':'r','config-arca-c':'c','config-arca-a2':'a2'};
  Object.entries(arcaCfgMap).forEach(([id,k])=>{
    const el=document.getElementById(id);
    if(el&&el.value!=='') D.arcaMeta[k]=parseFloat(el.value)||0;
  });
}

function saveData(){
  collectFormFields();
  if(window._firestoreSave) window._firestoreSave(true);
  renderAll();
}

// ── ADMIN MODAL ──────────────────────────────────
let _editingUid = null;
function abrirModalCriarUser() {
  _editingUid = null;
  document.getElementById('modal-user-title').textContent = '➕ Novo Usuário';
  document.getElementById('modal-user-sub').textContent = 'Preencha os dados do novo usuário';
  document.getElementById('mu-name').value = '';
  document.getElementById('mu-email').value = '';
  document.getElementById('mu-pass').value = '';
  document.getElementById('mu-role').value = 'user';
  document.getElementById('mu-pass-section').style.display = '';
  document.getElementById('btn-salvar-user').textContent = 'Criar usuário';
  document.getElementById('modal-user-err').style.display = 'none';
  document.getElementById('modal-user-ok').style.display = 'none';
  document.getElementById('modal-user').style.display = 'flex';
  document.getElementById('btn-salvar-user').onclick = criarUser;
}
function abrirModalEditarUser(uid, nome, email, role) {
  _editingUid = uid;
  document.getElementById('modal-user-title').textContent = '✏️ Editar Usuário';
  document.getElementById('modal-user-sub').textContent = `Editando: ${email}`;
  document.getElementById('mu-name').value = nome;
  document.getElementById('mu-email').value = email;
  document.getElementById('mu-pass').value = '';
  document.getElementById('mu-role').value = role;
  document.getElementById('mu-pass-section').style.display = '';
  document.getElementById('mu-pass-section').querySelector('label').textContent = 'Nova senha (deixe em branco para manter)';
  document.getElementById('btn-salvar-user').textContent = 'Salvar alterações';
  document.getElementById('modal-user-err').style.display = 'none';
  document.getElementById('modal-user-ok').style.display = 'none';
  document.getElementById('modal-user').style.display = 'flex';
  document.getElementById('btn-salvar-user').onclick = editarUser;
}
function fecharModalUser() {
  document.getElementById('modal-user').style.display = 'none';
}
function showModalAlert(id, msg, ok=false) {
  const el=document.getElementById(id);if(!el)return;
  el.textContent=msg;el.style.display='';
  el.className='alert-inline '+(ok?'alert-ok':'alert-err');
}

function criarUser() {
  const name=document.getElementById('mu-name').value.trim();
  const email=document.getElementById('mu-email').value.trim();
  const pass=document.getElementById('mu-pass').value;
  const role=document.getElementById('mu-role').value;
  if(!name||!email||!pass){showModalAlert('modal-user-err','Preencha todos os campos.');return;}
  if(pass.length<6){showModalAlert('modal-user-err','Senha mínima de 6 caracteres.');return;}
  const btn=document.getElementById('btn-salvar-user');
  btn.disabled=true;btn.textContent='Criando...';
  const secName='__fp_sec_'+Date.now();
  const sec=firebase.initializeApp(firebase.app().options,secName);
  sec.auth().createUserWithEmailAndPassword(email,pass).then(cred=>{
    const uid=cred.user.uid;
    const blank={saldo:0,cdi12:14.80,cdifev:1.21,cdi26:3.41,ipca12:4.14,ipcafev:0.88,ipca26:1.92,selic:14.75,arcaMeta:{a:25,r:25,c:25,a2:25},metaCC:2000,diaCorte:20,meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26','Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27','Set/27','Out/27','Nov/27','Dez/27'],invManual:Array(20).fill(null),entradas:[],fixas:[],compras:[],dividas:[],pagamentos:{},ativos:[],cartoes:[]};
    return db.collection('users').doc(uid).set({email,displayName:name,role,uid,createdAt:new Date().toISOString()})
      .then(()=>db.collection('userData').doc(uid).set({data:JSON.stringify(blank),updatedAt:new Date().toISOString(),v:3,createdAt:new Date().toISOString()}))
      .then(()=>sec.auth().signOut());
  }).then(()=>{
    showModalAlert('modal-user-ok','✅ Usuário criado com sucesso!',true);
    setTimeout(fecharModalUser,1500);
    window._renderAdmin&&window._renderAdmin();
    toast('Usuário criado!');
  }).catch(e=>{
    const msgs={'auth/email-already-in-use':'Este e-mail já está em uso.','auth/invalid-email':'E-mail inválido.'};
    showModalAlert('modal-user-err',msgs[e.code]||e.message);
  }).finally(()=>{btn.disabled=false;btn.textContent='Criar usuário';});
}

function editarUser() {
  const uid=_editingUid;if(!uid)return;
  const name=document.getElementById('mu-name').value.trim();
  const role=document.getElementById('mu-role').value;
  const pass=document.getElementById('mu-pass').value;
  if(!name){showModalAlert('modal-user-err','Informe o nome.');return;}
  const btn=document.getElementById('btn-salvar-user');
  btn.disabled=true;btn.textContent='Salvando...';
  const updates={displayName:name,role,updatedAt:new Date().toISOString()};
  db.collection('users').doc(uid).update(updates).then(()=>{
    if(pass&&pass.length>=6){
      // Salva pendingReset para ser aplicado no próximo login
      return db.collection('pendingReset').doc(uid).set({newPass:pass,requestedAt:new Date().toISOString()});
    }
  }).then(()=>{
    showModalAlert('modal-user-ok','✅ Dados atualizados!',true);
    setTimeout(fecharModalUser,1500);
    window._renderAdmin&&window._renderAdmin();
    toast('Usuário atualizado!');
  }).catch(e=>showModalAlert('modal-user-err',e.message))
  .finally(()=>{btn.disabled=false;btn.textContent='Salvar alterações';});
}


function renderInvestVisao(){
  const ref=calcInvest(getMesRefIdx());
  const pl=patrimonioLiquido();
  const totInv=D.meses.reduce((s,_,i)=>s+invDisp(i),0);
  const icon=ref.regra==='negativo'?'🔴':ref.regra==='menor_meta'?'🟡':'🟢';
  const reserva=statusReserva();
  const dist=calcDistribuicaoInvest(ref.saldo);

  // ── Banner de reserva de emergência ──
  const reservaBanner=document.getElementById('inv-reserva-banner');
  if(reservaBanner){
    const pctCor=reserva.pct>=100?'var(--pos)':reserva.pct>=50?'var(--warn)':'var(--neg)';
    const bgCor=reserva.pct>=100?'var(--pos-bg)':reserva.pct>=50?'var(--warn-bg)':'rgba(239,68,68,.06)';
    const bordCor=reserva.pct>=100?'rgba(16,185,129,.3)':reserva.pct>=50?'rgba(245,158,11,.3)':'rgba(239,68,68,.3)';
    reservaBanner.innerHTML=`
      <div style="background:${bgCor};border:1px solid ${bordCor};border-radius:var(--r12);padding:16px 20px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:10px">
          <div>
            <div style="font-size:14px;font-weight:700;color:${pctCor}">
              ${reserva.pct>=100?'✅ Reserva de emergência completa!':reserva.pct>=50?'⚠️ Construindo reserva de emergência':'🔴 Reserva de emergência insuficiente'}
            </div>
            <div style="font-size:12px;color:var(--text2);margin-top:3px">
              ${reserva.pct>=100
                ? `Caixa atual ${fmt(reserva.caixa)} ≥ meta ${fmt(reserva.meta)} · Investimentos ARCA liberados`
                : `Faltam ${fmt(reserva.falta)} para completar a reserva · ${reserva.pct}% atingido`
              }
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:24px;font-weight:800;color:${pctCor}">${reserva.pct}%</div>
            <div style="font-size:10px;color:var(--text2)">${fmt(reserva.caixa)} / ${fmt(reserva.meta)}</div>
          </div>
        </div>
        <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden;margin-bottom:8px">
          <div style="height:8px;width:${reserva.pct}%;background:${pctCor};border-radius:99px;transition:width .6s"></div>
        </div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">
          📋 Base de cálculo: ${D.fixas.filter(f=>f.ativo).length} contas fixas = <strong>${fmt(custoFixoMes())}/mês</strong> × 6 meses = <strong style="color:${pctCor}">${fmt(reserva.meta)}</strong>
          ${reserva.pct<100?`<br>🎯 Fase atual: <strong>100% do disponível vai para Caixa</strong> até completar a reserva.`
            :`<br>🎯 Reserva intocável — continua crescendo com aportes mensais em Caixa.`}
        </div>
      </div>
      ${dist?`
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px">
          ${dist.fase===1?'💸 Como investir este mês (Fase 1 — Reserva)':'💰 Como investir este mês (Fase 2 — ARCA)'}
          <span style="font-size:12px;font-weight:400;color:var(--text2);margin-left:8px">Disponível: ${fmt(dist.total)}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">
          ${dist.distribuicao.map(b=>`
            <div style="background:var(--card2);border:1px solid ${b.cor}30;border-radius:var(--r8);padding:12px;text-align:center">
              <div style="font-size:10px;font-weight:700;color:${b.cor};text-transform:uppercase;margin-bottom:4px">${b.label}</div>
              <div style="font-size:20px;font-weight:800;color:${b.cor}">${fmt(b.valor)}</div>
              <div style="font-size:10px;color:var(--text2);margin-top:2px">${b.pct}%</div>
            </div>`).join('')}
        </div>
        ${dist.fase===1?`<div style="margin-top:10px;font-size:11px;color:var(--text2);padding:8px 12px;background:var(--warn-bg);border-radius:var(--r8);border:1px solid rgba(245,158,11,.2)">
          ⚡ Quando a reserva estiver completa, o sistema passa automaticamente para a Fase 2 e distribui pelo método ARCA.
        </div>`:''}
      </div>`
      : ''}`;
  }

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
    <div class="mcard ${reserva.pct>=100?'mcard-pos':reserva.pct>=50?'mcard-warn':'mcard-neg'}">
      <div class="mlabel">🛡️ Reserva emergência</div>
      <div class="mval ${reserva.pct>=100?'mval-pos':reserva.pct>=50?'mval-warn':'mval-neg'}">${reserva.pct}%</div>
      <div class="msub">${fmt(reserva.caixa)} / ${fmt(reserva.meta)}</div>
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
    let temMesNoAno=false;
    mesesDoAno.forEach(m=>{
      const i=D.meses.indexOf(m);
      if(isExcluido(i)) return; // mês removido pelo usuário
      const r=calcInvest(i);
      const manual=isManual(i);
      const valFinal=invDisp(i);
      const valCalc=invDispCalc(i);
      const icon=r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
      totE+=r.e; totC+=r.c; totSobra+=r.sobra; totInv+=valFinal;
      temMesNoAno=true;
      rows.push(`<tr style="${manual?'background:rgba(245,158,11,.06)':''}">
        <td style="font-weight:500">
          <span>${m}</span>
          <button onclick="excluirMesInvest(${i})" title="Remover este mês da tabela"
            style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:11px;padding:0 0 0 6px;opacity:.5"
            onmouseover="this.style.color='var(--neg)';this.style.opacity=1"
            onmouseout="this.style.color='var(--text3)';this.style.opacity=.5">✕</button>
        </td>
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
              style="width:120px;text-align:right;font-weight:700;border-color:${manual?'var(--warn)':'var(--border2)'};color:${manual?'var(--warn)':'var(--teal)'};background:${manual?'var(--warn-bg)':'var(--card2)'}"
              onchange="setManual(${i},this.value);renderInvestVisao()">
          </div>
        </td>
      </tr>`);
    });
    // Subtotal do ano (só mostra se tem pelo menos um mês visível)
    if(temMesNoAno) {
      const yrCor=yr==='2026'?'rgba(59,130,246,.08)':'rgba(139,92,246,.08)';
      const yrBord=yr==='2026'?'rgba(59,130,246,.2)':'rgba(139,92,246,.2)';
      const yrTxt=yr==='2026'?'var(--info)':'var(--accent)';
      rows.push(`<tr style="background:linear-gradient(90deg,${yrCor},transparent);font-weight:700;border-top:2px solid ${yrBord}">
        <td style="color:${yrTxt};font-size:12px">Σ ${yr}</td>
        <td class="tr tpos" style="font-size:12px">${fmt(totE)}</td>
        <td class="tr tneg" style="font-size:12px">${fmt(totC)}</td>
        <td class="tr" style="color:var(--text2);font-size:12px">${fmt(totSobra)}</td>
        <td></td>
        <td class="tr tteal" style="font-size:13px">${fmt(totInv)}</td>
      </tr>`);
    }
  });

  // Meses excluídos — botão para restaurar
  const excluidos=ativosInv.filter(m=>isExcluido(D.meses.indexOf(m)));
  const exclHTML=excluidos.length?`<tr><td colspan="6" style="padding:10px 0">
    <span style="font-size:11px;color:var(--text2);margin-right:6px">Meses removidos:</span>
    ${excluidos.map(m=>`<button onclick="restaurarMesInvest(${D.meses.indexOf(m)})"
      style="margin-right:4px;background:var(--card2);border:1px solid var(--border);border-radius:4px;font-size:10px;padding:2px 8px;cursor:pointer;color:var(--text2)">↩ ${sM(m)}</button>`).join('')}
  </td></tr>`:'';

  const tot=ativosInv.filter(m=>!isExcluido(D.meses.indexOf(m))).reduce((s,m)=>s+invDisp(D.meses.indexOf(m)),0);
  const temManual=ativosInv.some(m=>isManual(D.meses.indexOf(m)));

  mt.innerHTML=`<thead class="thead-sticky"><tr>
    <th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th>
    <th class="tr">Sobra bruta</th><th class="tr">Regra</th>
    <th class="tr" style="color:var(--teal)">
      💰 Disponível p/ investir
      ${temManual?`<button onclick="resetTodosManual()" style="margin-left:6px;background:var(--warn-bg);color:var(--warn);border:1px solid rgba(245,158,11,.3);border-radius:4px;font-size:10px;padding:1px 6px;cursor:pointer;font-family:inherit">↩ resetar tudo</button>`:''}
    </th>
  </tr></thead><tbody>${rows.join('')}
  <tr style="background:var(--card2);font-weight:700;border-top:3px solid var(--border2)">
    <td>TOTAL</td><td></td><td></td><td></td><td></td>
    <td class="tr tteal" style="font-size:15px">${fmt(tot)}</td>
  </tr>
  ${exclHTML}
  </tbody>`;
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
  // CDI
  cdiDiarioAnual: 12,    // CDI diário anualizado (% a.a.) → ~14.65% — mais confiável para CDI 12m
  cdiMensal:      4389,  // CDI acumulado no mês (% a.m.) → ~1.13%
  // SELIC
  selicMeta:      432,   // Meta SELIC (% a.a.) → ~14.75%
  selicDiaria:    11,    // SELIC diária anualizada (% a.a.)
  // IPCA
  ipcaMensal:     433,   // IPCA mensal (% a.m.) → ~0.43%
  ipca12meses:    13522, // IPCA acumulado 12 meses (%) → ~4.39%
};

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

async function fetchBCB() {
  const btn  = document.getElementById('btn-bcb-fetch');
  const stat = document.getElementById('bcb-status');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Buscando...'; }
  if (stat) { stat.style.display = ''; stat.innerHTML = '⏳ Conectando ao Banco Central do Brasil...'; }

  try {
    const [selicMeta, cdiAnual, cdiMensal, ipcaMensal, ipca12m] = await Promise.all([
      bcbFetch(BCB_SERIES.selicMeta,      1),
      bcbFetch(BCB_SERIES.cdiDiarioAnual, 1),  // CDI % a.a. → o correto para CDI 12m
      bcbFetch(BCB_SERIES.cdiMensal,      1),  // CDI % a.m. → mês de referência
      bcbFetch(BCB_SERIES.ipcaMensal,     1),  // IPCA % a.m.
      bcbFetch(BCB_SERIES.ipca12meses,    1),  // IPCA 12m %
    ]);

    // ── Atribui os valores corretamente ──
    D.selic   = parseFloat(selicMeta.valor) || D.selic || 14.75;

    // CDI 12m = CDI diário anualizado (série 12) → ~14.65%
    // Se não disponível, usa SELIC - 0.10 (CDI fica ~0.1pp abaixo da SELIC)
    const cdiAnualVal = parseFloat(cdiAnual.valor);
    D.cdi12 = cdiAnualVal > 1 ? cdiAnualVal : D.selic - 0.10;

    // CDI mensal (% a.m.) → série 4389 → ~1.13%
    const cdiMensalVal = parseFloat(cdiMensal.valor);
    D.cdifev = cdiMensalVal > 0 && cdiMensalVal < 5 ? cdiMensalVal : D.cdifev;

    // IPCA 12m → série 13522 → ~4.39%
    const ipca12Val = parseFloat(ipca12m.valor);
    D.ipca12 = ipca12Val > 0 ? ipca12Val : D.ipca12;

    // IPCA mensal (% a.m.) → série 433 → ~0.43%
    const ipcaMensalVal = parseFloat(ipcaMensal.valor);
    D.ipcafev = ipcaMensalVal > 0 && ipcaMensalVal < 5 ? ipcaMensalVal : D.ipcafev;

    // Acumulado do ano = taxa mensal composta pelos meses decorridos
    const mesesDecorridos = new Date().getMonth() + 1;
    // CDI acum. ano = composto dos meses: (1 + cdi_mensal/100)^meses - 1
    D.cdi26  = parseFloat((((Math.pow(1 + D.cdifev/100, mesesDecorridos)) - 1) * 100).toFixed(2));
    // IPCA acum. ano = composto dos meses
    D.ipca26 = parseFloat((((Math.pow(1 + D.ipcafev/100, mesesDecorridos)) - 1) * 100).toFixed(2));

    const dataRef = selicMeta.data || ipcaMensal.data || '—';
    if (stat) stat.innerHTML = `✅ Dados atualizados! Referência: <strong>${dataRef}</strong> · CDI 12m: <strong>${D.cdi12.toFixed(2)}%</strong> · IPCA 12m: <strong>${D.ipca12.toFixed(2)}%</strong> · SELIC meta: <strong>${D.selic}%</strong> · CDI mês: <strong>${D.cdifev.toFixed(2)}%</strong>`;

    scheduleAutoSave();
    renderIndicadores();

  } catch(e) {
    console.error('BCB fetch error:', e);
    if (stat) { stat.innerHTML = `❌ ${e.message}<br><small style='color:var(--text3)'>Insira os valores manualmente nos campos abaixo.</small>`; stat.style.color='var(--neg)'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Atualizar indicadores agora'; }
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
    if (stat) { stat.innerHTML = `❌ ${e.message}<br><small style='color:var(--text3)'>Insira os valores manualmente nos campos abaixo.</small>`; stat.style.color='var(--neg)'; }
    if (stat) stat.style.color = 'var(--neg)';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Atualizar indicadores agora'; }
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



// ── INIT ──────────────────────────────────────────
applyTheme();
// Preenche indicadores com valores aproximados do mercado atual
// Útil quando a API do BCB estiver inacessível
function preencherManual() {
  // Valores baseados em maio/2026 (SELIC 14.75%, CDI ~14.65%, IPCA 4.39%)
  D.selic   = 14.75;
  D.cdi12   = 14.65;  // CDI anual ≈ SELIC - 0.10%
  D.cdifev  = 1.14;   // CDI mensal ≈ ((1 + 0.1465)^(1/12) - 1) × 100
  D.cdi26   = 5.73;   // CDI acum. Jan-Mai/26 ≈ 5 meses compostos
  D.ipca12  = 4.39;   // IPCA 12 meses
  D.ipcafev = 0.67;   // IPCA de abril/26
  D.ipca26  = 2.15;   // IPCA acum. Jan-Mai/26
  scheduleAutoSave();
  renderIndicadores();
  toast('Valores padrão de mercado aplicados!', true, '🎯');
}
// ═══════════════════════════════════════════════════════════════════
//  MÓDULOS NOVOS — Metas, Categorias, Parâmetros, Relatório
// ═══════════════════════════════════════════════════════════════════

// ── DADOS PADRÃO EXTRAS ──────────────────────────────────────────
// Adiciona ao BLANK e DEFAULT: metas, reservaMult, categoriasCustom

const BLANK_EXTRA = {
  metas: [],          // Metas financeiras do usuário
  reservaMult: 6,     // Multiplicador da reserva de emergência (padrão 6x)
  notasMes: {},       // Notas mensais { 'Mai/26': 'texto' }
};

// ── CATEGORIAS PARAMETRIZÁVEIS ───────────────────────────────────
// O admin pode adicionar/editar categorias via painel
// Usa D.catsCustom para override; fallback para CATS padrão

function getCats() {
  if (D.catsCustom && Object.keys(D.catsCustom).length > 0) return D.catsCustom;
  return CATS;
}
function getCatsEntrada() {
  if (D.catsEntradaCustom && Object.keys(D.catsEntradaCustom).length > 0) return D.catsEntradaCustom;
  return CATS_ENTRADA;
}

// ── METAS FINANCEIRAS ────────────────────────────────────────────
function renderMetas() {
  const page = document.getElementById('page-metas');
  if (!page) return;
  if (!D.metas) D.metas = [];

  const totalAtivos = D.ativos.reduce((s,a) => s+(a.valor||0), 0);
  const totInv = D.meses.reduce((s,_,i) => s+invDisp(i), 0);

  // Cards de resumo
  const sumEl = document.getElementById('metas-summary');
  if (sumEl) {
    const concluidas = D.metas.filter(m => m.atual >= m.valor).length;
    const totalMeta = D.metas.reduce((s,m) => s+(m.valor||0), 0);
    const totalAtingido = D.metas.reduce((s,m) => s+Math.min(m.atual||0, m.valor||0), 0);
    const pctGeral = totalMeta > 0 ? Math.round((totalAtingido/totalMeta)*100) : 0;
    sumEl.innerHTML = `
      <div class="mcard mcard-accent"><div class="mlabel">🎯 Total de metas</div><div class="mval mval-accent">${D.metas.length}</div><div class="msub">${concluidas} concluída(s)</div></div>
      <div class="mcard ${pctGeral>=100?'mcard-pos':'mcard-warn'}"><div class="mlabel">📊 Progresso geral</div><div class="mval ${pctGeral>=100?'mval-pos':'mval-warn'}">${pctGeral}%</div><div class="msub">${fmt(totalAtingido)} / ${fmt(totalMeta)}</div></div>
      <div class="mcard mcard-teal"><div class="mlabel">🚀 Aportes mensais</div><div class="mval mval-teal">${fmt(invDisp(getMesRefIdx()))}</div><div class="msub">disponível este mês</div></div>
      <div class="mcard mcard-pos"><div class="mlabel">💎 Patrimônio atual</div><div class="mval mval-pos">${fmtK(totalAtivos)}</div></div>
    `;
  }

  const lista = document.getElementById('metas-lista');
  if (!lista) return;

  if (!D.metas.length) {
    lista.innerHTML = `<div class="empty"><div class="empty-icon" style="animation:pulse-badge 2s ease-in-out infinite">🎯</div><div class="empty-text">Nenhuma meta cadastrada.<br>Defina seus objetivos financeiros e acompanhe o progresso.</div></div>`;
    return;
  }

  // Aportes mensais disponíveis (para calcular prazo)
  const aporteMes = invDisp(getMesRefIdx());

  lista.innerHTML = D.metas.map((meta, mi) => {
    const atual = meta.atual || 0;
    const target = meta.valor || 0;
    const pct = target > 0 ? Math.min(100, Math.round((atual/target)*100)) : 0;
    const falta = Math.max(0, target - atual);
    const concluida = atual >= target;
    const mesesRestantes = aporteMes > 0 && !concluida ? Math.ceil(falta / aporteMes) : null;
    const dataEst = mesesRestantes ? (() => {
      const hoje = new Date();
      const est = new Date(hoje.getFullYear(), hoje.getMonth() + mesesRestantes, 1);
      return est.toLocaleDateString('pt-BR', {month:'short', year:'numeric'});
    })() : null;

    const corPct = pct>=100?'var(--pos)':pct>=50?'var(--accent)':'var(--warn)';
    const icons = {casa:'🏠',carro:'🚗',viagem:'✈️',educacao:'🎓',investimento:'📈',emergencia:'🛡️',casamento:'💍',eletronico:'💻',reforma:'🔨',outros:'🎯'};
    const icon = icons[meta.tipo||'outros']||'🎯';

    return `<div style="background:var(--card);border:1px solid ${concluida?'rgba(16,185,129,.3)':'var(--border)'};border-radius:var(--r16);padding:20px;margin-bottom:12px;${concluida?'background:var(--pos-bg)':''}">
      <div style="display:flex;align-items:flex-start;gap:14px">
        <div style="font-size:32px;flex-shrink:0">${icon}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:16px;font-weight:700">${meta.nome}</span>
            ${concluida?'<span class="badge badge-pos payment-success">✅ Concluída!</span>':''}
            ${meta.prazo?`<span class="badge" style="background:var(--card3);color:var(--text2)">📅 Meta: ${meta.prazo}</span>`:''}
          </div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:12px">${meta.descricao||''}</div>
          <!-- Progresso -->
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
            <span style="color:var(--text2)">Progresso</span>
            <span style="font-weight:700;color:${corPct}">${pct}%</span>
          </div>
          <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden;margin-bottom:8px">
            <div style="height:8px;width:${pct}%;background:${corPct};border-radius:99px;transition:width .8s var(--ease-out)"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;flex-wrap:wrap;gap:8px">
            <span>Atual: <strong style="color:var(--pos)">${fmt(atual)}</strong></span>
            <span>Meta: <strong>${fmt(target)}</strong></span>
            ${!concluida?`<span>Falta: <strong style="color:var(--neg)">${fmt(falta)}</strong></span>`:''}
            ${dataEst?`<span>Estimativa: <strong style="color:var(--accent)">${dataEst}</strong> (${mesesRestantes}m)</span>`:''}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
          <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="editarMeta(${mi})">✏️</button>
          <button class="btn btn-pos" style="height:30px;font-size:11px" onclick="aportarMeta(${mi})">+ Aportar</button>
          <button class="btn-rm" onclick="removerMeta(${mi})">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function abrirModalMeta(mi=-1) {
  const m = mi >= 0 ? D.metas[mi] : {nome:'',tipo:'outros',valor:0,atual:0,prazo:'',descricao:''};
  document.getElementById('modal-meta-overlay').style.display='flex';
  document.getElementById('mm-nome').value = m.nome;
  document.getElementById('mm-tipo').value = m.tipo||'outros';
  document.getElementById('mm-valor').value = m.valor||'';
  document.getElementById('mm-atual').value = m.atual||'';
  document.getElementById('mm-prazo').value = m.prazo||'';
  document.getElementById('mm-desc').value = m.descricao||'';
  document.getElementById('btn-salvar-meta').onclick = () => salvarMeta(mi);
}
function editarMeta(mi) { abrirModalMeta(mi); }
function fecharModalMeta() { document.getElementById('modal-meta-overlay').style.display='none'; }
function salvarMeta(mi) {
  const nome = document.getElementById('mm-nome').value.trim();
  if(!nome) { alert('Informe o nome da meta.'); return; }
  const obj = {
    nome, tipo: document.getElementById('mm-tipo').value,
    valor: parseFloat(document.getElementById('mm-valor').value)||0,
    atual: parseFloat(document.getElementById('mm-atual').value)||0,
    prazo: document.getElementById('mm-prazo').value,
    descricao: document.getElementById('mm-desc').value,
    criadoEm: mi>=0?(D.metas[mi].criadoEm||new Date().toISOString()):new Date().toISOString(),
  };
  if(!D.metas) D.metas=[];
  if(mi>=0) D.metas[mi]=obj; else D.metas.push(obj);
  fecharModalMeta(); scheduleAutoSave(); renderMetas();
  toast('Meta salva!', true, '🎯');
}
function removerMeta(mi) {
  if(!confirm(`Remover meta "${D.metas[mi].nome}"?`)) return;
  D.metas.splice(mi,1); scheduleAutoSave(); renderMetas();
}
function aportarMeta(mi) {
  const v = parseFloat(prompt(`Valor a adicionar na meta "${D.metas[mi].nome}":`))||0;
  if(!v) return;
  D.metas[mi].atual = (D.metas[mi].atual||0) + v;
  scheduleAutoSave(); renderMetas();
  toast(`Aporte de ${fmt(v)} registrado!`, true, '💰');
}

// ── ADMIN: CATEGORIAS ─────────────────────────────────────────────
function renderAdminCategorias() {
  const el = document.getElementById('admin-cats-list');
  if (!el) return;
  const cats = D.catsCustom || {...CATS};

  el.innerHTML = Object.entries(cats).map(([key, cat]) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--card);border:1px solid var(--border);border-radius:var(--r8);margin-bottom:6px">
      <span style="font-size:20px">${cat.icon||'📦'}</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">${cat.label}</div>
        <div style="font-size:10px;color:var(--text2);font-family:monospace">${key}</div>
      </div>
      <div style="width:16px;height:16px;border-radius:50%;background:${cat.cor||'#888'};flex-shrink:0"></div>
      <button class="btn btn-ghost" style="height:28px;font-size:11px" onclick="editarCategoria('${key}')">✏️</button>
      ${!CATS[key]?`<button class="btn-rm" onclick="removerCategoria('${key}')">✕</button>`:'<span style="font-size:10px;color:var(--text3)">padrão</span>'}
    </div>`).join('');
}

function editarCategoria(key) {
  const cats = D.catsCustom || {...CATS};
  const cat = cats[key] || {label:'',icon:'📦',cor:'#888'};
  const nome = prompt(`Nome da categoria "${key}":`, cat.label);
  if(!nome) return;
  const icon = prompt('Ícone (emoji):', cat.icon)||cat.icon;
  if(!D.catsCustom) D.catsCustom = {...CATS};
  D.catsCustom[key] = {...D.catsCustom[key]||cat, label:nome, icon};
  scheduleAutoSave(); renderAdminCategorias();
}
function removerCategoria(key) {
  if(!confirm(`Remover categoria "${key}"?`)) return;
  if(D.catsCustom) delete D.catsCustom[key];
  scheduleAutoSave(); renderAdminCategorias();
}
function adicionarCategoria() {
  const key = prompt('Chave da categoria (ex: streaming):')?.toLowerCase().replace(/\s/g,'_');
  if(!key) return;
  const nome = prompt('Nome de exibição:');
  if(!nome) return;
  const icon = prompt('Ícone (emoji):')||'📦';
  if(!D.catsCustom) D.catsCustom = {...CATS};
  D.catsCustom[key] = {label:nome, icon, cor:'#6B7280'};
  scheduleAutoSave(); renderAdminCategorias();
  toast('Categoria adicionada!', true, '🏷️');
}
function resetarCategorias() {
  if(!confirm('Resetar todas as categorias para o padrão?')) return;
  delete D.catsCustom; scheduleAutoSave(); renderAdminCategorias();
  toast('Categorias resetadas!', true, '🔄');
}

// ── ADMIN: PARÂMETROS DO SISTEMA ─────────────────────────────────
function renderAdminParams() {
  const reservaMult = document.getElementById('param-reserva-mult');
  if(reservaMult) reservaMult.value = D.reservaMult||6;
  const metaCC = document.getElementById('param-meta-cc');
  if(metaCC) metaCC.value = D.metaCC||2000;
  const diaCorte = document.getElementById('param-dia-corte');
  if(diaCorte) diaCorte.value = D.diaCorte||20;
  // Mostrar resumo dos parâmetros ARCA por ciclo
  const arcaEl = document.getElementById('admin-arca-rules');
  if(arcaEl) {
    const intel = calcARCAIntelligence();
    arcaEl.innerHTML = `
      <div style="font-size:12px;color:var(--text2);line-height:1.8">
        <div>Ciclo atual: <strong style="color:${intel.cicloColor}">${intel.cicloEmoji} ${intel.cicloDesc}</strong></div>
        <div>Perfil investidor: <strong>${calcPerfilInvestidor().perfilIcon} ${calcPerfilInvestidor().perfil}</strong></div>
        <div>Alocação recomendada: A=${intel.rec.a}% · R=${intel.rec.r}% · C=${intel.rec.c}% · A2=${intel.rec.a2}%</div>
        <div>Reserva de emergência: ${D.reservaMult||6}x o custo fixo = <strong>${fmt(custoFixoMes()*(D.reservaMult||6))}</strong></div>
      </div>`;
  }
}

function salvarAdminParams() {
  const mult = parseInt(document.getElementById('param-reserva-mult')?.value)||6;
  if(mult < 1 || mult > 24) { alert('Multiplicador deve ser entre 1 e 24.'); return; }
  D.reservaMult = mult;
  D.metaCC = parseFloat(document.getElementById('param-meta-cc')?.value)||2000;
  D.diaCorte = parseInt(document.getElementById('param-dia-corte')?.value)||20;
  scheduleAutoSave(); renderAll();
  toast('Parâmetros salvos!', true, '⚙️');
}

// ── RELATÓRIO MENSAL ─────────────────────────────────────────────
function renderRelatorio() {
  const mi = getMesRefIdx();
  const mesNome = D.meses[mi]||'';
  const e = totalEMes(mi);
  const cp = calcPendenteMes(mi);
  const inv = invDisp(mi);
  const reserva = statusReserva();
  const pl = patrimonioLiquido();
  const perf = calcPerfilInvestidor();
  const dist = calcDistribuicaoInvest(inv);

  const el = document.getElementById('relatorio-content');
  if(!el) return;

  // Gastos por categoria
  const cats = {};
  D.fixas.filter(f=>{
    if(!f.ativo||(f.valor||0)<=0) return false;
    if(!f.mesInicio&&!f.mesFim) return true;
    const {m,y}=parseMes(D.meses[mi]);const anosM=y*12+m;
    const desde=f.mesInicio?parseMes(f.mesInicio):null;
    const ate=f.mesFim?parseMes(f.mesFim):null;
    return anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
  }).forEach(f=>{cats[f.cat]=(cats[f.cat]||0)+f.valor;});
  D.compras.filter(c=>c.ativo).forEach(c=>{const v=calcValsCompra(c)[mi]||0;if(v)cats[c.cat]=(cats[c.cat]||0)+v;});

  const topCats = Object.entries(cats).sort(([,a],[,b])=>b-a).slice(0,5);

  el.innerHTML = `
    <div style="background:linear-gradient(135deg,var(--accent),#60A5FA);border-radius:var(--r16);padding:24px;color:#fff;margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.8;margin-bottom:4px">📋 Relatório Mensal</div>
      <div style="font-size:26px;font-weight:800">${mesNome}</div>
      <div style="opacity:.8;font-size:12px;margin-top:4px">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>

    <!-- KPIs principais -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:20px">
      <div class="mcard mcard-pos"><div class="mlabel">💰 Receita</div><div class="mval mval-pos" style="font-size:18px">${fmt(e)}</div></div>
      <div class="mcard mcard-neg"><div class="mlabel">💸 Despesas</div><div class="mval mval-neg" style="font-size:18px">${fmt(cp.bruto)}</div></div>
      <div class="mcard ${cp.pago>0?'mcard-pos':''}"><div class="mlabel">✅ Pago</div><div class="mval ${cp.pago>0?'mval-pos':''}" style="font-size:18px">${fmt(cp.pago)}</div></div>
      <div class="mcard mcard-teal"><div class="mlabel">🚀 P/ Investir</div><div class="mval mval-teal" style="font-size:18px">${fmt(inv)}</div></div>
      <div class="mcard ${reserva.pct>=100?'mcard-pos':'mcard-warn'}"><div class="mlabel">🛡️ Reserva</div><div class="mval" style="font-size:18px;color:${reserva.pct>=100?'var(--pos)':'var(--warn)'}">${reserva.pct}%</div></div>
      <div class="mcard"><div class="mlabel">💎 Patrimônio</div><div class="mval" style="font-size:18px">${fmtK(pl.liquido)}</div></div>
    </div>

    <!-- Taxa de comprometimento -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">📊 Composição da renda</div>
      <div style="display:flex;height:12px;border-radius:99px;overflow:hidden;margin-bottom:8px">
        <div style="width:${Math.min(100,Math.round(cp.bruto/e*100))}%;background:var(--neg)"></div>
        <div style="width:${Math.min(100,Math.round(inv/e*100))}%;background:var(--teal)"></div>
        <div style="flex:1;background:var(--card3)"></div>
      </div>
      <div style="display:flex;gap:16px;font-size:11px;color:var(--text2)">
        <span>🔴 Despesas: ${Math.round(cp.bruto/e*100)}%</span>
        <span>🟢 Investimento: ${Math.round(inv/e*100)}%</span>
        <span>⬜ Livre: ${Math.max(0,100-Math.round(cp.bruto/e*100)-Math.round(inv/e*100))}%</span>
      </div>
    </div>

    <!-- Top gastos -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">🏆 Top 5 categorias de gastos</div>
      ${topCats.map(([cat,val])=>{const info=CATS[cat]||CATS.outros;const pctCat=cp.bruto>0?Math.round(val/cp.bruto*100):0;return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span>${info.icon}</span><span style="flex:1;font-size:12px">${info.label}</span><div style="width:80px;height:4px;background:var(--card3);border-radius:99px;overflow:hidden"><div style="height:4px;width:${pctCat}%;background:${info.cor}"></div></div><span style="font-size:12px;font-weight:600;min-width:80px;text-align:right">${fmt(val)}</span></div>`;}).join('')}
    </div>

    <!-- Recomendação de investimento -->
    ${dist?`<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">💡 O que fazer com ${fmt(inv)} este mês</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
        ${dist.distribuicao.map(b=>`<div style="background:var(--card2);border-radius:var(--r8);padding:10px;text-align:center"><div style="font-size:10px;color:${b.cor};font-weight:700;margin-bottom:2px">${b.label}</div><div style="font-size:16px;font-weight:700;color:${b.cor}">${fmt(b.valor)}</div></div>`).join('')}
      </div>
    </div>`:''  }

    <!-- Perfil -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:16px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">👤 Perfil financeiro</div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:28px">${perf.perfilIcon}</span>
        <div><div style="font-weight:700;color:${perf.perfilCor}">${perf.perfil.charAt(0).toUpperCase()+perf.perfil.slice(1)}</div><div style="font-size:12px;color:var(--text2)">${perf.perfilDesc}</div></div>
        <div style="margin-left:auto;text-align:right"><div style="font-size:20px;font-weight:800;color:${perf.perfilCor}">${perf.risco}/100</div><div style="font-size:10px;color:var(--text2)">Apetite a risco</div></div>
      </div>
    </div>`;
}

