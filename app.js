/* ═══════════════════════════════
   DEFAULT DATA
═══════════════════════════════ */
const DEFAULT = {
  salario:6500, outras:0,
  saldo:0, reserva:500, invest:0,
  cdi12:14.80, cdifev:1.21, cdi26:3.41,
  ipca12:4.14, ipcafev:0.88, ipca26:1.92,
  arcaMeta:{a:25,r:25,c:25,a2:25},
  metaCC:2000,
  meses:['Mai/26','Jun/26','Jul/26','Ago/26','Set/26','Out/26','Nov/26','Dez/26','Jan/27','Fev/27','Mar/27','Abr/27','Mai/27','Jun/27','Jul/27','Ago/27','Set/27','Out/27','Nov/27','Dez/27'],
  cartoes:[
    {nome:'Nubank PF',    limite:3700,  bandeira:'Mastercard'},
    {nome:'Nubank PJ',    limite:9700,  bandeira:'Mastercard'},
    {nome:'Mercado Pago', limite:11000, bandeira:'Mastercard'},
    {nome:'Renner',       limite:7200,  bandeira:'Mastercard'},
    {nome:'Amazon',       limite:2580,  bandeira:'Visa'},
    {nome:'SICREDI',      limite:6300,  bandeira:'Visa'},
  ],
  dividas:[
    {nome:'Faculdade',    tipo:'Fixo',     cat:'sem',    limCartao:'',  vals:[0,644.05,644.05,644.05,644.05,644.05,644.05,644.05,400,400,400,400,400,400,400,400,400,400,400,400]},
    {nome:'Claro',        tipo:'Fixo',     cat:'sem',    limCartao:'',  vals:[120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120,120]},
    {nome:'DAS',          tipo:'Fixo',     cat:'sem',    limCartao:'',  vals:[0,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85,85]},
    {nome:'IR',           tipo:'Fixo',     cat:'sem',    limCartao:'',  vals:[0,96.47,96.47,96.47,96.47,96.47,96.47,96.47,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PF',    tipo:'Variável', cat:'cartao', limCartao:'Nubank PF',   vals:[2148.08,366.78,117.34,117.34,117.34,117.34,117.34,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Nubank PJ',    tipo:'Variável', cat:'cartao', limCartao:'Nubank PJ',   vals:[961.41,678.08,678.08,565.09,298.16,298.16,298.16,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'SICREDI',      tipo:'Variável', cat:'limite', limCartao:'SICREDI',     vals:[1370.44,355.26,229.26,74.9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Mercado Pago', tipo:'Variável', cat:'cartao', limCartao:'Mercado Pago',vals:[527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,527.45,485.38,485.38,122.63,115.55,0,0,0,0,0,0,0]},
    {nome:'Renner',       tipo:'Variável', cat:'cartao', limCartao:'Renner',       vals:[467.86,362.27,314.31,314.31,200.35,200.35,200.35,200.35,0,0,0,0,0,0,0,0,0,0,0,0]},
    {nome:'Amazon',       tipo:'Variável', cat:'limite', limCartao:'Amazon',       vals:[105.7,105.7,105.7,105.7,105.7,105.7,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},
  ],
  guardado:[
    {nome:'Reserva de Emergência', arcaBucket:'C', vals:[500,1200,1600,1800,2300,2300,2400,2800,3300,3400,3400,3700,3700,3800,2800,2000,2000,2000,2000,2000]},
    {nome:'Investimento',          arcaBucket:'A', vals:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1000,1800,1800,1800,1800,1800]},
  ],
  ativos:[
    {nome:'Tesouro Selic',  classe:'Renda Fixa', bucket:'C',  valor:0, indice:'SELIC', pct:100, obs:'Caixa / reserva'},
    {nome:'FII XPML11',     classe:'FII',        bucket:'R',  valor:0, indice:'CDI',   pct:100, obs:'Real Estate'},
    {nome:'IVVB11',         classe:'ETF',        bucket:'A2', valor:0, indice:'CDI',   pct:100, obs:'Ativos internacionais'},
  ]
};

/* ═══════════════════════════════
   STATE
═══════════════════════════════ */
let D = JSON.parse(JSON.stringify(DEFAULT)); // Will be overwritten by Firebase
// migrate
if(!D.guardado){D.guardado=[{nome:'Reserva de Emergência',arcaBucket:'R',vals:Array(D.meses.length).fill(0)},{nome:'Investimento',arcaBucket:'A',vals:Array(D.meses.length).fill(0)}];D.dividas=D.dividas.filter(d=>!d.nome.toLowerCase().includes('reserv')&&!d.nome.toLowerCase().includes('invest'));}
if(!D.cartoes) D.cartoes=JSON.parse(JSON.stringify(DEFAULT.cartoes));
if(!D.ativos)  D.ativos=JSON.parse(JSON.stringify(DEFAULT.ativos));
if(!D.arcaMeta)D.arcaMeta={a:25,r:25,c:25,a2:25};
if(!D.metaCC) D.metaCC=2000;
D.dividas.forEach(d=>{if(!d.cat)d.cat='sem';if(!d.limCartao)d.limCartao='';});
D.guardado.forEach(g=>{if(!g.arcaBucket)g.arcaBucket='R';});
D.ativos.forEach(a=>{if(!a.indice)a.indice='CDI';if(a.pct===undefined)a.pct=100;if(a.rentab!==undefined&&!a.pct){a.pct=a.rentab;}});;

let selDash=0; let CH={};
let isDark=(localStorage.getItem('cf_theme')||'dark')==='dark';
// year collapse state: default collapsed
let yrCollapsed={};
applyTheme();

/* ═══════════════════════════════
   HELPERS
═══════════════════════════════ */
const fmt  = v=>isNaN(v)||v===null?'—':'R$\u00a0'+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = v=>'R$\u00a0'+Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0});
const fmtP = v=>Number(v).toFixed(2)+'%';
const nm   = ()=>D.meses.length;
const totalE   = ()=>(D.salario||0)+(D.outras||0);
const totalDiv = i=>D.dividas.reduce((s,d)=>s+(d.vals[i]||0),0);
const totalGrd = i=>D.guardado.reduce((s,d)=>s+(d.vals[i]||0),0);
// What was actually available to invest this month (per business rules)
const invDisp  = i=>calcSaldoInvestir(i).saldo;
const sobraM   = i=>totalE()-totalDiv(i);
const dc = id=>{if(CH[id]){CH[id].destroy();delete CH[id];}};
const gc = ()=>getComputedStyle(document.documentElement).getPropertyValue('--gc').trim();
const tc = ()=>getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
function shortL(m){const p=m.split('/');return(p[0]||m).slice(0,1)+(p[1]||'');}
function scO(shortX){return{x:{grid:{color:gc()},ticks:{color:tc(),autoSkip:false,maxRotation:0,font:{size:10},callback:function(val,i){return shortX?shortL(D.meses[i]||''):D.meses[i]||'';}}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}};}
function scOL(){return{x:{grid:{color:gc()},ticks:{color:tc(),autoSkip:false,maxRotation:0,font:{size:10}}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}};}
const COLORS=['#e05555','#e8a020','#4a9eff','#9b7ff4','#e87e3a','#2dd4bf','#78c83a','#c84a8e','#c8c83a','#3a78c8','#22c77a','#c83a7a'];
const ARCA_COLORS={A:'#4a9eff',R:'#f97316',C:'#9ca3af',A2:'#f0a020'};
const ARCA_NAMES={A:'A — Ações Brasileiras',R:'R — Real Estate',C:'C — Caixa',A2:'A — Ativos Internacionais'};
const ARCA_DESC={A:'Ações de empresas brasileiras listadas na B3 — crescimento de longo prazo no mercado nacional',R:'Fundos Imobiliários (FIIs) — geração de renda passiva e exposição ao mercado imobiliário',C:'Reserva de liquidez: Tesouro Selic, CDBs, fundos DI — proteção e disponibilidade imediata',A2:'ETFs internacionais, BDRs, fundos globais — diversificação fora do Brasil'};

function reservaAcum(i){const r=D.guardado.find(d=>d.nome.toLowerCase().includes('reserv'));return(D.reserva||0)+(r?r.vals.slice(0,i+1).reduce((s,v)=>s+(v||0),0):0);}
function investAcum(i){const inv=D.guardado.find(d=>d.nome.toLowerCase().includes('invest'));return(D.invest||0)+(inv?inv.vals.slice(0,i+1).reduce((s,v)=>s+(v||0),0):0);}
function saldoAbertoCartao(d){
  const cartao=D.cartoes.find(c=>c.nome===d.limCartao);
  const lim=cartao?cartao.limite:(d.limite||0);
  return{aberto:d.vals.reduce((s,v)=>s+(v||0),0),lim};
}
function getLimite(d){const c=D.cartoes.find(x=>x.nome===d.limCartao);return c?c.limite:(d.limite||0);}

/* ═══════════════════════════════
   THEME
═══════════════════════════════ */
function applyTheme(){
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  const btn=document.getElementById('theme-btn');
  if(btn) btn.textContent=isDark?'☀️':'🌙';
}
function logout(){ window.location.href='index.html'; } // Firebase module handles Sair button directly
function toggleTheme(){
  isDark=!isDark;
  localStorage.setItem('cf_theme',isDark?'dark':'light');
  applyTheme();
  Object.keys(CH).forEach(id=>dc(id));
  renderAll();
}

/* ═══════════════════════════════
   NAV / ROUTING
═══════════════════════════════ */
function go(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  el.classList.add('on');
  renderAll();
}
function switchSub(id,el){
  document.querySelectorAll('#page-dash .subpage').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('#page-dash .stab').forEach(t=>t.classList.remove('on'));
  document.getElementById('sub-'+id).classList.add('on');
  el.classList.add('on');
  if(id==='geral'){renderGeral();}
  if(id==='mes'){buildMonths('dash-months',selDash,i=>{selDash=i;renderMes();});renderMes();}
}
function switchSubSai(id,el){
  document.querySelectorAll('#page-saidas .subpage').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('#page-saidas .stab').forEach(t=>t.classList.remove('on'));
  document.getElementById('sub-'+id).classList.add('on');
  el.classList.add('on');
  if(id==='fixas') renderSaidas('Fixo','div-fixas-table');
  if(id==='variaveis') renderSaidas('Variável','div-var-table');
  if(id==='periodos') renderPeriodos();
}
function switchSubInv(id,el){
  document.querySelectorAll('#page-invest .subpage').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('#page-invest .stab').forEach(t=>t.classList.remove('on'));
  document.getElementById('sub-'+id).classList.add('on');
  el.classList.add('on');
  if(id==='arca') renderArca();
  if(id==='carteira-inv') renderAtivos();
  if(id==='indicadores') renderIndicadores();
}

function renderAll(){
  buildMonths('dash-months',selDash,i=>{selDash=i;renderMes();});
  renderGeral();
  renderMes();
  renderCarteira();
  renderSaidas('Fixo','div-fixas-table');
  renderSaidas('Variável','div-var-table');
  renderPeriodos();
  renderArca();
  renderAtivos();
  renderIndicadores();
  // Trigger resize so Chart.js redraws charts in initially hidden containers
  setTimeout(()=>window.dispatchEvent(new Event('resize')),150);
}

function buildMonths(cid,sel,cb){
  const el=document.getElementById(cid);if(!el)return;
  el.innerHTML=D.meses.map((m,i)=>`<button class="msb${i===sel?' on':''}" onclick='(${cb.toString()})(${i})'>${m}</button>`).join('');
}

/* ═══════════════════════════════
   YEAR HELPERS
═══════════════════════════════ */
function getYears(){
  const yrs=new Set();
  D.meses.forEach(m=>{const p=m.match(/\/(\d+)/);if(p)yrs.add('20'+p[1]);});
  return [...yrs].sort();
}
function getMesesDoAno(yr){
  const suf='/'+yr.slice(2);
  return D.meses.map((m,i)=>({m,i})).filter(({m})=>m.includes(suf));
}
function heroAno(idxs){
  const n=idxs.length;
  const ent=totalE()*n;
  const div=idxs.reduce((s,{i})=>s+totalDiv(i),0);
  const grd=idxs.reduce((s,{i})=>s+totalGrd(i),0);
  const sob=idxs.reduce((s,{i})=>s+sobraM(i),0);
  const mel=idxs.reduce((b,x)=>sobraM(x.i)>sobraM(b.i)?x:b,idxs[0]);
  const pio=idxs.reduce((b,x)=>sobraM(x.i)-sobraM(b.i)<0?x:b,idxs[0]);
  return{n,ent,div,grd,sob,mel,pio};
}
function toggleYr(yr){
  yrCollapsed[yr]=!yrCollapsed[yr];
  renderYearBlocks();
}

/* ═══════════════════════════════
   VISÃO GERAL
═══════════════════════════════ */
function renderGeral(){
  const n=nm();
  const totE=totalE()*n;
  const totD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
  const totG=D.meses.reduce((s,_,i)=>s+totalGrd(i),0);
  const totS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
  const rFinal=reservaAcum(n-1);
  const invFinal=investAcum(n-1);
  const melI=D.meses.reduce((b,_,i)=>sobraM(i)>sobraM(b)?i:b,0);
  const pioI=D.meses.reduce((b,_,i)=>sobraM(i)-sobraM(b)<0?i:b,0);

  const hero=document.getElementById('annual-hero');
  if(hero) hero.innerHTML=`
    <div class="hero-card hg"><div class="hero-lbl">Total entradas</div><div class="hero-val g">${fmtK(totE)}</div><div class="hero-sub">${n} meses × ${fmtK(totalE())}</div></div>
    <div class="hero-card hr"><div class="hero-lbl">Total dívidas</div><div class="hero-val r">${fmtK(totD)}</div><div class="hero-sub">contas e parcelas</div></div>
    <div class="hero-card ht"><div class="hero-lbl">Total guardado</div><div class="hero-val t">${fmtK(totG)}</div><div class="hero-sub">reserva + investimento</div></div>
    <div class="hero-card ${totS>=0?'hg':'hr'}"><div class="hero-lbl">Sobra total</div><div class="hero-val ${totS>=0?'g':'r'}">${fmtK(totS)}</div><div class="hero-sub">ao fim do período</div></div>
    <div class="hero-card ht"><div class="hero-lbl">Reserva final</div><div class="hero-val t">${fmtK(rFinal)}</div><div class="hero-sub">saldo acumulado</div></div>
    <div class="hero-card hp"><div class="hero-lbl">Investido final</div><div class="hero-val p">${fmtK(invFinal)}</div><div class="hero-sub">saldo acumulado</div></div>
    <div class="hero-card hg"><div class="hero-lbl">Melhor mês</div><div class="hero-val g" style="font-size:18px">${D.meses[melI]}</div><div class="hero-sub">sobra: ${fmt(sobraM(melI))}</div></div>
    <div class="hero-card hr"><div class="hero-lbl">Pior mês</div><div class="hero-val r" style="font-size:18px">${D.meses[pioI]}</div><div class="hero-sub">sobra: ${fmt(sobraM(pioI))}</div></div>
  `;

  renderYearBlocks();

  // Ranking
  const rank=document.getElementById('annual-rank');
  if(rank){
    const tots=D.dividas.map(d=>({nome:d.nome,total:d.vals.reduce((s,v)=>s+(v||0),0),cat:d.cat})).filter(d=>d.total>0).sort((a,b)=>b.total-a.total);
    const maxT=tots[0]?.total||1;
    rank.innerHTML=tots.map((d,i)=>{
      const barC=d.cat==='cartao'?'var(--purple)':d.cat==='limite'?'var(--red)':'var(--amber)';
      return `<div class="rank-row"><span class="rank-num">${i+1}</span><span class="rank-name">${d.nome}</span><div class="rank-bar-bg"><div class="rank-bar-fg" style="width:${Math.round((d.total/maxT)*100)}%;background:${barC}"></div></div><span class="rank-val neg">${fmt(d.total)}</span></div>`;
    }).join('');
  }

  // Doughnut
  dc('annualDough');
  const fixT=D.dividas.filter(d=>d.tipo==='Fixo').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  const varT=D.dividas.filter(d=>d.tipo==='Variável').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
  const grdT=D.meses.reduce((s,_,i)=>s+totalGrd(i),0);
  const cAD=document.getElementById('cAnnualDough');
  if(cAD) CH['annualDough']=new Chart(cAD,{type:'doughnut',data:{labels:['Fixo','Variável','Guardado/Inv.'],datasets:[{data:[fixT,varT,grdT],backgroundColor:['#4a9eff','#e8a020','#2dd4bf'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:11},boxWidth:10,padding:10}},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.raw)}}}}});

  // Evolução
  dc('evol');
  const cEv=document.getElementById('cEvol');
  if(cEv) CH['evol']=new Chart(cEv,{type:'line',data:{labels:D.meses,datasets:D.dividas.map((d,idx)=>({label:d.nome,data:d.vals.map(v=>v||0),borderColor:COLORS[idx%COLORS.length],backgroundColor:'transparent',tension:.35,pointRadius:2,borderWidth:1.5}))},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:scO(true)}});

  // Fluxo table
  const ft=document.getElementById('fluxo-table');
  if(ft){
    const yrs=getYears();
    const rows=D.meses.map((m,i)=>{
      const e=totalE(),d=totalDiv(i),g=totalGrd(i),s=sobraM(i);
      const yr=m.match(/\/(\d+)/);const yrN=yr?'20'+yr[1]:'';
      const clr=yrs.indexOf(yrN)===0?'rgba(74,158,255,.3)':'rgba(155,127,244,.3)';
      return `<tr style="border-left:2px solid ${clr}"><td>${m}</td><td class="tr pos">${fmt(e)}</td><td class="tr neg">${fmt(d)}</td><td class="tr grd">${fmt(g)}</td><td class="tr neg">${fmt(d+g)}</td><td class="tr ${s>=0?'pos':'neg'}">${fmt(s)}</td></tr>`;
    }).join('');
    const tD=D.meses.reduce((s,_,i)=>s+totalDiv(i),0);
    const tG=D.meses.reduce((s,_,i)=>s+totalGrd(i),0);
    const tS=D.meses.reduce((s,_,i)=>s+sobraM(i),0);
    ft.innerHTML=`<thead><tr><th>Mês</th><th class="tr">Entradas</th><th class="tr">Dívidas</th><th class="tr" style="color:var(--teal)">Disponível p/ investir</th><th class="tr">Total saídas</th><th class="tr">Sobra</th></tr></thead><tbody>${rows}<tr><td class="bold">Total</td><td></td><td class="tr neg bold">${fmt(tD)}</td><td class="tr grd bold">${fmt(tG)}</td><td class="tr neg bold">${fmt(tD+tG)}</td><td class="tr bold ${tS>=0?'pos':'neg'}">${fmt(tS)}</td></tr></tbody>`;
  }

  // Guard chart
  dc('guardAnual');
  const cGA=document.getElementById('cGuardAnual');
  if(cGA) CH['guardAnual']=new Chart(cGA,{type:'bar',data:{labels:D.meses,datasets:D.guardado.map((g,gi)=>({label:g.nome,data:g.vals.map(v=>v||0),backgroundColor:gi===0?'rgba(45,212,191,.75)':'rgba(155,127,244,.75)',borderRadius:3}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:scO(true)}});

  // Metas
  const prog=document.getElementById('annual-prog');
  if(prog){
    const totG=D.meses.reduce((s,_,i)=>s+totalGrd(i),0);
    prog.innerHTML=D.guardado.map((g,gi)=>{
      const real=g.vals.reduce((s,v)=>s+(v||0),0);
      const pct=totG>0?Math.min(100,Math.round((real/totG)*100)):0;
      const barC=gi===0?'var(--teal)':'var(--purple)';
      const acum=gi===0?reservaAcum(nm()-1):investAcum(nm()-1);
      return `<div class="prog-item"><div class="prog-header"><span class="prog-name">${g.nome}</span><span class="prog-vals">${fmt(real)} aportado · ${fmt(acum)} acumulado</span></div><div class="prog-bar-bg"><div class="prog-bar-fg" style="width:${pct}%;background:${barC}"></div></div></div>`;
    }).join('');
  }

  renderIndicadores();
  const cartEl=document.getElementById('annual-cartoes');
  if(cartEl) renderCartoesTo(cartEl,0);
}

/* ═══════════════════════════════
   YEAR BLOCKS (collapsible)
═══════════════════════════════ */
function renderYearBlocks(){
  const container=document.getElementById('year-blocks');
  if(!container)return;
  const yrs=getYears();
  container.innerHTML='';
  yrs.forEach((yr,yi)=>{
    const meses=getMesesDoAno(yr);
    if(!meses.length)return;
    const h=heroAno(meses);
    const isCollapsed=yrCollapsed[yr]!==false; // default collapsed
    const pill=yi===0?'y26':'y27';
    const acorC=yi===0?'b':'p';
    const chevCls=isCollapsed?'yr-chevron':'yr-chevron open';
    const block=document.createElement('div');
    block.className='yr-block mb';
    block.id='yr-block-'+yr;
    block.innerHTML=`
      <div class="yr-header" onclick="toggleYr('${yr}')">
        <div class="yr-title">
          <span class="yr-pill ${pill}">${yr}</span>
          <span style="color:var(--text2);font-size:13px">${meses.length} meses</span>
        </div>
        <div class="yr-meta">
          <span>Entradas: <strong style="color:var(--green)">${fmtK(h.ent)}</strong></span>
          <span>Dívidas: <strong style="color:var(--red)">${fmtK(h.div)}</strong></span>
          <span>Sobra: <strong style="color:${h.sob>=0?'var(--green)':'var(--red)'}">${fmtK(h.sob)}</strong></span>
        </div>
        <span class="${chevCls}">▾</span>
      </div>
      <div class="yr-body${isCollapsed?' hidden':''}" id="yr-body-${yr}">
        <div class="annual-hero" id="hero-${yr}" style="margin-top:4px"></div>
        <div class="timeline" id="tl-${yr}"></div>
        <div class="grid2 mb">
          <div class="panel"><h3>Entradas vs Dívidas vs Guardado — ${yr}</h3><div style="position:relative;height:190px"><canvas id="cBar${yr}"></canvas></div></div>
          <div class="panel"><h3>Sobra acumulada — ${yr}</h3><div style="position:relative;height:190px"><canvas id="cAcum${yr}"></canvas></div></div>
        </div>
      </div>`;
    container.appendChild(block);

    // Populate hero, timeline, charts
    const heroEl=document.getElementById('hero-'+yr);
    if(heroEl) heroEl.innerHTML=`
      <div class="hero-card ${yi===0?'hb':'hp'}"><div class="hero-lbl">Entradas ${yr}</div><div class="hero-val ${acorC}">${fmtK(h.ent)}</div><div class="hero-sub">${h.n} meses</div></div>
      <div class="hero-card hr"><div class="hero-lbl">Dívidas ${yr}</div><div class="hero-val r">${fmtK(h.div)}</div></div>
      <div class="hero-card ht"><div class="hero-lbl">Guardado ${yr}</div><div class="hero-val t">${fmtK(h.grd)}</div></div>
      <div class="hero-card ${h.sob>=0?'hg':'hr'}"><div class="hero-lbl">Sobra ${yr}</div><div class="hero-val ${h.sob>=0?'g':'r'}">${fmtK(h.sob)}</div></div>
      <div class="hero-card hg"><div class="hero-lbl">Melhor mês</div><div class="hero-val g" style="font-size:16px">${h.mel.m}</div><div class="hero-sub">${fmt(sobraM(h.mel.i))}</div></div>
      <div class="hero-card hr"><div class="hero-lbl">Pior mês</div><div class="hero-val r" style="font-size:16px">${h.pio.m}</div><div class="hero-sub">${fmt(sobraM(h.pio.i))}</div></div>
    `;

    const tlEl=document.getElementById('tl-'+yr);
    if(tlEl) tlEl.innerHTML=meses.map(({m,i})=>{const s=sobraM(i);return `<div class="tl-cell ${s>=0?'tl-pos':'tl-neg'}"><div class="tl-mes">${m}</div><div class="tl-val ${s>=0?'pos':'neg'}">${fmtK(s)}</div></div>`;}).join('');

    const labels=meses.map(x=>x.m);
    const divArr=meses.map(x=>totalDiv(x.i));
    const grdArr=meses.map(x=>totalGrd(x.i));
    const entArr=meses.map(_=>totalE());
    dc('cBar'+yr);
    const cB=document.getElementById('cBar'+yr);
    if(cB) CH['cBar'+yr]=new Chart(cB,{type:'bar',data:{labels,datasets:[{label:'Entradas',data:entArr,backgroundColor:'rgba(34,199,122,.2)',borderColor:'#22c77a',borderWidth:1,borderRadius:3},{label:'Dívidas',data:divArr,backgroundColor:'rgba(224,85,85,.75)',borderRadius:3},{label:'Guardado',data:grdArr,backgroundColor:'rgba(45,212,191,.75)',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:scOL()}});

    let acc=0;
    const acumArr=meses.map(({i})=>{acc+=sobraM(i);return Math.round(acc*100)/100;});
    dc('cAcum'+yr);
    const cA=document.getElementById('cAcum'+yr);
    if(cA) CH['cAcum'+yr]=new Chart(cA,{type:'line',data:{labels,datasets:[{data:acumArr,borderColor:yi===0?'#4a9eff':'#9b7ff4',backgroundColor:yi===0?'rgba(74,158,255,.08)':'rgba(155,127,244,.08)',tension:.4,fill:true,pointRadius:4,pointBackgroundColor:acumArr.map(v=>v>=0?'#22c77a':'#e05555'),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:scOL()}});
  });
}

/* ═══════════════════════════════
   POR MÊS
═══════════════════════════════ */
function renderMes(){
  const i=selDash;
  document.getElementById('dash-sec').textContent='Resumo — '+(D.meses[i]||'');
  const e=totalE(),d=totalDiv(i),g=totalGrd(i),s=sobraM(i);

  document.getElementById('dash-cards-top').innerHTML=`
    <div class="card"><div class="card-lbl">Entradas</div><div class="card-val g">${fmt(e)}</div></div>
    <div class="card"><div class="card-lbl">Sobra prevista</div><div class="card-val ${s>=0?'g':'r'}">${fmt(s)}</div></div>
    <div class="card"><div class="card-lbl">Saldo em conta</div><div class="card-val a">${fmt(D.saldo)}</div></div>
  `;

  document.getElementById('dash-cards-div').innerHTML=`
    <div class="card"><div class="card-lbl">Total dívidas</div><div class="card-val r">${fmt(d)}</div><div class="card-sub">contas e parcelas</div></div>
    ${D.dividas.filter(dv=>dv.vals[i]>0).map(dv=>{
      const lim=getLimite(dv);
      const totAb=dv.vals.reduce((s,v)=>s+(v||0),0);
      const pct=(dv.cat==='cartao'||dv.cat==='limite')&&lim>0?Math.min(100,Math.round((totAb/lim)*100)):null;
      const barC=pct>=80?'var(--red)':pct>=50?'var(--amber)':'var(--green)';
      const bar=pct!==null?`<div class="limit-bar-bg"><div class="limit-bar-fg" style="width:${pct}%;background:${barC}"></div></div><div class="limit-label">${pct}% limite (aberto: ${fmt(totAb)})</div>`:'';
      const catB=dv.cat==='cartao'?'<span class="badge bc">Cartão</span>':dv.cat==='limite'?'<span class="badge bl">Limite</span>':'<span class="badge bs">Sem limite</span>';
      return `<div class="card"><div class="card-lbl">${dv.nome}</div><div class="card-val r" style="font-size:16px">${fmt(dv.vals[i])}</div><div style="display:flex;gap:4px;margin-top:5px;">${catB} <span class="badge ${dv.tipo==='Fixo'?'bf':'bv'}">${dv.tipo}</span></div>${bar}</div>`;
    }).join('')}
  `;

  document.getElementById('dash-cards-guard').innerHTML=`
    <div class="card"><div class="card-lbl">Total guardado</div><div class="card-val t">${fmt(g)}</div><div class="card-sub">este mês</div></div>
    ${D.guardado.map((gd,gi)=>{
      const acum=gi===0?reservaAcum(i):investAcum(i);
      return `<div class="card"><div class="card-lbl">${gd.nome}</div><div class="card-val t" style="font-size:16px">${fmt(gd.vals[i]||0)}</div><div class="card-sub">acumulado: ${fmt(acum)}</div></div>`;
    }).join('')}
  `;

  renderCartoesTo(document.getElementById('dash-cartoes'),i);

  const el=document.getElementById('div-detail-table');
  if(el){
    document.getElementById('div-detail-title').textContent=`Dívidas — ${D.meses[i]||''}`;
    const rows=D.dividas.map(dv=>{
      const v=dv.vals[i]||0;
      const b=dv.tipo==='Fixo'?'<span class="badge bf">Fixo</span>':'<span class="badge bv">Variável</span>';
      const cat=dv.cat==='cartao'?'<span class="badge bc">Cartão</span>':dv.cat==='limite'?'<span class="badge bl">Limite</span>':'<span class="badge bs">Sem limite</span>';
      return `<tr><td>${dv.nome}</td><td>${cat} ${b}</td><td class="tr ${v>0?'neg':''}">${v>0?fmt(v):'—'}</td></tr>`;
    }).join('');
    el.innerHTML=`<thead><tr><th>Dívida</th><th>Categoria</th><th class="tr">Valor</th></tr></thead><tbody>${rows}<tr><td class="bold">Total</td><td></td><td class="tr neg bold">${fmt(d)}</td></tr></tbody>`;
  }
  const el2=document.getElementById('guard-detail-table');
  if(el2){
    document.getElementById('guard-detail-title').textContent=`Guardado — ${D.meses[i]||''}`;
    const rows2=D.guardado.map((gd,gi)=>{const v=gd.vals[i]||0;const acum=gi===0?reservaAcum(i):investAcum(i);return `<tr><td>${gd.nome}</td><td class="tr grd">${v>0?fmt(v):'—'}</td><td class="tr" style="color:var(--text2);font-size:11px">${fmt(acum)}</td></tr>`;}).join('');
    el2.innerHTML=`<thead><tr><th>Destino</th><th class="tr">Este mês</th><th class="tr">Acumulado</th></tr></thead><tbody>${rows2}<tr><td class="bold">Total</td><td class="tr grd bold">${fmt(g)}</td><td></td></tr></tbody>`;
  }

  const n=nm();
  const divA=Array.from({length:n},(_,j)=>totalDiv(j));
  const grdA=Array.from({length:n},(_,j)=>totalGrd(j));
  const varA=Array.from({length:n},(_,j)=>D.dividas.filter(dv=>dv.tipo==='Variável').reduce((s,dv)=>s+(dv.vals[j]||0),0));
  const fixT=D.dividas.filter(dv=>dv.tipo==='Fixo').reduce((s,dv)=>s+(dv.vals[i]||0),0);
  const varT=D.dividas.filter(dv=>dv.tipo==='Variável').reduce((s,dv)=>s+(dv.vals[i]||0),0);
  const grdT=totalGrd(i);

  dc('fluxo');
  const cFl=document.getElementById('cFluxo');
  if(cFl) CH['fluxo']=new Chart(cFl,{type:'bar',data:{labels:D.meses,datasets:[{label:'Dívidas',data:divA,backgroundColor:'rgba(224,85,85,.75)',borderRadius:3},{label:'Guardado',data:grdA,backgroundColor:'rgba(45,212,191,.75)',borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:scO(true)}});

  dc('tipo');
  const cTi=document.getElementById('cTipo');
  if(cTi) CH['tipo']=new Chart(cTi,{type:'doughnut',data:{labels:['Fixo','Variável','Guardado/Inv.'],datasets:[{data:[fixT,varT,grdT],backgroundColor:['#4a9eff','#e8a020','#2dd4bf'],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.raw)}}}}});

  dc('var');
  const cVr=document.getElementById('cVar');
  if(cVr) CH['var']=new Chart(cVr,{type:'line',data:{labels:D.meses,datasets:[{data:varA,borderColor:'#e05555',backgroundColor:'rgba(224,85,85,.08)',tension:.35,fill:true,pointRadius:2,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:scO(true)}});

  dc('guard');
  const cGu=document.getElementById('cGuard');
  if(cGu) CH['guard']=new Chart(cGu,{type:'bar',data:{labels:D.meses,datasets:D.guardado.map((gd,gi)=>({label:gd.nome,data:gd.vals.map(v=>v||0),backgroundColor:gi===0?'rgba(45,212,191,.75)':'rgba(155,127,244,.75)',borderRadius:3}))},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:scO(true)}});
}

/* ═══════════════════════════════
   CARTEIRA
═══════════════════════════════ */
function renderCarteira(){
  const fmap={salario:'ef-salario',outras:'ef-outras',saldo:'ef-saldo'};
  Object.entries(fmap).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.value=D[k]||0;});
  // Auto-compute from ativos
  const _caixaEl=document.getElementById('ef-reserva');if(_caixaEl)_caixaEl.value=caixaAtual().toFixed(2);
  const _invEl=document.getElementById('ef-invest');if(_invEl)_invEl.value=D.ativos.filter(a=>a.bucket!=='C').reduce((s,a)=>s+(a.valor||0),0).toFixed(2);
  const mcEl=document.getElementById('ef-metaCC');if(mcEl)mcEl.value=D.metaCC||2000;

  // Tabela de cartões
  const ct=document.getElementById('cartoes-edit-table');
  if(ct){
    const rows=D.cartoes.map((c,ci)=>`<tr>
      <td><input type="text" value="${c.nome}" onchange="D.cartoes[${ci}].nome=this.value;syncCartaoNomes()" placeholder="Nome do cartão"></td>
      <td><select onchange="D.cartoes[${ci}].bandeira=this.value"><option${c.bandeira==='Mastercard'?' selected':''}>Mastercard</option><option${c.bandeira==='Visa'?' selected':''}>Visa</option><option${c.bandeira==='Elo'?' selected':''}>Elo</option><option${c.bandeira==='Amex'?' selected':''}>Amex</option><option${c.bandeira==='Hipercard'?' selected':''}>Hipercard</option></select></td>
      <td><input type="number" step="1" value="${c.limite||0}" onchange="D.cartoes[${ci}].limite=parseFloat(this.value)||0" placeholder="Limite"></td>
      <td><button class="btn-rm" onclick="removeCartao(${ci})">✕</button></td>
    </tr>`).join('');
    ct.innerHTML=`<thead><tr><th>Nome</th><th>Bandeira</th><th>Limite (R$)</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  // Resumo
  const res=document.getElementById('carteira-resumo');
  if(res){
    const totalLimites=D.cartoes.reduce((s,c)=>s+(c.limite||0),0);
    const totalAberto=D.dividas.filter(d=>d.cat==='cartao'||d.cat==='limite').reduce((s,d)=>s+d.vals.reduce((a,v)=>a+(v||0),0),0);
    const totalGrdAcum=reservaAcum(nm()-1)+investAcum(nm()-1);
    res.innerHTML=`
      <div class="card"><div class="card-lbl">Salário + entradas</div><div class="card-val g">${fmt(totalE())}</div><div class="card-sub">por mês</div></div>
      <div class="card"><div class="card-lbl">Saldo conta corrente</div><div class="card-val a">${fmt(D.saldo)}</div></div>
      <div class="card"><div class="card-lbl">Total limite cartões</div><div class="card-val b">${fmt(totalLimites)}</div><div class="card-sub">${D.cartoes.length} cartões</div></div>
      <div class="card"><div class="card-lbl">Total em aberto cartões</div><div class="card-val r">${fmt(totalAberto)}</div></div>
      <div class="card"><div class="card-lbl">Reserva + Investido</div><div class="card-val t">${fmt(totalGrdAcum)}</div><div class="card-sub">acumulado ao final</div></div>
    `;
  }
}

function syncCartaoNomes(){/* cartoes table already updates D.cartoes[i].nome via onchange */}
function addCartao(){D.cartoes.push({nome:'Novo Cartão',bandeira:'Mastercard',limite:0});renderCarteira();}
function removeCartao(i){if(!confirm(`Remover "${D.cartoes[i].nome}"?`))return;D.cartoes.splice(i,1);renderCarteira();}

/* ═══════════════════════════════
   SAÍDAS
═══════════════════════════════ */
function renderSaidas(tipo,tableId){
  const el=document.getElementById(tableId);if(!el)return;
  const arr=D.dividas.filter(d=>d.tipo===tipo);
  const heads=D.meses.map(m=>`<th>${m}</th>`).join('');
  const catOptions=`
    <option value="sem">Sem limite</option>
    <option value="cartao">Cartão de Crédito</option>
    <option value="limite">Consome Limite</option>`;
  const cartaoOpts=['',  ...D.cartoes.map(c=>c.nome)].map(n=>`<option value="${n}">${n||'— nenhum —'}</option>`).join('');

  const rows=arr.map((d)=>{
    const di=D.dividas.indexOf(d);
    const cells=D.meses.map((_,mi)=>`<td><input type="number" step="0.01" value="${d.vals[mi]||0}" onchange="D.dividas[${di}].vals[${mi}]=parseFloat(this.value)||0"></td>`).join('');
    const catCell=`<td><select class="cat-sel" onchange="D.dividas[${di}].cat=this.value">${catOptions.replace(`value="${d.cat}"`,`value="${d.cat}" selected`)}</select></td>`;
    const cartCell=`<td><select class="cat-sel" onchange="D.dividas[${di}].limCartao=this.value">${['',  ...D.cartoes.map(c=>c.nome)].map(n=>`<option value="${n}"${d.limCartao===n?' selected':''}>${n||'— nenhum —'}</option>`).join('')}</select></td>`;
    return `<tr>
      <td><input type="text" value="${d.nome}" onchange="D.dividas[${di}].nome=this.value" placeholder="Nome"></td>
      ${catCell}${cartCell}${cells}
      <td><button class="btn-rm" onclick="removeDivida(${di})">✕</button></td>
    </tr>`;
  }).join('');
  el.innerHTML=`<thead><tr><th>Nome</th><th>Categoria</th><th>Cartão vinculado</th>${heads}<th></th></tr></thead><tbody>${rows}</tbody>`;
}

function renderPeriodos(){
  const el=document.getElementById('meses-list');if(!el)return;
  el.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:6px;">${D.meses.map((m,i)=>`<span style="background:var(--s2);border:1px solid var(--border2);border-radius:20px;padding:5px 12px;font-size:12px;color:var(--text2)">${i+1}. ${m}</span>`).join('')}</div>`;
}

function addDividaTipo(tipo){D.dividas.push({nome:'Nova conta',tipo,cat:'sem',limCartao:'',vals:Array(nm()).fill(0)});renderSaidas(tipo,tipo==='Fixo'?'div-fixas-table':'div-var-table');}
function removeDivida(i){if(!confirm(`Remover "${D.dividas[i].nome}"?`))return;D.dividas.splice(i,1);renderSaidas('Fixo','div-fixas-table');renderSaidas('Variável','div-var-table');}
function addMes(){const nome=prompt('Abreviação do mês (ex: Jan/27):');if(!nome||!nome.trim())return;D.meses.push(nome.trim());D.dividas.forEach(d=>d.vals.push(0));D.guardado.forEach(d=>d.vals.push(0));renderAll();}
function removeMes(){if(nm()<=1){alert('É necessário ter ao menos 1 mês.');return;}if(!confirm(`Remover "${D.meses[nm()-1]}"?`))return;D.meses.pop();D.dividas.forEach(d=>d.vals.pop());D.guardado.forEach(d=>d.vals.pop());if(selDash>=nm())selDash=nm()-1;renderAll();}

/* ═══════════════════════════════
   INDICADORES
═══════════════════════════════ */
function renderIndicadores(){
  const fmap={cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fmap).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.value=D[k]||0;});
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.value=D.arcaMeta[k]||0;});

  const el=document.getElementById('ind-cards');
  if(el) el.innerHTML=`
    <div class="card"><div class="card-lbl">CDI acumulado 12m</div><div class="card-val g">${fmtP(D.cdi12)}</div></div>
    <div class="card"><div class="card-lbl">CDI mês referência</div><div class="card-val">${fmtP(D.cdifev)}</div></div>
    <div class="card"><div class="card-lbl">CDI acum. 2026</div><div class="card-val">${fmtP(D.cdi26)}</div></div>
    <div class="card"><div class="card-lbl">IPCA acumulado 12m</div><div class="card-val a">${fmtP(D.ipca12)}</div></div>
    <div class="card"><div class="card-lbl">IPCA mês referência</div><div class="card-val">${fmtP(D.ipcafev)}</div></div>
    <div class="card"><div class="card-lbl">IPCA acum. 2026</div><div class="card-val">${fmtP(D.ipca26)}</div></div>
  `;
  const pOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'}}}};
  dc('cdi');const cCdi=document.getElementById('cCdi');
  if(cCdi) CH['cdi']=new Chart(cCdi,{type:'bar',data:{labels:['12m','Mês ref.','Acum.'],datasets:[{data:[D.cdi12,D.cdifev,D.cdi26],backgroundColor:['rgba(34,199,122,.8)','rgba(74,158,255,.8)','rgba(155,127,244,.8)'],borderRadius:6}]},options:pOpts});
  dc('ipca');const cIpca=document.getElementById('cIpca');
  if(cIpca) CH['ipca']=new Chart(cIpca,{type:'bar',data:{labels:['12m','Mês ref.','Acum.'],datasets:[{data:[D.ipca12,D.ipcafev,D.ipca26],backgroundColor:['rgba(240,160,32,.8)','rgba(224,85,85,.8)','rgba(155,127,244,.8)'],borderRadius:6}]},options:pOpts});

  // Comparativo CDI vs IPCA
  dc('indComp');const cIC=document.getElementById('cIndComp');
  if(cIC) CH['indComp']=new Chart(cIC,{type:'bar',data:{labels:['12 meses','Mês ref.','Acum. 2026'],datasets:[{label:'CDI',data:[D.cdi12,D.cdifev,D.cdi26],backgroundColor:'rgba(34,199,122,.8)',borderRadius:4},{label:'IPCA',data:[D.ipca12,D.ipcafev,D.ipca26],backgroundColor:'rgba(240,160,32,.8)',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>v+'%'}}}}});
}

/* ═══════════════════════════════
   ARCA
═══════════════════════════════ */
function renderArca(){
  const buckets=['A','R','C','A2'];
  const totAtivos=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
  const bloqueado=arcaBloqueado();
  const custoFixo=custoFixoMensal();
  const caixaAtu=caixaAtual();
  const metaEmerg=metaEmergencia();

  // ALERTA EMERGÊNCIA
  const alertEl=document.getElementById('arca-alert');
  if(alertEl){
    if(bloqueado){
      const pct=metaEmerg>0?Math.min(100,Math.round((caixaAtu/metaEmerg)*100)):0;
      alertEl.style.display='';
      alertEl.innerHTML=`<div style="display:flex;align-items:flex-start;gap:12px;"><span style="font-size:24px">⚠️</span><div>
        <div style="font-weight:600;font-size:14px;color:var(--amber);margin-bottom:4px">Reserva de emergência insuficiente</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.6">
          Custo fixo mensal: <strong style="color:var(--text)">${fmt(custoFixo)}</strong> · Meta 6 meses: <strong style="color:var(--text)">${fmt(metaEmerg)}</strong><br>
          Caixa atual: <strong style="color:var(--teal)">${fmt(caixaAtu)}</strong> (${pct}% da meta)<br>
          <strong style="color:var(--amber)">Recomendação: invista 100% em C — Caixa até atingir a meta.</strong>
        </div>
        <div style="margin-top:8px;"><div style="height:6px;background:var(--s3);border-radius:3px;overflow:hidden;max-width:300px"><div style="height:6px;background:var(--amber);border-radius:3px;width:${pct}%"></div></div>
        <div style="font-size:10px;color:var(--text3);margin-top:3px">${fmt(caixaAtu)} de ${fmt(metaEmerg)} (${pct}%)</div></div>
      </div></div>`;
    } else { alertEl.style.display='none'; }
  }

  const cards=document.getElementById('arca-cards');
  if(cards) cards.innerHTML=buckets.map(b=>{
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pctAtual=totAtivos>0?Math.round((valB/totAtivos)*100):0;
    const meta=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    const diff=pctAtual-meta;
    const diffStr=diff===0?'na meta':diff>0?`+${diff}% acima`:`${diff}% abaixo`;
    const diffC=diff===0?'var(--green)':diff>0?'var(--amber)':'var(--red)';
    return `<div class="arca-card arca-${b}">
      <div class="arca-lbl">${ARCA_NAMES[b]}</div>
      <div class="arca-desc">${ARCA_DESC[b]}</div>
      <div class="arca-val">${fmt(valB)}</div>
      <div class="arca-meta">${pctAtual}% da carteira${bloqueado&&b!=='C'?' · aguardando emergência':''} (meta: ${meta}%)</div>
      <div style="margin-top:6px;font-size:10px;color:${diffC}">${diffStr}</div>
    </div>`;
  }).join('');

  dc('arcaDough');
  const cAD2=document.getElementById('cArcaDough');
  if(cAD2){
    const vals=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    CH['arcaDough']=new Chart(cAD2,{type:'doughnut',data:{labels:buckets.map(b=>ARCA_NAMES[b]),datasets:[{data:vals,backgroundColor:buckets.map(b=>ARCA_COLORS[b]),borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:11},boxWidth:10,padding:10}},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.raw)+` (${totAtivos>0?Math.round((ctx.raw/totAtivos)*100):0}%)`}}}}});
  }

  const mc=document.getElementById('arca-meta-config');
  if(mc) mc.innerHTML=buckets.map(b=>{
    const meta=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);
    const valB=D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0);
    const pct=totAtivos>0?Math.round((valB/totAtivos)*100):0;
    const barC=ARCA_COLORS[b];
    return `<div class="prog-item"><div class="prog-header"><span class="prog-name" style="color:${barC}">${ARCA_NAMES[b]}</span><span class="prog-vals">Atual: ${pct}% · Meta: ${meta}%</span></div><div class="prog-bar-bg"><div class="prog-bar-fg" style="width:${pct}%;background:${barC}"></div></div></div>`;
  }).join('');

  dc('arcaBar');
  const cAB2=document.getElementById('cArcaBar');
  if(cAB2){
    const byBucketVal=buckets.map(b=>D.ativos.filter(a=>a.bucket===b).reduce((s,a)=>s+(a.valor||0),0));
    const metasVal=buckets.map(b=>{const m=bloqueado?(b==='C'?100:0):(D.arcaMeta[b==='A2'?'a2':b.toLowerCase()]||0);return totAtivos*(m/100);});
    CH['arcaBar']=new Chart(cAB2,{type:'bar',data:{labels:buckets.map(b=>ARCA_NAMES[b]),datasets:[{label:'Atual (R$)',data:byBucketVal,backgroundColor:buckets.map(b=>ARCA_COLORS[b]+'cc'),borderRadius:4},{label:'Meta (R$)',data:metasVal,backgroundColor:'rgba(255,255,255,.08)',borderColor:'rgba(255,255,255,.25)',borderWidth:1,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}}}});
  }
}

/* ═══════════════════════════════
   HELPERS DE PROJEÇÃO
═══════════════════════════════ */
function taxaAnual(a){
  const base = a.indice==='CDI'   ? (D.cdi12||14.80) :
               a.indice==='SELIC' ? (D.cdi12||14.80) :
               (D.ipca12||4.14);
  return (base * (a.pct||100) / 100) / 100;
}
function projetar(valor, taxa, anos){ return valor * Math.pow(1+taxa, anos); }

// Calcula o disponível para investir em um mês i conforme as regras de negócio
function calcSaldoInvestir(mi){
  const entrada = totalE();
  const contas  = D.dividas.reduce((s,d)=>s+(d.vals[mi]||0), 0);
  const metaCC  = D.metaCC||2000;
  const sobra   = entrada - contas;
  if(sobra <= 0) return {entrada,contas,metaCC,saldo:0,sobra,regra:'negativo'};
  if(sobra <= metaCC){
    // sobra cobre menos que a meta CC → investir o que sobra além da meta
    const saldo = Math.max(0, sobra - metaCC);
    return {entrada,contas,metaCC,saldo,sobra,regra:'menor_meta'};
  } else {
    // sobra > metaCC → investe 50% da sobra (a outra metade fica em CC)
    const saldo = sobra * 0.50;
    return {entrada,contas,metaCC,saldo,sobra,regra:'maior_meta'};
  }
}

// Regra ARCA: só distribui após 6 meses de custo fixo em Caixa
function custoFixoMensal(){
  return D.dividas.filter(d=>d.tipo==='Fixo').reduce((s,d)=>s+(d.vals[0]||0),0);
}
function caixaAtual(){
  return D.ativos.filter(a=>a.bucket==='C').reduce((s,a)=>s+(a.valor||0),0);
}
function metaEmergencia(){
  return custoFixoMensal() * 6;
}
function arcaBloqueado(){
  return caixaAtual() - metaEmergencia() < 0;
}

/* ═══════════════════════════════
   ATIVOS
═══════════════════════════════ */
function renderAtivos(){
  // ── SALDO MÊS A MÊS ──
  const sc = document.getElementById('inv-saldo-cards');
  if(sc){
    const ref = calcSaldoInvestir(0); // mês 1 para os cards principais
    const regraDesc = ref.regra==='negativo'   ? 'contas > entradas — sem saldo para investir'
                    : ref.regra==='menor_meta' ? `sobra (${fmt(ref.sobra)}) ≤ meta CC — sobra investida: sobra − meta CC`
                    : `sobra (${fmt(ref.sobra)}) > meta CC — regra: 50% da sobra vai para investimentos`;
    sc.innerHTML=`
      <div class="card"><div class="card-lbl">Entradas mensais</div><div class="card-val g">${fmt(ref.entrada)}</div></div>
      <div class="card"><div class="card-lbl">Total contas (mês 1)</div><div class="card-val r">${fmt(ref.contas)}</div></div>
      <div class="card"><div class="card-lbl">Meta conta corrente</div><div class="card-val a">${fmt(ref.metaCC)}</div><div class="card-sub">sempre manter em CC</div></div>
      <div class="card" style="background:var(--green-bg);border-color:rgba(34,199,122,.3)"><div class="card-lbl" style="color:var(--green)">💰 Disponível para investir</div><div class="card-val g">${fmt(ref.saldo)}</div><div class="card-sub">${regraDesc}</div></div>
      <div class="card"><div class="card-lbl">Total carteira atual</div><div class="card-val t">${fmt(D.ativos.reduce((s,a)=>s+(a.valor||0),0))}</div></div>
    `;
  }

  // ── TABELA MÊS A MÊS ──
  const mesEl = document.getElementById('inv-mes-table');
  if(mesEl){
    const rows = D.meses.map((m,i)=>{
      const r = calcSaldoInvestir(i);
      const cor = r.saldo>0?'pos':'neg';
      const regraIcon = r.regra==='negativo'?'🔴':r.regra==='menor_meta'?'🟡':'🟢';
      return `<tr>
        <td>${m}</td>
        <td class="tr pos">${fmt(r.entrada)}</td>
        <td class="tr neg">${fmt(r.contas)}</td>
        <td class="tr">${fmt(r.sobra)}</td>
        <td class="tr"><span title="${
          r.regra==='negativo'   ?'Contas maiores que entradas':
          r.regra==='menor_meta' ?'Sobra ≤ meta CC: sobra − meta CC':
          'Sobra > meta CC: 50% da sobra'}">${regraIcon}</span></td>
        <td class="tr ${cor}" style="font-weight:600">${fmt(r.saldo)}</td>
      </tr>`;
    }).join('');
    const totSaldo = D.meses.reduce((s,_,i)=>s+calcSaldoInvestir(i).saldo,0);
    mesEl.innerHTML=`<thead><tr>
      <th>Mês</th><th class="tr">Entradas</th><th class="tr">Contas</th><th class="tr">Sobra</th><th class="tr">Regra</th><th class="tr" style="color:var(--green)">💰 Para investir</th>
    </tr></thead><tbody>${rows}<tr><td class="bold">Total</td><td></td><td></td><td></td><td></td><td class="tr bold pos">${fmt(totSaldo)}</td></tr></tbody>`;
  }

  // ── TABELA DE ATIVOS ──
  const el=document.getElementById('ativos-table');
  if(el){
    const classes=['Renda Fixa','Renda Variável','FII','Ações','ETF','Cripto','Previdência','Outro'];
    const buckets=['A','R','C','A2'];
    const arcaLabel={'A':'A — Ações Bras.','R':'R — Real Estate','C':'C — Caixa','A2':'A — Ativos Inter.'};
    const indices=['CDI','SELIC','IPCA'];
    const rows=D.ativos.map((a,ai)=>`<tr>
      <td><input type="text" class="inv-edit" value="${a.nome}" onchange="D.ativos[${ai}].nome=this.value" placeholder="Nome do ativo"></td>
      <td><select class="inv-edit" onchange="D.ativos[${ai}].classe=this.value">${classes.map(c=>`<option${a.classe===c?' selected':''}>${c}</option>`).join('')}</select></td>
      <td><select class="inv-edit" onchange="D.ativos[${ai}].bucket=this.value">${buckets.map(b=>`<option value="${b}"${a.bucket===b?' selected':''}>${arcaLabel[b]}</option>`).join('')}</select></td>
      <td><input type="number" class="inv-edit" step="0.01" value="${a.valor||0}" onchange="D.ativos[${ai}].valor=parseFloat(this.value)||0;renderAtivos()" style="width:100px" placeholder="Valor atual"></td>
      <td><select class="inv-edit" style="width:80px" onchange="D.ativos[${ai}].indice=this.value;renderAtivos()">${indices.map(ind=>`<option${a.indice===ind?' selected':''}>${ind}</option>`).join('')}</select></td>
      <td><input type="number" class="inv-edit" step="0.1" value="${a.pct||100}" onchange="D.ativos[${ai}].pct=parseFloat(this.value)||100;renderAtivos()" style="width:70px" placeholder="%"></td>
      <td style="font-size:11px;color:var(--text2);white-space:nowrap">${fmtP(taxaAnual(a)*100)}/ano</td>
      <td><input type="text" class="inv-edit" value="${a.obs||''}" onchange="D.ativos[${ai}].obs=this.value" placeholder="Obs."></td>
      <td><button class="btn-rm" onclick="removeAtivo(${ai})">✕</button></td>
    </tr>`).join('');
    el.innerHTML=`<thead><tr><th>Ativo</th><th>Classe</th><th>Bucket ARCA</th><th>Valor atual (R$)</th><th>Índice</th><th>% do índice</th><th>Taxa efetiva</th><th>Obs.</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  // ── RESUMO POR CLASSE ──
  const res=document.getElementById('ativos-resumo');
  if(res){
    const total=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
    const byClasse={};
    D.ativos.forEach(a=>{if(!byClasse[a.classe])byClasse[a.classe]=0;byClasse[a.classe]+=(a.valor||0);});
    // ARCA breakdown
    const arcaLabel={'A':'A — Ações','R':'R — Real Estate','C':'C — Caixa','A2':'A — Internacionais'};
    const byBucket={};
    D.ativos.forEach(a=>{if(!byBucket[a.bucket])byBucket[a.bucket]=0;byBucket[a.bucket]+=(a.valor||0);});
    res.innerHTML=`
      <div class="card"><div class="card-lbl">Total carteira</div><div class="card-val t">${fmt(total)}</div></div>
      ${['A','R','C','A2'].map(b=>{const v=byBucket[b]||0;return v>0?`<div class="card"><div class="card-lbl">${arcaLabel[b]}</div><div class="card-val" style="font-size:16px">${fmt(v)}</div><div class="card-sub">${total>0?Math.round((v/total)*100):0}% da carteira</div></div>`:''}).join('')}
      ${Object.entries(byClasse).filter(([,v])=>v>0).map(([k,v])=>`<div class="card"><div class="card-lbl">${k}</div><div class="card-val" style="font-size:16px;color:var(--text2)">${fmt(v)}</div><div class="card-sub">${total>0?Math.round((v/total)*100):0}%</div></div>`).join('')}
    `;
  }

  // ── TABELA DE PROJEÇÕES ──
  const proj=document.getElementById('proj-table');
  if(proj){
    const ANOS=[1,2,3,5,10,20,30];
    const atTotal=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
    const taxaMedia=atTotal>0?D.ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTotal:0;
    const headerCols=ANOS.map(a=>`<th class="tr">${a} ano${a>1?'s':''}</th>`).join('');
    const rows2=[...D.ativos.filter(a=>(a.valor||0)>0),
      {nome:'<strong>Total carteira</strong>',valor:atTotal,_taxa:taxaMedia,_isTotal:true}
    ].map(a=>{
      const taxa=a._taxa!==undefined?a._taxa:taxaAnual(a);
      const cols=ANOS.map(anos=>{
        const v=projetar(a.valor||0,taxa,anos);
        const ganho=v-(a.valor||0);
        return `<td class="tr"><div class="proj-highlight">${fmtK(v)}</div><div style="font-size:10px;color:var(--green)">+${fmtK(ganho)}</div></td>`;
      }).join('');
      const tag=a._isTotal?'<strong>':'';const endTag=a._isTotal?'</strong>':'';
      const indStr=a._isTotal?`taxa média ponderada: ${fmtP(taxa*100)}`:`${a.indice||'CDI'} ${a.pct||100}% = ${fmtP(taxa*100)}/ano`;
      return `<tr><td>${tag}${a.nome}${endTag}<div style="font-size:10px;color:var(--text3)">${indStr}</div></td><td class="tr">${fmtK(a.valor||0)}</td>${cols}</tr>`;
    }).join('');
    proj.innerHTML=`<thead><tr><th>Ativo</th><th class="tr">Valor atual</th>${headerCols}</tr></thead><tbody>${rows2}</tbody>`;
  }

  // ── GRÁFICO DE PROJEÇÃO ──
  dc('projLine');
  const cPL=document.getElementById('cProjLine');
  if(cPL){
    const ANOS_CHART=[0,1,2,3,5,10,20,30];
    const datasets=D.ativos.filter(a=>(a.valor||0)>0).map((a,idx)=>({
      label:a.nome,
      data:ANOS_CHART.map(anos=>Math.round(projetar(a.valor||0,taxaAnual(a),anos))),
      borderColor:COLORS[idx%COLORS.length],backgroundColor:'transparent',tension:.4,pointRadius:3,borderWidth:2
    }));
    const atTotal2=D.ativos.reduce((s,a)=>s+(a.valor||0),0);
    const taxaMedia2=atTotal2>0?D.ativos.reduce((s,a)=>s+taxaAnual(a)*(a.valor||0),0)/atTotal2:0;
    datasets.push({label:'Total',data:ANOS_CHART.map(anos=>Math.round(projetar(atTotal2,taxaMedia2,anos))),borderColor:'#22c77a',backgroundColor:'rgba(34,199,122,.08)',tension:.4,pointRadius:4,borderWidth:3,fill:true});
    CH['projLine']=new Chart(cPL,{type:'line',data:{labels:ANOS_CHART.map(a=>a===0?'Hoje':`${a}a`),datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{color:tc(),font:{size:10},boxWidth:10,padding:8}}},scales:{x:{grid:{color:gc()},ticks:{color:tc()}},y:{grid:{color:gc()},ticks:{color:tc(),callback:v=>fmtK(v)}}}}});
  }
}
function addAtivo(){D.ativos.push({nome:'Novo ativo',classe:'Renda Fixa',bucket:'C',valor:0,indice:'CDI',pct:100,obs:''});renderAtivos();}
function removeAtivo(i){if(!confirm(`Remover "${D.ativos[i].nome}"?`))return;D.ativos.splice(i,1);renderAtivos();}

/* ═══════════════════════════════
   CARTÕES (render)
═══════════════════════════════ */
function renderCartoesTo(el,i){
  if(!el)return;
  const cartoes=D.dividas.filter(d=>d.cat==='cartao'||d.cat==='limite');
  if(!cartoes.length){el.innerHTML='<p style="font-size:12px;color:var(--text3);padding:4px 0">Nenhum cartão cadastrado. Cadastre na aba <strong>Carteira</strong>.</p>';return;}
  el.innerHTML=cartoes.map(d=>{
    const lim=getLimite(d);
    const totalAberto=d.vals.reduce((s,v)=>s+(v||0),0);
    const faturaAtual=d.vals[i]||0;
    const livre=lim>0?Math.max(0,lim-totalAberto):null;
    const pct=lim>0?Math.min(100,Math.round((totalAberto/lim)*100)):null;
    const barC=pct===null?'var(--text3)':pct>=80?'var(--red)':pct>=50?'var(--amber)':'var(--green)';
    const cls=pct!==null&&pct>=80?' alerta':pct!==null&&pct>=50?' aviso':'';
    const parcelas=D.meses.map((m,mi)=>({m,v:d.vals[mi]||0})).filter(x=>x.v>0);
    const catB=d.cat==='cartao'?'<span class="badge bc">Cartão</span>':'<span class="badge bl">Consome Limite</span>';
    const limRow=lim>0
      ?`<div class="cartao-vals"><span class="usado">Aberto: ${fmt(totalAberto)}</span><span class="livre">Livre: ${fmt(livre)}</span></div>
         <div class="limit-bar-bg"><div class="limit-bar-fg" style="width:${pct}%;background:${barC}"></div></div>
         <div class="limit-label">Limite: ${fmt(lim)} — ${pct}% comprometido · Fatura ${D.meses[i]||''}: ${faturaAtual>0?fmt(faturaAtual):'—'}</div>`
      :`<div class="cartao-vals"><span class="usado">Aberto: ${fmt(totalAberto)}</span><span style="color:var(--text3)">Sem limite</span></div>`;
    return `<div class="cartao-card${cls}"><div class="cartao-nome">${catB} ${d.nome}</div>${limRow}<div class="parcelas-wrap">${parcelas.map(x=>`<span class="parcela-chip">${x.m}: ${fmtK(x.v)}</span>`).join('')}</div></div>`;
  }).join('');
}

/* ═══════════════════════════════
   SAVE / RESET
═══════════════════════════════ */
function collectFormFields(){
  const fmap={salario:'ef-salario',outras:'ef-outras',saldo:'ef-saldo',cdi12:'ef-cdi12',cdifev:'ef-cdifev',cdi26:'ef-cdi26',ipca12:'ef-ipca12',ipcafev:'ef-ipcafev',ipca26:'ef-ipca26'};
  Object.entries(fmap).forEach(([k,id])=>{const el=document.getElementById(id);if(el)D[k]=parseFloat(el.value)||0;});
  const mcEl=document.getElementById('ef-metaCC');if(mcEl)D.metaCC=parseFloat(mcEl.value)||2000;
  const arcaF={'ef-arca-a':'a','ef-arca-r':'r','ef-arca-c':'c','ef-arca-a2':'a2'};
  Object.entries(arcaF).forEach(([id,k])=>{const el=document.getElementById(id);if(el)D.arcaMeta[k]=parseFloat(el.value)||0;});
}
function saveData(){
  // Firebase module wires btn-salvar directly - this is a fallback
  collectFormFields();
  renderAll();
}
function resetData(){
  if(!confirm('Apagar todos os dados e voltar ao padrão?'))return;
  if(typeof window.clearFirebaseData === 'function') window.clearFirebaseData();
  D=JSON.parse(JSON.stringify(DEFAULT));
  selDash=0;yrCollapsed={};
  renderAll();
}
// renderAll() is called by Firebase after authentication and data load
