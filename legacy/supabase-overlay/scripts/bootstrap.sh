#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-../racercykel-marketplace}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it before running this script." >&2
  exit 1
fi

if [ -e "$TARGET" ]; then
  echo "Target already exists: $TARGET" >&2
  exit 1
fi

pnpm create next-app --example with-neon "$TARGET"
TARGET_ABS="$(cd "$(dirname "$TARGET")" && pwd)/$(basename "$TARGET")"

cd "$TARGET_ABS"

pnpm add zod react-hook-form @hookform/resolvers
pnpm add -D neon

pnpm pkg set scripts.typecheck="tsc --noEmit"
pnpm pkg set scripts.check="pnpm lint && pnpm typecheck && pnpm build"
pnpm pkg set scripts.neon:start="neon start"
pnpm pkg set scripts.neon:stop="neon stop"
pnpm pkg set scripts.neon:reset="neon db reset"
pnpm pkg set scripts.db:types="neon gen types typescript --local > src/types/database.ts"
pnpm pkg set scripts.db:types:remote="neon gen types typescript --linked > src/types/database.ts"

pnpm exec neon init

mkdir -p src/types neon/migrations .agents docs scripts .github

cp "$SOURCE_ROOT/AGENTS.md" ./AGENTS.md
cp -R "$SOURCE_ROOT/.agents/." ./.agents/
cp -R "$SOURCE_ROOT/docs/." ./docs/
cp -R "$SOURCE_ROOT/.github/." ./.github/
cp -R "$SOURCE_ROOT/neon/migrations/." ./neon/migrations/
cp "$SOURCE_ROOT/neon/seed.sql" ./neon/seed.sql
cp "$SOURCE_ROOT/scripts/check.sh" ./scripts/check.sh
cp "$SOURCE_ROOT/scripts/new-migration.sh" ./scripts/new-migration.sh
cp "$SOURCE_ROOT/scripts/gen-types.sh" ./scripts/gen-types.sh
chmod +x scripts/*.sh

touch src/types/database.ts

cat <<'EOF'

Starter created.

Next steps:
1. cd into the target project.
2. Configure .env.local.
3. Run pnpm neon:start.
4. Run pnpm neon:reset.
5. Run pnpm db:types.
6. Open docs/CODEX_KICKOFF_PROMPT.md in Codex.
EOF
