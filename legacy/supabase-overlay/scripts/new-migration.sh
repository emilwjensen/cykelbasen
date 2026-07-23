#!/usr/bin/env bash
set -euo pipefail

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "Usage: ./scripts/new-migration.sh migration_name" >&2
  exit 1
fi

pnpm exec neon migration new "$NAME"
