#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

PRODUCT_NAME="$(node -e 'const fs=require("node:fs"); const config=JSON.parse(fs.readFileSync("apps/tauri/tauri.conf.json","utf8")); console.log(config.productName);')"
BUNDLE_ID="$(node -e 'const fs=require("node:fs"); const config=JSON.parse(fs.readFileSync("apps/tauri/tauri.conf.json","utf8")); console.log(config.identifier);')"
LOGS_DIR="$HOME/Library/Logs/$BUNDLE_ID"

echo "[codex-run] Launching $PRODUCT_NAME via Tauri dev"
echo "[codex-run] Workspace: $ROOT_DIR"
echo "[codex-run] Expected macOS logs: $LOGS_DIR"
echo "[codex-run] Stop with Ctrl+C"

exec pnpm tauri dev "$@"
