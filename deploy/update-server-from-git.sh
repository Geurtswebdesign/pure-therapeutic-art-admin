#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current}"
REPO_REMOTE="${REPO_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-production}"

. "${SCRIPT_DIR}/require-app-user.sh"
require_app_user "${APP_DIR}"

cd "${APP_DIR}"

if [[ ! -d .git ]]; then
  echo "Deze servermap is geen git checkout: ${APP_DIR}"
  echo "Clone de GitHub-repo hier eerst als een echte working tree."
  exit 1
fi

if ! git remote get-url "${REPO_REMOTE}" >/dev/null 2>&1; then
  echo "Git remote '${REPO_REMOTE}' ontbreekt in ${APP_DIR}"
  exit 1
fi

# Reset generated Next.js metadata that may legitimately differ after local/server builds.
# If there are any other modifications left afterwards, the deploy should still abort.
git restore --staged --worktree --source=HEAD -- next-env.d.ts >/dev/null 2>&1 || true

dirty_status="$(git status --porcelain -- . ':(exclude).pm2')"
if [[ -n "${dirty_status}" ]]; then
  echo "De server worktree is niet schoon. Deploy afgebroken."
  printf '%s\n' "${dirty_status}"
  exit 1
fi

git fetch "${REPO_REMOTE}" "${DEPLOY_BRANCH}"
git checkout "${DEPLOY_BRANCH}"
git pull --ff-only "${REPO_REMOTE}" "${DEPLOY_BRANCH}"

echo "Deploying commit $(git rev-parse --short HEAD) from ${DEPLOY_BRANCH}"

bash deploy/release-server.sh
