#!/usr/bin/env bash
set -euo pipefail

MAIN_URL="${MAIN_URL:-https://pure-therapeutic-art-therapy.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.pure-therapeutic-art-therapy.com}"
SMOKE_FAILED=0

check_status() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${url}")"
  echo "${label}: ${code} ${url}"
}

check_route_assets() {
  local label="$1"
  local path="$2"
  local url="${MAIN_URL%/}${path}"
  local html

  html="$(curl -fsSL "${url}")"
  echo "Route assets: ${label} ${url}"

  while IFS= read -r asset; do
    [[ -n "${asset}" ]] || continue
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${MAIN_URL%/}${asset}")"
    echo "  ${code} ${asset}"
    if [[ "${code}" != "200" ]]; then
      SMOKE_FAILED=1
    fi
  done < <(
    printf '%s' "${html}" |
      grep -oE '/_next/static/chunks/[^"]+\.(js|css)' |
      sort -u
  )
}

echo "Smoke test"
check_status "Main" "${MAIN_URL}"
check_status "Trainingen" "${MAIN_URL}/trainingen"
check_status "Shop" "${MAIN_URL}/shop"
check_status "Therapeuten" "${MAIN_URL}/therapeuten"
check_status "Account" "${MAIN_URL}/account"
check_status "Admin host" "${ADMIN_URL}"
check_status "Admin login" "${ADMIN_URL}/login"

check_route_assets "Home" "/"
check_route_assets "Trainingen" "/trainingen"
check_route_assets "Shop" "/shop"
check_route_assets "Therapeuten" "/therapeuten"
check_route_assets "Account" "/account"

redirect_headers="$(curl -sSI "${MAIN_URL}/admin")"
redirect_code="$(printf '%s\n' "${redirect_headers}" | awk '$1 ~ /^HTTP\// { code=$2 } END { print code }')"
redirect_location="$(printf '%s' "${redirect_headers}" | awk -F': ' 'tolower($1)=="location" { print $2 }' | tr -d '\r')"

echo "Admin redirect: ${redirect_code} ${MAIN_URL}/admin"
echo "Redirect target: ${redirect_location}"

if [[ "${SMOKE_FAILED}" -ne 0 ]]; then
  echo "Smoke check mislukt: een of meer route-assets gaven geen 200."
  exit 1
fi
