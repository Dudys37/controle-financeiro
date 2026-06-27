# deploy.ps1 — Deploy seguro para GitHub Pages
# Uso:
#   1) Crie um Personal Access Token (fine-grained) com permissão de Conteúdo (Contents: Read/Write) no repositório.
#   2) Defina a variável de ambiente ANTES de rodar (NÃO coloque o token neste arquivo):
#        $env:GITHUB_TOKEN = "seu_token_aqui"
#   3) Rode:  .\deploy.ps1
#
# ⚠️ SEGURANÇA: o token NUNCA deve ser escrito neste arquivo nem versionado.
# ⚠️ Se algum token já foi exposto no histórico do Git, REVOGUE-O IMEDIATAMENTE em:
#      GitHub → Settings → Developer settings → Personal access tokens → Revoke.
#    Revogar é obrigatório: remover do código não basta, pois ele permanece no histórico.

$ErrorActionPreference = "Stop"

$TOKEN  = $env:GITHUB_TOKEN
$REPO   = "Dudys37/controle-financeiro"
$BRANCH = "main"

if ([string]::IsNullOrWhiteSpace($TOKEN)) {
    Write-Host "ERRO: variável de ambiente GITHUB_TOKEN não encontrada." -ForegroundColor Red
    Write-Host ""
    Write-Host "Configure antes de rodar o deploy:" -ForegroundColor Yellow
    Write-Host '   $env:GITHUB_TOKEN = "seu_token_aqui"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Dica: para não digitar a cada sessão, use um token fine-grained e guarde-o" -ForegroundColor Gray
    Write-Host "em um gerenciador de segredos — nunca neste arquivo." -ForegroundColor Gray
    exit 1
}

# Apenas arquivos necessários e SEGUROS são publicados.
# auth.js (legado/inseguro), deploy.ps1, firestore.rules e .gitignore NÃO são publicados no Pages.
$FILES = @(
    @{ local = "index.html"; remote = "index.html" },
    @{ local = "app.html";   remote = "app.html" },
    @{ local = "app.js";     remote = "app.js" },
    @{ local = "utils.js";   remote = "utils.js" },
    @{ local = "constants.js"; remote = "constants.js" },
    @{ local = "reports.js";   remote = "reports.js" },
    @{ local = "integrations.js"; remote = "integrations.js" },
    @{ local = "b3of_mod.js";  remote = "b3of_mod.js" },
    @{ local = "README.md";  remote = "README.md" }
)

$headers = @{
    "Authorization" = "token $TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
    "Content-Type"  = "application/json"
    "User-Agent"    = "financaspro-deploy"
}

Write-Host "=== Deploy FinançasPRO ===" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $FILES) {
    $localPath = Join-Path $PSScriptRoot $file.local
    if (-not (Test-Path $localPath)) {
        Write-Host "AVISO: arquivo não encontrado: $($file.local)" -ForegroundColor Yellow
        continue
    }

    $bytes  = [System.IO.File]::ReadAllBytes($localPath)
    $base64 = [System.Convert]::ToBase64String($bytes)

    $url = "https://api.github.com/repos/$REPO/contents/$($file.remote)"
    try {
        $existing = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction SilentlyContinue
        $sha = $existing.sha
        Write-Host "Atualizando: $($file.remote)" -ForegroundColor Yellow
    } catch {
        $sha = $null
        Write-Host "Criando: $($file.remote)" -ForegroundColor Green
    }

    $body = @{
        message = "deploy: update $($file.remote)"
        content = $base64
        branch  = $BRANCH
    }
    if ($sha) { $body.sha = $sha }

    try {
        $bodyJson = $body | ConvertTo-Json
        Invoke-RestMethod -Uri $url -Headers $headers -Method Put -Body $bodyJson | Out-Null
        Write-Host "  OK: $($file.remote)" -ForegroundColor Green
    } catch {
        Write-Host "  ERRO em $($file.remote): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deploy concluído! ===" -ForegroundColor Cyan
Write-Host "Acesse: https://dudys37.github.io/controle-financeiro" -ForegroundColor Green
Write-Host "Aguarde 1-2 minutos para o GitHub Pages publicar." -ForegroundColor Gray
