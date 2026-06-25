# FinançasPRO — Cloudflare Worker B3 (Fase 14, esqueleto)

Esqueleto de backend para a **futura** integração com o **ambiente de certificação**
da B3 (Área do Investidor). **Esta fase não tem produção, não tem segredos no
repositório e não faz nenhuma chamada real à B3.** Todos os endpoints B3 respondem
`mode: "certification_stub"` até que credenciais de certificação sejam configuradas.

> O frontend (GitHub Pages) **continua funcionando sem este Worker**: enquanto
> `D.integracoes.b3.backend.enabled` for `false` (padrão), a Central de Integrações
> permanece em modo manual/mock, exatamente como na Fase 13.

## Estrutura

```
worker/
  README.md
  package.json            # "type":"module" (ESM) + scripts dev/deploy/check
  wrangler.toml.example   # copie para wrangler.toml (gitignored) e ajuste
  .dev.vars.example       # copie para .dev.vars (gitignored) — só placeholders
  .gitignore              # protege .dev.vars, wrangler.toml, node_modules, etc.
  src/
    index.js              # roteador: CORS, /health, gating de auth, rotas B3
    routes/b3.js          # tabela de rotas B3 → b3Client (stub)
    services/
      b3Client.js         # STUB — nenhuma chamada real à B3
      firebaseAuth.js     # verifyFirebaseToken (claims agora; assinatura esboçada)
    utils/
      responses.js        # respostas padronizadas (health, b3CertStub, error)
      security.js         # CORS allowlist, preflight, safeLog
```

## Endpoints

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| GET | `/health` | pública | `{ ok:true, service, env, updatedAt }` |
| GET | `/b3/status` | Firebase ID Token | `certification_stub` |
| POST | `/b3/sync-guide` | Firebase ID Token | `certification_stub` |
| POST | `/b3/sync-positions` | Firebase ID Token | `certification_stub` |
| POST | `/b3/sync-movements` | Firebase ID Token | `certification_stub` |
| POST | `/b3/revoke-local` | Firebase ID Token | `certification_stub` |

Contrato dos endpoints B3:

```json
{
  "ok": false,
  "provider": "b3",
  "mode": "certification_stub",
  "source": "Cloudflare Worker",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "referenceDate": null,
  "data": null,
  "error": "Worker B3 criado, mas credenciais de certificação ainda não configuradas."
}
```

## Autenticação (Firebase ID Token)

O frontend, no futuro, enviará `Authorization: Bearer <Firebase ID Token>`.

- **Token ausente → `401`** (endpoints B3 nunca aceitam chamada anônima).
- Nesta fase, `verifyFirebaseToken` valida **presença e claims** (`iss`/`aud` quando
  `FIREBASE_PROJECT_ID` está configurado, além de `sub` e `exp`).
- A **verificação de assinatura RS256** contra as chaves públicas do Google está
  **esboçada** (`verifySignatureRS256`) e desligada por padrão, para nunca marcar um
  token como verificado indevidamente. Será finalizada na fase de certificação
  (importar o certificado X.509 → SPKI e usar `crypto.subtle.verify`).
- **DEV local opcional:** com `B3_ENV=local` **e** `B3_DEV_ALLOW_UNVERIFIED=true`, um
  token estruturalmente válido é aceito **sem** verificação de assinatura, apenas para
  testar o fluxo do stub. **Nunca** use isso em certificação/produção, e **nunca**
  aceita chamada anônima (o token continua obrigatório).

## CORS

Allowlist via `ALLOWED_ORIGINS` (CSV). Nunca usa `*`. Responde `OPTIONS` (preflight):
`204` quando a origem está na allowlist, `403` caso contrário. Em `B3_ENV=local` sem
`ALLOWED_ORIGINS`, libera apenas `localhost`/`127.0.0.1`.

## Variáveis e secrets

Variáveis **não sensíveis** ficam em `wrangler.toml` (`[vars]`): `B3_ENV`,
`FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS`. **Segredos nunca vão ao repositório** —
configure com `wrangler secret put`:

```bash
wrangler secret put B3_BASE_URL
wrangler secret put B3_CLIENT_ID
wrangler secret put B3_CLIENT_SECRET
wrangler secret put B3_CERT
wrangler secret put B3_KEY
```

`.dev.vars` (local, **gitignored**) e `wrangler.toml` (real, **gitignored**) nunca são
commitados — apenas os arquivos `*.example`.

## Como rodar localmente

```bash
cd worker
cp wrangler.toml.example wrangler.toml      # ajuste vars; não coloque segredos
cp .dev.vars.example .dev.vars              # placeholders locais
npm install --save-dev wrangler             # se ainda não tiver o wrangler
npx wrangler dev                            # sobe o Worker local

# Checagens de sintaxe (sem wrangler):
npm run check                               # node --check src/index.js
node --check src/routes/b3.js src/services/b3Client.js src/services/firebaseAuth.js
```

Exemplos com `curl` (Worker local em http://localhost:8787):

```bash
curl -s http://localhost:8787/health
# {"ok":true,"service":"financaspro-b3-worker","env":"local",...}

curl -s http://localhost:8787/b3/status            # sem token → 401
curl -s -H "Authorization: Bearer <ID_TOKEN>" http://localhost:8787/b3/status
# (com B3_DEV_ALLOW_UNVERIFIED=true em DEV) → certification_stub
```

## Fluxo real futuro (certificação) — API Guia → Position/Movement

1. **Pacote de Acesso**: gerar o `.zip` de credenciais no portal *B3 For Developers*
   (ambiente de Certificação é gratuito).
2. **API Guia (Produtos Atualizados)**: descobrir quais CPF/CNPJ tiveram movimentação
   na data de referência (**D-1**), evitando chamadas desnecessárias.
3. **Position/Movement**: buscar apenas os documentos atualizados retornados pela Guia.
4. Respeitar **D-1**, **não consultar o mesmo investidor mais de 1×/dia**, e tratar
   **consentimento revogado/expirado** (a revogação real ocorre na Área Logada da B3).

## Por que não há credenciais reais

A integração real exige contratação/licenciamento B3 (apenas pessoa jurídica),
self-assessment de segurança, pacote de acesso e, possivelmente, mTLS/OAuth — nada
disso pode residir no frontend nem ser commitado. Segredos, certificados e tokens
ficam **apenas** no backend (secrets do Worker), nunca no GitHub Pages.

## Limitações atuais

- Todos os endpoints B3 são **stub** (`certification_stub`); nenhuma chamada real.
- Verificação de **assinatura** do ID Token ainda é esboço (claims já validados).
- **Rate limit** é apenas roadmap (documentado); ainda não implementado.

## Próximos passos para certificação

1. Finalizar `verifySignatureRS256` (JWKS do Google + `crypto.subtle`).
2. Implementar `b3Client` real contra o **ambiente de Certificação** (Pacote de Acesso → API Guia → Position/Movement), com cache D-1.
3. Adicionar rate limit (KV/Durable Objects) e métricas.
4. Wire opcional no frontend (`D.integracoes.b3.backend.workerUrl`/`enabled`) para consumir o Worker quando configurado.
