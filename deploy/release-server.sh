#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current}"
ENV_FILE="${ENV_FILE:-.env.production}"
PLESK_NODE_BIN="${PLESK_NODE_BIN:-/opt/plesk/node/24/bin}"
PM2_APP_NAME="${PM2_APP_NAME:-pure-therapeutic-art}"
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-20}"
HEALTHCHECK_DELAY_SECONDS="${HEALTHCHECK_DELAY_SECONDS:-1}"

. "${SCRIPT_DIR}/require-app-user.sh"
require_app_user "${APP_DIR}"

load_env_file() {
  local env_path="$1"
  local line key value

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"

    if [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    key="${line%%=*}"
    value="${line#*=}"

    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    if [[ ! "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      echo "Ongeldige env key in ${env_path}: ${key}"
      exit 1
    fi

    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    printf -v "${key}" '%s' "${value}"
    export "${key}"
  done < "${env_path}"
}

if [[ ! -x "${PLESK_NODE_BIN}/node" ]]; then
  echo "Node binary niet gevonden op ${PLESK_NODE_BIN}/node"
  exit 1
fi

export PATH="${PLESK_NODE_BIN}:$PATH"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 ontbreekt op PATH. Installeer eerst PM2."
  exit 1
fi

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Environment file ontbreekt: ${APP_DIR}/${ENV_FILE}"
  exit 1
fi

load_env_file "./${ENV_FILE}"

npm ci --include=dev
npm run build:standalone

if pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_APP_NAME}" --update-env
else
  pm2 start server.cjs --name "${PM2_APP_NAME}" --cwd "${APP_DIR}" --update-env
fi

pm2 save
pm2 status

HEALTHCHECK_URL="http://127.0.0.1:${PORT:-3000}"
for ((attempt = 1; attempt <= HEALTHCHECK_ATTEMPTS; attempt++)); do
  if curl -fsSI "${HEALTHCHECK_URL}" >/tmp/pure-therapeutic-art-healthcheck.txt 2>/dev/null; then
    sed -n '1,10p' /tmp/pure-therapeutic-art-healthcheck.txt
    exit 0
  fi

  if (( attempt < HEALTHCHECK_ATTEMPTS )); then
    sleep "${HEALTHCHECK_DELAY_SECONDS}"
  fi
done

echo "Health check mislukt voor ${HEALTHCHECK_URL}"
pm2 logs "${PM2_APP_NAME}" --lines 50 --nostream || true
exit 1
