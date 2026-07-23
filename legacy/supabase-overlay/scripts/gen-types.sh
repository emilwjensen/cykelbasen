#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"
mkdir -p src/types

case "$MODE" in
  local)
    pnpm exec neon gen types typescript --local > src/types/database.ts
    ;;
  remote)
    pnpm exec neon gen types typescript --linked > src/types/database.ts
    ;;
  *)
    echo "Usage: ./scripts/gen-types.sh [local|remote]" >&2
    exit 1
    ;;
esac
