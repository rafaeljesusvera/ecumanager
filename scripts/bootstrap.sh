#!/usr/bin/env bash
#
# Bootstrap del entorno de desarrollo de Equmanager.
# Uso: bash scripts/bootstrap.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ok()    { printf "${GREEN}✔${RESET} %s\n" "$1"; }
warn()  { printf "${YELLOW}⚠${RESET} %s\n" "$1"; }
err()   { printf "${RED}✘${RESET} %s\n" "$1"; }

echo "🏇 Equmanager · bootstrap"
echo

# 1. Comprobar Node
NODE_VERSION="$(node -v 2>/dev/null || echo none)"
if [[ "$NODE_VERSION" == none ]]; then
  err "Node.js no está instalado. Necesitas Node 20+."
  exit 1
fi
ok "Node detectado: $NODE_VERSION"

# 2. Activar pnpm via corepack si hace falta
if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm no detectado, activando via corepack…"
  corepack enable
fi
ok "pnpm: $(pnpm -v)"

# 3. .env
if [[ ! -f .env ]]; then
  warn ".env no existe, copiando de .env.example"
  cp .env.example .env
  echo
  echo "👉 Edita .env con tus credenciales de Supabase antes de continuar."
  echo
fi

# 4. Install
echo "📦 Instalando dependencias…"
pnpm install --frozen-lockfile

# 5. Build de paquetes internos
echo "🔨 Build inicial de paquetes…"
pnpm --filter "./packages/*" build 2>/dev/null || true

ok "Listo. Lanza el dev con: pnpm dev"
