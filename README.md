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
8. 🔜 **Módulo de Configurações do Sistema** — identidade (nome, logo, cores via CSS variables), módulos e menus parametrizáveis (`systemConfig` global + preferências por `uid`)
9. 🔜 **Menus/módulos/categorias dinâmicos** (fim do hardcode de menu no HTML)
10. 🔜 **Metas integradas** (financeira, profissional, pessoal, lazer, patrimônio…) e **módulo de Decisões** (impacto financeiro/profissional/pessoal, prós/contras, status)
11. 🔜 **Compras Futuras** (já há base no módulo Hobbies & Aquisições), **Projetos/Tarefas**, **Patrimônio**
12. 🔜 **Relatórios parametrizáveis** + PDFs (via `window.print` com CSS de impressão ou `html2pdf.js`)
13. 🔜 **Integrações de mercado** isoladas em `market-data.js` (CDI/SELIC/IPCA via Banco Central; cotações com fallback manual e status “última atualização / fonte”). Fontes que exijam segredo/CORS → Cloud Functions ou Cloudflare Worker, nunca chave no frontend.

### CRUDs

Cada CRUD segue o padrão: listagem, criar/editar/excluir, ativar/inativar, filtros/busca/ordenação, status e prioridade, `uid` do dono, validação, confirmação de exclusão, feedback, empty state, proteção XSS e isolamento por usuário. CRUDs **administrativos** (usuários, módulos, configurações globais) são restritos a superadmin; CRUDs **por usuário** ficam sob `userData/{uid}`.

---

*FinançasPRO — JavaScript vanilla, sem build, pronto para GitHub Pages.*
