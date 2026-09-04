#!/usr/bin/env bash
# Deploy/refresh the live copy on the droplet. Run from your Mac:
#   scripts/deploy.sh            # pulls the branch, installs, builds, restarts
# First-time setup on the box (systemd unit, .env) is done by --init.
set -euo pipefail
HOST="${PARTYY_HOST:-root@159.203.120.222}"
BRANCH="${PARTYY_BRANCH:-kevin/self-hosted-audio}"
REPO="https://github.com/AkshajK/partyy.git"

ssh -o BatchMode=yes "$HOST" bash -s "$BRANCH" "$REPO" "${1:-}" <<'REMOTE'
set -euo pipefail
BRANCH="$1"; REPO="$2"; MODE="$3"
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 16 >/dev/null
mkdir -p /opt/partyy/audio
mkdir -p /opt/partyy/app
cd /opt/partyy/app
if [ ! -d .git ]; then
  git init -q && git remote add origin "$REPO"   # dir may already hold .env
fi
git fetch -q origin "$BRANCH"
git checkout -q "$BRANCH"
git reset -q --hard "origin/$BRANCH"
echo "at $(git log --oneline -1)"
npm ci --silent --no-audit --no-fund 2>&1 | tail -1 || npm install --silent --no-audit --no-fund 2>&1 | tail -1
NODE_ENV=production NODE_OPTIONS=--max-old-space-size=1400 npx webpack 2>&1 | grep -E "bundle.js|ERROR|error" | head -5
if [ "$MODE" = "--init" ]; then
  if [ ! -f /opt/partyy/app/.env ]; then
    echo "!! /opt/partyy/app/.env missing; create it (see .env.example) then rerun"; exit 1
  fi
  cat > /etc/systemd/system/partyy.service <<UNIT
[Unit]
Description=Partyy game server
After=network.target

[Service]
WorkingDirectory=/opt/partyy/app
ExecStart=$(dirname "$(nvm which 16)")/node server/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
User=root

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable -q partyy
fi
systemctl restart partyy
sleep 4
systemctl is-active partyy
journalctl -u partyy -n 6 --no-pager | tail -6
REMOTE
echo "--- public check ---"
curl -s -o /dev/null -w "https://partyy.kevinzhu.ai -> %{http_code}\n" https://partyy.kevinzhu.ai/
