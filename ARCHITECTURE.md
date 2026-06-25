# FinançasPRO — Arquitetura Técnica

> Documento de arquitetura criado na **Fase 12 (Modularização & Saneamento Técnico)**.
> Objetivo: dar um mapa claro do sistema, registrar as dependências entre domínios,
> documentar a superfície global e definir um plano de modularização incremental e
> seguro — **sem reescrita, sem framework, sem build step**.

## 1. Visão geral

FinançasPRO é uma aplicação **vanilla JS, sem build**, hospedada no **GitHub Pages**, com
**Firebase Authentication** (login/reset) e **Cloud Firestore** (persistência por usuário).
A UI é renderizada via *template strings* + `innerHTML`, e os gráficos usam **Chart.js** (CDN).

Arquivos servidos:

| Arquivo | Papel |
|---|---|
| `index.html` | Página de login/cadastro/reset (somente Firebase, standalone). |
| `app.html` | Casca da aplicação (markup das páginas, estilos, wiring do Firebase). |
| `utils.js` | **(novo, Fase 12)** Helpers puros (sanitização, formatação, datas, parsing). Carregado **antes** de `app.js`. |
| `app.js` | Orquestrador: estado `D`, migração, todos os módulos de produto, render e integrações. |
| `auth.js` | Stub legado neutralizado (mantido por compatibilidade histórica; não usado). |
| `firestore.rules` | Regras de isolamento por `uid`. |
| `deploy.ps1` | Deploy via `$env:GITHUB_TOKEN` (sem segredo no código). |

Ordem de carregamento em `app.html`: `utils.js` → `app.js` → Firebase compat → bootstrap.
Como ambos são **scripts clássicos**, compartilham o mesmo escopo global — por isso mover
helpers para `utils.js` **não quebra** as referências feitas em `app.js`.

## 2. Modelo de dados

### 2.1. `D` — estado do usuário autenticado
`D` é o objeto único de estado, persistido em `userData/{uid}` no Firestore. Estrutura
(resumo dos ramos principais):

```
D = {
  meses, entradas, fixas, compras, ativos, pagamentos, prefs,   // finanças (núcleo)
  metas:        [],                                             // Metas Integradas (multiárea)
  decisoes:     [],                                             // Decisões
  hobbies:      { itens, saldoFundo, ... },                     // Compras & Desejos
  integracoes:  { googleAgenda, importacao, indicadores },      // Integrações frontend-only
  trabalho:     { projetos, tarefas, clientes },                // Trabalho & Projetos
  carreira:     { objetivos, competencias, cursos, networking, experiencias, planosRenda },
  patrimonio:   { bens, passivos, manutencoes, seguros, documentos },
}
```

`migrateData(d)` é **defensivo**: para usuário novo retorna um clone de `BLANK`; para
backups antigos, cria ramos/arrays/campos ausentes sem destruir dados. Toda fase nova
adicionou seu ramo a `DEFAULT`/`BLANK` **e** ao bloco de migração.

### 2.2. `systemConfig/app` — configuração global (não pessoal)
Somente textos/identidade visual e o menu padrão (`SYSCFG`). **Nunca** guarda dados
pessoais, tokens ou segredos. Acesso de escrita restrito a superadmin pelas rules.

### 2.3. Isolamento por `uid`
`firestore.rules` garante que cada usuário só lê/escreve `userData/{seuUid}`. Nenhum dado
pessoal trafega para coleções globais. A UI nunca mistura dados entre usuários porque `D`
é carregado a partir do documento do próprio `uid` autenticado.

## 3. Relação entre módulos

Núcleo financeiro é a base; os demais módulos são **acoplados por vínculos opcionais**
(IDs cruzados), nunca por dependência rígida de dados:

```
                    ┌─────────────┐
                    │  Dashboard  │  ← lê resumos de todos os módulos
                    │    Geral    │
                    └──────┬──────┘
   Finanças ── Metas ── Decisões ── Compras ── Trabalho ── Carreira ── Patrimônio
        │        │         │           │           │           │            │
        └────────┴─────────┴───────────┴───────────┴───────────┴────────────┘
         vínculos opcionais: relacionadaAMetaId / ADecisaoId / ACompraId /
         AProjetoId / ACarreiraId / ABemId  (sempre IDs internos, nunca obrigatórios)
```

- **Dashboard Geral** (`renderGeralDash`) agrega `*ResumoData()` de cada módulo e monta
  "próximos passos".
- **Relatórios** (`relDoc*`, 9 tipos) reusam os mesmos dados via um layout comum
  (`_relDoc/_relKpis/_relSection/_relTable`), com impressão/PDF via `window.print()` e CSV
  protegido contra injeção de fórmula.
- **Integrações** são frontend-only: `googleCalendarLink` (link, sem OAuth), import CSV/OFX
  local, indicadores BCB com fallback manual.

## 4. Mapa de dependências (domínios)

| Domínio | Exemplos de funções | Pode extrair? |
|---|---|---|
| **Puro / utilitário** (já em `utils.js`) | `escapeHTML`, `attr`, `_safeUrl`, `fmt/R/RK/P`, `genId`, `_isPast`, `_diasAte`, `_gcalDate`, `_normalizeBRNumber`, `_parseDataImport`, `_detectDelimiter`, `_splitCSVLine` | ✅ **Extraído** |
| **Core financeiro** | `totalEMes`, `caixaAtual`, `sobraM`, `metaEmergencia`, `patrimonioLiquido` (finanças), `relatorioMensal/Anual`, `scoreFinanceiro` | ⚠️ Depende de `D`; extrair só com cuidado (fase futura) |
| **Constantes** | `META_DOMINIOS`, `DEC_STATUS`, `TRAB_*`, `CAR_*`, `PAT_*`, `DEFAULT_MENU`, `_REL_TIPOS` | 🟡 Dados puros — extraíveis para `constants.js` numa próxima fase |
| **Render** (54 funções `render*`) | `renderTrabalho`, `renderCarreira`, `renderPatrimonio`, `renderGeralDash`, … | ⛔ Alto acoplamento com `D` e DOM; não mover ainda |
| **Handlers inline** (20 `set*Field`, 22 `add*`, removes) | `setBemField`, `addProjeto`, `removeCurso`, … | ⛔ Precisam continuar globais (usados por `onchange`/`onclick`) |
| **Integração entre módulos** (15 `criar*`) | `criarMetaDeBem`, `criarDecisaoDeObjetivo`, `criarBemDaCompra`, … | ⛔ Dependem de múltiplos ramos de `D` |
| **Agenda** (14 `agendar*`) | `agendarGarantia`, `agendarCurso`, … | 🟡 Reusam `googleCalendarLink`; extraíveis com integrações depois |
| **Relatórios** (9 `relDoc*`) | `relDocPatrimonio`, `relDocCarreira`, … | 🟡 Candidatos a `reports.js` numa próxima fase |

## 5. Superfície global (funções que DEVEM permanecer globais)

Por causa de handlers inline (`onclick`/`onchange`/`oninput`) e do carregamento como
script clássico, estas categorias **não podem deixar de ser globais** sem antes migrar os
handlers. São expostas naturalmente (top-level em script clássico) e, no caso de `utils.js`,
também via `Object.assign(window, …)`:

- **Utilitários** (utils.js → window): `escapeHTML`, `attr`, `_safeUrl`, `fmt`, `fmtK`, `fmtP`, `R`, `RK`, `P`, `P9`, `genId`, `_isPast`, `_diasAte`, `_gcalDate`, `_gcalPlus1`, `_detectDelimiter`, `_splitCSVLine`, `_normalizeBRNumber`, `_parseDataImport`.
- **Navegação/orquestração**: `go`, `goSide`, `renderAll`, `renderPage`, `switchRole`.
- **Setters de cada módulo** (inline `onchange`): `setMetaField`, `setDecField`, `setItemHobbyField`, `setProjField`, `setTaskField`, `setObjField`, `setSkillField`, `setCursoField`, `setBemField`, `setPasField`, `setManField`, `setSegField`, `setDocField`, … e os `add*`/`remove*`/`agendar*`/`criar*` correspondentes.

> Regra de ouro: **argumentos de handlers inline são sempre IDs gerados internamente**
> (`bem_…`, `proj_…`, `meta_…`), nunca texto do usuário — por isso não há vetor de XSS via
> atributo. Texto livre só entra no DOM via `escapeHTML`/`attr`.

## 6. Plano de modularização incremental

**Estratégia escolhida: Opção B — modularização gradual sem quebrar globals.**

Justificativa: o app é carregado como script clássico e depende de dezenas de funções
globais para handlers inline. Migrar para ES Modules (`type="module"`) tornaria as
declarações *não-globais* e quebraria todos os `onclick`/`onchange` de uma vez. A Opção B
extrai **funções-folha puras** para arquivos carregados antes de `app.js`, preservando o
escopo global e permitindo avanço sem risco.

Roadmap sugerido (uma fatia por rodada, sempre com smoke test antes/depois):

1. ✅ **Fase 12 (feita):** `utils.js` — sanitização, formatação, datas e parsing puros.
2. 🔜 `constants.js` — mover blocos de constantes puras (`*_STATUS`, `*_CATS`, `_REL_TIPOS`, `DEFAULT_MENU`).
3. 🔜 `reports.js` — layout e geradores `relDoc*` (dependem só de helpers + leitura de `D`).
4. 🔜 `integrations.js` — `googleCalendarLink`, import CSV/OFX, indicadores BCB.
5. 🔜 `b3of_mod.js` — extração futura de `B3Service`/`OpenFinanceService` e dos painéis/import mock B3/Open Finance (hoje em `app.js`). **Este arquivo ainda não existe**; é apenas um item de roadmap.
5. 🔜 Migração gradual de handlers inline para *event delegation* (`data-*` + `addEventListener`), módulo a módulo.
6. 🔮 Só então, se desejado, avaliar `type="module"` com uma camada fina de `window` para compatibilidade.

## 7. Handlers inline & `innerHTML` (estado atual)

- **Handlers inline:** ainda presentes nos módulos (padrão `onclick="fn('id_interno')"`).
  Seguros porque os argumentos são IDs internos. Migração para `addEventListener`+`dataset`
  fica para o passo 5 do roadmap, módulo a módulo.
- **`innerHTML`:** todo texto livre passa por `escapeHTML`/`attr`; URLs por `_safeUrl`
  (bloqueia `javascript:`), com `rel="noopener noreferrer"`. Classificação:
  *(1)* HTML fixo interno — seguro; *(2)* com `escapeHTML` — seguro; *(3)* migração futura
  para `createElement` — opcional, não urgente. Nenhum sink inseguro conhecido.

## 8. Preparação para backend futuro (sem implementar agora)

Quando houver backend leve (Cloudflare Worker / Cloud Functions), o frontend consumirá um
**contrato único e estável**, com degradação graciosa (campo `stale`) e sem segredos no
cliente:

```js
// Resposta esperada de qualquer proxy/endpoint backend (exemplo, não implementado):
{
  ok: true,
  provider: "b3-proxy",          // ex.: "b3-proxy" | "calendar-oauth" | "openfinance"
  source: "Cloudflare Worker",
  updatedAt: "2026-01-01T00:00:00Z",
  stale: false,                  // true → usar cache/fallback manual
  data: { /* payload específico */ },
  error: null                    // string em caso de falha (ok:false)
}
```

Pontos de integração já preparados no produto:
- **Indicadores** (`atualizarIndicadores`) já tolera falha/CORS e cai para modo manual — basta trocar a fonte por um proxy.
- **B3 / Open Finance / Gmail / Calendar real** estão documentados como "exige backend/provedor".
- **Anexos** hoje são links manuais (`_safeUrl`); o ponto de evolução é Firebase Storage por `uid`.

Regras invioláveis: **sem token/segredo no cliente**, OAuth com escopos mínimos e tokens
guardados no backend, dados pessoais sempre em `userData/{uid}`.

## 9. Como rodar checagens

```bash
node --check utils.js
node --check app.js
node smoke-core.js           # (na raiz) carrega utils.js + app.js e valida helpers + integração
```

## 9.1. Fase 12.1 — correções técnicas (pós-modularização)

Antes da arquitetura regulada, foram corrigidos bloqueios: `deploy.ps1` agora publica
`utils.js` (sem ele o app quebra em produção); `smoke-core.js` (na raiz) usa `const root = __dirname` e roda com `node smoke-core.js`
coerente com a pasta `tests/`; **Firestore Rules** ajustadas para cadastro público seguro
(`users/{uid}`: `create` por dono com `role:'user'` e apenas os 5 campos esperados, ou por
admin; `read` dono/admin; `update/delete` só admin; `private/**` só dono; bloqueio final
`if false` preservado) — corrige o cadastro sem abrir brecha de escalonamento de privilégio;
`toast` passou de `innerHTML` para `textContent`; e os `innerHTML` de perfil (e-mail/UID) agora
usam `escapeHTML`. `auth.js` permanece neutralizado, fora do deploy e do `.gitignore` (recomendado
`git rm auth.js`). A modularização é **inicial** — `utils.js` é a primeira extração; próximas
recomendadas: constantes, relatórios, integrações, navegação/sidebar e módulos por domínio.

## 9.2. Integrações reguladas B3 + Open Finance (Fase 13 — arquitetura/mock)

> ⚠️ **Não há integração real.** Sem backend, OAuth, mTLS, tokens, certificados, pacote de
> acesso, CPF, senha ou chamada real. Esta fase entrega **estrutura local, importação manual
> de JSON de teste, consentimento documental e stubs** que retornam `mode:'backend_required'`.

**O que os manuais B3 indicam** (considerado na arquitetura): integração pela Área Logada do
Investidor; o investidor concede **consentimento** (e pode revogar na Área Logada da B3); o
licenciado recebe dados mediante autorização; APIs **Pacote de Acesso, API Guia, Position,
Movement, PublicOffers, Collateral, ProvisionedEvents e Negociação**; dados em **D-1**; a
**API Guia** racionaliza chamadas (não consultar o mesmo investidor várias vezes ao dia);
certificação inicia no **B3 For Developers** pela API Pacote de Acesso; produção exige
**contratação (apenas pessoa jurídica)**, **self-assessment** de governança/segurança e há
**tarifação por investidor autorizado**; o app **não armazena credenciais** nem pede CPF/senha B3.

**O que o manual Open Finance indica**: integração real exige **fluxo seguro de consentimento**,
autenticação/autorização adequadas e **provedor autorizado**; o frontend estático **não pode**
guardar tokens/secrets/certificados; o app **não pede senha bancária** e **não faz scraping**; o
usuário precisa entender quais dados serão acessados e ver o status do consentimento; o backend
futuro trata autorização, troca/renovação/revogação/expiração de tokens, erros, rate limits e
logs sem dados sensíveis.

**Por que não é frontend-only / por que precisa backend seguro:** tokens, client secrets,
certificados e mTLS jamais podem residir no GitHub Pages; consentimento e tarifação exigem
governança; logs não podem conter dados sensíveis. Por isso os serviços são **stubs** e a
sincronização real é deliberadamente bloqueada (`backend_required`).

**Estruturas locais (em `userData/{uid}`, nunca em `systemConfig`, nunca tokens):**
- `D.integracoes.b3` = `{ status, modo, ambiente, ultimaSincronizacao, ultimaReferenciaD1, fonte, consentimento{status,dataAutorizacao,dataRevogacao,dataExpiracao,identificadorInterno}, resumo{posicoes,movimentacoes,garantias,eventosProvisionados,ofertasPublicas,negociacoes}, observacoes }`.
- `D.b3` = `{ posicoes, movimentacoes, garantias, eventosProvisionados, ofertasPublicas, negociacoes, logsSincronizacao }` (dados importados/mock).
- `D.integracoes.openFinance` = `{ status, modo, ambiente, ultimaSincronizacao, fonte, consentimento{status,dataAutorizacao,dataRevogacao,dataExpiracao,escopos[],instituicao,identificadorInterno}, resumo{contas,saldos,transacoes,cartoes,faturas,investimentos,creditos}, observacoes }`.
- `D.openFinance` = `{ contas, saldos, transacoes, cartoes, faturas, investimentos, creditos, logsSincronizacao }`.

**Camadas de serviço (atualmente em `app.js`):** `B3Service` (`status`, `syncGuide`, `syncPositions`,
`syncMovements`, `importMockPayload`, `mapPositionToInvestment`, `mapMovementToTransaction`) e
`OpenFinanceService` (`status`, `startConsentStub`, `revokeLocalConsent`, `syncAccounts`,
`syncBalances`, `syncTransactions`, `syncCreditCards`, `importMockPayload`, `mapAccountToFinance`,
`mapTransactionToEntryOrExpense`, `mapCreditCardToCard`). Retorno padronizado
`{ ok, provider, mode('mock'|'manual'|'backend_required'|'api'), source, updatedAt, referenceDate, data, error }`.
Toda sincronização real retorna `backend_required` com mensagem explicativa.

> **Onde o código vive (estado real, pós-revisão da Fase 13):** `B3Service` e
> `OpenFinanceService`, os painéis da Central de Integrações e a importação mock
> estão **dentro de `app.js`**. **Não existe um arquivo `b3of_mod.js`** — ele é
> apenas um item de roadmap de modularização futura (ver §6). B3 e Open Finance
> seguem como **mock/stub/documentação**: não há chamadas reais, e o **Worker B3
> ainda não foi iniciado** — a integração real continua dependente de backend seguro.

**Consentimento (local/documental):** estados `nao_iniciado | pendente | autorizado | revogado |
expirado | erro | backend_necessario`. O app só reflete status; **não** realiza nem cancela
consentimento real (isso ocorre na Área Logada da B3 / fluxo Open Finance autorizado).

**D-1 / API Guia (conceitual):** `B3Service.status()` deriva `atualizado | desatualizado |
aguardando_D1 | consentimento_ausente | consentimento_revogado | backend_necessario`; a referência
D-1 é gravada em `ultimaReferenciaD1`. A lógica de "uma sincronização por dia, Guia primeiro" é
conceitual — sem chamada real.

**Importação mock JSON:** o usuário escolhe o tipo, cola um array JSON, o app valida formato
mínimo, **pré-visualiza** (textos escapados, números/datas normalizados, origem marcada), e só
então confirma a gravação em `D.b3`/`D.openFinance` com dedupe. **Nada é enviado a servidores** e
**nenhum dado é commitado em carteira/finanças automaticamente** — apenas sugestões/mapeamento.

**Backend futuro (Cloudflare Worker / Cloud Functions):** guarda segredos/certificados/tokens
fora do frontend; autentica o usuário e valida ownership por `uid`; consulta a **API Guia** antes
de Position/Movement; trata D-1, consentimento revogado/expirado e rate limit; loga sem dados
sensíveis; e **nunca** retorna segredos. Contratos previstos:

```
GET  /integrations/status
GET  /b3/status          POST /b3/sync-guide   POST /b3/sync-positions
POST /b3/sync-movements  POST /b3/import-mock  POST /b3/revoke-local
GET  /open-finance/status        POST /open-finance/start-consent
POST /open-finance/sync-accounts POST /open-finance/sync-transactions
POST /open-finance/sync-credit-cards POST /open-finance/sync-investments
POST /open-finance/import-mock   POST /open-finance/revoke-local
```

Resposta backend esperada (futuro): `{ ok, provider, source, updatedAt, stale, data, error }`.

**Ainda depende de terceiros:** B3 → contratação/licenciamento (PJ), pacote de acesso,
self-assessment e certificação no B3 For Developers. Open Finance → provedor autorizado,
backend seguro com OAuth/mTLS e fluxo de consentimento.

## 10. Limitações atuais / dívida técnica remanescente

- `app.js` ainda é grande (~9,4k linhas); a modularização é incremental e seguirá o roadmap acima.
- Handlers inline e alguns `innerHTML` legados permanecem (seguros, mas a migrar gradualmente).
- Integrações reais (B3, Open Finance, Gmail/Calendar, Storage, push) seguem como roadmap, dependentes de backend.
