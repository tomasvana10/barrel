#!/bin/bash

set -euo pipefail

: "${CF_API_TOKEN:?CF_API_TOKEN is required}"
: "${CF_ZONE_ID:?CF_ZONE_ID is required}"
: "${CF_RECORD_NAME:?CF_RECORD_NAME is required}"

PUBLIC_IP=$(curl -s https://api.ipify.org)

if [[ -z "$PUBLIC_IP" ]]; then
  echo "Failed to get public IP"
  exit 1
fi

RECORD=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records?type=A&name=${CF_RECORD_NAME}" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json")

RECORD_ID=$(echo "$RECORD" | jq -r '.result[0].id // empty')
CURRENT_IP=$(echo "$RECORD" | jq -r '.result[0].content // empty')

if [[ "$CURRENT_IP" == "$PUBLIC_IP" ]]; then
  echo "IP unchanged: $PUBLIC_IP"
  exit 0
fi

if [[ -z "$RECORD_ID" ]]; then
  curl -s -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"A\",\"name\":\"${CF_RECORD_NAME}\",\"content\":\"${PUBLIC_IP}\",\"ttl\":300,\"proxied\":false}" | jq .
  echo "Created record: ${CF_RECORD_NAME} -> ${PUBLIC_IP}"
else
  curl -s -X PUT \
    "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"A\",\"name\":\"${CF_RECORD_NAME}\",\"content\":\"${PUBLIC_IP}\",\"ttl\":300,\"proxied\":false}" | jq .
  echo "Updated record: ${CF_RECORD_NAME} ${CURRENT_IP} -> ${PUBLIC_IP}"
fi
