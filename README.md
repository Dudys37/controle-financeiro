# 💰 FinançasPRO — Controle Financeiro Pessoal

Aplicação web de finanças pessoais com autenticação Firebase, banco Firestore e hospedagem no GitHub Pages. Arquitetura single-file em JavaScript vanilla, sem build.

**Acesso:** https://dudys37.github.io/controle-financeiro

## 🧱 Stack

- HTML/CSS/JS vanilla (sem framework, sem build)
- Firebase Authentication (login)
- Cloud Firestore (dados por usuário, em tempo real)
- Chart.js (gráficos)
- GitHub Pages (hospedagem estática)

## 📁 Arquivos versionados

```
├── index.html        — Login + carregamento do app
├── app.html          — Interface principal (markup + estilos)
├── app.js            — Lógica da aplicação
├── auth.js           — Sessão / autenticação
├── firestore.rules   — Regras de segurança do Firestore
└── README.md
```

> ⚠️ **Nunca versione segredos.** Scripts de deploy, tokens de acesso, chaves privadas
> ou arquivos `.env` **não** devem ir para o repositório. Mantenha-os fora do Git
> (`.gitignore`) e use variáveis de ambiente. A configuração *web* do Firebase
> (`apiKey`, `projectId`) pode ficar no cliente — ela não autoriza acesso; quem
> protege os dados são as `firestore.rules`.

## ✨ Funcionalidades

- **Autenticação** via Firebase; dados particionados por usuário (cada um vê só os seus)
- **Dashboard** com fluxo de caixa, distribuição ARCA e projeções
- **🩺 Saúde financeira** — insights dinâmicos (taxa de poupança, fôlego da reserva, comprometimento da renda, concentração de gastos, tendência, drift ARCA, ritmo da aposentadoria) com score
- **Entradas / Saídas (fixas e variáveis) / Compras parceladas / Faturas de cartão**
- **🎯 Metas & Orçamentos** — objetivos com progresso (ligados a caixa, patrimônio ou um ativo) e limites de gasto por categoria com alerta de estouro
- **📄 Relatórios** — fechamento mensal e evolução anual, exportáveis em PDF (impressão)
- **🏷️ Categorias editáveis** — nome, ícone e cor personalizáveis, refletindo em todo o sistema
- **📈 Investimentos** — carteira por bucket ARCA, indicadores e dividend yield por ativo
- **🎯 Plano de Aposentadoria** — simulação mês a mês totalmente dinâmica: aporte (renda − contas − meta CC) preenche marcos financeiros ordenados; contas lidas das suas Fixas/Compras; renda fixa rende juros e FII/ações geram dividendos; estimativa da data de independência financeira
- **Backup/exportação** (JSON e CSV) e **tema claro/escuro**

## 🔐 Segurança

- Acesso aos dados controlado server-side pelas `firestore.rules` (somente o dono lê/escreve seu `userData`; gestão de usuários restrita a `superadmin`).
- Nenhuma credencial de usuário fica no código: contas e senhas são gerenciadas no Firebase Authentication.
- A configuração do projeto Firebase no cliente é pública por design e não substitui as regras de acesso.

## ⚙️ Configuração (uma vez)

1. Publicar o conteúdo de `firestore.rules` no Firebase Console (Firestore → Regras).
2. Criar os usuários no Firebase Authentication e seus perfis na coleção de usuários do Firestore (papéis e estrutura conforme as regras). Mantenha esse procedimento em documentação privada, fora do repositório público.
3. Publicar `index.html`, `app.html`, `app.js` e `auth.js` no GitHub Pages.
