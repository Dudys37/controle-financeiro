/* ═══════════════════════════════════════════════════════════════
 * reports.js — Central de Relatórios do FinançasPRO (Fase 19 / modularização)
 * Script CLÁSSICO (sem ESM/build). Carregado na ordem:
 *   utils.js → constants.js → reports.js → app.js
 * Declarações top-level são globais e compartilham o escopo com app.js.
 * Estas funções rodam SEMPRE em runtime (acionadas pelo usuário), então podem
 * referenciar helpers/resumos que permanecem em app.js (ex.: *ResumoData,
 * relDocTrabalho/Carreira/Patrimonio, relSecB3OF), resolvidos na chamada.
 * Segurança: todo texto livre via escapeHTML/attr; CSV protegido contra fórmula
 * (_csvCell prefixa células iniciadas por = + - @).
 * ═══════════════════════════════════════════════════════════════ */

const _REL_TIPOS = [
  {id:'mensal',   label:'Financeiro Mensal',   icon:'📅'},
  {id:'anual',    label:'Financeiro Anual',    icon:'📈'},
  {id:'metas',    label:'Metas',               icon:'🎯'},
  {id:'decisoes', label:'Decisões',            icon:'🧭'},
  {id:'compras',  label:'Compras & Desejos',   icon:'🛒'},
  {id:'trabalho', label:'Trabalho & Projetos',  icon:'💼'},
  {id:'carreira', label:'Carreira',            icon:'🚀'},
  {id:'patrimonio',label:'Patrimônio',          icon:'📦'},
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
    ${(()=>{ try{ const tr=trabalhoResumoData(); return `<div>💼 <strong>Trabalho:</strong> ${tr.projetosAtivos} projeto(s) ativo(s), ${tr.tarefasPendentes} tarefa(s) pendente(s)${tr.tarefasAtrasadas?`, ${tr.tarefasAtrasadas} atrasada(s)`:''}${tr.proximaEntrega?`. Próxima entrega: ${tr.proximaEntrega.dias===0?'hoje':'em '+tr.proximaEntrega.dias+'d'}`:''}.</div>`; }catch(e){ return ''; } })()}
    ${(()=>{ try{ const cr=carreiraResumoData(); return `<div>🚀 <strong>Carreira:</strong> ${cr.objetivosAtivos} objetivo(s) ativo(s)${cr.maiorGap?`, maior gap: ${escapeHTML(cr.maiorGap.skill.nome||'')} (${cr.maiorGap.gap})`:''}${cr.cursosAndamento?`, ${cr.cursosAndamento} curso(s) em andamento`:''}${cr.contatosARetomar?`, ${cr.contatosARetomar} contato(s) a retomar`:''}.</div>`; }catch(e){ return ''; } })()}
    ${(()=>{ try{ const pr=patrimonioResumoData(); return `<div>📦 <strong>Patrimônio:</strong> líquido ${fmt(pr.liquido)} (bruto ${fmt(pr.bruto)}${pr.passivosTotal>0?`, dívidas ${fmt(pr.passivosTotal)}`:''})${pr.garantiasVencendo?`, ${pr.garantiasVencendo} garantia(s) vencendo`:''}${pr.segurosVencendo?`, ${pr.segurosVencendo} seguro(s) vencendo`:''}.</div>`; }catch(e){ return ''; } })()}
  </div>`);

  const alertas=insights.length?_relSection('Alertas importantes',
    `<div style="display:grid;gap:6px;font-size:12px">${insights.map(a=>`<div>${escapeHTML(a.icon||'•')} <strong>${escapeHTML(a.titulo||a.title||'')}</strong> — ${escapeHTML(a.desc||a.msg||'')}</div>`).join('')}</div>`):'';

  const passos=[];
  if((reserva.pct||0)<100) passos.push(`Completar a reserva (faltam ${fmt(reserva.falta||0)}).`);
  if(cp.pendente>0) passos.push(`Quitar ${fmt(cp.pendente)} de contas pendentes no mês.`);
  if(sobra>0&&investir>0) passos.push(`Direcionar ${fmt(investir)} para investimento.`);
  if(dr.prazoProx&&dr.prazoProx.dec) passos.push(`Decidir "${escapeHTML(dr.prazoProx.dec.titulo||'')}" (prazo em ${dr.prazoProx.dias}d).`);
  metasAtivas.filter(x=>x.m.proximosPassos).slice(0,2).forEach(x=>passos.push(`Meta "${escapeHTML(x.m.nome||'')}": ${escapeHTML(x.m.proximosPassos)}`));
  try{ const tr=trabalhoResumoData(); if(tr.tarefasAtrasadas>0) passos.push(`Resolver ${tr.tarefasAtrasadas} tarefa(s) de trabalho atrasada(s).`); else if(tr.proximaEntrega) passos.push(`Preparar entrega "${escapeHTML(tr.proximaEntrega.nome||'')}" (${tr.proximaEntrega.dias===0?'hoje':'em '+tr.proximaEntrega.dias+'d'}).`); }catch(e){}
  try{ if(typeof carreiraProximosPassos==='function'){ carreiraProximosPassos().slice(0,2).forEach(p=>passos.push(p)); } }catch(e){}
  if(!passos.length) passos.push('Tudo em dia. Considere registrar um novo objetivo ou revisar suas metas.');
  const passosSec=_relSection('Próximos passos recomendados',
    `<div style="display:grid;gap:6px;font-size:12px">${passos.slice(0,6).map(p=>`<div>→ ${p}</div>`).join('')}</div>`);

  const riscos=[];
  if((reserva.pct||0)<50) riscos.push('Reserva de emergência abaixo de 50% da meta.');
  if(sobra<0) riscos.push('Mês fechando no negativo.');
  if(dr.criticas>0) riscos.push(`${dr.criticas} decisão(ões) crítica(s) pendente(s).`);
  try{ const tr=trabalhoResumoData(); if(tr.tarefasAtrasadas>0) riscos.push(`${tr.tarefasAtrasadas} tarefa(s) de trabalho atrasada(s).`); if(tr.projetosCriticos>0) riscos.push(`${tr.projetosCriticos} projeto(s) de trabalho em risco/críticos.`); }catch(e){}
  const riscosSec=riscos.length?_relSection('Riscos do momento',
    `<div style="display:grid;gap:5px;font-size:12px;color:var(--text2)">${riscos.map(r=>`<div>⚠️ ${escapeHTML(r)}</div>`).join('')}</div>`):'';

  const oport=[];
  if(investir>0) oport.push(`${fmt(investir)} disponíveis para investir este mês.`);
  if((reserva.pct||0)>=100) oport.push('Reserva completa — você pode assumir metas mais ambiciosas.');
  const oportSec=oport.length?_relSection('Oportunidades',
    `<div style="display:grid;gap:5px;font-size:12px;color:var(--text2)">${oport.map(o=>`<div>💡 ${escapeHTML(o)}</div>`).join('')}</div>`):'';

  return _relDoc('Relatório Geral da Vida', D.meses[mi]||'', _relSection('Como está sua vida agora',kpis)+areas+alertas+passosSec+riscosSec+oportSec+(typeof relSecB3OF==='function'?relSecB3OF():''));
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
    else if(_relTipo==='trabalho'){ html=relDocTrabalho(); }
    else if(_relTipo==='carreira'){ html=relDocCarreira(); }
    else if(_relTipo==='patrimonio'){ html=relDocPatrimonio(); }
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
