# GitHub Auto Deploy

This repo can deploy automatically to the Plesk production server on every push to `main`.

The model is:

1. you push to GitHub
2. GitHub Actions opens an SSH session to the server
3. the server runs `git pull`
4. the server runs `bash deploy/release-server.sh`
5. PM2 restarts the Next.js app

## What is included

- GitHub Actions workflow: `.github/workflows/deploy-production.yml`
- Server update script: `deploy/update-server-from-git.sh`
- Release script: `deploy/release-server.sh`

## One-time local setup

This repo currently has no `origin` remote.

Add your GitHub repo as `origin`:

```bash
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

If `origin` already exists, update it instead:

```bash
git remote set-url origin git@github.com:<owner>/<repo>.git
```

## One-time server setup

The production app directory must be a real git checkout, not a manual upload copy.

Target directory:

```bash
/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current
```

### 1. Create a GitHub deploy key on the server

Run this on the server:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "pta-production" -N ""
cat ~/.ssh/github_deploy.pub
```

Add that public key in GitHub:

- Repo `Settings`
- `Deploy keys`
- `Add deploy key`
- enable read access

### 2. Make git use that key for GitHub

Add this to `~/.ssh/config` on the server:

```sshconfig
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
```

### 3. Clone the repo on the server

If the current app directory was created by manual uploads, the cleanest option is:

```bash
mv /var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current \
   /var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current-backup-$(date +%Y%m%d-%H%M%S)

git clone git@github.com:<owner>/<repo>.git \
  /var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current
```

Then restore the server-only env file:

```bash
cp /path/to/your/saved/.env.production \
  /var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current/.env.production
```

If you want to keep the existing directory in place, convert it carefully to a git checkout first. A fresh clone is safer.

### 4. First manual release

Run once on the server:

```bash
cd /var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current
bash deploy/release-server.sh
```

## GitHub secrets

Add these repo secrets in GitHub:

- `PROD_HOST`
  Example: `your.server.ip.or.hostname`
- `PROD_USER`
  The SSH user that may deploy on the server
- `PROD_PORT`
  Usually `22`
- `PROD_APP_DIR`
  Example: `/var/www/vhosts/pure-therapeutic-art-therapy.com/pure-therapeutic-art/current`
- `PROD_SSH_PRIVATE_KEY`
  The private SSH key GitHub Actions uses to SSH into the server

Important:

- this is a server access key, not the GitHub deploy key
- keep the GitHub deploy key and the GitHub Actions SSH key separate

## How deploys work after setup

After the one-time setup:

```bash
git push origin main
```

That push triggers the workflow and production updates automatically.

## Safety checks

`deploy/update-server-from-git.sh` will stop when:

- the server directory is not a git checkout
- the `origin` remote is missing
- the server worktree is dirty

That is deliberate. Production should not silently overwrite local hotfixes.
