# Gesti ERP — Bladjo Hotel

ERP hôtelier avec site public, interface d’administration et API REST.

## Stack technique

- **Backend** : Node.js, Express, Sequelize, MySQL
- **Frontend** : React, Vite
- **Production** : PM2, Nginx, Certbot

---

## Structure du projet

```text
bladjo/
├── hotel-erp-backend/
├── hotel-admin/
├── ecosystem.config.js
├── nginx-bladjo-hotel.conf
└── deploy-bladjo.sh
```

### Fichiers importants à la racine

- `ecosystem.config.js` : configuration PM2 du backend
- `nginx-bladjo-hotel.conf` : configuration Nginx de production
- `deploy-bladjo.sh` : script de déploiement automatisé

---

## Domaines et architecture de production

### Domaines utilisés

- **Public** : `https://www.bladjo-hotel.com`
- **API** : `https://api.bladjo-hotel.com`
- **Admin** : `https://myadmin.hotel-bladjo.com`

### Ports utilisés

Sur le VPS, un autre projet utilise déjà les ports **3000** et **5000**.

Ce projet utilise donc :

- **backend** : `127.0.0.1:3100`

### Architecture retenue

- **Nginx** sert le frontend React compilé depuis `hotel-admin/dist`
- **PM2** exécute le backend Node.js
- **Nginx** reverse-proxy l’API vers `127.0.0.1:3100`

---

## Fonctionnalités principales actuelles

### Partie publique

- liste des chambres
- liste des salles de réception
- pages détail chambre / salle
- galerie d’images
- calendrier de disponibilité
- réservation publique avec statut **en attente de validation**

### Partie admin

- connexion admin
- gestion des chambres
- gestion des salles
- gestion des réservations chambres
- gestion des réservations salles
- validation des demandes publiques
- upload d’images chambres / salles

### Règle métier importante

Une demande envoyée depuis le site public n’est **pas confirmée automatiquement**.

Elle est créée en **`PENDING`** puis doit être **validée sur la plateforme** par le gérant ou l’administrateur.

---

## Identifiants par défaut

Si les seeders ont été exécutés :

- **Email** : `admin@hotel-erp.com`
- **Mot de passe** : `Admin@123`

---

## Fichiers ignorés par Git

Le projet contient un `.gitignore` racine qui ignore notamment :

- `node_modules/`
- `dist/`
- `.env`, `.env.*`
- logs et caches
- uploads générés localement

Les secrets ne doivent jamais être versionnés.

---

## Développement local

### Backend

```bash
cd hotel-erp-backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend disponible sur :

- `http://localhost:3100`
- `http://localhost:3100/health`

### Frontend

Dans un autre terminal :

```bash
cd hotel-admin
npm install
npm run dev
```

Frontend disponible sur :

- `http://localhost:5173`

---

## Déploiement production sur VPS — étapes exactes

Cette section est écrite pour être suivie **commande par commande**.

### 1. Pré-requis du serveur

Le VPS doit avoir :

- Nginx
- Node.js 18+
- npm
- PM2
- MySQL
- Certbot

Si PM2 n’est pas installé :

```bash
npm install -g pm2
```

### 2. Copier le projet dans `/opt/bladjo`

Le projet doit être présent ici :

- `/opt/bladjo`

Puis entrer dans le dossier :

```bash
cd /opt/bladjo
```

### 3. Créer la base MySQL de production

Se connecter à MySQL :

```bash
mysql -u root -p
```

Créer la base et l’utilisateur :

```sql
CREATE DATABASE bladjo_erp_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bladjo_erp_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON bladjo_erp_prod.* TO 'bladjo_erp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Créer le fichier d’environnement backend

```bash
cd /opt/bladjo/hotel-erp-backend
cp .env.production.example .env
nano .env
```

Renseigner au minimum dans `.env` :

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3100
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bladjo_erp_prod
DB_USER=bladjo_erp_user
DB_PASSWORD=CHANGE_ME_TO_A_STRONG_DB_PASSWORD
JWT_SECRET=CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_64_CHARACTERS
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=CHANGE_ME_TO_ANOTHER_LONG_RANDOM_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://www.bladjo-hotel.com,https://myadmin.hotel-bladjo.com
```

### 5. Préparer les DNS

Les entrées suivantes doivent pointer vers l’IP du VPS :

- `www.bladjo-hotel.com`
- `api.bladjo-hotel.com`
- `myadmin.hotel-bladjo.com`

### 6. Préparer un bootstrap HTTP temporaire pour Certbot

Créer le dossier de challenge :

```bash
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
```

Créer une configuration Nginx temporaire HTTP uniquement :

```bash
cat > /etc/nginx/sites-available/bladjo-bootstrap <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.bladjo-hotel.com api.bladjo-hotel.com myadmin.hotel-bladjo.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'bladjo bootstrap ok';
        add_header Content-Type text/plain;
    }
}
EOF
ln -sfn /etc/nginx/sites-available/bladjo-bootstrap /etc/nginx/sites-enabled/bladjo-bootstrap
nginx -t
systemctl reload nginx
```

### 7. Générer le certificat SSL

Lancer exactement cette commande :

```bash
certbot certonly --webroot -w /var/www/certbot \
  --cert-name bladjo-stack \
  -d www.bladjo-hotel.com \
  -d api.bladjo-hotel.com \
  -d myadmin.hotel-bladjo.com \
  --email TON_EMAIL \
  --agree-tos \
  --no-eff-email
```

Tester le renouvellement :

```bash
certbot renew --dry-run
```

### 8. Lancer le déploiement automatisé

Depuis la racine du projet :

```bash
cd /opt/bladjo
chmod +x deploy-bladjo.sh
./deploy-bladjo.sh
```

Ce script fait automatiquement :

- création de `hotel-admin/.env.production`
- installation backend avec `npm ci`
- migrations backend
- installation frontend avec `npm ci`
- build frontend
- démarrage ou reload PM2
- installation de la conf Nginx
- test Nginx
- reload Nginx

### 9. Supprimer le bootstrap HTTP temporaire puis activer PM2 au redémarrage

```bash
rm -f /etc/nginx/sites-enabled/bladjo-bootstrap
rm -f /etc/nginx/sites-available/bladjo-bootstrap
nginx -t
systemctl reload nginx
```

Puis :

Après le premier déploiement :

```bash
pm2 startup
pm2 save
```

Si PM2 affiche une commande supplémentaire, exécute-la exactement.

---

## Déploiement manuel si tu ne veux pas utiliser le script

### Backend

```bash
cd /opt/bladjo/hotel-erp-backend
npm ci
npm run db:migrate
```

### Frontend

```bash
cd /opt/bladjo/hotel-admin
cat > .env.production <<'EOF'
VITE_API_BASE_URL=https://api.bladjo-hotel.com/api
EOF
npm ci
npm run build
```

### PM2

```bash
cd /opt/bladjo
pm2 start ecosystem.config.js --env production
pm2 save
```

### Nginx

```bash
mv /opt/bladjo/nginx-bladjo-hotel.conf /etc/nginx/sites-available/bladjo-hotel
ln -sfn /etc/nginx/sites-available/bladjo-hotel /etc/nginx/sites-enabled/bladjo-hotel
nginx -t
systemctl reload nginx
```

---

## Vérifications après déploiement

Exécuter ces commandes :

```bash
pm2 status
pm2 logs bladjo-api --lines 50
nginx -t
curl -I https://www.bladjo-hotel.com
curl -I https://myadmin.hotel-bladjo.com
curl -I https://api.bladjo-hotel.com/health
```

Tout doit répondre sans erreur 502.

---

## Checklist fonctionnelle post-déploiement

### Public

- la page d’accueil s’ouvre
- la liste des chambres s’affiche
- la liste des salles s’affiche
- les images s’affichent
- les détails chambre / salle s’ouvrent
- le calendrier de disponibilité s’affiche
- la sélection d’intervalle fonctionne

### Réservations publiques

- une réservation chambre peut être envoyée
- une réservation salle peut être envoyée
- le message affiché indique **en attente de validation**

### Admin

- connexion sur `https://myadmin.hotel-bladjo.com/login`
- liste des chambres OK
- liste des salles OK
- liste des réservations chambres OK
- liste des réservations salles OK
- les demandes publiques arrivent en **attente de validation**
- le gérant / admin peut cliquer sur **Valider**

### API / serveur

- `https://api.bladjo-hotel.com/health` répond correctement
- pas d’erreur CORS dans le navigateur
- pas d’erreur critique dans `pm2 logs`

---

## Commandes utiles

### Backend

```bash
cd hotel-erp-backend
npm run db:migrate
npm run db:migrate:undo
npm run db:seed
npm run db:seed:undo
npm run db:reset
```

### Frontend

```bash
cd hotel-admin
npm run dev
npm run build
npm run preview
```

### PM2

```bash
pm2 status
pm2 logs bladjo-api
pm2 restart bladjo-api --update-env
pm2 save
```

### Nginx

```bash
nginx -t
systemctl reload nginx
systemctl status nginx
```

---

## Fichiers de configuration de production présents dans le dépôt

- `ecosystem.config.js`
- `nginx-bladjo-hotel.conf`
- `deploy-bladjo.sh`
- `hotel-erp-backend/.env.production.example`

---

## Notes importantes

### 1. Ne pas lancer Vite en production

En production, le frontend doit être servi par **Nginx** depuis `hotel-admin/dist`.

### 2. Ne pas exposer le backend directement sur Internet

Le backend doit rester sur :

- `127.0.0.1:3100`

Il doit être exposé publiquement uniquement via Nginx sur :

- `https://api.bladjo-hotel.com`

### 3. Les secrets ne doivent jamais être commités

Ne versionne jamais :

- `.env`
- mots de passe MySQL
- secrets JWT réels

