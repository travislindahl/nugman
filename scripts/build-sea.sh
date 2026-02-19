#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo "==> Bundling with esbuild (ESM)..."
npm run build:bundle

echo "==> Creating CJS wrapper for SEA..."
node scripts/create-sea-entry.mjs

echo "==> Generating SEA blob..."
node --experimental-sea-config sea-config.json

echo "==> Copying node binary..."
cp "$(command -v node)" nugman

echo "==> Injecting SEA blob..."
if [[ "$(uname -s)" == "Darwin" ]]; then
  codesign --remove-signature nugman
  npx postject nugman NODE_SEA_BLOB dist/sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
    --macho-segment-name NODE_SEA
  codesign -s - nugman
else
  npx postject nugman NODE_SEA_BLOB dist/sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
fi

echo "==> Done! Binary: ./nugman"
./nugman --version 2>/dev/null || true
