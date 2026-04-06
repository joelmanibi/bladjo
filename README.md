# Gesti ERP — Hôtel & Immobilier

Système de gestion ERP complet pour hôtels et biens immobiliers.  
Stack : **Node.js · Express · MySQL · Sequelize** (backend) + **React · Vite** (frontend).

---

## Structure du projet

```
gesti-erp/
├── hotel-erp-backend/   # API REST — Node.js / Express / Sequelize / MySQL
└── hotel-admin/         # Interface admin — React 18 / Vite
```

## Fichiers ignorés par Git

Un fichier `.gitignore` racine est prévu pour éviter de versionner :

- les dépendances (`node_modules/`)
- les builds frontend (`hotel-admin/dist/`)
- les fichiers sensibles (`.env`, `.env.*`, secrets locaux)
- les logs et caches temporaires
- les uploads générés localement (`hotel-erp-backend/uploads/...`)

> Important : les fichiers d'environnement et les médias uploadés ne doivent pas être considérés comme des artefacts à versionner. En production, ils doivent être gérés séparément (variables d'environnement, stockage persistant, sauvegardes).

---

## Prérequis

| Outil | Version minimale |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| MySQL | 8.x |

---

## 1 — Démarrage en développement

### 1.1 Backend — `hotel-erp-backend`

#### a) Installer les dépendances
```bash
cd hotel-erp-backend
npm install
```

#### b) Créer le fichier d'environnement
```bash
cp .env.example .env   # ou créer manuellement le fichier .env
```

Contenu minimal du fichier `.env` :
```env
NODE_ENV=development

# Serveur
PORT=3000
HOST=0.0.0.0

# Base de données
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hotel_erp_dev
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### c) Créer la base de données MySQL
```sql
CREATE DATABASE hotel_erp_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### d) Appliquer toutes les migrations (crée les tables)
```bash
npm run db:migrate
```

#### e) Insérer les données de départ (seeders)
```bash
npm run db:seed
```

> Les seeders insèrent : un compte **admin**, 2 immeubles (IM1, IM2), 5 niveaux et 1 appartement exemple (AP1).

#### f) Lancer le serveur en mode développement (rechargement auto)
```bash
npm run dev
```

API disponible sur → **http://localhost:3000**  
Health check → **http://localhost:3000/health**

---

### 1.2 Frontend — `hotel-admin`

#### a) Installer les dépendances
```bash
cd hotel-admin
npm install
```

#### b) Vérifier l'URL de l'API
Dans `src/services/api.js`, l'URL de base doit pointer vers le backend :
```js
baseURL: 'http://localhost:3000/api'
```

#### c) Lancer le serveur de développement Vite
```bash
npm run dev
```

Interface disponible sur → **http://localhost:5173**

---

### 1.3 Compte de connexion par défaut (seeder)

| Champ | Valeur |
|---|---|
| Email | `admin@hotel-erp.com` |
| Mot de passe | `Admin@123` |
| Rôle backend | `ADMIN` → `SUPER_ADMIN` côté frontend |

---

## 2 — Démarrage en production

### 2.1 Backend

#### a) Créer la base de données de production
```sql
CREATE DATABASE hotel_erp_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### b) Configurer les variables d'environnement sur le serveur
```env
NODE_ENV=production

PORT=3000
HOST=0.0.0.0

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hotel_erp_prod
DB_USER=erp_user
DB_PASSWORD=mot_de_passe_fort

JWT_SECRET=secret_jwt_64_caracteres_minimum
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://votre-domaine.com
```

#### c) Installer les dépendances de production uniquement
```bash
cd hotel-erp-backend
npm install --omit=dev
```

#### d) Appliquer les migrations
```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

#### e) Insérer le compte admin initial (si première installation)
```bash
NODE_ENV=production npx sequelize-cli db:seed --seed 20260222000002-admin-user.js
```

#### f) Démarrer le serveur
```bash
npm start
# ou avec PM2 (recommandé en production) :
pm2 start server.js --name gesti-erp-api
pm2 save
```

---

### 2.2 Frontend

#### a) Construire le bundle de production
```bash
cd hotel-admin
npm install --omit=dev
npm run build
```

Le dossier `dist/` est généré — il contient les fichiers statiques à servir.

#### b) Servir avec Nginx (recommandé)

Exemple de configuration Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend React (SPA)
    root /var/www/gesti-erp/hotel-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy vers l'API backend
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 3 — Commandes utiles

### Backend
```bash
# Appliquer toutes les migrations
npm run db:migrate

# Annuler toutes les migrations
npm run db:migrate:undo

# Lancer tous les seeders
npm run db:seed

# Annuler tous les seeders
npm run db:seed:undo

# Réinitialiser complètement la base (undo + migrate + seed)
npm run db:reset
```

### Frontend
```bash
npm run dev       # Serveur de développement (port 5173)
npm run build     # Build de production → dist/
npm run preview   # Prévisualiser le build de production localement
```

---

## 4 — Endpoints API principaux

| Module | Base URL |
|---|---|
| Authentification | `POST /api/auth/login` |
| Chambres | `/api/rooms` |
| Réservations | `/api/bookings` |
| Immeubles | `/api/buildings` |
| Niveaux | `/api/floors` |
| Appartements | `/api/apartments` |
| Locataires | `/api/tenants` |
| Baux | `/api/leases` |
| Salles | `/api/halls` |
| Stock | `/api/items` |
| Bons d'achat | `/api/purchase-requests` |
| Employés | `/api/employees` |
| Paiements | `/api/payments` |
| Dashboard | `GET /api/dashboard` |

