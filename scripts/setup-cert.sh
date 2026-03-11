#!/bin/bash

set -euo pipefail

: "${CF_API_TOKEN:?CF_API_TOKEN is required}"
: "${HEADSCALE_DOMAIN:?HEADSCALE_DOMAIN is required}"

CREDENTIALS_FILE="/etc/cloudflare/credentials.ini"

# Install certbot and the cloudflare plugin
sudo apt-get update -qq
sudo apt-get install -y -qq certbot python3-certbot-dns-cloudflare

# Create cloudflare credentials
sudo mkdir -p /etc/cloudflare
echo "dns_cloudflare_api_token = ${CF_API_TOKEN}" | sudo tee "$CREDENTIALS_FILE" > /dev/null
sudo chmod 600 "$CREDENTIALS_FILE"

# Generate the certificate
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials "$CREDENTIALS_FILE" \
  -d "$HEADSCALE_DOMAIN" \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email

# Set up a post-renewal hook to restart headscale
sudo tee /etc/letsencrypt/renewal-hooks/deploy/restart-headscale.sh > /dev/null <<'EOF'
#!/bin/bash
docker restart headscale
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/restart-headscale.sh

echo "Certificate issued for ${HEADSCALE_DOMAIN}"
