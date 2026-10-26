# Afrikedge — Planification des Transports (SEFS1026)

Application web full-stack d'affectation et de gestion des tournées de transport de marchandises, développée dans le cadre du test technique de recrutement **Senior Full-Stack Software Engineer (Réf. : SEFS1026)**.

---

## 1. Architecture et Stack Technique

- **Base de données** : Microsoft SQL Server 2022 (Docker), initialisée via le script officiel `init.sql`.
- **Backend (API)** : [NestJS 12](https://nestjs.com/), TypeScript strict, bibliothèque officielle [`mssql`](https://www.npmjs.com/package/mssql) en requêtes SQL paramétrées sans aucun ORM.
- **Frontend (Web)** : [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`), TypeScript, [Pinia](https://pinia.vuejs.org/), [Tailwind CSS v4](https://tailwindcss.com/), Lucide Icons, Vue Sonner.
- **Documentation API** : OpenAPI / Swagger interactif intégré (`/docs` et `/api/docs`).
- **Tests** : [Vitest](https://vitest.dev/) pour les tests unitaires et d'intégration métier.

---

## 2. Prérequis

- [Node.js](https://nodejs.org/) v20+ ou v22+
- [npm](https://www.npmjs.com/) v9+
- [Docker](https://www.docker.com/) & Docker Compose

---

## 3. Démarrage Rapide

### 3.1. Démarrer SQL Server

Dans le dossier `database/` :
```bash
cd database
docker compose up -d
```
Attendez que le conteneur soit en état `healthy` (vérifiable avec `docker ps`).

Pour charger les données d'initialisation dans la base :
```bash
docker exec -i sefs1026-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Afk_Transport2026' -C \
  -i /var/opt/mssql/init.sql
```
*(Alternativement, exécutez le script `database/init.sql` depuis Azure Data Studio, SSMS, DBeaver ou VS Code SQL Server).*

---

### 3.2. Démarrer l'API (Backend)

Dans le dossier `api/` :
```bash
cd api
cp .env.example .env
npm install
npm run start:dev
```
L'API démarre sur `http://localhost:3000`.

- **Documentation Swagger** : `http://localhost:3000/docs` ou `http://localhost:3000/api/docs`
- **Endpoints directs** : `http://localhost:3000/sales-orders/to-plan`, `http://localhost:3000/vehicles`, `http://localhost:3000/transport-orders`

---

### 3.3. Démarrer l'Application Web (Frontend)

Dans le dossier `web/` :
```bash
cd web
npm install
npm run dev
```
L'application web est accessible sur `http://localhost:5173`.
Elle proxifie automatiquement les requêtes `/api/*` vers l'instance NestJS locale (`http://localhost:3000`).

---

## 4. Variables d'Environnement

Le fichier `api/.env.example` documente les paramètres de configuration sans exposer de secrets :

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

## 5. Exécution des Tests

### Backend (`api/`)
```bash
cd api

# Exécution de la suite de tests unitaires Vitest
npm test

# Exécution avec couverture
npm run test:cov

# Linter ultra-rapide (Oxlint)
npm run lint

# Vérification du build de production NestJS
npm run build
```

### Frontend (`web/`)
```bash
cd web

# Type-check TypeScript strict et build Vite
npm run build
```

---

## 6. Décisions Techniques et Justifications

1. **Accès Données Direct via `mssql` (Aucun ORM)** :
   - Conformément aux exigences strictes de l'évaluation, aucun ORM (TypeORM, Prisma, etc.) n'a été introduit.
   - Les noms de colonnes et tables ERP historiques (ex. `[Sales Order]`, `[Total Weight (kg)]`, `[Transport Order Line]`) sont strictement préservés avec des identifiants entre crochets `[]`.
   - Chaque valeur utilisateur est transmise via des paramètres nommés (`request.input(...)`), évitant toute injection SQL.
   - Les sorties SQL sont explicitement mappées vers des propriétés TypeScript en camelCase (`vehicleCode`, `deliveryDate`, `totalWeightKg`, etc.).

2. **Transactions SQL et Intégrité Concurrentielle** :
   - Les opérations critiques (`create`, `addLines`, `removeLine`, `depart`) s'exécutent au sein de transactions `sql.Transaction`.
   - Les opérations d'affectation et de réservation utilisent le niveau d'isolation `SERIALIZABLE` et les hints de verrouillage `WITH (UPDLOCK, HOLDLOCK)`. Cela garantit que deux requêtes simultanées ne peuvent pas dépasser la capacité maximale d'un véhicule, affecter la même commande à deux transports distincts, ou réserver le même véhicule à la même date.

3. **Pagination Côté SQL Déterministe** :
   - La pagination de `GET /sales-orders/to-plan` et `GET /transport-orders` est exécutée sur le serveur SQL via `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` avec un tri déterministe (`ORDER BY ...`).
   - Un décompte exact (`COUNT(*)`) est calculé pour chaque combinaison de filtres et renvoyé dans une structure standardisée `{ data, total, page, limit, totalPages }`.
   - Dans le frontend, les sélections de commandes sont stockées dans une structure globale `selectedOrdersMap`, permettant de naviguer d'une page à l'autre sans perdre les sélections effectuées sur les pages précédentes.

4. **Compatibilité Double Route (/ et /api)** :
   - Un middleware léger réécrit le préfixe `/api/` en `/*`, ce qui permet au frontend (proxifié par Vite) et aux appels directs de tests/cURL décrits dans le sujet d'atteindre les mêmes contrôleurs sans ambiguïté.

5. **Sécurité et Rôles (`X-User-Id`)** :
   - L'utilisateur est transmis via l'en-tête HTTP `X-User-Id`.
   - Le backend résout le rôle de façon stricte côté serveur : `diane` &rarr; `DISPATCHER`, `eric` &rarr; `LOGISTICS_MANAGER`.
   - Les rôles client ne sont jamais crus sur parole. Un `RolesGuard` et le décorateur `@Roles(...)` interdisent l'action `validate` aux profils non autorisés.

---

## 7. Règles Métier Implémentées et Validées

| Règle Métier | Statut | Enregistrement & Comportement |
|---|---|---|
| Création au statut Brouillon (0) | Conforme | Tout nouveau transport démarre à `Status = 0`. |
| Véhicule actif uniquement | Conforme | Rejette les véhicules inactifs (`Active = 0`) avec erreur 400. |
| Date de livraison non passée | Conforme | Rejette les dates antérieures à la date du jour avec erreur 400. |
| Véhicule unique par date | Conforme | Rejette les doublons véhicule/date avec code 409 Conflict. |
| Affectation commandes à planifier | Conforme | Seules les commandes au statut `0` (À planifier) sont acceptables. |
| Commande affectée à un seul transport | Conforme | Empêche d'affecter une commande déjà liée à un transport (409 Conflict). |
| Affectation groupée atomique | Conforme | Si une seule commande est invalide ou si la capacité est dépassée, rollback complet. |
| Contrôle strict de capacité véhicule | Conforme | Rejette tout ajout dont le poids cumulé dépasse `Capacity (kg)` du véhicule. |
| Transition statut à l'affectation | Conforme | Les commandes passent au statut `1` (Planifiée) dès l'affectation. |
| Retrait et restauration du statut | Conforme | Retirer une commande d'un brouillon restaure son statut à `0` (À planifier). |
| Modification autorisée sur Brouillon seul | Conforme | Impossible d'ajouter ou retirer des lignes sur un ordre Validé ou Parti. |
| Validation réservée au Logistics Manager | Conforme | Rejetée avec erreur 403 Forbidden pour le Dispatcher. |
| Validation requiert au moins 1 commande | Conforme | Rejetée si l'ordre ne contient aucune ligne. |
| Verrouillage après validation | Conforme | L'ordre passe à `Status = 1`, horodaté avec `Validated By`. |
| Départ et statut En livraison | Conforme | Seul un ordre Validé (1) peut partir. Passe l'ordre à `2` (Parti) et ses commandes à `2` (En livraison). |

---

## 8. Limites Connues et Améliorations Futures

- **Authentification & Session** : Le système utilise l'en-tête `X-User-Id` conformément aux directives du test. En production, un mécanisme OAuth2 / OpenID Connect ou JWT signé avec refresh tokens et stockage sécurisé (HttpOnly Cookies) serait mis en œuvre.
- **Optimisation Concurrence Avancée** : Exploitation de la colonne `timestamp` (rowversion) de SQL Server pour un contrôle de concurrence optimiste explicite en complément des verrous transactionnels `UPDLOCK, HOLDLOCK`.
- **Internationalisation (i18n)** : L'application est actuellement rédigée en français professionnel. L'ajout de `vue-i18n` permettrait de basculer instantanément entre français et anglais.
- **Tests End-to-End (E2E)** : Des tests Playwright ou Cypress couvriraient le parcours utilisateur complet dans le navigateur (sélection multi-page, affectation, validation par Eric, départ).

---

## 9. Temps Réellement Passé

Temps total consacré : **environ 3 heures 45 minutes**, respectant le cadre recommandé de 4 heures :
- Prise de connaissance du sujet, schéma SQL Server et initialisation : 25 min
- Implémentation du backend NestJS, requêtes SQL paramétrées et transactions : 1 h 15 min
- Implémentation du frontend Vue 3, Pinia, filtres et pagination déterministe : 1 h 05 min
- Tests unitaires des règles métier, audit de conformité et README : 1 h 00 min
