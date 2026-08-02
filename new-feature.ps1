# new-feature.ps1 — cria uma branch limpa para uma feature/fix, a partir da main
# sincronizada com o upstream (assim o PR nao carrega nada pessoal).
# Uso:  powershell -ExecutionPolicy Bypass -File .\new-feature.ps1 -Type feat -Name minha-feature
#   -Type: feat | fix | chore | docs | refactor | perf | test  (conventional commits)

param(
  [ValidateSet("feat","fix","chore","docs","refactor","perf","test")]
  [string]$Type = "feat",
  [Parameter(Mandatory=$true)][string]$Name
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Sincronizando main com upstream..." -ForegroundColor Cyan
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main 2>$null

$branch = "$Type/$Name"
git checkout -b $branch main
Write-Host "`nBranch '$branch' criada a partir da main (upstream)." -ForegroundColor Green
Write-Host "Fluxo:" -ForegroundColor Green
Write-Host "  1. faca suas mudancas + teste com:  .\dev.ps1"
Write-Host "  2. git commit -am `"$Type`: descricao curta`"   (padrao conventional, obrigatorio)"
Write-Host "  3. git push -u origin $branch"
Write-Host "  4. abra o PR no GitHub contra hydralauncher/hydra:main"
