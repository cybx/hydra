# Hydra — build da fonte, fork e desenvolvimento de features (Windows)

Guia do nosso setup para compilar o Hydra, rodar em modo dev e contribuir para o
`hydralauncher/hydra` a partir do fork `cybx/hydra`.

## Pré-requisitos (instalados uma vez)

| Ferramenta | Observação |
|---|---|
| Node.js + Yarn | Yarn via `corepack enable` |
| Rust (rustup) | addon nativo `hydra-native` |
| **Python 3.12** | backend `python_rpc` usa `libtorrent` (sem wheel para 3.13+) |
| VS Build Tools | workload **Desktop development with C++** |
| Windows Developer Mode | ligado — extrai o `winCodeSign` sem admin |

Já configurado nesta máquina: venv `.venv-rpc` (libtorrent) e a variável de
ambiente **`HYDRA_PYTHON_BIN`** apontando para ele (o modo dev usa esse Python).

## `.env` (obrigatório)

Sem ele o main process crasha (`Cannot read properties of undefined 'includes'`).
O `rebuild.ps1`/`dev.ps1` criam um padrão. Valores em uso (endpoints públicos da 4.0.6):

```
MAIN_VITE_API_URL=https://hydra-api-us-east-1.losbroxas.org
MAIN_VITE_AUTH_URL=https://auth.hydra.losbroxas.org
MAIN_VITE_CHECKOUT_URL=https://checkout.hydralauncher.gg
MAIN_VITE_EXTERNAL_RESOURCES_URL=https://assets.hydralauncher.gg
MAIN_VITE_LAUNCHER_SUBDOMAIN=            # vazio = usa o renderer local
RENDERER_VITE_EXTERNAL_RESOURCES_URL=https://assets.hydralauncher.gg
RENDERER_VITE_SENTRY_DSN=
RENDERER_VITE_TORBOX_REFERRAL_CODE=
RENDERER_VITE_REAL_DEBRID_REFERRAL_ID=
```

## Desenvolver uma feature (loop rápido — hot reload)

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```
`dev.ps1` roda `electron-vite dev`: recarrega renderer/main a cada alteração, com o
backend de torrent funcionando (via `.venv-rpc`). É assim que se desenvolve — **não**
precisa rebuildar a cada mudança.

## Build final (app portátil)

```powershell
powershell -ExecutionPolicy Bypass -File .\rebuild.ps1
```
Gera `dist\win-unpacked\Hydra.exe`.

## Fork: estrutura e sincronização

- `origin` = `github.com/cybx/hydra`  ·  `upstream` = `hydralauncher/hydra`
- **`main`**: espelho **pristino** do upstream (nunca commite direto nela).
- **`custom`**: tooling pessoal (estes scripts + este doc). Não vai para PR.

Atualizar a main:
```powershell
powershell -ExecutionPolicy Bypass -File .\sync-fork.ps1
```
Ou o botão **Sync fork** na página do GitHub.

## Criar uma feature / abrir PR para o upstream

```powershell
powershell -ExecutionPolicy Bypass -File .\new-feature.ps1 -Type feat -Name minha-feature
```
Isso sincroniza a main e cria `feat/minha-feature` **a partir da main pristina**
(o PR não carrega nada pessoal). Depois:

```bash
# fazer as mudanças, testar com dev.ps1
git commit -am "feat: descrição curta"    # Conventional Commits (obrigatório: commitlint + husky)
git push -u origin feat/minha-feature
# abrir o Pull Request contra hydralauncher/hydra:main
```

Regras de qualidade (os hooks pre-commit/pre-push rodam sozinhos; rode antes para não travar):
```bash
corepack yarn lint
corepack yarn typecheck
```

## Contexto: o fix do TorrentLeech

O bug de metadata em tracker privado (4.0.6) já está corrigido na `main`: o
`start_download` usa `parse_magnet_uri` mantendo os trackers do magnet no tier 0
e os públicos em tier de fallback (antes os ~94 públicos entravam no tier 0 e
sufocavam o announce do tracker privado). Buildar a `main` já traz esse fix.
