# CR-RLF OSINT — Plateforme de formation

Application web privée de formation OSINT pour la **Croix-Rouge de Belgique,
Service RLF (Rassemblement des liens familiaux)**.

Aucun contenu n'est accessible publiquement : toutes les pages et API sont
protégées par authentification et contrôle d'accès par rôle.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Base de données | PostgreSQL (Render) |
| ORM | Prisma |
| Authentification | Clerk (email/mot de passe, reset, invitations) |
| UI | Tailwind CSS v4 + composants maison |
| Validation | Zod |
| Hébergement | Render (Web Service + Postgres managé) |

## Rôles

- **ADMIN** : gère utilisateurs, rôles, modules, leçons, quiz.
- **MANAGER** : consulte la progression des apprenants qui lui sont rattachés.
- **LEARNER** : suit les modules, leçons et quiz.

Chaque apprenant est rattaché à **un manager unique** (`User.managedById`).

## Développement local

### 1. Prérequis
- Node.js ≥ 20
- Un compte Clerk (plan gratuit suffit) → `pk_test_…`, `sk_test_…`
- PostgreSQL local ou base Render

### 2. Installer
```bash
npm install
cp .env.example .env.local
# Remplir les variables (DATABASE_URL, clés Clerk, …)
```

### 3. Migrer + seed
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Lancer
```bash
npm run dev
```
→ http://localhost:3000

### 5. Premier administrateur
1. Dans le dashboard Clerk → **Invitations** → inviter votre email avec
   `publicMetadata = { "role": "ADMIN" }`.
2. Créer votre mot de passe depuis le lien reçu.
3. Connectez-vous : le webhook crée la ligne DB avec le rôle ADMIN.

Alternative (après un premier login) :
```bash
npx tsx scripts/promote-admin.ts votre.email@exemple.be
```

## Architecture

```
src/
  app/
    (app)/              # routes protégées (layout exige une session)
      dashboard/
      modules/[moduleSlug]/lessons/[lessonSlug]/quiz/
      manager/
      admin/            # exige rôle ADMIN
    sign-in/            # Clerk Hosted SignIn
    api/webhooks/clerk/ # sync Clerk → DB (svix-signé)
    unauthorized/
  components/
    ui/                 # primitives (Button, Card, Table, …)
    nav/ admin/ modules/ quiz/ lessons/
  lib/
    db.ts               # Prisma client singleton
    rbac.ts             # requireUser / requireRole
    audit.ts            # AuditLog writer
    env.ts              # validation Zod des env vars
    validations/        # schémas Zod d'entrée
  server/
    actions/            # server actions ("use server")
  middleware.ts         # clerkMiddleware : 401 → /sign-in
prisma/
  schema.prisma
  seed.ts               # module démo
scripts/
  promote-admin.ts
```

## Schéma de base de données

Voir [`prisma/schema.prisma`](./prisma/schema.prisma). Modèles principaux :

- `User` (mirror de Clerk, `role`, `managedById` → un seul manager)
- `Module` / `Lesson` / `Quiz` / `Question`
- `LessonProgress` / `QuizAttempt`
- `AuditLog`

## Déploiement sur Render

### 1. Postgres
Render Dashboard → **New → PostgreSQL**
- Région : **Frankfurt** (EU, RGPD)
- Plan : Starter (Standard+ recommandé pour backups quotidiens)
- Noter l'**Internal Database URL**.

### 2. Web Service
Render Dashboard → **New → Web Service** → connecter `beforensic/CR-RLF`.

| Champ | Valeur |
|---|---|
| Environment | Node |
| Region | Frankfurt |
| Build Command | `npm ci && npx prisma migrate deploy && npm run build` |
| Start Command | `npm start` |
| Auto-Deploy | On (`main`) |
| Health Check | `/sign-in` |

### 3. Variables d'environnement (Render → Environment)

```
DATABASE_URL=<Internal URL du Postgres>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<Clerk prod>
CLERK_SECRET_KEY=<Clerk prod>
CLERK_WEBHOOK_SIGNING_SECRET=<Clerk → Webhooks>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
APP_URL=https://<votre-app>.onrender.com
NODE_ENV=production
```

### 4. Seed initial (job one-off)
Render → Shell du Web Service :
```bash
npm run db:seed
```

### 5. Webhook Clerk
Clerk Dashboard → **Webhooks → + Add Endpoint**
- URL : `https://<votre-app>.onrender.com/api/webhooks/clerk`
- Events : `user.created`, `user.updated`, `user.deleted`
- Copier le **Signing Secret** dans `CLERK_WEBHOOK_SIGNING_SECRET`.

### 6. Premier ADMIN
Voir la section « Premier administrateur » ci-dessus.

### 7. Domaine custom
Render → Custom Domain → ajouter `osint.rlf.croix-rouge.be` (TLS auto).
Ne pas oublier de mettre à jour `APP_URL`.

## Checklist sécurité

- [x] **Middleware** Clerk sur **toutes** les routes hors `/sign-in` et webhook.
- [x] **RBAC centralisé** (`requireRole`) appliqué dans chaque page admin/manager
      et chaque server action.
- [x] **Webhook** vérifié par signature Svix.
- [x] **Validation Zod** sur toute entrée d'action serveur.
- [x] **Cookies de session** gérés par Clerk (HttpOnly, Secure, SameSite).
- [x] **Headers de sécurité** globaux (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`).
- [x] **Indexing refusé** (`robots: { index: false, follow: false }`).
- [x] **Audit log** : login, reset pwd (via Clerk), création/modif user, changement rôle,
      (dés)activation, CRUD modules/leçons, soumission quiz.
- [x] **Désactivation utilisateur** = `isActive=false` + `banUser` Clerk (révoque les sessions).
- [x] **Publication** : le rôle `LEARNER` ne voit **que** les modules `isPublished=true`.
- [x] **Isolation manager** : un manager ne voit **que** ses apprenants rattachés.
- [x] **iframe YouTube** via `youtube-nocookie.com` + `referrerPolicy="strict-origin-when-cross-origin"`.
- [x] **Pas de secret en clair** dans le repo (`.env.local` ignoré, `.env.example` documenté).
- [x] **Postgres EU** (Frankfurt) + backups quotidiens.
- [ ] **Rate limiting** sur les endpoints sensibles — Clerk applique déjà un rate limit
      sur l'authentification ; à compléter avec Upstash Ratelimit sur `/api/webhooks/clerk`
      et les server actions si besoin.
- [ ] **Dependabot / `npm audit`** activés en CI.
- [ ] **Politique CSP** renforcée (actuellement `frame-src` implicite pour YouTube ;
      ajouter une `Content-Security-Policy` stricte une fois les domaines embeds finalisés).

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production (inclut `prisma generate`) |
| `npm start` | Démarre le serveur de production |
| `npm run db:migrate` | Applique les migrations (production) |
| `npm run db:migrate:dev` | Crée/applique une migration (dev) |
| `npm run db:seed` | Peuple la DB avec le module démo |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npx tsx scripts/promote-admin.ts <email>` | Promeut un utilisateur en ADMIN |

## Licence

Projet interne — usage réservé à la Croix-Rouge de Belgique, Service RLF.
