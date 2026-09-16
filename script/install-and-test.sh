#!/usr/bin/env bash
# install-and-test.sh
set -euo pipefail

ROOT="/home/ogwu/workspace/solaraudit"
cd "$ROOT"

# 1. Ensure package.json exists (create if missing)
if [[ ! -f package.json ]]; then
  cat > package.json <<'EOF'
{
  "name": "solaraudit",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:load": "vitest run src/engineering/load",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.1.1"
  }
}
EOF
fi

# 2. Ensure tsconfig.json exists
if [[ ! -f tsconfig.json ]]; then
  cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts"]
}
EOF
fi

# 3. Ensure vitest.config.ts exists
if [[ ! -f vitest.config.ts ]]; then
  cat > vitest.config.ts <<'EOF'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
EOF
fi

# 4. Install deps
echo "→ Installing dependencies…"
npm install

# 5. Typecheck + run tests
echo
echo "── Typecheck ─────────────────────────────"
npx tsc --noEmit

echo
echo "── Tests ─────────────────────────────────"
npx vitest run src/engineering/load

echo
echo "✔ Done."