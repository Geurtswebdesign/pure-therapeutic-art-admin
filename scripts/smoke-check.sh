#!/usr/bin/env bash
set -euo pipefail

MAIN_URL="${MAIN_URL:-https://pure-therapeutic-art-therapy.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.pure-therapeutic-art-therapy.com}"

check_status() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${url}")"
  echo "${label}: ${code} ${url}"
}

echo "Smoke test"
check_status "Main" "${MAIN_URL}"
check_status "Admin host" "${ADMIN_URL}"
check_status "Admin login" "${ADMIN_URL}/login"

redirect_headers="$(curl -sSI "${MAIN_URL}/admin")"
redirect_code="$(printf '%s\n' "${redirect_headers}" | awk '$1 ~ /^HTTP\// { code=$2 } END { print code }')"
redirect_location="$(printf '%s' "${redirect_headers}" | awk -F': ' 'tolower($1)=="location" { print $2 }' | tr -d '\r')"

echo "Admin redirect: ${redirect_code} ${MAIN_URL}/admin"
echo "Redirect target: ${redirect_location}"
