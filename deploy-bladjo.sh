#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="bladjo-api"
FRONT_NAME="bladjo-front"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/hotel-erp-backend"
FRONTEND_DIR="$ROOT_DIR/hotel-admin"
ECOSYSTEM_FILE="$ROOT_DIR/ecosystem.config.js"
NGINX_SOURCE="$ROOT_DIR/nginx-bladjo-hotel.conf"
NGINX_TARGET="/etc/nginx/sites-available/bladjo-hotel"
NGINX_ENABLED="/etc/nginx/sites-enabled/bladjo-hotel"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
BACKEND_ENV_EXAMPLE="$BACKEND_DIR/.env.production.example"
FRONTEND_ENV_FILE="$FRONTEND_DIR/.env.production"
CERT_DIR="/etc/letsencrypt/live/bladjo-stack"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "❌ Ce script doit être exécuté en root ou avec sudo disponible."
    exit 1
  fi
else
  SUDO=""
fi

log() {
  echo
  echo "==> $1"
}

fail() {
  echo "❌ $1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Commande manquante : $1"
}

require_file() {
  [[ -f "$1" ]] || fail "Fichier introuvable : $1"
}

trap 'echo "❌ Erreur à la ligne $LINENO" >&2' ERR

for cmd in npm pm2 nginx systemctl curl; do
  require_cmd "$cmd"
done

require_file "$ECOSYSTEM_FILE"
require_file "$NGINX_SOURCE"

if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
  if [[ -f "$BACKEND_ENV_EXAMPLE" ]]; then
    cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV_FILE"
    fail "Le fichier $BACKEND_ENV_FILE vient d'être créé. Renseigne les vrais secrets puis relance le script."
  fi
  fail "Le fichier $BACKEND_ENV_FILE est requis."
fi

if [[ ! -f "$CERT_DIR/fullchain.pem" || ! -f "$CERT_DIR/privkey.pem" ]]; then
  fail "Certificat SSL manquant dans $CERT_DIR. Exécute Certbot avant ce script."
fi

log "Création du .env.production frontend"
cat > "$FRONTEND_ENV_FILE" <<'EOF'
VITE_API_BASE_URL=https://api.bladjo-hotel.com/api
EOF

log "Installation backend"
cd "$BACKEND_DIR"
npm ci

log "Migrations backend"
npm run db:migrate

log "Installation frontend"
cd "$FRONTEND_DIR"
npm ci

log "Build frontend"
npm run build

log "Déploiement PM2 frontend"
cd "$ROOT_DIR"
if pm2 describe "$FRONT_NAME" >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM_FILE" --env production --only "$FRONT_NAME"
else
  pm2 start "$ECOSYSTEM_FILE" --env production --only "$FRONT_NAME"
fi

log "Déploiement PM2 backend"
cd "$ROOT_DIR"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM_FILE" --env production --only "$APP_NAME"
else
  pm2 start "$ECOSYSTEM_FILE" --env production --only "$APP_NAME"
fi
pm2 save

log "Installation configuration Nginx"
$SUDO cp "$NGINX_SOURCE" "$NGINX_TARGET"
$SUDO ln -sfn "$NGINX_TARGET" "$NGINX_ENABLED"
$SUDO nginx -t
$SUDO systemctl reload nginx

log "Vérifications rapides"
curl -I -fsS http://127.0.0.1:4173 >/dev/null && echo "✅ Frontend local PM2 OK"
curl -fsS http://127.0.0.1:3100/health >/dev/null && echo "✅ Backend local OK"
curl -fsS https://api.bladjo-hotel.com/health >/dev/null && echo "✅ API publique OK"
curl -I -fsS https://www.bladjo-hotel.com >/dev/null && echo "✅ Front public OK"
curl -I -fsS https://myadmin.hotel-bladjo.com >/dev/null && echo "✅ Front admin OK"

echo
echo "🎉 Déploiement terminé."
echo "   - Frontend  : PM2 ($FRONT_NAME)"
echo "   - Backend   : PM2 ($APP_NAME)"
echo "   - Public    : https://www.bladjo-hotel.com"
echo "   - Admin     : https://myadmin.hotel-bladjo.com"
echo "   - API       : https://api.bladjo-hotel.com"
