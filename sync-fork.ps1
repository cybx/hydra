# sync-fork.ps1 — atualiza a main do fork com o upstream (mantendo-a pristina).
# Uso:  powershell -ExecutionPolicy Bypass -File .\sync-fork.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main
Write-Host "main sincronizada com hydralauncher/hydra." -ForegroundColor Green
Write-Host "Para trazer as novidades numa branch de feature: git rebase main" -ForegroundColor Green
