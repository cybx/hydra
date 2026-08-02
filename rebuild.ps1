# rebuild.ps1 — recompila o Hydra da fonte (Windows), gerando dist\win-unpacked\Hydra.exe
# Uso:  powershell -ExecutionPolicy Bypass -File .\rebuild.ps1
#
# Pre-requisitos (instalados uma vez):
#   - Node.js + Yarn (via corepack)
#   - Rust toolchain (rustup)  -> addon nativo
#   - Python 3.12              -> backend python_rpc (libtorrent nao tem wheel p/ 3.13+)
#   - Visual Studio Build Tools (workload "Desktop C++")
#   - Windows Developer Mode ligado (extrai o winCodeSign sem admin)
#
# O script cria/usa um venv 3.12 proprio em .venv-rpc com libtorrent + cx_Freeze.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# --- ambiente ---
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
$py312 = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
if (-not (Test-Path $py312)) { throw "Python 3.12 nao encontrado em $py312. Instale o Python 3.12." }
$env:PYTHON = $py312
$env:npm_config_python = $py312
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"   # nao tentar assinar com certificado

# --- .env obrigatorio (senao o main process crasha com 'includes' de undefined) ---
if (-not (Test-Path ".env")) {
  Write-Host "Criando .env com endpoints padrao..." -ForegroundColor Yellow
@"
MAIN_VITE_API_URL=https://hydra-api-us-east-1.losbroxas.org
MAIN_VITE_AUTH_URL=https://auth.hydra.losbroxas.org
MAIN_VITE_CHECKOUT_URL=https://checkout.hydralauncher.gg
MAIN_VITE_EXTERNAL_RESOURCES_URL=https://assets.hydralauncher.gg
MAIN_VITE_LAUNCHER_SUBDOMAIN=
RENDERER_VITE_EXTERNAL_RESOURCES_URL=https://assets.hydralauncher.gg
RENDERER_VITE_SENTRY_DSN=
RENDERER_VITE_TORBOX_REFERRAL_CODE=
RENDERER_VITE_REAL_DEBRID_REFERRAL_ID=
"@ | Set-Content -Encoding utf8 ".env"
}

# --- venv 3.12 do backend ---
$venv = ".venv-rpc"
if (-not (Test-Path "$venv\Scripts\python.exe")) {
  Write-Host "Criando venv 3.12 do backend..." -ForegroundColor Cyan
  & $py312 -m venv $venv
  & "$venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
  & "$venv\Scripts\python.exe" -m pip install --quiet libtorrent "cx_Freeze>=7.2.3"
}

# --- fechar Hydra do build (senao dist fica travado) ---
Get-Process Hydra,hydra-python-rpc -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 500

Write-Host "==> deps (yarn install)" -ForegroundColor Green
corepack yarn install

Write-Host "==> addon nativo (Rust)" -ForegroundColor Green
corepack yarn build:native

Write-Host "==> backend python_rpc (libtorrent)" -ForegroundColor Green
Remove-Item -Recurse -Force "hydra-python-rpc" -ErrorAction SilentlyContinue
& "$venv\Scripts\python.exe" python_rpc\setup.py build_exe

Write-Host "==> renderer/main (electron-vite build)" -ForegroundColor Green
corepack yarn electron-vite build

Write-Host "==> empacotar (electron-builder --dir)" -ForegroundColor Green
corepack yarn electron-builder --dir

$exe = "dist\win-unpacked\Hydra.exe"
if (Test-Path $exe) {
  Write-Host "`nOK -> $((Resolve-Path $exe).Path)" -ForegroundColor Green
} else {
  throw "Build terminou mas nao encontrei $exe"
}
