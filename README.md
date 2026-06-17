# 💰 Controle Financeiro — Firebase

Sistema de controle financeiro pessoal com autenticação Firebase, banco de dados Firestore e hospedagem no GitHub Pages.

## 📁 Arquivos

```
├── index.html         — Login + Painel de administração
├── app.html           — Dashboard financeiro completo
├── firestore.rules    — Regras de segurança do Firestore
└── README.md
```

## 🚀 Setup completo (faça uma vez)

### 1. Configurar regras do Firestore

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **Firestore → Regras**
3. Substitua todo o conteúdo pelo conteúdo do arquivo `firestore.rules`
4. Clique em **Publicar**

### 2. Criar o usuário admin no Firestore

1. Vá em **Authentication → Usuários** no Firebase Console
2. Clique em **Adicionar usuário**
5. Copie o **UID** gerado

6. Vá em **Firestore → Dados**
7. Clique em **Iniciar coleção** → nome: `users`
8. ID do documento: cole o **UID** copiado
9. Adicione os campos:
   - `email` (string): `admin@controle.local`
   - `displayName` (string): `Administrador`
   - `role` (string): `superadmin`
   - `createdAt` (string): data atual
   - `uid` (string): o mesmo UID

### 3. Fazer upload para o GitHub

1. Acesse seu repositório: https://github.com/Dudys37/controle-financeiro
2. Clique em **Add file → Upload files**
3. Faça upload de `index.html` e `app.html`
4. Clique em **Commit changes**

### 4. Acessar o sistema

URL: **https://dudys37.github.io/controle-financeiro**

Login: e-mail e senha do admin criado no passo 2.

## 🔐 Credenciais padrão

Configure você mesmo no Firebase Authentication (passo 2 acima).

## ✨ Funcionalidades

- Login seguro via Firebase Authentication
- Dados salvos no Firestore (nuvem, tempo real)
- Particionamento por usuário (cada um vê só seus dados)
- Super Admin pode criar e gerenciar usuários
- Dashboard com fluxo de caixa, ARCA, projeções
- 🎯 Plano de Aposentadoria: simulação mês a mês (salário → contas → aportes → caixinhas/FIIs/ações), marcos financeiros, gráficos e data estimada de independência financeira (renda passiva de R$ 10.000/mês)
- Tema claro/escuro
