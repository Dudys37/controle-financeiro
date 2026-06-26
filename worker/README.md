# FinançasPRO — Cloudflare Worker B3 (Fase 17)

Backend para a **futura** integração com o **ambiente de certificação** da B3. Nesta fase o
Worker já faz **validação real do Firebase ID Token** (assinatura RS256 + claims) e tem o
`b3Client` **preparado para certificação**, mas **sem produção, sem segredos no repositório e
sem chamadas reais à B3** (`B3_ENABLE_REAL_CALLS` default `false`). Os endpoints B3 respondem
um stub seguro conforme o estado da configuração.

> O frontend (GitHub Pages) **continua funcionando sem este Worker**: enquanto
> `D.integracoes.b3.backend.enabled` for `false` (padrão), a Central de Integrações
> permanece em modo manual/mock.

## Estrutura

```
worker/
  README.md  package.json (ESM)  wrangler.toml.example  .dev.vars.example  .gitignore
  src/
    index.js              # roteador: CORS → /health → gate de origem → auth → rotas B3
    routes/b3.js          # tabela de rotas → b3Client
    services/
      b3Client.js         # config de certificação + helpers D-1 + stub (sem chamada real)
      firebaseAuth.js     # verifyFirebaseToken REAL (RS256 + JWKS + claims)
    utils/
      responses.js        # respostas padronizadas
      security.js         # CORS allowlist, preflight, safeLog
```

## Endpoints

| Método | Rota | Auth | Resposta |
|---|---|---|---|
| GET | `/health` | pública | `{ ok:true, service, env, updatedAt }` |
| GET | `/b3/status` | Firebase ID Token | stub conforme config |
| POST | `/b3/sync-guide` | Firebase ID Token | stub conforme config |
| POST | `/b3/sync-positions` | Firebase ID Token | stub conforme config |
| POST | `/b3/sync-movements` | Firebase ID Token | stub conforme config |
| POST | `/b3/revoke-local` | Firebase ID Token | stub conforme config |

`mode` da resposta B3 (token válido): `certification_config_missing` (faltam secrets),
`certification_stub` (config completa, mas `B3_ENABLE_REAL_CALLS=false`) ou `unsupported_env`
(se `B3_ENV=production`). Sempre `ok:false`, com `requestedBy` (uid truncado).

## Autenticação (Firebase ID Token) — validação REAL

`verifyFirebaseToken(request, env)`:

1. Extrai `Authorization: Bearer <token>`; ausente → `401` ("Token ausente.").
2. Decodifica header/payload; valida `alg === "RS256"` e `kid` presente.
3. Busca o **JWKS público do Google** (`securetoken`), com **cache em memória** do isolate
   respeitando `Cache-Control: max-age`; se o `kid` não estiver no cache, faz **um** refresh.
4. Importa a chave (`crypto.subtle.importKey('jwk', …, RSASSA-PKCS1-v1_5/SHA-256)`) e
   **verifica a assinatura** com `crypto.subtle.verify`.
5. Valida claims: `iss = https://securetoken.google.com/<FIREBASE_PROJECT_ID>`,
   `aud = <FIREBASE_PROJECT_ID>`, `sub` não vazio, `exp > agora`, `iat ≤ agora + 60s`.
6. Retorna `uid`, `email` e claims mínimas. **Nunca** loga nem devolve o token.

Qualquer falha (token malformado, `aud`/`iss` errados, expirado, assinatura inválida,
`kid` desconhecido) → `401` ("Token inválido ou expirado."). Se `FIREBASE_PROJECT_ID` não
estiver configurado (e não for o modo DEV), os endpoints protegidos falham com `401`.

### Modo DEV não verificado (restrito)

Só funciona com **`B3_ENV=local` E `B3_DEV_ALLOW_UNVERIFIED=true`** (default `false`). Aceita um
token estruturalmente válido **sem** verificar a assinatura, retorna `mode:"dev_unverified"`
(logado), e **nunca** atende chamada anônima. Em `certification`/`production` a flag é ignorada
(a assinatura é sempre exigida). Risco: use apenas em desenvolvimento local.

## CORS

Allowlist via `ALLOWED_ORIGINS` (CSV), nunca `*`. `OPTIONS` → `204` se a origem está na lista,
`403` caso contrário; em `B3_ENV=local` sem lista, libera só `localhost`/`127.0.0.1`. Nos
endpoints B3, se houver header `Origin` e ele não estiver na allowlist → `403` (curl sem
`Origin` não é afetado).

## Variáveis e secrets

Não sensíveis em `wrangler.toml` (`[vars]`): `B3_ENV`, `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS`,
`B3_ENABLE_REAL_CALLS` (default `false`), `B3_ACCESS_PACKAGE_ID`, `B3_TIMEOUT_MS` (e, opcional,
`FIREBASE_JWKS_URL`, `B3_DEV_ALLOW_UNVERIFIED`). **Segredos só via `wrangler secret put`**:

```bash
wrangler secret put B3_BASE_URL
wrangler secret put B3_CLIENT_ID
wrangler secret put B3_CLIENT_SECRET
wrangler secret put B3_CERT
wrangler secret put B3_KEY
```

`getB3Config(env)` lê tudo expondo apenas **booleanos** (`hasClientSecret`, `hasCert`, …),
nunca os valores. `assertB3CertificationConfig(env)` bloqueia `production`, exige `local`/
`certification` e checa a completude (sem listar nomes de secrets na resposta).

## Helpers D-1 / API Guia (preparados, sem chamada real)

`b3ReferenceDate(now)` (D-1, `YYYY-MM-DD`), `isB3DataAvailable(now)` (dados a partir das 8h —
na implementação real considerar `America/Sao_Paulo`), `shouldSyncB3(lastSync, refDate)` (evita
repetir no mesmo dia). Fluxo real futuro: **Pacote de Acesso → API Guia (Produtos Atualizados,
D-1) → Position/Movement** só para documentos atualizados; não consultar o mesmo investidor
mais de 1×/dia; tratar consentimento revogado/expirado.

## Como rodar localmente

```bash
cd worker
cp wrangler.toml.example wrangler.toml && cp .dev.vars.example .dev.vars
npm install --save-dev wrangler
npx wrangler dev
npm run check        # node --check src/index.js
```

Testes:

```bash
curl -s http://localhost:8787/health                                   # ok:true
curl -s http://localhost:8787/b3/status                                # 401 (sem token)
curl -s -H "Authorization: Bearer <ID_TOKEN_REAL>" http://localhost:8787/b3/status
# → mode certification_config_missing / certification_stub (token válido)
```

Para obter um **ID Token real**: logue no app e use `firebase.auth().currentUser.getIdToken()`
no console do navegador. Os **casos negativos** (sem token, token inválido/expirado, `aud`/`iss`
errados, assinatura inválida) são cobertos por harness local com par de chaves RSA + JWKS mock.

## Frontend sem Worker / wire opcional

Padrão: `D.integracoes.b3.backend.enabled=false` → nada muda. O painel B3 tem uma subseção
**"Backend (Worker)"** para informar `workerUrl`, habilitar, **testar conexão** e ver o status.
Ao testar, o app anexa o **Firebase ID Token** (`Authorization: Bearer`) — o token **nunca** é
salvo no Firestore nem exibido. `workerUrl` é validado por `_safeUrl` e exige `https://` (ou
`http://localhost` em dev). Qualquer falha mantém o modo manual/mock e não quebra a Central.

## Governança (Fase 16): rate limit · métricas · auditoria · D-1

**Rate limit** por `(endpoint, uidHash)` em janela fixa. Armazenamento: **Cloudflare KV**
(binding `B3_RATE_LIMIT_KV`, opcional) ou **memória do isolate** (fallback dev/smoke).
Limites configuráveis (default): `/b3/status` 30/5min · `/b3/sync-guide` 5/dia ·
`/b3/sync-positions` 3/dia · `/b3/sync-movements` 3/dia · `/b3/revoke-local` 10/dia.
Ao estourar → `429` `mode:"rate_limited"` com `Retry-After`, `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`. Sem token → `401` (não `429`); `Origin` fora da
allowlist → `403` (não consome rate limit). `/health` não é limitado.

**Controle D-1 / anti-repetição** (`services/b3Sync.js`): `b3SyncKey`, `getLastB3Sync`,
`setLastB3Sync`, `shouldAllowB3Sync` guardam **apenas metadados** por `(uidHash, type,
referenceDate)` — `{ uidHash, type, referenceDate, status, updatedAt, count }`, **nunca**
payload da B3. Em `sync-guide/positions/movements`, a resposta inclui `alreadySyncedToday` e,
quando repetido no mesmo `referenceDate` (D-1), um `note` orientando a não repetir. Helpers
`b3ReferenceDate`/`isB3DataAvailable`/`shouldSyncB3` em `services/b3Client.js`.

**Hash de uid** (`utils/security.js`): `hashUid(uid, env)` = SHA-256 (`crypto.subtle.digest`)
com salt opcional `B3_UID_HASH_SALT` (secret) → 16 hex; fallback `shortUid` (8 chars). Logs e
auditoria usam `uidHash`, nunca o uid completo.

**Auditoria** (`services/audit.js`): `auditEvent` emite `AUDIT {…}` com whitelist
(`event, uidHash, endpoint, method, status, mode, referenceDate, timestamp, errorCode`) —
nunca token/CPF/payload/secret. Desligável com `B3_AUDIT_ENABLED=false`.

**Métricas** (memória do isolate, sem dados pessoais): contadores por endpoint/dia,
autorizadas, rejeições (auth/cors/rate), modos (`certification_stub`/`config_missing`/
`unsupported_env`) e último erro resumido. Endpoint admin **`GET /b3/metrics`** exige token
válido **e** uid na allowlist `B3_METRICS_ADMIN_UIDS`, e só responde com `B3_METRICS_ENABLED=true`
(senão `404`); allowlist vazia → `403`. Não expõe uids, segredos nem dados de outros usuários.

**Duração:** `index.js` mede `durationMs` por request e inclui no `safeLog`.

## Pré-certificação (Fase 17): anti-repetição rígido · cache D-1 · guide_required

**Anti-repetição rígido.** A primeira `sync-guide/positions/movements` para um `referenceDate`
(D-1) grava metadados + cache. Na **repetição** no mesmo D-1, o comportamento segue a estratégia
`B3_REPEAT_SYNC_STRATEGY` (default **`cache`**):

- `block` → `already_synced` (`ok:false`).
- `cache` → `cache_hit` (`ok:true`, `data.cached:true`, `summary` numérico) se houver cache;
  sem cache, faz fallback seguro para `already_synced`.
- `allow_stub_only` → só com `B3_ENABLE_REAL_CALLS=false`: permite o stub mas marca
  `alreadySyncedToday:true`; com real calls ligadas, vira `already_synced` (não repete real).

**Cache D-1 (`services/b3Sync.js`).** Chaves `b3sync:${envName}:${type}:${uidHash}:${refDate}`
(meta) e `b3cache:${envName}:${type}:${uidHash}:${refDate}` (cache). Conteúdo do cache: só
`{ uidHash, type, referenceDate, status, mode, updatedAt, summary:{count,productsUpdated}, ttlSeconds }`
— **nunca** payload da B3, token, CPF, Authorization, secrets ou pacote de acesso (uma função
`sanitizeSummary` garante que só números entram no `summary`). TTL `B3_SYNC_CACHE_TTL_SECONDS`
(default 48h); em KV via `expirationTtl`, em memória limpando ao expirar.

**Store do cache.** Binding **`B3_SYNC_CACHE_KV`** (separado do `B3_RATE_LIMIT_KV`); se ausente,
**memória do isolate** (documentadamente não confiável para persistência real).

**API Guia antes de Position/Movement.** `syncPositions`/`syncMovements` verificam se há
meta/cache de **`guide`** para o mesmo `referenceDate`; se não houver → `guide_required`
(`ok:false`). Em stub, "há guia" significa que `sync-guide` já rodou naquele D-1.

**Gate `B3_ENABLE_REAL_CALLS`.** Default `false` (ausente ou ≠ `"true"` = `false`). Com `true`,
como o cliente real ainda não existe, a primeira sincronização retorna **`real_client_not_implemented`**
com segurança (e registra meta); `production` continua `unsupported_env`.

**Novos modos:** `already_synced`, `cache_hit`, `guide_required`, `real_client_not_implemented`
(e `sync_cache_unavailable` reservado). **Métricas** novas: `mode_cache_hit`,
`mode_already_synced`, `mode_guide_required`, `mode_real_client_not_implemented`,
`syncCacheHits`, `syncBlockedRepeats`. **Auditoria**: evento `b3.<action>.<mode>`.

### Como testar (local)

```bash
# repetição → cache_hit (estratégia cache, default):
curl -s -H "Authorization: Bearer <ID>" -X POST http://localhost:8787/b3/sync-guide   # 1ª: certification_*
curl -s -H "Authorization: Bearer <ID>" -X POST http://localhost:8787/b3/sync-guide   # 2ª: cache_hit
# guide_required:
curl -s -H "Authorization: Bearer <ID>" -X POST http://localhost:8787/b3/sync-positions # sem guia → guide_required
# already_synced: defina B3_REPEAT_SYNC_STRATEGY=block e repita sync-guide.
```

## Logs

`safeLog`: **whitelist** de campos (`endpoint`, `method`, `status`, `uidHash`, `mode`,
`durationMs`, `referenceDate`, erro resumido) — qualquer outro campo é ignorado por construção.
Nunca loga token, Authorization, client secret, certificados, payload B3, CPF, senha, body
ou pacote de acesso.

## Limitações atuais / o que falta para certificação real

- `B3_ENABLE_REAL_CALLS=false` por padrão; **nenhuma chamada real** à B3 é feita.
- Falta: contratação/licenciamento B3 (PJ), self-assessment + Security Scorecard, **Pacote de
  Acesso** (.zip) no portal B3 For Developers, e a implementação real do `b3Client`
  (Pacote de Acesso → API Guia → Position/Movement) com cache D-1 e rate limit.
- Rate limit ainda é roadmap.
