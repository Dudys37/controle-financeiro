# 💰 Controle Financeiro

Sistema pessoal de controle financeiro com autenticação multi-usuário, dashboard interativo, método ARCA de investimentos e projeções de patrimônio.

## ✨ Funcionalidades

- **Multi-usuário** com roles (Super Admin / Usuário comum)
- **Dashboard** com visão geral anual, blocos por ano colapsáveis e detalhamento mensal
- **Fluxo de caixa** com cálculo automático do disponível para investir
- **Controle de dívidas** separado entre contas fixas e variáveis
- **Cartões de crédito** com controle de limite e saldo em aberto
- **Método ARCA** (Ações Brasileiras, Real Estate, Caixa, Ativos Internacionais)
- **Carteira de ativos** com projeções de 1 a 30 anos via juros compostos
- **Indicadores** CDI e IPCA
- **Tema claro/escuro**
- **100% local** — sem servidor, tudo via `localStorage`

## 🚀 Como usar

### Hospedagem no GitHub Pages

1. Faça fork ou clone este repositório
2. Vá em **Settings → Pages**
3. Em *Source*, selecione **main** e pasta **/ (root)**
4. Acesse: `https://seu-usuario.github.io/controle-financeiro`

### Localmente

Basta abrir o arquivo `index.html` no navegador. Não precisa de servidor.

> **Atenção:** Para usar com `auth.js` carregando corretamente pelo protocolo `file://`, use o Live Server do VSCode ou qualquer servidor HTTP local simples (`python3 -m http.server 8080`).

## 🔐 Credenciais padrão

| Usuário | Senha | Perfil |
|---------|-------|--------|
| `admin` | `92466388Dudu@` | Super Admin |

**Recomendado:** altere a senha do admin após o primeiro acesso.

## 📁 Estrutura

```
├── index.html   — Tela de login e painel de administração
├── app.html     — Dashboard principal (requer autenticação)
├── auth.js      — Módulo de autenticação e gerenciamento de usuários
└── README.md    — Este arquivo
```

## 🛡️ Segurança

Os dados são armazenados no `localStorage` do navegador, particionados por usuário. Não há comunicação com servidores externos. Para ambientes de produção com dados sensíveis, considere uma solução com backend.

## 📊 Método ARCA

Baseado na metodologia do Primo Rico:
- **A** — Ações Brasileiras
- **R** — Real Estate (FIIs)
- **C** — Caixa (Tesouro Selic, CDB, fundos DI)
- **A** — Ativos Internacionais (ETFs globais, BDRs)

O sistema recomenda **100% em Caixa** até atingir 6 meses de custo fixo como reserva de emergência.
