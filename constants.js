/* ═══════════════════════════════════════════════════════════════
 * constants.js — Constantes puras do FinançasPRO (Fase 18 / modularização)
 * Carregado ANTES de app.js (scripts clássicos compartilham o escopo léxico
 * global). NÃO contém lógica de negócio. NÃO usar ESM/build aqui.
 * Ordem no app.html:  utils.js → constants.js → app.js
 * ═══════════════════════════════════════════════════════════════ */

// ── Carreira & Desenvolvimento ──
const CAR_HORIZONTES = { curto_prazo:{label:'Curto prazo',cor:'var(--info)'}, medio_prazo:{label:'Médio prazo',cor:'var(--warn)'}, longo_prazo:{label:'Longo prazo',cor:'var(--violet)'} };
const CAR_OBJ_STATUS = { planejado:{label:'Planejado',cor:'var(--text3)'}, em_andamento:{label:'Em andamento',cor:'var(--info)'}, pausado:{label:'Pausado',cor:'var(--text3)'}, concluido:{label:'Concluído',cor:'var(--pos)'}, cancelado:{label:'Cancelado',cor:'var(--text3)'} };
const CAR_AREAS = ['product_management','analise_negocios','requisitos','gestao_projetos','ux_produto','comunicacao_cliente','testes_homologacao','dados_metricas','lideranca','estrategia','tecnologia','outro'];
const CAR_SKILL_CATS = ['produto','negocios','requisitos','projetos','comunicacao','lideranca','dados','tecnologia','documentacao','testes','comercial','pessoal','outro'];
const CAR_SKILL_STATUS = { desenvolvendo:{label:'Desenvolvendo',cor:'var(--info)'}, dominado:{label:'Dominado',cor:'var(--pos)'}, em_risco:{label:'Em risco',cor:'var(--neg)'}, pausado:{label:'Pausado',cor:'var(--text3)'} };
const CAR_NIVEIS = { 1:'iniciante', 2:'básico', 3:'intermediário', 4:'avançado', 5:'referência' };
const CAR_CURSO_TIPOS = ['curso','certificacao','livro','mentoria','workshop','evento','trilha','outro'];
const CAR_CURSO_STATUS = { planejado:{label:'Planejado',cor:'var(--text3)'}, em_andamento:{label:'Em andamento',cor:'var(--info)'}, concluido:{label:'Concluído',cor:'var(--pos)'}, pausado:{label:'Pausado',cor:'var(--text3)'}, cancelado:{label:'Cancelado',cor:'var(--text3)'} };
const CAR_NET_TIPOS = ['contato','mentor','colega','cliente','recrutador','referencia','parceiro','outro'];
const CAR_NET_STATUS = { ativo:{label:'Ativo',cor:'var(--pos)'}, a_retomar:{label:'A retomar',cor:'var(--warn)'}, inativo:{label:'Inativo',cor:'var(--text3)'} };
const CAR_EXP_TIPOS = ['emprego','contrato','projeto','entrega','cliente','case','conquista','outro'];
const CAR_RENDA_STATUS = { planejado:{label:'Planejado',cor:'var(--text3)'}, em_andamento:{label:'Em andamento',cor:'var(--info)'}, concluido:{label:'Concluído',cor:'var(--pos)'}, pausado:{label:'Pausado',cor:'var(--text3)'}, cancelado:{label:'Cancelado',cor:'var(--text3)'} };

// ── Patrimônio & Bens ──
const PAT_BEM_CATS = ['imovel','veiculo','equipamento','tecnologia','setup','relogio','movel','eletrodomestico','item_de_valor','investimento_fisico','documento','outro'];
const PAT_BEM_STATUS = { ativo:{label:'Ativo',cor:'var(--pos)'}, em_manutencao:{label:'Em manutenção',cor:'var(--warn)'}, planejado:{label:'Planejado',cor:'var(--info)'}, vendido:{label:'Vendido',cor:'var(--text3)'}, doado:{label:'Doado',cor:'var(--text3)'}, perdido:{label:'Perdido',cor:'var(--neg)'}, descartado:{label:'Descartado',cor:'var(--text3)'} };
const PAT_VALOR_METODOS = { manual:{label:'Manual'}, valor_compra:{label:'Valor de compra'}, depreciacao:{label:'Depreciação'}, estimado:{label:'Estimado'}, tabela_fipe_futuro:{label:'FIPE (roadmap)'}, mercado_futuro:{label:'Mercado (roadmap)'} };
const PAT_PAS_TIPOS = ['financiamento','emprestimo','parcelamento','consorcio','divida','manutencao_parcelada','outro'];
const PAT_PAS_STATUS = { ativo:{label:'Ativo',cor:'var(--warn)'}, quitado:{label:'Quitado',cor:'var(--pos)'}, renegociado:{label:'Renegociado',cor:'var(--info)'}, cancelado:{label:'Cancelado',cor:'var(--text3)'} };
const PAT_MAN_TIPOS = ['preventiva','corretiva','revisao','limpeza','garantia','upgrade','outro'];
const PAT_MAN_STATUS = { planejada:{label:'Planejada',cor:'var(--info)'}, em_andamento:{label:'Em andamento',cor:'var(--warn)'}, realizada:{label:'Realizada',cor:'var(--pos)'}, adiada:{label:'Adiada',cor:'var(--text3)'}, cancelada:{label:'Cancelada',cor:'var(--text3)'} };
const PAT_SEG_TIPOS = ['bem','veiculo','imovel','equipamento','vida','residencial','outro'];
const PAT_SEG_STATUS = { ativo:{label:'Ativo',cor:'var(--pos)'}, vencido:{label:'Vencido',cor:'var(--neg)'}, cancelado:{label:'Cancelado',cor:'var(--text3)'}, renovado:{label:'Renovado',cor:'var(--info)'} };
const PAT_DOC_TIPOS = ['nota_fiscal','garantia','contrato','seguro','manual','certificado','documento_pessoal','outro'];

// ── Integrações B3 / Open Finance (rótulos e tipos) ──
const CONSENT_LABELS = {
  nao_iniciado:{label:'Não iniciado',cor:'var(--text3)'}, pendente:{label:'Pendente',cor:'var(--warn)'},
  autorizado:{label:'Autorizado',cor:'var(--pos)'}, revogado:{label:'Revogado',cor:'var(--neg)'},
  expirado:{label:'Expirado',cor:'var(--neg)'}, erro:{label:'Erro',cor:'var(--neg)'}, backend_necessario:{label:'Backend necessário',cor:'var(--info)'},
};
const B3_TIPOS = { posicao:'Posição', movimentacao:'Movimentação', garantias:'Garantias', eventosProvisionados:'Eventos provisionados', ofertasPublicas:'Ofertas públicas', negociacao:'Negociação' };
const B3_TIPO_COL = { posicao:'posicoes', movimentacao:'movimentacoes', garantias:'garantias', eventosProvisionados:'eventosProvisionados', ofertasPublicas:'ofertasPublicas', negociacao:'negociacoes' };
