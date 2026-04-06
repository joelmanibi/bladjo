#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="bladjo-api"
FRONT_NAME="bladjo-front"
BACK_PORT="3100"
FRONT_PORT="4173"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/hotel-erp-backend"
FRONTEND_DIR="$ROOT_DIR/hotel-admin"
ECOSYSTEM_FILE="$ROOT_DIR/ecosystem.config.js"
NGINX_SOURCE="$ROOT_DIR/nginx-bladjo-hotel.conf"
NGINX_TARGET="/etc/nginx/sites-available/bladjo-hotel"
NGINX_ENABLED="/etc/nginx/sites-enabled/bladjo-hotel"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
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

wait_for_http_head() {
  local url="$1"
  local label="$2"
  local retries="${3:-20}"
  local delay="${4:-2}"

  for ((i=1; i<=retries; i++)); do
    if curl -I -fsS "$url" >/dev/null 2>&1; then
      echo "✅ $label"
      return 0
    fi
    sleep "$delay"
  done

  fail "Vérification échouée : $label ($url)"
}

wait_for_http_get() {
  local url="$1"
  local label="$2"
  local retries="${3:-20}"
  local delay="${4:-2}"

  for ((i=1; i<=retries; i++)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "✅ $label"
      return 0
    fi
    sleep "$delay"
  done

  fail "Vérification échouée : $label ($url)"
}

trap 'echo "❌ Erreur à la ligne $LINENO" >&2' ERR

for cmd in npm pm2 nginx systemctl curl; do
  require_cmd "$cmd"
done

require_file "$ECOSYSTEM_FILE"
require_file "$NGINX_SOURCE"
require_file "$BACKEND_ENV_FILE"
require_file "$FRONTEND_ENV_FILE"

if [[ ! -f "$CERT_DIR/fullchain.pem" || ! -f "$CERT_DIR/privkey.pem" ]]; then
  fail "Certificat SSL manquant dans $CERT_DIR. Exécute Certbot avant ce script."
fi

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
require_file "$FRONTEND_DIR/dist/index.html"

log "Déploiement PM2 frontend"
cd "$ROOT_DIR"
if pm2 describe "$FRONT_NAME" >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM_FILE" --env production --only "$FRONT_NAME"
else
  pm2 start "$ECOSYSTEM_FILE" --env production --only "$FRONT_NAME"
fi
pm2 describe "$FRONT_NAME" >/dev/null 2>&1 || fail "Le processus PM2 frontend n'a pas démarré correctement."

log "Déploiement PM2 backend"
cd "$ROOT_DIR"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM_FILE" --env production --only "$APP_NAME"
else
  pm2 start "$ECOSYSTEM_FILE" --env production --only "$APP_NAME"
fi
pm2 describe "$APP_NAME" >/dev/null 2>&1 || fail "Le processus PM2 backend n'a pas démarré correctement."
pm2 save

log "Installation configuration Nginx"
$SUDO cp "$NGINX_SOURCE" "$NGINX_TARGET"
$SUDO ln -sfn "$NGINX_TARGET" "$NGINX_ENABLED"
$SUDO nginx -t
$SUDO systemctl reload nginx

log "Vérifications rapides"
wait_for_http_head "http://127.0.0.1:${FRONT_PORT}" "Frontend local PM2 OK"
wait_for_http_get "http://127.0.0.1:${BACK_PORT}/health" "Backend local OK"
wait_for_http_get "https://api.bladjo-hotel.com/health" "API publique OK"
wait_for_http_head "https://www.bladjo-hotel.com" "Front public OK"
wait_for_http_head "https://www.bladjo-hotel.com/login" "Front admin OK"

echo
echo "🎉 Déploiement terminé."
echo "   - Frontend  : PM2 ($FRONT_NAME)"
echo "   - Backend   : PM2 ($APP_NAME)"
echo "   - Public    : https://www.bladjo-hotel.com"
echo "   - Admin     : https://www.bladjo-hotel.com/login"
echo "   - API       : https://api.bladjo-hotel.com"
