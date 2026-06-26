// Smoke test Fase 12 — carrega utils.js + app.js na ordem real (scripts clássicos
// compartilham escopo global) e valida helpers extraídos + integração com app.js.
const fs=require('fs'), vm=require('vm'), path=require('path');
const root=__dirname;
let src='var uiConfirm=function(){return Promise.resolve(true);};var toast=function(){};var scheduleAutoSave=function(){};var go=function(){};var renderAll=function(){};\n';
src+=fs.readFileSync(path.join(root,'utils.js'),'utf8')+'\n';
src+=fs.readFileSync(path.join(root,'app.js'),'utf8');
const store={};
src+=`
;globalThis.__run=(async()=>{
  const out=[]; const ok=(n,v)=>out.push((v?'✓':'✗')+' ['+n+'] '+(v?'':'FALHOU'));
  try{
    // 1) helpers de sanitização (utils.js)
    ok('escapeHTML', escapeHTML('<b>"x"</b>')==='&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
    ok('attr', attr('a&b')==='a&amp;b');
    ok('_safeUrl', _safeUrl('https://a.com')==='https://a.com' && _safeUrl('javascript:alert(1)')==='');
    // 2) formatação
    ok('fmt', typeof fmt==='function' && /R\\$/.test(fmt(10)) && fmt===R);
    ok('genId', genId('x_').startsWith('x_') && genId('x_')!==genId('x_'));
    // 3) datas/CSV puros
    ok('_isPast', _isPast('2020-01-01')===true && _isPast('2099-01-01')===false);
    ok('_diasAte', _diasAte('2099-01-01')>0);
    ok('_normalizeBRNumber', _normalizeBRNumber('1.234,56')===1234.56 && _normalizeBRNumber('(50,00)')===-50);
    ok('_parseDataImport', _parseDataImport('15/07/2026')==='2026-07-15');
    ok('_detectDelimiter', _detectDelimiter('a;b\\n1;2')===';');
    ok('_gcalDate', _gcalDate('2026-07-15')==='20260715');
    // 4) camada de compatibilidade window
    ok('window-export', ['escapeHTML','attr','_safeUrl','fmt','genId','_isPast','_normalizeBRNumber'].every(k=>typeof globalThis[k]==='function'));
    // 5) app.js ainda usa os helpers de utils.js (integração)
    const L=googleCalendarLink({title:'x',startDate:'2026-07-15'}); // usa _gcalDate/_gcalPlus1
    ok('googleCalendarLink', /action=TEMPLATE/.test(L) && /dates=20260715/.test(L));
    // 6) migrateData (novo usuário) com todos os módulos
    D=migrateData(null);
    ok('migrateData', !!D.patrimonio && !!D.carreira && !!D.trabalho && !!D.integracoes && Array.isArray(D.decisoes));
    // 7) funções de módulos que dependem dos helpers extraídos continuam definidas
    ok('render-fns', ['renderTrabalho','renderCarreira','renderPatrimonio','renderIntegracoes','renderDecisoes','renderGeralDash'].every(f=>typeof globalThis[f]==='function' || eval('typeof '+f)==='function'));
    // 8) patLiquido (patrimônio) usa nada de utils removido — sanity
    addBem(); const b=D.patrimonio.bens[0]; setBemField(b.id,'valorAtual',1000);
    ok('patLiquido', patLiquido().bruto===1000);
    // 9) XSS render usando escapeHTML de utils.js
    setBemField(b.id,'nome','<img src=x onerror=alert(1)>'); setPatAba('bens'); renderPatrimonio();
    const body=document.getElementById('patrimonio-body').innerHTML;
    ok('xss-render', !/<img src=x onerror/.test(body) && /&lt;img/.test(body));
  }catch(err){ out.push('✗ ERRO: '+(err&&err.stack||err)); }
  console.log(out.join('\\n'));
  console.log(out.every(l=>l.startsWith('✓'))?'\\n✅ SMOKE-CORE OK':'\\n⚠️ FALHAS');
})();`;
function mkEl(id){return{set innerHTML(v){store[id]=v;},get innerHTML(){return store[id]||'';},style:{},addEventListener(){},classList:{add(){},remove(){},toggle(){}},querySelector:()=>null,querySelectorAll:()=>[],appendChild(){},click(){},setAttribute(){},textContent:'',value:'',href:'',files:[]};}
const d={addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>mkEl(id),documentElement:{setAttribute(){},getAttribute:()=>null,classList:{add(){},remove(){}},style:{setProperty(){},removeProperty(){}}},head:{appendChild(){}},body:{appendChild(){},classList:{add(){},remove(){}}},createElement:()=>mkEl('n'),title:''};
function dp(){return new Proxy({},{get:(t,p)=>{if(!(p in t))t[p]=dp();return t[p];},set:(t,p,v)=>{t[p]=v;return true;}});}
const C=function(){return{destroy(){},update(){},data:{datasets:[]}};};C.defaults=dp();
const sb={console,document:d,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},MutationObserver:function(){return{observe(){},disconnect(){}};},getComputedStyle:()=>({getPropertyValue:()=>''}),setTimeout,clearTimeout,fetch:()=>Promise.reject('x'),Chart:C,Blob:function(){},URL:{createObjectURL:()=>'blob:',revokeObjectURL(){}},Math,JSON,Date,Number,String,Array,Object,parseInt,parseFloat,isNaN,Symbol,RegExp,Set,Map,isFinite,encodeURIComponent,Promise};
sb.window=sb; sb.globalThis=sb; sb.self=sb;
vm.createContext(sb); vm.runInContext(src,sb);
setTimeout(()=>{},150);
