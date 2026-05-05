# deploy.ps1 - Script de deploy automatico para GitHub
# Execute com: .\deploy.ps1

$TOKEN = "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"
$REPO  = "Dudys37/controle-financeiro"
$BRANCH = "main"

# Arquivos para fazer upload
$FILES = @(
    @{ local = "index.html"; remote = "index.html" },
    @{ local = "app.html";   remote = "app.html" },
    @{ local = "auth.js";    remote = "auth.js" },
    @{ local = "README.md";  remote = "README.md" }
)

$headers = @{
    "Authorization" = "token $TOKEN"
    "Accept"        = "application/vnd.github.v3+json"
    "Content-Type"  = "application/json"
}

Write-Host "=== Deploy Controle Financeiro ===" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $FILES) {
    $localPath = Join-Path $PSScriptRoot $file.local
    
    if (-not (Test-Path $localPath)) {
        Write-Host "AVISO: Arquivo nao encontrado: $($file.local)" -ForegroundColor Yellow
        continue
    }

    # Read file as base64
    $bytes   = [System.IO.File]::ReadAllBytes($localPath)
    $base64  = [System.Convert]::ToBase64String($bytes)

    # Check if file already exists (to get SHA for update)
    $url = "https://api.github.com/repos/$REPO/contents/$($file.remote)"
    try {
        $existing = Invoke-RestMethod -Uri $url -Headers $headers -Method Get -ErrorAction SilentlyContinue
        $sha = $existing.sha
        Write-Host "Atualizando: $($file.remote)" -ForegroundColor Yellow
    } catch {
        $sha = $null
        Write-Host "Criando: $($file.remote)" -ForegroundColor Green
    }

    # Build request body
    $body = @{
        message = "deploy: update $($file.remote)"
        content = $base64
        branch  = $BRANCH
    }
    if ($sha) { $body.sha = $sha }

    # Push to GitHub
    try {
        $bodyJson = $body | ConvertTo-Json
        Invoke-RestMethod -Uri $url -Headers $headers -Method Put -Body $bodyJson | Out-Null
        Write-Host "  OK: $($file.remote)" -ForegroundColor Green
    } catch {
        Write-Host "  ERRO em $($file.remote): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Deploy concluido! ===" -ForegroundColor Cyan
Write-Host "Acesse: https://dudys37.github.io/controle-financeiro" -ForegroundColor Green
Write-Host ""
Write-Host "Aguarde 1-2 minutos para o GitHub Pages publicar." -ForegroundColor Gray
