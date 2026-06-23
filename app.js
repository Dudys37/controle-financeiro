
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

// ── PLANO DE APOSENTADORIA (config padrão) ────────
// Simulação de estratégia financeira real, mês a mês, rumo à renda passiva.
// Template genérico e editável pelo usuário — sem dados pessoais reais.
const DEFAULT_PLANO = {
  ativo: true,
  salario: 0,
  metaContaCorrente: 1000,
  metaRendaPassiva: 10000,
  dataInicio: 'Jul/26',
  dataFim: 'Dez/40',
  contasFonte: 'real',
  cambioUSD: 5.50,
  inflacaoAnual: 4,
  taxas: { cdi100: 1.127, cdi115: 1.296, cdi120: 1.352, fiiMensal: 0.75 },
  arca: { caixa: 70, fiis: 10, acoesBR: 5, acoesIntl: 15 },
  caixinhas: {
    saldoInicial115: 0,
    limite115: 5000,
    meta100Inicial: 30000,   // ARCA ativa quando o caixa total atinge este valor
    limite120: 10000,
    teto100: 250000
  },
  // Estrutura de contas da simulação (vazia por padrão; o usuário usa o modo 'real' que lê das Fixas/Compras)
  contas: {
    permanentes: 0,
    temporarias: [],
    variaveis: {}
  },
  // Ações BR — lista de exemplo (símbolos públicos); o cálculo real usa os ativos cadastrados em D.ativos
  acoesBR: [],
  // Ações internacionais — lista de exemplo
  acoesIntl: []
};

// ── HOBBIES & AQUISIÇÕES (config padrão) ──────────
// Categorias de hobby e wishlist semeada com seus itens reais.
const HOBBY_CATS_DEFAULT = [
  {id:'h_setup', nome:'Setup/Tech', icon:'🖥️', cor:'#6366F1'},
  {id:'h_rel',   nome:'Relógios',   icon:'⌚', cor:'#0EA5E9'},
  {id:'h_cafe',  nome:'Café',       icon:'☕', cor:'#A16207'},
  {id:'h_games', nome:'Games',      icon:'🎮', cor:'#22C55E'},
];
const DEFAULT_HOBBIES = {
  aporteMensal: 0,
  saldoFundo: 0,
  cats: HOBBY_CATS_DEFAULT,
  itens: []   // novo usuário começa sem itens; exemplos via importação de backup
};

// ── DADOS PADRÃO (novo usuário começa ZERADO — sem dados pessoais reais) ──
// DEFAULT espelha o BLANK: nenhum salário, cartão, compra ou ativo real fica no código público.
const DEFAULT = {
  saldo:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,        // indicadores de mercado (referência pública, editáveis)
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25}, metaCC:2000, diaCorte:20,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26',
         'Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27',
         'Set/27','Out/27','Nov/27','Dez/27'],
  invManual: Array(20).fill(null),
  entradas:[], fixas:[], compras:[], dividas:[], pagamentos:{}, ativos:[], cartoes:[],
  planoAposentadoria: DEFAULT_PLANO,
  metas: [], orcamentos: {}, reservaMult: 6, notasMes: {}, catsCustom: null, catsCustomEnt: null,
  hobbies: DEFAULT_HOBBIES,
  prefs: { tema:null, sidebarRecolhida:false, dashInicial:'dash', modulosFavoritos:[] },
  decisoes: []
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
  entradas:[], fixas:[], compras:[], dividas:[], pagamentos:{}, ativos:[], cartoes:[],
  planoAposentadoria: DEFAULT_PLANO,
  metas: [], orcamentos: {}, reservaMult: 6, notasMes: {}, catsCustom: null, catsCustomEnt: null,
  hobbies: { aporteMensal:0, saldoFundo:0, cats: JSON.parse(JSON.stringify(HOBBY_CATS_DEFAULT)), itens: [] },
  prefs: { tema:null, sidebarRecolhida:false, dashInicial:'dash', modulosFavoritos:[] },
  decisoes: []
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
  moradia:    {label:'Moradia',     icon:'🏠', cor:'var(--info)'},
  alimentacao:{label:'Alimentação', icon:'🍽️', cor:'var(--brand)'},
  transporte: {label:'Transporte',  icon:'🚗', cor:'var(--warn)'},
  saude:      {label:'Saúde',       icon:'💊', cor:'var(--neg)'},
  educacao:   {label:'Educação',    icon:'🎓', cor:'var(--violet)'},
  servicos:   {label:'Serviços',    icon:'📱', cor:'var(--teal)'},
  impostos:   {label:'Impostos',    icon:'📋', cor:'var(--warn)'},
  lazer:      {label:'Lazer',       icon:'🎮', cor:'#84CC16'},
  cartao:     {label:'Cartão',      icon:'💳', cor:'#EC4899'},
  outros:     {label:'Outros',      icon:'📦', cor:'#6B7280'},
};
const CATS_ENTRADA = {
  salario:    {label:'Salário',      icon:'💼', cor:'var(--brand)'},
  freelance:  {label:'Freelance',    icon:'💻', cor:'var(--violet)'},
  investimento:{label:'Investimento',icon:'📈', cor:'var(--warn)'},
  aluguel:    {label:'Aluguel',      icon:'🏠', cor:'var(--info)'},
  venda:      {label:'Venda',        icon:'🛒', cor:'var(--warn)'},
  bonus:      {label:'Bônus/13°',    icon:'🎁', cor:'#EC4899'},
  outros:     {label:'Outros',       icon:'📦', cor:'#6B7280'},
};
// Cópias imutáveis das categorias padrão (para reset de overrides)
const CATS_BASE = JSON.parse(JSON.stringify(CATS));
const CATS_ENTRADA_BASE = JSON.parse(JSON.stringify(CATS_ENTRADA));
// Aplica as categorias custom do usuário sobre as padrão (override + adições)
function applyCatsCustom(){
  Object.keys(CATS).forEach(k=>{ if(!(k in CATS_BASE)) delete CATS[k]; });
  Object.assign(CATS, JSON.parse(JSON.stringify(CATS_BASE)), (typeof D!=='undefined'&&D.catsCustom)||{});
  Object.keys(CATS_ENTRADA).forEach(k=>{ if(!(k in CATS_ENTRADA_BASE)) delete CATS_ENTRADA[k]; });
  Object.assign(CATS_ENTRADA, JSON.parse(JSON.stringify(CATS_ENTRADA_BASE)), (typeof D!=='undefined'&&D.catsCustomEnt)||{});
}
// Gera <option>s a partir de um dicionário de categorias, marcando `sel`
function optsCats(dict, sel){
  return Object.entries(dict).map(([k,v])=>`<option value="${k}"${k===sel?' selected':''}>${v.icon||'\ud83d\udce6'} ${v.label||k}</option>`).join('');
}
const ARCA = {
  colors:{A:'var(--info)',R:'var(--warn)',C:'#6B7280',A2:'var(--warn)'},
  names:{A:'A — Ações Brasileiras',R:'R — Real Estate',C:'C — Caixa',A2:'A — Ativos Internacionais'},
  desc:{
    A:'Ações da B3 — crescimento de longo prazo no mercado nacional',
    R:'Fundos Imobiliários — renda passiva e exposição ao mercado imobiliário',
    C:'Tesouro Selic, CDB, Fundos DI — liquidez imediata e proteção',
    A2:'ETFs globais, BDRs — diversificação internacional',
  },
};

// ── CHART.JS GLOBAL DEFAULTS ─────────────────────────
function applyChartDefaults() {
  if(typeof Chart === 'undefined') return;
  const textColor  = tc();
  const textLight  = tc1();
  const gridColor  = gc();
  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.font.family = 'DM Sans';
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.legend.labels.color = textColor;
  Chart.defaults.plugins.legend.labels.font = {family:'DM Sans',size:11};
  Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card2').trim()||'#1A1D27';
  Chart.defaults.plugins.tooltip.titleColor = textLight;
  Chart.defaults.plugins.tooltip.bodyColor = textColor;
  Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border2').trim()||'rgba(255,255,255,.11)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.scale.ticks.color = textColor;
  Chart.defaults.scale.grid.color = gridColor;
  // Redraw all existing charts with new colors
  Object.values(CH).forEach(ch=>{ if(ch&&ch.update) ch.update(); });
}
const CHART_COLORS=['var(--neg)','var(--warn)','var(--info)','var(--violet)','var(--warn)','var(--teal)','#84CC16','#EC4899','var(--brand)'];

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
    // Normaliza e.mes: para anual strip o ano ('Dez/26' → 'Dez'), para único mantém com ano
    if(e.tipo==='anual' && e.mes && e.mes.includes('/')) {
      e.mes = e.mes.split('/')[0]; // anual: strip year → "Dez"
    }
    // Único sem ano (legado): associa ao primeiro mês correspondente encontrado em D.meses
    // ou ao ano atual se não encontrar
    if(e.tipo==='unico' && e.mes && !e.mes.includes('/')) {
      const mesAbrev = e.mes;
      // Procura o mês correto em D.meses (ex: "Jun/26")
      const match = (d.meses||[]).find(m => m.startsWith(mesAbrev+'/'));
      if(match) {
        e.mes = match; // "Jun/26"
      } else {
        // Fallback: usa o ano atual
        const anoAtual = String(new Date().getFullYear()).slice(2);
        e.mes = `${mesAbrev}/${anoAtual}`;
      }
    }
  });
  d.fixas.forEach(f => { if(!f.cat) f.cat='outros'; if(f.ativo===undefined) f.ativo=true; if(!f.id) f.id='f'+Date.now()+Math.random(); });
  d.compras.forEach(c => { if(!c.cat) c.cat='outros'; if(c.ativo===undefined) c.ativo=true; if(!c.id) c.id='c'+Date.now()+Math.random(); if(!c.parcelas) c.parcelas=1; });
  d.cartoes.forEach(c => { if(!c.cor) c.cor='#6B7280'; if(!c.diaFechamento) c.diaFechamento=10; if(!c.diaVencimento) c.diaVencimento=17; });
  d.ativos.forEach(x => { if(!x.indice) x.indice='CDI'; if(x.pct===undefined) x.pct=100; if(!x.ticker) x.ticker=''; if(x.marco===undefined) x.marco=false; if(x.limite===undefined) x.limite=0; if(x.ordem===undefined) x.ordem=0; delete x.rentab; });
  // Atribui ordem sequencial aos marcos que ainda não têm (preserva a ordem de cadastro)
  { let o=1; d.ativos.forEach(x=>{ if(x.marco && !x.ordem) x.ordem=o++; }); }

  // ── Módulos novos (Metas, Reserva configurável, Notas, Categorias custom) ──
  if(!Array.isArray(d.metas)) d.metas = [];
  if(d.reservaMult===undefined || d.reservaMult===null) d.reservaMult = 6;
  if(typeof d.notasMes !== 'object' || d.notasMes===null) d.notasMes = {};
  if(d.catsCustom===undefined) d.catsCustom = null;
  if(d.catsCustomEnt===undefined) d.catsCustomEnt = null;
  if(!Array.isArray(d.metas)) d.metas = [];
  if(typeof d.orcamentos!=='object' || d.orcamentos===null) d.orcamentos = {};

  // ── Metas Integradas (multiárea) — compatibilidade total com metas financeiras antigas ──
  d.metas.forEach(m=>{
    if(!m.id) m.id = 'meta_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    // Mapeia nomes antigos (alvo/atual) preservando ambos
    if(m.valorAlvo==null && m.alvo!=null) m.valorAlvo = m.alvo;
    if(m.valorAtual==null && m.atual!=null) m.valorAtual = m.atual;
    if(m.valorAlvo==null || isNaN(m.valorAlvo)) m.valorAlvo = 0;
    if(m.valorAtual==null || isNaN(m.valorAtual)) m.valorAtual = 0;
    if(!m.icon) m.icon = '🎯';
    if(!m.fonte) m.fonte = 'manual';
    if(m.ativoNome==null) m.ativoNome = '';
    if(!m.cor) m.cor = '#00D4AA';
    if(m.prazo==null) m.prazo = '';
    // Campos novos da fase de Metas Integradas
    if(!m.dominio) m.dominio = 'financeiro';            // metas antigas → financeiro
    if(m.categoria==null) m.categoria = '';
    if(!m.status) m.status = 'em_andamento';
    if(!m.prioridade) m.prioridade = 'media';
    if(!m.unidade) m.unidade = 'dinheiro';             // metas antigas são financeiras
    if(m.progressoManual===undefined) m.progressoManual = null;
    if(!m.impactoFinanceiro) m.impactoFinanceiro = 'medio';
    if(m.descricao==null) m.descricao = '';
    if(m.proximosPassos==null) m.proximosPassos = '';
    if(m.observacoes==null) m.observacoes = '';
    if(m.relacionadaADecisaoId==null) m.relacionadaADecisaoId = '';
    if(m.relacionadaACompraId==null) m.relacionadaACompraId = '';
    if(!m.dataCriacao) m.dataCriacao = new Date().toISOString();
    if(m.dataAtualizacao==null) m.dataAtualizacao = m.dataCriacao;
    if(m.ativa==null) m.ativa = true;
  });

  // ── Preferências individuais do usuário (isoladas em userData/{uid}) ──
  // Distintas das configurações GLOBAIS (systemConfig). Nunca contêm dados de outros usuários.
  if(typeof d.prefs!=='object' || d.prefs===null) d.prefs = {};
  if(d.prefs.tema==null)            d.prefs.tema = null;           // null = segue o tema global/local
  if(d.prefs.sidebarRecolhida==null)d.prefs.sidebarRecolhida = false;
  if(d.prefs.dashInicial==null)     d.prefs.dashInicial = 'dash';
  if(!Array.isArray(d.prefs.modulosFavoritos)) d.prefs.modulosFavoritos = [];
  if(typeof d.prefs.relatorios!=='object' || d.prefs.relatorios===null) d.prefs.relatorios = { ultimoTipo:'mensal', ultimoPeriodo:'', secoesPadrao:[] };

  // ── Módulo de Decisões (primeiro módulo fora de finanças) ──
  if(!Array.isArray(d.decisoes)) d.decisoes = [];
  d.decisoes.forEach(dec=>{
    if(!dec.id) dec.id = 'dec_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    if(dec.titulo==null) dec.titulo = '';
    if(dec.descricao==null) dec.descricao = '';
    if(!dec.categoria) dec.categoria = 'outro';
    if(!dec.status) dec.status = 'em_analise';
    if(!dec.prioridade) dec.prioridade = 'media';
    if(dec.prazo==null) dec.prazo = '';
    if(!dec.dataCriacao) dec.dataCriacao = new Date().toISOString();
    if(dec.dataAtualizacao==null) dec.dataAtualizacao = dec.dataCriacao;
    if(dec.dataDecisao==null) dec.dataDecisao = '';
    if(dec.custoEstimado==null || isNaN(dec.custoEstimado)) dec.custoEstimado = 0;
    if(!dec.recorrencia) dec.recorrencia = 'nenhuma';
    if(dec.valorRecorrente==null || isNaN(dec.valorRecorrente)) dec.valorRecorrente = 0;
    ['impactoFinanceiro','impactoProfissional','impactoPessoal','impactoLazer'].forEach(k=>{ if(!dec[k]) dec[k]='medio'; });
    ['beneficios','riscos','alternativas','decisaoFinal','observacoes','relacionadaACompraId','relacionadaAMetaId'].forEach(k=>{ if(dec[k]==null) dec[k]=''; });
    if(dec.ativa==null) dec.ativa = true;
  });

  if(typeof d.hobbies!=='object' || d.hobbies===null) d.hobbies = JSON.parse(JSON.stringify(DEFAULT_HOBBIES));
  if(typeof d.hobbies.aporteMensal!=='number') d.hobbies.aporteMensal = 0;
  if(typeof d.hobbies.saldoFundo!=='number')   d.hobbies.saldoFundo = 0;
  if(!Array.isArray(d.hobbies.cats) || !d.hobbies.cats.length) d.hobbies.cats = JSON.parse(JSON.stringify(HOBBY_CATS_DEFAULT));
  if(!Array.isArray(d.hobbies.itens)) d.hobbies.itens = [];
  d.hobbies.itens.forEach(it=>{
    if(!it.id) it.id = 'hi'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
    if(it.preco==null || isNaN(it.preco)) it.preco = 0;
    if(it.frete==null || isNaN(it.frete)) it.frete = 0;
    if(!it.classe) it.classe = 'desejavel';
    if(!it.status) it.status = 'desejado';
    if(it.prioridade==null) it.prioridade = 99;
    if(it.fase==null) it.fase = 1;
    if(it.catId==null) it.catId = (d.hobbies.cats[0]||{}).id || 'h_setup';
    if(it.loja==null) it.loja = '';
    if(it.link==null) it.link = '';
    if(it.notas==null) it.notas = '';
    // ── Campos novos de Compras & Desejos (compatibilidade defensiva) ──
    if(it.descricao==null) it.descricao = '';
    if(!it.tipo) it.tipo = 'desejo';
    if(!it.dominio){ // infere domínio a partir da categoria antiga
      it.dominio = ({h_setup:'tecnologia', h_rel:'patrimonio', h_cafe:'lazer', h_games:'lazer'})[it.catId] || 'lazer';
    }
    if(it.custoTotal==null || isNaN(it.custoTotal)) it.custoTotal = (it.preco||0)+(it.frete||0);
    if(!it.impactoFinanceiro) it.impactoFinanceiro = 'medio';
    if(!it.impactoLazer) it.impactoLazer = (it.dominio==='lazer'||it.dominio==='experiencia')?'alto':'medio';
    if(!it.impactoProfissional) it.impactoProfissional = (it.dominio==='trabalho'||it.dominio==='carreira'||it.dominio==='estudo')?'alto':'baixo';
    if(!it.impactoPatrimonio) it.impactoPatrimonio = (it.dominio==='patrimonio')?'alto':'baixo';
    if(it.justificativa==null) it.justificativa = '';
    if(it.alternativas==null) it.alternativas = '';
    if(it.melhorMomento==null) it.melhorMomento = '';
    if(it.relacionadaAMetaId==null) it.relacionadaAMetaId = '';
    if(it.relacionadaADecisaoId==null) it.relacionadaADecisaoId = '';
    if(it.dataCriacao==null) it.dataCriacao = new Date().toISOString();
    if(it.dataAtualizacao==null) it.dataAtualizacao = it.dataCriacao;
    if(it.dataCompraPlanejada==null) it.dataCompraPlanejada = '';
    if(it.dataCompraRealizada==null) it.dataCompraRealizada = it.compradoEm || '';
    if(it.ativo==null) it.ativo = true;
  });

  // ── Plano de Aposentadoria — cria/completa com defaults (compatibilidade dados antigos) ──
  const pd = JSON.parse(JSON.stringify(DEFAULT_PLANO));
  if(!d.planoAposentadoria) {
    d.planoAposentadoria = pd;
  } else {
    const p = d.planoAposentadoria;
    // Campos escalares
    ['ativo','salario','metaContaCorrente','metaRendaPassiva','dataInicio','dataFim','contasFonte','cambioUSD','inflacaoAnual']
      .forEach(k => { if(p[k]===undefined) p[k]=pd[k]; });
    // Sub-objetos
    p.taxas     = Object.assign({}, pd.taxas,     p.taxas||{});
    p.arca      = Object.assign({}, pd.arca,      p.arca||{});
    p.caixinhas = Object.assign({}, pd.caixinhas, p.caixinhas||{});
    if(!p.contas) p.contas = pd.contas;
    else {
      if(p.contas.permanentes===undefined) p.contas.permanentes = pd.contas.permanentes;
      if(!p.contas.temporarias) p.contas.temporarias = pd.contas.temporarias;
      if(!p.contas.variaveis)   p.contas.variaveis   = pd.contas.variaveis;
    }
    if(!Array.isArray(p.acoesBR)   || !p.acoesBR.length)   p.acoesBR   = pd.acoesBR;
    if(!Array.isArray(p.acoesIntl) || !p.acoesIntl.length) p.acoesIntl = pd.acoesIntl;
  }
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
      // Suporta "Jun/26" (com ano) e "Jun" (legado sem ano — usa o ano do mês mi)
      if(e.mes.includes('/')) {
        // Formato com ano: restringe ao mês+ano exato
        const em = parseMes(e.mes);
        return em.m===m && em.y===y ? s+(e.valor||0) : s;
      }
      // Legado sem ano: compara apenas mês (comportamento original preservado)
      const mesAbrevU = e.mes;
      const mesNumU = MMAP[mesAbrevU] || 0;
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
function salarioMensal() {
  return (D.entradas||[])
    .filter(e => e.ativo && e.tipo==='mensal' && e.cat==='salario')
    .reduce((s,e) => s+(e.valor||0), 0);
}
function metaEmergencia() { return salarioMensal()*(D.reservaMult||6); }
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
const sM = m => { const p=m.split('/'); return p[0].substring(0,3)+'/'+(p[1]||''); };
const pct = (v,t) => t>0?Math.round((v/t)*100)+'%':'0%';

// ── CHART HELPERS ─────────────────────────────────
const gc = () => getComputedStyle(document.documentElement).getPropertyValue('--border').trim()||'rgba(255,255,255,.06)';
const tc = () => getComputedStyle(document.documentElement).getPropertyValue('--text2').trim()||'#8B90A7';
const tc1= () => getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#F1F2F6';
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


// Resolves a category color to something Chart.js can use
const catColor = (cat) => {
  const cor = CATS[cat]?.cor || '#6B7280';
  // If it's a CSS var, map to hex equivalent
  const varMap = {
    'var(--neg)':'#EF4444','var(--pos)':'#10B981','var(--warn)':'#F5A623',
    'var(--info)':'#38BDF8','var(--brand)':'#00D4AA','var(--violet)':'#7C6FCD',
    'var(--teal)':'#06B6D4','var(--rose)':'#F0516B','var(--amber)':'#F5A623',
  };
  return varMap[cor] || cor;
};

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
  geral:     { label:'Dashboard Geral',  section:'Visão Geral',icon:'🏠' },
  dash:      { label:'Dashboard',       section:'Análise',    icon:'📊' },
  invest:    { label:'Investimentos',   section:'Análise',    icon:'📈' },
  relatorios:{ label:'Relatórios',      section:'Análise',    icon:'📄' },
  entradas:  { label:'Entradas',        section:'Finanças',   icon:'💰' },
  carteira:  { label:'Carteira',        section:'Finanças',   icon:'💼' },
  saidas:    { label:'Saídas',          section:'Finanças',   icon:'💸' },
  faturas:   { label:'Faturas',         section:'Finanças',   icon:'✅' },
  metas:     { label:'Metas & Orçamentos', section:'Finanças', icon:'🎯' },
  perfil:    { label:'Meu Perfil',      section:'Pessoal',    icon:'👤' },
  hobbies:   { label:'Compras & Desejos', section:'Compras & Desejos', icon:'🛒' },
  decisoes:  { label:'Decisões',         section:'Decisões',  icon:'🧭' },
  admin:     { label:'Usuários',        section:'Sistema',    icon:'👥' },
  config:    { label:'Configurações',   section:'Sistema',    icon:'⚙️' },
  sysconfig: { label:'Sistema',          section:'Sistema',    icon:'🎨' },
};

let _currentRole = 'user'; // perfil ativo ('user' ou 'superadmin')

function go(id, el) {
  _activeNav = id;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.snav').forEach(t=>t.classList.remove('on'));
  const pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('on');
  else if(typeof PLACEHOLDER_MODULES==='object' && PLACEHOLDER_MODULES[id]){
    const ph=document.getElementById('page-placeholder'); if(ph) ph.classList.add('on');
  }
  const sn=document.getElementById('snav-'+id); if(sn) sn.classList.add('on');
  // Scroll to top on page change
  const mc=document.getElementById('main-content');
  if(mc) mc.scrollTop=0; else window.scrollTo(0,0);
  // Update nav breadcrumb (PAGE_META ou placeholder)
  const meta=PAGE_META[id] || (PLACEHOLDER_MODULES[id]?{section:PLACEHOLDER_MODULES[id].section,label:PLACEHOLDER_MODULES[id].titulo}:{});
  const bc=document.getElementById('nav-breadcrumb');
  if(bc) bc.textContent=`/ ${meta.section||''} / ${meta.label||id}`;
  if(typeof _syncBotnav==='function') _syncBotnav(id);
  if(typeof toggleQuickAdd==='function') toggleQuickAdd(false);
  renderPage(id);
}

function goSide(id) {
  go(id, null);
  closeSidebar();
}

// ── Onda 5: navegação inferior mobile + lançamento rápido ──
function _syncBotnav(id){
  document.querySelectorAll('.botnav-item').forEach(b=>b.classList.toggle('active', b.getAttribute('data-page')===id));
}
function toggleQuickAdd(force){
  const sheet=document.getElementById('quickadd-sheet');
  const ov=document.getElementById('quickadd-overlay');
  const fab=document.getElementById('botnav-fab');
  if(!sheet) return;
  const open = (force!==undefined) ? !!force : !sheet.classList.contains('show');
  sheet.classList.toggle('show', open);
  if(ov) ov.classList.toggle('show', open);
  if(fab) fab.classList.toggle('open', open);
}
function quickAdd(tipo){
  toggleQuickAdd(false);
  if(tipo==='entrada' && typeof abrirModalEntrada==='function') abrirModalEntrada();
  else if(tipo==='compra' && typeof abrirModalCompra==='function') abrirModalCompra();
  else if(tipo==='fixa' && typeof abrirModalFixa==='function') abrirModalFixa();
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
  const isAdmin = role==='superadmin';
  // Sidebar dinâmica: filtra itens por papel (minRole) ao re-renderizar.
  if(typeof renderSidebar==='function') renderSidebar();
  // Compatibilidade: oculta a seção admin estática, se ainda existir.
  const adminSection=document.getElementById('sidebar-admin-section');
  if(adminSection) adminSection.style.display = isAdmin?'':'none';
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
  // If currently on an admin-only page and switched to user, go to dash
  const active=document.querySelector('.page.on');
  const activeId=active?active.id.replace('page-',''):'dash';
  const adminOnly=['admin','config','sysconfig','integracoes'];
  if(!isAdmin && (adminOnly.includes(activeId) || adminOnly.includes(_activeNav))) goSide('geral');
}

function renderPage(id) {
  // Visão Geral e módulos planejados (placeholders)
  if(id==='geral')     { if(typeof renderGeralDash==='function') renderGeralDash(); return; }
  if(id==='decisoes')  { if(typeof renderDecisoes==='function') renderDecisoes(); return; }
  if(typeof PLACEHOLDER_MODULES==='object' && PLACEHOLDER_MODULES[id]) { if(typeof renderPlaceholder==='function') renderPlaceholder(id); return; }
  // Fast renders — synchronous
  if(id==='dash')      { renderDashboard(); return; }
  if(id==='faturas')   { renderFaturas(); return; }
  if(id==='entradas')  { renderEntradas(); return; }
  if(id==='carteira')  { renderCarteira(); return; }
  if(id==='saidas')    { renderSaidas(); return; }
  if(id==='metas')     { if(typeof renderMetas==='function') renderMetas(); return; }
  if(id==='hobbies')   { if(typeof renderHobbies==='function') renderHobbies(); return; }
  if(id==='relatorios'){ if(typeof renderRelatorios==='function') renderRelatorios(); return; }
  // Slightly heavier — use requestAnimationFrame to let UI update first
  if(id==='invest')    { requestAnimationFrame(()=>typeof renderInvestAtiva==='function'?renderInvestAtiva():null); return; }
  if(id==='perfil')    { requestAnimationFrame(()=>{ if(window._renderPerfil) window._renderPerfil(); }); return; }
  if(id==='admin')     { requestAnimationFrame(()=>{ if(window._renderAdmin) window._renderAdmin(); }); return; }
  if(id==='config')    { if(typeof renderConfig==='function') renderConfig(); return; }
  if(id==='sysconfig') { if(typeof renderSysConfig==='function') renderSysConfig(); return; }
}
function renderAll() {
  applyCatsCustom();
  if(typeof renderSidebar==='function') renderSidebar();
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
  if(id==='inv-aposentadoria') renderPlanoAposentadoria();
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
  // Apenas meses ativos a partir do mês de referência atual
  const mesRefIdx = getMesRefIdx();
  const mesesAtivos = getActiveMeses();
  const mesesProj = D.meses
    .map((mes, i) => ({ mes, i }))
    .filter(({ mes, i }) => i >= mesRefIdx && mesesAtivos.includes(mes));

  if(!mesesProj.length) return null;

  const totalAtivos = D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const saldoCC = D.saldo || 0;

  // Patrimônio inicial real = Saldo CC (Carteira) + Total carteira (Investimentos)
  if(totalAtivos + saldoCC === 0 && mesesProj.every(({i})=>invDisp(i)===0)) return null;

  // Taxa anual ponderada pelos ativos
  const txAnual = totalAtivos > 0
    ? D.ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/totalAtivos
    : (D.cdi12||14.65)/100;
  const txMensal = Math.pow(1+txAnual, 1/12)-1;

  let saldoInvest = totalAtivos; // parcela que rende (ativos de investimento)

  const rows = mesesProj.map(({mes, i}, rowIdx) => {
    const entradas   = totalEMes(i);
    const saidas     = totalDivBruto(i);
    const aporte     = invDisp(i);  // P/ investir (Sobra − Meta CC)
    const sobra      = entradas - saidas;
    const rendimento = Math.round(saldoInvest * txMensal);
    saldoInvest      = Math.round(saldoInvest + aporte + rendimento);
    const saldoAcum  = saldoInvest + saldoCC; // patrimônio total = investimentos + CC
    return { mes, i, entradas, saidas, sobra, aporte, rendimento, saldoAcum, isFirst: rowIdx===0 };
  });

  return { rows, txAnual, saldoCC, totalAtivos, patrimonioInicial: totalAtivos + saldoCC };
}

/* ═══════════════════════════════════════════════════
   🎯 PLANO DE APOSENTADORIA
   Simulação mês a mês da estratégia: reserva em caixinhas →
   método ARCA → ações/FIIs pagadores de dividendos → renda passiva.
   calcularPlanoAposentadoria() é PURA: lê D, não altera D.
═══════════════════════════════════════════════════ */

// Total de contas do mês na simulação (aditivo: permanentes + temporárias + variáveis)
// Monta a configuração EFETIVA do plano a partir dos dados reais do app:
// salário ← Entradas (mensais ativas) · meta CC ← Carteira (D.metaCC) ·
// ARCA/CDI/inflação ← Indicadores · saldo inicial ← Carteira de ativos · marcos ← ativos marcados como marco.
// Monta a configuração EFETIVA do plano a partir dos dados reais do app.
// Tudo é dinâmico: salário ← Entradas · meta CC ← Carteira (D.metaCC) ·
// inflação/CDI ← Indicadores · ativos e MARCOS (metas ordenadas) ← Carteira de ativos.
function _planoCfg() {
  const P = D.planoAposentadoria || {};
  // Renda mensal recorrente (Entradas → tipo "mensal" ativas)
  const salario = (D.entradas||[]).filter(e=>e.ativo && e.tipo==='mensal').reduce((s,e)=>s+(e.valor||0),0);
  // Rendimentos/dividendos mensais por classe (yield sobre saldo) — específicos do plano
  const fii    = (P.taxas && P.taxas.fiiMensal!=null) ? P.taxas.fiiMensal : 0.75;
  const divBR  = (P.divBRmensal!=null)   ? P.divBRmensal   : 0.70;
  const divIntl= (P.divIntlmensal!=null) ? P.divIntlmensal : 0.24;
  const yieldFor = b => b==='R'?fii/100 : b==='A'?divBR/100 : b==='A2'?divIntl/100 : 0;
  // Dividendos: por ativo (campo dy %/mês) quando definido; senão, padrão do bucket. RF (C) não paga dividendo.
  const divFor = a => a.bucket==='C' ? 0
    : ((a.dy!=null && a.dy!=='' && !isNaN(parseFloat(a.dy))) ? parseFloat(a.dy)/100 : yieldFor(a.bucket));
  // Renda fixa (bucket C) rende juros compostos pela taxa do próprio ativo (índice × %).
  const rfFor = a => a.bucket==='C' ? (Math.pow(1+taxaAnual(a), 1/12) - 1) : 0;
  // Todos os ativos da carteira (marco é apenas uma flag — o ativo é "os 2")
  const assets = (D.ativos||[]).map((a,i)=>({
    idx:i, nome:a.nome||'Ativo', bucket:a.bucket||'C', valor:a.valor||0,
    marco:!!a.marco, limite:a.limite||0, ordem:a.ordem||0, indice:a.indice, pct:a.pct,
    rfMensal: rfFor(a), divMensal: divFor(a), dyProprio:(a.dy!=null&&a.dy!==''), taxaAnual: taxaAnual(a)
  }));
  // Marcos = ativos com a flag marco e limite>0, na ORDEM definida pelo usuário
  const marcos = assets.filter(a=>a.marco && a.limite>0).sort((x,y)=>(x.ordem-y.ordem)||(x.idx-y.idx));
  // Carteira atual por bucket (inclui os marcos — eles têm valor real)
  const carteira = {C:0,R:0,A:0,A2:0};
  assets.forEach(a=>{ carteira[a.bucket]=(carteira[a.bucket]||0)+a.valor; });
  const carteiraTotal = assets.reduce((s,a)=>s+a.valor,0);
  // Contas/despesas projetadas (específico do plano)
  const contas = P.contas || {permanentes:0, temporarias:[], variaveis:{}};
  return {
    ativo: P.ativo!==false, salario, metaContaCorrente: D.metaCC||0,
    metaRendaPassiva: P.metaRendaPassiva||10000, dataInicio: P.dataInicio, dataFim: P.dataFim,
    inflacaoAnual: D.ipca12||4, cdiAnual: D.cdi12||14.8,
    fiiMensal: fii, divBRmensal: divBR, divIntlmensal: divIntl,
    assets, marcos, carteira, carteiraTotal, contas, contasFonte: P.contasFonte || 'real'
  };
}

// Gasto real (Fixas recorrentes + parcelas de Compras) de um mês "Mmm/aa".
// Fixas projetam para o futuro (recorrentes); Compras só dentro do horizonte cadastrado.
function gastosReaisDoMes(mesStr) {
  const cur = parseMes(mesStr); if(!cur) return 0;
  const curIdx = cur.y*12 + cur.m;
  let total = 0;
  (D.fixas||[]).forEach(f=>{
    if(!f.ativo || (f.valor||0)<=0) return;
    const desde = f.mesInicio ? parseMes(f.mesInicio) : null;
    const ate   = f.mesFim    ? parseMes(f.mesFim)    : null;
    const okIni = !desde || curIdx >= desde.y*12+desde.m;
    const okFim = !ate   || curIdx <= ate.y*12+ate.m;
    if(okIni && okFim) total += f.valor;
  });
  const idx = D.meses.indexOf(mesStr);
  if(idx>=0) (D.compras||[]).filter(c=>c.ativo).forEach(c=>{ total += (calcValsCompra(c)[idx])||0; });
  return total;
}

function contasDoMesPlano(P, mesStr) {
  // Modo automático: lê suas Fixas + Compras reais do mês
  if(P && P.contasFonte==='real') return gastosReaisDoMes(mesStr);
  // Modo manual: contas específicas do plano
  let total = (P.contas && P.contas.permanentes) || 0;
  const cur = parseMes(mesStr), curIdx = cur.y*12 + cur.m;
  ((P.contas && P.contas.temporarias) || []).forEach(t => {
    const a = parseMes(t.ini), b = parseMes(t.fim);
    if(curIdx >= a.y*12+a.m && curIdx <= b.y*12+b.m) total += (t.valor||0);
  });
  total += ((P.contas && P.contas.variaveis) || {})[mesStr] || 0;
  return total;
}

function calcularPlanoAposentadoria() {
  const C = _planoCfg();
  if(!C || C.ativo===false || !C.dataInicio || !C.dataFim) return null;
  const start = parseMes(C.dataInicio), end = parseMes(C.dataFim);
  if(!start || !end || (end.y*12+end.m) < (start.y*12+start.m)) return null;

  const cdiM = (Math.pow(1+(C.cdiAnual||0)/100, 1/12) - 1); // taxa do "sobrante" sem marco

  // Saldo inicial por ativo = valor atual na carteira
  const bal = C.assets.map(a=>a.valor);
  // Estado dos marcos (na ordem definida), data de conclusão de cada um
  const marcoState = C.marcos.map(m=>({ idx:m.idx, nome:m.nome, limite:m.limite, mes:null }));
  let residual = 0, totalInvestido = C.carteiraTotal||0, rendAcum = 0, arcaMes = null;
  const rows = []; let aposMes=null, aposMesInfl=null, metaInflNaApos=null, patrApos=null;

  let m=start.m, y=start.y, guard=0;
  while((y<end.y || (y===end.y && m<=end.m)) && guard<2400){
    guard++;
    const mesStr = mkMes(m,y);

    // 1) Rendimentos: juros (renda fixa, bucket C) compostos no saldo; dividendos (R/A/A2) sobre saldo
    let rendRF=0, divTotal=0;
    C.assets.forEach((a,i)=>{
      if(a.rfMensal>0){ const j=bal[i]*a.rfMensal; bal[i]+=j; rendRF+=j; }
      if(a.divMensal>0){ divTotal += bal[i]*a.divMensal; }
    });
    if(residual>0){ const j=residual*cdiM; residual+=j; rendRF+=j; }
    rendAcum += rendRF;

    // 2) Contas e aporte do mês
    const contas = contasDoMesPlano(C, mesStr);
    const aporteTotal = Math.max(0, (C.salario||0) - contas - (C.metaContaCorrente||0));

    // 3) Aporte preenche os marcos NA ORDEM, um por vez, até cada limite
    let rem = aporteTotal, marcoAtual = '—';
    for(const ms of marcoState){
      if(bal[ms.idx] >= ms.limite-0.005){ if(!ms.mes) ms.mes=mesStr; continue; }
      if(marcoAtual==='—') marcoAtual = ms.nome;
      if(rem<=0) break;
      const need = ms.limite - bal[ms.idx];
      const add  = Math.min(rem, need);
      bal[ms.idx] += add; rem -= add;
      if(bal[ms.idx] >= ms.limite-0.005 && !ms.mes) ms.mes = mesStr;
      if(rem<=0) break;
    }
    // 4) Sobra após todos os marcos cheios → continua no último marco (meta final); sem marcos → sobrante em caixa
    if(rem>0){
      if(marcoState.length) bal[marcoState[marcoState.length-1].idx] += rem;
      else residual += rem;
      rem = 0;
    }

    // ARCA: 1º mês em que algum ativo de risco (R/A/A2) passa a ter saldo
    if(!arcaMes && C.assets.some((a,i)=>a.bucket!=='C' && bal[i]>0)) arcaMes = mesStr;

    // 5) Totais do mês
    totalInvestido += aporteTotal;
    const buckets = {C:0,R:0,A:0,A2:0};
    C.assets.forEach((a,i)=>{ buckets[a.bucket]=(buckets[a.bucket]||0)+bal[i]; });
    buckets.C += residual;
    const outros = C.assets.reduce((s,a,i)=>s+(a.marco?0:bal[i]),0) + residual;
    const patrimonio = C.assets.reduce((s,_,i)=>s+bal[i],0) + residual + (C.metaContaCorrente||0);
    const rendaPassiva = rendRF + divTotal;

    if(!aposMes && rendaPassiva >= (C.metaRendaPassiva||Infinity)){ aposMes=mesStr; patrApos=patrimonio; }
    const yearsEl = (y-start.y) + (m-start.m)/12;
    const metaInfl = (C.metaRendaPassiva||0) * Math.pow(1+(C.inflacaoAnual||0)/100, yearsEl);
    if(!aposMesInfl && rendaPassiva >= metaInfl){ aposMesInfl=mesStr; metaInflNaApos=metaInfl; }

    rows.push({ mes:mesStr, salario:C.salario||0, contas, cc:C.metaContaCorrente||0, aporteTotal,
      marcoAtual, marcoBals: marcoState.map(ms=>bal[ms.idx]), buckets, outros,
      totalInvestido, rendRF, rendAcum, divTotal, patrimonio, rendaPassiva, metaInfl });

    m++; if(m>12){m=1;y++;}
  }
  if(!rows.length) return null;

  const hoje=new Date(), hojeIdx=hoje.getFullYear()*12+(hoje.getMonth()+1);
  let atual = rows.find(r=>{const p=parseMes(r.mes);return p.y*12+p.m===hojeIdx;})
            || rows.find(r=>{const p=parseMes(r.mes);return p.y*12+p.m>=hojeIdx;})
            || rows[0];
  const last=rows[rows.length-1];
  const ref = aposMes ? rows.find(r=>r.mes===aposMes) : last;

  const blendMensal = last.patrimonio>0 ? last.rendaPassiva/last.patrimonio : 0;
  const valorNecessario = aposMes ? patrApos : (blendMensal>0 ? (C.metaRendaPassiva||0)/blendMensal : 0);
  const pctMeta = (C.metaRendaPassiva>0)? Math.min(100,(atual.rendaPassiva/C.metaRendaPassiva)*100):0;

  // Lista de marcos na ordem do usuário + a aposentadoria (intrínseca, sempre por último)
  const marcosList = marcoState.map((ms,i)=>({ icon:'🏁', nome:ms.nome, limite:ms.limite, mes:ms.mes, ordem:i+1 }));
  marcosList.push({ icon:'🎯', nome:'Renda passiva atinge a meta mensal', limite:valorNecessario, mes:aposMes });

  const resumo = {
    patrimonioAtual:atual.patrimonio, totalInvestido:atual.totalInvestido,
    rendimentos:atual.rendAcum, dividendosMes:atual.divTotal, rendaPassivaAtual:atual.rendaPassiva,
    metaRenda:C.metaRendaPassiva||0, pctMeta, dataApos:aposMes, valorNecessario,
    patrimonioMeta:ref.patrimonio, mesAtual:atual.mes, carteiraInicial:C.carteiraTotal||0,
    rendaMensal:C.salario||0, arcaMes
  };
  return { rows, resumo, marcos:{arca:arcaMes,aposentadoria:aposMes}, marcosList,
    marcoDefs: marcoState.map(ms=>({nome:ms.nome,limite:ms.limite})),
    aposentadoria:{mes:aposMes,mesInfl:aposMesInfl,metaInflNaApos,valorNecessario}, atual, last, cfg:C };
}

let _planoYrCollapsed = null; // null = ainda não inicializado

function _planoChanged() {
  scheduleAutoSave();
  renderPlanoAposentadoria();
  renderDashAposentadoria();
}
// Atualiza um mês variável de contas da simulação
function setPlanoVar(mes, val) {
  if(!D.planoAposentadoria.contas) D.planoAposentadoria.contas = {permanentes:0,temporarias:[],variaveis:{}};
  const v = parseFloat(val);
  if(isNaN(v) || v===0) delete D.planoAposentadoria.contas.variaveis[mes];
  else D.planoAposentadoria.contas.variaveis[mes] = v;
  _planoChanged();
}
function togglePlanoYear(yr) {
  if(!_planoYrCollapsed) _planoYrCollapsed = {};
  _planoYrCollapsed[yr] = !_planoYrCollapsed[yr];
  renderPlanoAposentadoria();
}
// Navega até uma sub-aba de Investimentos (ex.: inv-indicadores, inv-carteira)
function _goInvSub(sid){
  goSide('invest');
  setTimeout(()=>{
    const b=[...document.querySelectorAll('#page-invest .stab-bar .stab')]
      .find(x=>x.getAttribute('onclick')&&x.getAttribute('onclick').includes(sid));
    if(b)b.click();
  },60);
}
// Liga/desliga a flag de marco em um ativo, atribuindo a próxima ordem ao habilitar
function toggleAtivoMarco(ai, checked){
  D.ativos[ai].marco = checked;
  if(checked && !D.ativos[ai].ordem){
    const mx = Math.max(0, ...D.ativos.filter(a=>a.marco).map(a=>a.ordem||0));
    D.ativos[ai].ordem = mx + 1;
  }
  scheduleAutoSave(); renderAtivos();
}
// Reordena marcos (ordem de investimento) trocando com o vizinho
function moverMarco(ai, dir){
  const marcos = (D.ativos||[]).map((a,i)=>({a,i}))
    .filter(o=>o.a.marco && (o.a.limite||0)>0)
    .sort((x,y)=>((x.a.ordem||0)-(y.a.ordem||0))||(x.i-y.i));
  marcos.forEach((o,k)=>{ o.a.ordem = k+1; }); // normaliza 1..n
  const pos = marcos.findIndex(o=>o.i===ai);
  const swap = pos + (dir<0?-1:1);
  if(pos<0 || swap<0 || swap>=marcos.length) return;
  const t = marcos[pos].a.ordem; marcos[pos].a.ordem = marcos[swap].a.ordem; marcos[swap].a.ordem = t;
  scheduleAutoSave(); renderPlanoAposentadoria();
}

function renderDashAposentadoria() {
  const el = document.getElementById('dash-aposentadoria');
  if(!el) return;
  const P = D.planoAposentadoria;
  if(!P || P.ativo === false) { el.innerHTML = ''; return; }
  const plano = calcularPlanoAposentadoria();
  if(!plano) { el.innerHTML = ''; return; }
  const { resumo, marcosList, atual } = plano;

  const pct = Math.round(resumo.pctMeta);
  const pctCor = pct>=100?'var(--pos)':pct>=50?'var(--warn)':'var(--info)';

  // Próximo marco ainda não atingido (relativo ao mês atual)
  const atualIdx = (()=>{ const p=parseMes(atual.mes); return p.y*12+p.m; })();
  const proximos = (marcosList||[]).filter(mo=>{
    if(!mo.mes) return true; const p=parseMes(mo.mes); return p.y*12+p.m > atualIdx;
  });
  const prox = proximos.find(mo=>mo.mes) || proximos[0] || null;

  const small = [
    { icon:'💵', label:'Caixa / renda fixa', val:fmt(atual.buckets.C), cor:'var(--text)' },
    { icon:'🏢', label:'FIIs',                val:fmt(atual.buckets.R), cor:'var(--warn)' },
    { icon:'🇧🇷', label:'Ações brasileiras',   val:fmt(atual.buckets.A), cor:'var(--info)' },
    { icon:'🌎', label:'Ações internacionais', val:fmt(atual.buckets.A2),cor:'var(--violet)' },
    { icon:'💸', label:'Dividendos do mês',    val:fmt(atual.divTotal),  cor:'var(--brand)' },
    { icon:'📈', label:'Rendimentos acum.',    val:fmt(atual.rendAcum),  cor:'var(--teal)' },
  ];

  el.innerHTML = `<div class="panel" style="margin-bottom:20px">
    <div class="panel-head">
      <span class="panel-title">🎯 Rumo à Aposentadoria</span>
      <span class="panel-badge">Renda passiva ${fmt(resumo.rendaPassivaAtual)}/mês</span>
    </div>
    <div style="padding:16px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px">
        <div><div style="font-size:11px;color:var(--text2)">Patrimônio projetado</div>
          <div style="font-size:20px;font-weight:800;color:var(--brand)">${fmtK(resumo.patrimonioAtual)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Renda passiva atual</div>
          <div style="font-size:20px;font-weight:800;color:${pctCor}">${fmt(resumo.rendaPassivaAtual)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Meta mensal</div>
          <div style="font-size:20px;font-weight:800;color:var(--text)">${fmt(resumo.metaRenda)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Aposentadoria estimada</div>
          <div style="font-size:20px;font-weight:800;color:var(--accent)">${resumo.dataApos||'—'}</div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:6px">
        <span>Progresso até a renda de ${fmt(resumo.metaRenda)}/mês</span>
        <span style="font-weight:700;color:${pctCor}">${pct}%</span>
      </div>
      <div style="height:10px;background:var(--card3);border-radius:99px;overflow:hidden;margin-bottom:14px">
        <div style="height:10px;width:${Math.min(100,pct)}%;background:linear-gradient(90deg,var(--info),${pctCor});border-radius:99px;transition:width .6s"></div>
      </div>
      ${prox?`<div style="font-size:12px;color:var(--text2);padding:8px 12px;background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);margin-bottom:14px">
        Próximo marco: <strong style="color:var(--text)">${prox.icon} ${prox.nome}</strong>${prox.mes?` · <span style="color:var(--accent);font-weight:700">${prox.mes}</span>`:''}
      </div>`:''}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
        ${small.map(s=>`<div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);padding:10px 12px">
          <div style="font-size:10px;color:var(--text2)">${s.icon} ${s.label}</div>
          <div style="font-size:15px;font-weight:700;color:${s.cor};margin-top:2px">${s.val}</div>
        </div>`).join('')}
      </div>
      <div style="margin-top:12px;text-align:right">
        <button class="btn btn-ghost" style="font-size:11px;padding:6px 12px" onclick="goSide('invest');setTimeout(()=>{const t=document.querySelector('#page-invest .stab-bar .stab.stab-apos');if(t)t.click();},60)">Ver plano completo →</button>
      </div>
    </div>
  </div>`;
}

function renderPlanoAposentadoria() {
  const P = D.planoAposentadoria;
  if(!P) return;
  const plano = calcularPlanoAposentadoria();

  // ── CONFIGURAÇÕES ──
  const cfg = document.getElementById('plano-aposentadoria-config');
  if(cfg) {
    const C = _planoCfg();
    const inp = (path,val,step='0.01',w='110px') =>
      `<input type="number" step="${step}" value="${val}" style="width:${w};text-align:right"
        onchange="${path}=parseFloat(this.value)||0;_planoChanged()">`;
    const inpTxt = (path,val) =>
      `<input type="text" value="${val||''}" placeholder="Jul/26" style="width:90px;text-align:center"
        onchange="${path}=this.value.trim();_planoChanged()">`;
    const src = (label,valor,fonte,acao) =>
      `<div class="field" style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);padding:10px 12px">
        <label class="flabel" style="display:flex;justify-content:space-between;align-items:center">
          <span>${label}</span>
          <button class="btn btn-ghost" style="height:22px;font-size:10px;padding:2px 8px" onclick="${acao}" title="Editar na origem">${fonte} ↗</button>
        </label>
        <div style="font-size:16px;font-weight:700;color:var(--text)">${valor}</div>
      </div>`;
    const cdiMensal = (Math.pow(1+(C.cdiAnual||0)/100,1/12)-1)*100;
    const arcaLblB = {C:'Caixa',R:'FIIs',A:'Ações BR',A2:'Intl'};
    // Lista de marcos (limites) lida da Carteira, na ordem definida
    const marcosResumo = C.marcos.length
      ? C.marcos.map((mk,i)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:12px;color:var(--text)"><span style="color:var(--accent);font-weight:700">${i+1}.</span> ${mk.nome} <span style="font-size:10px;color:var(--text3)">· ${arcaLblB[mk.bucket]||mk.bucket}</span></span>
          <strong style="font-size:12px;color:var(--accent)">${fmt(mk.limite)}</strong></div>`).join('')
      : `<div style="font-size:12px;color:var(--text3);padding:6px 0">Nenhum marco cadastrado. Crie um ativo na Carteira e marque 🎯 Marco com a Meta (R$).</div>`;

    cfg.innerHTML = `<div class="panel mb">
      <div class="panel-head"><span class="panel-title">⚙️ Configurações do plano</span>
        <span class="panel-badge">${C.marcos.length} marcos · ${fmt(C.carteiraTotal)} na carteira</span></div>

      <div style="padding:14px 16px 4px;font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.4px">📥 Fontes automáticas — vêm dos seus dados</div>
      <div style="padding:6px 16px 4px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px 14px">
        ${src('Renda mensal recorrente', fmt(C.salario), 'Entradas', "goSide('entradas')")}
        ${src('Meta conta corrente', fmt(C.metaContaCorrente), 'Carteira', "_goInvSub('inv-carteira')")}
        ${src('Carteira atual (saldo inicial)', fmt(C.carteiraTotal), 'Carteira', "_goInvSub('inv-carteira')")}
        ${src('CDI 12m → ' + P9(cdiMensal) + '/mês', fmtP(C.cdiAnual), 'Indicadores', "_goInvSub('inv-indicadores')")}
        ${src('Inflação (IPCA 12m)', fmtP(C.inflacaoAnual), 'Indicadores', "_goInvSub('inv-indicadores')")}
      </div>
      <div style="padding:4px 16px 10px;font-size:11px;color:var(--text3)">
        Distribuição da carteira hoje: Caixa ${fmtK(C.carteira.C)} · FIIs ${fmtK(C.carteira.R)} · Ações BR ${fmtK(C.carteira.A)} · Intl ${fmtK(C.carteira.A2)}.
      </div>

      <div style="padding:8px 16px 4px;font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-top:1px solid var(--border)">🎯 Marcos &amp; limites — lidos da Carteira</div>
      <div style="padding:6px 16px 4px;display:grid;grid-template-columns:1fr;gap:0">
        <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r8);padding:6px 14px">${marcosResumo}</div>
        <div style="font-size:11px;color:var(--text3);padding:6px 2px">
          Os limites são as <strong>Meta (R$)</strong> dos ativos marcados como 🎯 na Carteira. A ordem de investimento é definida no painel <strong>🏁 Marcos financeiros</strong> abaixo.
          <button class="btn btn-ghost" style="height:22px;font-size:10px;padding:2px 8px;margin-left:6px" onclick="_goInvSub('inv-carteira')">Editar na Carteira ↗</button>
        </div>
      </div>

      <div style="padding:8px 16px 4px;font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.4px;border-top:1px solid var(--border)">✏️ Ajustes do plano</div>
      <div style="padding:6px 16px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px 18px">
        <div class="field"><label class="flabel">Meta renda passiva /mês</label>${inp('D.planoAposentadoria.metaRendaPassiva',C.metaRendaPassiva)}</div>
        <div class="field"><label class="flabel">Data inicial</label>${inpTxt('D.planoAposentadoria.dataInicio',C.dataInicio)}</div>
        <div class="field"><label class="flabel">Data final</label>${inpTxt('D.planoAposentadoria.dataFim',C.dataFim)}</div>
        <div class="field"><label class="flabel">Fonte das contas/despesas</label>
          <select onchange="D.planoAposentadoria.contasFonte=this.value;_planoChanged()" style="width:100%">
            <option value="real"${C.contasFonte==='real'?' selected':''}>Automático — suas Fixas + Compras</option>
            <option value="manual"${C.contasFonte==='manual'?' selected':''}>Manual — contas do plano</option>
          </select></div>
        <div class="field"><label class="flabel">Rendimento FIIs (%/mês)</label>${inp('D.planoAposentadoria.taxas.fiiMensal',+C.fiiMensal.toFixed(3),'0.01')}</div>
        <div class="field"><label class="flabel">Dividendos Ações BR (%/mês)</label>${inp('D.planoAposentadoria.divBRmensal',C.divBRmensal,'0.01')}</div>
        <div class="field"><label class="flabel">Dividendos Ações Intl (%/mês)</label>${inp('D.planoAposentadoria.divIntlmensal',C.divIntlmensal,'0.01')}</div>
      </div>
      <div style="padding:0 16px 14px;font-size:11px;color:var(--text3)">
        💡 Tudo é dinâmico: o aporte mensal (renda − contas − meta CC) preenche os marcos <strong>na ordem definida</strong>, um por vez, até cada Meta. ${C.contasFonte==='real'?`As contas vêm das suas <strong>Fixas + Compras</strong> reais (mês atual: <strong>${fmt(gastosReaisDoMes(D.meses[getMesRefIdx()]||C.dataInicio))}</strong>; as fixas recorrentes projetam para o futuro).`:'As contas usam os valores manuais do plano.'} Dividendos podem ser definidos <strong>por ativo</strong> na Carteira (coluna “Div %/mês”); vazio usa o padrão do bucket.
      </div>
    </div>`;
  }

  const cardsEl = document.getElementById('plano-aposentadoria-cards');
  const marcosEl = document.getElementById('plano-aposentadoria-marcos');
  const tblEl = document.getElementById('plano-aposentadoria-tabela');

  if(!plano) {
    if(cardsEl) cardsEl.innerHTML = `<div class="empty" style="padding:24px"><div class="empty-icon">🎯</div><div class="empty-text">Revise as datas inicial/final do plano para gerar a simulação.</div></div>`;
    if(marcosEl) marcosEl.innerHTML = '';
    if(tblEl) tblEl.innerHTML = '';
    ['cPlanoPatrimonio','cPlanoClasses','cPlanoDividendos','cPlanoMeta'].forEach(dc);
    return;
  }

  const { rows, resumo, marcosList, aposentadoria } = plano;
  const pct = Math.round(resumo.pctMeta);
  const pctCor = pct>=100?'var(--pos)':pct>=50?'var(--warn)':'var(--info)';

  // ── CARDS ──
  if(cardsEl) cardsEl.innerHTML = `
    <div class="mcard mcard-pos"><div class="mlabel">💎 Patrimônio projetado</div><div class="mval mval-pos">${fmtK(resumo.patrimonioAtual)}</div><div class="msub">posição atual estimada</div></div>
    <div class="mcard mcard-teal"><div class="mlabel">🚀 Total investido</div><div class="mval mval-teal">${fmtK(resumo.totalInvestido)}</div><div class="msub">carteira (${fmtK(resumo.carteiraInicial)}) + aportes</div></div>
    <div class="mcard mcard-warn"><div class="mlabel">📈 Total de rendimentos</div><div class="mval mval-warn">${fmtK(resumo.rendimentos)}</div><div class="msub">juros da renda fixa</div></div>
    <div class="mcard mcard-pos"><div class="mlabel">💸 Dividendos mensais</div><div class="mval mval-pos">${fmt(resumo.dividendosMes)}</div><div class="msub">BR + Intl + FIIs</div></div>
    <div class="mcard"><div class="mlabel">🎯 Meta de aposentadoria</div><div class="mval">${fmt(resumo.metaRenda)}</div><div class="msub">renda passiva /mês</div></div>
    <div class="mcard ${pct>=100?'mcard-pos':pct>=50?'mcard-warn':'mcard-neg'}"><div class="mlabel">📊 % da meta atingido</div><div class="mval ${pct>=100?'mval-pos':pct>=50?'mval-warn':'mval-neg'}">${pct}%</div><div class="msub">${fmt(resumo.rendaPassivaAtual)} / ${fmt(resumo.metaRenda)}</div></div>
    <div class="mcard mcard-teal"><div class="mlabel">📅 Data estimada</div><div class="mval mval-teal" style="font-size:22px">${resumo.dataApos||'além do horizonte'}</div><div class="msub">${aposentadoria.mesInfl?'corrigida inflação: '+aposentadoria.mesInfl:'1º mês com renda ≥ meta'}</div></div>
    <div class="mcard mcard-warn"><div class="mlabel">🏦 Valor necessário</div><div class="mval mval-warn">${fmtK(resumo.valorNecessario)}</div><div class="msub">capital p/ renda de ${fmt(resumo.metaRenda)}</div></div>
  `;

  // ── MARCOS — ordenação (ordem de investimento) + timeline de progresso ──
  if(marcosEl) {
    const atualIdx = (()=>{ const p=parseMes(resumo.mesAtual); return p.y*12+p.m; })();
    const list = marcosList || [];
    const userMarcos = list.filter(mo=>mo.icon==='🏁');
    // ativos-marco na ordem atual, para os controles ▲▼ (com índice real em D.ativos)
    const ord = (D.ativos||[]).map((a,i)=>({a,i}))
      .filter(o=>o.a.marco && (o.a.limite||0)>0)
      .sort((x,y)=>((x.a.ordem||0)-(y.a.ordem||0))||(x.i-y.i));
    const mesPorNome = {}; userMarcos.forEach(mo=>{ mesPorNome[mo.nome]=mo.mes; });

    const ordenacao = ord.length ? `
      <div style="font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Ordem de investimento</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px">
        ${ord.map((o,k)=>{
          const mes = mesPorNome[o.a.nome||'Marco'];
          const arcaB={C:'Caixa',R:'FIIs',A:'Ações BR',A2:'Intl'}[o.a.bucket]||o.a.bucket;
          return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--card2);border:1px solid var(--border);border-radius:var(--r8)">
            <div style="width:22px;height:22px;border-radius:99px;background:var(--accent-bg,var(--card3));color:var(--accent);font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${k+1}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${o.a.nome||'Marco'} <span style="font-size:10px;color:var(--text3);font-weight:500">· ${arcaB}</span></div>
              <div style="font-size:11px;color:var(--text2)">Meta ${fmt(o.a.limite)}${(o.a.valor||0)>0?` · atual ${fmt(o.a.valor)}`:''}${mes?` · previsto ${mes}`:''}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              <button class="btn btn-ghost" style="height:20px;width:28px;padding:0;font-size:11px;line-height:1" ${k===0?'disabled style="opacity:.3;height:20px;width:28px;padding:0"':''} onclick="moverMarco(${o.i},-1)" title="Investir antes">▲</button>
              <button class="btn btn-ghost" style="height:20px;width:28px;padding:0;font-size:11px;line-height:1" ${k===ord.length-1?'disabled style="opacity:.3;height:20px;width:28px;padding:0"':''} onclick="moverMarco(${o.i},1)" title="Investir depois">▼</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : `<div style="font-size:12px;color:var(--text3);margin-bottom:14px;padding:10px 12px;background:var(--card2);border:1px dashed var(--border2);border-radius:var(--r8)">
        💡 Cadastre marcos em <strong>Investimentos → Carteira</strong>: crie um ativo, marque <strong>🎯 Marco</strong> e defina a <strong>Meta (R$)</strong>. Depois ordene aqui qual investir primeiro.
      </div>`;

    marcosEl.innerHTML = `<div class="panel mb">
      <div class="panel-head"><span class="panel-title">🏁 Marcos financeiros</span>
        <span class="panel-badge">${userMarcos.length} cadastrados</span></div>
      <div style="padding:16px">
        ${ordenacao}
        <div style="font-size:11px;color:var(--text2);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">Progresso previsto</div>
        <div style="display:flex;flex-direction:column;gap:0">
          ${list.map((mo,idx)=>{
            const atingido = mo.mes && (parseMes(mo.mes).y*12+parseMes(mo.mes).m) <= atualIdx;
            const futuro = !!mo.mes && !atingido;
            const semData = !mo.mes;
            const cor = atingido?'var(--pos)':futuro?'var(--accent)':'var(--text3)';
            const dot = atingido?'✓':futuro?'◷':'·';
            const isLast = idx===list.length-1;
            const meta = mo.limite>0?` · meta ${fmtK(mo.limite)}`:'';
            const num = mo.icon==='🏁'?`<span style="color:var(--accent);font-weight:700">${mo.ordem}.</span> `:'';
            return `<div style="display:flex;gap:12px">
              <div style="display:flex;flex-direction:column;align-items:center">
                <div style="width:24px;height:24px;border-radius:99px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${atingido?'var(--pos-bg)':'var(--card2)'};border:2px solid ${cor};color:${cor}">${dot}</div>
                ${!isLast?`<div style="width:2px;flex:1;min-height:22px;background:${atingido?'var(--pos)':'var(--border)'}"></div>`:''}
              </div>
              <div style="padding-bottom:${isLast?0:14}px;flex:1">
                <div style="font-size:13px;font-weight:600;color:${semData?'var(--text3)':'var(--text)'}">${num}${mo.icon} ${mo.nome}<span style="font-size:10px;color:var(--text3);font-weight:500">${meta}</span></div>
                <div style="font-size:11px;color:${cor};font-weight:700">${mo.mes?(atingido?'Atingido em '+mo.mes:'Previsto para '+mo.mes):'Fora do horizonte da simulação'}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }

  // ── GRÁFICOS ──
  renderPlanoGraficos(rows);

  // ── TABELA MÊS A MÊS (dinâmica: 1 coluna por marco, agrupada por ano) ──
  if(tblEl) {
    if(!_planoYrCollapsed) {
      _planoYrCollapsed = {};
      const anos = [...new Set(rows.map(r=>parseMes(r.mes).y))];
      anos.forEach((a,i)=>{ _planoYrCollapsed[a] = i!==0; });
    }
    const anos = [...new Set(rows.map(r=>parseMes(r.mes).y))].sort((a,b)=>a-b);
    const marcoDefs = plano.marcoDefs || [];
    const marcoCols = marcoDefs.map((md,i)=>`<th class="tr" style="white-space:nowrap;font-size:10px" title="Meta ${fmt(md.limite)}">${i+1}. ${md.nome}</th>`).join('');
    const baseHead = ['Mês','Salário','Contas','CC','Aporte','Investindo em'];
    const tailHead = ['Outros ativos','Rend. RF/mês','Rend. acum.','Dividendos/mês','Patrimônio','Renda passiva'];
    const minW = 900 + marcoDefs.length*120;

    const aposIdx = resumo.dataApos;
    const yearBlocks = anos.map(ano=>{
      const mesesAno = rows.filter(r=>parseMes(r.mes).y===ano);
      const collapsed = _planoYrCollapsed[ano];
      const fim = mesesAno[mesesAno.length-1];
      const aporteAno = mesesAno.reduce((s,r)=>s+r.aporteTotal,0);
      const divAno = mesesAno.reduce((s,r)=>s+r.divTotal,0);
      const body = collapsed ? '' : `<div class="scroll">
        <table class="tbl-wide" style="min-width:${minW}px;font-size:11px">
          <thead class="thead-sticky"><tr>
            ${baseHead.map((c,i)=>`<th class="${i===0?'':'tr'}" style="white-space:nowrap;font-size:10px">${c}</th>`).join('')}
            ${marcoCols}
            ${tailHead.map(c=>`<th class="tr" style="white-space:nowrap;font-size:10px">${c}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${mesesAno.map(r=>{
              const isApos = r.mes===aposIdx;
              const marcoTds = (r.marcoBals||[]).map((b,i)=>{
                const cheio = marcoDefs[i] && b >= (marcoDefs[i].limite-0.005);
                const ativa = r.marcoAtual===(marcoDefs[i]&&marcoDefs[i].nome);
                return `<td class="tr" style="${cheio?'color:var(--pos);font-weight:600':ativa?'color:var(--accent);font-weight:700':'color:var(--text2)'}">${fmtK(b)}</td>`;
              }).join('');
              return `<tr style="${isApos?'background:var(--brand-glow2)':''}">
                <td style="font-weight:${isApos?700:500};white-space:nowrap">${r.mes}${isApos?' 🎯':''}</td>
                <td class="tr tpos">${fmt(r.salario)}</td>
                <td class="tr tneg">${fmt(r.contas)}</td>
                <td class="tr" style="color:var(--text3)">${fmt(r.cc)}</td>
                <td class="tr tteal" style="font-weight:700">${fmt(r.aporteTotal)}</td>
                <td style="white-space:nowrap;color:var(--accent);font-size:10px">${r.marcoAtual||'—'}</td>
                ${marcoTds}
                <td class="tr" style="color:var(--text2)">${fmtK(r.outros)}</td>
                <td class="tr" style="color:var(--brand)">${fmt(r.rendRF)}</td>
                <td class="tr" style="color:var(--brand)">${fmtK(r.rendAcum)}</td>
                <td class="tr tpos" style="font-weight:600">${fmt(r.divTotal)}</td>
                <td class="tr" style="color:var(--brand);font-weight:700">${fmtK(r.patrimonio)}</td>
                <td class="tr" style="font-weight:700;color:${r.rendaPassiva>=resumo.metaRenda?'var(--pos)':'var(--text)'}">${fmt(r.rendaPassiva)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>`;
      return `<div style="margin-bottom:10px;border:1px solid var(--border);border-radius:var(--r10);overflow:hidden">
        <div onclick="togglePlanoYear(${ano})" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--card2)">
          <span style="font-size:13px;font-weight:700;color:var(--brand)">${collapsed?'▸':'▾'} ${ano}</span>
          <div style="display:flex;gap:14px;font-size:11px;color:var(--text2);flex-wrap:wrap">
            <span>Aportes: <strong style="color:var(--teal)">${fmtK(aporteAno)}</strong></span>
            <span>Dividendos: <strong style="color:var(--pos)">${fmtK(divAno)}</strong></span>
            <span>Patrimônio fim: <strong style="color:var(--brand)">${fmtK(fim.patrimonio)}</strong></span>
            <span>Renda passiva: <strong style="color:${fim.rendaPassiva>=resumo.metaRenda?'var(--pos)':'var(--text)'}">${fmt(fim.rendaPassiva)}</strong></span>
          </div>
        </div>
        ${body}
      </div>`;
    }).join('');

    tblEl.innerHTML = `<div class="panel mb">
      <div class="panel-head"><span class="panel-title">📅 Simulação mês a mês</span>
        <span class="panel-badge">${rows.length} meses · ${rows[0].mes} → ${rows[rows.length-1].mes}</span></div>
      <div style="padding:14px 16px">
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">Uma coluna por marco (na sua ordem). "Investindo em" mostra qual marco recebe o aporte do mês; quando ele atinge a Meta, o aporte passa ao próximo. 🎯 marca o mês da meta de renda passiva.</div>
        ${yearBlocks}
      </div>
    </div>`;
  }
}

function renderPlanoGraficos(rows) {
  if(typeof Chart === 'undefined') return;
  applyChartDefaults();
  const labels = rows.map(r=>r.mes);
  const meta = D.planoAposentadoria.metaRendaPassiva || 0;
  const thin = { pointRadius:0, borderWidth:2, tension:.25 };
  const xTicks = { ticks:{ color:tc(), font:{size:9}, maxRotation:0, autoSkip:true, maxTicksLimit:14,
    callback:function(v){ const l=this.getLabelForValue(v); return l&&l.startsWith('Jan')?l:''; } } };

  // 1) Patrimônio total + caixinhas
  dc('cPlanoPatrimonio');
  const c1 = document.getElementById('cPlanoPatrimonio');
  if(c1) CH['cPlanoPatrimonio'] = new Chart(c1,{type:'line',data:{labels,datasets:[
    {label:'Patrimônio total', data:rows.map(r=>r.patrimonio), borderColor:'#00D4AA', backgroundColor:'rgba(0,212,170,.12)', fill:true, ...thin},
    {label:'Caixa (renda fixa)', data:rows.map(r=>r.buckets.C), borderColor:'#38BDF8', ...thin},
    {label:'Total investido', data:rows.map(r=>r.totalInvestido), borderColor:'#7C6FCD', borderDash:[4,3], ...thin},
  ]},options:chartOpts({scales:{x:{grid:{color:gc()},...xTicks},y:{grid:{color:gc()},ticks:{color:tc(),font:{size:9},callback:v=>RK(v)}}}})});

  // 2) Evolução por classe ARCA (stacked area)
  dc('cPlanoClasses');
  const c2 = document.getElementById('cPlanoClasses');
  if(c2) CH['cPlanoClasses'] = new Chart(c2,{type:'line',data:{labels,datasets:[
    {label:'Caixa', data:rows.map(r=>r.buckets.C), borderColor:'#6B7280', backgroundColor:'rgba(107,114,128,.5)', fill:true, stack:'s', ...thin},
    {label:'FIIs', data:rows.map(r=>r.buckets.R), borderColor:'#F5A623', backgroundColor:'rgba(245,166,35,.5)', fill:true, stack:'s', ...thin},
    {label:'Ações BR', data:rows.map(r=>r.buckets.A), borderColor:'#38BDF8', backgroundColor:'rgba(56,189,248,.5)', fill:true, stack:'s', ...thin},
    {label:'Ações Intl', data:rows.map(r=>r.buckets.A2), borderColor:'#7C6FCD', backgroundColor:'rgba(124,111,205,.5)', fill:true, stack:'s', ...thin},
  ]},options:chartOpts({scales:{x:{grid:{color:gc()},...xTicks},y:{stacked:true,grid:{color:gc()},ticks:{color:tc(),font:{size:9},callback:v=>RK(v)}}}})});

  // 3) Renda passiva por origem (juros RF vs dividendos)
  dc('cPlanoDividendos');
  const c3 = document.getElementById('cPlanoDividendos');
  if(c3) CH['cPlanoDividendos'] = new Chart(c3,{type:'bar',data:{labels,datasets:[
    {label:'Juros renda fixa', data:rows.map(r=>r.rendRF), backgroundColor:'#00D4AA', stack:'d'},
    {label:'Dividendos', data:rows.map(r=>r.divTotal), backgroundColor:'#F5A623', stack:'d'},
  ]},options:chartOpts({scales:{x:{stacked:true,grid:{display:false},...xTicks},y:{stacked:true,grid:{color:gc()},ticks:{color:tc(),font:{size:9},callback:v=>RK(v)}}}})});

  // 4) Renda passiva vs meta
  dc('cPlanoMeta');
  const c4 = document.getElementById('cPlanoMeta');
  if(c4) CH['cPlanoMeta'] = new Chart(c4,{type:'line',data:{labels,datasets:[
    {label:'Renda passiva mensal', data:rows.map(r=>r.rendaPassiva), borderColor:'#00D4AA', backgroundColor:'rgba(0,212,170,.12)', fill:true, ...thin},
    {label:'Meta', data:rows.map(()=>meta), borderColor:'#EF4444', borderDash:[5,4], ...thin},
    {label:'Meta corrigida (inflação)', data:rows.map(r=>r.metaInfl), borderColor:'#F5A623', borderDash:[3,3], ...thin},
  ]},options:chartOpts({scales:{x:{grid:{color:gc()},...xTicks},y:{grid:{color:gc()},ticks:{color:tc(),font:{size:9},callback:v=>RK(v)}}}})});
}

function renderDashboard() {
  const mi = selDash >= 0 && selDash < nm() ? selDash : getMesRefIdx();
  selDash = mi;
  const mesNome = D.meses[mi]||'';
  const isRefMes = mi === getMesRefIdx();

  // Popula select de mês
  const sel = document.getElementById('dash-mes-select');
  if(sel) {
    const ativosD = getActiveMeses();
    sel.innerHTML = ativosD.map(m=>{
      const idx = D.meses.indexOf(m);
      return `<option value="${idx}" ${idx===mi?'selected':''}>${m}${idx===getMesRefIdx()?' ⬤':''}</option>`;
    }).join('');
  }

  const subtitle = document.getElementById('dash-subtitle');
  if(subtitle) subtitle.textContent = isRefMes ? `Mês de referência: ${mesNome}` : `Visualizando: ${mesNome}`;

  // ── Dados financeiros do mês selecionado ──
  const entrada  = totalEMes(mi);
  const cp       = calcPendenteMes(mi);
  const investir = invDisp(mi);
  const r        = calcInvest(mi);
  const pl       = patrimonioLiquido();
  const score    = scoreFinanceiro();
  const caixa    = caixaAtual();
  const metaE    = metaEmergencia();
  const reserva  = statusReserva();
  const pctEmerg = reserva.pct;
  const scoreCor = score>=70?'var(--brand)':score>=40?'var(--warn)':'var(--neg)';
  const tudoPago = cp.bruto>0 && cp.pendente===0;
  const fixasMes = totalFixasMes(mi);
  const varMes   = totalComprasMes(mi);
  const sobra    = entrada - cp.bruto;
  const pctComp  = entrada>0?Math.round((cp.bruto/entrada)*100):0;

  // ── Alertas ──
  const alerts = getEmptyStateAlerts();
  const alertEl = document.getElementById('dash-alerts');
  if(alertEl) alertEl.innerHTML = alerts.length ? `
    <div style="background:var(--warn-bg);border:1px solid rgba(245,158,11,.2);border-radius:var(--r12);padding:12px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:10px">
      <span style="font-size:16px;flex-shrink:0">⚠️</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--warn);margin-bottom:5px">Configure seu perfil financeiro</div>
        ${alerts.map(a=>`<div style="font-size:12px;color:var(--text2);padding:2px 0;display:flex;align-items:center;gap:7px">${a.icon} ${a.msg}</div>`).join('')}
      </div>
    </div>` : '';

  // ── HERO BANNER ──
  const hero = document.getElementById('dash-hero');
  if(hero) {
    const plCor = pl.liquido>=0?'var(--brand)':'var(--neg)';
    hero.innerHTML = `
      <div class="hero-top">
        <div style="flex:1">
          <div class="hero-label">Patrimônio líquido</div>
          <div class="hero-amount" style="color:${plCor}">${fmt(pl.liquido)}</div>
          <div class="hero-sub">${fmt(pl.ativos)} em ativos · ${mesNome}${isRefMes?' (mês atual)':''}</div>
        </div>
        <div style="display:flex;gap:10px;flex-shrink:0">
          <div class="hero-score">
            <div class="hero-score-val" style="color:${scoreCor}">${score}</div>
            <div class="hero-score-label">💚 Saúde</div>
            <div class="score-bar" style="margin-top:6px"><div class="score-bar-fill" style="width:${score}%;background:${scoreCor}"></div></div>
          </div>
          <div class="hero-score" style="${pctEmerg>=100?'border-color:rgba(0,212,170,.3)':''}">
            <div class="hero-score-val" style="color:${pctEmerg>=100?'var(--brand)':pctEmerg>=50?'var(--warn)':'var(--neg)'}">${pctEmerg}%</div>
            <div class="hero-score-label">🛡️ Reserva</div>
            <div class="score-bar" style="margin-top:6px"><div class="score-bar-fill" style="width:${pctEmerg}%;background:${pctEmerg>=100?'var(--brand)':pctEmerg>=50?'var(--warn)':'var(--neg)'}"></div></div>
          </div>
        </div>
      </div>
      <div class="hero-pills">
        <span class="hero-pill" style="color:var(--pos)">💰 ${fmt(entrada)}/mês</span>
        <span class="hero-pill" style="color:var(--neg)">💸 ${fmt(cp.bruto)} saídas</span>
        <span class="hero-pill" style="color:${sobra>=0?'var(--pos)':'var(--neg)'}">${sobra>=0?'✅':'⚠️'} Sobra ${fmt(sobra)}</span>
        <span class="hero-pill" style="color:var(--teal)">🚀 Investir ${fmt(investir)}</span>
        ${reserva.pct<100?`<span class="hero-pill" style="color:var(--warn);border-color:rgba(245,158,11,.2)">🛡️ Reserva ${fmt(reserva.falta)} p/ completar</span>`:''}
      </div>`;
  }

  // ── KPI CARDS ──
  const mc = document.getElementById('dash-mcards');
  if(mc) mc.innerHTML = `
    <div class="mcard mcard-pos">
      <div class="mlabel">💰 Entradas</div>
      <div class="mval mval-pos">${fmt(entrada)}</div>
      <div class="msub">${D.entradas.filter(e=>e.ativo).length} fonte(s) · ${mesNome}</div>
    </div>
    <div class="mcard mcard-neg">
      <div class="mlabel">💸 Saídas totais</div>
      <div class="mval mval-neg">${fmt(cp.bruto)}</div>
      <div class="msub">${pctComp}% da renda</div>
    </div>
    <div class="mcard mcard-neg" style="border-top-color:rgba(245,158,11,1)">
      <div class="mlabel">⏳ Pendente</div>
      <div class="mval" style="color:${cp.pendente>0?'var(--warn)':'var(--pos)'}">${fmt(cp.pendente)}</div>
      <div class="msub">${cp.pago>0?`✅ ${fmt(cp.pago)} pago`:'Nada pago ainda'}</div>
    </div>
    ${tudoPago
      ? `<div class="mcard" style="border-top-color:var(--pos);background:var(--pos-bg)">
           <div class="mlabel" style="color:var(--pos)">🎉 Tudo pago!</div>
           <div class="mval mval-pos" style="font-size:16px">Parabéns</div>
           <div class="msub">Faturas de ${mesNome} quitadas</div>
         </div>`
      : `<div class="mcard mcard-teal">
           <div class="mlabel">🚀 P/ investir</div>
           <div class="mval mval-teal">${fmt(investir)}</div>
           <div class="msub">${r.regra==='negativo'?'Sem sobra':r.regra==='menor_meta'?'50% da sobra':'Sobra − Meta CC'}</div>
         </div>`}`;

  // ── SAÚDE FINANCEIRA CARD (lado esquerdo da linha 2) ──
  const saudeCard = document.getElementById('dash-saude-card');
  if(saudeCard) {
    const scoreLabel = score>=70?'Ótimo 🌟':score>=40?'Regular':'Atenção ⚠️';
    const pctFixas = entrada>0?Math.round((fixasMes/entrada)*100):0;
    const pctVar   = entrada>0?Math.round((varMes/entrada)*100):0;
    const metrics = [
      { label:'Saúde financeira',   val:`${score}/100`,  sub:scoreLabel,    pct:score,    cor:scoreCor },
      { label:'Comprometimento',    val:`${pctComp}%`,   sub:`${fmt(cp.bruto)} de ${fmt(entrada)}`, pct:pctComp, cor:pctComp<=50?'var(--pos)':pctComp<=70?'var(--warn)':'var(--neg)' },
      { label:'Gastos fixos',       val:`${pctFixas}%`,  sub:`${fmt(fixasMes)}/mês fixo`, pct:pctFixas, cor:pctFixas<=40?'var(--pos)':pctFixas<=60?'var(--warn)':'var(--neg)' },
      { label:'Reserva emergência', val:`${pctEmerg}%`,  sub:`${fmt(caixa)} / ${fmt(metaE)}`, pct:pctEmerg, cor:pctEmerg>=100?'var(--brand)':pctEmerg>=50?'var(--warn)':'var(--neg)' },
    ];
    saudeCard.innerHTML = `<div class="panel" style="height:100%">
      <div class="panel-head"><span class="panel-title">❤️ Saúde financeira</span></div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:12px">
        ${metrics.map(m=>`<div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;color:var(--text2)">${m.label}</span>
            <span style="font-size:13px;font-weight:700;font-family:var(--font-mono);color:${m.cor}">${m.val}</span>
          </div>
          <div style="height:4px;background:var(--card3);border-radius:99px;overflow:hidden">
            <div style="height:4px;width:${Math.min(100,m.pct)}%;background:${m.cor};border-radius:99px;transition:width .7s var(--ease)"></div>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">${m.sub}</div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  // ── PROGRESSO FATURAS CARD (lado direito da linha 2) ──
  const faturasCard = document.getElementById('dash-faturas-card');
  if(faturasCard) {
    const pctPago = cp.bruto>0?Math.round((cp.pago/cp.bruto)*100):0;
    const pctPagoCor = pctPago===100?'var(--brand)':pctPago>50?'var(--pos)':'var(--warn)';
    // Faturas pendentes e pagas do mês
    const pag = D.pagamentos?.[mesNome]||{};
    const nPend = Object.keys(pag).length;
    faturasCard.innerHTML = `<div class="panel" style="height:100%">
      <div class="panel-head">
        <span class="panel-title">✅ Faturas de ${mesNome}</span>
        <button class="btn btn-ghost" style="height:26px;font-size:11px" onclick="goSide('faturas')">Ver todas →</button>
      </div>
      <div style="padding:16px">
        <!-- Grande indicador de progresso -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
          <div style="position:relative;width:72px;height:72px;flex-shrink:0">
            <svg width="72" height="72" viewBox="0 0 72 72" style="transform:rotate(-90deg)">
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--card3)" stroke-width="7"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="${pctPagoCor}" stroke-width="7"
                stroke-dasharray="${2*Math.PI*30}" stroke-dashoffset="${2*Math.PI*30*(1-pctPago/100)}"
                stroke-linecap="round" style="transition:stroke-dashoffset .8s var(--ease)"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-head);font-size:14px;font-weight:800;color:${pctPagoCor}">${pctPago}%</div>
          </div>
          <div>
            <div style="font-size:22px;font-weight:800;font-family:var(--font-head);color:${pctPago===100?'var(--brand)':'var(--text)'}">${tudoPago?'🎉 Tudo pago!':fmt(cp.pendente)+' pendente'}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px">Pago: ${fmt(cp.pago)} · Total: ${fmt(cp.bruto)}</div>
          </div>
        </div>
        <div style="height:6px;background:var(--card3);border-radius:99px;overflow:hidden;margin-bottom:10px">
          <div style="height:6px;width:${pctPago}%;background:${pctPagoCor};border-radius:99px;transition:width .7s var(--ease)"></div>
        </div>
        ${!tudoPago?`<button class="btn btn-pri" style="width:100%;height:36px;justify-content:center" onclick="goSide('faturas')">Pagar faturas de ${mesNome} →</button>`
          :`<div style="text-align:center;font-size:12.5px;color:var(--brand);font-weight:600;padding:6px 0">Mês quitado ✅</div>`}
      </div>
    </div>`;
  }

  // ── GRÁFICO FLUXO ──
  applyChartDefaults(); dc('cDashFluxo'); dc('cDashCats');
  const periodoEl = document.getElementById('dash-chart-period');
  const ativosChart = getActiveMeses().slice(0,12);
  if(periodoEl) periodoEl.textContent = `${ativosChart[0]||''} → ${ativosChart[ativosChart.length-1]||''}`;
  const cFluxo = document.getElementById('cDashFluxo');
  if(cFluxo) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    CH['cDashFluxo'] = new Chart(cFluxo, {
      type:'bar',
      data:{
        labels: ativosChart.map(sM),
        datasets:[
          { label:'Entradas', data:ativosChart.map(m=>totalEMes(D.meses.indexOf(m))),
            backgroundColor: 'rgba(0,212,170,.25)', borderColor:'#00D4AA', borderWidth:2,
            borderRadius:4, type:'bar' },
          { label:'Saídas', data:ativosChart.map(m=>totalDivBruto(D.meses.indexOf(m))),
            backgroundColor: 'rgba(239,68,68,.25)', borderColor:'#EF4444', borderWidth:2,
            borderRadius:4, type:'bar' },
          { label:'P/ Investir', data:ativosChart.map(m=>invDisp(D.meses.indexOf(m))),
            backgroundColor:'transparent', borderColor:'#7C6FCD', borderWidth:2,
            type:'line', tension:.4, pointRadius:3, pointBackgroundColor:'#7C6FCD' },
        ]
      },
      options:{...chartOpts(), plugins:{...chartOpts().plugins,
        annotation:{annotations:{
          box1:{type:'box',xMin:ativosChart.indexOf(mesNome)-.4,xMax:ativosChart.indexOf(mesNome)+.4,
            backgroundColor:isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)',borderColor:'transparent'}
        }}
      }}
    });
  }

  // ── GRÁFICO CATEGORIAS ──
  const cCats = document.getElementById('cDashCats');
  if(cCats) {
    const cats = {};
    D.fixas.filter(f=>{
      if(!f.ativo||(f.valor||0)<=0) return false;
      if(!f.mesInicio&&!f.mesFim) return true;
      const {m:mm,y}=parseMes(mesNome);const anosM=y*12+mm;
      const desde=f.mesInicio?parseMes(f.mesInicio):null;
      const ate=f.mesFim?parseMes(f.mesFim):null;
      return anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
    }).forEach(f=>{ cats[f.cat]=(cats[f.cat]||0)+f.valor; });
    D.compras.filter(c=>c.ativo).forEach(c=>{
      const v=calcValsCompra(c)[mi]||0;
      if(v) cats[c.cat]=(cats[c.cat]||0)+v;
    });
    const catEntries = Object.entries(cats).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a);
    if(catEntries.length) {
      CH['cDashCats'] = new Chart(cCats, {
        type:'doughnut',
        data:{
          labels: catEntries.map(([k])=>(CATS[k]?.icon||'📦')+' '+(CATS[k]?.label||k)),
          datasets:[{ data:catEntries.map(([,v])=>v),
            backgroundColor:catEntries.map(([k],i)=>catColor(k)||`hsl(${i*47},70%,60%)`),
            borderWidth:0, hoverOffset:6 }]
        },
        options:{responsive:true,maintainAspectRatio:false,cutout:'62%',
          animation:{duration:600,easing:'easeOutQuart'},
          plugins:{
            legend:{position:'right',labels:{color:tc(),font:{size:10,family:'DM Sans',weight:'500'},
              boxWidth:8,padding:10,usePointStyle:true}},
            tooltip:{backgroundColor:document.documentElement.getAttribute('data-theme')!=='light'?'#1A1D27':'#fff',
              titleColor:tc(),bodyColor:tc(),borderColor:'rgba(255,255,255,.11)',
              borderWidth:1,padding:10,cornerRadius:8,
              callbacks:{label:c=>'  '+fmt(c.raw)+' ('+Math.round(c.raw/catEntries.reduce((s,[,v])=>s+v,0)*100)+'%)'}}
          }
        }
      });
    } else {
      cCats.parentElement.innerHTML = `<div class="empty" style="padding:30px"><div class="empty-icon">🍩</div><div class="empty-text">Sem gastos em ${mesNome}</div></div>`;
    }
  }

  // ── MAIORES GASTOS ──
  const mesLabel = document.getElementById('dash-mes-ref-label');
  if(mesLabel) mesLabel.textContent = mesNome;
  renderTopGastosMes(mi);

  // ── PRÓXIMOS MESES TABELA ──
  const proxEl = document.getElementById('dash-proximos');
  if(proxEl) {
    const proxMeses = getActiveMeses().slice(0,8);
    proxEl.innerHTML = `<thead><tr>
      <th>Mês</th><th class="tr">Entradas</th><th class="tr">Saídas</th>
      <th class="tr">Sobra</th><th class="tr" style="color:var(--teal)">Investir</th>
    </tr></thead><tbody>${proxMeses.map(m=>{
      const idx=D.meses.indexOf(m);
      const e=totalEMes(idx),d=totalDivBruto(idx);
      // Sobra real = entradas - total de saídas (independente de pagamentos)
      const s=e-d;
      // P/ Investir: se todas as faturas estão pagas, mostra como já investido
      const cp=calcPendenteMes(idx);
      const mesInvestido=cp.bruto>0&&cp.pendente===0;
      const inv=invDisp(idx);
      const isAtu=idx===mi;
      return `<tr style="${isAtu?'background:var(--brand-glow2)':''}">
        <td style="font-weight:${isAtu?700:500};white-space:nowrap">
          ${m}${isAtu?` <span class="badge" style="background:var(--brand);color:#0A0B0E;font-size:9px">hoje</span>`:''}
        </td>
        <td class="tr tpos">${fmtK(e)}</td>
        <td class="tr tneg">${fmtK(d)}</td>
        <td class="tr ${s>=0?'tpos':'tneg'}">${fmtK(s)}</td>
        <td class="tr">${mesInvestido?'<span style="color:var(--brand);font-size:11px;font-weight:700">✅ Investido</span>':`<span class="tteal">${fmtK(inv)}</span>`}</td>
      </tr>`;
    }).join('')}</tbody>`;
  }

  // ── CARTÕES DE CRÉDITO ──
  const cartoesSection = document.getElementById('dash-cartoes-section');
  if(cartoesSection) {
    const temCartoes = D.cartoes.length>0;
    if(temCartoes) {
      cartoesSection.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.07em">💳 Cartões de crédito</div>
          <button class="btn btn-ghost" style="height:26px;font-size:11px" onclick="goSide('carteira')">Gerenciar →</button>
        </div>
        <div class="cc-grid" id="dash-cartoes-grid"></div>`;
      renderCartoesTo(document.getElementById('dash-cartoes-grid'), mi);
    } else {
      cartoesSection.innerHTML = '';
    }
  }

  // ── 🧠 COMO INVESTIR ESTE MÊS ──
  const arcaRecEl = document.getElementById('dash-arca-rec');
  if(arcaRecEl) {
    const dispMes = invDisp(mi); // ← usa o mês selecionado no dashboard
    const intel = calcARCAIntelligence();
    const dist = calcDistribuicaoInvest(dispMes);
    const ARCA_COLORS = {A:'#38BDF8',R:'#F5A623',C:'#00D4AA',A2:'#7C6FCD'};
    if(dispMes > 0 && dist) {
      const recAbs = {
        A:  Math.round(dispMes*(intel.rec.a/100)),
        R:  Math.round(dispMes*(intel.rec.r/100)),
        C:  Math.round(dispMes*(intel.rec.c/100)),
        A2: Math.round(dispMes*(intel.rec.a2/100))
      };
      arcaRecEl.innerHTML = `<div class="panel">
        <div class="panel-head">
          <span class="panel-title">🧠 Como investir em ${mesNome}</span>
          <span style="font-size:11px;color:var(--text2)">${intel.cicloEmoji||''} ${intel.cicloDesc||''}</span>
        </div>
        <div style="padding:14px 16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
            <div>
              <span style="font-size:15px;font-weight:700">🚀 P/ Investir: </span>
              <span style="font-size:15px;font-weight:800;color:var(--brand)">${fmt(dispMes)}</span>
              <span style="font-size:11px;color:var(--text2);margin-left:8px">(Sobra − Meta CC)</span>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${dist.fase===1?'⚠️ Fase 1 — prioridade para reserva de emergência':'✅ Fase 2 — distribuição ARCA'}</div>
            </div>
            <button class="btn btn-accent" onclick="applyARCARec(${intel.rec.a},${intel.rec.r},${intel.rec.c},${intel.rec.a2})" style="height:32px;font-size:12px">🎯 Aplicar metas ARCA</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            ${[{b:'A',l:'Ações BR'},{b:'R',l:'Real Estate'},{b:'C',l:'Caixa'},{b:'A2',l:'Internacional'}].map(x=>`
            <div style="background:var(--card2);border:1px solid ${ARCA_COLORS[x.b]}30;border-radius:var(--r10);padding:12px;text-align:center">
              <div style="font-size:10px;font-weight:700;color:${ARCA_COLORS[x.b]};text-transform:uppercase;margin-bottom:4px">${x.l}</div>
              <div style="font-size:20px;font-weight:800;color:${ARCA_COLORS[x.b]}">${fmt(recAbs[x.b])}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${intel.rec[x.b==='A2'?'a2':x.b.toLowerCase()]}%</div>
            </div>`).join('')}
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:8px">⚠️ Sugestão baseada no ciclo de juros. Não constitui assessoria de investimento.</div>
        </div>
      </div>`;
    } else {
      arcaRecEl.innerHTML = dispMes<=0 ? `<div class="panel"><div class="panel-head"><span class="panel-title">🧠 Como investir em ${mesNome}</span></div><div style="padding:14px 16px;font-size:13px;color:var(--text2)">⚠️ Sem valor disponível para investir em ${mesNome}. Despesas ≥ renda ou saldo abaixo da meta CC.</div></div>` : '';
    }
  }

  // ── PROJEÇÃO FUTURA ──
  const pf = calcPatrimonioFuturo();
  const pfEl = document.getElementById('dash-patrimonio-futuro');
  if(pfEl && pf && pf.rows.length) {
    const { rows, txAnual, saldoCC, totalAtivos, patrimonioInicial } = pf;
    const anos = [...new Set(rows.map(r=>r.mes.split('/')[1]))];
    const totAportes    = rows.reduce((s,r)=>s+r.aporte,0);
    const totRendimento = rows.reduce((s,r)=>s+r.rendimento,0);
    const ultimoSaldo   = rows[rows.length-1].saldoAcum;
    const mesAtualIdx   = getMesRefIdx();

    const summaryHtml = `
      <div style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r12);padding:12px 16px;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text2);margin-bottom:8px">📌 Base atual (dados reais)</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px">
          <span>💼 Carteira de investimentos: <strong style="color:var(--brand)">${fmt(totalAtivos)}</strong></span>
          <span>🏦 Saldo conta corrente: <strong style="color:var(--teal)">${fmt(saldoCC)}</strong></span>
          <span>💎 Patrimônio inicial: <strong style="color:var(--brand)">${fmt(patrimonioInicial)}</strong></span>
          <span>📈 Taxa: <strong>${(txAnual*100).toFixed(2)}% a.a.</strong></span>
        </div>
      </div>
      <div class="gcards" style="margin-bottom:14px">
        <div class="mcard mcard-teal"><div class="mlabel">💎 Patrimônio projetado</div><div class="mval mval-teal">${fmtK(ultimoSaldo)}</div><div class="msub">em ${rows[rows.length-1].mes}</div></div>
        <div class="mcard mcard-pos"><div class="mlabel">🚀 Total aportado</div><div class="mval mval-pos">${fmtK(totAportes)}</div><div class="msub">${rows.length} meses</div></div>
        <div class="mcard mcard-accent"><div class="mlabel">📈 Total rendimentos</div><div class="mval mval-accent">${fmtK(totRendimento)}</div><div class="msub">juros compostos</div></div>
      </div>`;

    const tableByYear = anos.map(ano => {
      const mesesAno    = rows.filter(r=>r.mes.endsWith('/'+ano));
      const totEntAno   = mesesAno.reduce((s,r)=>s+r.entradas,0);
      const totSaiAno   = mesesAno.reduce((s,r)=>s+r.saidas,0);
      const totApoAno   = mesesAno.reduce((s,r)=>s+r.aporte,0);
      const totRendAno  = mesesAno.reduce((s,r)=>s+r.rendimento,0);
      const saldoFimAno = mesesAno[mesesAno.length-1]?.saldoAcum||0;

      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:8px 14px;background:var(--card2);border-radius:var(--r10) var(--r10) 0 0;border:1px solid var(--border);border-bottom:none">
            <span style="font-size:13px;font-weight:700;color:var(--brand)">20${ano}</span>
            <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:var(--text2)">
              <span>Entradas: <strong style="color:var(--pos)">${fmtK(totEntAno)}</strong></span>
              <span>Saídas: <strong style="color:var(--neg)">${fmtK(totSaiAno)}</strong></span>
              <span>Aportes: <strong style="color:var(--teal)">${fmtK(totApoAno)}</strong></span>
              <span>Rendimentos: <strong style="color:var(--brand)">${fmtK(totRendAno)}</strong></span>
              <span>Patrimônio fim: <strong style="color:var(--brand)">${fmtK(saldoFimAno)}</strong></span>
            </div>
          </div>
          <div class="scroll">
            <table style="min-width:720px;border:1px solid var(--border);border-top:none">
              <thead>
                <tr>
                  <th style="width:80px">Mês</th>
                  <th class="tr" style="color:var(--pos)">💰 Entradas</th>
                  <th class="tr" style="color:var(--neg)">💸 Saídas</th>
                  <th class="tr">📊 Sobra</th>
                  <th class="tr" style="color:var(--teal)">🚀 P/ Investir</th>
                  <th class="tr" style="color:var(--brand)">📈 Rendimento</th>
                  <th class="tr" style="color:var(--brand)">💎 Patrimônio</th>
                </tr>
              </thead>
              <tbody>
                ${mesesAno.map(r=>{
                  const isRef = r.i === mesAtualIdx;
                  return `<tr style="${isRef?'background:var(--brand-glow2)':''}">
                    <td style="font-weight:${isRef?700:500}">
                      ${r.mes.split('/')[0]}
                      ${isRef?'<span class="badge" style="background:var(--brand);color:#0A0B0E;font-size:9px;margin-left:4px">hoje</span>':''}
                    </td>
                    <td class="tr tpos">${fmt(r.entradas)}</td>
                    <td class="tr tneg">${fmt(r.saidas)}</td>
                    <td class="tr ${r.sobra>=0?'tpos':'tneg'}">${fmt(r.sobra)}</td>
                    <td class="tr tteal">${r.aporte>0?fmt(r.aporte):'<span style="color:var(--text3)">—</span>'}</td>
                    <td class="tr" style="color:var(--brand);font-family:var(--font-mono)">${r.rendimento>0?fmt(r.rendimento):'<span style="color:var(--text3)">—</span>'}</td>
                    <td class="tr" style="color:var(--brand);font-family:var(--font-head);font-weight:700">${fmtK(r.saldoAcum)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }).join('');

    pfEl.innerHTML = `<div class="panel">
      <div class="panel-head">
        <span class="panel-title">📈 Projeção de patrimônio</span>
        <span style="font-size:10px;color:var(--text3)">a partir de ${rows[0].mes} · juros compostos mensais</span>
      </div>
      <div style="padding:14px 16px">
        ${summaryHtml}
        ${tableByYear}
        <div style="font-size:10px;color:var(--text3);padding-top:4px">⚠️ Estimativa com base nos dados cadastrados. Rendimento calculado sobre a parcela investida. Saldo CC considerado constante. Não constitui recomendação de investimento.</div>
      </div>
    </div>`;
  } else if(pfEl) {
    pfEl.innerHTML = `<div class="panel">
      <div class="panel-head"><span class="panel-title">📈 Projeção de patrimônio</span></div>
      <div class="empty" style="padding:24px">
        <div class="empty-icon">📈</div>
        <div class="empty-text">Cadastre seus ativos em Investimentos → Carteira para ver a projeção.</div>
      </div>
    </div>`;
  }

  if(pfEl && pf && pf.rows.length) {
    const { rows, txAnual } = pf;
    const anos = [...new Set(rows.map(r=>r.mes.split('/')[1]))];
    const totAportes = rows.reduce((s,r)=>s+r.aporte,0);
    const totRendimento = rows.reduce((s,r)=>s+r.rendimento,0);
    const ultimoSaldo = rows[rows.length-1].saldoAcum;
    const mesAtualIdx = getMesRefIdx();

    // Summary cards
    const summaryHtml = `
      <div class="gcards" style="margin-bottom:14px">
        <div class="mcard mcard-teal"><div class="mlabel">💎 Patrimônio final</div><div class="mval mval-teal">${fmtK(ultimoSaldo)}</div><div class="msub">em ${rows[rows.length-1].mes}</div></div>
        <div class="mcard mcard-pos"><div class="mlabel">🚀 Total aportado</div><div class="mval mval-pos">${fmtK(totAportes)}</div><div class="msub">${rows.length} meses</div></div>
        <div class="mcard mcard-accent"><div class="mlabel">📈 Total rendimentos</div><div class="mval mval-accent">${fmtK(totRendimento)}</div><div class="msub">${(txAnual*100).toFixed(1)}% a.a.</div></div>
      </div>`;

    // Month table grouped by year
    const tableByYear = anos.map(ano => {
      const mesesAno = rows.filter(r=>r.mes.endsWith('/'+ano));
      const totEntAno = mesesAno.reduce((s,r)=>s+r.entradas,0);
      const totSaiAno = mesesAno.reduce((s,r)=>s+r.saidas,0);
      const totApoAno = mesesAno.reduce((s,r)=>s+r.aporte,0);
      const totRendAno = mesesAno.reduce((s,r)=>s+r.rendimento,0);
      const saldoFimAno = mesesAno[mesesAno.length-1]?.saldoAcum||0;

      return `
        <div style="margin-bottom:16px">
          <!-- Cabeçalho do ano -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--card2);border-radius:var(--r10) var(--r10) 0 0;border:1px solid var(--border);border-bottom:none">
            <span style="font-size:13px;font-weight:700;color:var(--brand)">20${ano}</span>
            <div style="display:flex;gap:16px;font-size:11px;color:var(--text2)">
              <span>Entradas: <strong style="color:var(--pos)">${fmtK(totEntAno)}</strong></span>
              <span>Saídas: <strong style="color:var(--neg)">${fmtK(totSaiAno)}</strong></span>
              <span>Aportes: <strong style="color:var(--teal)">${fmtK(totApoAno)}</strong></span>
              <span>Rendimento: <strong style="color:var(--brand)">${fmtK(totRendAno)}</strong></span>
              <span>Saldo fim: <strong style="color:var(--brand)">${fmtK(saldoFimAno)}</strong></span>
            </div>
          </div>
          <!-- Tabela dos meses -->
          <div class="scroll">
            <table style="min-width:700px;border:1px solid var(--border);border-top:none">
              <thead>
                <tr>
                  <th style="width:80px">Mês</th>
                  <th class="tr" style="color:var(--pos)">💰 Entradas</th>
                  <th class="tr" style="color:var(--neg)">💸 Saídas</th>
                  <th class="tr">📊 Sobra</th>
                  <th class="tr" style="color:var(--teal)">🚀 P/ Investir</th>
                  <th class="tr" style="color:var(--brand)">📈 Rendimento</th>
                  <th class="tr" style="color:var(--brand)">💎 Patrimônio</th>
                </tr>
              </thead>
              <tbody>
                ${mesesAno.map(r=>{
                  const isRef = r.i === mesAtualIdx;
                  const rowBg = isRef ? 'background:var(--brand-glow2)' : '';
                  return `<tr style="${rowBg}">
                    <td style="font-weight:${isRef?700:500}">
                      ${r.mes.split('/')[0]}
                      ${isRef?'<span class="badge" style="background:var(--brand);color:#0A0B0E;font-size:9px;margin-left:4px">hoje</span>':''}
                    </td>
                    <td class="tr tpos">${fmt(r.entradas)}</td>
                    <td class="tr tneg">${fmt(r.saidas)}</td>
                    <td class="tr ${r.sobra>=0?'tpos':'tneg'}">${fmt(r.sobra)}</td>
                    <td class="tr tteal">${r.aporte>0?fmt(r.aporte):'<span style="color:var(--text3)">—</span>'}</td>
                    <td class="tr" style="color:var(--brand);font-family:var(--font-mono)">${r.rendimento>0?fmt(r.rendimento):'<span style="color:var(--text3)">—</span>'}</td>
                    <td class="tr" style="color:var(--brand);font-family:var(--font-head);font-weight:700">${fmtK(r.saldoAcum)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    }).join('');

    pfEl.innerHTML = `<div class="panel">
      <div class="panel-head">
        <span class="panel-title">📈 Projeção de patrimônio</span>
        <span style="font-size:10px;color:var(--text3)">${(txAnual*100).toFixed(2)}% a.a. · juros compostos mensais</span>
      </div>
      <div style="padding:14px 16px">
        ${summaryHtml}
        ${tableByYear}
        <div style="font-size:10px;color:var(--text3);padding-top:4px">⚠️ Estimativa com base nos dados cadastrados. Rendimentos calculados sobre o saldo acumulado. Não constitui recomendação de investimento.</div>
      </div>
    </div>`;
  } else if(pfEl) {
    pfEl.innerHTML = `<div class="panel">
      <div class="panel-head"><span class="panel-title">📈 Projeção de patrimônio</span></div>
      <div class="empty" style="padding:24px">
        <div class="empty-icon">📈</div>
        <div class="empty-text">Cadastre ativos na aba Investimentos para ver a projeção de patrimônio.</div>
      </div>
    </div>`;
  }

  // 🎯 Bloco Rumo à Aposentadoria
  renderDashAposentadoria();

  // 🩺 Saúde financeira (insights dinâmicos)
  renderInsights(mi);

  // 🎮 Resumo do fundo de hobbies
  if(typeof renderDashHobbies==='function') renderDashHobbies();
}

// ═══════════════════════════════════════════════════
//  🩺 SAÚDE FINANCEIRA — insights dinâmicos (derivados dos seus dados)
// ═══════════════════════════════════════════════════
function _gastosCatMes(mi){
  const cats={};
  (D.fixas||[]).filter(f=>f.ativo&&(f.valor||0)>0).forEach(f=>{ cats[f.cat]=(cats[f.cat]||0)+f.valor; });
  (D.compras||[]).filter(c=>c.ativo).forEach(c=>{ const v=(calcValsCompra(c)[mi])||0; if(v) cats[c.cat]=(cats[c.cat]||0)+v; });
  return cats;
}
function _gastoMes(mi){ return (totalFixasMes(mi)||0)+(totalComprasMes(mi)||0); }
function _mediaGastos(){
  let t=0,n=0; (D.meses||[]).forEach((m,i)=>{ const g=_gastoMes(i); if(g>0){t+=g;n++;} });
  return n?t/n:0;
}
// Calcula insights dinâmicos para o mês `mi` (função pura — sem DOM)
function finInsights(mi){
  const out=[]; const push=(sev,icon,titulo,msg)=>out.push({sev,icon,titulo,msg});
  const entrada=totalEMes(mi)||0, gastos=_gastoMes(mi), caixa=caixaAtual()||0, mediaG=_mediaGastos();

  // 1) Taxa de poupança do mês
  if(entrada>0){
    const sr=(entrada-gastos)/entrada, pc=Math.round(sr*100);
    if(sr<0) push('bad','📉','Gastos acima da renda',`Em ${D.meses[mi]} os gastos superaram a renda em ${fmt(gastos-entrada)}. Reveja parcelamentos.`);
    else if(sr<0.10) push('warn','💸','Taxa de poupança baixa',`Você está guardando ${pc}% da renda neste mês. Mirar 20% acelera muito suas metas.`);
    else if(sr>=0.20) push('good','🟢','Ótima taxa de poupança',`Você guarda ${pc}% da renda — acima dos 20% recomendados. Continue assim!`);
    else push('info','💰','Poupança na média',`Você poupa ${pc}% da renda. Subir para 20% é a próxima meta natural.`);
  }
  // 2) Fôlego da reserva
  if(mediaG>0){
    const meses=caixa/mediaG, alvo=D.reservaMult||6;
    if(meses<3) push('bad','🛟','Reserva curta',`Seu caixa cobre ~${meses.toFixed(1)} ${meses<2?'mês':'meses'} de gastos. O ideal é ${alvo}. Priorize a reserva antes de risco.`);
    else if(meses<alvo) push('warn','🛟','Reserva em construção',`Seu caixa cobre ~${meses.toFixed(1)} meses; a meta é ${alvo}. Faltam ~${fmt(Math.max(0,mediaG*alvo-caixa))}.`);
    else push('good','🛟','Reserva sólida',`Seu caixa cobre ~${meses.toFixed(1)} meses de gastos — acima da meta de ${alvo}.`);
  }
  // 3) Comprometimento da renda
  if(entrada>0 && gastos>0){
    const comp=gastos/entrada, pc=Math.round(comp*100);
    if(comp>0.70) push('bad','⚠️','Renda muito comprometida',`${pc}% da renda do mês já está em contas e parcelas.`);
    else if(comp>0.50) push('warn','⚠️','Renda comprometida',`${pc}% da renda do mês está em contas/parcelas. Tente manter abaixo de 50%.`);
  }
  // 4) Concentração de categoria
  const cm=_gastosCatMes(mi), totalCat=Object.values(cm).reduce((s,v)=>s+v,0);
  if(totalCat>0){
    const top=Object.entries(cm).sort(([,a],[,b])=>b-a)[0], share=top[1]/totalCat;
    if(share>0.45 && top[0]!=='cartao') push('info','🍰','Gasto concentrado',`${(CATS[top[0]]?.icon||'📦')} ${CATS[top[0]]?.label||top[0]} representa ${Math.round(share*100)}% dos gastos do mês.`);
  }
  // 5) Tendência vs mês anterior
  if(mi>0){
    const ant=_gastoMes(mi-1);
    if(ant>0 && gastos>0){
      const d=(gastos-ant)/ant;
      if(d>0.15) push('warn','📈','Gastos subindo',`Seus gastos cresceram ${Math.round(d*100)}% vs ${D.meses[mi-1]}.`);
      else if(d<-0.10) push('good','📉','Gastos em queda',`Seus gastos caíram ${Math.round(-d*100)}% vs ${D.meses[mi-1]}. Bom controle!`);
    }
  }
  // 6) Drift ARCA (carteira real vs meta)
  const bk={A:0,R:0,C:0,A2:0}; (D.ativos||[]).forEach(a=>{ bk[a.bucket]=(bk[a.bucket]||0)+(a.valor||0); });
  const totA=bk.A+bk.R+bk.C+bk.A2;
  if(totA>0 && D.arcaMeta){
    const mt=D.arcaMeta, soma=(mt.a||0)+(mt.r||0)+(mt.c||0)+(mt.a2||0)||100;
    const alvo={A:(mt.a||0)/soma,R:(mt.r||0)/soma,C:(mt.c||0)/soma,A2:(mt.a2||0)/soma};
    const at={A:bk.A/totA,R:bk.R/totA,C:bk.C/totA,A2:bk.A2/totA};
    let pior=null,dmax=0; ['A','R','C','A2'].forEach(b=>{ const dd=at[b]-alvo[b]; if(Math.abs(dd)>Math.abs(dmax)){dmax=dd;pior=b;} });
    if(pior && Math.abs(dmax)>0.10){
      const nome={A:'Ações BR',R:'FIIs',C:'Caixa',A2:'Internacionais'}[pior];
      push('info','⚖️','Carteira fora da meta ARCA',`${nome} está ${Math.round(Math.abs(dmax)*100)}pp ${dmax>0?'acima':'abaixo'} da meta. ${dmax>0?'Aporte nas outras classes para reequilibrar':'Reforce essa classe nos próximos aportes'}.`);
    }
  }
  // 7) Ritmo da aposentadoria
  try{
    const plano=calcularPlanoAposentadoria();
    if(plano && plano.resumo){
      const pm=Math.round(plano.resumo.pctMeta||0);
      if(plano.resumo.dataApos) push('good','🎯','Aposentadoria no radar',`No ritmo atual, sua renda passiva atinge a meta em ${plano.resumo.dataApos} (${pm}% hoje).`);
      else if(pm>0) push('info','🎯','Rumo à independência',`Sua renda passiva está em ${pm}% da meta mensal. Ordene seus marcos para acelerar.`);
    }
  }catch(e){}

  // 8) Orçamentos estourados no mês
  try{
    const O=orcamentoInfo(mi); const estouro=O.linhas.filter(l=>l.over);
    if(estouro.length===1) push('warn','📊','Orçamento estourado',`${estouro[0].icon} ${estouro[0].label} passou do limite: ${fmt(estouro[0].gasto)} de ${fmt(estouro[0].limite)}.`);
    else if(estouro.length>1) push('warn','📊','Orçamentos estourados',`${estouro.length} categorias passaram do limite do mês: ${estouro.slice(0,3).map(l=>l.label).join(', ')}${estouro.length>3?'…':''}.`);
  }catch(e){}
  // 9) Objetivo perto de ser concluído
  try{
    (D.metas||[]).filter(m=>(m.dominio||'financeiro')==='financeiro' && (m.unidade||'dinheiro')==='dinheiro').forEach(m=>{ const mi2=metaInfo(m); if(mi2.pct>=80 && !mi2.concluida) push('info','🎯',`Objetivo quase lá: ${escapeHTML(m.nome)}`,`${Math.round(mi2.pct)}% concluído — faltam ${fmt(mi2.faltam)}.`); });
  }catch(e){}

  const rank={bad:0,warn:1,info:2,good:3};
  out.sort((a,b)=>rank[a.sev]-rank[b.sev]);
  return { score:(typeof scoreFinanceiro==='function'?scoreFinanceiro():0), insights:out,
    metricas:{entrada,gastos,caixa,mediaGastos:mediaG} };
}
function renderInsights(mi){
  const el=document.getElementById('dash-insights'); if(!el) return;
  const R=finInsights(mi);
  const cor={bad:'var(--neg)',warn:'var(--warn)',info:'var(--info)',good:'var(--pos)'};
  const bg ={bad:'var(--neg-bg)',warn:'var(--warn-bg)',info:'var(--card2)',good:'var(--pos-bg)'};
  const score=Math.round(R.score||0), scCor=score>=70?'var(--brand)':score>=40?'var(--warn)':'var(--neg)';
  const cards=R.insights.length? R.insights.map(it=>`
    <div style="display:flex;gap:10px;align-items:flex-start;padding:11px 13px;background:${bg[it.sev]};border:1px solid ${cor[it.sev]}33;border-left:3px solid ${cor[it.sev]};border-radius:var(--r10)">
      <span style="font-size:17px;flex-shrink:0;line-height:1.2">${it.icon}</span>
      <div style="min-width:0"><div style="font-size:12.5px;font-weight:700;color:${cor[it.sev]}">${it.titulo}</div>
      <div style="font-size:12px;color:var(--text2);margin-top:1px">${it.msg}</div></div>
    </div>`).join('') :
    `<div style="font-size:12px;color:var(--text3);padding:14px;text-align:center">Cadastre entradas, contas e investimentos para receber análises automáticas aqui.</div>`;
  el.innerHTML=`<div class="panel" style="margin-bottom:20px">
    <div class="panel-head"><span class="panel-title">🩺 Saúde financeira</span>
      <span class="panel-badge" style="background:${scCor}22;color:${scCor}">Score ${score}/100</span></div>
    <div style="padding:14px 16px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:${R.insights.length?14:0}px;font-size:11px;color:var(--text3)">
        <span>Análise de <strong style="color:var(--text2)">${D.meses[mi]}</strong> · atualiza com seus dados.</span>
        <span style="margin-left:auto;display:inline-flex;align-items:center;gap:6px">Reserva-alvo:
          <input type="number" min="1" max="24" step="1" value="${D.reservaMult||6}" onchange="setReservaMult(this.value)" style="width:54px;text-align:center;height:26px"> meses</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:9px">${cards}</div>
    </div>
  </div>`;
}
function setReservaMult(v){
  const n=Math.max(1,Math.min(24,parseInt(v)||6));
  D.reservaMult=n; scheduleAutoSave(); renderDashboard();
}

// Renderiza lista de gastos para o dashboard
function renderTopGastosMes(mi) {
  const el = document.getElementById('dash-top-gastos');
  if(!el) return;
  const mesNome = D.meses[mi]||'';
  const gastos = [];
  D.fixas.filter(f=>{
    if(!f.ativo||(f.valor||0)<=0) return false;
    if(!f.mesInicio&&!f.mesFim) return true;
    const {m:mm,y}=parseMes(mesNome);const anosM=y*12+mm;
    const desde=f.mesInicio?parseMes(f.mesInicio):null;
    const ate=f.mesFim?parseMes(f.mesFim):null;
    return anosM>=(desde?desde.y*12+desde.m:-Infinity)&&anosM<=(ate?ate.y*12+ate.m:Infinity);
  }).forEach(f=>{ gastos.push({nome:f.nome,valor:f.valor,cat:f.cat,tipo:'Fixo'}); });
  D.compras.filter(c=>c.ativo).forEach(c=>{
    const v=calcValsCompra(c)[mi]||0;
    if(v>0) gastos.push({nome:c.nome,valor:v,cat:c.cat,tipo:'Var',cartao:c.cartao});
  });
  if(!gastos.length){
    el.innerHTML=`<div class="empty" style="padding:20px"><div class="empty-icon" style="font-size:22px">📭</div><div class="empty-text">Nenhum gasto em ${mesNome}</div></div>`;
    return;
  }
  const totalM=gastos.reduce((s,g)=>s+g.valor,0);
  let rows='';
  gastos.sort((a,b)=>b.valor-a.valor).slice(0,7).forEach(g=>{
    const info=CATS[g.cat]||CATS.outros;
    const pctVal=totalM>0?Math.round((g.valor/totalM)*100):0;
    rows += `<div style="display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border)">
      <span style="font-size:16px">${info.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.nome}</div>
        <div style="font-size:10px;color:var(--text3)">${info.label}${g.cartao?' · '+g.cartao:''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:700;color:var(--neg);font-family:var(--font-mono)">${fmt(g.valor)}</div>
        <div style="height:2px;width:${Math.max(6,pctVal)}px;background:${info.cor||'var(--neg)'};border-radius:99px;margin-left:auto;margin-top:3px;transition:width .5s"></div>
      </div>
    </div>`;
  });
  if(gastos.length>7) rows+=`<div style="padding:8px 16px;font-size:11px;color:var(--text3)">+${gastos.length-7} outros itens</div>`;
  rows+=`<div style="padding:10px 16px;display:flex;justify-content:space-between;background:var(--card2)"><span style="font-size:12px;font-weight:700;color:var(--text2)">Total</span><span style="font-size:14px;font-weight:700;color:var(--neg);font-family:var(--font-mono)">${fmt(totalM)}</span></div>`;
  el.innerHTML = rows;
}

// renderGeral e renderMes → agora são renderDashboard
function renderGeral() { renderDashboard(); }
function renderMes()   { renderDashboard(); }

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
  const scoreCor  = score>=70 ? 'var(--brand)' : score>=40 ? 'var(--warn)' : 'var(--neg)';
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

function buildMonths(cid,sel,cb){const el=document.getElementById(cid);if(!el)return;const ativos=getActiveMeses();el.innerHTML=ativos.map((m)=>{const i=D.meses.indexOf(m);return`<button class="msb${i===sel?' on':''}" onclick="(${cb.toString()})(${i})">${sM(m)}</button>`;}).join('');}

// Helper: build a month dropdown select
function buildMesSelect(elId, valorAtual, onChangeFn, labelTodos) {
  const el = document.getElementById(elId);
  if(!el) return;
  const ativos = getActiveMeses();
  const opts = (labelTodos ? `<option value="">${labelTodos}</option>` : '') +
    ativos.map(m => `<option value="${m}" ${m===valorAtual?'selected':''}>${m}</option>`).join('');
  el.innerHTML = opts;
  el.onchange = function(){ onChangeFn(this.value); };
}

// ── ENTRADAS ──────────────────────────────────────
function renderEntradas() {
  // Dropdown de mês
  const filtroEl=document.getElementById('entradas-filtro');
  if(filtroEl) {
    const ativosE=getActiveMeses();
    const mesRef = D.meses[getMesRefIdx()]||'';
    if(!selEntradas && mesRef) selEntradas = mesRef; // default = mês atual
    filtroEl.innerHTML = `<select id="entradas-mes-sel" style="padding:7px 32px 7px 14px;border-radius:var(--rfull);background:var(--card2);border:1px solid var(--border2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer;appearance:none;min-width:130px">
      <option value="">Todos os meses</option>
      ${ativosE.map(m=>`<option value="${m}" ${selEntradas===m?'selected':''}>${m}</option>`).join('')}
    </select>`;
    document.getElementById('entradas-mes-sel').onchange = function(){ selEntradas=this.value; renderEntradas(); };
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
          // e.mes pode ser "Jun/26" (com ano) ou "Jun" (legado sem ano)
          if(e.mes.includes('/')) {
            const em=parseMes(e.mes);
            const {m,y}=parseMes(selEntradas);
            return em.m===m && em.y===y;
          }
          const mesAbrev2=e.mes;const mn=MMAP[mesAbrev2]||0;const{m}=parseMes(selEntradas);return mn===m;
        })());
    if(!visivel) return '';
    const MNAMES={'Jan':'Janeiro','Fev':'Fevereiro','Mar':'Março','Abr':'Abril','Mai':'Maio','Jun':'Junho','Jul':'Julho','Ago':'Agosto','Set':'Setembro','Out':'Outubro','Nov':'Novembro','Dez':'Dezembro'};
    const mesAbrevDisplay = e.mes&&e.mes.includes('/') ? e.mes.split('/')[0] : e.mes;
    const mesInfo=e.tipo!=='mensal'&&e.mes?(e.tipo==='anual'?` · todo ${MNAMES[mesAbrevDisplay]||e.mes}`:` · ${MNAMES[mesAbrevDisplay]||e.mes} ${e.mes.includes('/')?'de 20'+e.mes.split('/')[1]:''}`.trim()):'';;
    return `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r12);margin-bottom:8px;${!e.ativo?'opacity:.5':''}transition:all .15s" onmouseenter="this.style.borderColor='var(--border2)'" onmouseleave="this.style.borderColor='var(--border)'">
      <span style="font-size:22px">${info.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:14px">${escapeHTML(e.nome)} ${tipoBadge}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:2px">${info.label}${e.dia?` · Dia ${e.dia}`:''}${mesInfo}</div>
      </div>
      <div style="text-align:right;min-width:120px">
        <div style="font-size:20px;font-weight:700;color:var(--pos)">${fmt(e.valor)}</div>
        <div style="font-size:10px;color:var(--text2)">${e.tipo==='mensal'?'todo mês':e.tipo==='anual'?`todo ano em ${MNAMES[e.mes]||e.mes||'—'}`:e.mes?`em ${e.mes}`:'ocorrência única'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarEntrada(${ei})" title="Editar">✏️</button>
        <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="duplicarEntrada(${ei})" title="Duplicar">📋</button>
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
  { const _s=document.getElementById('me-cat'); if(_s) _s.innerHTML=optsCats(CATS_ENTRADA, e.cat||'salario'); }
  document.getElementById('me-cat').value=e.cat||'salario';
  // Para anual/unico: restaura mês
  const mesAbrev = e.mes&&e.mes.includes('/') ? e.mes.split('/')[0] : (e.mes||'');
  const mesAno   = e.mes&&e.mes.includes('/') ? '20'+e.mes.split('/')[1] : String(new Date().getFullYear());
  document.getElementById('me-mes').value = mesAbrev;
  // Popular anos no select de único
  const anoSel = document.getElementById('me-ano-unico');
  if(anoSel) {
    anoSel.innerHTML = getYears().map(yr=>`<option value="${yr}" ${String(yr)===mesAno?'selected':''}>${yr}</option>`).join('');
  }
  toggleEntradaMes();
  document.getElementById('btn-salvar-entrada').onclick=()=>salvarEntrada(ei);
}
function editarEntrada(ei){abrirModalEntrada(ei);}
function toggleEntradaMes() {
  const tipo=document.getElementById('me-tipo').value;
  const mesField=document.getElementById('me-mes-field');
  if(!mesField) return;
  mesField.style.display = tipo!=='mensal' ? '' : 'none';
  // Mostrar/ocultar seletor de ano (só para único)
  const anoSel = document.getElementById('me-ano-unico');
  const label  = document.getElementById('me-mes-label');
  const hint   = document.getElementById('me-mes-hint');
  if(anoSel) anoSel.style.display = tipo==='unico' ? '' : 'none';
  if(label) label.textContent = tipo==='unico' ? 'Mês e ano de ocorrência' : 'Mês de ocorrência (se repete todo ano)';
  if(hint)  hint.textContent  = tipo==='unico' ? 'Entrada única: ocorre apenas neste mês/ano específico.' : 'Entrada anual: ocorre todo ano neste mês.';
}
function salvarEntrada(ei) {
  const nome=document.getElementById('me-nome').value.trim();
  const valor=parseFloat(document.getElementById('me-valor').value)||0;
  const tipo=document.getElementById('me-tipo').value;
  const dia=parseInt(document.getElementById('me-dia').value)||1;
  const cat=document.getElementById('me-cat').value;
  const mesAbrev=document.getElementById('me-mes').value;
  if(!nome){uiAlert('Informe o nome da entrada.',{icon:'💰'});return;}
  let mes = '';
  if(tipo==='anual') {
    mes = mesAbrev; // só mês, sem ano
  } else if(tipo==='unico') {
    const anoSel = document.getElementById('me-ano-unico');
    const ano = anoSel ? anoSel.value : String(new Date().getFullYear());
    // Guarda "Jun/26" — mês+ano para ser único
    mes = mesAbrev ? `${mesAbrev}/${String(ano).slice(2)}` : '';
  }
  const obj={id:ei>=0?D.entradas[ei].id:genId('e'),nome,valor,tipo,dia,cat,mes,ativo:true};
  if(ei>=0) D.entradas[ei]=obj; else D.entradas.push(obj);
  fecharModalEntrada(); scheduleAutoSave(); renderEntradas(); renderAll();
  toast('Entrada salva!', true, '💰');
}
function fecharModalEntrada(){document.getElementById('modal-entrada-overlay').style.display='none';}
function toggleEntrada(ei){D.entradas[ei].ativo=!D.entradas[ei].ativo;scheduleAutoSave();renderEntradas();}
async function removerEntrada(ei){if(!await uiConfirm(`Remover <strong>"${D.entradas[ei].nome}"</strong>?`,{icon:'💰',okText:'Remover'}))return;D.entradas.splice(ei,1);scheduleAutoSave();renderEntradas();renderAll();toast('Entrada removida',true,'🗑️');}

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
    const barCor = pctUsado===null?'#6B7280':pctUsado>=80?'var(--neg)':pctUsado>=50?'var(--warn)':'var(--brand)';
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
      <div class="cc-parcelas">${itens.map(c=>`<span class="cc-chip-sml">${escapeHTML(c.nome)}: ${fmtK(calcValsCompra(c)[i])}</span>`).join('')}</div>
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
  const scoreCor=score>=70?'var(--brand)':score>=40?'var(--warn)':'var(--neg)';
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
    <div class="pstat"><span class="pstat-label">Renda mensal (mês 1)</span><strong style="color:var(--brand)">${fmt(e0)}</strong></div>
    <div class="pstat"><span class="pstat-label">Saldo conta corrente</span><strong>${fmt(D.saldo)}</strong></div>
    <div class="pstat"><span class="pstat-label">Meta conta corrente</span><strong style="color:var(--teal)">${fmt(D.metaCC)}</strong></div>
    <div class="pstat"><span class="pstat-label">Patrimônio líquido</span><strong style="color:${pl.liquido>=0?'var(--teal)':'var(--neg)'}">${fmt(pl.liquido)}</strong></div>
    <div class="pstat"><span class="pstat-label">Score financeiro</span><strong style="color:${scoreCor}">${score}/100</strong></div>
  `;

  // Tabela cartões
  const ct=document.getElementById('cartoes-tbl');
  if(ct){
    const rows=D.cartoes.map((c,ci)=>`<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${c.cor||'#888'}"></div>
        <input type="text" value="${attr(c.nome)}" onchange="D.cartoes[${ci}].nome=this.value;scheduleAutoSave()" style="font-weight:600;min-width:100px">
      </div></td>
      <td><select onchange="D.cartoes[${ci}].bandeira=this.value;scheduleAutoSave()">${['Mastercard','Visa','Elo','Amex','Hipercard'].map(b=>`<option${c.bandeira===b?' selected':''}>${b}</option>`).join('')}</select></td>
      <td><input type="number" step="100" value="${c.limite||0}" onchange="D.cartoes[${ci}].limite=parseFloat(this.value)||0;scheduleAutoSave()" style="text-align:right"></td>
      <td><input type="number" min="1" max="31" value="${c.diaFechamento||10}" onchange="D.cartoes[${ci}].diaFechamento=parseInt(this.value)||10;scheduleAutoSave()" style="width:60px;text-align:center" title="Dia de fechamento da fatura"></td>
      <td><input type="number" min="1" max="31" value="${c.diaVencimento||17}" onchange="D.cartoes[${ci}].diaVencimento=parseInt(this.value)||17;scheduleAutoSave()" style="width:60px;text-align:center" title="Dia de vencimento"></td>
      <td><button class="btn-rm" onclick="removeCartao(${ci})">✕</button></td>
    </tr>`).join('');
    ct.innerHTML=`<thead><tr><th>Nome</th><th>Bandeira</th><th class="tr">Limite (R$)</th><th>Fechamento</th><th>Vencimento</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

}
function addCartao()    { D.cartoes.push({nome:'Novo Cartão',bandeira:'Mastercard',limite:0,cor:'#6B7280',diaFechamento:10,diaVencimento:17}); renderCarteira(); scheduleAutoSave(); }
async function removeCartao(i){ if(!await uiConfirm(`Remover o cartão <strong>"${D.cartoes[i].nome}"</strong>?`,{icon:'💳',okText:'Remover'}))return; D.cartoes.splice(i,1); renderCarteira(); scheduleAutoSave(); toast('Cartão removido',true,'🗑️'); }

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
    const mesRef2 = D.meses[getMesRefIdx()]||'';
    if(!selSaidasMes && mesesPendentes.includes(mesRef2)) selSaidasMes = mesRef2;
    filtroEl.innerHTML = `<select id="saidas-mes-sel" style="padding:7px 32px 7px 14px;border-radius:var(--rfull);background:var(--card2);border:1px solid var(--border2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer;appearance:none;min-width:130px">
      <option value="">Todos os meses</option>
      ${mesesPendentes.map(m=>`<option value="${m}" ${selSaidasMes===m?'selected':''}>${m}</option>`).join('')}
    </select>`;
    document.getElementById('saidas-mes-sel').onchange = function(){ selSaidasMes=this.value; renderSaidasVar(); };
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
            <span style="font-weight:700;font-size:14px">${escapeHTML(c.nome)}</span>
            <span class="badge badge-var">Variável</span>
            ${c.cartao?`<span class="badge" style="background:var(--card3);color:var(--text2)">💳 ${escapeHTML(c.cartao)}</span>`:''}
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
          <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="editarCompra(${ci})" title="Editar">✏️</button>
          <button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="duplicarCompra(${ci})" title="Duplicar">📋</button>
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
  { const _s=document.getElementById('mf-cat'); if(_s) _s.innerHTML=optsCats(CATS, f.cat||'outros'); }
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
  if(!nome){uiAlert('Informe o nome.',{icon:'✏️'});return;}
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
async function removerFixa(fi){if(!await uiConfirm(`Remover <strong>"${D.fixas[fi].nome}"</strong>?`,{icon:'📌',okText:'Remover'}))return;D.fixas.splice(fi,1);scheduleAutoSave();renderSaidasFixas();renderAll();toast('Conta fixa removida',true,'🗑️');}

// Estado das parcelas editáveis no modal
let _parcelasVals = []; // valores individuais de cada parcela
let _parcelasCustom = false; // flag: true = valores foram carregados do custom, não redistribuir
let _editandoCI = null; // índice da compra sendo editada (null = nova)

function abrirModalCompra(ci=-1) {
  _editandoCI = ci >= 0 ? ci : null; // rastreia qual compra está sendo editada
  const c=ci>=0?D.compras[ci]:{nome:'',cat:'cartao',cartao:'',valor:0,parcelas:1,dataCompra:new Date().toISOString().slice(0,10),ativo:true};
  document.getElementById('modal-compra-overlay').style.display='flex';
  document.getElementById('mc-nome').value=c.nome;
  { const _s=document.getElementById('mc-cat'); if(_s) _s.innerHTML=optsCats(CATS, c.cat||'cartao'); }
  document.getElementById('mc-cat').value=c.cat||'cartao';
  document.getElementById('mc-cartao').innerHTML='<option value="">— Sem cartão (débito/pix) —</option>'+D.cartoes.map(ct=>`<option value="${attr(ct.nome)}"${c.cartao===ct.nome?' selected':''}>${escapeHTML(ct.nome)}</option>`).join('');
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
  if(!nome){uiAlert('Informe o nome.',{icon:'✏️'});return;}
  // Usa soma das parcelas individuais como valor total
  const totalParcelas=Math.round(_parcelasVals.reduce((s,v)=>s+(Math.round((v||0)*100)/100),0)*100)/100;
  const valorInput=Math.round((parseFloat(document.getElementById('mc-valor').value)||0)*100)/100;
  const valor=totalParcelas>0?totalParcelas:valorInput;
  if(!valor){uiAlert('Informe o valor.',{icon:'💵'});return;}
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
async function removerCompra(ci){if(!await uiConfirm(`Remover <strong>"${D.compras[ci].nome}"</strong>?`,{icon:'🛒',okText:'Remover'}))return;D.compras.splice(ci,1);scheduleAutoSave();renderSaidasVar();renderAll();toast('Compra removida',true,'🗑️');}

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
function abrirModalAddAno() {
  const modal = document.getElementById('modal-add-ano');
  if(!modal) return;
  const anos = getYears();
  const nextAno = parseInt(anos[anos.length-1])+1 || new Date().getFullYear()+1;
  document.getElementById('maa-ano').value = nextAno;
  // Default: all 12 months checked
  document.querySelectorAll('.maa-mes-cb').forEach(cb => cb.checked = true);
  modal.style.display='flex';
}
function fecharModalAddAno() {
  const modal = document.getElementById('modal-add-ano');
  if(modal) modal.style.display='none';
}
function confirmarAddAno() {
  const anoStr = document.getElementById('maa-ano').value;
  const ano = parseInt(anoStr);
  if(isNaN(ano)||ano<2024||ano>2040){ uiAlert('Ano inválido (2024–2040).',{icon:'📅'}); return; }
  const sufixo = String(ano).slice(2);
  const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const selecionados = [];
  document.querySelectorAll('.maa-mes-cb:checked').forEach(cb => selecionados.push(cb.value));
  if(!selecionados.length){ uiAlert('Selecione pelo menos um mês.',{icon:'📅'}); return; }
  let add=0;
  // Add in order
  mesesNomes.filter(m=>selecionados.includes(m)).forEach(m=>{
    const n=`${m}/${sufixo}`;
    if(!D.meses.includes(n)){ D.meses.push(n); if(!D.invManual)D.invManual=[]; D.invManual.push(null); add++; }
  });
  fecharModalAddAno();
  if(add===0){ toast(`Meses de ${ano} já existem.`,false,'ℹ️'); }
  else { scheduleAutoSave(); renderAll(); toast(`${add} meses de ${ano} adicionados!`,true,'📅'); }
}
async function removerMesConfig(mesNome) {
  if(!await uiConfirm(`Remover o mês <strong>"${mesNome}"</strong> do planejamento?<br><br>⚠️ Dados de pagamentos e investimentos deste mês serão perdidos.`,{icon:'📅',okText:'Remover mês'})) return;
  const idx = D.meses.indexOf(mesNome);
  if(idx<0) return;
  D.meses.splice(idx,1);
  if(D.invManual) D.invManual.splice(idx,1);
  if(selDash>=nm()) selDash=nm()-1;
  scheduleAutoSave(); renderAll();
  toast(`Mês ${mesNome} removido.`,true,'🗑️');
}
async function removerAnoConfig(ano) {
  const sufixo = String(ano).slice(2);
  const meses = D.meses.filter(m=>m.endsWith('/'+sufixo));
  if(!await uiConfirm(`Remover todos os <strong>${meses.length} meses de ${ano}</strong>?`,{icon:'📅',okText:'Remover ano'})) return;
  const yrs = getYears();
  if(yrs.length<=1){ uiAlert('Mínimo de 1 ano no planejamento.',{icon:'📅'}); return; }
  meses.forEach(mes=>{ const i=D.meses.indexOf(mes); if(i>=0){ D.meses.splice(i,1); if(D.invManual) D.invManual.splice(i,1); }});
  if(selDash>=nm()) selDash=nm()-1;
  scheduleAutoSave(); renderAll();
  toast(`Ano ${ano} removido.`,true,'🗑️');
}
function renderConfigMeses() {
  const el = document.getElementById('config-meses-tabela');
  if(!el) return;
  const anos = getYears();
  const mesRefAtual = D.meses[getMesRefIdx()]||'';
  const mesesNomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  el.innerHTML = anos.map(ano => {
    const sufixo = String(ano).slice(2);
    const mesesDoAno = mesesNomes.map(m=>`${m}/${sufixo}`);
    return `<div style="margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--card2);border-radius:var(--r10) var(--r10) 0 0;border:1px solid var(--border);border-bottom:none">
        <span style="font-size:13px;font-weight:700">${ano}</span>
        <button class="btn btn-neg" style="height:26px;font-size:11px" onclick="removerAnoConfig(${ano})">🗑️ Remover ano</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:0;border:1px solid var(--border);border-radius:0 0 var(--r10) var(--r10);overflow:hidden">
        ${mesesDoAno.map((mes,i) => {
          const existe = D.meses.includes(mes);
          const isRef = mes === mesRefAtual;
          return `<div style="padding:8px 10px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);background:${isRef?'var(--brand-glow2)':existe?'var(--card)':'var(--card3)'};display:flex;align-items:center;justify-content:space-between;gap:4px">
            <span style="font-size:12px;font-weight:${isRef?700:500};color:${isRef?'var(--brand)':existe?'var(--text)':'var(--text3)'}">${mesesNomes[i]}</span>
            ${existe ? `<button onclick="removerMesConfig('${mes}')" style="background:none;border:none;cursor:pointer;color:var(--neg);font-size:12px;padding:0;line-height:1;opacity:.6" title="Remover ${mes}">✕</button>` : `<span style="font-size:10px;color:var(--text3)">—</span>`}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}
function addAno() { abrirModalAddAno(); } // backward compat


// ── FATURAS ───────────────────────────────────────
function renderFaturas() {
  if(selFaturas===-1) selFaturas=getMesAtualIdx();
  const ms=document.getElementById('faturas-months');
  if(ms){
    const ativosF=getActiveMeses();
    const curMes = D.meses[selFaturas]||'';
    ms.innerHTML=`<select id="faturas-mes-sel" style="padding:7px 32px 7px 14px;border-radius:var(--rfull);background:var(--card2);border:1px solid var(--border2);color:var(--text);font-size:13px;font-weight:600;cursor:pointer;appearance:none;min-width:130px">
      ${ativosF.map(m=>`<option value="${D.meses.indexOf(m)}" ${D.meses.indexOf(m)===selFaturas?'selected':''}>${m}</option>`).join('')}
    </select>`;
    document.getElementById('faturas-mes-sel').onchange=function(){selFaturas=parseInt(this.value);renderFaturas();};
  }
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
    const bordaCor = g.tipo==='cartao'?'var(--violet-glow)':g.tipo==='fixa'?'rgba(59,130,246,.15)':'rgba(245,158,11,.15)';
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
function getMesAtualIdx() {
  const hoje=new Date();const dia=hoje.getDate();
  const m=hoje.getMonth()+1;const y=hoje.getFullYear();
  let idx=D.meses.findIndex(ms=>{const {m:mm,y:yy}=parseMes(ms);return mm===m&&yy===y;});
  if(idx===-1) idx=0;
  if(dia>15&&idx<nm()-1) idx++;
  return idx;
}

// ── CONFIG PAGE ─────────────────────────────────
// ═══════════════════════════════════════════════════
//  📄 RELATÓRIOS (Onda 4)
// ═══════════════════════════════════════════════════
let selRelMes = null; // índice do mês do relatório (null = mês de referência)
let selRelAno = null;

// Relatório mensal completo (puro)
function relatorioMensal(mi){
  const entradas=totalEMes(mi)||0;
  const saidas=(totalFixasMes(mi)||0)+(totalComprasMes(mi)||0);
  const sobra=entradas-saidas;
  const taxaPoupanca=entradas>0?(sobra/entradas)*100:0;
  // categorias
  const cm=_gastosCatMes(mi); const totCat=Object.values(cm).reduce((s,v)=>s+v,0);
  const categorias=Object.entries(cm).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a)
    .map(([k,v])=>({cat:k,icon:CATS[k]?.icon||'📦',label:CATS[k]?.label||k,cor:catColor(k),valor:v,pct:totCat>0?(v/totCat)*100:0}));
  // orçamentos (somente os definidos)
  const O=orcamentoInfo(mi); const orcamentos=O.linhas.filter(l=>l.limite>0);
  // patrimônio e buckets
  const pat=patrimonioLiquido();
  const buckets={C:0,R:0,A:0,A2:0}; (D.ativos||[]).forEach(a=>{buckets[a.bucket]=(buckets[a.bucket]||0)+(a.valor||0);});
  // renda passiva (do plano, snapshot atual)
  let rendaPassiva=0; try{ const p=calcularPlanoAposentadoria(); if(p&&p.atual) rendaPassiva=p.atual.rendaPassiva||0; }catch(e){}
  // metas
  const metas=(D.metas||[]).filter(m=>(m.dominio||'financeiro')==='financeiro' && (m.unidade||'dinheiro')==='dinheiro').map(m=>{const I=metaInfo(m);return {nome:m.nome,icon:m.icon||'🎯',pct:I.pct,atual:I.atual,alvo:I.alvo,concluida:I.concluida};});
  // saúde
  let score=0, insights=[]; try{ const F=finInsights(mi); score=F.score; insights=F.insights.slice(0,5); }catch(e){}
  return { mi, mes:D.meses[mi]||'', entradas, saidas, sobra, taxaPoupanca, categorias,
    orcamentos, totalOrcado:O.totalOrcado, totalGastoOrc:O.totalGasto,
    patrimonio:pat, buckets, rendaPassiva, metas, score, insights };
}

// Evolução anual (puro)
function relatorioAnual(ano){
  const meses=getMesesAno(String(ano)).map(({m,i})=>{
    const entrada=totalEMes(i)||0, saida=(totalFixasMes(i)||0)+(totalComprasMes(i)||0);
    return {mes:m, entrada, saida, sobra:entrada-saida};
  });
  const totEntrada=meses.reduce((s,r)=>s+r.entrada,0);
  const totSaida=meses.reduce((s,r)=>s+r.saida,0);
  return { ano, meses, totEntrada, totSaida, totSobra:totEntrada-totSaida };
}

function setRelMes(v){ selRelMes=parseInt(v); renderRelatorioAtivo(); }
function setRelAno(v){ selRelAno=v; renderRelatorioAtivo(); }
function printRelatorio(){
  document.body.classList.add('printing-report');
  setTimeout(()=>{ window.print(); setTimeout(()=>document.body.classList.remove('printing-report'),300); },80);
}

function renderRelatorios(){
  try{ const ut=D.prefs&&D.prefs.relatorios&&D.prefs.relatorios.ultimoTipo; if(ut && _REL_TIPOS.some(t=>t.id===ut)) _relTipo=ut; }catch(e){}
  const selT=document.getElementById('rel-tipo');
  if(selT) selT.innerHTML=_REL_TIPOS.map(t=>`<option value="${t.id}"${t.id===_relTipo?' selected':''}>${t.icon} ${escapeHTML(t.label)}</option>`).join('');
  const sel=document.getElementById('rel-mes');
  if(sel){ const ref=(selRelMes==null)?getMesRefIdx():selRelMes;
    sel.innerHTML=D.meses.map((m,i)=>`<option value="${i}"${i===ref?' selected':''}>${escapeHTML(m)}${i===getMesRefIdx()?' (atual)':''}</option>`).join(''); }
  const selA=document.getElementById('rel-ano');
  if(selA){ const anos=_relAnos(); if(selRelAno==null) selRelAno=anos.slice(-1)[0];
    selA.innerHTML=anos.map(a=>`<option value="${a}"${String(a)===String(selRelAno)?' selected':''}>${a}</option>`).join(''); }
  const selD=document.getElementById('rel-dom');
  if(selD && typeof META_DOMINIOS!=='undefined'){ selD.innerHTML='<option value="">Domínio: todos</option>'+META_DOMINIOS.map(d=>`<option value="${d.id}"${d.id===_relFiltroDomMeta?' selected':''}>${escapeHTML(d.icon)} ${escapeHTML(d.label)}</option>`).join(''); }
  _relToggleControls();
  renderRelatorioAtivo();
}

function renderRelMensal(){
  const el=document.getElementById('report-print'); if(!el) return;
  const mi=(selRelMes==null)?getMesRefIdx():selRelMes;
  const R=relatorioMensal(mi);
  const hoje=new Date().toLocaleDateString('pt-BR');
  const scCor=R.score>=70?'var(--brand)':R.score>=40?'var(--warn)':'var(--neg)';
  const srCor=R.taxaPoupanca<0?'var(--neg)':R.taxaPoupanca<10?'var(--warn)':'var(--pos)';
  const card=(inner)=>`<div class="rep-card" style="background:var(--card);border:1px solid var(--border);border-radius:var(--r14);padding:16px;margin-bottom:14px">${inner}</div>`;
  const kpi=(label,val,cor)=>`<div style="flex:1;min-width:130px"><div style="font-size:11px;color:var(--text2)">${label}</div><div style="font-size:20px;font-weight:800;color:${cor||'var(--text)'}">${val}</div></div>`;
  const sevCor={bad:'var(--neg)',warn:'var(--warn)',info:'var(--info)',good:'var(--pos)'};

  const resumo=card(`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div><div style="font-size:18px;font-weight:800">Relatório de ${R.mes}</div>
        <div style="font-size:11px;color:var(--text3)">Gerado em ${hoje} · FinançasPRO</div></div>
      <div style="text-align:right"><div style="font-size:11px;color:var(--text2)">Score de saúde</div>
        <div style="font-size:22px;font-weight:800;color:${scCor}">${Math.round(R.score)}/100</div></div>
    </div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border)">
      ${kpi('Entradas',fmt(R.entradas),'var(--pos)')}
      ${kpi('Saídas',fmt(R.saidas),'var(--neg)')}
      ${kpi('Sobra do mês',fmt(R.sobra),R.sobra>=0?'var(--brand)':'var(--neg)')}
      ${kpi('Taxa de poupança',`${Math.round(R.taxaPoupanca)}%`,srCor)}
    </div>`);

  const catRows=R.categorias.length?R.categorias.map(c=>`<tr>
      <td style="white-space:nowrap"><span style="font-size:14px">${c.icon}</span> ${c.label}</td>
      <td class="tr" style="font-weight:600">${fmt(c.valor)}</td>
      <td class="tr" style="color:var(--text2)">${Math.round(c.pct)}%</td>
      <td style="width:120px"><div style="height:7px;background:var(--card3);border-radius:99px;overflow:hidden"><div style="height:7px;width:${Math.min(100,c.pct)}%;background:${c.cor};border-radius:99px"></div></div></td>
    </tr>`).join(''):`<tr><td colspan="4" style="color:var(--text3);font-size:12px">Sem gastos registrados neste mês.</td></tr>`;
  const categorias=card(`<div style="font-size:14px;font-weight:700;margin-bottom:10px">💸 Gastos por categoria</div>
    <table style="width:100%"><thead><tr><th>Categoria</th><th class="tr">Valor</th><th class="tr">%</th><th></th></tr></thead><tbody>${catRows}</tbody></table>`);

  const orcamentos=R.orcamentos.length?card(`<div style="font-size:14px;font-weight:700;margin-bottom:10px">📊 Orçamentos · ${fmt(R.totalGastoOrc)} de ${fmt(R.totalOrcado)}</div>
    <table style="width:100%"><thead><tr><th>Categoria</th><th class="tr">Gasto</th><th class="tr">Limite</th><th class="tr">Uso</th></tr></thead><tbody>
    ${R.orcamentos.map(l=>{const cor=l.over?'var(--neg)':l.pct>=80?'var(--warn)':'var(--pos)';return `<tr>
      <td>${l.icon} ${l.label}</td><td class="tr">${fmt(l.gasto)}</td><td class="tr">${fmt(l.limite)}</td>
      <td class="tr" style="color:${cor};font-weight:700">${Math.round(l.pct)}%${l.over?' ⚠️':''}</td></tr>`;}).join('')}
    </tbody></table>`):'';

  const patrimonio=card(`<div style="font-size:14px;font-weight:700;margin-bottom:10px">📈 Patrimônio & investimentos</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px">
      ${kpi('Ativos',fmt(R.patrimonio.ativos))}
      ${kpi('Em aberto (compras)',fmt(R.patrimonio.passivos),'var(--warn)')}
      ${kpi('Patrimônio líquido',fmt(R.patrimonio.liquido),'var(--brand)')}
      ${kpi('Renda passiva/mês',fmt(R.rendaPassiva),'var(--pos)')}
    </div>
    <div style="font-size:12px;color:var(--text2)">Distribuição: 💵 Caixa ${fmtK(R.buckets.C)} · 🏢 FIIs ${fmtK(R.buckets.R)} · 🇧🇷 Ações BR ${fmtK(R.buckets.A)} · 🌎 Intl ${fmtK(R.buckets.A2)}</div>`);

  const metas=R.metas.length?card(`<div style="font-size:14px;font-weight:700;margin-bottom:10px">🎯 Objetivos</div>
    ${R.metas.map(m=>`<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${escapeHTML(m.icon)} ${escapeHTML(m.nome)}</span><span style="font-weight:700;color:${m.concluida?'var(--pos)':'var(--text)'}">${fmtK(m.atual)} / ${fmtK(m.alvo)} · ${Math.round(m.pct)}%</span></div>
      <div style="height:7px;background:var(--card3);border-radius:99px;overflow:hidden"><div style="height:7px;width:${Math.min(100,m.pct)}%;background:${m.concluida?'var(--pos)':'var(--brand)'};border-radius:99px"></div></div>
    </div>`).join('')}`):'';

  const insights=R.insights.length?card(`<div style="font-size:14px;font-weight:700;margin-bottom:10px">🩺 Destaques</div>
    ${R.insights.map(it=>`<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:7px">
      <span>${it.icon}</span><div><strong style="font-size:12px;color:${sevCor[it.sev]}">${it.titulo}.</strong> <span style="font-size:12px;color:var(--text2)">${it.msg}</span></div></div>`).join('')}`):'';

  el.innerHTML=resumo+categorias+orcamentos+patrimonio+metas+insights;
}

function renderRelEvolucao(){
  const el=document.getElementById('rel-evolucao'); if(!el) return;
  const anos=getYears(); if(!anos.length){ el.innerHTML=''; return; }
  const ano=selRelAno&&anos.includes(selRelAno)?selRelAno:anos[0];
  const A=relatorioAnual(ano);
  const maxAbs=Math.max(1,...A.meses.map(r=>Math.max(r.entrada,r.saida)));
  el.innerHTML=`<div class="panel">
    <div class="panel-head"><span class="panel-title">📅 Evolução ${ano}</span>
      <select onchange="setRelAno(this.value)" style="height:30px;font-size:12px">${anos.map(y=>`<option value="${y}"${y===ano?' selected':''}>${y}</option>`).join('')}</select></div>
    <div style="padding:14px 16px">
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px">
        <div><div style="font-size:11px;color:var(--text2)">Entradas no ano</div><div style="font-size:18px;font-weight:800;color:var(--pos)">${fmt(A.totEntrada)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Saídas no ano</div><div style="font-size:18px;font-weight:800;color:var(--neg)">${fmt(A.totSaida)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Sobra no ano</div><div style="font-size:18px;font-weight:800;color:${A.totSobra>=0?'var(--brand)':'var(--neg)'}">${fmt(A.totSobra)}</div></div>
      </div>
      <div class="scroll"><table style="width:100%"><thead><tr><th>Mês</th><th class="tr">Entradas</th><th class="tr">Saídas</th><th class="tr">Sobra</th><th style="width:160px">Balanço</th></tr></thead><tbody>
      ${A.meses.map(r=>`<tr>
        <td style="white-space:nowrap;font-weight:600">${r.mes}</td>
        <td class="tr" style="color:var(--pos)">${fmt(r.entrada)}</td>
        <td class="tr" style="color:var(--neg)">${fmt(r.saida)}</td>
        <td class="tr" style="font-weight:700;color:${r.sobra>=0?'var(--brand)':'var(--neg)'}">${fmt(r.sobra)}</td>
        <td><div style="display:flex;gap:2px;align-items:center;height:14px">
          <div style="flex:1;display:flex;justify-content:flex-end"><div style="height:9px;width:${(r.entrada/maxAbs)*100}%;background:var(--pos);border-radius:2px"></div></div>
          <div style="flex:1"><div style="height:9px;width:${(r.saida/maxAbs)*100}%;background:var(--neg);border-radius:2px"></div></div>
        </div></td>
      </tr>`).join('')}
      </tbody></table></div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════
//  🎯 METAS & ORÇAMENTOS (Onda 3)
// ═══════════════════════════════════════════════════

// Valor atual de uma meta conforme a fonte escolhida
function metaValorAtual(meta){
  switch(meta.fonte){
    case 'caixa':      return caixaAtual();
    case 'patrimonio': { const p=patrimonioLiquido(); return (p&&typeof p==='object')?p.liquido:(p||0); }
    case 'ativo':      { const a=(D.ativos||[]).find(x=>x.nome===meta.ativoNome); return a?(a.valor||0):0; }
    default:           return meta.valorAtual||0; // manual
  }
}
// Resumo calculado de uma meta (puro)
function metaInfo(meta){
  const atual=metaValorAtual(meta), alvo=meta.valorAlvo||0;
  const pct=alvo>0?Math.min(100,(atual/alvo)*100):0;
  const faltam=Math.max(0,alvo-atual);
  const concluida=alvo>0 && atual>=alvo;
  let mesesRest=null, porMes=null, atrasada=false;
  const pz=meta.prazo?parseMes(meta.prazo):null;
  if(pz){
    const hoje=new Date(), hojeIdx=hoje.getFullYear()*12+(hoje.getMonth()+1);
    mesesRest=(pz.y*12+pz.m)-hojeIdx;
    if(!concluida){
      if(mesesRest>0) porMes=faltam/mesesRest;
      else { atrasada=true; porMes=faltam; }
    }
  }
  return { atual, alvo, pct, faltam, concluida, mesesRest, porMes, atrasada };
}
// Resumo de orçamentos para o mês `mi` (puro)
function orcamentoInfo(mi){
  const gastos=_gastosCatMes(mi); // {cat: valor}
  const orc=D.orcamentos||{};
  const linhas=[]; let totalOrcado=0, totalGasto=0;
  Object.keys(CATS).forEach(cat=>{
    const limite=orc[cat]||0, gasto=gastos[cat]||0;
    if(limite>0){ totalOrcado+=limite; totalGasto+=gasto; }
    linhas.push({ cat, icon:CATS[cat]?.icon||'📦', label:CATS[cat]?.label||cat,
      cor:catColor(cat), limite, gasto,
      pct: limite>0?Math.min(999,(gasto/limite)*100):0, over: limite>0 && gasto>limite });
  });
  // categorias com orçamento primeiro, depois maior gasto
  linhas.sort((a,b)=> (b.limite>0)-(a.limite>0) || b.gasto-a.gasto);
  return { linhas, totalOrcado, totalGasto, mes:D.meses[mi]||'' };
}

// ── CRUD Metas + render: ver bloco "🎯 METAS INTEGRADAS" acima ──
// ── Orçamentos ──
function setOrcamento(cat, val){
  if(!D.orcamentos || typeof D.orcamentos!=='object') D.orcamentos={};
  const v=parseFloat(val)||0;
  if(v>0) D.orcamentos[cat]=v; else delete D.orcamentos[cat];
  scheduleAutoSave(); renderOrcamentos();
}

// ── RENDER ──
function renderMetas(){ renderObjetivos(); renderOrcamentos(); }

function addMeta(){
  if(!Array.isArray(D.metas)) D.metas=[];
  const m={ id:'meta_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    nome:'Nova meta', descricao:'', icon:'🎯',
    dominio:'financeiro', categoria:'', status:'em_andamento', prioridade:'media',
    unidade:'dinheiro', prazo:'', valorAlvo:10000, valorAtual:0, progressoManual:null,
    fonte:'manual', ativoNome:'', cor:'#00D4AA', impactoFinanceiro:'medio',
    proximosPassos:'', observacoes:'', relacionadaADecisaoId:'', relacionadaACompraId:'',
    dataCriacao:new Date().toISOString(), dataAtualizacao:new Date().toISOString(), ativa:true };
  D.metas.unshift(m);
  _metaExpanded[m.id]=true;
  scheduleAutoSave(); renderObjetivos();
}
function setMetaField(id, field, val){
  const m=(D.metas||[]).find(x=>x.id===id); if(!m) return;
  if(['valorAlvo','valorAtual'].includes(field)) val=parseFloat(val)||0;
  if(field==='progressoManual') val = (val===''||val==null) ? null : Math.max(0,Math.min(100,parseFloat(val)||0));
  m[field]=val;
  m.dataAtualizacao=new Date().toISOString();
  scheduleAutoSave(); renderObjetivos();
}
async function removeMeta(id){
  const m=(D.metas||[]).find(x=>x.id===id);
  if(!await uiConfirm(`Remover a meta <strong>"${escapeHTML(m&&m.nome||'')}"</strong>?`,{icon:'🎯',okText:'Remover'})) return;
  D.metas=(D.metas||[]).filter(x=>x.id!==id);
  delete _metaExpanded[id];
  scheduleAutoSave(); renderObjetivos(); toast('Meta removida',true,'🗑️');
}

// ── Resumo (cards do topo) ──
function _metaResumoData(){
  const ms=_metas().filter(m=>m.ativa!==false);
  let emAndamento=0, concluidas=0, atrasadas=0, criticas=0;
  const porDom={};
  ms.forEach(m=>{
    const p=metaProgress(m);
    if(p.concluida) concluidas++;
    else { emAndamento++; if(p.atrasada) atrasadas++; }
    if(m.prioridade==='critica' && !p.concluida) criticas++;
    porDom[m.dominio]=(porDom[m.dominio]||0)+1;
  });
  // próximo prazo (meses restantes)
  let prox=null; const hoje=new Date(), hojeIdx=hoje.getFullYear()*12+(hoje.getMonth()+1);
  ms.forEach(m=>{ const p=metaProgress(m); if(p.concluida) return; const pz=m.prazo?parseMes(m.prazo):null;
    if(pz){ const rest=(pz.y*12+pz.m)-hojeIdx; if(rest>=0 && (!prox||rest<prox.rest)) prox={m,rest}; } });
  const domsAtivos=Object.keys(porDom).length;
  return { total:ms.length, emAndamento, concluidas, atrasadas, criticas, porDom, domsAtivos, prox };
}

function renderObjetivos(){
  const el=document.getElementById('metas-objetivos'); if(!el) return;
  const r=_metaResumoData();

  const selOpts=(obj,sel)=>{
    if(Array.isArray(obj)) return obj.map(c=>`<option value="${attr(c.id)}"${c.id===sel?' selected':''}>${escapeHTML(c.icon||'')} ${escapeHTML(c.label)}</option>`).join('');
    return Object.keys(obj).map(k=>`<option value="${attr(k)}"${k===sel?' selected':''}>${escapeHTML(obj[k].label||obj[k])}</option>`).join('');
  };

  // Resumo
  const rc=(icon,label,valor,cor)=>`<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:11px 13px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">${icon} ${label}</div>
    <div style="font-size:18px;font-weight:800;color:${cor||'var(--text)'};margin-top:2px">${valor}</div></div>`;
  const domsTop=Object.entries(r.porDom).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([d,n])=>`${metaDom(d).icon} ${n}`).join('  ');
  const resumo=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:14px">
    ${rc('🎯','Em andamento',r.emAndamento,'var(--info)')}
    ${rc('✅','Concluídas',r.concluidas,'var(--pos)')}
    ${rc('⏰','Atrasadas',r.atrasadas,r.atrasadas>0?'var(--neg)':'var(--text)')}
    ${rc('🚨','Críticas',r.criticas,r.criticas>0?'var(--neg)':'var(--text)')}
    ${rc('🗂️','Domínios',r.domsAtivos,'var(--text)')}
    ${rc('📅','Próximo prazo',r.prox?(r.prox.rest===0?'este mês':`${r.prox.rest}m`):'—',r.prox&&r.prox.rest<=1?'var(--warn)':'var(--text)')}
  </div>${r.domsAtivos?`<div style="font-size:11px;color:var(--text3);margin:-6px 0 12px">Distribuição: ${domsTop}</div>`:''}`;

  // Filtros
  const filtros=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
    <input type="text" value="${attr(_metaBusca)}" oninput="setMetaFiltro('busca',this.value)" placeholder="🔍 Buscar nome, descrição, passos…" style="flex:1;min-width:160px;height:34px">
    <select onchange="setMetaFiltro('dom',this.value)" style="height:34px;font-size:12px"><option value="">Domínio: todos</option>${selOpts(META_DOMINIOS,_metaFiltroDom)}</select>
    <select onchange="setMetaFiltro('status',this.value)" style="height:34px;font-size:12px"><option value="">Status: todos</option>${selOpts(META_STATUS,_metaFiltroStatus)}</select>
    <select onchange="setMetaFiltro('prio',this.value)" style="height:34px;font-size:12px"><option value="">Prioridade: todas</option>${selOpts(META_PRIOS,_metaFiltroPrio)}</select>
    <select onchange="setMetaFiltro('unidade',this.value)" style="height:34px;font-size:12px"><option value="">Unidade: todas</option>${selOpts(META_UNIDADES,_metaFiltroUnidade)}</select>
    <select onchange="setMetaFiltro('ord',this.value)" style="height:34px;font-size:12px">
      <option value="prioridade"${_metaOrdenar==='prioridade'?' selected':''}>Ordenar: prioridade</option>
      <option value="prazo"${_metaOrdenar==='prazo'?' selected':''}>Ordenar: prazo</option>
      <option value="progresso"${_metaOrdenar==='progresso'?' selected':''}>Ordenar: progresso</option>
      <option value="criacao"${_metaOrdenar==='criacao'?' selected':''}>Ordenar: mais recentes</option>
      <option value="dominio"${_metaOrdenar==='dominio'?' selected':''}>Ordenar: domínio</option>
    </select>
    <button class="btn btn-pri" style="height:34px;font-size:13px" onclick="addMeta()">+ Nova meta</button>
  </div>`;

  // Filtro + busca + ordenação
  let lista=_metas().slice();
  if(_metaFiltroDom)     lista=lista.filter(m=>m.dominio===_metaFiltroDom);
  if(_metaFiltroStatus)  lista=lista.filter(m=>m.status===_metaFiltroStatus);
  if(_metaFiltroPrio)    lista=lista.filter(m=>m.prioridade===_metaFiltroPrio);
  if(_metaFiltroUnidade) lista=lista.filter(m=>(m.unidade||'dinheiro')===_metaFiltroUnidade);
  if(_metaBusca){ const q=_metaBusca.toLowerCase(); lista=lista.filter(m=>['nome','descricao','proximosPassos','observacoes'].some(k=>(m[k]||'').toLowerCase().includes(q))); }
  const ord={
    prioridade:(a,b)=>(META_PRIOS[b.prioridade]?.ord||0)-(META_PRIOS[a.prioridade]?.ord||0),
    prazo:(a,b)=>(a.prazo||'~').localeCompare(b.prazo||'~'),
    progresso:(a,b)=>metaProgress(b).pct-metaProgress(a).pct,
    criacao:(a,b)=>(b.dataCriacao||'').localeCompare(a.dataCriacao||''),
    dominio:(a,b)=>(a.dominio||'').localeCompare(b.dominio||''),
  };
  lista.sort(ord[_metaOrdenar]||ord.prioridade);

  if(!_metas().length){
    el.innerHTML=`<div class="panel"><div class="panel-head"><span class="panel-title">🎯 Metas</span>
      <button class="btn btn-pri" style="height:32px;font-size:13px" onclick="addMeta()">+ Nova meta</button></div>
      <div class="empty" style="padding:28px"><div class="empty-icon">🎯</div>
      <div class="empty-text">Suas metas agora são multiárea: finanças, carreira, saúde, viagem, estudo, projetos e mais. Crie a primeira — pode ser a reserva de emergência, uma certificação ou treinar 4x na semana — e acompanhe o progresso no formato certo para cada uma.</div>
      <button class="btn btn-pri" style="margin-top:14px" onclick="addMeta()">+ Criar primeira meta</button></div></div>`;
    return;
  }

  const cards=lista.map(m=>{
    const dom=metaDom(m.dominio), st=META_STATUS[m.status]||META_STATUS.em_andamento, pr=META_PRIOS[m.prioridade]||META_PRIOS.media;
    const p=metaProgress(m);
    const barCor = p.concluida?'var(--pos)':p.atrasada?'var(--neg)':dom.cor;
    const exp=_metaExpanded[m.id];
    const dec=metaDecisoesVinculadas(m.id);
    const un=m.unidade||'dinheiro';
    const ativoOpts=(D.ativos||[]).map(a=>`<option value="${attr(a.nome||'')}"${a.nome===m.ativoNome?' selected':''}>${escapeHTML(a.nome||'(sem nome)')}</option>`).join('');

    // Campos de valor por unidade
    let valorFields='';
    if(un==='dinheiro'){
      valorFields=`
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Valor-alvo (R$)</label>
          <input type="number" step="100" value="${m.valorAlvo||0}" onchange="setMetaField('${m.id}','valorAlvo',this.value)"></div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Fonte do valor atual</label>
          <select onchange="setMetaField('${m.id}','fonte',this.value)">
            ${[['manual','✍️ Manual'],['caixa','💵 Caixa/Reserva'],['patrimonio','📊 Patrimônio'],['ativo','💼 Ativo']].map(([v,l])=>`<option value="${v}"${m.fonte===v?' selected':''}>${l}</option>`).join('')}</select></div>
        <div class="field" style="margin:0">${
          m.fonte==='manual' ? `<label class="flabel" style="font-size:10px">Valor atual (R$)</label><input type="number" step="100" value="${m.valorAtual||0}" onchange="setMetaField('${m.id}','valorAtual',this.value)">`
          : m.fonte==='ativo' ? `<label class="flabel" style="font-size:10px">Ativo</label><select onchange="setMetaField('${m.id}','ativoNome',this.value)"><option value="">— escolher —</option>${ativoOpts}</select>`
          : `<label class="flabel" style="font-size:10px">Valor atual</label><input type="text" disabled value="${attr(fmt(p.atual||0))}" style="opacity:.7">`
        }</div>`;
    } else if(un==='quantidade'){
      valorFields=`
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Quantidade-alvo</label>
          <input type="number" step="1" value="${m.valorAlvo||0}" onchange="setMetaField('${m.id}','valorAlvo',this.value)"></div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Quantidade atual</label>
          <input type="number" step="1" value="${m.valorAtual||0}" onchange="setMetaField('${m.id}','valorAtual',this.value)"></div>`;
    } else if(un==='percentual'||un==='checklist'){
      valorFields=`
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Progresso (%)</label>
          <input type="number" step="5" min="0" max="100" value="${m.progressoManual!=null?m.progressoManual:(m.valorAtual||0)}" onchange="setMetaField('${m.id}','progressoManual',this.value)"></div>`;
    } else if(un==='manual'){
      valorFields=`
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Progresso manual (%) — opcional</label>
          <input type="number" step="5" min="0" max="100" value="${m.progressoManual!=null?m.progressoManual:''}" placeholder="deixe vazio se não medir" onchange="setMetaField('${m.id}','progressoManual',this.value)"></div>`;
    } else { // sim_nao
      valorFields=`<div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Conclusão</label>
        <div style="font-size:12px;color:var(--text2);padding-top:6px">Marque o status como <strong>Concluída</strong> quando atingir.</div></div>`;
    }

    const decBadge = dec.total ? `<span style="font-size:10px;color:var(--text3)">🧭 ${dec.total} decisão(ões)${dec.emAnalise?` · ${dec.emAnalise} em análise`:''}</span>` : '';
    const passos = m.proximosPassos ? `<div style="font-size:11.5px;color:var(--text2);margin-top:6px">→ ${escapeHTML(m.proximosPassos.length>90?m.proximosPassos.slice(0,90)+'…':m.proximosPassos)}</div>` : '';

    const editor = exp ? `
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;display:grid;gap:10px">
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Descrição</label>
          <textarea oninput="setMetaField('${m.id}','descricao',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(m.descricao)}</textarea></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Domínio</label>
            <select onchange="setMetaField('${m.id}','dominio',this.value)">${selOpts(META_DOMINIOS,m.dominio)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Unidade / progresso</label>
            <select onchange="setMetaField('${m.id}','unidade',this.value)">${selOpts(META_UNIDADES,un)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Status</label>
            <select onchange="setMetaField('${m.id}','status',this.value)">${selOpts(META_STATUS,m.status)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Prioridade</label>
            <select onchange="setMetaField('${m.id}','prioridade',this.value)">${selOpts(META_PRIOS,m.prioridade)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Prazo (Mmm/aa)</label>
            <input type="text" placeholder="Dez/27" value="${attr(m.prazo)}" onchange="setMetaField('${m.id}','prazo',this.value.trim())"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Categoria (livre)</label>
            <input type="text" value="${attr(m.categoria)}" onchange="setMetaField('${m.id}','categoria',this.value)"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">${valorFields}</div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Próximos passos</label>
          <textarea oninput="setMetaField('${m.id}','proximosPassos',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(m.proximosPassos)}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Vincular a decisão (opcional)</label>
            <select onchange="setMetaField('${m.id}','relacionadaADecisaoId',this.value)">
              <option value="">— nenhuma —</option>
              ${((D.decisoes||[]).map(dd=>`<option value="${attr(dd.id)}"${dd.id===m.relacionadaADecisaoId?' selected':''}>${escapeHTML(dd.titulo||'(sem título)')}</option>`)).join('')}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Vincular a compra/desejo (opcional)</label>
            <select onchange="setMetaField('${m.id}','relacionadaACompraId',this.value)">
              <option value="">— nenhuma —</option>
              ${(((typeof _hob==='function'&&_hob().itens)||[]).map(it=>`<option value="${attr(it.id)}"${it.id===m.relacionadaACompraId?' selected':''}>${escapeHTML(it.nome||'')}</option>`)).join('')}</select></div>
        </div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Observações</label>
          <textarea oninput="setMetaField('${m.id}','observacoes',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(m.observacoes)}</textarea></div>
        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-neg" style="height:32px;font-size:12px" onclick="removeMeta('${m.id}')">🗑️ Excluir meta</button>
        </div>
      </div>` : '';

    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${barCor};border-radius:var(--r14);padding:14px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;gap:9px">
        <input type="text" value="${(m.icon||'🎯').replace(/"/g,'&quot;')}" maxlength="2" onchange="setMetaField('${m.id}','icon',this.value)" style="width:40px;text-align:center;font-size:18px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <input type="text" value="${attr(m.nome||'')}" onchange="setMetaField('${m.id}','nome',this.value)" placeholder="Nome da meta" style="font-weight:700;font-size:14px;width:100%">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center">
            <span class="badge" style="background:var(--card3);color:${dom.cor};font-size:10px">${escapeHTML(dom.icon)} ${escapeHTML(dom.label)}</span>
            <span class="badge" style="background:var(--card3);color:${st.cor};font-size:10px">${escapeHTML(st.label)}</span>
            <span class="badge" style="background:var(--card3);color:${pr.cor};font-size:10px">${escapeHTML(pr.label)}</span>
            ${m.prazo?`<span style="font-size:11px;color:${p.atrasada?'var(--neg)':'var(--text3)'}">${p.atrasada?'⚠ ':''}prazo ${escapeHTML(m.prazo)}</span>`:''}
            ${decBadge}
          </div>
        </div>
        <button class="btn btn-ghost" style="height:30px;font-size:12px;flex-shrink:0" onclick="toggleMetaExpand('${m.id}')">${exp?'▴ fechar':'▾ detalhes'}</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin:10px 0 4px">
        <span style="font-size:13px;font-weight:700;color:${barCor}">${p.defined?escapeHTML(p.label):'<span style=\"color:var(--text3);font-weight:500\">'+escapeHTML(p.label)+'</span>'}</span>
        <span style="font-size:12px;color:var(--text2)">${p.defined?Math.round(p.pct)+'%':''}${p.concluida?' ✅':''}</span>
      </div>
      <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden">
        <div style="height:8px;width:${p.pctVis}%;background:${barCor};border-radius:99px;transition:width .5s"></div>
      </div>
      ${passos}
      ${editor}
    </div>`;
  }).join('');

  el.innerHTML=`<div class="panel"><div style="padding:16px">
    ${resumo}${filtros}${cards}
  </div></div>`;
}

function renderOrcamentos(){
  const el=document.getElementById('metas-orcamentos'); if(!el) return;
  const mi=getMesRefIdx();
  const O=orcamentoInfo(mi);
  const pctTotal=O.totalOrcado>0?Math.min(999,(O.totalGasto/O.totalOrcado)*100):0;
  const corTot=pctTotal>100?'var(--neg)':pctTotal>=80?'var(--warn)':'var(--pos)';
  const linhas=O.linhas.map(l=>{
    const ativo=l.limite>0;
    const cor=l.over?'var(--neg)':l.pct>=80?'var(--warn)':'var(--pos)';
    return `<tr>
      <td style="white-space:nowrap"><span style="font-size:15px">${l.icon}</span> <strong style="font-size:13px">${l.label}</strong></td>
      <td class="tr" style="color:${l.gasto>0?'var(--text)':'var(--text3)'}">${fmt(l.gasto)}</td>
      <td style="width:130px"><input type="number" step="50" min="0" placeholder="sem limite" value="${l.limite||''}" onchange="setOrcamento('${l.cat}',this.value)" style="width:120px;text-align:right"></td>
      <td style="min-width:160px">${ativo?`
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:8px;background:var(--card3);border-radius:99px;overflow:hidden">
            <div style="height:8px;width:${Math.min(100,l.pct)}%;background:${cor};border-radius:99px"></div></div>
          <span style="font-size:11px;font-weight:700;color:${cor};min-width:54px;text-align:right">${Math.round(l.pct)}%${l.over?' ⚠️':''}</span>
        </div>`:`<span style="font-size:11px;color:var(--text3)">defina um limite para acompanhar</span>`}</td>
    </tr>`;
  }).join('');
  el.innerHTML=`<div class="panel">
    <div class="panel-head"><span class="panel-title">📊 Orçamentos por categoria</span>
      <span class="panel-badge">${O.mes}</span></div>
    <div style="padding:14px 16px">
      ${O.totalOrcado>0?`<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding:12px 14px;background:var(--card2);border-radius:var(--r10)">
        <div><div style="font-size:11px;color:var(--text2)">Total orçado</div><div style="font-size:18px;font-weight:800">${fmt(O.totalOrcado)}</div></div>
        <div><div style="font-size:11px;color:var(--text2)">Total gasto</div><div style="font-size:18px;font-weight:800;color:${corTot}">${fmt(O.totalGasto)}</div></div>
        <div style="flex:1;min-width:160px">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-bottom:4px"><span>Uso do orçamento</span><span style="font-weight:700;color:${corTot}">${Math.round(pctTotal)}%</span></div>
          <div style="height:9px;background:var(--card3);border-radius:99px;overflow:hidden"><div style="height:9px;width:${Math.min(100,pctTotal)}%;background:${corTot};border-radius:99px"></div></div>
        </div>
      </div>`:`<div style="font-size:12px;color:var(--text2);margin-bottom:12px">Defina um limite mensal nas categorias abaixo para acompanhar seus gastos do mês de referência (<strong>${O.mes}</strong>) e receber alertas de estouro.</div>`}
      <div class="scroll"><table style="width:100%">
        <thead><tr><th>Categoria</th><th class="tr">Gasto no mês</th><th class="tr">Limite/mês</th><th>Uso</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table></div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════
//  🎮 HOBBIES & AQUISIÇÕES
//  Wishlist com curadoria + fundo (sinking fund) +
//  teste de cabimento contra a reserva ARCA +
//  custo de oportunidade no plano de longo prazo.
// ═══════════════════════════════════════════════════

const HOB_CLASSE = {
  essencial:  {label:'Essencial',   cor:'var(--brand)',  ord:0},
  recomendado:{label:'Recomendado', cor:'var(--info)',   ord:1},
  investimento_profissional:{label:'Invest. profissional', cor:'var(--teal)', ord:2},
  investimento_pessoal:{label:'Invest. pessoal', cor:'var(--teal)', ord:3},
  substituir: {label:'Substituir',  cor:'var(--info)',   ord:4},
  desejavel:  {label:'Desejável',   cor:'var(--violet)', ord:5},
  luxo:       {label:'Luxo',        cor:'var(--warn)',   ord:6},
  impulso:    {label:'Impulso',     cor:'var(--neg)',    ord:7},
};
const COMPRA_CLASSES = HOB_CLASSE; // alias semântico (Compras & Desejos)
const COMPRA_DOMINIOS = [
  {id:'lazer',label:'Lazer',icon:'🎮'}, {id:'tecnologia',label:'Tecnologia/Setup',icon:'🖥️'},
  {id:'trabalho',label:'Trabalho',icon:'💼'}, {id:'carreira',label:'Carreira',icon:'🚀'},
  {id:'patrimonio',label:'Patrimônio',icon:'📦'}, {id:'viagem',label:'Viagem',icon:'✈️'},
  {id:'saude',label:'Saúde',icon:'🩺'}, {id:'estudo',label:'Estudo',icon:'🎓'},
  {id:'casa',label:'Casa/Quarto',icon:'🏠'}, {id:'experiencia',label:'Experiência',icon:'✨'},
  {id:'outro',label:'Outro',icon:'📌'},
];
const COMPRA_STATUS = {
  desejado:{label:'Desejado',cor:'var(--text2)'}, em_analise:{label:'Em análise',cor:'var(--info)'},
  aprovado:{label:'Aprovado',cor:'var(--pos)'}, adiado:{label:'Adiado',cor:'var(--violet)'},
  aguardando_preco:{label:'Aguardando preço',cor:'var(--warn)'}, aguardando_oportunidade:{label:'Aguardando oportunidade',cor:'var(--warn)'},
  comprado:{label:'Comprado',cor:'var(--brand)'}, descartado:{label:'Descartado',cor:'var(--text3)'},
};
const _COMPRA_IMP = { nenhum:0, baixo:1, medio:2, alto:3, critico:4 };

let hobFiltroCat = '';          // '' = todas
let hobOrdenar   = 'prioridade'; // prioridade | preco | fase | classe
let hobShowComprados = false;
// Estado de UI Compras & Desejos
let _compraFiltroCat='', _compraFiltroDom='', _compraFiltroStatus='', _compraFiltroClasse='', _compraFiltroPrio='', _compraFiltroImpacto='', _compraBusca='', _compraOrdenar='prioridade';
let _compraExpanded={};

function _hob(){ if(!D.hobbies) D.hobbies = JSON.parse(JSON.stringify(DEFAULT_HOBBIES)); return D.hobbies; }
function hobCat(id){ return (_hob().cats||[]).find(c=>c.id===id) || {id:'', nome:'—', icon:'📦', cor:'#6B7280'}; }
function compraCusto(it){ return (it.preco||0) + (it.frete||0); }
function hobCusto(it){ return compraCusto(it); }
function compraDominio(id){ return COMPRA_DOMINIOS.find(d=>d.id===id) || {id:'outro',label:'Outro',icon:'📌'}; }
function compraStatus(id){ return COMPRA_STATUS[id] || COMPRA_STATUS.desejado; }
function compraClasse(id){ return COMPRA_CLASSES[id] || COMPRA_CLASSES.desejavel; }
function compraMesesParaCobrir(it){ return hobMesesParaCobrir(compraCusto(it)); }
function hobItensAbertos(){ return (_hob().itens||[]).filter(i=>i.status!=='comprado' && i.status!=='descartado'); }
function hobItensComprados(){ return (_hob().itens||[]).filter(i=>i.status==='comprado'); }
function hobTotalAberto(){ return hobItensAbertos().reduce((s,i)=>s+hobCusto(i),0); }

// Distribuição do total em aberto por classificação
function hobPorClasse(){
  const out={}; Object.keys(HOB_CLASSE).forEach(k=>out[k]=0);
  hobItensAbertos().forEach(i=>{ out[i.classe]=(out[i.classe]||0)+hobCusto(i); });
  return out;
}

// Teste de cabimento de um item contra fundo, excedente do mês e reserva ARCA
function hobFitCheck(it){
  const custo = hobCusto(it);
  const fundo = _hob().saldoFundo||0;
  const mi = getMesRefIdx();
  const exced = invDisp(mi);               // sobra do mês destinada a investir
  const caixa = caixaAtual(), metaE = metaEmergencia();
  if(custo<=0)
    return {nivel:'semfundo', custo, label:'Sem preço', cor:'var(--text3)',
      txt:'Defina um preço para avaliar o cabimento.'};
  if(custo<=fundo)
    return {nivel:'fundo', custo, label:'Cabe no fundo', cor:'var(--pos)',
      txt:`Você tem ${fmt(fundo)} no fundo — compra à vista sem mexer no resto.`};
  if(custo<=exced)
    return {nivel:'excedente', custo, label:'Cabe no excedente do mês', cor:'var(--warn)',
      txt:`Acima do fundo, mas dentro dos ${fmt(exced)} que sobrariam para investir em ${D.meses[mi]||'—'}. Comprar reduz o aporte do mês.`};
  const quebraReserva = caixa>=metaE && (caixa-custo)<metaE;
  return {nivel:'reserva', custo,
    label: quebraReserva ? 'Fura a reserva' : 'Acima do fundo e do mês',
    cor:'var(--neg)',
    txt: quebraReserva
      ? `Pagar à vista derrubaria sua reserva abaixo de ${fmt(metaE)}. Melhor acumular no fundo antes.`
      : `Acima do fundo (${fmt(fundo)}) e do excedente do mês (${fmt(exced)}). Acumule no fundo ou parcele com consciência.`};
}

// Custo de oportunidade: o que esse valor viraria se investido até a data-fim do plano,
// e a quantos meses do seu aporte atual ele equivale. Estimativa transparente (CDI).
function hobImpactoFIRE(valor){
  valor = valor||0;
  const cdiA = (D.cdi12||14.8)/100;
  const cdiM = Math.pow(1+cdiA, 1/12) - 1;
  let meses = 120, aporte = 0, dataFim = null;
  let plano = null;
  try { plano = (typeof calcularPlanoAposentadoria==='function') ? calcularPlanoAposentadoria() : null; } catch(e){ plano=null; }
  if(plano){
    dataFim = plano.cfg && plano.cfg.dataFim;
    aporte  = (plano.atual && plano.atual.aporteTotal) || 0;
    if(dataFim){
      const f = parseMes(dataFim), hoje = new Date();
      meses = Math.max(1, (f.y*12+f.m) - (hoje.getFullYear()*12+hoje.getMonth()+1));
    }
  }
  const futuro = valor * Math.pow(1+cdiM, meses);
  const mesesAporte = aporte>0 ? valor/aporte : null;
  return {valor, futuro, meses, mesesAporte, cdiA, dataFim, aporte};
}

// Meses para o fundo cobrir um valor, no ritmo de aporte atual
function hobMesesParaCobrir(valor){
  const ap = _hob().aporteMensal||0;
  const falta = Math.max(0, valor - (_hob().saldoFundo||0));
  if(falta<=0) return 0;
  if(ap<=0) return null;
  return Math.ceil(falta/ap);
}

// ── Análise estratégica da compra (regras locais, sem IA/back-end) ──
function analisarCompra(item){
  const custo = compraCusto(item);
  const flags = [];
  if(custo<=0){
    return { nivel:'sem_dados', recomendacao:'analisar', label:'Sem preço', cor:'var(--text3)',
      texto:'Defina um preço para avaliar o impacto.', flags:['sem preço definido'], custo:0 };
  }
  let exced=0, caixa=0, metaE=0; const fundo=_hob().saldoFundo||0;
  try { exced=invDisp(getMesRefIdx()); caixa=caixaAtual(); metaE=metaEmergencia(); } catch(e){}
  const hasFin = caixa>0 || metaE>0 || exced>0 || fundo>0;
  const classe = item.classe||'desejavel';
  const prio = item.prioridade||9;
  let nivel='ok';

  if(!hasFin){
    nivel='sem_dados'; flags.push('sem dados financeiros suficientes — preencha entradas, reserva e metas');
  } else {
    const cabeNoFundo = custo<=fundo;
    if(cabeNoFundo){ flags.push(`cabe no fundo de compras (${fmt(fundo)})`); }
    else if(custo<=exced){ flags.push(`cabe no excedente do mês (${fmt(exced)}), mas reduz seu aporte`); nivel='atencao'; }
    else {
      const quebra = metaE>0 && caixa>=metaE && (caixa-custo)<metaE;
      if(quebra){ flags.push(`pagar à vista derrubaria a reserva abaixo de ${fmt(metaE)}`); nivel='critico'; }
      else { flags.push('acima do fundo e do excedente do mês'); nivel='atencao'; }
    }
    // Penalidades de pressão de custo só quando NÃO cabe no fundo
    if(!cabeNoFundo){
      if(classe==='impulso'){ flags.push('classificado como impulso'); if(nivel==='ok') nivel='adiar'; }
      if(classe==='luxo' && custo>exced){ flags.push('luxo acima do excedente do mês'); if(nivel==='ok'||nivel==='atencao') nivel='adiar'; }
      if(prio>=4 && custo>exced && classe!=='essencial'){ flags.push('prioridade baixa para o custo'); if(nivel==='ok') nivel='adiar'; }
      if((classe==='essencial'||classe==='investimento_profissional'||classe==='substituir')){ flags.push('tem caráter essencial/estratégico'); if(nivel==='adiar') nivel='atencao'; }
    } else if(classe==='impulso'){
      flags.push('marcado como impulso — confirme que não é por impulso');
    }
    if((_COMPRA_IMP[item.impactoProfissional]||0)>=3) flags.push('impacto profissional alto');
    if((_COMPRA_IMP[item.impactoLazer]||0)>=3) flags.push('impacto positivo em qualidade de vida');
  }
  if(item.relacionadaAMetaId) flags.push('vinculado a uma meta');
  if(item.relacionadaADecisaoId) flags.push('possui decisão de avaliação');

  const recomendacao = nivel==='critico'?'adiar' : nivel==='adiar'?'adiar' : nivel==='atencao'?'aguardar' : nivel==='sem_dados'?'analisar' : 'comprar_agora';
  let label = nivel==='critico'?'Decisão crítica' : nivel==='adiar'?'Recomenda-se adiar' : nivel==='atencao'?'Atenção' : nivel==='sem_dados'?'Faltam dados' : 'Boa compra';
  if(classe==='luxo' && nivel!=='critico' && nivel!=='sem_dados') label='Luxo controlado';
  const cor = nivel==='critico'?'var(--neg)' : nivel==='adiar'?'var(--violet)' : nivel==='atencao'?'var(--warn)' : nivel==='sem_dados'?'var(--text3)' : 'var(--pos)';
  return { nivel, recomendacao, label, cor, texto:`${label}: ${flags.join('; ')}.`, flags, custo };
}

// ── Resumo para Dashboard Geral / cards ──
function compraResumoData(){
  const abertos=hobItensAbertos();
  const emAnalise=abertos.filter(i=>i.status==='em_analise').length;
  const adiados=(_hob().itens||[]).filter(i=>i.status==='adiado').length;
  const totalAberto=hobTotalAberto();
  const altoImpacto=abertos.filter(i=>(_COMPRA_IMP[i.impactoFinanceiro]||0)>=3).length;
  const vincMeta=abertos.filter(i=>i.relacionadaAMetaId).length;
  const vincDec=abertos.filter(i=>i.relacionadaADecisaoId).length;
  // próxima recomendada: prioridade asc, depois custo asc, ignorando adiados/descartados
  const candidatos=abertos.filter(i=>!['adiado','descartado'].includes(i.status))
    .slice().sort((a,b)=>(a.prioridade-b.prioridade)||(compraCusto(a)-compraCusto(b))||(a.fase-b.fase));
  const proximo=candidatos[0]||null;
  return { emAnalise, adiados, totalAberto, altoImpacto, vincMeta, vincDec, proximo, nAberto:abertos.length };
}

// ── Gerar Decisão / Meta a partir de uma compra (sem duplicar) ──
function criarDecisaoDaCompra(id){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  if(it.relacionadaADecisaoId && (D.decisoes||[]).some(d=>d.id===it.relacionadaADecisaoId)){
    go('decisoes'); toast('Esta compra já tem uma decisão vinculada',true,'🧭'); return;
  }
  if(!Array.isArray(D.decisoes)) D.decisoes=[];
  const agora=new Date().toISOString();
  const dec={ id:'dec_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    titulo:`Avaliar compra: ${it.nome||'item'}`, descricao:it.descricao||'',
    categoria:'compra', status:'em_analise', prioridade:'media', prazo:'',
    dataCriacao:agora, dataAtualizacao:agora, dataDecisao:'',
    custoEstimado:compraCusto(it), recorrencia:'nenhuma', valorRecorrente:0,
    impactoFinanceiro:it.impactoFinanceiro||'medio', impactoProfissional:it.impactoProfissional||'baixo',
    impactoPessoal:it.impactoLazer||'medio', impactoLazer:it.impactoLazer||'medio',
    beneficios:it.justificativa||'', riscos:'', alternativas:it.alternativas||'',
    decisaoFinal:'', observacoes:'', relacionadaACompraId:it.id, relacionadaAMetaId:it.relacionadaAMetaId||'', ativa:true };
  D.decisoes.unshift(dec);
  it.relacionadaADecisaoId=dec.id; it.dataAtualizacao=agora;
  if(it.status==='desejado') it.status='em_analise';
  scheduleAutoSave(); renderHobbies();
  toast('Decisão criada para esta compra',true,'🧭');
}
function criarMetaDaCompra(id){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  if(it.relacionadaAMetaId && (D.metas||[]).some(m=>m.id===it.relacionadaAMetaId)){
    go('metas'); toast('Esta compra já tem uma meta vinculada',true,'🎯'); return;
  }
  if(!Array.isArray(D.metas)) D.metas=[];
  const agora=new Date().toISOString();
  const meta={ id:'meta_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    nome:`Comprar ${it.nome||'item'}`, descricao:it.descricao||'', icon:'🛒',
    dominio:'compra', categoria:'', status:'em_andamento', prioridade:'media',
    unidade:'dinheiro', prazo:'', valorAlvo:compraCusto(it), valorAtual:0, progressoManual:null,
    fonte:'manual', ativoNome:'', cor:'#00D4AA', impactoFinanceiro:it.impactoFinanceiro||'medio',
    proximosPassos:'', observacoes:'', relacionadaADecisaoId:it.relacionadaADecisaoId||'', relacionadaACompraId:it.id,
    dataCriacao:agora, dataAtualizacao:agora, ativa:true };
  D.metas.unshift(meta);
  it.relacionadaAMetaId=meta.id; it.dataAtualizacao=agora;
  scheduleAutoSave(); renderHobbies();
  toast('Meta criada para esta compra',true,'🎯');
}

// ── CRUD ──
function addItemHobby(){
  const h=_hob();
  const cat = (_compraFiltroCat) || (h.cats[0]||{}).id || 'h_setup';
  const dom = ({h_setup:'tecnologia', h_rel:'patrimonio', h_cafe:'lazer', h_games:'lazer'})[cat] || 'lazer';
  const agora=new Date().toISOString();
  h.itens.unshift({id:'hi'+Date.now().toString(36)+Math.random().toString(36).slice(2,4),
    nome:'Novo desejo', descricao:'', catId:cat, tipo:'desejo', dominio:dom,
    preco:0, frete:0, custoTotal:0, classe:'desejavel',
    prioridade:(hobItensAbertos().length+1), fase:1, status:'desejado', loja:'', link:'', notas:'',
    justificativa:'', alternativas:'', melhorMomento:'',
    impactoFinanceiro:'medio', impactoLazer:(dom==='lazer'?'alto':'medio'), impactoProfissional:'baixo', impactoPatrimonio:(dom==='patrimonio'?'alto':'baixo'),
    relacionadaAMetaId:'', relacionadaADecisaoId:'',
    dataCriacao:agora, dataAtualizacao:agora, dataCompraPlanejada:'', dataCompraRealizada:'', ativo:true});
  _compraExpanded[h.itens[0].id]=true;
  scheduleAutoSave(); renderHobbies();
}
function setItemHobbyField(id, field, val){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  if(['preco','frete','prioridade','fase'].includes(field)) val = parseFloat(val)||0;
  it[field]=val;
  if(field==='preco'||field==='frete') it.custoTotal=(it.preco||0)+(it.frete||0);
  it.dataAtualizacao=new Date().toISOString();
  scheduleAutoSave(); renderHobbies();
}
function setCompraStatus(id, status){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  it.status=status; it.dataAtualizacao=new Date().toISOString();
  scheduleAutoSave(); renderHobbies();
  const lab=(COMPRA_STATUS[status]||{}).label||status; toast(`Marcado como ${lab.toLowerCase()}`,true,'🛒');
}
function toggleCompraExpand(id){ _compraExpanded[id]=!_compraExpanded[id]; renderHobbies(); }
async function removeItemHobby(id){
  const it=(_hob().itens||[]).find(x=>x.id===id);
  if(!await uiConfirm(`Remover <strong>"${it?it.nome:''}"</strong> da lista?`,{icon:'🎮',okText:'Remover'})) return;
  _hob().itens=(_hob().itens||[]).filter(x=>x.id!==id);
  scheduleAutoSave(); renderHobbies(); toast('Item removido',true,'🗑️');
}
async function comprarItemHobby(id){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  const custo=hobCusto(it);
  const ok=await uiConfirm(
    `Marcar <strong>"${it.nome}"</strong> como comprado?` +
    (custo>0?`<br><br>Vou debitar ${fmt(custo)} do fundo (saldo atual ${fmt(_hob().saldoFundo||0)}).`:''),
    {icon:'🛒',okText:'Comprei'});
  if(!ok) return;
  it.status='comprado';
  it.compradoEm = D.meses[getMesRefIdx()]||'';
  _hob().saldoFundo = Math.max(0,(_hob().saldoFundo||0)-custo);
  scheduleAutoSave(); renderHobbies(); toast('Comprado! 🎉',true,'🎉');
}
function restaurarItemHobby(id){
  const it=(_hob().itens||[]).find(x=>x.id===id); if(!it) return;
  it.status='desejado'; it.compradoEm='';
  scheduleAutoSave(); renderHobbies();
}
function setHobbyFundo(field, val){
  _hob()[field] = parseFloat(val)||0;
  scheduleAutoSave(); renderHobbies();
}
// Categorias
function addCatHobby(){
  _hob().cats.push({id:'h'+Date.now().toString(36).slice(-4), nome:'Nova categoria', icon:'📦', cor:'#6B7280'});
  scheduleAutoSave(); renderHobbies();
}
function setCatHobbyField(id, field, val){
  const c=(_hob().cats||[]).find(x=>x.id===id); if(!c) return;
  c[field]=val; scheduleAutoSave(); renderHobbies();
}
async function removeCatHobby(id){
  const usados=(_hob().itens||[]).filter(i=>i.catId===id).length;
  if(usados>0){ uiAlert(`Esta categoria tem ${usados} item(ns). Mova-os antes de remover.`,{icon:'⚠️'}); return; }
  if(!await uiConfirm('Remover esta categoria?',{icon:'🗂️',okText:'Remover'})) return;
  _hob().cats=(_hob().cats||[]).filter(x=>x.id!==id);
  if(hobFiltroCat===id) hobFiltroCat='';
  scheduleAutoSave(); renderHobbies();
}
function setHobFiltro(cat){ hobFiltroCat=cat; _compraFiltroCat=cat; renderHobbies(); }
function setHobOrdenar(v){ hobOrdenar=v; renderHobbies(); }
function toggleHobComprados(){ hobShowComprados=!hobShowComprados; renderHobbies(); }
function setCompraFiltro(campo,val){
  ({cat:()=>_compraFiltroCat=val, dom:()=>_compraFiltroDom=val, status:()=>_compraFiltroStatus=val,
    classe:()=>_compraFiltroClasse=val, prio:()=>_compraFiltroPrio=val, imp:()=>_compraFiltroImpacto=val,
    busca:()=>_compraBusca=val, ord:()=>_compraOrdenar=val}[campo]||(()=>{}))();
  if(campo==='cat') hobFiltroCat=val;
  renderHobbies();
}

// ── RENDER: página ──
function renderHobbies(){
  renderHobFundo();
  renderHobLista();
}

function renderHobFundo(){
  const el=document.getElementById('hob-fundo'); if(!el) return;
  const h=_hob();
  const totalAberto=hobTotalAberto();
  const nAberto=hobItensAbertos().length;
  const porClasse=hobPorClasse();
  const imp=hobImpactoFIRE(totalAberto);
  // Próximo alvo: maior prioridade entre os abertos
  const proximos=hobItensAbertos().slice().sort((a,b)=>(a.prioridade-b.prioridade)||(a.fase-b.fase));
  const alvo=proximos[0];
  const mesesAlvo=alvo?hobMesesParaCobrir(hobCusto(alvo)):null;

  // Barras de distribuição por classe
  const ordemCl=Object.keys(HOB_CLASSE).sort((a,b)=>HOB_CLASSE[a].ord-HOB_CLASSE[b].ord);
  const barras=ordemCl.map(k=>{
    const v=porClasse[k]||0; const pctv=totalAberto>0?(v/totalAberto)*100:0;
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:11px;width:92px;color:var(--text2)">${HOB_CLASSE[k].label}</span>
      <div style="flex:1;height:8px;background:var(--card3);border-radius:99px;overflow:hidden">
        <div style="height:8px;width:${pctv}%;background:${HOB_CLASSE[k].cor};border-radius:99px"></div></div>
      <span style="font-size:11px;font-weight:700;min-width:96px;text-align:right">${fmt(v)}</span>
    </div>`;
  }).join('');

  el.innerHTML=`<div class="panel">
    <div class="panel-head"><span class="panel-title">💰 Fundo de Compras</span>
      <span class="panel-badge">${nAberto} item(ns) em aberto</span></div>
    <div style="padding:16px">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">
        <div style="background:var(--card2);border-radius:var(--r12);padding:12px 14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">Saldo do fundo</div>
          <input type="number" step="50" value="${h.saldoFundo||0}" onchange="setHobbyFundo('saldoFundo',this.value)"
            style="width:100%;font-size:18px;font-weight:800;color:var(--brand);background:transparent;border:none;padding:4px 0;margin-top:2px">
        </div>
        <div style="background:var(--card2);border-radius:var(--r12);padding:12px 14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">Aporte mensal</div>
          <input type="number" step="50" value="${h.aporteMensal||0}" onchange="setHobbyFundo('aporteMensal',this.value)"
            style="width:100%;font-size:18px;font-weight:800;background:transparent;border:none;padding:4px 0;margin-top:2px">
        </div>
        <div style="background:var(--card2);border-radius:var(--r12);padding:12px 14px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">Total desejado</div>
          <div style="font-size:18px;font-weight:800;margin-top:6px">${fmt(totalAberto)}</div>
        </div>
      </div>

      ${alvo?`<div style="background:var(--card2);border-radius:var(--r10);padding:12px 14px;margin-bottom:14px">
        <div style="font-size:11px;color:var(--text2);margin-bottom:3px">🎯 Próximo alvo (prioridade ${alvo.prioridade})</div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <strong style="font-size:14px">${hobCat(alvo.catId).icon} ${escapeHTML(alvo.nome)}</strong>
          <span style="font-size:13px;font-weight:700">${fmt(hobCusto(alvo))}</span>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:4px">${
          hobCusto(alvo)<=0 ? 'Defina o preço para estimar.' :
          (mesesAlvo===0 ? 'Já cabe no fundo.' :
           mesesAlvo===null ? 'Defina um aporte mensal para projetar o tempo até juntar.' :
           `No seu ritmo de ${fmt(h.aporteMensal||0)}/mês, o fundo cobre em <strong style="color:var(--text)">${mesesAlvo} ${mesesAlvo===1?'mês':'meses'}</strong>.`)
        }</div>
      </div>`:''}

      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px">Total em aberto por classificação</div>
        ${barras}
      </div>

      ${totalAberto>0?`<div style="background:var(--card2);border:1px dashed var(--border2);border-radius:var(--r10);padding:12px 14px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px">📉 Custo de oportunidade</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.55">
          Se em vez de gastar você investisse os <strong style="color:var(--text)">${fmt(totalAberto)}</strong> em aberto
          a <strong style="color:var(--text)">${(imp.cdiA*100).toFixed(2)}% a.a.</strong>,
          ${imp.dataFim?`até <strong style="color:var(--text)">${imp.dataFim}</strong> `:''}virariam
          <strong style="color:var(--brand)">${fmt(imp.futuro)}</strong>${imp.dataFim?'':' em ~10 anos'}.
          ${imp.mesesAporte!=null?`<br>É como ${(imp.mesesAporte).toFixed(1)} ${imp.mesesAporte<2?'mês':'meses'} do seu aporte atual de ${fmt(imp.aporte)}/mês ao plano.`:''}
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:6px">Estimativa transparente (juros compostos pelo CDI). Não é proibição — é o trade-off, visível.</div>
      </div>`:''}
    </div>
  </div>`;
}

function renderHobLista(){
  const el=document.getElementById('hob-lista'); if(!el) return;
  const h=_hob();

  // Resumo estratégico
  const R=compraResumoData();
  const rc=(icon,label,valor,cor)=>`<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:11px 13px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">${icon} ${label}</div>
    <div style="font-size:18px;font-weight:800;color:${cor||'var(--text)'};margin-top:2px">${valor}</div></div>`;
  const resumo=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px;margin-bottom:14px">
    ${rc('🛒','Em aberto',R.nAberto,'var(--text)')}
    ${rc('💰','Total aberto',fmt(R.totalAberto),'var(--violet)')}
    ${rc('🔍','Em análise',R.emAnalise,'var(--info)')}
    ${rc('⏸️','Adiados',R.adiados,R.adiados>0?'var(--warn)':'var(--text)')}
    ${rc('🎯','Vinc. metas',R.vincMeta,'var(--text)')}
    ${rc('🧭','Vinc. decisões',R.vincDec,'var(--text)')}
  </div>`;

  // Filtros + busca + ordenação
  let abertos=hobItensAbertos();
  if(_compraFiltroCat)    abertos=abertos.filter(i=>i.catId===_compraFiltroCat);
  if(_compraFiltroDom)    abertos=abertos.filter(i=>(i.dominio||'lazer')===_compraFiltroDom);
  if(_compraFiltroStatus) abertos=abertos.filter(i=>(i.status||'desejado')===_compraFiltroStatus);
  if(_compraFiltroClasse) abertos=abertos.filter(i=>(i.classe||'desejavel')===_compraFiltroClasse);
  if(_compraFiltroPrio)   abertos=abertos.filter(i=>String(i.prioridade)===String(_compraFiltroPrio));
  if(_compraFiltroImpacto)abertos=abertos.filter(i=>(i.impactoFinanceiro||'medio')===_compraFiltroImpacto);
  if(_compraBusca){ const q=_compraBusca.toLowerCase(); abertos=abertos.filter(i=>['nome','descricao','loja','notas','justificativa','alternativas'].some(k=>(i[k]||'').toLowerCase().includes(q))); }
  const ordenadores={
    prioridade:(a,b)=>(a.prioridade-b.prioridade)||(a.fase-b.fase),
    custo:(a,b)=>compraCusto(b)-compraCusto(a),
    fase:(a,b)=>(a.fase-b.fase)||(a.prioridade-b.prioridade),
    status:(a,b)=>(a.status||'').localeCompare(b.status||''),
    criacao:(a,b)=>(b.dataCriacao||'').localeCompare(a.dataCriacao||''),
    momento:(a,b)=>(a.melhorMomento||'~').localeCompare(b.melhorMomento||'~'),
    impacto:(a,b)=>(_COMPRA_IMP[b.impactoFinanceiro]||0)-(_COMPRA_IMP[a.impactoFinanceiro]||0),
  };
  abertos=abertos.slice().sort(ordenadores[_compraOrdenar]||ordenadores.prioridade);

  const selStr=(obj,sel,labelKey)=>{
    if(Array.isArray(obj)) return obj.map(c=>`<option value="${attr(c.id)}"${c.id===sel?' selected':''}>${escapeHTML(c.icon||'')} ${escapeHTML(c.label)}</option>`).join('');
    return Object.keys(obj).map(k=>`<option value="${attr(k)}"${k===sel?' selected':''}>${escapeHTML(obj[k][labelKey]||obj[k].label||obj[k])}</option>`).join('');
  };
  const catOpts=(sel)=> (h.cats||[]).map(c=>`<option value="${attr(c.id)}"${c.id===sel?' selected':''}>${escapeHTML(c.icon||'')} ${escapeHTML(c.nome)}</option>`).join('');

  const filtros=`<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
    <input type="text" value="${attr(_compraBusca)}" oninput="setCompraFiltro('busca',this.value)" placeholder="🔍 Buscar nome, loja, notas…" style="flex:1;min-width:150px;height:34px">
    <select onchange="setCompraFiltro('cat',this.value)" style="height:34px;font-size:12px"><option value="">Categoria: todas</option>${catOpts(_compraFiltroCat)}</select>
    <select onchange="setCompraFiltro('dom',this.value)" style="height:34px;font-size:12px"><option value="">Domínio: todos</option>${selStr(COMPRA_DOMINIOS,_compraFiltroDom)}</select>
    <select onchange="setCompraFiltro('status',this.value)" style="height:34px;font-size:12px"><option value="">Status: todos</option>${selStr(COMPRA_STATUS,_compraFiltroStatus)}</select>
    <select onchange="setCompraFiltro('classe',this.value)" style="height:34px;font-size:12px"><option value="">Classe: todas</option>${selStr(COMPRA_CLASSES,_compraFiltroClasse)}</select>
    <select onchange="setCompraFiltro('imp',this.value)" style="height:34px;font-size:12px"><option value="">Impacto fin.: todos</option>${Object.keys(_COMPRA_IMP).map(k=>`<option value="${k}"${k===_compraFiltroImpacto?' selected':''}>${k}</option>`).join('')}</select>
    <select onchange="setCompraFiltro('ord',this.value)" style="height:34px;font-size:12px">
      <option value="prioridade"${_compraOrdenar==='prioridade'?' selected':''}>Ordenar: prioridade</option>
      <option value="custo"${_compraOrdenar==='custo'?' selected':''}>Ordenar: maior custo</option>
      <option value="fase"${_compraOrdenar==='fase'?' selected':''}>Ordenar: fase</option>
      <option value="status"${_compraOrdenar==='status'?' selected':''}>Ordenar: status</option>
      <option value="criacao"${_compraOrdenar==='criacao'?' selected':''}>Ordenar: mais recentes</option>
      <option value="momento"${_compraOrdenar==='momento'?' selected':''}>Ordenar: melhor momento</option>
      <option value="impacto"${_compraOrdenar==='impacto'?' selected':''}>Ordenar: impacto financeiro</option>
    </select>
    <button class="btn btn-pri" style="height:34px;font-size:13px" onclick="addItemHobby()">+ Novo desejo</button>
  </div>`;

  const impOpts=(sel)=>Object.keys(_COMPRA_IMP).map(k=>`<option value="${k}"${k===sel?' selected':''}>${k}</option>`).join('');

  const cards=abertos.map(it=>{
    const cat=hobCat(it.catId), dom=compraDominio(it.dominio||'lazer'), st=compraStatus(it.status), cl=compraClasse(it.classe);
    const A=analisarCompra(it), custo=compraCusto(it);
    const exp=_compraExpanded[it.id];
    const meses=compraMesesParaCobrir(it);
    const metaRel=it.relacionadaAMetaId?(D.metas||[]).find(m=>m.id===it.relacionadaAMetaId):null;
    const decRel=it.relacionadaADecisaoId?(D.decisoes||[]).find(d=>d.id===it.relacionadaADecisaoId):null;
    const linkSafe = (it.link && /^https?:\/\//i.test(it.link)) ? it.link : '';

    const editor = exp ? `
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;display:grid;gap:10px">
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Descrição</label>
          <textarea oninput="setItemHobbyField('${it.id}','descricao',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(it.descricao||'')}</textarea></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Preço (R$)</label>
            <input type="number" step="10" value="${it.preco||0}" onchange="setItemHobbyField('${it.id}','preco',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Frete (R$)</label>
            <input type="number" step="5" value="${it.frete||0}" onchange="setItemHobbyField('${it.id}','frete',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Categoria</label>
            <select onchange="setItemHobbyField('${it.id}','catId',this.value)">${catOpts(it.catId)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Domínio</label>
            <select onchange="setItemHobbyField('${it.id}','dominio',this.value)">${selStr(COMPRA_DOMINIOS,it.dominio||'lazer')}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Classe</label>
            <select onchange="setItemHobbyField('${it.id}','classe',this.value)">${selStr(COMPRA_CLASSES,it.classe)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Status</label>
            <select onchange="setItemHobbyField('${it.id}','status',this.value)">${selStr(COMPRA_STATUS,it.status)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Prioridade</label>
            <input type="number" step="1" min="1" value="${it.prioridade||1}" onchange="setItemHobbyField('${it.id}','prioridade',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Fase (1-5)</label>
            <input type="number" step="1" min="1" max="5" value="${it.fase||1}" onchange="setItemHobbyField('${it.id}','fase',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Loja</label>
            <input type="text" value="${attr(it.loja||'')}" onchange="setItemHobbyField('${it.id}','loja',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Link (https)</label>
            <input type="text" value="${attr(it.link||'')}" onchange="setItemHobbyField('${it.id}','link',this.value)" placeholder="https://…"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Melhor momento</label>
            <input type="text" value="${attr(it.melhorMomento||'')}" onchange="setItemHobbyField('${it.id}','melhorMomento',this.value)" placeholder="Black Friday, Dez/26…"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Impacto financeiro</label><select onchange="setItemHobbyField('${it.id}','impactoFinanceiro',this.value)">${impOpts(it.impactoFinanceiro)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Impacto lazer</label><select onchange="setItemHobbyField('${it.id}','impactoLazer',this.value)">${impOpts(it.impactoLazer)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Impacto profissional</label><select onchange="setItemHobbyField('${it.id}','impactoProfissional',this.value)">${impOpts(it.impactoProfissional)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Impacto patrimônio</label><select onchange="setItemHobbyField('${it.id}','impactoPatrimonio',this.value)">${impOpts(it.impactoPatrimonio)}</select></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Justificativa</label>
            <textarea oninput="setItemHobbyField('${it.id}','justificativa',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(it.justificativa||'')}</textarea></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Alternativas</label>
            <textarea oninput="setItemHobbyField('${it.id}','alternativas',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(it.alternativas||'')}</textarea></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Meta vinculada</label>
            <select onchange="setItemHobbyField('${it.id}','relacionadaAMetaId',this.value)"><option value="">— nenhuma —</option>
              ${((D.metas||[]).map(m=>`<option value="${attr(m.id)}"${m.id===it.relacionadaAMetaId?' selected':''}>${escapeHTML((typeof metaDom==='function'?metaDom(m.dominio).icon+' ':'')+(m.nome||''))}</option>`)).join('')}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Decisão vinculada</label>
            <select onchange="setItemHobbyField('${it.id}','relacionadaADecisaoId',this.value)"><option value="">— nenhuma —</option>
              ${((D.decisoes||[]).map(d=>`<option value="${attr(d.id)}"${d.id===it.relacionadaADecisaoId?' selected':''}>${escapeHTML(d.titulo||'(sem título)')}</option>`)).join('')}</select></div>
        </div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Notas</label>
          <input type="text" value="${attr(it.notas||'')}" onchange="setItemHobbyField('${it.id}','notas',this.value)" placeholder="observação rápida"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${!decRel?`<button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="criarDecisaoDaCompra('${it.id}')">🧭 Criar decisão</button>`:''}
          ${!metaRel?`<button class="btn btn-ghost" style="height:32px;font-size:12px" onclick="criarMetaDaCompra('${it.id}')">🎯 Criar meta</button>`:''}
          <div style="flex:1"></div>
          <button class="btn btn-neg" style="height:32px;font-size:12px" onclick="removeItemHobby('${it.id}')">🗑️ Excluir</button>
        </div>
      </div>` : '';

    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${cl.cor};border-radius:var(--r14);padding:14px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;gap:9px">
        <span style="font-size:18px;flex-shrink:0">${escapeHTML(cat.icon||'📦')}</span>
        <div style="flex:1;min-width:0">
          <input type="text" value="${attr(it.nome||'')}" onchange="setItemHobbyField('${it.id}','nome',this.value)" placeholder="Nome do desejo" style="font-weight:700;font-size:14px;width:100%">
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center">
            <span class="badge" style="background:var(--card3);font-size:10px">${escapeHTML(dom.icon)} ${escapeHTML(dom.label)}</span>
            <span class="badge" style="background:var(--card3);color:${st.cor};font-size:10px">${escapeHTML(st.label)}</span>
            <span class="badge" style="background:var(--card3);color:${cl.cor};font-size:10px">${escapeHTML(cl.label)}</span>
            <span style="font-size:10px;color:var(--text3)">P${it.prioridade||1}·F${it.fase||1}</span>
            ${metaRel?`<span style="font-size:10px;color:var(--text3)">🎯 ${escapeHTML(metaRel.nome||'')}${typeof metaProgress==='function'?` (${Math.round(metaProgress(metaRel).pct)}%)`:''}</span>`:''}
            ${decRel?`<span style="font-size:10px;color:var(--text3)">🧭 ${escapeHTML((compraStatus(decRel.status)?'':''))}${escapeHTML(decRel.titulo||'')}</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:16px;font-weight:800">${custo>0?fmt(custo):'<span style=\"font-size:11px;color:var(--text3)\">sem preço</span>'}</div>
          <button class="btn btn-ghost" style="height:26px;font-size:11px;margin-top:4px" onclick="toggleCompraExpand('${it.id}')">${exp?'▴ fechar':'▾ detalhes'}</button>
        </div>
      </div>
      <div style="background:var(--card2);border-left:3px solid ${A.cor};border-radius:var(--r10);padding:8px 11px;margin-top:10px">
        <div style="font-size:11.5px;color:var(--text2);line-height:1.45">${escapeHTML(A.texto)}</div>
        ${custo>0?`<div style="font-size:10.5px;color:var(--text3);margin-top:4px">${meses===0?'✅ cabe no fundo agora':meses==null?'defina um aporte no fundo para estimar meses':`⏳ ~${meses} ${meses===1?'mês':'meses'} de aporte para cobrir`}${it.melhorMomento?` · 🗓️ ${escapeHTML(it.melhorMomento)}`:''}</div>`:''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <button class="btn btn-pri" style="height:30px;font-size:12px;flex:1;min-width:90px" onclick="comprarItemHobby('${it.id}')">✓ Comprei</button>
        <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="setCompraStatus('${it.id}','adiado')">⏸️ Adiar</button>
        <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="setCompraStatus('${it.id}','descartado')">✕ Descartar</button>
        ${linkSafe?`<a href="${attr(linkSafe)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" style="height:30px;font-size:12px;display:inline-flex;align-items:center;padding:0 12px;text-decoration:none">🔗 Abrir</a>`:''}
      </div>
      ${editor}
    </div>`;
  }).join('');

  // Comprados / descartados (recolhível)
  const finalizados=(_hob().itens||[]).filter(i=>i.status==='comprado'||i.status==='descartado').slice().sort((a,b)=>(a.prioridade-b.prioridade));
  const finHtml = finalizados.length ? `
    <div style="margin-top:18px">
      <button class="btn btn-ghost" style="height:34px;font-size:12px" onclick="toggleHobComprados()">${hobShowComprados?'▾':'▸'} Comprados / descartados (${finalizados.length})</button>
      ${hobShowComprados?`<div style="margin-top:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">
        ${finalizados.map(it=>{const cat=hobCat(it.catId);const comp=it.status==='comprado';return `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:10px 12px;opacity:.85">
          <div style="display:flex;align-items:center;gap:7px">
            <span>${escapeHTML(cat.icon||'📦')}</span>
            <strong style="font-size:13px;flex:1;min-width:0">${escapeHTML(it.nome)}</strong>
            <button class="btn-rm" title="Remover" onclick="removeItemHobby('${it.id}')">✕</button>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-top:4px">${comp?'✅ '+fmt(compraCusto(it)):'✕ descartado'}${it.dataCompraRealizada?` · ${escapeHTML(it.dataCompraRealizada)}`:''}
            · <a href="#" onclick="restaurarItemHobby('${it.id}');return false" style="color:var(--accent)">restaurar</a></div>
        </div>`;}).join('')}
      </div>`:''}
    </div>` : '';

  el.innerHTML=`<div class="panel">
    <div class="panel-head"><span class="panel-title">🛒 Compras & Desejos</span></div>
    <div style="padding:14px 16px">
      ${resumo}${filtros}
      ${abertos.length?cards
        :`<div class="empty" style="padding:24px"><div class="empty-icon">🛒</div><div class="empty-text">Nenhum desejo ${(_compraFiltroCat||_compraFiltroDom||_compraFiltroStatus||_compraBusca)?'neste filtro':'em aberto'}. Adicione algo que você quer comprar e veja na hora se cabe no fundo, no excedente do mês, e o impacto na reserva e nas metas — além de poder gerar uma decisão ou meta a partir dele.</div></div>`}
      ${finHtml}
    </div>
  </div>`;
}

// ── RENDER: card no dashboard ──
function renderDashHobbies(){
  const el=document.getElementById('dash-hobbies'); if(!el) return;
  const h=_hob();
  const abertos=hobItensAbertos();
  if(!abertos.length){ el.innerHTML=''; return; }
  const total=hobTotalAberto();
  const proximos=abertos.slice().sort((a,b)=>(a.prioridade-b.prioridade)||(a.fase-b.fase));
  const alvo=proximos[0];
  const fit=alvo?hobFitCheck(alvo):null;
  const meses=alvo?hobMesesParaCobrir(hobCusto(alvo)):null;
  el.innerHTML=`<div class="panel">
    <div class="panel-head"><span class="panel-title">🎮 Hobbies & aquisições</span>
      <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="goSide('hobbies')">Abrir →</button></div>
    <div style="padding:14px 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:center">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">Fundo do hobby</div>
        <div style="font-size:18px;font-weight:800;color:var(--brand)">${fmt(h.saldoFundo||0)}</div>
        <div style="font-size:11px;color:var(--text3)">${(h.aporteMensal||0)>0?`+${fmt(h.aporteMensal)}/mês`:'sem aporte definido'}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">Total desejado</div>
        <div style="font-size:18px;font-weight:800">${fmt(total)}</div>
        <div style="font-size:11px;color:var(--text3)">${abertos.length} item(ns) em aberto</div>
      </div>
      ${alvo?`<div style="grid-column:1/-1;background:var(--card2);border-radius:var(--r10);padding:10px 12px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text2)">🎯 Próximo: <strong style="color:var(--text)">${hobCat(alvo.catId).icon} ${escapeHTML(alvo.nome)}</strong></span>
          <span style="font-size:12px;font-weight:700">${hobCusto(alvo)>0?fmt(hobCusto(alvo)):'sem preço'}</span>
        </div>
        ${fit?`<div style="font-size:11px;font-weight:700;color:${fit.cor};margin-top:4px">${fit.nivel==='fundo'?'✅':fit.nivel==='excedente'?'⚠️':fit.nivel==='reserva'?'⛔':'·'} ${fit.label}${(meses && meses>0)?` · ~${meses} ${meses===1?'mês':'meses'} no ritmo atual`:''}</div>`:''}
      </div>`:''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════
//  🎨 CONFIGURAÇÃO DO SISTEMA (global · systemConfig/app)
//  Identidade visual e cores parametrizáveis. Edição só por
//  superadmin (UI + firestore.rules). Leitura por autenticado.
//  NUNCA guardar segredos/tokens/dados pessoais aqui.
// ═══════════════════════════════════════════════════
const SYS_DEFAULTS = {
  identity: {
    systemName:        'FinançasPRO',
    subtitle:          'Controle Financeiro Pessoal',
    slogan:            '',
    financeModuleName: 'FinançasPRO',
    generalModuleName: 'Central Pessoal',
    loginText:         '',
    footerText:        '',
    mainIcon:          '₿',
    sidebarName:       'FinançasPRO',
    browserTitle:      'FinançasPRO',
    logoUrl:           '',
    logoSmallUrl:      '',
    faviconUrl:        ''
  },
  // Cores: string vazia = usa o padrão do CSS. Só hex válido é aplicado.
  theme: { brand:'', accent:'', pos:'', neg:'', warn:'', info:'' },
  // Menu global (null = usa DEFAULT_MENU). Estrutura: [{id,label,icon,order,active,minRole,items:[...]}]
  menu: null
};
let SYSCFG = JSON.parse(JSON.stringify(SYS_DEFAULTS));

function isHexColor(v){ return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v||'').trim()); }

function _mergeSysCfg(cfg){
  const out = JSON.parse(JSON.stringify(SYS_DEFAULTS));
  if(cfg && typeof cfg==='object'){
    if(cfg.identity && typeof cfg.identity==='object') Object.assign(out.identity, cfg.identity);
    if(cfg.theme    && typeof cfg.theme==='object')    Object.assign(out.theme, cfg.theme);
    if(Array.isArray(cfg.menu) && cfg.menu.length)     out.menu = cfg.menu;
  }
  return out;
}

// Aplica identidade + cores à UI (sem reload). Texto é tratado com textContent (sem XSS).
function applySystemConfig(cfg){
  SYSCFG = _mergeSysCfg(cfg);
  const id = SYSCFG.identity;
  if(id.browserTitle) document.title = id.browserTitle;
  const brandName = document.querySelector('.sidebar-brand-name');
  if(brandName && id.sidebarName) brandName.textContent = id.sidebarName; // textContent: seguro
  const brandIcon = document.querySelector('.sidebar-brand-icon');
  if(brandIcon && id.mainIcon) brandIcon.textContent = id.mainIcon;
  if(id.faviconUrl){
    let link = document.querySelector('link[rel="icon"]');
    if(!link){ link=document.createElement('link'); link.rel='icon'; document.head.appendChild(link); }
    link.href = id.faviconUrl;
  }
  const t = SYSCFG.theme;
  [['brand','--brand'],['accent','--accent'],['pos','--pos'],['neg','--neg'],['warn','--warn'],['info','--info']]
    .forEach(([k,varName])=>{ if(isHexColor(t[k])) document.documentElement.style.setProperty(varName, t[k]); });
  if(typeof renderSidebar==='function') renderSidebar();
}

// Carregamento pós-login (chamado do app.html). Falha silenciosa → mantém defaults.
function loadSystemConfig(){
  try {
    return db.collection('systemConfig').doc('app').get()
      .then(s => applySystemConfig(s && s.exists ? s.data() : null))
      .catch(()=> applySystemConfig(null));
  } catch(e){ applySystemConfig(null); }
}

// ── Editor (somente superadmin) ──
const _SYS_ID_FIELDS = [
  ['systemName','Nome do sistema'], ['subtitle','Subtítulo'], ['slogan','Slogan'],
  ['financeModuleName','Nome do módulo financeiro'], ['generalModuleName','Nome do módulo geral'],
  ['sidebarName','Nome na sidebar'], ['browserTitle','Título do navegador'], ['mainIcon','Ícone/emoji principal'],
  ['loginText','Texto da tela de login'], ['footerText','Texto do rodapé'],
  ['logoUrl','Logo (URL)'], ['logoSmallUrl','Logo reduzida (URL)'], ['faviconUrl','Favicon (URL)']
];
const _SYS_COLOR_FIELDS = [
  ['brand','Cor primária'], ['accent','Cor de destaque'], ['pos','Cor positiva'],
  ['neg','Cor negativa'], ['warn','Cor de alerta'], ['info','Cor informativa']
];

function setSysIdField(key, val){ SYSCFG.identity[key]=val; applySystemConfig(SYSCFG); }
function setSysColor(key, val){
  SYSCFG.theme[key]=val;
  // Preview ao vivo só se hex válido; senão limpa override (volta ao CSS)
  const map={brand:'--brand',accent:'--accent',pos:'--pos',neg:'--neg',warn:'--warn',info:'--info'};
  if(isHexColor(val)) document.documentElement.style.setProperty(map[key], val);
  else if(!val) document.documentElement.style.removeProperty(map[key]);
  renderSysConfigBadges();
}
function renderSysConfigBadges(){
  _SYS_COLOR_FIELDS.forEach(([k])=>{
    const b=document.getElementById('sys-color-chip-'+k);
    if(b){ const v=SYSCFG.theme[k]; b.style.background=isHexColor(v)?v:'transparent'; b.style.borderStyle=isHexColor(v)?'solid':'dashed'; }
  });
}

function salvarSysConfig(){
  if(_role!=='superadmin'){ toast('Apenas administradores podem editar configurações globais.',false); return; }
  // Validação de cores antes de salvar
  for(const [k,label] of _SYS_COLOR_FIELDS){
    const v=SYSCFG.theme[k];
    if(v && !isHexColor(v)){ toast(`Cor inválida em "${label}". Use hex (#RRGGBB).`,false); return; }
  }
  const btn=document.getElementById('sys-save-btn'); if(btn){ btn.disabled=true; btn.textContent='Salvando...'; }
  const payload={ identity:SYSCFG.identity, theme:SYSCFG.theme, updatedAt:new Date().toISOString(), updatedBy:_user&&_user.uid };
  db.collection('systemConfig').doc('app').set(payload)
    .then(()=> toast('Configurações do sistema salvas! 🎨'))
    .catch(e=> toast('Erro ao salvar: '+e.message, false))
    .finally(()=>{ if(btn){ btn.disabled=false; btn.textContent='💾 Salvar configurações globais'; } });
}
function resetSysColors(){
  _SYS_COLOR_FIELDS.forEach(([k])=>{ SYSCFG.theme[k]=''; const map={brand:'--brand',accent:'--accent',pos:'--pos',neg:'--neg',warn:'--warn',info:'--info'}; document.documentElement.style.removeProperty(map[k]); });
  renderSysConfig();
}

function renderSysConfig(){
  const el=document.getElementById('sysconfig-body'); if(!el) return;
  if(_role!=='superadmin'){
    el.innerHTML=`<div class="panel"><div class="empty" style="padding:32px">
      <div class="empty-icon">🔒</div>
      <div class="empty-text">Esta área é exclusiva para administradores. As configurações globais (nome, identidade e cores do sistema) só podem ser editadas por um superadmin.</div>
    </div></div>`;
    return;
  }
  const id=SYSCFG.identity, t=SYSCFG.theme;
  const idInputs=_SYS_ID_FIELDS.map(([k,label])=>`
    <div class="field" style="margin:0">
      <label class="flabel" style="font-size:11px">${label}</label>
      <input type="text" value="${attr(id[k]||'')}" onchange="setSysIdField('${k}',this.value)" placeholder="${attr(SYS_DEFAULTS.identity[k]||'')}">
    </div>`).join('');
  const colorInputs=_SYS_COLOR_FIELDS.map(([k,label])=>`
    <div class="field" style="margin:0">
      <label class="flabel" style="font-size:11px">${label}</label>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="sys-color-chip-${k}" style="width:26px;height:26px;border-radius:7px;border:2px ${isHexColor(t[k])?'solid':'dashed'} var(--border2);background:${isHexColor(t[k])?t[k]:'transparent'};flex-shrink:0"></span>
        <input type="text" value="${attr(t[k]||'')}" onchange="setSysColor('${k}',this.value)" placeholder="padrão do tema (#RRGGBB)" style="flex:1">
      </div>
    </div>`).join('');

  el.innerHTML=`
    <div class="panel mb">
      <div class="panel-head"><span class="panel-title">🪪 Identidade visual</span>
        <span class="panel-badge">global · systemConfig/app</span></div>
      <div style="padding:16px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:14px;line-height:1.5">
          Define nome, textos e marca exibidos na sidebar, no título do navegador, na tela de login e nos relatórios.
          Reflete na hora (pré-visualização). Salve para aplicar a todos os usuários.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${idInputs}</div>
      </div>
    </div>
    <div class="panel mb">
      <div class="panel-head"><span class="panel-title">🎨 Cores do tema</span>
        <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="resetSysColors()">Restaurar padrão</button></div>
      <div style="padding:16px">
        <div style="font-size:12px;color:var(--text2);margin-bottom:14px;line-height:1.5">
          Use hexadecimal (<code>#RRGGBB</code>). Campo vazio mantém a cor padrão do tema. Cores inválidas são ignoradas e não quebram o contraste do modo claro/escuro.
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">${colorInputs}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:10px">
      <button class="btn btn-pri" id="sys-save-btn" onclick="salvarSysConfig()" style="height:40px">💾 Salvar configurações globais</button>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px">
      ⚠️ Estas são configurações <strong>globais</strong> do sistema (identidade e cores). Preferências individuais (tema claro/escuro, etc.) são salvas por usuário e não afetam os demais.
    </div>`;
  renderSysConfigBadges();
}

// ═══════════════════════════════════════════════════
//  🧭 NAVEGAÇÃO DINÂMICA (sidebar orientada a dados)
//  Menu vem de SYSCFG.menu (global) com fallback para DEFAULT_MENU.
//  Labels/ícones são tratados como dados não confiáveis (escapeHTML).
//  Cliques via delegação (data-page), sem onclick inline.
// ═══════════════════════════════════════════════════
let _activeNav = 'dash';

// Mapa de páginas reais já existentes (não quebrar navegação atual).
const DEFAULT_MENU = [
  { id:'geral', label:'Visão Geral', icon:'🏠', order:1, active:true, items:[
    { id:'geral',  label:'Dashboard Geral', icon:'📌', page:'geral', active:true },
  ]},
  { id:'financas', label:'Finanças', icon:'💰', order:2, active:true, items:[
    { id:'dash',     label:'Dashboard Financeiro', icon:'📊', page:'dash',     active:true },
    { id:'entradas', label:'Entradas',             icon:'💵', page:'entradas', active:true },
    { id:'saidas',   label:'Saídas',               icon:'💸', page:'saidas',   active:true },
    { id:'faturas',  label:'Faturas',              icon:'✅', page:'faturas',  active:true },
    { id:'carteira', label:'Carteira',             icon:'💼', page:'carteira', active:true },
    { id:'metas',    label:'Metas & Orçamentos',   icon:'🎯', page:'metas',    active:true },
    { id:'invest',   label:'Investimentos',        icon:'📈', page:'invest',   active:true },
  ]},
  { id:'trabalho', label:'Trabalho', icon:'💼', order:3, active:true, items:[
    { id:'trabalho', label:'Projetos & Tarefas', icon:'🗂️', page:'trabalho', active:true },
  ]},
  { id:'carreira', label:'Carreira', icon:'🚀', order:4, active:true, items:[
    { id:'carreira', label:'Objetivos & Evolução', icon:'🎓', page:'carreira', active:true },
  ]},
  { id:'planejamento', label:'Planejamento', icon:'🗓️', order:5, active:true, items:[
    { id:'planejamento', label:'Objetivos & Hábitos', icon:'✅', page:'planejamento', active:true },
  ]},
  { id:'lazer', label:'Lazer', icon:'🎮', order:6, active:true, items:[
    { id:'lazer', label:'Lazer & Hobbies', icon:'🎮', page:'lazer', active:true },
  ]},
  { id:'compras', label:'Compras & Desejos', icon:'🛒', order:7, active:true, items:[
    { id:'compras', label:'Compras & Desejos', icon:'🛒', page:'hobbies', active:true },
  ]},
  { id:'patrimonio', label:'Patrimônio', icon:'📦', order:8, active:true, items:[
    { id:'patrimonio', label:'Bens & Equipamentos', icon:'📦', page:'patrimonio', active:true },
  ]},
  { id:'decisoes', label:'Decisões', icon:'🧭', order:9, active:true, items:[
    { id:'decisoes', label:'Decisões', icon:'🧭', page:'decisoes', active:true },
  ]},
  { id:'relatorios', label:'Relatórios', icon:'📄', order:10, active:true, items:[
    { id:'relatorios', label:'Central de Relatórios', icon:'📄', page:'relatorios', active:true },
  ]},
  { id:'pessoal', label:'Pessoal', icon:'👤', order:11, active:true, items:[
    { id:'perfil', label:'Meu Perfil', icon:'👤', page:'perfil', active:true },
  ]},
  { id:'sistema', label:'Sistema', icon:'⚙️', order:12, active:true, minRole:'superadmin', items:[
    { id:'admin',     label:'Usuários',         icon:'👥', page:'admin',     active:true, minRole:'superadmin' },
    { id:'config',    label:'Configurações',    icon:'⚙️', page:'config',    active:true, minRole:'superadmin' },
    { id:'sysconfig', label:'Identidade & Cores',icon:'🎨', page:'sysconfig', active:true, minRole:'superadmin' },
    { id:'integracoes', label:'Integrações',    icon:'🔌', page:'integracoes', active:true, minRole:'superadmin' },
  ]},
];

function _menuData(){
  // SYSCFG.menu (global) tem prioridade; fallback seguro para DEFAULT_MENU.
  const m = SYSCFG && Array.isArray(SYSCFG.menu) && SYSCFG.menu.length ? SYSCFG.menu : DEFAULT_MENU;
  return m.slice().sort((a,b)=>(a.order||99)-(b.order||99));
}
function _canSee(node){
  if(node && node.minRole==='superadmin') return _currentRole==='superadmin';
  return true;
}
function _menuCollapsed(){ return (D.prefs && Array.isArray(D.prefs.menuCollapsed)) ? D.prefs.menuCollapsed : []; }

function toggleMenuCat(catId){
  if(!D.prefs) D.prefs={};
  if(!Array.isArray(D.prefs.menuCollapsed)) D.prefs.menuCollapsed=[];
  const i=D.prefs.menuCollapsed.indexOf(catId);
  if(i>=0) D.prefs.menuCollapsed.splice(i,1); else D.prefs.menuCollapsed.push(catId);
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
  renderSidebar();
}

let _sidebarDelegated=false;
function _setupSidebarDelegation(){
  if(_sidebarDelegated) return;
  const host=document.getElementById('sidebar-dynamic-nav'); if(!host) return;
  host.addEventListener('click', e=>{
    const item=e.target.closest('[data-page]');
    if(item){ goSide(item.getAttribute('data-page')); return; }
    const cat=e.target.closest('[data-cat]');
    if(cat){ toggleMenuCat(cat.getAttribute('data-cat')); return; }
  });
  _sidebarDelegated=true;
}

function renderSidebar(){
  const host=document.getElementById('sidebar-dynamic-nav'); if(!host) return;
  _setupSidebarDelegation();
  const collapsed=_menuCollapsed();
  const html=_menuData().filter(cat=>cat.active!==false && _canSee(cat)).map(cat=>{
    const items=(cat.items||[]).filter(it=>it.active!==false && _canSee(it));
    if(!items.length) return '';
    const isCol=collapsed.includes(cat.id);
    const btns=items.map(it=>{
      const on=_activeNav===it.page ? ' on' : '';
      return `<button class="snav${on}" id="snav-${escapeHTML(it.page)}" data-page="${attr(it.page)}">`
        + `<span class="snav-icon">${escapeHTML(it.icon||'•')}</span> ${escapeHTML(it.label||it.page)}</button>`;
    }).join('');
    return `<div class="sidebar-section">
      <button class="sidebar-cat-header" data-cat="${attr(cat.id)}"
        style="display:flex;align-items:center;justify-content:space-between;width:100%;background:none;border:none;cursor:pointer;padding:2px 6px;color:var(--text3);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em">
        <span>${escapeHTML(cat.icon||'')} ${escapeHTML(cat.label||cat.id)}</span>
        <span style="font-size:9px;opacity:.7">${isCol?'▸':'▾'}</span>
      </button>
      <div style="${isCol?'display:none':''}">${btns}</div>
    </div>`;
  }).join('');
  host.innerHTML=html;
}

// ═══════════════════════════════════════════════════
//  🧩 PLACEHOLDERS — módulos planejados (em construção)
// ═══════════════════════════════════════════════════
const PLACEHOLDER_MODULES = {
  trabalho: { icon:'💼', titulo:'Trabalho', section:'Trabalho',
    desc:'Centralize projetos, tarefas, demandas, clientes, reuniões e entregas em um só lugar, ligados aos seus prazos e metas.',
    futuras:['Projetos e tarefas com status e prioridade','Clientes e demandas','Prazos e entregas','Histórico de decisões de projeto'] },
  carreira: { icon:'🚀', titulo:'Carreira', section:'Carreira',
    desc:'Acompanhe objetivos profissionais, competências, cursos e simulações de renda alinhadas ao seu planejamento financeiro.',
    futuras:['Objetivos profissionais','Competências e certificações','Simulação de renda','Plano de transição'] },
  planejamento: { icon:'🗓️', titulo:'Planejamento Pessoal', section:'Planejamento',
    desc:'Organize objetivos de curto, médio e longo prazo, hábitos, rotinas e revisões semanais/mensais.',
    futuras:['Objetivos por horizonte','Hábitos e rotinas','Checklists semanais/mensais','Revisão de vida'] },
  patrimonio: { icon:'📦', titulo:'Patrimônio', section:'Patrimônio',
    desc:'Registre bens, equipamentos, veículos, garantias, notas fiscais e manutenções, com valor estimado e histórico.',
    futuras:['Bens, veículos e equipamentos','Garantias e notas fiscais','Manutenções e seguros','Histórico de aquisições'] },
  lazer: { icon:'🎮', titulo:'Lazer & Hobbies', section:'Lazer',
    desc:'Acompanhe hobbies, atividades de lazer e qualidade de vida. As aquisições de hobby agora vivem em Compras & Desejos; aqui ficará o acompanhamento de uso, prática e satisfação.',
    futuras:['Registro de hobbies e prática','Tempo dedicado e satisfação','Vínculo com Compras & Desejos','Metas de lazer'] },
  integracoes: { icon:'🔌', titulo:'Integrações', section:'Sistema',
    desc:'Conecte agenda, indicadores de mercado, importação de extratos e mais — sempre com consentimento, fonte e fallback manual.',
    futuras:['Links "Adicionar à Google Agenda"','Importação CSV/OFX de extratos','Indicadores via Banco Central','Open Finance (com backend) no futuro'] },
  agenda: { icon:'📅', titulo:'Google Agenda', section:'Integrações',
    desc:'Comece por links de criação de evento (sem OAuth) e evolua para sincronização real com backend seguro.',
    futuras:['Adicionar faturas/decisões/metas à agenda','Lembretes financeiros','Sincronização via Cloud Function (futuro)'] },
  openbanking: { icon:'🏦', titulo:'Open Finance', section:'Integrações',
    desc:'Importe saldos e transações com segurança. Nunca pediremos sua senha bancária — começa por CSV/OFX e evolui via provedor + backend.',
    futuras:['Importação CSV/OFX','Conciliação de transações','Open Finance via provedor (backend)','Isolado por usuário e criptografado'] },
  anexos: { icon:'📎', titulo:'Anexos & Documentos', section:'Patrimônio',
    desc:'Anexe notas fiscais, garantias e comprovantes — primeiro por link externo, depois via Firebase Storage com regras por usuário.',
    futuras:['Links externos (Drive/OneDrive)','Firebase Storage por uid','Validação de tipo/tamanho','Vínculo a compras e patrimônio'] },
};

function renderPlaceholder(id){
  const el=document.getElementById('placeholder-body'); if(!el) return;
  const m=PLACEHOLDER_MODULES[id]; if(!m){ el.innerHTML=''; return; }
  el.innerHTML=`
    <div style="margin-bottom:24px">
      <div style="font-size:22px;font-weight:800;letter-spacing:-.5px">${escapeHTML(m.icon)} ${escapeHTML(m.titulo)}
        <span style="font-size:11px;font-weight:700;color:var(--warn);background:var(--warn-bg);border:1px solid rgba(245,158,11,.25);border-radius:99px;padding:3px 10px;margin-left:8px;vertical-align:middle">em construção</span></div>
      <div style="font-size:13px;color:var(--text2);margin-top:6px;max-width:680px;line-height:1.55">${escapeHTML(m.desc)}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="panel-title">✨ Funcionalidades planejadas</span>
        <span class="panel-badge">próxima fase</span></div>
      <div style="padding:16px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
          ${(m.futuras||[]).map(f=>`<div style="display:flex;align-items:flex-start;gap:8px;background:var(--card2);border:1px solid var(--border);border-radius:var(--r10);padding:11px 13px">
            <span style="color:var(--brand);font-weight:800">→</span>
            <span style="font-size:12.5px;color:var(--text)">${escapeHTML(f)}</span></div>`).join('')}
        </div>
        <div style="margin-top:16px;font-size:12px;color:var(--text3);display:flex;align-items:center;gap:8px">
          <span>🧱</span> Este módulo está planejado para uma próxima fase. A estrutura e a navegação já estão prontas para recebê-lo.
        </div>
      </div>
    </div>
    <div style="margin-top:14px"><button class="btn btn-ghost" data-goto="geral" onclick="goSide('geral')">← Voltar ao Dashboard Geral</button></div>`;
}

// ═══════════════════════════════════════════════════
//  🏠 DASHBOARD GERAL — "como está minha vida agora?"
// ═══════════════════════════════════════════════════
function _gcard(opts){
  // opts: {icon,label,valor,sub,cor,page,extra}
  const nav = opts.page ? `onclick="goSide('${opts.page}')"` : '';
  return `<button class="snav" ${nav} style="all:unset;cursor:${opts.page?'pointer':'default'};display:block;width:100%">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r14);padding:16px;height:100%;transition:border-color .15s"
      onmouseover="this.style.borderColor='var(--border2)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="font-size:16px">${escapeHTML(opts.icon||'•')}</span>
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">${escapeHTML(opts.label||'')}</span>
      </div>
      <div style="font-size:20px;font-weight:800;color:${opts.cor||'var(--text)'}">${opts.valor||''}</div>
      ${opts.sub?`<div style="font-size:11.5px;color:var(--text3);margin-top:3px">${opts.sub}</div>`:''}
      ${opts.extra||''}
    </div>
  </button>`;
}

function renderGeralDash(){
  const el=document.getElementById('geral-body'); if(!el) return;
  const mi = (typeof getMesRefIdx==='function') ? getMesRefIdx() : 0;
  const mesNome = (D.meses&&D.meses[mi])||'';

  // Finanças do mês
  let entrada=0, cp={bruto:0,pendente:0,pago:0}, sobra=0, investir=0;
  try { entrada=totalEMes(mi); cp=calcPendenteMes(mi); sobra=entrada-cp.bruto; investir=invDisp(mi); } catch(e){}
  // Reserva
  let reserva={pct:0,caixa:0,meta:0,falta:0};
  try { reserva=statusReserva(); } catch(e){}
  // Metas em andamento
  let metasAtivas=[], metaTop=null, metaDoms=0;
  try {
    metasAtivas=(D.metas||[]).filter(m=>m.ativa!==false).map(m=>{ try{return {m, info:metaProgress(m)};}catch(e){return null;} }).filter(Boolean).filter(x=>!x.info.concluida);
    metaTop=metasAtivas.slice().sort((a,b)=>b.info.pct-a.info.pct)[0];
    metaDoms=new Set(metasAtivas.map(x=>x.m.dominio||'financeiro')).size;
  } catch(e){}
  // Hobbies/compras prioritários
  let hobAbertos=[], hobAlvo=null, hobTotal=0;
  try {
    hobAbertos=hobItensAbertos(); hobTotal=hobTotalAberto();
    hobAlvo=hobAbertos.slice().sort((a,b)=>(a.prioridade-b.prioridade)||(a.fase-b.fase))[0];
  } catch(e){}
  // Alertas / insights
  let insights=[];
  try { const F=finInsights(mi); insights=(F&&F.insights)?F.insights.slice(0,4):[]; } catch(e){}

  const reservaCor = reserva.pct>=100?'var(--brand)':reserva.pct>=50?'var(--warn)':'var(--neg)';
  const sobraCor = sobra>=0?'var(--pos)':'var(--neg)';

  const cards=[
    _gcard({icon:'💰', label:'Situação do mês', valor:fmt(sobra), cor:sobraCor, page:'dash',
      sub:`${mesNome} · ${fmt(entrada)} entradas − ${fmt(cp.bruto)} saídas`}),
    _gcard({icon:'🛡️', label:'Reserva de emergência', valor:`${reserva.pct}%`, cor:reservaCor, page:'carteira',
      sub:reserva.pct>=100?'Reserva completa':`Faltam ${fmt(reserva.falta)} para completar`,
      extra:`<div style="height:6px;background:var(--card3);border-radius:99px;margin-top:8px;overflow:hidden"><div style="height:6px;width:${Math.min(100,reserva.pct)}%;background:${reservaCor};border-radius:99px"></div></div>`}),
    _gcard({icon:'🚀', label:'Disponível p/ investir', valor:fmt(investir), cor:'var(--teal)', page:'carteira',
      sub:cp.pendente>0?`${fmt(cp.pendente)} ainda pendente no mês`:'Contas do mês em dia'}),
    _gcard({icon:'🎯', label:'Metas em andamento', valor:String(metasAtivas.length), cor:'var(--text)', page:'metas',
      sub:metaTop?`${metaDoms} domínio(s) · mais perto: ${escapeHTML((typeof metaDom==='function'?metaDom(metaTop.m.dominio).icon:'')+' '+(metaTop.m.nome||''))} (${Math.round(metaTop.info.pct)}%)`:'Nenhuma meta ativa'}),
    _gcard({icon:'🛒', label:'Compras & desejos', valor:fmt(hobTotal), cor:'var(--violet)', page:'hobbies',
      sub:(()=>{ try{ const C=compraResumoData(); const parts=[]; if(C.proximo) parts.push(`próximo: ${C.proximo.nome||''}${compraCusto(C.proximo)>0?' ('+fmt(compraCusto(C.proximo))+')':''}`); if(C.emAnalise) parts.push(`${C.emAnalise} em análise`); if(C.vincMeta) parts.push(`${C.vincMeta} vinc. metas`); return parts.length?escapeHTML(parts.join(' · ')):`${C.nAberto} item(ns) em aberto`; }catch(e){ return `${hobAbertos.length} item(ns) em aberto`; } })()}),
    _gcard({icon:'🧭', label:'Decisões', valor:(typeof _decResumoData==='function'?String(_decResumoData().emAnalise):'0'), cor:'var(--info)', page:'decisoes',
      sub:(()=>{ try{ const r=_decResumoData(); const parts=[]; if(r.emAnalise) parts.push(`${r.emAnalise} em análise`); if(r.criticas) parts.push(`${r.criticas} crítica(s)`); if(r.prazoProx) parts.push(`prazo em ${r.prazoProx.dias}d`); return parts.length?parts.join(' · '):'Nenhuma decisão pendente'; }catch(e){ return 'Avalie decisões antes de agir'; } })()}),
  ].join('');

  // Alertas
  const alertasHtml = insights.length ? `
    <div class="panel mb">
      <div class="panel-head"><span class="panel-title">🚨 Alertas & sinais do mês</span></div>
      <div style="padding:12px 16px">
        ${insights.map(a=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:15px;flex-shrink:0">${escapeHTML(a.icon||'•')}</span>
          <div><div style="font-size:13px;font-weight:600">${escapeHTML(a.titulo||a.title||'')}</div>
          <div style="font-size:11.5px;color:var(--text2)">${escapeHTML(a.desc||a.msg||'')}</div></div>
        </div>`).join('')}
      </div>
    </div>` : '';

  // Próximos passos (derivados, sem dados sensíveis)
  const passos=[];
  if(reserva.pct<100) passos.push(`Completar a reserva de emergência (faltam ${fmt(reserva.falta)}).`);
  if(cp.pendente>0)   passos.push(`Quitar ${fmt(cp.pendente)} de contas pendentes em ${mesNome}.`);
  if(sobra>0 && investir>0) passos.push(`Direcionar ${fmt(investir)} para investimento conforme o ARCA.`);
  if(hobAlvo && hobCusto(hobAlvo)>0){ try{ const fit=hobFitCheck(hobAlvo); passos.push(`Avaliar a compra "${escapeHTML(hobAlvo.nome)}": ${escapeHTML(fit.label)}.`);}catch(e){} }
  if(metaTop) passos.push(`Avançar na meta "${escapeHTML(metaTop.m.nome||'')}" (${Math.round(metaTop.info.pct)}%).`);
  if(!passos.length) passos.push('Tudo em dia por aqui. Que tal registrar um novo objetivo ou decisão?');

  const passosHtml=`
    <div class="panel">
      <div class="panel-head"><span class="panel-title">✅ Próximos passos recomendados</span></div>
      <div style="padding:12px 16px">
        ${passos.slice(0,5).map(p=>`<div style="display:flex;align-items:flex-start;gap:9px;padding:7px 0">
          <span style="color:var(--brand);font-weight:800">→</span>
          <span style="font-size:13px;color:var(--text)">${p}</span></div>`).join('')}
      </div>
    </div>`;

  el.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:20px">${cards}</div>
    ${alertasHtml}
    ${passosHtml}`;
}

// ═══════════════════════════════════════════════════
//  🧭 MÓDULO DE DECISÕES (primeiro módulo fora de finanças)
//  Ajuda a avaliar decisões antes de agir. Dados em D.decisoes,
//  isolados por usuário (userData/{uid}). Texto livre escapado.
// ═══════════════════════════════════════════════════
const DEC_CATS = [
  {id:'compra',label:'Compra',icon:'🛒'}, {id:'carreira',label:'Carreira',icon:'🚀'},
  {id:'trabalho',label:'Trabalho',icon:'💼'}, {id:'lazer',label:'Lazer',icon:'🎮'},
  {id:'patrimonio',label:'Patrimônio',icon:'📦'}, {id:'investimento',label:'Investimento',icon:'📈'},
  {id:'estudo',label:'Estudo',icon:'🎓'}, {id:'viagem',label:'Viagem',icon:'✈️'},
  {id:'saude',label:'Saúde',icon:'🩺'}, {id:'pessoal',label:'Pessoal',icon:'🧠'},
  {id:'tecnologia',label:'Tecnologia/Setup',icon:'🖥️'}, {id:'relacionamento',label:'Relacionamento',icon:'❤️'},
  {id:'outro',label:'Outro',icon:'•'},
];
const DEC_STATUS = {
  em_analise:{label:'Em análise',cor:'var(--info)'}, aguardando:{label:'Aguardando',cor:'var(--warn)'},
  aprovada:{label:'Aprovada',cor:'var(--pos)'}, recusada:{label:'Recusada',cor:'var(--neg)'},
  adiada:{label:'Adiada',cor:'var(--violet)'}, concluida:{label:'Concluída',cor:'var(--brand)'},
  cancelada:{label:'Cancelada',cor:'var(--text3)'},
};
const DEC_PRIOS = {
  baixa:{label:'Baixa',cor:'var(--text3)',ord:0}, media:{label:'Média',cor:'var(--info)',ord:1},
  alta:{label:'Alta',cor:'var(--warn)',ord:2}, critica:{label:'Crítica',cor:'var(--neg)',ord:3},
};
const DEC_IMPACTOS = { nenhum:'Nenhum', baixo:'Baixo', medio:'Médio', alto:'Alto', critico:'Crítico' };
const _IMP_ORD = { nenhum:0, baixo:1, medio:2, alto:3, critico:4 };

let _decFiltroStatus='', _decFiltroCat='', _decFiltroPrio='', _decFiltroImpacto='', _decBusca='', _decOrdenar='prioridade';
let _decExpanded = {};

function _decs(){ if(!Array.isArray(D.decisoes)) D.decisoes=[]; return D.decisoes; }
function decCat(id){ return DEC_CATS.find(c=>c.id===id) || {id:'outro',label:'Outro',icon:'•'}; }
function decGet(id){ return _decs().find(d=>d.id===id); }
function _decCustoTotal(custo){ return (custo||0); }

// ── Análise estratégica automática (regras locais, sem IA externa) ──
function analiseDecisao(dec){
  const custo = dec.custoEstimado||0;
  const flags = [];
  let nivel = 'ok'; // ok | atencao | adiar | critico
  if(custo>0){
    let exced=0, caixa=0, metaE=0;
    try { exced=invDisp(getMesRefIdx()); caixa=caixaAtual(); metaE=metaEmergencia(); } catch(e){}
    const hasFin = caixa>0 || metaE>0 || exced>0;
    if(!hasFin){
      flags.push('sem dados financeiros suficientes para avaliar o impacto — preencha entradas e reserva');
    } else {
      const cabeNoMes = exced>0 && custo<=exced;
      const quebraReserva = metaE>0 && caixa>=metaE && (caixa-custo)<metaE;
      if(quebraReserva){ flags.push(`pode derrubar sua reserva abaixo de ${fmt(metaE)}`); nivel='critico'; }
      else if(exced>0 && !cabeNoMes){ flags.push(`custo acima do que sobraria para investir no mês (${fmt(exced)})`); if(nivel==='ok')nivel='atencao'; }
      else if(cabeNoMes){ flags.push('cabe no excedente do mês sem mexer na reserva'); }
      if((dec.recorrencia==='mensal'||dec.recorrencia==='anual') && dec.valorRecorrente>0){
        flags.push(`gera custo recorrente de ${fmt(dec.valorRecorrente)}/${dec.recorrencia==='mensal'?'mês':'ano'}`);
        if(nivel!=='critico') nivel = (nivel==='ok')?'atencao':nivel;
      }
      const impF = _IMP_ORD[dec.impactoFinanceiro]||0;
      const prioBaixa = (dec.prioridade==='baixa'||dec.prioridade==='media');
      if(prioBaixa && impF>=3){ flags.push('impacto financeiro alto para uma prioridade não tão alta'); if(nivel==='ok'||nivel==='atencao') nivel='adiar'; }
    }
  } else {
    flags.push('sem custo estimado informado');
  }
  // Tipo (heurística essencial/recomendada/luxo)
  let tipo='recomendada';
  const impPess=_IMP_ORD[dec.impactoPessoal]||0, impProf=_IMP_ORD[dec.impactoProfissional]||0, impFin=_IMP_ORD[dec.impactoFinanceiro]||0;
  if((dec.prioridade==='critica'||dec.prioridade==='alta') && (impPess>=3||impProf>=3)) tipo='essencial';
  else if(impFin>=3 && impPess<=1) tipo='luxo';

  const head = nivel==='critico' ? 'Decisão crítica'
             : nivel==='adiar'   ? 'Recomenda-se adiar'
             : nivel==='atencao' ? 'Atenção'
             : 'Boa decisão';
  const texto = `${head}: ${flags.join('; ')}. Classificação: ${tipo}.`;
  const cor = nivel==='critico'?'var(--neg)':nivel==='adiar'?'var(--violet)':nivel==='atencao'?'var(--warn)':'var(--pos)';
  return { nivel, tipo, texto, cor };
}

// ── CRUD ──
function _decSetupDelegation(){
  const host=document.getElementById('dec-list'); if(!host || host._deleg) return;
  host.addEventListener('click', e=>{
    const b=e.target.closest('[data-dec-act]'); if(!b) return;
    const act=b.getAttribute('data-dec-act'), id=b.getAttribute('data-dec-id');
    if(act==='toggle') toggleDecExpand(id);
    else if(act==='remove') removeDecisao(id);
  });
  host._deleg=true;
}
function toggleDecExpand(id){ _decExpanded[id]=!_decExpanded[id]; renderDecisoes(); }
function addDecisao(){
  const dec={ id:'dec_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    titulo:'', descricao:'', categoria:'compra', status:'em_analise', prioridade:'media',
    prazo:'', dataCriacao:new Date().toISOString(), dataAtualizacao:new Date().toISOString(), dataDecisao:'',
    custoEstimado:0, recorrencia:'nenhuma', valorRecorrente:0,
    impactoFinanceiro:'medio', impactoProfissional:'baixo', impactoPessoal:'medio', impactoLazer:'baixo',
    beneficios:'', riscos:'', alternativas:'', decisaoFinal:'', observacoes:'',
    relacionadaACompraId:'', relacionadaAMetaId:'', ativa:true };
  _decs().unshift(dec);
  _decExpanded[dec.id]=true;
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
  renderDecisoes();
}
function setDecField(id, field, val){
  const dec=decGet(id); if(!dec) return;
  if(field==='custoEstimado'||field==='valorRecorrente') val=Math.max(0, parseFloat(val)||0);
  dec[field]=val;
  dec.dataAtualizacao=new Date().toISOString();
  if(field==='status' && (val==='aprovada'||val==='recusada'||val==='concluida') && !dec.dataDecisao) dec.dataDecisao=new Date().toISOString();
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
  // Atualiza só os reflexos leves sem perder foco do campo em edição:
  renderDecResumo(); renderDecCardMeta(id);
}
async function removeDecisao(id){
  const dec=decGet(id);
  if(!await uiConfirm(`Remover a decisão <strong>"${escapeHTML(dec&&dec.titulo||'(sem título)')}"</strong>?`,{icon:'🧭',okText:'Remover'})) return;
  D.decisoes=_decs().filter(d=>d.id!==id);
  delete _decExpanded[id];
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
  renderDecisoes(); if(typeof toast==='function') toast('Decisão removida',true,'🗑️');
}
function setDecFiltro(campo,val){
  if(campo==='status') _decFiltroStatus=val; else if(campo==='cat') _decFiltroCat=val;
  else if(campo==='prio') _decFiltroPrio=val; else if(campo==='imp') _decFiltroImpacto=val;
  else if(campo==='busca') _decBusca=val; else if(campo==='ord') _decOrdenar=val;
  renderDecisoes();
}

// ── Resumo (cards do topo) ──
function _decResumoData(){
  const ds=_decs().filter(d=>d.ativa!==false);
  const emAnalise=ds.filter(d=>d.status==='em_analise').length;
  const aprovadas=ds.filter(d=>d.status==='aprovada').length;
  const adiadas=ds.filter(d=>d.status==='adiada').length;
  const criticas=ds.filter(d=>d.prioridade==='critica' && !['concluida','cancelada','recusada'].includes(d.status)).length;
  const custoTotal=ds.filter(d=>['em_analise','aprovada','aguardando'].includes(d.status)).reduce((s,d)=>s+(d.custoEstimado||0),0);
  // prazo próximo (<=14 dias)
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  let prazoProx=null;
  ds.filter(d=>d.prazo && !['concluida','cancelada','recusada'].includes(d.status)).forEach(d=>{
    const p=new Date(d.prazo+'T00:00:00'); const dias=Math.round((p-hoje)/86400000);
    if(dias>=0 && dias<=60 && (!prazoProx||dias<prazoProx.dias)) prazoProx={dec:d,dias};
  });
  return {emAnalise,aprovadas,adiadas,criticas,custoTotal,prazoProx,total:ds.length};
}
function renderDecResumo(){
  const el=document.getElementById('dec-resumo'); if(!el) return;
  const r=_decResumoData();
  const card=(icon,label,valor,cor)=>`<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r12);padding:12px 14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text2)">${icon} ${label}</div>
    <div style="font-size:19px;font-weight:800;color:${cor||'var(--text)'};margin-top:3px">${valor}</div></div>`;
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
    ${card('🔍','Em análise',r.emAnalise,'var(--info)')}
    ${card('✅','Aprovadas',r.aprovadas,'var(--pos)')}
    ${card('⏸️','Adiadas',r.adiadas,'var(--violet)')}
    ${card('🚨','Críticas',r.criticas,r.criticas>0?'var(--neg)':'var(--text)')}
    ${card('💰','Custo estimado',fmt(r.custoTotal),'var(--text)')}
    ${card('⏰','Prazo próximo',r.prazoProx?`${r.prazoProx.dias}d`:'—',r.prazoProx&&r.prazoProx.dias<=7?'var(--warn)':'var(--text)')}
  </div>`;
}

// Atualiza badges/análise de um card sem re-render total (mantém foco em edição)
function renderDecCardMeta(id){
  const dec=decGet(id); if(!dec) return;
  const an=analiseDecisao(dec);
  const a=document.getElementById('dec-analise-'+id);
  if(a){ a.style.borderLeftColor=an.cor; a.querySelector('[data-an-text]').innerHTML=escapeHTML(an.texto); }
}

function renderDecisoes(){
  renderDecResumo();
  const el=document.getElementById('dec-list'); if(!el) return;
  _decSetupDelegation();

  // Filtro + busca
  let lista=_decs().slice();
  if(_decFiltroStatus) lista=lista.filter(d=>d.status===_decFiltroStatus);
  if(_decFiltroCat)    lista=lista.filter(d=>d.categoria===_decFiltroCat);
  if(_decFiltroPrio)   lista=lista.filter(d=>d.prioridade===_decFiltroPrio);
  if(_decFiltroImpacto)lista=lista.filter(d=>d.impactoFinanceiro===_decFiltroImpacto);
  if(_decBusca){ const q=_decBusca.toLowerCase(); lista=lista.filter(d=>(d.titulo||'').toLowerCase().includes(q)||(d.descricao||'').toLowerCase().includes(q)); }
  const ord={
    prioridade:(a,b)=>(DEC_PRIOS[b.prioridade]?.ord||0)-(DEC_PRIOS[a.prioridade]?.ord||0),
    prazo:(a,b)=>(a.prazo||'9999').localeCompare(b.prazo||'9999'),
    criacao:(a,b)=>(b.dataCriacao||'').localeCompare(a.dataCriacao||''),
    custo:(a,b)=>(b.custoEstimado||0)-(a.custoEstimado||0),
  };
  lista.sort(ord[_decOrdenar]||ord.prioridade);

  const selOpts=(obj,sel,withEmpty,emptyLabel)=>{
    let o = withEmpty?`<option value="">${emptyLabel||'Todos'}</option>`:'';
    if(Array.isArray(obj)) o+=obj.map(c=>`<option value="${attr(c.id)}"${c.id===sel?' selected':''}>${escapeHTML(c.icon||'')} ${escapeHTML(c.label)}</option>`).join('');
    else o+=Object.keys(obj).map(k=>`<option value="${attr(k)}"${k===sel?' selected':''}>${escapeHTML(obj[k].label||obj[k])}</option>`).join('');
    return o;
  };

  // Barra de filtros
  const filtros=`<div class="panel mb"><div style="padding:12px 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input type="text" value="${attr(_decBusca)}" oninput="setDecFiltro('busca',this.value)" placeholder="🔍 Buscar título/descrição" style="flex:1;min-width:160px;height:34px">
    <select onchange="setDecFiltro('status',this.value)" style="height:34px;font-size:12px"><option value="">Status: todos</option>${selOpts(DEC_STATUS,_decFiltroStatus,false)}</select>
    <select onchange="setDecFiltro('cat',this.value)" style="height:34px;font-size:12px"><option value="">Categoria: todas</option>${selOpts(DEC_CATS,_decFiltroCat,false)}</select>
    <select onchange="setDecFiltro('prio',this.value)" style="height:34px;font-size:12px"><option value="">Prioridade: todas</option>${selOpts(DEC_PRIOS,_decFiltroPrio,false)}</select>
    <select onchange="setDecFiltro('ord',this.value)" style="height:34px;font-size:12px">
      <option value="prioridade"${_decOrdenar==='prioridade'?' selected':''}>Ordenar: prioridade</option>
      <option value="prazo"${_decOrdenar==='prazo'?' selected':''}>Ordenar: prazo</option>
      <option value="criacao"${_decOrdenar==='criacao'?' selected':''}>Ordenar: mais recentes</option>
      <option value="custo"${_decOrdenar==='custo'?' selected':''}>Ordenar: maior custo</option>
    </select>
    <button class="btn btn-pri" style="height:34px;font-size:13px" onclick="addDecisao()">+ Nova decisão</button>
  </div></div>`;

  if(!_decs().length){
    el.innerHTML=`<div class="panel"><div class="empty" style="padding:32px">
      <div class="empty-icon">🧭</div>
      <div class="empty-text">Nenhuma decisão registrada ainda. Antes de uma escolha importante — uma compra cara, trocar de carro, aceitar um trabalho — registre aqui e deixe o sistema avaliar o impacto na sua reserva e nas suas metas.</div>
      <button class="btn btn-pri" style="margin-top:14px" onclick="addDecisao()">+ Registrar primeira decisão</button>
    </div></div>`;
    return;
  }

  const cards=lista.map(dec=>{
    const cat=decCat(dec.categoria), st=DEC_STATUS[dec.status]||DEC_STATUS.em_analise, pr=DEC_PRIOS[dec.prioridade]||DEC_PRIOS.media;
    const an=analiseDecisao(dec);
    const exp=_decExpanded[dec.id];
    const compraNome = dec.relacionadaACompraId ? ((( _hob&&_hob().itens)||[]).find(i=>i.id===dec.relacionadaACompraId)||{}).nome : '';
    const metaRel = dec.relacionadaAMetaId ? (D.metas||[]).find(m=>m.id===dec.relacionadaAMetaId) : null;
    const metaNome = metaRel ? ((typeof metaDom==='function'?metaDom(metaRel.dominio).icon+' ':'')+(metaRel.nome||'')+(typeof metaProgress==='function'?` (${Math.round(metaProgress(metaRel).pct)}%)`:'')) : '';

    const editor = exp ? `
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;display:grid;gap:10px">
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Descrição</label>
          <textarea oninput="setDecField('${dec.id}','descricao',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(dec.descricao)}</textarea></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Categoria</label>
            <select onchange="setDecField('${dec.id}','categoria',this.value)">${selOpts(DEC_CATS,dec.categoria,false)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Status</label>
            <select onchange="setDecField('${dec.id}','status',this.value)">${selOpts(DEC_STATUS,dec.status,false)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Prioridade</label>
            <select onchange="setDecField('${dec.id}','prioridade',this.value)">${selOpts(DEC_PRIOS,dec.prioridade,false)}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Prazo</label>
            <input type="date" value="${attr(dec.prazo)}" onchange="setDecField('${dec.id}','prazo',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Custo estimado (R$)</label>
            <input type="number" step="10" min="0" value="${dec.custoEstimado||0}" onchange="setDecField('${dec.id}','custoEstimado',this.value)"></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Recorrência</label>
            <select onchange="setDecField('${dec.id}','recorrencia',this.value)">
              <option value="nenhuma"${dec.recorrencia==='nenhuma'?' selected':''}>Nenhuma</option>
              <option value="mensal"${dec.recorrencia==='mensal'?' selected':''}>Mensal</option>
              <option value="anual"${dec.recorrencia==='anual'?' selected':''}>Anual</option></select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Valor recorrente (R$)</label>
            <input type="number" step="10" min="0" value="${dec.valorRecorrente||0}" onchange="setDecField('${dec.id}','valorRecorrente',this.value)"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px">
          ${['impactoFinanceiro','Financeiro','impactoProfissional','Profissional','impactoPessoal','Pessoal','impactoLazer','Lazer'].reduce((acc,_,i,arr)=>{
            if(i%2) return acc; const f=arr[i],lab=arr[i+1];
            return acc+`<div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Impacto ${lab}</label>
              <select onchange="setDecField('${dec.id}','${f}',this.value)">${selOpts(DEC_IMPACTOS,dec[f],false)}</select></div>`;
          },'')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Benefícios</label>
            <textarea oninput="setDecField('${dec.id}','beneficios',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(dec.beneficios)}</textarea></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Riscos</label>
            <textarea oninput="setDecField('${dec.id}','riscos',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(dec.riscos)}</textarea></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Alternativas</label>
            <textarea oninput="setDecField('${dec.id}','alternativas',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(dec.alternativas)}</textarea></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 10px">
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Relacionar a compra/desejo (opcional)</label>
            <select onchange="setDecField('${dec.id}','relacionadaACompraId',this.value)">
              <option value="">— nenhuma —</option>
              ${(((typeof _hob==='function'&&_hob().itens)||[])).map(it=>`<option value="${attr(it.id)}"${it.id===dec.relacionadaACompraId?' selected':''}>${escapeHTML(it.nome||'')}</option>`).join('')}</select></div>
          <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Relacionar a meta (opcional)</label>
            <select onchange="setDecField('${dec.id}','relacionadaAMetaId',this.value)">
              <option value="">— nenhuma —</option>
              ${((D.metas||[]).map(m=>`<option value="${attr(m.id)}"${m.id===dec.relacionadaAMetaId?' selected':''}>${escapeHTML((typeof metaDom==='function'?metaDom(m.dominio).icon+' ':'')+(m.nome||''))}</option>`)).join('')}</select></div>
        </div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Decisão final</label>
          <input type="text" value="${attr(dec.decisaoFinal)}" onchange="setDecField('${dec.id}','decisaoFinal',this.value)" placeholder="o que você decidiu?"></div>
        <div class="field" style="margin:0"><label class="flabel" style="font-size:10px">Observações</label>
          <textarea oninput="setDecField('${dec.id}','observacoes',this.value)" rows="2" style="width:100%;resize:vertical">${escapeHTML(dec.observacoes)}</textarea></div>
        <div style="display:flex;justify-content:flex-end">
          <button class="btn btn-neg" style="height:32px;font-size:12px" data-dec-act="remove" data-dec-id="${attr(dec.id)}">🗑️ Excluir decisão</button>
        </div>
      </div>` : '';

    return `<div style="background:var(--card);border:1px solid var(--border);border-left:3px solid ${pr.cor};border-radius:var(--r14);padding:14px;margin-bottom:12px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <span style="font-size:18px">${escapeHTML(cat.icon)}</span>
        <div style="flex:1;min-width:0">
          <input type="text" value="${attr(dec.titulo)}" onchange="setDecField('${dec.id}','titulo',this.value);renderDecCardTitle('${dec.id}')" placeholder="Título da decisão" style="font-weight:700;font-size:14px;width:100%">
          <div id="dec-meta-${dec.id}" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center">
            <span class="badge" style="background:var(--card3);color:${st.cor};font-size:10px">${escapeHTML(st.label)}</span>
            <span class="badge" style="background:var(--card3);color:${pr.cor};font-size:10px">${escapeHTML(pr.label)}</span>
            <span style="font-size:11px;color:var(--text2)">${escapeHTML(cat.label)}</span>
            ${dec.custoEstimado>0?`<span style="font-size:11px;font-weight:700">· ${fmt(dec.custoEstimado)}</span>`:''}
            ${dec.prazo?`<span style="font-size:11px;color:var(--text3)">· prazo ${escapeHTML(dec.prazo)}</span>`:''}
            ${compraNome?`<span style="font-size:10px;color:var(--text3)">🛒 ${escapeHTML(compraNome)}</span>`:''}
            ${metaNome?`<span style="font-size:10px;color:var(--text3)">🎯 ${escapeHTML(metaNome)}</span>`:''}
          </div>
        </div>
        <button class="btn btn-ghost" style="height:30px;font-size:12px;flex-shrink:0" data-dec-act="toggle" data-dec-id="${attr(dec.id)}">${exp?'▴ fechar':'▾ detalhes'}</button>
      </div>
      <div id="dec-analise-${dec.id}" style="background:var(--card2);border-left:3px solid ${an.cor};border-radius:var(--r10);padding:8px 11px;margin-top:10px">
        <div style="font-size:11px;color:var(--text2);line-height:1.45" data-an-text>${escapeHTML(an.texto)}</div>
      </div>
      ${editor}
    </div>`;
  }).join('');

  el.innerHTML = filtros + cards;
}
// Atualiza o card-meta (badges) de uma decisão após editar o título (sem re-render total)
function renderDecCardTitle(id){ /* título já está no input; nada a fazer além de persistir */ }

// ── Card do Dashboard Geral (dados reais) ──
function decDashResumo(){
  const r=_decResumoData();
  return r;
}
// ═══════════════════════════════════════════════════
//  🎯 METAS INTEGRADAS (multiárea) — constantes + progresso central
//  Compatível com metas financeiras antigas (unidade 'dinheiro' delega a metaInfo).
// ═══════════════════════════════════════════════════
const META_DOMINIOS = [
  {id:'financeiro',label:'Financeiro',icon:'💰',cor:'#00D4AA',desc:'Reserva, investimentos, dívidas, patrimônio financeiro'},
  {id:'carreira',label:'Carreira',icon:'🚀',cor:'#6366f1',desc:'Promoções, transições, posicionamento'},
  {id:'trabalho',label:'Trabalho',icon:'💼',cor:'#3b82f6',desc:'Projetos e entregas profissionais'},
  {id:'pessoal',label:'Pessoal',icon:'🧠',cor:'#a855f7',desc:'Desenvolvimento e hábitos pessoais'},
  {id:'lazer',label:'Lazer',icon:'🎮',cor:'#ec4899',desc:'Diversão, hobbies, qualidade de vida'},
  {id:'patrimonio',label:'Patrimônio',icon:'📦',cor:'#f59e0b',desc:'Bens, equipamentos, imóveis'},
  {id:'estudo',label:'Estudo',icon:'🎓',cor:'#0ea5e9',desc:'Cursos, certificações, aprendizado'},
  {id:'saude',label:'Saúde',icon:'🩺',cor:'#10b981',desc:'Saúde física e mental'},
  {id:'compra',label:'Compra',icon:'🛒',cor:'#f97316',desc:'Aquisições planejadas'},
  {id:'viagem',label:'Viagem',icon:'✈️',cor:'#14b8a6',desc:'Viagens e experiências'},
  {id:'projeto',label:'Projeto',icon:'🛠️',cor:'#8b5cf6',desc:'Projetos pessoais e paralelos'},
  {id:'relacionamento',label:'Relacionamento',icon:'❤️',cor:'#ef4444',desc:'Família, amigos, vínculos'},
  {id:'tecnologia',label:'Tecnologia/Setup',icon:'🖥️',cor:'#64748b',desc:'Setup, ferramentas, tecnologia'},
  {id:'outro',label:'Outro',icon:'•',cor:'#94a3b8',desc:'Outros objetivos'},
];
const META_STATUS = {
  em_andamento:{label:'Em andamento',cor:'var(--info)'}, planejada:{label:'Planejada',cor:'var(--text3)'},
  pausada:{label:'Pausada',cor:'var(--warn)'}, concluida:{label:'Concluída',cor:'var(--pos)'},
  cancelada:{label:'Cancelada',cor:'var(--text3)'}, atrasada:{label:'Atrasada',cor:'var(--neg)'},
};
const META_PRIOS = {
  baixa:{label:'Baixa',cor:'var(--text3)',ord:0}, media:{label:'Média',cor:'var(--info)',ord:1},
  alta:{label:'Alta',cor:'var(--warn)',ord:2}, critica:{label:'Crítica',cor:'var(--neg)',ord:3},
};
const META_UNIDADES = { dinheiro:'Dinheiro (R$)', percentual:'Percentual (%)', quantidade:'Quantidade', sim_nao:'Sim / Não', checklist:'Checklist (%)', manual:'Manual / Texto' };

function metaDom(id){ return META_DOMINIOS.find(d=>d.id===id) || META_DOMINIOS.find(d=>d.id==='outro'); }
function _metas(){ if(!Array.isArray(D.metas)) D.metas=[]; return D.metas; }

// ── Cálculo central de progresso (todas as unidades) ──
function metaProgress(meta){
  const un = meta.unidade || 'dinheiro';
  let pct=0, atual=null, alvo=null, defined=true, label='';
  if(un==='dinheiro'){
    const I=metaInfo(meta); atual=I.atual; alvo=I.alvo;
    pct = I.alvo>0 ? (I.atual/I.alvo)*100 : 0;
    label = `${fmtK(I.atual)} de ${fmtK(I.alvo)}`;
  } else if(un==='quantidade'){
    atual=meta.valorAtual||0; alvo=meta.valorAlvo||0;
    pct = alvo>0 ? (atual/alvo)*100 : 0;
    label = `${atual} de ${alvo}`;
  } else if(un==='percentual' || un==='checklist'){
    const v = (meta.progressoManual!=null) ? meta.progressoManual : (meta.valorAtual||0);
    pct = v; label = `${Math.round(v)}%`;
  } else if(un==='sim_nao'){
    const done = meta.status==='concluida';
    pct = done?100:0; label = done?'Concluída':'Pendente';
  } else { // manual
    if(meta.progressoManual!=null){ pct=meta.progressoManual; label=`${Math.round(pct)}%`; }
    else { defined=false; pct=0; label='progresso manual não definido'; }
  }
  const concluida = (meta.status==='concluida') || (defined && un!=='manual' && pct>=100);
  let atrasada=false;
  const pz = meta.prazo ? parseMes(meta.prazo) : null;
  if(pz && !concluida && meta.status!=='cancelada'){
    const hoje=new Date(), hojeIdx=hoje.getFullYear()*12+(hoje.getMonth()+1);
    if((pz.y*12+pz.m) < hojeIdx) atrasada=true;
  }
  return { pct, pctVis:Math.max(0,Math.min(100,pct)), label, concluida, atrasada, atual, alvo, defined, unidade:un };
}

// ── Decisões vinculadas a uma meta ──
function metaDecisoesVinculadas(metaId){
  const ds=(D.decisoes||[]).filter(d=>d.relacionadaAMetaId===metaId);
  return { total:ds.length,
    emAnalise:ds.filter(d=>d.status==='em_analise').length,
    aprovadas:ds.filter(d=>d.status==='aprovada').length };
}

// ── Estado de UI (filtros/busca/ordenação/expansão) ──
let _metaFiltroDom='', _metaFiltroStatus='', _metaFiltroPrio='', _metaFiltroUnidade='', _metaBusca='', _metaOrdenar='prioridade';
let _metaExpanded = {};
function setMetaFiltro(campo,val){
  if(campo==='dom') _metaFiltroDom=val; else if(campo==='status') _metaFiltroStatus=val;
  else if(campo==='prio') _metaFiltroPrio=val; else if(campo==='unidade') _metaFiltroUnidade=val;
  else if(campo==='busca') _metaBusca=val; else if(campo==='ord') _metaOrdenar=val;
  renderObjetivos();
}
function toggleMetaExpand(id){ _metaExpanded[id]=!_metaExpanded[id]; renderObjetivos(); }

// ═══════════════════════════════════════════════════
//  📄 CENTRAL DE RELATÓRIOS (Fase 7) — preview + window.print()
//  Usa só dados do usuário autenticado (D). Identidade visual de SYSCFG.
//  Todo texto livre é escapado (escapeHTML/attr).
// ═══════════════════════════════════════════════════
let _relTipo = 'mensal';            // mensal | anual | metas | decisoes | compras | geral
let _relFiltroDomMeta = '';         // filtro de domínio do relatório de metas

const _REL_TIPOS = [
  {id:'mensal',   label:'Financeiro Mensal',   icon:'📅'},
  {id:'anual',    label:'Financeiro Anual',    icon:'📈'},
  {id:'metas',    label:'Metas',               icon:'🎯'},
  {id:'decisoes', label:'Decisões',            icon:'🧭'},
  {id:'compras',  label:'Compras & Desejos',   icon:'🛒'},
  {id:'geral',    label:'Geral da Vida',       icon:'🏠'},
];
const _REL_COMPRA_ST = { desejado:'Desejado', em_analise:'Em análise', adiado:'Adiado', comprado:'Comprado', descartado:'Descartado' };

function _relIdent(){ try{ return (typeof SYSCFG!=='undefined' && SYSCFG.identity) ? SYSCFG.identity : {}; }catch(e){ return {}; } }
function _relAnos(){
  const ys=new Set();
  (D.meses||[]).forEach(m=>{ const p=(typeof parseMes==='function')?parseMes(m):null; if(p&&p.y) ys.add(p.y); });
  if(!ys.size) ys.add(new Date().getFullYear());
  return [...ys].sort();
}

// Layout padrão do documento
function _relDoc(titulo, periodo, body){
  const id=_relIdent();
  const nome=escapeHTML(id.systemName||'FinançasPRO');
  const sub=escapeHTML(id.subtitle||'');
  const foot=escapeHTML(id.footerText||'');
  const hoje=new Date().toLocaleString('pt-BR');
  const logo=id.logoUrl||'';
  const logoHtml = logo
    ? `<img src="${attr(logo)}" alt="" style="height:40px;max-width:170px;object-fit:contain" onerror="this.style.display='none'">`
    : `<div style="font-size:26px;line-height:1">${escapeHTML(id.mainIcon||'₿')}</div>`;
  return `<div class="report-page" style="background:var(--card);border:1px solid var(--border);border-radius:var(--r14);padding:26px;max-width:900px;margin:0 auto">
    <div class="report-section" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid var(--border);padding-bottom:16px;margin-bottom:20px">
      <div style="display:flex;gap:12px;align-items:center">
        ${logoHtml}
        <div><div style="font-size:18px;font-weight:800;letter-spacing:-.3px">${nome}</div>${sub?`<div style="font-size:11px;color:var(--text2)">${sub}</div>`:''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:15px;font-weight:800">${escapeHTML(titulo)}</div>
        ${periodo?`<div style="font-size:12px;color:var(--text2)">${escapeHTML(periodo)}</div>`:''}
        <div style="font-size:10px;color:var(--text3);margin-top:2px">Gerado em ${escapeHTML(hoje)}</div>
      </div>
    </div>
    ${body}
    <div class="report-section" style="border-top:1px solid var(--border);margin-top:20px;padding-top:12px;font-size:10px;color:var(--text3);text-align:center">
      ${nome}${foot?' · '+foot:''} · Relatório gerado com dados informados pelo usuário.
    </div>
  </div>`;
}
function _relSection(titulo, inner){
  return `<div class="report-section rep-card" style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r12);padding:16px;margin-bottom:14px">
    <div style="font-size:13px;font-weight:800;margin-bottom:12px;color:var(--text)">${escapeHTML(titulo)}</div>${inner}</div>`;
}
function _relKpis(arr){
  return `<div style="display:flex;flex-wrap:wrap;gap:14px">${arr.map(k=>`<div style="flex:1;min-width:120px">
    <div style="font-size:10px;color:var(--text2);text-transform:uppercase;letter-spacing:.04em">${escapeHTML(k.label)}</div>
    <div style="font-size:18px;font-weight:800;color:${k.cor||'var(--text)'}">${k.val}</div>${k.sub?`<div style="font-size:10px;color:var(--text3)">${escapeHTML(k.sub)}</div>`:''}</div>`).join('')}</div>`;
}
function _relTable(headers, rows){
  if(!rows.length) return `<div style="font-size:12px;color:var(--text3)">Sem dados.</div>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr>${headers.map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text2);font-weight:700">${escapeHTML(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td style="text-align:${i?'right':'left'};padding:6px 8px;border-bottom:1px solid var(--border)">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function _relEmpty(msg){ return `<div class="rep-card" style="background:var(--card2);border:1px solid var(--border);border-radius:var(--r12);padding:28px;text-align:center"><div style="font-size:30px;margin-bottom:8px">📄</div><div style="font-size:13px;color:var(--text2);max-width:460px;margin:0 auto">${escapeHTML(msg)}</div></div>`; }

// ── 1) FINANCEIRO MENSAL ──
function relDocMensal(mi){
  const R=relatorioMensal(mi);
  let invDisponivel=0, reserva={pct:0,falta:0,caixa:0,meta:0};
  try{ invDisponivel=invDisp(mi); }catch(e){}
  try{ reserva=statusReserva(); }catch(e){}
  const sobraCor=R.sobra>=0?'var(--pos)':'var(--neg)';
  const kpis=_relKpis([
    {label:'Entradas',val:fmt(R.entradas)},
    {label:'Saídas',val:fmt(R.saidas)},
    {label:'Saldo do mês',val:fmt(R.sobra),cor:sobraCor},
    {label:'Disponível p/ investir',val:fmt(invDisponivel),cor:'var(--teal)'},
    {label:'Taxa de poupança',val:`${Math.round(R.taxaPoupanca)}%`},
  ]);
  const reservaPct=reserva.pct||0;
  const reservaSec=_relSection('Reserva de emergência',
    `<div style="font-size:12px;color:var(--text2);margin-bottom:6px">${reservaPct>=100?'Reserva completa.':`Faltam ${fmt(reserva.falta||0)} para a meta.`} (${Math.round(reservaPct)}%)</div>
     <div style="height:8px;background:var(--card3);border-radius:99px;overflow:hidden"><div style="height:8px;width:${Math.min(100,reservaPct)}%;background:${reservaPct>=100?'var(--pos)':reservaPct>=50?'var(--warn)':'var(--neg)'};border-radius:99px"></div></div>`);
  const gastos=_relSection('Maiores gastos por categoria',
    _relTable(['Categoria','Valor','%'], R.categorias.slice(0,8).map(c=>[`${escapeHTML(c.icon)} ${escapeHTML(c.label)}`, fmt(c.valor), Math.round(c.pct)+'%'])));
  const orc=R.orcamentos.length?_relSection('Orçamento por categoria',
    _relTable(['Categoria','Gasto','Limite','%'], R.orcamentos.map(o=>[`${escapeHTML(o.icon)} ${escapeHTML(o.label)}`, fmt(o.gasto), fmt(o.limite), `<span style="color:${o.over?'var(--neg)':'var(--text)'}">${Math.round(o.pct)}%</span>`]))):'';
  const metas=R.metas.length?_relSection('Metas financeiras',
    _relTable(['Meta','Atual','Alvo','%'], R.metas.map(m=>[`${escapeHTML(m.icon)} ${escapeHTML(m.nome||'')}`, fmtK(m.atual), fmtK(m.alvo), (m.concluida?'✅ ':'')+Math.round(m.pct)+'%']))):'';
  const alertas=R.insights.length?_relSection('Alertas e destaques',
    `<div style="display:grid;gap:6px">${R.insights.map(a=>`<div style="display:flex;gap:8px;font-size:12px"><span>${escapeHTML(a.icon||'•')}</span><div><strong>${escapeHTML(a.titulo||a.title||'')}</strong> — ${escapeHTML(a.desc||a.msg||'')}</div></div>`).join('')}</div>`):'';
  const nota=(D.notasMes&&D.notasMes[mi])?_relSection('Observações do mês',`<div style="font-size:12px;color:var(--text2);white-space:pre-wrap">${escapeHTML(D.notasMes[mi])}</div>`):'';
  const body=_relSection('Resumo executivo',kpis)+reservaSec+gastos+orc+metas+alertas+nota;
  return _relDoc('Relatório Financeiro Mensal', R.mes, body);
}

// ── 2) FINANCEIRO ANUAL ──
function relDocAnual(ano){
  const A=relatorioAnual(ano);
  if(!A.meses.length) return _relDoc('Relatório Financeiro Anual', String(ano), _relEmpty('Não há meses cadastrados para este período.'));
  const comDados=A.meses.filter(m=>m.entrada>0||m.saida>0);
  const melhor=comDados.slice().sort((a,b)=>b.sobra-a.sobra)[0];
  const pior=comDados.slice().sort((a,b)=>a.sobra-b.sobra)[0];
  const kpis=_relKpis([
    {label:'Entradas no período',val:fmt(A.totEntrada)},
    {label:'Saídas no período',val:fmt(A.totSaida)},
    {label:'Saldo acumulado',val:fmt(A.totSobra),cor:A.totSobra>=0?'var(--pos)':'var(--neg)'},
    {label:'Média de sobra/mês',val:fmt(comDados.length?A.totSobra/comDados.length:0)},
  ]);
  const evol=_relSection('Evolução mês a mês',
    _relTable(['Mês','Entradas','Saídas','Saldo'], A.meses.map(m=>[escapeHTML(m.mes), fmt(m.entrada), fmt(m.saida), `<span style="color:${m.sobra>=0?'var(--pos)':'var(--neg)'}">${fmt(m.sobra)}</span>`])));
  const destaques=(melhor&&pior)?_relSection('Melhores e piores meses',
    `<div style="font-size:12px;color:var(--text2)">🟢 Melhor mês: <strong>${escapeHTML(melhor.mes)}</strong> (${fmt(melhor.sobra)})<br>🔴 Mês mais apertado: <strong>${escapeHTML(pior.mes)}</strong> (${fmt(pior.sobra)})</div>`):'';
  return _relDoc('Relatório Financeiro Anual', String(ano), _relSection('Resumo executivo',kpis)+evol+destaques);
}

// ── 3) METAS ──
function relDocMetas(domFiltro){
  const todas=(D.metas||[]).filter(m=>m.ativa!==false);
  const lista=domFiltro?todas.filter(m=>(m.dominio||'financeiro')===domFiltro):todas;
  const periodo=domFiltro?('Domínio: '+(metaDom(domFiltro).label)):'Todos os domínios';
  if(!lista.length) return _relDoc('Relatório de Metas', periodo, _relEmpty('Nenhuma meta cadastrada para este filtro. Crie metas no módulo Metas & Objetivos.'));
  const r=(typeof _metaResumoData==='function')?_metaResumoData():{emAndamento:0,concluidas:0,atrasadas:0,criticas:0,domsAtivos:0};
  const kpis=_relKpis([
    {label:'Total de metas',val:String(lista.length)},
    {label:'Em andamento',val:String(r.emAndamento),cor:'var(--info)'},
    {label:'Concluídas',val:String(r.concluidas),cor:'var(--pos)'},
    {label:'Atrasadas',val:String(r.atrasadas),cor:r.atrasadas?'var(--neg)':'var(--text)'},
    {label:'Críticas',val:String(r.criticas),cor:r.criticas?'var(--neg)':'var(--text)'},
  ]);
  const porDom={}; lista.forEach(m=>{const d=m.dominio||'financeiro'; porDom[d]=(porDom[d]||0)+1;});
  const domSec=_relSection('Metas por domínio',
    _relTable(['Domínio','Quantidade'], Object.entries(porDom).sort((a,b)=>b[1]-a[1]).map(([d,n])=>[`${escapeHTML(metaDom(d).icon)} ${escapeHTML(metaDom(d).label)}`, String(n)])));
  const linhas=lista.slice().sort((a,b)=>(META_PRIOS[b.prioridade]?.ord||0)-(META_PRIOS[a.prioridade]?.ord||0)).map(m=>{
    const P=metaProgress(m); const dom=metaDom(m.dominio);
    const dv=(typeof metaDecisoesVinculadas==='function')?metaDecisoesVinculadas(m.id):{total:0};
    return [`${escapeHTML(m.icon||'🎯')} ${escapeHTML(m.nome||'')}<div style="font-size:10px;color:var(--text3)">${escapeHTML(dom.icon+' '+dom.label)}${m.prazo?' · prazo '+escapeHTML(m.prazo):''}${dv.total?' · 🧭 '+dv.total:''}</div>`,
      escapeHTML((META_STATUS[m.status]||{label:m.status||''}).label||''),
      P.defined?Math.round(P.pct)+'%':'—'];
  });
  const detalhe=_relSection('Detalhe das metas', _relTable(['Meta','Status','Progresso'], linhas));
  const passos=lista.filter(m=>m.proximosPassos).slice(0,8);
  const passosSec=passos.length?_relSection('Próximos passos',
    `<div style="display:grid;gap:6px;font-size:12px">${passos.map(m=>`<div>→ <strong>${escapeHTML(m.nome||'')}</strong>: ${escapeHTML(m.proximosPassos)}</div>`).join('')}</div>`):'';
  return _relDoc('Relatório de Metas', periodo, _relSection('Resumo executivo',kpis)+domSec+detalhe+passosSec);
}

// ── 4) DECISÕES ──
function relDocDecisoes(){
  const ds=(D.decisoes||[]).filter(d=>d.ativa!==false);
  if(!ds.length) return _relDoc('Relatório de Decisões', 'Todas as decisões', _relEmpty('Nenhuma decisão registrada. Use o módulo Decisões para avaliar escolhas importantes.'));
  const r=(typeof _decResumoData==='function')?_decResumoData():{emAnalise:0,aprovadas:0,adiadas:0,criticas:0,custoTotal:0,prazoProx:null};
  const recusadas=ds.filter(d=>['recusada','cancelada'].includes(d.status)).length;
  const kpis=_relKpis([
    {label:'Total',val:String(ds.length)},
    {label:'Em análise',val:String(r.emAnalise),cor:'var(--info)'},
    {label:'Aprovadas',val:String(r.aprovadas),cor:'var(--pos)'},
    {label:'Adiadas',val:String(r.adiadas),cor:'var(--violet)'},
    {label:'Recusadas/Canc.',val:String(recusadas)},
    {label:'Custo estimado',val:fmt(r.custoTotal),cor:'var(--text)'},
  ]);
  const porCat={}; ds.forEach(d=>{const c=d.categoria||'outro'; porCat[c]=(porCat[c]||0)+1;});
  const catSec=_relSection('Decisões por categoria',
    _relTable(['Categoria','Quantidade'], Object.entries(porCat).sort((a,b)=>b[1]-a[1]).map(([c,n])=>{const cc=(typeof DEC_CATS!=='undefined'?DEC_CATS.find(x=>x.id===c):null)||{icon:'•',label:c}; return [`${escapeHTML(cc.icon)} ${escapeHTML(cc.label)}`, String(n)];})));
  const linhas=ds.slice().sort((a,b)=>((typeof DEC_PRIOS!=='undefined'?DEC_PRIOS[b.prioridade]?.ord:0)||0)-((typeof DEC_PRIOS!=='undefined'?DEC_PRIOS[a.prioridade]?.ord:0)||0)).map(d=>{
    const an=(typeof analiseDecisao==='function')?analiseDecisao(d):{texto:''};
    const st=(typeof DEC_STATUS!=='undefined'?DEC_STATUS[d.status]:null)||{label:d.status||''};
    return [`${escapeHTML(d.titulo||'(sem título)')}<div style="font-size:10px;color:var(--text3)">${escapeHTML(st.label)}${d.prazo?' · prazo '+escapeHTML(d.prazo):''}</div><div style="font-size:10px;color:var(--text2);margin-top:2px">${escapeHTML(an.texto||'')}</div>`,
      d.custoEstimado>0?fmt(d.custoEstimado):'—'];
  });
  const detalhe=_relSection('Detalhe das decisões e veredito', _relTable(['Decisão','Custo'], linhas));
  const rb=ds.filter(d=>d.beneficios||d.riscos||d.alternativas).slice(0,6);
  const rbSec=rb.length?_relSection('Benefícios, riscos e alternativas',
    `<div style="display:grid;gap:8px;font-size:11.5px">${rb.map(d=>`<div><strong>${escapeHTML(d.titulo||'')}</strong>${d.beneficios?`<br>✅ ${escapeHTML(d.beneficios)}`:''}${d.riscos?`<br>⚠️ ${escapeHTML(d.riscos)}`:''}${d.alternativas?`<br>🔁 ${escapeHTML(d.alternativas)}`:''}</div>`).join('')}</div>`):'';
  return _relDoc('Relatório de Decisões', 'Todas as decisões', _relSection('Resumo executivo',kpis)+catSec+detalhe+rbSec);
}

// ── 5) COMPRAS & DESEJOS ──
function relDocCompras(){
  const itens=(_hob().itens||[]);
  if(!itens.length) return _relDoc('Relatório de Compras & Desejos', 'Lista de desejos', _relEmpty('Nenhum item na sua lista de Compras & Desejos.'));
  const R=(typeof compraResumoData==='function')?compraResumoData():{totalAberto:0,emAnalise:0,adiados:0,altoImpacto:0,proximo:null};
  const fundo=_hob().saldoFundo||0, aporte=_hob().aporteMensal||0;
  const kpis=_relKpis([
    {label:'Total em aberto',val:fmt(R.totalAberto),cor:'var(--violet)'},
    {label:'Fundo de compras',val:fmt(fundo),cor:'var(--teal)'},
    {label:'Aporte mensal',val:fmt(aporte)},
    {label:'Em análise',val:String(R.emAnalise),cor:'var(--info)'},
    {label:'Adiados',val:String(R.adiados)},
    {label:'Alto impacto',val:String(R.altoImpacto),cor:R.altoImpacto?'var(--warn)':'var(--text)'},
  ]);
  let proxSec='';
  if(R.proximo){
    const meses=(typeof compraMesesParaCobrir==='function')?compraMesesParaCobrir(R.proximo):null;
    proxSec=_relSection('Próxima compra recomendada',
      `<div style="font-size:13px;font-weight:700">${escapeHTML((typeof compraDominio==='function'?compraDominio(R.proximo.dominio).icon+' ':'')+(R.proximo.nome||''))}</div>
       <div style="font-size:12px;color:var(--text2);margin-top:3px">Custo: ${fmt(compraCusto(R.proximo))}${meses!=null&&isFinite(meses)?` · ~${meses} ${meses===1?'mês':'meses'} de aporte para cobrir`:''}</div>`);
  }
  const grp=(keyFn,labelFn)=>{const o={};itens.forEach(i=>{const k=keyFn(i)||'—';o[k]=(o[k]||0)+1;});return Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,n])=>[labelFn(k),String(n)]);};
  const domSec=_relSection('Por domínio', _relTable(['Domínio','Itens'], grp(i=>i.dominio, k=>typeof compraDominio==='function'?`${escapeHTML(compraDominio(k).icon)} ${escapeHTML(compraDominio(k).label)}`:escapeHTML(k))));
  const stSec=_relSection('Por status', _relTable(['Status','Itens'], grp(i=>i.status, k=>escapeHTML(_REL_COMPRA_ST[k]||k))));
  const abertos=(typeof hobItensAbertos==='function')?hobItensAbertos():itens.filter(i=>!['comprado','descartado'].includes(i.status));
  const linhas=abertos.slice().sort((a,b)=>(a.prioridade-b.prioridade)||(compraCusto(b)-compraCusto(a))).map(it=>{
    const an=(typeof analisarCompra==='function')?analisarCompra(it):{texto:''};
    return [`${escapeHTML((typeof compraDominio==='function'?compraDominio(it.dominio).icon+' ':'')+(it.nome||''))}<div style="font-size:10px;color:var(--text2);margin-top:2px">${escapeHTML(an.texto||'')}</div>`,
      fmt(compraCusto(it))];
  });
  const detalhe=_relSection('Itens em aberto e análise de impacto', _relTable(['Item','Custo'], linhas));
  const comprados=itens.filter(i=>i.status==='comprado');
  const compSec=comprados.length?_relSection('Itens comprados',
    _relTable(['Item','Custo'], comprados.map(it=>[escapeHTML(it.nome||''), fmt(compraCusto(it))]))):'';
  return _relDoc('Relatório de Compras & Desejos', 'Lista de desejos', _relSection('Resumo executivo',kpis)+proxSec+domSec+stSec+detalhe+compSec);
}

// ── 6) GERAL DA VIDA ──
function relDocGeral(){
  const mi=(typeof getMesRefIdx==='function')?getMesRefIdx():0;
  let entrada=0,cp={bruto:0,pendente:0},sobra=0,investir=0,reserva={pct:0,falta:0};
  try{ entrada=totalEMes(mi); cp=calcPendenteMes(mi); sobra=entrada-cp.bruto; investir=invDisp(mi); }catch(e){}
  try{ reserva=statusReserva(); }catch(e){}
  const metasAtivas=(D.metas||[]).filter(m=>m.ativa!==false).map(m=>({m,p:metaProgress(m)})).filter(x=>!x.p.concluida);
  const dr=(typeof _decResumoData==='function')?_decResumoData():{emAnalise:0,criticas:0,custoTotal:0,prazoProx:null};
  const cr=(typeof compraResumoData==='function')?compraResumoData():{totalAberto:0,proximo:null};
  let insights=[]; try{ const F=finInsights(mi); insights=(F&&F.insights)?F.insights.slice(0,5):[]; }catch(e){}

  const kpis=_relKpis([
    {label:'Saldo do mês',val:fmt(sobra),cor:sobra>=0?'var(--pos)':'var(--neg)'},
    {label:'Reserva',val:`${Math.round(reserva.pct||0)}%`,cor:(reserva.pct||0)>=100?'var(--pos)':'var(--warn)'},
    {label:'Disponível p/ investir',val:fmt(investir),cor:'var(--teal)'},
    {label:'Metas em andamento',val:String(metasAtivas.length)},
    {label:'Decisões em análise',val:String(dr.emAnalise),cor:dr.criticas?'var(--neg)':'var(--text)'},
    {label:'Desejos em aberto',val:fmt(cr.totalAberto),cor:'var(--violet)'},
  ]);

  const areas=_relSection('Resumo por área', `<div style="display:grid;gap:8px;font-size:12px;color:var(--text2)">
    <div>💰 <strong>Finanças:</strong> ${fmt(entrada)} de entradas, ${fmt(cp.bruto)} de saídas no mês${cp.pendente>0?`, ${fmt(cp.pendente)} ainda pendente`:''}.</div>
    <div>🛡️ <strong>Reserva:</strong> ${(reserva.pct||0)>=100?'completa':'em construção — faltam '+fmt(reserva.falta||0)}.</div>
    <div>🎯 <strong>Metas:</strong> ${metasAtivas.length} em andamento${metasAtivas[0]?`, mais perto: ${escapeHTML(metasAtivas.slice().sort((a,b)=>b.p.pct-a.p.pct)[0].m.nome||'')}`:''}.</div>
    <div>🧭 <strong>Decisões:</strong> ${dr.emAnalise} em análise${dr.criticas?`, ${dr.criticas} crítica(s)`:''}${dr.custoTotal?`, custo estimado ${fmt(dr.custoTotal)}`:''}.</div>
    <div>🛒 <strong>Compras &amp; desejos:</strong> ${fmt(cr.totalAberto)} em aberto${cr.proximo?`, próximo: ${escapeHTML(cr.proximo.nome||'')}`:''}.</div>
  </div>`);

  const alertas=insights.length?_relSection('Alertas importantes',
    `<div style="display:grid;gap:6px;font-size:12px">${insights.map(a=>`<div>${escapeHTML(a.icon||'•')} <strong>${escapeHTML(a.titulo||a.title||'')}</strong> — ${escapeHTML(a.desc||a.msg||'')}</div>`).join('')}</div>`):'';

  const passos=[];
  if((reserva.pct||0)<100) passos.push(`Completar a reserva (faltam ${fmt(reserva.falta||0)}).`);
  if(cp.pendente>0) passos.push(`Quitar ${fmt(cp.pendente)} de contas pendentes no mês.`);
  if(sobra>0&&investir>0) passos.push(`Direcionar ${fmt(investir)} para investimento.`);
  if(dr.prazoProx&&dr.prazoProx.dec) passos.push(`Decidir "${escapeHTML(dr.prazoProx.dec.titulo||'')}" (prazo em ${dr.prazoProx.dias}d).`);
  metasAtivas.filter(x=>x.m.proximosPassos).slice(0,2).forEach(x=>passos.push(`Meta "${escapeHTML(x.m.nome||'')}": ${escapeHTML(x.m.proximosPassos)}`));
  if(!passos.length) passos.push('Tudo em dia. Considere registrar um novo objetivo ou revisar suas metas.');
  const passosSec=_relSection('Próximos passos recomendados',
    `<div style="display:grid;gap:6px;font-size:12px">${passos.slice(0,6).map(p=>`<div>→ ${p}</div>`).join('')}</div>`);

  const riscos=[];
  if((reserva.pct||0)<50) riscos.push('Reserva de emergência abaixo de 50% da meta.');
  if(sobra<0) riscos.push('Mês fechando no negativo.');
  if(dr.criticas>0) riscos.push(`${dr.criticas} decisão(ões) crítica(s) pendente(s).`);
  const riscosSec=riscos.length?_relSection('Riscos do momento',
    `<div style="display:grid;gap:5px;font-size:12px;color:var(--text2)">${riscos.map(r=>`<div>⚠️ ${escapeHTML(r)}</div>`).join('')}</div>`):'';

  const oport=[];
  if(investir>0) oport.push(`${fmt(investir)} disponíveis para investir este mês.`);
  if((reserva.pct||0)>=100) oport.push('Reserva completa — você pode assumir metas mais ambiciosas.');
  const oportSec=oport.length?_relSection('Oportunidades',
    `<div style="display:grid;gap:5px;font-size:12px;color:var(--text2)">${oport.map(o=>`<div>💡 ${escapeHTML(o)}</div>`).join('')}</div>`):'';

  return _relDoc('Relatório Geral da Vida', D.meses[mi]||'', _relSection('Como está sua vida agora',kpis)+areas+alertas+passosSec+riscosSec+oportSec);
}

// ── Dispatcher ──
function renderRelatorioAtivo(){
  const el=document.getElementById('report-print'); if(!el) return;
  let html='';
  try{
    if(_relTipo==='mensal'){ const mi=(selRelMes==null)?getMesRefIdx():selRelMes; html=relDocMensal(mi); }
    else if(_relTipo==='anual'){ const ano=selRelAno||_relAnos().slice(-1)[0]; html=relDocAnual(ano); }
    else if(_relTipo==='metas'){ html=relDocMetas(_relFiltroDomMeta); }
    else if(_relTipo==='decisoes'){ html=relDocDecisoes(); }
    else if(_relTipo==='compras'){ html=relDocCompras(); }
    else if(_relTipo==='geral'){ html=relDocGeral(); }
  }catch(e){ html=_relDoc('Relatório', '', _relEmpty('Não foi possível gerar este relatório com os dados atuais.')); console.error('rel',e); }
  el.innerHTML=html;
  const ev=document.getElementById('rel-evolucao'); if(ev) ev.style.display='none';
}

function _relToggleControls(){
  const show=(id,on)=>{ const e=document.getElementById(id); if(e) e.style.display=on?'':'none'; };
  show('rel-mes', _relTipo==='mensal');
  show('rel-ano', _relTipo==='anual');
  show('rel-dom', _relTipo==='metas');
  const csv=document.getElementById('rel-csv-btn'); if(csv) csv.style.display=['mensal','metas','decisoes','compras'].includes(_relTipo)?'':'none';
}

function setRelTipo(v){
  _relTipo=v;
  if(!D.prefs) D.prefs={}; if(typeof D.prefs.relatorios!=='object'||!D.prefs.relatorios) D.prefs.relatorios={};
  D.prefs.relatorios.ultimoTipo=v;
  if(typeof scheduleAutoSave==='function') scheduleAutoSave();
  _relToggleControls(); renderRelatorioAtivo();
}
function setRelDom(v){ _relFiltroDomMeta=v; renderRelatorioAtivo(); }

// ── Exportação CSV opcional (à prova de injeção de fórmula) ──
function _csvCell(v){ const s=String(v==null?'':v).replace(/"/g,'""'); return /^[=+\-@]/.test(s)?`"'${s}"`:`"${s}"`; }
function _csvDownload(nome, linhas){
  const csv='\uFEFF'+linhas.map(r=>r.map(_csvCell).join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nome;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},100);
}
function exportRelCSV(){
  try{
    if(_relTipo==='metas'){
      const rows=[['Nome','Dominio','Status','Prioridade','Unidade','Progresso%','Prazo']];
      (D.metas||[]).filter(m=>m.ativa!==false && (!_relFiltroDomMeta||(m.dominio||'financeiro')===_relFiltroDomMeta)).forEach(m=>{
        const P=metaProgress(m); rows.push([m.nome||'', metaDom(m.dominio).label, (META_STATUS[m.status]||{}).label||m.status||'', (META_PRIOS[m.prioridade]||{}).label||'', m.unidade||'', P.defined?Math.round(P.pct):'', m.prazo||'']);
      });
      _csvDownload('metas.csv', rows);
    } else if(_relTipo==='decisoes'){
      const rows=[['Titulo','Categoria','Status','Prioridade','Custo','Prazo','Veredito']];
      (D.decisoes||[]).filter(d=>d.ativa!==false).forEach(d=>{ const an=(typeof analiseDecisao==='function')?analiseDecisao(d):{texto:''}; rows.push([d.titulo||'', d.categoria||'', d.status||'', d.prioridade||'', d.custoEstimado||0, d.prazo||'', an.texto||'']); });
      _csvDownload('decisoes.csv', rows);
    } else if(_relTipo==='compras'){
      const rows=[['Item','Dominio','Status','Classe','Custo','Prioridade']];
      (_hob().itens||[]).forEach(it=>rows.push([it.nome||'', (typeof compraDominio==='function'?compraDominio(it.dominio).label:it.dominio||''), _REL_COMPRA_ST[it.status]||it.status||'', it.classe||'', compraCusto(it), it.prioridade||'']));
      _csvDownload('compras-desejos.csv', rows);
    } else if(_relTipo==='mensal'){
      const mi=(selRelMes==null)?getMesRefIdx():selRelMes; const R=relatorioMensal(mi);
      const rows=[['Categoria','Valor','%']]; R.categorias.forEach(c=>rows.push([c.label, c.valor, Math.round(c.pct)]));
      _csvDownload(`financeiro-${(R.mes||'mes').replace(/\W+/g,'-')}.csv`, rows);
    }
    if(typeof toast==='function') toast('CSV exportado',true,'⬇️');
  }catch(e){ if(typeof uiAlert==='function') uiAlert('Não foi possível exportar CSV: '+e.message,{icon:'❌'}); }
}

// ═══════════════════════════════════════════════════
//  🏷️ CATEGORIAS EDITÁVEIS (Onda 2)
// ═══════════════════════════════════════════════════
function _resolveCor(cor){
  const map={'var(--neg)':'#EF4444','var(--pos)':'#10B981','var(--warn)':'#F5A623','var(--info)':'#38BDF8',
    'var(--brand)':'#00D4AA','var(--violet)':'#7C6FCD','var(--teal)':'#06B6D4','var(--rose)':'#F0516B','var(--amber)':'#F5A623'};
  return map[cor] || (/^#/.test(cor||'')?cor:'#6B7280');
}
function _storeFor(tipo){ return tipo==='ent' ? 'catsCustomEnt' : 'catsCustom'; }
function _baseFor(tipo){ return tipo==='ent' ? CATS_ENTRADA_BASE : CATS_BASE; }
function _dictFor(tipo){ return tipo==='ent' ? CATS_ENTRADA : CATS; }

function setCatField(tipo, key, field, val){
  const store=_storeFor(tipo), base=_baseFor(tipo), dict=_dictFor(tipo);
  if(!D[store] || typeof D[store]!=='object') D[store]={};
  if(!D[store][key]){ // primeira edição de uma padrão → cria override a partir do atual
    const cur=dict[key]||base[key]||{label:key,icon:'🏷️',cor:'#6B7280'};
    D[store][key]={label:cur.label,icon:cur.icon,cor:cur.cor};
  }
  D[store][key][field]=val;
  applyCatsCustom(); scheduleAutoSave(); renderCategorias();
}
function addCategoria(tipo){
  const store=_storeFor(tipo);
  if(!D[store] || typeof D[store]!=='object') D[store]={};
  const key='c_'+Date.now().toString(36);
  D[store][key]={label:'Nova categoria', icon:'🏷️', cor:'#EC4899'};
  applyCatsCustom(); scheduleAutoSave(); renderCategorias();
}
async function removeCategoria(tipo,key){
  const store=_storeFor(tipo);
  if(!await uiConfirm('Remover esta categoria? Lançamentos que a usavam passam a exibir o código da categoria até serem reclassificados.',{icon:'🏷️',okText:'Remover'})) return;
  if(D[store]) delete D[store][key];
  applyCatsCustom(); scheduleAutoSave(); renderAll();
}
function resetCategoria(tipo,key){
  const store=_storeFor(tipo);
  if(D[store]) delete D[store][key];
  applyCatsCustom(); scheduleAutoSave(); renderCategorias();
}
function renderCategorias(){
  const el=document.getElementById('config-categorias'); if(!el) return;
  applyCatsCustom();
  const linha=(tipo,key,v)=>{
    const base=_baseFor(tipo); const isDefault=(key in base);
    const store=_storeFor(tipo); const overridden=isDefault && D[store] && D[store][key];
    const acao = !isDefault
      ? `<button class="btn-rm" title="Remover" onclick="removeCategoria('${tipo}','${key}')">✕</button>`
      : (overridden ? `<button class="btn btn-ghost" style="height:26px;font-size:11px;padding:2px 8px" title="Voltar ao padrão" onclick="resetCategoria('${tipo}','${key}')">↺</button>` : `<span style="font-size:10px;color:var(--text3)">padrão</span>`);
    return `<tr>
      <td><input type="text" value="${(v.icon||'🏷️').replace(/"/g,'&quot;')}" onchange="setCatField('${tipo}','${key}','icon',this.value)" style="width:46px;text-align:center;font-size:16px" maxlength="2"></td>
      <td><input type="text" value="${attr(v.label||key)}" onchange="setCatField('${tipo}','${key}','label',this.value)" style="min-width:150px;font-weight:600"></td>
      <td><input type="color" value="${_resolveCor(v.cor)}" onchange="setCatField('${tipo}','${key}','cor',this.value)" style="width:42px;height:28px;padding:2px;cursor:pointer;background:transparent;border:1px solid var(--border);border-radius:6px"></td>
      <td style="font-family:monospace;font-size:11px;color:var(--text3)">${key}</td>
      <td style="text-align:right">${acao}</td>
    </tr>`;
  };
  const tabela=(tipo,dict,titulo,icon)=>`
    <div style="margin-bottom:8px;font-size:12px;font-weight:700;color:var(--text2)">${icon} ${titulo} <span style="color:var(--text3);font-weight:500">(${Object.keys(dict).length})</span></div>
    <div class="scroll" style="margin-bottom:8px"><table style="width:100%">
      <thead><tr><th style="width:46px">Ícone</th><th>Nome</th><th style="width:50px">Cor</th><th>Código</th><th></th></tr></thead>
      <tbody>${Object.entries(dict).map(([k,v])=>linha(tipo,k,v)).join('')}</tbody>
    </table></div>
    <button class="btn btn-ghost" style="height:30px;font-size:12px" onclick="addCategoria('${tipo}')">+ Nova categoria</button>`;
  el.innerHTML=`<div class="g2" style="gap:24px;align-items:start">
    <div>${tabela('exp',CATS,'Despesas','💸')}</div>
    <div>${tabela('ent',CATS_ENTRADA,'Entradas','💰')}</div>
  </div>`;
}

function renderConfig() {
  // Dias de corte
  const dc=document.getElementById('config-diacorte');if(dc)dc.value=D.diaCorte||20;
  renderConfigMeses();
  const hojeEl=document.getElementById('config-hoje');if(hojeEl)hojeEl.textContent=new Date().getDate();
  const mrEl=document.getElementById('config-mes-ref');if(mrEl)mrEl.textContent=D.meses[getMesRefIdx()]||'—';
  // Parâmetros
  const mcc=document.getElementById('config-metaCC');if(mcc)mcc.value=D.metaCC||2000;
  const sal=document.getElementById('config-saldo');if(sal)sal.value=D.saldo||0;
  const rm=document.getElementById('config-reservamult');if(rm)rm.value=D.reservaMult||6;
  // Categorias editáveis
  renderCategorias();
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
      .then(()=>db.collection('userData').doc(uid).set({data:JSON.stringify(blank),updatedAt:new Date().toISOString(),v:4,createdAt:new Date().toISOString()}))
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
    // Senha NÃO é definida aqui. Para redefinir, o admin usa o botão "🔐 Senha"
    // que dispara auth.sendPasswordResetEmail (fluxo seguro do Firebase).
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
          📋 Base de cálculo: Salário mensal <strong>${fmt(salarioMensal())}/mês</strong> × ${D.reservaMult||6} meses = <strong style="color:${pctCor}">${fmt(reserva.meta)}</strong>
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
      const yrBord=yr==='2026'?'rgba(59,130,246,.2)':'var(--violet-glow)';
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
            Salário mensal: <strong>${fmt(salarioMensal())}</strong> · Meta (${D.reservaMult||6} meses): <strong>${fmt(metaE)}</strong><br>
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
    const diffCor=diff===0?'var(--brand)':diff>0?'var(--warn)':'var(--neg)';
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

  applyChartDefaults(); dc('cArcaDough');
  const cAD=document.getElementById('cArcaDough');
  if(cAD){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    CH['cArcaDough']=new Chart(cAD,{type:'doughnut',data:{
      labels:buckets.map(b=>ARCA.names[b]),
      datasets:[{data:vals,backgroundColor:['#38BDF8','#F5A623','#00D4AA','#7C6FCD'],borderWidth:0,hoverOffset:10}]
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
      <td><input type="number" step="0.01" min="0" value="${a.dy!=null&&a.dy!==''?a.dy:''}" placeholder="${a.bucket==='C'?'—':'auto'}" ${a.bucket==='C'?'disabled':''} onchange="D.ativos[${ai}].dy=(this.value===''?undefined:parseFloat(this.value));scheduleAutoSave();renderAtivos()" style="width:72px;text-align:right;${a.bucket==='C'?'opacity:.35':''}" title="Dividend yield mensal deste ativo. Vazio = usa o padrão do bucket (FII 0,75% · Ações BR 0,70% · Intl 0,24%). Renda fixa não paga dividendo."></td>
      <td><input type="text" value="${a.ticker||''}" onchange="D.ativos[${ai}].ticker=this.value;scheduleAutoSave()" placeholder="TICKER" style="width:90px;font-family:monospace;font-size:12px"></td>
      <td style="text-align:center"><input type="checkbox" ${a.marco?'checked':''} onchange="toggleAtivoMarco(${ai},this.checked)" title="Também é um marco financeiro (meta) no Plano de Aposentadoria" style="width:18px;height:18px;cursor:pointer;accent-color:var(--accent)"></td>
      <td><input type="number" step="0.01" min="0" value="${a.limite||''}" placeholder="${a.marco?'meta R$':'—'}" ${a.marco?'':'disabled'} onchange="D.ativos[${ai}].limite=parseFloat(this.value)||0;scheduleAutoSave();renderAtivos()" style="width:120px;text-align:right;${a.marco?'font-weight:600;color:var(--accent)':'opacity:.35'}" title="Patrimônio-alvo para atingir este marco"></td>
      <td><button class="btn-rm" onclick="removeAtivo(${ai})">✕</button></td>
    </tr>`).join('');
    el.innerHTML=`<thead class="thead-sticky"><tr><th>Ativo</th><th>Classe</th><th>Bucket ARCA</th><th class="tr">Valor (R$)</th><th>Índice</th><th class="tr">%</th><th>Taxa anual</th><th class="tr" title="Dividend yield mensal por ativo — sobrescreve o padrão do bucket no Plano de Aposentadoria">Div %/mês</th><th>Ticker</th><th title="Exibe este item como marco financeiro no Plano de Aposentadoria">🎯 Marco</th><th class="tr">Meta (R$)</th><th></th></tr></thead><tbody>${rows}</tbody>`;
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
  applyChartDefaults(); dc('cProjLine');
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
      borderColor:'var(--brand)',backgroundColor:'rgba(16,185,129,.08)',tension:.4,pointRadius:4,borderWidth:3,fill:true});
    CH['cProjLine']=new Chart(cPL,{type:'line',data:{labels:ANOS.map(a=>a===0?'Hoje':`${a}a`),datasets},options:chartOpts()});
  }
}

function addAtivo()    { D.ativos.push({nome:'Novo ativo',classe:'Renda Fixa',bucket:'C',valor:0,indice:'CDI',pct:100,ticker:'',marco:false,limite:0,ordem:0}); renderAtivos(); scheduleAutoSave(); }
async function removeAtivo(i){ if(!await uiConfirm(`Remover o ativo <strong>"${D.ativos[i].nome}"</strong>?`,{icon:'📊',okText:'Remover'}))return; D.ativos.splice(i,1); renderAtivos(); scheduleAutoSave(); toast('Ativo removido',true,'🗑️'); }

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
      {label:'CDI',  data:[D.cdi12,D.cdifev,D.cdi26],  backgroundColor:'#00D4AA',borderRadius:6},
      {label:'IPCA', data:[D.ipca12,D.ipcafev,D.ipca26],backgroundColor:'#F5A623',borderRadius:6},
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
    perfilCor = 'var(--info)';
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
    perfilCor = 'var(--warn)';
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
    perfilCor = 'var(--brand)';
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
      { bucket:'R', cor:'var(--warn)', txt:`Real Estate (${rec.r}%) — FIIs sofrem mais com juros altos, mas mantém diversificação e renda de dividendos.` },
      { bucket:'A2',cor:'var(--warn)', txt:`Internacionais (${rec.a2}%) — dólar como proteção e diversificação em mercados menos correlacionados.` },
      { bucket:'A', cor:'var(--info)', txt:`Ações BR (${rec.a}%) — bolsa pressionada por juros altos, posição mínima para não perder o movimento de queda de juros.` },
    ];
    alertas = [
      { tipo:'warn', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — renda fixa gerando retorno real expressivo acima da inflação.` },
      { tipo:'warn', txt:'Momento de acumular Caixa. Quando a SELIC começar a cair, migre gradualmente para A e R.' },
    ];
  } else if (ciclo === 'juros_elevados') {
    rec = recBase;
    rationale = [
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — juros ainda atrativos, manter parcela relevante em renda fixa de qualidade.` },
      { bucket:'R', cor:'var(--warn)', txt:`Real Estate (${rec.r}%) — FIIs de tijolo com desconto histórico. Bom momento de acumulação de cotas.` },
      { bucket:'A2',cor:'var(--warn)', txt:`Internacionais (${rec.a2}%) — diversificação cambial e exposição a mercados desenvolvidos.` },
      { bucket:'A', cor:'var(--info)', txt:`Ações BR (${rec.a}%) — início de posição para capturar ciclo de queda de juros que virá.` },
    ];
    alertas = [
      { tipo:'info', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — momento de transição. Monitore as decisões do COPOM.` },
      { tipo:'info', txt:'Gradualmente reduza Caixa a cada corte de 0,5pp na SELIC e reinvista em A e R.' },
    ];
  } else if (ciclo === 'juros_moderados') {
    rec = recBase;
    rationale = [
      { bucket:'A', cor:'var(--info)', txt:`Ações BR (${rec.a}%) — juros em queda favorecem bolsa. Hora de aumentar exposição a renda variável.` },
      { bucket:'R', cor:'var(--warn)', txt:`Real Estate (${rec.r}%) — FIIs se valorizam com queda de juros. Renda de aluguéis + ganho de capital.` },
      { bucket:'C', cor:'#6B7280', txt:`Caixa (${rec.c}%) — ainda relevante para liquidez e proteção, mas retorno real menor.` },
      { bucket:'A2',cor:'var(--warn)', txt:`Internacionais (${rec.a2}%) — diversificação geográfica importante independente do ciclo local.` },
    ];
    alertas = [
      { tipo:'pos', txt:'Ciclo favorável para renda variável. Priorize boas empresas com histórico de dividendos.' },
      { tipo:'info', txt:`Juro real de ${juroReal.toFixed(2)}% a.a. — verifique se a renda fixa ainda supera a inflação nos seus ativos.` },
    ];
  } else {
    rec = recBase;
    rationale = [
      { bucket:'A', cor:'var(--info)', txt:`Ações BR (${rec.a}%) — ambiente de juros baixos é o melhor para a bolsa. Maximize exposição.` },
      { bucket:'R', cor:'var(--warn)', txt:`Real Estate (${rec.r}%) — FIIs com excelente custo de oportunidade vs. renda fixa.` },
      { bucket:'A2',cor:'var(--warn)', txt:`Internacionais (${rec.a2}%) — manter diversificação global para proteção cambial.` },
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

  const bucketColors = {A:'var(--info)',R:'var(--warn)',C:'#6B7280',A2:'var(--warn)'};
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

async function applyARCARec(a, r, c, a2) {
  if (!await uiConfirm(`Aplicar a alocação recomendada?<br><br>A — Ações: <strong>${a}%</strong><br>R — Real Estate: <strong>${r}%</strong><br>C — Caixa: <strong>${c}%</strong><br>A2 — Internacionais: <strong>${a2}%</strong><br><br>Isso substituirá suas metas atuais.`,{icon:'🎯',okText:'Aplicar',danger:false})) return;
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




// ── METAS FINANCEIRAS ────────────────────────────────────────────

// ═══════════════════════════════════════════════════
//  RELATÓRIO MENSAL
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
//  METAS FINANCEIRAS
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
//  CATEGORIAS (admin)
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
//  PARÂMETROS DO SISTEMA (admin)
// ═══════════════════════════════════════════════════











// ── ADMIN: PARÂMETROS DO SISTEMA ─────────────────────────────────

// ═══════════════════════════════════════════════════
//  MODAL UX — ESC fecha, clique fora fecha
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', function(ev){
  if(ev.key !== 'Escape') return;
  document.querySelectorAll('.modal-overlay').forEach(m => {
    if(m.style.display === 'flex') m.style.display = 'none';
  });
});
document.addEventListener('click', function(ev){
  const t = ev.target;
  if(t.classList && t.classList.contains('modal-overlay') && t.style.display === 'flex') {
    t.style.display = 'none';
  }
});

// ═══════════════════════════════════════════════════
//  DIÁLOGOS CUSTOMIZADOS — substituem confirm()/alert()
// ═══════════════════════════════════════════════════
function uiConfirm(msg, opts={}) {
  return new Promise(resolve => {
    const ov = document.getElementById('ui-dialog-overlay');
    if(!ov){ resolve(window.confirm(msg)); return; }
    document.getElementById('ui-dialog-icon').textContent = opts.icon || '⚠️';
    document.getElementById('ui-dialog-title').textContent = opts.title || 'Confirmar ação';
    document.getElementById('ui-dialog-msg').innerHTML = String(msg).replace(/\n/g,'<br>');
    const btnOk = document.getElementById('ui-dialog-ok');
    const btnCancel = document.getElementById('ui-dialog-cancel');
    btnOk.textContent = opts.okText || 'Confirmar';
    btnOk.className = 'btn ' + (opts.danger===false ? 'btn-pri' : 'btn-neg');
    btnCancel.style.display = '';
    ov.style.display = 'flex';
    const close = (val) => { ov.style.display='none'; btnOk.onclick=null; btnCancel.onclick=null; resolve(val); };
    btnOk.onclick = () => close(true);
    btnCancel.onclick = () => close(false);
  });
}
function uiAlert(msg, opts={}) {
  return new Promise(resolve => {
    const ov = document.getElementById('ui-dialog-overlay');
    if(!ov){ window.alert(msg); resolve(); return; }
    document.getElementById('ui-dialog-icon').textContent = opts.icon || 'ℹ️';
    document.getElementById('ui-dialog-title').textContent = opts.title || 'Atenção';
    document.getElementById('ui-dialog-msg').innerHTML = String(msg).replace(/\n/g,'<br>');
    const btnOk = document.getElementById('ui-dialog-ok');
    const btnCancel = document.getElementById('ui-dialog-cancel');
    btnOk.textContent = 'OK';
    btnOk.className = 'btn btn-pri';
    btnCancel.style.display = 'none';
    ov.style.display = 'flex';
    const close = () => { ov.style.display='none'; btnOk.onclick=null; resolve(); };
    btnOk.onclick = close;
  });
}

async function resetarDadosFinanceiros() {
  const ok = await uiConfirm('Apagar <strong>todos os dados financeiros</strong>?<br><br>⚠️ Esta ação não pode ser desfeita.',{icon:'🗑️',okText:'Apagar tudo'});
  if(!ok) return;
  db.collection('userData').doc(_user.uid).delete().catch(()=>{});
  D = migrateData(null);
  selDash = 0;
  renderAll();
  toast('Dados apagados.', true, '🗑️');
}

// ═══════════════════════════════════════════════════
//  BACKUP / EXPORT / IMPORT
// ═══════════════════════════════════════════════════
function exportarBackupJSON() {
  try {
    const payload = {
      _app: 'FinancasPRO',
      _version: 4,
      _exportedAt: new Date().toISOString(),
      _user: (_user && _user.email) || '',
      data: D
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const dt = new Date().toISOString().slice(0,10);
    a.download = `financaspro-backup-${dt}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup baixado!', true, '💾');
  } catch(e) {
    uiAlert('Erro ao gerar backup: ' + e.message, {icon:'❌'});
  }
}

async function importarBackupJSON(input) {
  const file = input.files && input.files[0];
  input.value = ''; // reset para permitir reimportar o mesmo arquivo
  if(!file) return;
  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const data = payload && payload._app === 'FinancasPRO' ? payload.data : payload;
    // Validação mínima de estrutura
    if(!data || !Array.isArray(data.meses) || !Array.isArray(data.entradas)) {
      uiAlert('Arquivo inválido: não parece um backup do FinançasPRO.', {icon:'❌'});
      return;
    }
    const ok = await uiConfirm(
      `Restaurar backup de <strong>${payload._exportedAt ? new Date(payload._exportedAt).toLocaleDateString('pt-BR') : 'data desconhecida'}</strong>?<br><br>` +
      `📅 ${data.meses.length} meses · 💰 ${data.entradas.length} entradas · 📌 ${(data.fixas||[]).length} fixas · 🛒 ${(data.compras||[]).length} compras · 🎯 ${(data.metas||[]).length} metas · 🧭 ${(data.decisoes||[]).length} decisões<br>` +
      `🛍️ ${((data.hobbies&&data.hobbies.itens)||[]).length} desejos · 🏦 fundo ${fmt((data.hobbies&&data.hobbies.saldoFundo)||0)}<br><br>` +
      `⚠️ Seus dados atuais serão <strong>substituídos</strong>.`,
      {icon:'📤', okText:'Restaurar'}
    );
    if(!ok) return;
    D = migrateData(data);
    selDash = getMesRefIdx();
    scheduleAutoSave();
    renderAll();
    toast('Backup restaurado!', true, '✅');
  } catch(e) {
    uiAlert('Erro ao ler o arquivo: ' + e.message, {icon:'❌'});
  }
}

function exportarCSV() {
  try {
    const sep = ';'; // Excel pt-BR
    const linhas = [['Mês','Entradas','Saídas','Sobra','P/ Investir'].join(sep)];
    const fmtN = v => String((v||0).toFixed(2)).replace('.', ',');
    D.meses.forEach((mes, i) => {
      const e = totalEMes(i);
      const s = totalDivBruto(i);
      linhas.push([mes, fmtN(e), fmtN(s), fmtN(e-s), fmtN(invDisp(i))].join(sep));
    });
    // Detalhe de compras parceladas
    linhas.push('');
    linhas.push(['Compra','Categoria','Valor total','Parcelas','Início'].join(sep));
    (D.compras||[]).filter(c=>c.ativo).forEach(c => {
      linhas.push([c.nome, c.cat||'', fmtN(c.valor), c.parcelas||1, c.mesInicio||''].join(sep));
    });
    const csv = '\uFEFF' + linhas.join('\n'); // BOM para Excel reconhecer UTF-8
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const dt = new Date().toISOString().slice(0,10);
    a.download = `financaspro-fluxo-${dt}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exportado!', true, '📊');
  } catch(e) {
    uiAlert('Erro ao exportar CSV: ' + e.message, {icon:'❌'});
  }
}

// ── DUPLICAR registros (conveniência) ──
function duplicarEntrada(ei) {
  const orig = D.entradas[ei];
  if(!orig) return;
  const copia = JSON.parse(JSON.stringify(orig));
  copia.id = genId('e');
  copia.nome = orig.nome + ' (cópia)';
  D.entradas.push(copia);
  scheduleAutoSave(); renderEntradas(); renderAll();
  toast('Entrada duplicada — edite a cópia', true, '📋');
}
function duplicarCompra(ci) {
  const orig = D.compras[ci];
  if(!orig) return;
  const copia = JSON.parse(JSON.stringify(orig));
  copia.id = genId('c');
  copia.nome = orig.nome + ' (cópia)';
  D.compras.push(copia);
  scheduleAutoSave(); renderSaidasVar(); renderAll();
  toast('Compra duplicada — edite a cópia', true, '📋');
}

// ═══════════════════════════════════════════════════
//  ATALHOS DE TECLADO (g+tecla navega, n = novo)
// ═══════════════════════════════════════════════════
let _keySeq = '';
let _keySeqTimer = null;
document.addEventListener('keydown', function(ev){
  // Ignora quando digitando em campos
  const tag = (ev.target.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea' || tag==='select' || ev.target.isContentEditable) return;
  if(ev.ctrlKey || ev.metaKey || ev.altKey) return;

  const k = ev.key.toLowerCase();

  // Sequência "g" + tecla → navegação
  if(_keySeq === 'g') {
    const map = { d:'dash', e:'entradas', c:'carteira', s:'saidas', i:'invest', f:'faturas', p:'perfil', o:'config' };
    if(map[k]) { ev.preventDefault(); goSide(map[k]); }
    _keySeq = '';
    clearTimeout(_keySeqTimer);
    return;
  }
  if(k === 'g') {
    _keySeq = 'g';
    clearTimeout(_keySeqTimer);
    _keySeqTimer = setTimeout(()=>{ _keySeq=''; }, 1200);
    return;
  }

  // "n" → novo registro contextual à página atual
  if(k === 'n') {
    const pg = document.querySelector('.page.on');
    const id = pg ? pg.id.replace('page-','') : '';
    if(id==='entradas' && typeof abrirModalEntrada==='function') { ev.preventDefault(); abrirModalEntrada(); }
    else if(id==='saidas' && typeof abrirModalCompra==='function') { ev.preventDefault(); abrirModalCompra(); }
  }
});

// ── Autofoco no primeiro campo ao abrir modal ──
(function(){
  const observer = new MutationObserver(muts => {
    muts.forEach(m => {
      if(m.target.classList && m.target.classList.contains('modal-overlay') && m.target.style.display === 'flex') {
        const inp = m.target.querySelector('input:not([type=hidden]):not([type=file]), select, textarea');
        if(inp) setTimeout(()=>inp.focus(), 60);
      }
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      observer.observe(m, { attributes: true, attributeFilter: ['style'] });
    });
  });
})();
