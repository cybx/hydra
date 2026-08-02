# dev.ps1 — roda o Hydra em modo desenvolvimento (hot reload) para criar/testar features.
# Muito mais rapido que rebuildar: recarrega o renderer/main a cada alteracao.
# Uso:  powershell -ExecutionPolicy Bypass -File .\dev.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
$py312 = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"

# backend de torrent em dev roda "python main.py" direto -> precisa de libtorrent (Python 3.12)
$venv = ".venv-rpc"
if (-not (Test-Path "$venv\Scripts\python.exe")) {
  Write-Host "Criando .venv-rpc (libtorrent)..." -ForegroundColor Cyan
  & $py312 -m venv $venv
  & "$venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
  & "$venv\Scripts\python.exe" -m pip install --quiet libtorrent "cx_Freeze>=7.2.3"
}
$env:HYDRA_PYTHON_BIN = (Resolve-Path "$venv\Scripts\python.exe").Path

if (-not (Test-Path ".env")) {
  Write-Host "Falta .env — rode rebuild.ps1 uma vez (ele cria) ou copie o .env." -ForegroundColor Yellow
}

Write-Host "Hydra em modo dev (electron-vite dev). Ctrl+C para sair." -ForegroundColor Green
corepack yarn dev
