#!/usr/bin/env bash
set -euo pipefail

VPS_HOST_ALIAS="${VPS_HOST_ALIAS:-hackaton-do}"
APP_DIR="${APP_DIR:-/opt/yieldboost/current}"
SHARED_DIR="${SHARED_DIR:-/opt/yieldboost/shared}"
SHARED_ARTIFACTS_DIR="${SHARED_ARTIFACTS_DIR:-$SHARED_DIR/artifacts}"
APP_NAME="${APP_NAME:-yieldboost}"
APP_PORT="${APP_PORT:-3000}"
APP_URL="${APP_URL:-http://68.183.227.162:3000}"
API_URL="${API_URL:-http://68.183.227.162:8010}"
PUBLIC_API_URL="${PUBLIC_API_URL:-https://api.yieldboostai.xyz}"
PUBLIC_SITE_URL="${PUBLIC_SITE_URL:-https://yieldboostai.xyz}"
DEV_PORTAL_URL="${DEV_PORTAL_URL:-https://dev.yieldboostai.xyz}"
DEV_PORTAL_API_BASE_URL="${DEV_PORTAL_API_BASE_URL:-https://api.yieldboostai.xyz}"
ENV_SOURCE="${ENV_SOURCE:-.env.local}"
API_SERVICE_NAME="${API_SERVICE_NAME:-yieldboost-integrity-api}"
FRONTEND_SERVICE_NAME="${FRONTEND_SERVICE_NAME:-yieldboost-frontend}"
API_PORT="${API_PORT:-8010}"
VPS_APP_USER="${VPS_APP_USER:-yieldboost}"
TRAEFIK_DYNAMIC_DIR="${TRAEFIK_DYNAMIC_DIR:-/data/coolify/proxy/dynamic}"
VPS_APP_HOME="${VPS_APP_HOME:-}"
if [[ -z "$VPS_APP_HOME" ]]; then
  if [[ "$VPS_APP_USER" == "root" ]]; then
    VPS_APP_HOME="/root"
  else
    VPS_APP_HOME="/home/${VPS_APP_USER}"
  fi
fi

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
TMP_API_ENV="$(mktemp)"
TMP_SERVICE="$(mktemp)"
TMP_FRONTEND_SERVICE="$(mktemp)"
TMP_NGINX="$(mktemp)"
TMP_TRAEFIK="$(mktemp)"
TMP_DEV_TRAEFIK="$(mktemp)"
trap 'rm -f "$TMP_ENV" "$TMP_API_ENV" "$TMP_SERVICE" "$TMP_FRONTEND_SERVICE" "$TMP_NGINX" "$TMP_TRAEFIK" "$TMP_DEV_TRAEFIK"' EXIT
cp "$ENV_SOURCE" "$TMP_ENV"

set_env_in_file() {
  local file="$1"
  local key="$2"
  local value="$3"
  if grep -Eq "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

append_or_replace_env() {
  local key="$1"
  local value="$2"
  set_env_in_file "$TMP_ENV" "$key" "$value"
}

remove_env() {
  local key="$1"
  sed -i "/^${key}=.*/d" "$TMP_ENV"
}

append_or_replace_env "NEXT_PUBLIC_APP_URL" "$APP_URL"
append_or_replace_env "NEXT_PUBLIC_INTEGRITY_API_BASE_URL" "$PUBLIC_API_URL"
append_or_replace_env "NEXT_PUBLIC_DEFAULT_NETWORK_KEY" "mainnet"
append_or_replace_env "INTEGRITY_DEV_PORTAL_API_BASE_URL" "$DEV_PORTAL_API_BASE_URL"
append_or_replace_env "YB_SENTINEL_ENABLED" "true"
append_or_replace_env "YB_SENTINEL_RUN_NARGO" "true"
append_or_replace_env "YB_REQUIRE_TEE_ATTESTATION" "true"
append_or_replace_env "NARGO_BIN" "${VPS_APP_HOME}/.nargo/bin/nargo"
append_or_replace_env "BB_BIN" "${VPS_APP_HOME}/.bb/bb"
remove_env "KV_REST_API_URL"
remove_env "KV_REST_API_TOKEN"
remove_env "UPSTASH_REDIS_REST_URL"
remove_env "UPSTASH_REDIS_REST_TOKEN"

FOUNDER_FROM_ENV="$(grep -E '^FOUNDER_WALLET_ADDRESS=' "$TMP_ENV" | tail -1 | cut -d= -f2- || true)"
if [[ -z "$FOUNDER_FROM_ENV" ]]; then
  FOUNDER_FROM_ENV="$(node - "$TMP_ENV" <<'NODE'
const fs = require("fs");
const { Wallet } = require("ethers");
const envFile = process.argv[2];
const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
const env = Object.fromEntries(
  lines
    .filter((line) => line && !line.trimStart().startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const key = env.ZG_MAINNET_PRIVATE_KEY || env.ZG_TESTNET_PRIVATE_KEY || "";
if (/^0x[0-9a-fA-F]{64}$/.test(key)) {
  process.stdout.write(new Wallet(key).address);
}
NODE
)"
  if [[ -n "$FOUNDER_FROM_ENV" ]]; then
    set_env_in_file "$TMP_ENV" "FOUNDER_WALLET_ADDRESS" "$FOUNDER_FROM_ENV"
  fi
fi
if [[ -n "$FOUNDER_FROM_ENV" ]]; then
  set_env_in_file "$TMP_ENV" "NEXT_PUBLIC_FOUNDER_WALLET_ADDRESS" "$FOUNDER_FROM_ENV"
fi

MASTER_KEY_FROM_ENV="$(grep -E '^INTEGRITY_MASTER_KEY=' "$TMP_ENV" | tail -1 | cut -d= -f2- || true)"
if [[ -n "$MASTER_KEY_FROM_ENV" ]]; then
  set_env_in_file "$TMP_ENV" "INTEGRITY_DEV_PORTAL_MASTER_KEY" "$MASTER_KEY_FROM_ENV"
fi

cp "$TMP_ENV" "$TMP_API_ENV"
set_env_in_file "$TMP_API_ENV" "INTEGRITY_API_NETWORK" "testnet"
set_env_in_file "$TMP_API_ENV" "INTEGRITY_API_JUDGE_BASE_URL" "${PUBLIC_SITE_URL}/judge"
set_env_in_file "$TMP_API_ENV" "INTEGRITY_API_CORS_ORIGINS" "${PUBLIC_SITE_URL},https://www.yieldboostai.xyz,${APP_URL}"
set_env_in_file "$TMP_API_ENV" "INTEGRITY_API_LOCAL_STORE_PATH" "${SHARED_ARTIFACTS_DIR}/integrity-api-store.local.json"
set_env_in_file "$TMP_API_ENV" "INTEGRITY_API_ALLOW_LOCAL_TEE_FALLBACK" "true"

cat >"$TMP_SERVICE" <<EOF
[Unit]
Description=YieldBoost Integrity API
After=network.target

[Service]
Type=simple
User=${VPS_APP_USER}
Group=${VPS_APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${SHARED_DIR}/api.env
ExecStart=/usr/bin/env bash -lc 'cd "${APP_DIR}" && /usr/local/bin/uv run --project api python -m uvicorn api.app.main:app --host 0.0.0.0 --port ${API_PORT}'
Restart=always
RestartSec=5
TimeoutStopSec=20
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

cat >"$TMP_FRONTEND_SERVICE" <<EOF
[Unit]
Description=YieldBoost Frontend
After=network.target

[Service]
Type=simple
User=${VPS_APP_USER}
Group=${VPS_APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${SHARED_DIR}/.env.production.local
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
ExecStart=/usr/bin/node ${APP_DIR}/node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${APP_PORT}
Restart=always
RestartSec=5
TimeoutStopSec=20
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

cat >"$TMP_NGINX" <<EOF
server {
    listen 80;
    server_name api.yieldboostai.xyz;

    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 120s;
    }
}
EOF

cp "api/deploy/traefik/api.yieldboostai.xyz.yaml" "$TMP_TRAEFIK"
cp "api/deploy/traefik/dev.yieldboostai.xyz.yaml" "$TMP_DEV_TRAEFIK"

echo "Syncing env to ${VPS_HOST_ALIAS}:${SHARED_DIR}"
ssh "$VPS_HOST_ALIAS" "set -e
  if ! id '${VPS_APP_USER}' >/dev/null 2>&1; then
    sudo useradd --system --create-home --home-dir '${VPS_APP_HOME}' --shell /usr/sbin/nologin '${VPS_APP_USER}'
  fi
  sudo install -m 0755 -o root -g root /root/.local/bin/uv /usr/local/bin/uv
  sudo mkdir -p '$APP_DIR' '$SHARED_DIR' '$SHARED_ARTIFACTS_DIR'
  sudo chown -R '${VPS_APP_USER}:${VPS_APP_USER}' '$APP_DIR' '$SHARED_ARTIFACTS_DIR'
"
scp -q "$TMP_ENV" "${VPS_HOST_ALIAS}:${SHARED_DIR}/.env.production.local"
scp -q "$TMP_API_ENV" "${VPS_HOST_ALIAS}:${SHARED_DIR}/api.env"
ssh "$VPS_HOST_ALIAS" "sudo chgrp '${VPS_APP_USER}' '${SHARED_DIR}/.env.production.local' '${SHARED_DIR}/api.env' && sudo chmod 640 '${SHARED_DIR}/.env.production.local' '${SHARED_DIR}/api.env'"
scp -q "$TMP_TRAEFIK" "${VPS_HOST_ALIAS}:/tmp/api.yieldboostai.xyz.yaml"
scp -q "$TMP_DEV_TRAEFIK" "${VPS_HOST_ALIAS}:/tmp/dev.yieldboostai.xyz.yaml"

echo "Uploading source bundle"
tar \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=.artifacts \
  --exclude=.env.local \
  --exclude=.env.production.local \
  --exclude=.env.development.local \
  --exclude=.env.test.local \
  --exclude='Acces Key and token' \
  --exclude='military-grade-zk/circuits/*/target' \
  --exclude='military-grade-zk/circuits/*/Prover.toml' \
  --exclude='military-grade-zk/circuits/*/sentinel_*.toml' \
  --exclude=test-results \
  --exclude=playwright-report \
  --exclude=coverage \
  --exclude=.vercel \
  --exclude=api/.venv \
  --exclude=api/.pytest_cache \
  -czf - . | ssh "$VPS_HOST_ALIAS" "find '${APP_DIR}' -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf - -C '${APP_DIR}'"

echo "Building and reloading ${APP_NAME}"
ssh "$VPS_HOST_ALIAS" "set -e
  cd '${APP_DIR}'
  mkdir -p '${SHARED_ARTIFACTS_DIR}/0g-fallback'
  ln -sfn '${SHARED_ARTIFACTS_DIR}' .artifacts
  ln -sfn '${SHARED_DIR}/.env.production.local' .env.production.local
  sudo chown -R '${VPS_APP_USER}:${VPS_APP_USER}' '${APP_DIR}' '${SHARED_ARTIFACTS_DIR}'
  sudo -u '${VPS_APP_USER}' HOME='${VPS_APP_HOME}' bash -lc 'cd \"${APP_DIR}\" && npm ci && npm run build'
  sudo ufw allow in from 172.18.0.0/16 to any port '${APP_PORT}' proto tcp comment 'YieldBoost internal frontend from proxy' >/dev/null 2>&1 || true
"

echo "Installing and reloading ${API_SERVICE_NAME}"
scp -q "$TMP_SERVICE" "${VPS_HOST_ALIAS}:/tmp/${API_SERVICE_NAME}.service"
scp -q "$TMP_FRONTEND_SERVICE" "${VPS_HOST_ALIAS}:/tmp/${FRONTEND_SERVICE_NAME}.service"
scp -q "$TMP_NGINX" "${VPS_HOST_ALIAS}:/tmp/api.yieldboostai.xyz.conf"
ssh "$VPS_HOST_ALIAS" "set -e
  sudo mv '/tmp/${API_SERVICE_NAME}.service' '/etc/systemd/system/${API_SERVICE_NAME}.service'
  sudo mv '/tmp/${FRONTEND_SERVICE_NAME}.service' '/etc/systemd/system/${FRONTEND_SERVICE_NAME}.service'
  sudo systemctl daemon-reload
  sudo systemctl enable '${API_SERVICE_NAME}'
  sudo systemctl enable '${FRONTEND_SERVICE_NAME}'
  pm2 delete '${APP_NAME}' >/dev/null 2>&1 || true
  pm2 save >/dev/null 2>&1 || true
  sudo systemctl restart '${FRONTEND_SERVICE_NAME}'
  sudo systemctl restart '${API_SERVICE_NAME}'
  sudo ufw allow in from 172.18.0.0/16 to any port '${API_PORT}' proto tcp comment 'YieldBoost internal API from proxy' >/dev/null 2>&1 || true
  sudo mkdir -p '${TRAEFIK_DYNAMIC_DIR}'
  sudo mv '/tmp/api.yieldboostai.xyz.yaml' '${TRAEFIK_DYNAMIC_DIR}/api.yieldboostai.xyz.yaml'
  sudo mv '/tmp/dev.yieldboostai.xyz.yaml' '${TRAEFIK_DYNAMIC_DIR}/dev.yieldboostai.xyz.yaml'
  if command -v nginx >/dev/null 2>&1; then
    sudo mv '/tmp/api.yieldboostai.xyz.conf' '/etc/nginx/sites-available/api.yieldboostai.xyz.conf'
    sudo ln -sfn '/etc/nginx/sites-available/api.yieldboostai.xyz.conf' '/etc/nginx/sites-enabled/api.yieldboostai.xyz.conf'
    sudo nginx -t
    sudo systemctl reload nginx
  fi
  sudo systemctl --no-pager --full status '${API_SERVICE_NAME}' | sed -n '1,20p'
  sudo systemctl --no-pager --full status '${FRONTEND_SERVICE_NAME}' | sed -n '1,20p'
"

echo
echo "Deploy complete."
echo "App URL: ${APP_URL}"
echo "API URL: ${API_URL}"
echo "Dev URL: ${DEV_PORTAL_URL}"
