# Afrikedge — Planification des Transports (SEFS1026)

Application web full-stack d'affectation et de gestion des tournées de transport de marchandises, réalisée dans le cadre du test technique d'évaluation **Senior Full-Stack Software Engineer (Réf. : SEFS1026)**.

---

## 1. Vue d'Ensemble & Fonctionnalités Implémentées

Le système répond à l'intégralité du cahier des charges décrit dans le sujet officiel **Afrikedge - Test technique SEFS1026** :

1. **Gestion des Commandes de Vente à Planifier** (`/sales-orders`) :
   - Filtrage serveur par ville de livraison.
   - Recherche textuelle instantanée.
   - Pagination SQL serveur déterministe avec synchronisation totale de la pagination UI.
   - Multi-sélection conservée à travers toutes les pages (`selectedOrdersMap`).
   - Modal d'affectation groupée atomique (vers un nouveau transport ou un brouillon existant) avec jauge prévisionnelle en direct.

2. **Suivi des Ordres de Transport** (`/transport-orders`) :
   - Liste paginée avec filtres cumulables par statut (`Brouillon`, `Validé`, `Parti`) et par date.
   - Création de tournées brouillons avec calendrier interactif et sélection de véhicules actifs.
   - Navigation directe vers le détail de la tournée.

3. **Détail & Supervision d'une Tournée** (`/transport-orders/:no`) :
   - Informations complètes : véhicule, immatriculation, date, statuts, créateur, validateur.
   - Jauge de remplissage dynamique et lisible (poids cumulé vs capacité nominale).
   - Ajout et retrait de commandes de vente avec dialogues de confirmation sécurisés.
   - Validation officielle de l'ordre (réservée au profil `LOGISTICS_MANAGER`).
   - Départ de l'ordre (accessible aux profils `DISPATCHER` et `LOGISTICS_MANAGER`).

4. **Gestion des Utilisateurs & Rôles Démo** :
   - Sélecteur d'utilisateur dans l'en-tête de l'application (`diane` / `eric`).
   - Envoi systématique de l'en-tête `X-User-Id` sur toutes les requêtes API.
   - Résolution stricte et non contournable des rôles côté serveur (`UserGuard`).

5. **Internationalisation (Bonus Réalisé)** :
   - Support bilingue complet **Français (FR)** et **Anglais (EN)** avec `vue-i18n`.
   - Sélecteur de langue dynamique dans la barre de navigation.
   - Persistance locale du choix linguistique avec fallback sécurisé.
   - Formatage internationalisé des dates et nombres (`Intl`).

6. **Documentation Swagger / OpenAPI (Bonus Réalisé)** :
   - Spécification OpenAPI 3.0 intégrée, accessible sur `/docs` et `/api/docs`.

---

## 2. Stack Technique Réelle

- **Base de données** : Microsoft SQL Server 2022 (Docker), schéma ERP officiel respecté sans altération.
- **Accès base de données** : Requêtes SQL paramétrées avec la bibliothèque officielle [`mssql`](https://www.npmjs.com/package/mssql) ; **AUCUN ORM**.
- **Backend (API)** : [NestJS 12](https://nestjs.com/), TypeScript en mode strict, `class-validator`, `class-transformer`, `@nestjs/swagger`.
- **Frontend (Web)** : [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`), TypeScript strict, [Pinia](https://pinia.vuejs.org/), [Vue Router](https://router.vuejs.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn Vue](https://www.shadcn-vue.com/), Lucide Icons, Vue Sonner.
- **Tests** : [Vitest](https://vitest.dev/) (backend) et Node Test Runner (frontend i18n).
- **Linter & Outils** : Oxlint, Prettier, Vue-TSC, Vite.

---

## 3. Prérequis

- [Node.js](https://nodejs.org/) v20.x ou v22.x (testé sur v24.x)
- [npm](https://www.npmjs.com/) v9+ ou v10+
- [Docker](https://www.docker.com/) & Docker Compose

---

## 4. Installation et Démarrage Pas à Pas

### 4.1. Base de Données SQL Server

Dans le dossier `database/` :
```bash
cd database
docker compose up -d
```

Attendez que le conteneur soit en état `healthy` (environ 20 à 30 secondes, vérifiable avec `docker compose ps`).

Initialisez ensuite la base et le jeu d'essai officiel :
```bash
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Afk_Transport2026" -C \
  -i /scripts/init.sql
```
> **Remarque** : Le script `init.sql` peut être ré-exécuté à tout moment si vous souhaitez réinitialiser l'environnement à zéro.

### 4.2. Backend (API NestJS)

Dans le dossier `api/` :
```bash
cd api
cp .env.example .env
npm install
npm run start:dev
```
L'API est prête et écoute sur `http://localhost:3000`.

- **Documentation Swagger interactif** : `http://localhost:3000/docs` ou `http://localhost:3000/api/docs`
- **Endpoints directs** : `http://localhost:3000/sales-orders/to-plan`, `http://localhost:3000/vehicles`, `http://localhost:3000/transport-orders`

### 4.3. Frontend (Application Web Vue 3)

Dans le dossier `web/` :
```bash
cd web
npm install
npm run dev
```
L'application web est accessible sur `http://localhost:5173`.
Elle proxifie automatiquement les requêtes `/api/*` vers l'instance NestJS locale (`http://localhost:3000`).

---

## 5. Configuration et Variables d'Environnement

Le fichier `api/.env.example` documente les paramètres nécessaires :

```env
PORT=3000
DB_SERVER=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=Afk_Transport2026
DB_DATABASE=TransportPlanning
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

---

## 6. Rôles Utilisateurs et Démonstration

L'application prend en charge les deux profils définis par l'évaluation :

| Identifiant | Rôle ERP | Actions Autorisées |
|---|---|---|
| `diane` | `DISPATCHER` | Créer des ordres de transport, affecter et retirer des commandes sur brouillons, marquer un ordre validé comme **Parti**. |
| `eric` | `LOGISTICS_MANAGER` | Toutes les actions de Diane + **Validation officielle** d'un ordre brouillon non vide. |

### Comment tester les rôles :
1. Utilisez le **sélecteur de profil** situé dans l'en-tête (en haut à droite) ou sur la page `/select-user`.
2. En tant que `diane`, l'action de validation est masquée dans l'interface et bloquée côté API avec un code HTTP `403 Forbidden`.
3. Basculez sur `eric` : le bouton "Valider l'ordre" devient actif et l'ordre passe au statut Validé.

---

## 7. Règles Métier & Garanties d'Intégrité Concurrente

| Règle Métier | Statut | Comportement API & Verrous SQL |
|---|---|---|
| **Création en Brouillon (`0`)** | `PASS` | Tout nouvel ordre démarre obligatoirement avec `Status = 0`. |
| **Véhicule actif uniquement** | `PASS` | Rejette les véhicules hors service (`Active = 0`) avec code 409 Conflict. |
| **Date non passée** | `PASS` | Rejette les dates antérieures à aujourd'hui avec code 400 Bad Request. |
| **Véhicule unique par date** | `PASS` | Verrou `WITH (UPDLOCK, HOLDLOCK)` sur `(Vehicle Code, Delivery Date)`. Code 409 Conflict en cas de doublon. |
| **Commandes au statut À planifier (`0`)** | `PASS` | Seules les commandes au statut `0` peuvent être intégrées à un ordre. |
| **Exclusivité de commande** | `PASS` | Une commande ne peut appartenir qu'à un seul ordre de transport (verrouillé dans la transaction). |
| **Atomicité de l'affectation groupée** | `PASS` | Si une seule commande est invalide ou dépasse la capacité, rollback complet garanti sans altération partielle. |
| **Contrôle strict de capacité véhicule** | `PASS` | Vérification en centièmes de kg pour éliminer tout arrondi flottant. Dépassement rejeté avec code 409. |
| **Transition à l'affectation (`0` &rarr; `1`)** | `PASS` | Les commandes passent au statut `1` (Planifiée) dans la même transaction que l'insertion des lignes. |
| **Restauration au retrait (`1` &rarr; `0`)** | `PASS` | Retirer une commande d'un brouillon restaure son statut à `0` (À planifier). |
| **Modification sur Brouillon seul** | `PASS` | Interdiction formelle d'ajouter ou retirer des commandes sur des ordres Validés ou Partis. |
| **Validation réservée au Responsable** | `PASS` | Résolution stricte du rôle côté serveur : rejeté avec code 403 pour tout rôle autre que `LOGISTICS_MANAGER`. |
| **Validation requiert &ge; 1 commande** | `PASS` | Rejette la validation d'une tournée vide avec code 409 Conflict. |
| **Verrouillage après validation** | `PASS` | Statut fixé à `1` (Validé) et horodaté avec `Validated By`. L'ordre n'est plus modifiable. |
| **Départ d'une tournée validée** | `PASS` | Passe l'ordre au statut `2` (Parti) et bascule toutes ses commandes au statut `2` (En livraison) atomiquement. |

---

## 8. Contrat API & Endpoints

| Méthode | Route | Rôle Requis | Description |
|---|---|---|---|
| `GET` | `/sales-orders/to-plan` | Tout utilisateur | Commandes à planifier avec filtre ville (`?city=Douala`) et pagination (`?page=1&limit=10`). |
| `GET` | `/vehicles` | Tout utilisateur | Liste des véhicules en service actif (`Active = 1`). |
| `GET` | `/transport-orders` | Tout utilisateur | Liste paginée des ordres avec filtres statut (`?status=0`) et date (`?date=2026-10-27`). |
| `GET` | `/transport-orders/:no` | Tout utilisateur | Détail de la tournée, commandes associées, poids cumulé et capacité nominale. |
| `POST` | `/transport-orders` | `DISPATCHER`, `LOGISTICS_MANAGER` | Création d'une nouvelle tournée brouillon (`{ vehicleCode, deliveryDate }`). |
| `POST` | `/transport-orders/:no/lines` | `DISPATCHER`, `LOGISTICS_MANAGER` | Affectation groupée atomique (`{ salesOrderNos: ["SO-1008", "SO-1009"] }`). |
| `DELETE` | `/transport-orders/:no/lines/:salesOrderNo` | `DISPATCHER`, `LOGISTICS_MANAGER` | Retrait d'une commande d'un brouillon et restauration du statut `0`. |
| `POST` | `/transport-orders/:no/validate` | `LOGISTICS_MANAGER` uniquement | Validation officielle de la tournée brouillon. |
| `POST` | `/transport-orders/:no/depart` | `DISPATCHER`, `LOGISTICS_MANAGER` | Départ de la tournée validée et bascule des commandes au statut En livraison (`2`). |

---

## 9. Résultats de Vérification et Tests Automatisés

### 9.1. Backend (`api/`)
```bash
cd api

# 1. Tests unitaires et d'intégration métier Vitest (57 tests réussis)
npm test

# 2. Vérification statique des types TypeScript (0 erreur)
npx tsc --noEmit

# 3. Linter Oxlint (0 warning, 0 erreur)
npm run lint

# 4. Compilation de production NestJS (build réussi)
npm run build
```

### 9.2. Frontend (`web/`)
```bash
cd web

# 1. Tests de conformité de l'internationalisation i18n (7 suites réussies)
npm test

# 2. Vérification des types Vue-TSC et compilation Vite (build réussi)
npm run build
```

---

## 10. Décisions Techniques et Choix d'Architecture

1. **Requêtes Paramétrées `mssql` sans ORM** :
   - Conformément aux consignes formelles, aucun ORM n'a été introduit.
   - Les identifiants SQL ERP contenant des espaces et parenthèses (ex. `[Sales Order]`, `[Total Weight (kg)]`, `[Transport Order Line]`) sont strictement respectés.
   - Toutes les entrées utilisateurs sont paramétrées (`@status`, `@date`, etc.), éliminant tout risque d'injection SQL.
   - Les sorties API sont transformées en camelCase propre.

2. **Fiabilité Concurrente par Transactions et Verrous SQL Server** :
   - Les mutations d'état s'exécutent dans des transactions isolées (`withTransaction`).
   - L'utilisation ciblée de verrous d'exclusion et de mise à jour `WITH (UPDLOCK, HOLDLOCK)` empêche les courses critiques :
     - Deux répartiteurs ne peuvent pas réserver le même véhicule le même jour.
     - Une commande ne peut pas être affectée simultanément à deux tournées concurrentes.
     - La capacité nominale du véhicule ne peut pas être dépassée en cas de requêtes simultanées.

3. **Contrat d'Erreurs Typé & Machine-Readable** :
   - Toutes les erreurs métier renvoient un code stable (`ApiErrorCode` : `CAPACITY_EXCEEDED`, `ROLE_FORBIDDEN`, `VEHICLE_ALREADY_BOOKED`, etc.).
   - Le frontend traduit automatiquement ces codes dans la langue de l'utilisateur sans dépendre d'un parsing de chaînes textuelles fragiles.

4. **Expérience Utilisateur & Multi-Sélection Persistante** :
   - La sélection des commandes de vente s'effectue via une map réactive `selectedOrdersMap`, permettant à l'utilisateur de feuilleter plusieurs pages de pagination sans perdre ses coches précédentes.
   - Les états de chargement (`TableSkeleton`), d'erreur (`ErrorState`) et de liste vide (`Empty` shadcn) sont systématiquement traités.

---

## 11. Limites Connues et Améliorations Futures

- **Authentification Réelle** : L'évaluation imposait de résoudre l'utilisateur via l'en-tête `X-User-Id`. En environnement de production réel, une authentification moderne basée sur JWT / OAuth2 (Keycloak, Auth0) avec cookies HttpOnly sécurisés remplacerait cette simulation.
- **Contrôle Optimiste par `rowversion`** : La colonne `timestamp` (rowversion) de SQL Server est présente dans le schéma et pourrait être exploitée pour un contrôle de concurrence optimiste explicite côté frontend (ex: détection de conflits si un autre utilisateur a modifié la fiche entre-temps).
- **Tests End-to-End Navigateur** : Ajout d'une suite Playwright simulant les clics utilisateur, le glisser-déposer de tournées et le parcours de validation complet.

---

## 12. Temps Réellement Passé


- **Temps total consacré** : `[À compléter par le candidat : ex. 6h45]`
  - Prise en main du sujet, examen du schéma SQL et démarrage Docker : `[ex. 20 min]`
  - Développement API NestJS, requêtes SQL paramétrées, transactions et règles métier : `[ex. 1h30]`
  - Développement Frontend Vue 3, Pinia, écrans, jauge de capacité et multi-sélection : `[ex. 1h15]`
  - Internationalisation bilingue FR/EN et documentation Swagger : `[ex. 20 min]`
  - Tests unitaires, corrections de robustesse, audit et rédaction du README : `[ex. 20 min]`

---

## 13. Dépannage Fréquent

- **Le port 1433 est déjà occupé** :
  Modifiez `database/docker-compose.yml` pour mapper le port hôte sur `1434:1433`, puis ajustez `DB_PORT=1434` dans `api/.env`.
- **Erreur de certificat SQL Server auto-signé** :
  Assurez-vous que `DB_TRUST_SERVER_CERTIFICATE=true` est bien présent dans votre fichier `api/.env`.
