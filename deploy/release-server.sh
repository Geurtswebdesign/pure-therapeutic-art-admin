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

resolve_pm2_bin() {
  local -a candidates=()
  local current_path=""
  local npm_prefix=""
  local npm_root=""

  current_path="$(command -v pm2 2>/dev/null || true)"
  if [[ -n "${current_path}" ]]; then
    candidates+=("${current_path}")
  fi

  candidates+=("${PLESK_NODE_BIN}/pm2")

  npm_prefix="$(npm config get prefix 2>/dev/null || true)"
  if [[ -n "${npm_prefix}" && "${npm_prefix}" != "undefined" ]]; then
    candidates+=("${npm_prefix}/bin/pm2")
  fi

  npm_root="$(npm root -g 2>/dev/null || true)"
  if [[ -n "${npm_root}" && "${npm_root}" != "undefined" ]]; then
    candidates+=("${npm_root}/pm2/bin/pm2")
  fi

  candidates+=(
    "${HOME}/.npm-global/bin/pm2"
    "${HOME}/.nodenv/shims/pm2"
    "${HOME}/bin/pm2"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -n "${candidate}" && -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

if [[ ! -x "${PLESK_NODE_BIN}/node" ]]; then
  echo "Node binary niet gevonden op ${PLESK_NODE_BIN}/node"
  exit 1
fi

export PATH="${PLESK_NODE_BIN}:$PATH"

PM2_BIN="$(resolve_pm2_bin || true)"

if [[ -z "${PM2_BIN}" ]]; then
  echo "PM2 niet gevonden. Controleer PATH, npm global prefix of nodenv shims."
  exit 1
fi

export PATH="$(dirname "${PM2_BIN}"):${PATH}"

cd "${APP_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Environment file ontbreekt: ${APP_DIR}/${ENV_FILE}"
  exit 1
fi

load_env_file "./${ENV_FILE}"

npm ci --include=dev
npm run build:standalone

if "${PM2_BIN}" describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  "${PM2_BIN}" restart "${PM2_APP_NAME}" --update-env
else
  "${PM2_BIN}" start server.cjs --name "${PM2_APP_NAME}" --cwd "${APP_DIR}" --update-env
fi

"${PM2_BIN}" save
"${PM2_BIN}" status

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
"${PM2_BIN}" logs "${PM2_APP_NAME}" --lines 50 --nostream || true
exit 1
