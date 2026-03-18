#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current}"
REPO_REMOTE="${REPO_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-production}"

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

if [[ -n "$(git status --porcelain)" ]]; then
  echo "De server worktree is niet schoon. Deploy afgebroken."
  git status --short
  exit 1
fi

git fetch "${REPO_REMOTE}" "${DEPLOY_BRANCH}"
git checkout "${DEPLOY_BRANCH}"
git pull --ff-only "${REPO_REMOTE}" "${DEPLOY_BRANCH}"

echo "Deploying commit $(git rev-parse --short HEAD) from ${DEPLOY_BRANCH}"

bash deploy/release-server.sh
