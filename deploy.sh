#!/usr/bin/env bash
#
# Deploy script for Master RN (Android backend stack).
#
# Invoked by .github/workflows/deploy.yml over SSH as:
#     bash /var/www/master-rn-android/deploy.sh
#
# Note: this script updates itself. It is tracked in git, so the fast-forward
# below can rewrite this very file mid-run. Git writes a new file and renames
# it over the old one, so the running shell keeps reading the original inode
# and finishes safely, but a change to this script only takes effect on the
# NEXT deploy, never the one that pulled it.
#
# Usage:
#     ./deploy.sh              deploy whatever changed in the pulled commits
#     ./deploy.sh --force      run every step regardless of what changed
#
# The workflow already filters pushes by path (backend/, admin/, website/), so
# an android-app-only push never reaches here. The same filter is applied again
# below so a manual run does the right thing too: changes confined to
# android-app/ or docs rebuild nothing.

set -euo pipefail

# A non-interactive SSH shell has a minimal PATH; be explicit.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

REPO="/var/www/master-rn-android"
BRANCH="main"
PM2_APP="master-rn-backend"

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')" "$*"; }
fail() { printf '[%s] ERROR: %s\n' "$(date -u '+%Y-%m-%d %H:%M:%SZ')" "$*" >&2; exit 1; }

cd "$REPO" || fail "repo not found at $REPO"

# Refuse to run two deploys at once (a fast double-push would otherwise have
# npm and pm2 racing each other).
exec 9>/tmp/mrn-deploy.lock
flock -n 9 || fail "another deploy is already running"

log "deploy starting (force=$FORCE)"

# ---------------------------------------------------------------------------
# 1. Pull
# ---------------------------------------------------------------------------
OLD_SHA="$(git rev-parse HEAD)"
log "current commit: $(git log -1 --oneline)"

git fetch --quiet origin "$BRANCH"
# --ff-only: never create a merge commit on the server. If someone has edited
# tracked files here, this fails loudly instead of silently clobbering them.
git merge --ff-only "origin/$BRANCH" --quiet || fail "fast-forward failed; server has diverged from origin/$BRANCH"

NEW_SHA="$(git rev-parse HEAD)"

if [[ "$OLD_SHA" == "$NEW_SHA" ]]; then
  log "already up to date at ${NEW_SHA:0:7}"
else
  log "pulled ${OLD_SHA:0:7} -> ${NEW_SHA:0:7}"
  git log --oneline "$OLD_SHA..$NEW_SHA" | sed 's/^/    /'
fi

# ---------------------------------------------------------------------------
# 2. Work out what changed
# ---------------------------------------------------------------------------
CHANGED=""
if [[ "$OLD_SHA" != "$NEW_SHA" ]]; then
  CHANGED="$(git diff --name-only "$OLD_SHA" "$NEW_SHA")"
fi

changed_in() {
  [[ $FORCE -eq 1 ]] && return 0
  grep -q "^$1" <<<"$CHANGED"
}

if [[ $FORCE -eq 0 && -z "$CHANGED" ]]; then
  log "no new commits, nothing to do"
  exit 0
fi

if [[ $FORCE -eq 0 ]] && ! grep -qE '^(backend|admin|website)/' <<<"$CHANGED"; then
  log "no backend/admin/website changes (android-app or docs only), nothing to deploy"
  exit 0
fi

DID_WEB=0

# ---------------------------------------------------------------------------
# 3. Backend: dependencies + pm2 reload
# ---------------------------------------------------------------------------
if changed_in "backend/"; then
  log "backend: installing dependencies"
  cd "$REPO/backend"
  # Lockfile is committed, so ci gives a reproducible tree. It also removes any
  # stray local state. Fall back to install if the lockfile is out of sync.
  npm ci --omit=dev --silent || npm install --omit=dev --silent

  log "backend: reloading pm2 app '$PM2_APP'"
  if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    # reload = zero-downtime restart; --update-env re-reads .env changes.
    pm2 reload "$PM2_APP" --update-env
  else
    log "backend: '$PM2_APP' not running, starting it"
    pm2 start index.js --name "$PM2_APP" --cwd "$REPO/backend"
  fi
  pm2 save --force >/dev/null
  cd "$REPO"
else
  log "backend: unchanged, skipping"
fi

# ---------------------------------------------------------------------------
# 4. Admin panel: Vite build
# ---------------------------------------------------------------------------
if changed_in "admin/"; then
  log "admin: building"
  cd "$REPO/admin"
  [[ -f .env.production ]] || fail "admin/.env.production missing; build would point at localhost"
  # No package-lock.json is committed for admin/, so use install, not ci.
  npm install --silent
  # Vite reads .env.production automatically for a production build, which is
  # where VITE_API_BASE_URL=https://api.masterreactnative.me lives.
  npm run build
  cd "$REPO"
  DID_WEB=1
else
  log "admin: unchanged, skipping"
fi

# ---------------------------------------------------------------------------
# 5. Website: static, nothing to build
# ---------------------------------------------------------------------------
if changed_in "website/"; then
  log "website: static files updated in place"
  DID_WEB=1
else
  log "website: unchanged, skipping"
fi

# ---------------------------------------------------------------------------
# 6. nginx
# ---------------------------------------------------------------------------
if [[ $DID_WEB -eq 1 ]]; then
  log "nginx: testing config"
  sudo -n nginx -t
  log "nginx: reloading"
  sudo -n systemctl reload nginx
else
  log "nginx: no static changes, skipping reload"
fi

# ---------------------------------------------------------------------------
# 7. Health check
# ---------------------------------------------------------------------------
log "verifying backend health"
for i in $(seq 1 10); do
  if curl -fsS --max-time 3 http://127.0.0.1:5000/health >/dev/null; then
    log "health check OK"
    break
  fi
  [[ $i -eq 10 ]] && fail "backend did not become healthy after reload"
  sleep 1
done

log "deploy finished at $(git rev-parse --short HEAD)"
