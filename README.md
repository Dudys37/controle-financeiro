# 💰 FinançasPRO — Controle Financeiro Pessoal

Aplicação web de finanças pessoais com autenticação Firebase, banco Cloud Firestore e hospedagem no GitHub Pages. Arquitetura single-file em JavaScript vanilla, sem build.

**Acesso:** https://dudys37.github.io/controle-financeiro

> **Visão de produto:** o FinançasPRO está evoluindo de gestor financeiro para um **auxiliador pessoal estratégico** (finanças, trabalho, planejamento, lazer, patrimônio, compras e decisões). Hoje o módulo financeiro é o centro; a arquitetura de navegação está sendo preparada para múltiplos domínios. Ver o **Roadmap** no fim deste documento.

## 🧱 Stack

- HTML/CSS/JS vanilla (sem framework, sem build)
- Firebase Authentication (login/cadastro/redefinição de senha)
- Cloud Firestore (dados por usuário, isolados por `uid`)
- Chart.js (gráficos)
- GitHub Pages (hospedagem estática)

## 📁 Arquivos

O projeto tem **dois subprojetos independentes**: o **frontend** (raiz, GitHub Pages,
CommonJS para os scripts Node) e o **Worker B3** (`worker/`, Cloudflare Worker, ESM).

```
/                          ← FRONTEND (raiz) — NÃO tem package.json e NÃO é "type":"module"
├── index.html             — Login / cadastro / redefinição de senha (Firebase Auth)
├── app.html               — Interface principal (markup + estilos + wiring Firebase)
├── app.js                 — Lógica da aplicação e renderização
├── utils.js               — Helpers globais puros (carregado ANTES de app.js; publicado no deploy)
├── smoke-core.js          — Smoke test (CommonJS, usa require) — roda com `node smoke-core.js`
├── firestore.rules        — Regras de segurança (publicar no Firebase Console)
├── deploy.ps1             — Deploy seguro (publica index/app/app.js/utils.js/README)
├── .gitignore             — Arquivos que não devem ser versionados
├── README.md
├── ARCHITECTURE.md
│
└── worker/                ← WORKER B3 (Cloudflare) — subprojeto ESM isolado
    ├── package.json        — "type":"module" (vale SÓ dentro de worker/)
    ├── wrangler.toml.example
    ├── .dev.vars.example
    ├── .gitignore          — protege .dev.vars e wrangler.toml reais
    ├── README.md
    └── src/
        ├── index.js        — entrada do Worker (roteador)
        ├── routes/b3.js
        ├── services/b3Client.js
        ├── services/firebaseAuth.js
        └── utils/responses.js
        └── utils/security.js
```

> ⚠️ **Não achate a pasta `worker/`.** Os arquivos do Worker importam por caminho
> relativo (`./utils/responses.js`, `./services/firebaseAuth.js`, `../utils/...`), então
> a estrutura `worker/src/{routes,services,utils}` precisa ser preservada — caso contrário
> os imports não resolvem em runtime. E o `package.json` com `"type":"module"` deve ficar
> **dentro de `worker/`**: se ele for parar na raiz, o Node passa a tratar `smoke-core.js`
> (CommonJS) como ESM e quebra com *"require is not defined in ES module scope"*. A **raiz
> não tem `package.json`** — os scripts Node da raiz rodam como CommonJS por padrão.

**Não é mais usado:** `auth.js` foi **descontinuado** (era autenticação local insegura com senha hardcoded). A autenticação é feita **exclusivamente pelo Firebase Authentication**. Recomenda-se removê-lo do repositório: `git rm auth.js`.

### Como rodar os checks

```bash
# Frontend (na RAIZ — CommonJS):
node --check utils.js
node --check app.js
node smoke-core.js

# Worker (dentro de worker/ — ESM):
cd worker
npm run check                 # = node --check src/index.js
node --check src/routes/b3.js src/services/b3Client.js src/services/firebaseAuth.js src/utils/responses.js src/utils/security.js
npx wrangler dev              # sobe o Worker local; depois: curl http://localhost:8787/health
```

## 🔐 Segurança

- **Autenticação:** somente Firebase Authentication. Nenhuma senha, hash ou usuário padrão fica no código.
- **Redefinição de senha:** fluxo seguro do Firebase (`sendPasswordResetEmail`). O administrador **não** define senha diretamente, e **nenhuma senha é gravada no Firestore**.
- **Isolamento por usuário:** todo dado pessoal vive em `userData/{uid}` e só o dono lê/escreve. As `firestore.rules` garantem o isolamento no servidor — a interface apenas esconde menus, mas a segurança real está nas regras.
- **Sem segredos no código:** o token de deploy vem de `$env:GITHUB_TOKEN`. A config *web* do Firebase (`apiKey`, `projectId`) é pública por design e não autoriza acesso — quem protege os dados são as `firestore.rules`.
- **Anti-XSS:** texto livre vindo do usuário/Firestore é escapado com `escapeHTML()` antes de ir para `innerHTML` (prioridade nos pontos onde o admin vê dados de outros usuários).

> ⚠️ **Se um token GitHub já foi exposto** (havia um hardcoded no `deploy.ps1` antigo), **revogue-o imediatamente** em GitHub → Settings → Developer settings → Personal access tokens → *Revoke*. Remover do código não basta: ele permanece no histórico do Git.

### Modelo de dados e isolamento

```
users/{uid}        → perfil (email, displayName, role). read: dono ou superadmin · write: superadmin
userData/{uid}     → TODOS os dados pessoais (objeto D em JSON). read/write: somente o dono
systemConfig/{doc} → configurações globais do sistema (identidade visual, módulos). read: autenticado · write: superadmin
```

Tudo que é pessoal (entradas, saídas, compras, cartões, faturas, metas, orçamentos, investimentos, plano de aposentadoria, categorias customizadas, preferências, notas, hobbies e futuros módulos de trabalho/lazer/patrimônio/decisões) fica **dentro de `userData/{uid}`** — isolado por usuário. Apenas configurações realmente sistêmicas (identidade visual, lista de módulos) podem ser globais, em `systemConfig`, e nunca contêm dados pessoais nem segredos.

## ⚙️ Configuração do Firebase (uma vez)

1. **Firestore → Regras:** copie o conteúdo de `firestore.rules` para o Firebase Console e publique.
2. **Authentication:** habilite *E-mail/senha*. Usuários se cadastram pela tela de login; o cadastro cria automaticamente `users/{uid}` (role `user`) e `userData/{uid}` zerado.
3. **Superadmin:** para tornar um usuário superadmin, ajuste manualmente o campo `role` para `superadmin` no documento `users/{uid}` (Console do Firestore). Mantenha esse procedimento em documentação privada.

## 🚀 Deploy seguro

O `deploy.ps1` publica apenas os arquivos necessários e seguros (`index.html`, `app.html`, `app.js`, `README.md`). Ele **não** publica `auth.js`, `deploy.ps1`, `firestore.rules` nem `.gitignore`.

```powershell
# 1. Defina o token (fine-grained PAT com Contents: Read/Write) — NUNCA no arquivo:
$env:GITHUB_TOKEN = "seu_token_aqui"
# 2. Rode:
.\deploy.ps1
```

Se `GITHUB_TOKEN` não estiver definido, o script aborta com instruções. As regras do Firestore são publicadas **no Firebase Console**, não pelo GitHub Pages.

**Evolução recomendada:** migrar o deploy para **GitHub Actions** com o token guardado em *Secrets* do repositório, eliminando o token da máquina local.

## 💻 Rodar localmente

Como é estático, basta servir a pasta (necessário por causa do Firebase Auth/domínios):

```bash
npx serve .       # ou: python3 -m http.server 8080
```

Adicione `localhost` aos domínios autorizados em Firebase Authentication → Settings → Authorized domains.

## 🗂️ Arquivos que NÃO devem ser versionados

Ver `.gitignore`: `.env`, `*.local`, `deploy.local.ps1`, `secrets.*`, `firebase-debug.log`, `node_modules/`, `.DS_Store` e o `auth.js` legado.

## 🧬 Persistência e versionamento de schema

Hoje todo o estado do app é salvo como **uma string JSON** em `userData/{uid}.data`, com `v: 4` indicando a versão do schema. `migrateData()` completa campos ausentes ao carregar, garantindo compatibilidade com dados antigos. A importação de backup valida a estrutura mínima (`meses` e `entradas`) e inclui a versão.

**Evolução futura (planejada):** quebrar o documento único em **subcoleções** sob `userData/{uid}/` — `entradas`, `compras`, `cartoes`, `metas`, `ativos`, `configuracoes`, e os novos domínios `trabalho`, `projetos`, `tarefas`, `planejamento`, `lazer`, `patrimonio`, `decisoes`, `preferencias` — para escalar melhor e permitir queries. A persistência atual continua funcionando enquanto essa migração não acontece.

## 🧭 Roadmap (de gestor financeiro a auxiliador pessoal)

A navegação será reorganizada em **categorias e subcategorias**, com **Dashboard Geral** (visão integrada da vida) separado do **Dashboard Financeiro**. Domínios previstos: Finanças, Trabalho, Carreira, Planejamento, Lazer, Patrimônio, Compras & Desejos, Decisões e Relatórios.

Prioridade técnica (segurança primeiro):

1. ✅ Token exposto removido (deploy via variável de ambiente)
2. ✅ Autenticação local legada descontinuada (`auth.js` neutralizado)
3. ✅ Reset de senha seguro (`sendPasswordResetEmail`, sem senha no Firestore)
4. ✅ `firestore.rules` com isolamento por `uid` e sem `pendingReset`
5. ✅ Anti-XSS (`escapeHTML`) nos pontos críticos (admin vê dados de terceiros)
6. ✅ Dados financeiros pessoais removidos dos defaults (novo usuário começa zerado)
7. ✅ `.gitignore` e deploy seguro
8. ✅ **(Fase 2) Módulo de Configurações do Sistema** — identidade global (nome, subtítulo, marca, título do navegador, logo/favicon por URL) e cores via CSS variables, em `systemConfig/app`, editável só por superadmin, com validação de hex e preview ao vivo.
9. ✅ **(Fase 2) `firestore.rules` preparadas para subcoleções** (`userData/{uid}/{document=**}` e `users/{uid}/private/**`) + validação que impede `token`/`secret`/`apiKey` em `systemConfig`.
10. ✅ **(Fase 2) Varredura XSS ampliada** — `escapeHTML`/`attr` aplicados a entradas, compras, cartões, metas, ativos, hobbies e categorias.
11. ✅ **(Fase 2) Preferências por usuário** (`D.prefs`) isoladas em `userData/{uid}`, separadas das configurações globais.
12. ✅ **(Fase 3) Sidebar dinâmica por categorias/subcategorias** — gerada de dados (`SYSCFG.menu` com fallback `DEFAULT_MENU`), 12 categorias (Visão Geral, Finanças, Trabalho, Carreira, Planejamento, Lazer, Compras & Desejos, Patrimônio, Decisões, Relatórios, Pessoal, Sistema), recolhíveis (estado em `D.prefs.menuCollapsed`), com gating por papel, labels escapados e cliques por delegação (`data-page`, sem `onclick` inline).
13. ✅ **(Fase 3) Dashboard Geral** (`page-geral`) separado do Financeiro — cards estratégicos (situação do mês, reserva, disponível p/ investir, metas, compras & desejos, decisões) + alertas + próximos passos, cada card linkando ao módulo. Configurável como tela inicial via `D.prefs.dashInicial`.
14. ✅ **(Fase 3) Placeholders elegantes** para 11 módulos planejados (Trabalho, Carreira, Planejamento, Patrimônio, Compras & Desejos, Decisões, Relatório Geral, Integrações, Google Agenda, Open Finance, Anexos) — título, descrição, status "em construção" e funcionalidades futuras.
15. ✅ **(Fase 4) Módulo de Decisões** — primeiro módulo real fora de finanças (`D.decisoes`, isolado por `uid`). CRUD completo (criar/editar/excluir, expandir card), filtros (status, categoria, prioridade), busca por título/descrição, ordenação (prioridade/prazo/recência/custo), cards de resumo (em análise, aprovadas, adiadas, críticas, custo estimado, prazo próximo) e **análise estratégica automática** por regras locais (cabe no mês? compromete a reserva? custo recorrente? prioridade vs impacto?), com veredito textual. Alimenta o card de Decisões do Dashboard Geral com dados reais. Relacionamento opcional a compras/hobbies e metas. Texto livre escapado; cliques de ação por delegação (`data-dec-act`).
16. ✅ **(Fase 5) Metas Integradas (multiárea)** — metas deixam de ser só financeiras e ganham `dominio` (14 domínios: financeiro, carreira, trabalho, pessoal, lazer, patrimônio, estudo, saúde, compra, viagem, projeto, relacionamento, tecnologia, outro), `status`, `prioridade`, `unidade` (dinheiro, percentual, quantidade, sim/não, checklist, manual), `descricao`, `proximosPassos`, `observacoes` e vínculos opcionais a decisão/compra. Cálculo central `metaProgress()` por unidade; filtros (domínio/status/prioridade/unidade), busca, ordenação (prioridade/prazo/progresso/recência/domínio) e cards de resumo. Metas financeiras antigas migram para `dominio:'financeiro'`/`unidade:'dinheiro'` mapeando `alvo→valorAlvo` e `atual→valorAtual`, sem quebrar `metaInfo`, gráficos ou cálculos. **Dashboard Financeiro e relatório financeiro continuam exibindo apenas metas financeiras**; o **Dashboard Geral** mostra metas de todos os domínios. Decisões vinculadas a metas exibem ícone do domínio e progresso; o card da meta mostra quantas decisões estão vinculadas.
17. ✅ **(Fase 6) Compras & Desejos** — evolução do módulo Hobbies & Aquisições (mantido internamente como `D.hobbies` por compatibilidade). Itens ganharam `descricao`, `tipo`, `dominio` (11 domínios), `custoTotal`, `classe` ampliada (essencial, recomendado, invest. profissional/pessoal, substituir, desejável, luxo, impulso), `status` ampliado (desejado, em análise, aprovado, adiado, aguardando preço/oportunidade, comprado, descartado), `loja`/`link`, `justificativa`/`alternativas`/`melhorMomento`, quatro eixos de impacto, vínculos a meta/decisão e datas. Análise estratégica central `analisarCompra()` (cabe no fundo? no excedente? ameaça a reserva? prioridade/classe coerentes?) com veredito e recomendação. Fundo de Compras com meses para cobrir o próximo item. Filtros (categoria/domínio/status/classe/impacto), busca e ordenação. Botões **"Criar decisão"** e **"Criar meta"** a partir de uma compra (sem duplicar). Dashboard Geral usa `compraResumoData()`. Menu de-duplicado: o módulo real vive em **Compras & Desejos** (page `hobbies`); Lazer virou placeholder; o placeholder antigo de Compras foi removido. Backup inclui itens e fundo no resumo.
18. ✅ **(Fase 7) Central de Relatórios + PDFs** — página de Relatórios evoluída para um hub com 6 tipos: Financeiro Mensal, Financeiro Anual, Metas, Decisões, Compras & Desejos e Geral da Vida. Preview em tela (documento), botão **Imprimir / Salvar PDF** via `window.print()` + CSS de impressão dedicado, e exportação **CSV** opcional (mensal/metas/decisões/compras). Layout padrão com cabeçalho (logo/nome/subtítulo de `systemConfig`), resumo executivo, conteúdo (KPIs, tabelas, listas) e rodapé com aviso. Usa apenas dados do usuário autenticado (`D`) e reaproveita as funções existentes (`relatorioMensal`, `relatorioAnual`, `metaProgress`, `analiseDecisao`, `analisarCompra`, `compraResumoData`, etc.). Todo texto livre escapado. Preferência de último tipo em `D.prefs.relatorios`.
19. ✅ **(Fase 8) Integrações seguras frontend-only** — Central de Integrações (`page-integracoes`, em Pessoal) com cards de status para todas as integrações; estrutura `D.integracoes` isolada por `uid` (sem tokens/segredos). **Google Agenda por link** (`googleCalendarLink`, sem OAuth, sem ler agenda) com botões 📅 em Decisões/Metas com prazo e em Compras, além de "Agendar revisão mensal". **Importação CSV/OFX local** (FileReader, nada enviado a servidor) com detecção de delimitador (`,`/`;`/tab), normalização de valores BR (`1.234,56`, `(1.234,56)`, `-45,90`), parsing de datas, **categorização por palavras-chave**, **detecção de duplicados** (`importHash`), preview/revisão editável (destino, categoria, ignorar) e gravação em `D.entradas`/`D.compras`. **Indicadores do Banco Central** (SELIC/CDI/IPCA/USD-BRL via API pública SGS, reaproveitando o `bcbFetch` com proxies CORS) com fallback manual e sem sobrescrever valores manuais sem confirmação. Avisos internos simples (prazos próximos, importação pendente, indicadores desatualizados).
20. ✅ **(Fase 9) Trabalho & Projetos** — primeiro módulo real de produtividade (`page-trabalho`, no menu Trabalho). Estrutura `D.trabalho` ({`projetos`, `tarefas`, `clientes`}) isolada por `uid`. CRUD completo dos três, com abas, filtros, busca e ordenação. Funções `projetoProgress`/`projetoRisco`/`tarefaAtrasada`/`trabalhoResumoData`. Cards de resumo (projetos ativos, tarefas pendentes/atrasadas, próxima entrega, críticos, aguardando) e integração com o **Dashboard Geral** ("o que preciso fazer no trabalho agora?"). Vínculos opcionais com **Metas** e **Decisões** (+ "Criar decisão para este projeto/tarefa", que grava `relacionadaAProjetoId`), botões 📅 de **Google Agenda** em projetos/tarefas com prazo (reaproveitando `googleCalendarLink`), **Relatório de Trabalho** na Central de Relatórios + seção de Trabalho no Relatório Geral, e inclusão no backup/restauração.
21. ✅ **(Fase 10) Carreira & Desenvolvimento Profissional** — módulo real (`page-carreira`, no menu Carreira) com `D.carreira` ({`objetivos`, `competencias`, `cursos`, `networking`, `experiencias`, `planosRenda`}) isolada por `uid`. CRUD das seis entidades em abas, com filtros, busca e ordenação. Funções `carreiraGapCompetencia` (gap nível atual→desejado + risco), `carreiraObjetivoAtrasado`, `carreiraCursoAtrasado`, `carreiraResumoData` e `carreiraProximosPassos`. Cards de resumo (objetivos ativos, competências, maior gap, cursos em andamento, certificações planejadas, próximo prazo, contatos a retomar, plano de renda) e integração com o **Dashboard Geral** ("o que preciso fazer para evoluir profissionalmente?"). Vínculos opcionais com **Trabalho/Projetos**, **Metas**, **Decisões** e **Compras & Desejos**, com botões "Criar meta/decisão" e "Criar compra" para cursos pagos (grava `relacionadaACarreiraId` nas decisões). Botões 📅 de **Google Agenda** em objetivos/cursos/contatos/renda com prazo, **Relatório de Carreira** na Central de Relatórios + seção de Carreira no Relatório Geral, e inclusão no backup/restauração.
22. ✅ **(Fase 11) Patrimônio & Bens** — módulo real (`page-patrimonio`, no menu Patrimônio) com `D.patrimonio` ({`bens`, `passivos`, `manutencoes`, `seguros`, `documentos`}) isolada por `uid`. CRUD das cinco entidades em abas + aba de Resumo patrimonial, com filtros, busca e ordenação. Funções `patValorBem`, `patDepreciacao`, `patGarantiaVencendo`, `patSeguroVencendo`, `patManutencaoProxima`, `patLiquido` (bens − passivos, distinto de `patrimonioLiquido()` das finanças) e `patrimonioResumoData`. Cards de resumo (patrimônio bruto/líquido, passivos, bens ativos, garantias/seguros vencendo, manutenções próximas, maior bem) e integração com o **Dashboard Geral** ("como está meu patrimônio e o que precisa de atenção?"). Vínculos com **Compras** ("Transformar em bem"), **Metas** e **Decisões** (botões "Criar meta/decisão", gravam `relacionadaABemId`), sugestões opcionais para **Finanças** (passivo/seguro → saída fixa, com confirmação), botões 📅 **Google Agenda** para garantias/seguros/manutenções/revisão, **Relatório de Patrimônio** + seção no Relatório Geral, e inclusão no backup/restauração. **Documentos são apenas links manuais validados — sem upload, sem Firebase Storage.**
23. ✅ **(Fase 12) Modularização & Saneamento Técnico** — primeira rodada de redução de dívida técnica, **sem reescrita, sem framework, sem build step**. Estratégia escolhida: **Opção B (modularização gradual sem quebrar globals)**. Helpers puros (sanitização, formatação, datas e parsing) foram extraídos de `app.js` para um novo **`utils.js`**, carregado antes de `app.js`; como ambos são scripts clássicos que compartilham o escopo global, nada quebra, e os helpers também são expostos em `window` (camada de compatibilidade). Criado **`ARCHITECTURE.md`** (modelo de dados, mapa de dependências por domínio, superfície global, plano de modularização incremental, contratos de backend futuro). Criada a pasta **`tests/`** com smoke test que carrega `utils.js` + `app.js` e valida os helpers e a integração. Nenhum módulo, dado ou regra foi alterado.
24. ✅ **(Fase 12.1) Correções técnicas** — `deploy.ps1` passou a publicar **`utils.js`** (sem ele o app quebra em produção); `smoke-core.js` (na raiz) com caminho coerente e o comando `node smoke-core.js`; **Firestore Rules** corrigidas para **cadastro público seguro** (usuário cria só o próprio `users/{uid}` com `role:'user'` e os 5 campos esperados; `update/delete` só admin; sem brecha de escalonamento); `toast` agora usa `textContent`; `innerHTML` de perfil (e-mail/UID) escapados; `auth.js` confirmado fora do deploy (recomendado `git rm auth.js`).
25. ✅ **(Fase 13) Arquitetura B3 + Open Finance (mock/stub/documentação)** — **sem integração real**: sem backend, OAuth, mTLS, tokens, certificados, pacote de acesso, CPF ou senha. Criadas estruturas locais `D.integracoes.b3`, `D.integracoes.openFinance`, `D.b3` e `D.openFinance` (em `userData/{uid}`, nunca em `systemConfig`, nunca tokens); camadas `B3Service`/`OpenFinanceService` (atualmente em **`app.js`**) com retorno padronizado e sincronização real bloqueada (`backend_required`); **importação manual de JSON de teste** com validação, preview escapado e dedupe (não commita em carteira/finanças automaticamente); **consentimento local/documental** (revogável localmente); lógica conceitual **D-1/API Guia**; painéis B3 e Open Finance na **Central de Integrações** com status, avisos obrigatórios e roadmap visual; seção nos relatórios e no backup. Veja **`ARCHITECTURE.md` §9.2** para o detalhamento dos manuais, APIs, consentimento, certificação, tarifação, backend futuro e contratos.
26. ✅ **(Fase 14) Esqueleto do Cloudflare Worker B3 (certificação)** — nova pasta **`worker/`** com o esqueleto de backend para a futura integração com o **ambiente de certificação** da B3. **Sem produção, sem segredos no repo, sem chamada real**: endpoints `GET /health` (público) e `GET /b3/status` + `POST /b3/sync-guide|sync-positions|sync-movements|revoke-local` (exigem Firebase ID Token) respondem `mode: certification_stub`. CORS por allowlist (`ALLOWED_ORIGINS`, nunca `*`), `OPTIONS` tratado, validação de método, logs sanitizados (sem token/CPF/payload), e `verifyFirebaseToken` validando claims (assinatura RS256 esboçada e desligada por padrão). Secrets só via `wrangler secret put` (documentados em `wrangler.toml.example`/`.dev.vars.example`, ambos sem valores reais; `.dev.vars` e `wrangler.toml` no `.gitignore`). No frontend, campo opcional `D.integracoes.b3.backend` (`workerUrl`/`enabled`/`lastCheck`/`mode`) e helper guardado `b3WorkerStatus()` — **não chamado automaticamente**; com Worker desativado (padrão), a Central de Integrações segue em modo manual/mock. Detalhes em **`worker/README.md`**.
27. 🔜 **Backend & melhorias futuras** — finalizar a verificação de assinatura do ID Token (JWKS + `crypto.subtle`), implementar o `b3Client` real contra o ambiente de **certificação** (Pacote de Acesso → API Guia → Position/Movement, cache D-1), rate limit, e o wire opcional do frontend ao Worker; depois Open Finance (OAuth/mTLS, provedor autorizado); modularização (`constants.js`, `reports.js`, `integrations.js`, `b3of_mod.js`); anexos via Firebase Storage; FIPE/mercado; Gmail/Calendar real com OAuth; push.

### Fases 12.1 + 13 — resumo

Como rodar as checagens: `node --check utils.js && node --check app.js && node smoke-core.js`.
**Importante para o deploy:** `utils.js` agora é publicado pelo `deploy.ps1` e é referenciado em
`app.html` antes de `app.js` — se faltar, o app quebra. As integrações B3/Open Finance são, nesta
fase, **arquitetura, mock e documentação**: o app continua 100% funcional sem nenhuma integração
real ativa, e nenhum token/segredo/credencial é coletado ou armazenado.

### Fase 12 — o que mudou na arquitetura

Veja **`ARCHITECTURE.md`** para o documento completo. Em resumo: `app.js` continua sendo o
orquestrador (estado `D`, migração, módulos, render, integrações), mas os **helpers puros**
agora vivem em `utils.js` — `escapeHTML`, `attr`, `_safeUrl`, `fmt`/`R`/`RK`/`P`, `genId`,
`_isPast`, `_diasAte`, `_gcalDate`/`_gcalPlus1`, `_normalizeBRNumber`, `_parseDataImport`,
`_detectDelimiter`, `_splitCSVLine`. Carregamento em `app.html`: `utils.js` → `app.js`.
Como rodar as checagens: `node --check utils.js && node --check app.js && node smoke-core.js`.
Handlers inline e `innerHTML` legados permanecem (seguros — argumentos são IDs internos,
texto livre sempre escapado) e serão migrados gradualmente, módulo a módulo, nas próximas rodadas.

### Como funciona Patrimônio & Bens (Fase 11)

O módulo vive em **`D.patrimonio`** dentro de `userData/{uid}` — nunca em `systemConfig`, nunca em coleção global, sem Firebase Storage. **Bens** têm categoria, status, valores (compra, atual, estimado) e método de valor; o valor exibido segue a regra: `valorAtual` se preenchido, senão depreciação (se o método for depreciação, calculada por taxa anual ou vida útil a partir da data de aquisição), senão valor estimado, senão valor de compra. **Passivos** (financiamentos, empréstimos, parcelamentos) têm saldo devedor e parcela; o **patrimônio líquido** é a soma do valor dos bens ativos menos a soma dos saldos devedores ativos — bens vendidos/doados/perdidos/descartados não contam. **Manutenções** e **seguros** se vinculam a bens e geram alertas quando a data prevista/vencimento se aproxima (30/60 dias). **Documentos** guardam só links (validados por `_safeUrl`, abrindo com `noopener noreferrer`) e metadados — sem upload. O **Dashboard Geral** ganha um card de patrimônio líquido e passos como "verificar N garantias vencendo". Uma compra de Compras & Desejos pode virar um **bem** ("Transformar em bem"); um bem pode gerar **meta** (domínio patrimônio) ou **decisão** (categoria patrimônio), ambos com `relacionadaABemId`; passivos e seguros podem sugerir uma **saída fixa** em Finanças (com confirmação, nunca automático). Tudo que é texto livre é escapado, valores negativos são tratados com segurança, e os cinco acervos entram no **backup** e migram automaticamente em backups antigos sem `D.patrimonio`. **Ainda no roadmap:** upload real de anexos, FIPE/mercado, backend leve e modularização do `app.js`.

### Como funciona Carreira & Desenvolvimento (Fase 10)

O módulo vive em **`D.carreira`** dentro de `userData/{uid}` — nunca em `systemConfig`, nunca em coleção global. **Objetivos** têm horizonte (curto/médio/longo), status, prioridade, área, prazo, nível atual/desejado e próximo passo. **Competências** têm categoria, nível atual e desejado (1–5), prioridade e status; o **gap** é a diferença entre desejado e atual, e a competência fica "em risco" quando o gap é alto e a prioridade também. **Cursos & certificações** têm tipo, status, prazo, carga horária, custo e links; um curso pago pode virar uma **compra** em Compras & Desejos (domínio carreira), uma **meta** ou uma **decisão**. **Networking** guarda contatos profissionais com próximo contato (que vira alerta quando vence) — apenas links manuais, sem integração com LinkedIn/Google Contacts. **Experiências** registram histórico para currículo/portfólio. **Plano de renda** organiza a evolução financeira profissional (planejamento, não promessa de retorno). O **Dashboard Geral** ganha um card de Carreira e passos como "desenvolver competência X (gap N)" ou "retomar contato com N pessoas". Tudo que é texto livre é escapado com `escapeHTML`/`attr`, URLs passam por `_safeUrl` (só `http(s)`), os botões de agenda reaproveitam o link seguro da Fase 8, e as decisões ganharam `relacionadaACarreiraId` de forma defensiva na migração. Os seis acervos entram no **backup** e migram automaticamente em backups antigos sem `D.carreira`. **Ainda no roadmap:** Patrimônio, anexos/documentos, integrações externas reais e refatoração gradual de handlers inline.

### Como funciona Trabalho & Projetos (Fase 9)

O módulo vive em **`D.trabalho`** dentro de `userData/{uid}` — nunca em `systemConfig`, nunca em coleção global. **Projetos** têm nome, descrição, cliente, categoria, status (planejado → em andamento → aguardando cliente/interno → pausado → concluído/cancelado), prioridade, risco, datas, progresso (automático pelas tarefas ou manual), valor estimado, próximo passo e links opcionais a meta/decisão. **Tarefas** pertencem (opcionalmente) a um projeto e têm tipo, status, prioridade, prazo, estimativa/tempo, responsável, tags e vínculos. **Clientes/contextos** são um cadastro simples para associar projetos. O **progresso** de um projeto é 100% se concluído, senão o valor manual, senão a fração de tarefas concluídas; **atraso** considera o prazo vencido (projeto cancelado/tarefa concluída não contam); o **risco** sobe com prazo vencido, várias tarefas atrasadas ou prioridade crítica. O **Dashboard Geral** ganha um card de Trabalho e passos como "resolver N tarefas atrasadas" ou "preparar a próxima entrega". Tudo que é texto livre (nome, descrição, observações, próximo passo, título, tags, contato, links) é escapado com `escapeHTML`/`attr`, URLs passam por `_safeUrl` (só `http(s)`), e os botões de agenda usam o link seguro da Fase 8. Projetos/tarefas/clientes entram no **backup** e migram automaticamente em backups antigos sem `D.trabalho`. **Ainda no roadmap:** Carreira, Patrimônio, visão Kanban/calendário, anexos e integrações externas reais.

### Como funcionam as Integrações (Fase 8)

Tudo é **frontend-only e compatível com GitHub Pages**. **Google Agenda:** `googleCalendarLink({title,details,location,startDate,endDate})` monta uma URL `calendar.google.com/.../render?action=TEMPLATE` com parâmetros `encodeURIComponent`, aberta em nova aba com `noopener,noreferrer` — não há OAuth, não lemos a agenda. **Importação CSV/OFX:** o arquivo é lido só no navegador; o usuário revisa cada linha (data, descrição, valor, destino, categoria, status válida/duplicada/inválida) antes de confirmar; duplicados são sinalizados comparando com `D.entradas`/`D.compras`; texto importado é escapado na exibição e tratado como dado (não fórmula). **Indicadores:** buscados na API pública do BCB (sem chave); se o CORS bloquear ou falhar, o app não quebra e o usuário preenche manualmente — os valores são referência, não verdade absoluta. **`D.integracoes`** guarda apenas modo/preferências e os indicadores (nunca credenciais), dentro de `userData/{uid}`, e entra no backup junto com o resto de `D`. **Por que algumas integrações exigem backend:** B3 não tem fluxo frontend confiável (CORS/sem API pública estável → proxy/Worker); Open Finance exige provedor autorizado, consentimento e backend (nunca senha de banco nem scraping); Gmail/Calendar real exigem OAuth com escopos mínimos e guarda segura de tokens — tudo isso fica no roadmap.

### Como funcionam os Relatórios (Fase 7)

A página **Central de Relatórios** (menu Relatórios) tem um seletor de tipo e controles que aparecem conforme o relatório: mês (mensal), ano (anual) e domínio (metas). O botão **↻ Gerar** monta o preview na tela — nada é impresso automaticamente. **Imprimir / PDF** adiciona a classe `printing-report` ao `body` e chama `window.print()`; o CSS de impressão (`@media print`) esconde sidebar, topo, filtros e botões (`.rel-noprint`/`.no-print`), deixa fundo branco e texto escuro, evita quebrar seções no meio (`break-inside:avoid`) e usa margens A4 — assim o "Salvar como PDF" do navegador gera um documento limpo. O cabeçalho e o rodapé usam a identidade de `systemConfig` (nome, subtítulo, logo, texto de rodapé) quando configurada. Nenhum relatório é salvo em `systemConfig` nem em coleção global — tudo vem de `userData/{uid}` já carregado, respeitando o isolamento por usuário. **Limitações da 1ª versão:** sem gráficos no PDF (apenas tabelas/indicadores), impressão depende do navegador, e o CSV cobre quatro relatórios. **Roadmap:** `html2pdf.js`/`jsPDF` como opção, gráficos exportáveis, agendamento e envio por e-mail (exigem backend).

### Como funciona Compras & Desejos (Fase 6)

O módulo continua salvando em `D.hobbies` dentro de `userData/{uid}` (isolado por usuário) — só a linguagem da interface, do menu e do README passou a ser "Compras & Desejos". Cada item responde "o que faz sentido comprar agora e qual o impacto disso": `analisarCompra(item)` usa regras locais (fundo de compras, excedente do mês, reserva de emergência, prioridade e classe) e devolve `{nivel, recomendacao, label, texto, flags}` — sem IA externa e sem backend, e só opina quando há dados financeiros. O **Fundo de Compras** (antigo fundo de hobby) mostra saldo, aporte e quantos meses faltam para o próximo item prioritário. Compras podem **gerar uma decisão** (categoria `compra`, custo pré-preenchido) ou uma **meta** (`dominio:'compra'`, `unidade:'dinheiro'`, `valorAlvo` = custo) com um clique, sem duplicar vínculos existentes. A migração é defensiva: itens antigos recebem domínio inferido da categoria (`h_setup→tecnologia`, `h_rel→patrimônio`, `h_cafe`/`h_games→lazer`), `custoTotal = preço + frete` e os demais campos com padrões — backups antigos seguem válidos. Links externos só abrem se forem `http(s)` e usam `rel="noopener noreferrer"`.

### Como funcionam as Metas Integradas (Fase 5)

Cada meta vive em `D.metas[]` dentro de `userData/{uid}` (mesmo isolamento por usuário; nada global). A diferença entre uma **meta financeira** e uma **meta geral** é o par `dominio`+`unidade`: metas com `dominio:'financeiro'` e `unidade:'dinheiro'` alimentam o Dashboard Financeiro e o relatório financeiro (via `metaInfo`, preservado); as demais (saúde por quantidade, carreira por percentual, viagem por checklist, hábito por manual, etc.) aparecem só no módulo de Metas e no Dashboard Geral. O progresso é calculado por `metaProgress(meta)`, que devolve `{pct, pctVis, label, concluida, atrasada, defined}` conforme a unidade — delegando a `metaInfo` quando é dinheiro. A migração é defensiva: backups antigos continuam válidos e o backup JSON já inclui as metas (com contagem no resumo de importação). As Decisões já podem se vincular a metas (com ícone de domínio e progresso), e o campo de vínculo meta↔compra está preparado para a futura evolução de Compras & Desejos.

### Como funciona o Módulo de Decisões (Fase 4)

Cada decisão vive em `D.decisoes[]` dentro de `userData/{uid}` (mesmo isolamento por usuário das demais informações; nenhuma decisão é global nem visível a outro usuário). Campos principais: `titulo`, `descricao`, `categoria`, `status`, `prioridade`, `prazo`, `custoEstimado`, `recorrencia`/`valorRecorrente`, quatro eixos de impacto (financeiro/profissional/pessoal/lazer), `beneficios`/`riscos`/`alternativas`, `decisaoFinal`, `observacoes` e vínculos opcionais (`relacionadaACompraId`, `relacionadaAMetaId`). A **análise estratégica** usa apenas regras locais e os dados financeiros já existentes (`caixaAtual`, `metaEmergencia`, `invDisp`) — sem IA externa, sem backend — e só opina quando há dados financeiros suficientes. `migrateData` adiciona `decisoes:[]` e completa campos faltantes, então backups antigos continuam válidos; o backup JSON já inclui as decisões.

### Como funciona a navegação (Fase 3)

A sidebar é **orientada a dados**: `renderSidebar()` lê `SYSCFG.menu` (global, editável por superadmin) e, se ausente/ inválido, usa `DEFAULT_MENU` (fallback seguro). Cada categoria tem `id/label/icon/order/active/minRole/items[]`; cada item aponta para uma `page`. Itens com `minRole:'superadmin'` só aparecem para administradores. Telas financeiras existentes foram preservadas (mesmos `page` ids). Módulos ainda não construídos abrem uma página de **placeholder** elegante. O **Dashboard Geral** responde "como está minha vida agora?" usando só dados já existentes (finanças, reserva, metas, hobbies/compras) e prepara espaço para os módulos futuros; o **Dashboard Financeiro** continua intacto. Para tornar o menu configurável por interface (CRUD), basta gravar um array em `systemConfig/app.menu` — a estrutura e o merge já estão prontos.

### Configurações: globais vs por usuário

- **Globais** (`systemConfig/app`): identidade visual, nome do sistema, cores, módulos/menus. Leitura por qualquer autenticado (necessária para renderizar); **escrita só por superadmin**. Nunca contém dados pessoais, tokens ou segredos (as regras bloqueiam campos `token`/`secret`/`apiKey`).
- **Por usuário** (`userData/{uid}.prefs`): tema preferido, sidebar recolhida, dashboard inicial, módulos favoritos. Isoladas por dono; um usuário nunca lê preferências de outro.

### Arquitetura de integrações (roadmap)

Toda integração seguirá um contrato comum `{ ok, provider, source, updatedAt, stale, mode, data, error }`, em módulos separados, **sem quebrar o app se a fonte falhar** e sempre com **fallback manual** e status visível (fonte / última atualização). Classificação por viabilidade:

| Integração | Viabilidade | Camada |
|---|---|---|
| Links "Adicionar à Google Agenda" | **Frontend-only** (agora) | `calendar-integration.js` (Fase 1: gera URLs de evento) |
| Importação CSV/OFX de extratos | **Frontend-only** (curto prazo) | parser + prévia + dedupe, isolado por `uid` |
| Indicadores macro (SELIC/CDI/IPCA) | Frontend via **API do Banco Central** (CORS aberto) | `market-data.js` + fallback manual |
| Cotações B3/ações | **Exige proxy** (CORS/sem API pública) | Cloud Function / Cloudflare Worker |
| Google Calendar (ler/criar eventos) | **Exige backend** (OAuth) | Cloud Function; tokens nunca em texto puro |
| Open Finance / bancos | **Exige provedor + backend** | nunca pedir senha bancária nem scraping; consentimento + criptografia |
| Gmail / e-mail | **Exige backend** (OAuth, escopos mínimos) | só roadmap |
| Notion/Jira/Trello/Slack | Manual primeiro (links); OAuth depois | roadmap |
| Anexos/documentos | Links externos (Fase 1) → Firebase Storage com regras por `uid` (Fase 2) | roadmap |

**Diagnóstico da B3:** não há integração no código — indicadores e preços são manuais. A B3 não expõe API pública com CORS para frontend; qualquer cotação confiável exige proxy seguro (Cloud Function/Worker), nunca chave no frontend. O app opera 100% no manual, então nada quebra sem integração.

### CRUDs

Cada CRUD segue o padrão: listagem, criar/editar/excluir, ativar/inativar, filtros/busca/ordenação, status e prioridade, `uid` do dono, validação, confirmação de exclusão, feedback, empty state, proteção XSS e isolamento por usuário. CRUDs **administrativos** (usuários, módulos, configurações globais) são restritos a superadmin; CRUDs **por usuário** ficam sob `userData/{uid}`.

---

---

## ✅ Passos manuais obrigatórios (e por que cada um importa)

1. **Revogar o token GitHub antigo** (GitHub → Settings → Developer settings → PATs → *Revoke*). Removê-lo do código **não basta**: ele segue válido no histórico do Git e qualquer um com acesso ao repo pode usá-lo.
2. **Confirmar que o token revogado não está mais ativo** (a lista de tokens deve mostrá-lo como revogado/expirado).
3. **Remover o `auth.js` do versionamento:** `git rm auth.js` (ou `git rm --cached auth.js`). Ele é código legado inseguro; mesmo neutralizado, não deve ser publicado nem rastreado.
4. **Publicar o `firestore.rules` no Firebase Console** (Firestore → Regras). A segurança real mora aqui — sem publicar, o isolamento por usuário não vale no servidor.
5. **Garantir `role: "superadmin"`** no seu `users/{uid}` (Console do Firestore). É o que libera o painel de usuários e o módulo de Identidade & Cores.
6–13. **Testar:** login, cadastro, reset por e-mail, salvar dados, isolamento entre dois usuários, usuário comum tentando abrir a área admin, backup/importação e deploy. Cada teste valida uma fronteira diferente (auth, persistência, isolamento, gating de UI, e que o deploy não publica arquivos inseguros).

*FinançasPRO — JavaScript vanilla, sem build, pronto para GitHub Pages.*
