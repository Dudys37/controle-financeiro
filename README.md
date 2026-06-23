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

```
├── index.html        — Login / cadastro / redefinição de senha (Firebase Auth)
├── app.html          — Interface principal (markup + estilos + wiring Firebase)
├── app.js            — Lógica da aplicação e renderização
├── firestore.rules   — Regras de segurança (publicar no Firebase Console)
├── deploy.ps1        — Deploy seguro (token via variável de ambiente)
├── .gitignore        — Arquivos que não devem ser versionados
└── README.md
```

**Não é mais usado:** `auth.js` foi **descontinuado** (era autenticação local insegura com senha hardcoded). A autenticação é feita **exclusivamente pelo Firebase Authentication**. Recomenda-se removê-lo do repositório: `git rm auth.js`.

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
18. 🔜 **Relatórios + PDFs**, **Integrações** (ver tabela abaixo) e migração gradual de handlers inline legados.

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
