#!/usr/bin/env bash
set -euo pipefail

HEADPLANE_DIR="./headplane"
CONFIG_FILE="${HEADPLANE_DIR}/config.yaml"

if [[ -f "$CONFIG_FILE" ]]; then
  read -rp "${CONFIG_FILE} already exists. Overwrite? [y/N] " confirm
  [[ "${confirm,,}" == "y" ]] || { echo "Aborted."; exit 1; }
fi

mkdir -p "${HEADPLANE_DIR}/data"

echo "Generating headscale API key..."
API_KEY=$(docker compose exec -T headscale headscale apikeys create --expiration 99999d | tail -n 1 | tr -d '[:space:]')

if [[ -z "$API_KEY" ]]; then
  echo "Failed to generate headscale API key. Is the container running?" >&2
  exit 1
fi

COOKIE_SECRET=$(openssl rand -hex 16)

cat > "$CONFIG_FILE" <<EOF
server:
  host: "0.0.0.0"
  port: 3000
  cookie_secret: "${COOKIE_SECRET}"
  cookie_secure: true

headscale:
  url: "http://headscale:443"
  config_path: "/etc/headscale/config.yaml"
  config_strict: false

integration:
  docker:
    enabled: true
    container_name: "headscale"
    socket: "unix:///var/run/docker.sock"

oidc:
  headscale_api_key: "${API_KEY}"
  disable_api_key_login: false
EOF

chmod 600 "$CONFIG_FILE"
echo "Config written to ${CONFIG_FILE}"
