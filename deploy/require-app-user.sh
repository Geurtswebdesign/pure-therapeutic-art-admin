#!/usr/bin/env bash

set -euo pipefail

path_owner() {
  local target="$1"

  if stat --version >/dev/null 2>&1; then
    stat -c '%U' "${target}"
  else
    stat -f '%Su' "${target}"
  fi
}

require_app_user() {
  local app_dir="$1"
  local current_user
  local owner

  if [[ ! -d "${app_dir}" ]]; then
    echo "App-directory ontbreekt: ${app_dir}"
    exit 1
  fi

  current_user="$(id -un)"
  owner="$(path_owner "${app_dir}")"

  if [[ "${current_user}" == "root" ]]; then
    echo "Draai dit script niet als root."
    echo "Gebruik de Plesk systeemgebruiker die eigenaar is van ${app_dir}: ${owner}"
    exit 1
  fi

  if [[ "${current_user}" != "${owner}" ]]; then
    echo "Dit script draait als '${current_user}', maar ${app_dir} is van '${owner}'."
    echo "Gebruik dezelfde gebruiker voor git, build en PM2."
    exit 1
  fi

  if [[ "${HOME:-}" == "/root" || "${PM2_HOME:-}" == "/root/.pm2" ]]; then
    echo "Een root PM2-omgeving is nog actief (HOME/PM2_HOME wijst naar /root)."
    echo "Open een sessie als '${owner}' en draai het script opnieuw."
    exit 1
  fi
}
