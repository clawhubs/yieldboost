#!/usr/bin/env bash
set -euo pipefail

VPS_HOST_ALIAS="${VPS_HOST_ALIAS:-hackaton-do}"
APP_DIR="${APP_DIR:-/opt/yieldboost/current}"
SHARED_DIR="${SHARED_DIR:-/opt/yieldboost/shared}"
APP_NAME="${APP_NAME:-yieldboost}"
APP_URL="${APP_URL:-http://68.183.227.162:3000}"
ENV_SOURCE="${ENV_SOURCE:-.env.local}"

if ! command -v ssh >/dev/null 2>&1; then
  echo "ssh is required" >&2
  exit 1
fi

if ! command -v tar >/dev/null 2>&1; then
  echo "tar is required" >&2
  exit 1
fi

if [[ ! -f "$ENV_SOURCE" ]]; then
  echo "Missing env source: $ENV_SOURCE" >&2
  exit 1
fi

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT
cp "$ENV_SOURCE" "$TMP_ENV"

append_or_replace_env() {
  local key="$1"
  local value="$2"
  if grep -Eq "^${key}=" "$TMP_ENV"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$TMP_ENV"
  else
    printf '%s=%s\n' "$key" "$value" >>"$TMP_ENV"
  fi
}

append_or_replace_env "NEXT_PUBLIC_APP_URL" "$APP_URL"
append_or_replace_env "NEXT_PUBLIC_DEFAULT_NETWORK_KEY" "mainnet"

echo "Syncing env to ${VPS_HOST_ALIAS}:${SHARED_DIR}"
ssh "$VPS_HOST_ALIAS" "mkdir -p '$APP_DIR' '$SHARED_DIR'"
scp -q "$TMP_ENV" "${VPS_HOST_ALIAS}:${SHARED_DIR}/.env.production.local"
ssh "$VPS_HOST_ALIAS" "chmod 600 '${SHARED_DIR}/.env.production.local'"

echo "Uploading source bundle"
tar \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=test-results \
  --exclude=playwright-report \
  --exclude=coverage \
  --exclude=.vercel \
  -czf - . | ssh "$VPS_HOST_ALIAS" "rm -rf '${APP_DIR}'/* && tar -xzf - -C '${APP_DIR}'"

echo "Building and reloading ${APP_NAME}"
ssh "$VPS_HOST_ALIAS" "set -e
  cd '${APP_DIR}'
  ln -sfn '${SHARED_DIR}/.env.production.local' .env.production.local
  npm ci
  npm run build
  pm2 delete '${APP_NAME}' >/dev/null 2>&1 || true
  pm2 start ecosystem.config.cjs --only '${APP_NAME}'
  pm2 save
  pm2 status '${APP_NAME}'
"

echo
echo "Deploy complete."
echo "App URL: ${APP_URL}"
