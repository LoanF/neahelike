# Néa Hélikè : site et portail whitelist

Site du serveur roleplay FiveM **Néa Hélikè** (univers de la mythologie grecque) :

- un **site public** (accueil, lore, règlement, FAQ, pages légales) ;
- un **portail joueur** : connexion Discord, candidature whitelist en plusieurs étapes, dossier de reprise, notifications ;
- un **espace équipe** pour les recruteurs et les admins : lecture des candidatures, décisions, notes internes ;
- une **administration** : affinités et créatures, entreprises, critères de refus, journal, statistiques, rôles et owners.

Le **bot Discord** est un projet séparé (dépôt `bot-neahelike`). Il partage la même base de données. Voir [Le site et le bot Discord](#le-site-et-le-bot-discord).

---

## Sommaire

1. [Stack](#stack)
2. [Installation en local](#installation-en-local)
3. [Variables d'environnement](#variables-denvironnement)
4. [Configurer l'application Discord](#configurer-lapplication-discord)
5. [Mettre en production](#mettre-en-production)
6. [Architecture du code](#architecture-du-code)
7. [Base de données](#base-de-données)
8. [Fonctionnement de chaque partie](#fonctionnement-de-chaque-partie)
9. [Le site et le bot Discord](#le-site-et-le-bot-discord)
10. [Modifier les textes et le contenu](#modifier-les-textes-et-le-contenu)
11. [Design](#design)
12. [Tests](#tests)
13. [Sécurité](#sécurité)
14. [À faire avant l'ouverture](#à-faire-avant-louverture)

---

## Stack

| Rôle | Outil |
|---|---|
| Framework | **Next.js 15** (App Router, React 19, Server Components, Server Actions), TypeScript |
| Styles | CSS Modules, jetons de design dans `src/styles/tokens.css` |
| Composants de base | **Arc UI** (uiarc.dev, installé via la CLI shadcn), restylé |
| Connexion | **Auth.js v5** (next-auth), fournisseur Discord, sessions JWT en cookie |
| Base de données | **PostgreSQL** (n'importe quel hébergeur), **Drizzle ORM** + pilote `postgres` (postgres-js) |
| Validation | **Zod** |
| Tests | **Vitest** (règles), **Playwright** (parcours dans le navigateur) |
| Gestionnaire de paquets | **pnpm 10** (Node.js 22.12 ou plus) |

Le site ne dépend d'aucun service propriétaire : il lui faut seulement **Node.js**, une **base PostgreSQL** et une **application Discord**. Il a été hébergé sur Vercel avec une base Supabase, mais rien dans le code ne l'impose (voir [Mettre en production](#mettre-en-production)).

---

## Installation en local

Prérequis : Node.js 22.12+, pnpm 10 (`corepack enable`, la version est fixée par `packageManager` dans `package.json`), une base PostgreSQL 15+ et une application Discord de test.

Utilisez **pnpm** plutôt que npm : seul `pnpm-lock.yaml` fixe les versions exactes testées. npm fonctionne aussi, mais il recalcule les versions à chaque installation.

**Avertissements connus à l'installation** (sans effet sur le site, à revoir quand une mise à jour existera) :
- `eslint@9 … no longer supported` : ESLint 10 existe, mais les extensions utilisées par `eslint-config-next` (React, import, accessibilité) ne l'acceptent pas encore.
- `@esbuild-kit/… deprecated` : dépendances internes de `drizzle-kit` 0.31, la dernière version stable. Elles disparaissent avec Drizzle 1.0.

`npm audit` et `pnpm audit` ne trouvent aucune vulnérabilité. Les correctifs sont imposés dans `package.json` (`pnpm.overrides`, et `overrides` pour npm) :
- `postcss` récent pour Next.js ;
- `esbuild` récent pour `drizzle-kit` ;
- `tinyglobby` à la place de `fast-glob` dans `@next/eslint-plugin-next` (même fonction `globSync`), ce qui retire la dépendance vulnérable `braces`.

À chaque mise à jour de Next.js ou de drizzle-kit, vérifiez si ces remplacements sont encore utiles (`pnpm audit` sans eux). Les scripts d'installation autorisés (esbuild, unrs-resolver) sont listés dans `pnpm.onlyBuiltDependencies` et `allowScripts`.

```bash
pnpm install
cp .env.example .env.local      # puis remplir les valeurs (voir plus bas)
pnpm db:migrate                 # crée toutes les tables dans la base de DATABASE_URL
pnpm dev                        # http://localhost:3000
```

Une base locale rapide avec Docker :

```bash
docker run -d --name nea-pg -p 5432:5432 -e POSTGRES_PASSWORD=nea -e POSTGRES_DB=nea postgres:16
# DATABASE_URL=postgres://postgres:nea@localhost:5432/nea
```

Commandes utiles :

| Commande | Effet |
|---|---|
| `pnpm dev` | Serveur de développement (Turbopack) |
| `pnpm build` puis `pnpm start` | Build et serveur de production |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests des règles (Vitest) |
| `pnpm test:e2e` | Tests de bout en bout (Playwright, voir [Tests](#tests)) |
| `pnpm db:generate` | Crée une migration SQL à partir de `src/db/schema.ts` |
| `pnpm db:migrate` | Applique les migrations en attente |
| `pnpm db:studio` | Interface web pour parcourir la base |

Pour vous connecter au portail en local, votre compte Discord doit être **sur le serveur Discord** configuré (`DISCORD_GUILD_ID`). Pour avoir tous les droits, ajoutez votre ID Discord aux owners permanents (`src/content/owners.ts`).

---

## Variables d'environnement

Toutes sont décrites dans `.env.example`. Elles sont validées au premier accès par `src/lib/env.ts` : une variable obligatoire manquante produit une erreur explicite.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | Connexion PostgreSQL du site |
| `DATABASE_URL_MIGRATIONS` | non | Connexion dédiée aux migrations (sinon `DATABASE_URL`) |
| `DB_SCHEMAS` | non | Schéma(s) Postgres gérés par Drizzle (`public` par défaut) |
| `DB_AUTO_MIGRATE` | non | `false` pour couper les migrations automatiques au build |
| `MIGRATE_FORCE` | non | `true` pour que `scripts/migrate.mjs` migre hors Vercel (voir plus bas) |
| `AUTH_SECRET` | oui | Clé de signature des sessions (`openssl rand -base64 33`) |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | oui | Client OAuth2 de l'application Discord |
| `DISCORD_BOT_TOKEN` | oui | Token du bot de la même application (lecture des membres, rôles, MP) |
| `DISCORD_GUILD_ID` | oui | ID du serveur Discord Néa Hélikè |
| `DISCORD_ROLE_ADMIN` / `DISCORD_ROLE_RECRUTEUR` | non | Rôles qui donnent ces rangs, **en secours** tant que rien n'est réglé dans l'administration (plusieurs ID séparés par des virgules) |
| `DISCORD_ROLE_ATTENTE_WL` | non | Rôle « attente de wl », donné quand l'écrit est validé |
| `DISCORD_ROLE_WL` | non | Rôle whitelist « Magistrat (wl) », donné après l'entretien vocal |
| `DISCORD_ROLE_NON_WL` | non | Rôle de base « Novice (Non WL) », rendu quand un compte est supprimé |
| `NEXT_PUBLIC_SITE_URL` | **oui en production** | Adresse publique du site (liens des MP, aperçus de liens) |
| `NEXT_PUBLIC_INDEXABLE` | non | `true` pour autoriser l'indexation par les moteurs de recherche |

Sans les rôles `ATTENTE_WL`, `WL` ou `NON_WL`, les décisions fonctionnent quand même : le rôle n'est simplement pas donné, et l'équipe voit un avertissement.

---

## Configurer l'application Discord

Le site et le bot utilisent **la même application Discord** (portail développeur : https://discord.com/developers/applications).

1. **OAuth2** : copier le Client ID et le Client Secret dans `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`. Ajouter les redirections :
   - `https://<domaine>/api/auth/callback/discord` (production) ;
   - `http://localhost:3000/api/auth/callback/discord` (local).
2. **Bot** : générer le token (`DISCORD_BOT_TOKEN`) et activer l'intent privilégié « Server Members ». Inviter le bot sur le serveur avec les permissions « Gérer les rôles » et « Bannir des membres » (blacklist). Son rôle doit être placé **au-dessus** des rôles qu'il donne : attente de wl, whitelist et Novice.
3. Copier l'ID du serveur et des rôles : activer le mode développeur dans Discord, puis clic droit → Copier l'identifiant.

Le site ne demande que le scope `identify` à la connexion. La présence sur le serveur et les rôles sont lus avec le token du bot, par des appels à l'API REST de Discord (`src/lib/discord.ts`). Le site ne lance aucun processus bot.

---

## Mettre en production

Le site se déploie comme toute application Next.js. Trois éléments sont nécessaires : un hébergement Node, une base PostgreSQL et les variables d'environnement.

### 1. La base PostgreSQL

N'importe quelle base PostgreSQL 15+ convient : serveur dédié, Docker, Supabase, Neon, Railway, etc.

- La connexion fonctionne aussi derrière un pooler en mode transaction (PgBouncer, Supavisor) : le client est configuré sans requêtes préparées (`src/db/index.ts`).
- **Créez les tables avec l'utilisateur que le site utilisera.** Toutes les tables ont la sécurité au niveau des lignes (RLS) activée **sans aucune règle**. Seul le propriétaire des tables (ou un rôle avec `BYPASSRLS`) peut les lire, ce qui ferme tout accès par une API publique. Si le site se connecte avec un autre rôle, il ne verra aucune ligne.
- Appliquez les migrations :

  ```bash
  DATABASE_URL=postgres://... pnpm db:migrate
  ```

### 2. L'hébergement

**Option A, un serveur (VPS, Docker, PM2…)**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start            # port 3000 par défaut (PORT=8080 pnpm start pour changer)
```

Placez un reverse proxy HTTPS devant (Caddy, Nginx…). Pour appliquer les migrations à chaque mise à jour :

```bash
MIGRATE_FORCE=true node scripts/migrate.mjs && pnpm build && pnpm start
```

**Option B, une plateforme (Vercel, Netlify, Render…)**

- Commande de build : `pnpm vercel-build` sur Vercel (migrations puis build), sinon `pnpm build`.
- Sur Vercel, `scripts/migrate.mjs` migre automatiquement à chaque déploiement de **production**, jamais pour les prévisualisations. Ailleurs, il faut `MIGRATE_FORCE=true`.
- `vercel.json` ne sert qu'à Vercel : il évite un redéploiement quand seuls `docs/` ou `bot/` changent. Supprimez-le si vous n'utilisez pas Vercel.

Points à connaître sur une plateforme « serverless » :

- **Durée des requêtes** : une fonction peut s'endormir entre deux visites. Le client Postgres ferme donc vite les connexions inactives (20 s), les renouvelle (5 min) et abandonne une connexion qui n'aboutit pas (10 s). Les appels Discord abandonnent au bout de 8 s.
- **`fetch_types: false`** (dans `src/db/index.ts`) est indispensable derrière un pooler en mode transaction. Sinon, la requête de découverte des types envoyée à chaque nouvelle connexion peut bloquer les requêtes suivantes, et la page charge sans fin. C'est déjà arrivé.

### 3. Les variables d'environnement

Reprenez toutes les variables de `.env.example`. Mettez `NEXT_PUBLIC_SITE_URL` à l'adresse publique : sans elle, les liens des messages privés et les aperçus pointent vers `localhost`. Ajoutez la redirection OAuth de ce domaine dans l'application Discord.

### 4. Le jour de l'ouverture

- `NEXT_PUBLIC_INDEXABLE=true` : avant cela, chaque réponse porte `X-Robots-Tag: noindex` et les pages ont `robots: noindex`.
- Vérifiez les pages légales (voir [À faire avant l'ouverture](#à-faire-avant-louverture)).

---

## Architecture du code

```
src/
├── app/                        Pages et routes (App Router)
│   ├── layout.tsx              Racine : police, métadonnées, aperçus de liens
│   ├── opengraph-image.tsx     Image d'aperçu des liens (1200×630), générée au build
│   ├── not-found.tsx           Page 404
│   ├── globals.css             Styles globaux, focus clavier, lien « Aller au contenu »
│   ├── api/auth/[...nextauth]/ Routes Auth.js (connexion Discord)
│   ├── (site)/                 Site public : en-tête et pied de page communs
│   │   ├── page.tsx            Accueil (régénéré toutes les 5 min)
│   │   ├── lore/               Lore, affinités et créatures (régénéré toutes les 5 min)
│   │   ├── reglement/  faq/    Règlement, FAQ
│   │   └── [legal]/            CGU, confidentialité, mentions légales
│   └── (portail)/              Tout ce qui demande une connexion
│       ├── actions.ts          Actions communes : connexion, déconnexion, CGU, notifications
│       ├── connexion/          Écran « Se connecter avec Discord »
│       ├── rejoindre-discord/  Affiché si le compte n'est pas sur le serveur
│       ├── liaison/            Profil Discord + acceptation des CGU
│       ├── portail/            Espace joueur
│       │   ├── page.tsx        Tableau de bord
│       │   ├── candidature/    Candidature (une page par étape dans [etape]/) et ses actions
│       │   ├── dossier/        Présentation de ce qui peut être repris
│       │   └── compte/         Mon compte
│       └── equipe/             Espace équipe et administration
│           ├── page.tsx        Liste des joueurs (onglets, recherche, présence)
│           ├── joueurs/[id]/   Fiche joueur : candidature, décisions, notes, chronologie
│           ├── actions.ts      Décisions, notes, présence, suppression de compte
│           ├── factions/  reprises/  criteres/   Administration du contenu
│           ├── journal/  statistiques/           Suivi
│           └── roles/          Rôles Discord → rangs, owners (owners uniquement)
├── auth.ts                     Configuration Auth.js (Discord, JWT, création du compte)
├── db/
│   ├── schema.ts               LE schéma de la base (seul endroit où la structure change)
│   └── index.ts                Client Postgres (réglages pooler et serverless)
├── lib/                        Logique métier, côté serveur uniquement (`server-only`)
│   ├── env.ts                  Variables d'environnement validées
│   ├── session.ts              Utilisateur connecté, gardes de rang (requireUser, requireFreshRank)
│   ├── permissions.ts          Owners, rôles Discord → rang
│   ├── members.ts              Synchronisation d'un membre avec Discord (rang, présence)
│   ├── discord.ts              Appels à l'API Discord (membre, rôles, MP), avec délais
│   ├── application.ts          Structure de la candidature : étapes, schémas Zod, navigation (aussi côté client)
│   ├── applications.ts         Lecture et écriture des candidatures, délai de recandidature
│   ├── review.ts               Décisions de l'équipe, notes, suppression de compte
│   ├── team.ts                 Liste des joueurs, présence, chronologie, journal, droits sur les notes
│   ├── factions.ts  businesses.ts  criteria.ts   Contenu géré par l'administration
│   ├── admin.ts                Modifications de l'administration
│   ├── notifications.ts        Cloche du portail
│   ├── events.ts               Journal des actions
│   ├── stats.ts                Statistiques
│   ├── rate-limit.ts           Limite d'actions par minute
│   └── site-url.ts  discord-cdn.ts
├── content/                    TOUS les textes du site (voir plus bas)
├── components/
│   ├── arc/                    Composants Arc UI restylés (bouton, onglets, accordéon)
│   ├── plaque/                 Primitives du design : Plaque, Rivet, Badge, champs de formulaire…
│   ├── site/                   En-tête, pied de page, sections, emblèmes du lore
│   ├── portal/                 Cadre du portail, menu, cloche, écran de chargement
│   └── equipe/                 Badges, œil de présence, chronologie
├── styles/tokens.css           Jetons de design
└── types/                      Compléments de types (session Auth.js)

drizzle/                        Migrations SQL générées (+ RLS ajoutée à la main)
scripts/migrate.mjs             Migrations au déploiement
tests/unit/  tests/e2e/         Tests
docs/lore/                      Diapos de référence du lore
public/images/                  Logo et images
```

### Principes

- **Server Components par défaut.** Les pages lisent la base directement côté serveur. Le JavaScript envoyé au navigateur se limite aux parties interactives (formulaires, onglets, cloche, présence).
- **Server Actions pour toutes les écritures** (fichiers `actions.ts`). Chaque action revérifie la session et le rang, applique la limite d'actions, puis appelle la logique de `src/lib/`. Aucune route API maison n'existe, à part celle d'Auth.js.
- **La logique métier vit dans `src/lib/`**, les pages ne font qu'afficher. `lib/application.ts` est partagé entre le formulaire (client) et le serveur : la même validation Zod s'applique des deux côtés.
- **Les textes vivent dans `src/content/`**, jamais en dur dans les composants.
- **Un échec Discord n'annule jamais une décision.** Si un rôle ou un MP échoue, la décision est enregistrée, le joueur la voit sur le portail, et l'équipe reçoit un avertissement.

---

## Base de données

Le schéma complet est dans `src/db/schema.ts`, commenté table par table.

### Tables du site

| Table | Contenu |
|---|---|
| `users` | Un compte par joueur connecté : ID Discord, pseudo, avatar, **rang** (`joueur`, `recruteur`, `admin`, `owner`), présence sur le serveur, date de dernière synchronisation des rôles, CGU acceptées (version) |
| `applications` | Candidatures : statut, réponses de chaque étape en JSON (`hrp`, `rp`, `background`, `dossier`), étapes rouvertes, critères de refus, relecteur, dates. **Une seule candidature ouverte par joueur** (index unique partiel) |
| `events` | Journal de toutes les actions (joueur et équipe). Conservé après la suppression d'un compte, mais anonymisé |
| `team_notes` | Notes internes de l'équipe sur un joueur, visibles par toute l'équipe ou par les admins seulement |
| `profile_views` | Présence en direct : qui consulte quelle fiche (l'« œil ») |
| `notifications` | Notifications du portail (cloche) |
| `reapply_locks` | Délai de 3 mois gardé après la suppression d'un compte refusé (seulement l'ID Discord et la date de fin) |
| `site_owners` | Owners ajoutés depuis le site |
| `role_ranks` | Rôle Discord → rang (recruteur ou admin), réglé par les owners |
| `factions` | État des affinités et créatures (places, lead, ordre, archivage), et lore complet de celles ajoutées depuis le site |
| `businesses` | Entreprises qu'on peut reprendre |
| `refusal_criteria` | Critères de refus |
| `rate_limits` | Compteurs de la limite d'actions par minute |
| `blacklist` | IDs Discord blacklistés (raison facultative, auteur, origine `site` ou `bot`). **Partagée avec le bot**, sans lien avec `users` : un ID blacklisté par le bot est bloqué dès sa première connexion au site |

### Tables du bot

`bot_guild_config`, `bot_permission_levels`, `bot_permission_level_roles`, `bot_modules`, `bot_command_permissions`, `bot_messages`, `bot_tickets`, `bot_giveaways`, `bot_giveaway_entries`, `bot_sanctions`. Seul le bot les écrit. Voir [Le site et le bot Discord](#le-site-et-le-bot-discord).

### Migrations

- **Le schéma et les migrations vivent uniquement dans ce dépôt**, y compris les tables du bot : le bot ne crée ni ne modifie aucune table.
- Pour changer la structure :
  1. modifier `src/db/schema.ts` ;
  2. lancer `pnpm db:generate --name <nom>` ;
  3. relire le SQL généré dans `drizzle/` ;
  4. **ajouter `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;`** pour toute nouvelle table ;
  5. lancer `pnpm db:migrate`.
- Pour une modification que Drizzle ne sait pas générer (renommer une valeur d'enum, insérer des données de départ) : `pnpm drizzle-kit generate --custom --name <nom>`, puis écrire le SQL à la main. Les migrations 0010, 0012 et 0014 en sont des exemples.
- Ne modifiez jamais une migration déjà appliquée : ajoutez-en une nouvelle.

---

## Fonctionnement de chaque partie

### Connexion et accès

1. `/connexion` : le joueur se connecte avec Discord (OAuth, scope `identify`).
2. À la connexion (`src/auth.ts`), le compte est créé ou mis à jour dans `users`, puis **synchronisé avec Discord** (`lib/members.ts`) : est-il sur le serveur, quels sont ses rôles, donc quel est son rang ?
3. Le parcours se poursuit selon l'état du compte :
   - pas sur le serveur → `/rejoindre-discord` ;
   - CGU pas encore acceptées (ou nouvelle version des CGU) → `/liaison` ;
   - sinon → `/portail`.
4. La session est un **cookie JWT** valable 30 jours, qui ne contient que l'ID Discord. Tout le reste (rang, présence, CGU) est relu en base à chaque requête.

### Rangs et permissions

- Quatre rangs : **joueur < recruteur < admin < owner**. Chaque rang a les droits des rangs inférieurs (`hasRank` dans `lib/session.ts`).
- **Owner** : les owners permanents de `src/content/owners.ts` (toujours owners, même avec une base neuve), plus ceux ajoutés depuis le site (table `site_owners`). Le rang owner ne se donne jamais par un rôle Discord.
- **Recruteur et admin** viennent des **rôles Discord**. Les owners les règlent dans *Administration › Rôles et permissions* (table `role_ranks`). Un membre qui a plusieurs rôles prend le rang le plus élevé. Tant que rien n'est enregistré, les variables `DISCORD_ROLE_ADMIN` / `DISCORD_ROLE_RECRUTEUR` servent de secours.
- Les rangs sont relus sur Discord **toutes les 5 minutes**, à chaque connexion, et pour tout le monde aussitôt après un changement de réglage.
- Avant chaque action sensible (décision, note, administration), `requireFreshRank` relit les rôles sur Discord. Un rôle retiré il y a une minute ne permet donc plus d'agir.
- Quitter le serveur Discord retire immédiatement toutes les permissions, owners compris.

| Rang | Accès |
|---|---|
| joueur | Son portail : tableau de bord, candidature, dossier de reprise, compte |
| recruteur | + Espace équipe : liste des joueurs, fiches, décisions sur les candidatures envoyées, notes |
| admin | + Administration (affinités et créatures, entreprises, critères, journal, statistiques), notes réservées aux admins, valider avant l'envoi, effacer une candidature, retirer une whitelist, blacklister et lever une blacklist, supprimer un compte |
| owner | + Rôles et permissions, gestion des owners |

### Candidature

- Les étapes sont **HRP** (le joueur), **Personnage**, **Background** (lien vers un document), **Dossier de reprise** (seulement si la case est cochée à l'étape HRP), puis **Récapitulatif**.
- La structure et les règles sont dans `lib/application.ts` : schémas Zod par étape, âge minimum de 18 ans pour le joueur comme pour le personnage, liens en `https://` uniquement, etc.
- **Enregistrement automatique** pendant la saisie : un brouillon est accepté même incomplet. Une étape est « complète » quand elle passe le schéma strict, et on ne peut accéder à une étape que si les précédentes sont complètes.
- Statuts :
  - `brouillon` : en cours de saisie ;
  - `envoyee` : à lire par l'équipe ;
  - `a_modifier` : l'équipe a demandé une modification, et seules les parties choisies se rouvrent ;
  - `entretien` : écrit validé, rôle « attente de wl » donné, entretien vocal à passer ;
  - `whitelistee` : rôle whitelist donné ;
  - `refusee` : le joueur peut recandidater après **3 mois**.
- Le contenu proposé (affinités, créatures, entreprises) vient de l'administration. Une place fermée ne peut pas être choisie, et le serveur le revérifie à l'envoi.

### Dossier de reprise

- Le joueur peut demander à reprendre une **entreprise** (existante, ou nouvelle avec son nom), ou le **lead d'une affinité ou d'une créature**.
- La page `/portail/dossier` présente tout ce qui peut être repris, avec la mention « Disponible » ou « Repris ».
- Le dossier lui-même est un lien vers un document, déposé comme étape de la candidature.

### Espace équipe

- **Liste des joueurs** (`/equipe`) : onglets À traiter, Entretiens, Modifications, Brouillons, Whitelist, Refusées (dont les whitelists retirées), Blacklist, Tous. Recherche par ID Discord, pseudo, prénom ou nom RP. La liste se rafraîchit toutes les 10 s.
- **Fiche joueur** : candidature complète, dossier de reprise mis en avant, chronologie de toutes les actions. Un « œil » animé indique quand un autre membre consulte la fiche (signal envoyé toutes les 10 s, table `profile_views`).
- **Décisions** (`lib/review.ts`) :

  | Décision | Rôle Discord | Message privé | Notification portail |
  |---|---|---|---|
  | Valider l'écrit | « attente de wl » donné | oui | oui |
  | Demander une modification (parties à rouvrir, message) | aucun | oui | oui |
  | Refuser (critères, commentaire) | aucun | oui, avec la date à partir de laquelle il peut recandidater | oui |
  | Valider l'entretien | whitelist donné, « attente de wl » retiré | oui | oui |

  Chaque décision est vérifiée côté serveur : bon statut, bon rang, et une décision prise par un autre membre entre-temps est détectée. Les textes des MP sont dans `src/content/equipe.ts`.
- **Notes internes** : jamais visibles par le joueur. Un recruteur écrit pour toute l'équipe. Un admin peut réserver une note aux admins. Un recruteur ne supprime que ses propres notes.
- **Suppression d'un compte** (admin, sur demande du joueur par ticket) :
  - le joueur perd « attente de wl » et la whitelist, retrouve le rôle de base Novice et reçoit un MP ;
  - son compte, ses candidatures et ses notes sont effacés, et le journal est anonymisé ;
  - si un refus de moins de 3 mois existe, le délai est gardé dans `reapply_locks` ;
  - une blacklist éventuelle est gardée (table `blacklist`, indexée par ID Discord).
- **Retirer la whitelist** (admin, sur la fiche d'un joueur whitelist, raison facultative) : le joueur perd « Magistrat (wl) » et « attente de wl », retrouve le rôle Novice, reçoit un MP et une notification avec la raison. La candidature reste « whitelistee » dans l'historique, marquée retirée (`whitelist_revoked_at`), et ne bloque plus : le joueur peut en recommencer une de zéro tout de suite.
- **Blacklister** (admin, raison facultative, confirmation en recopiant BLACKLIST ; impossible sur un owner ou sur soi-même) : MP au joueur, puis **bannissement du Discord** ; sa whitelist éventuelle est retirée. Sur le site, `requireUser` le renvoie vers `/blacklist` sur toutes les pages du portail : une page de blocage avec la raison s'il y en a une, et seulement un bouton de déconnexion.
- **Lever la blacklist** (admin, depuis la fiche, donc pour un joueur qui a un compte sur le site) : la ligne est supprimée et le bannissement Discord levé. Le joueur doit rejoindre le serveur et, sans whitelist, recandidater. Les blacklists posées par le bot sans compte sur le site se lèvent depuis le bot.
- Chaque retrait, blacklist et levée est inscrit dans la chronologie de la fiche et le journal.

### Administration

- **Affinités et créatures** (`/equipe/factions`) :
  - deux réglages distincts : places ouvertes à la candidature, et lead disponible ou repris ;
  - ordre d'affichage et archivage ;
  - ajout d'une nouvelle affinité ou créature avec tout son lore, qui apparaît alors sur le site public.

  Les 10 d'origine gardent leur lore dans `src/content/lore.ts`. La base ne stocke que leur état. Si la base est injoignable, le site public les affiche toutes ouvertes.
- **Entreprises** (`/equipe/reprises`) : disponible ou reprise, ordre, archivage.
- **Critères de refus** (`/equipe/criteres`) : ajout, renommage, désactivation, ordre.
- **Journal** (`/equipe/journal`) : toutes les actions, filtrables par type, membre et période.
- **Statistiques** (`/equipe/statistiques`) : candidatures, délais de traitement, répartition des personnages, décisions par membre.
- **Rôles et permissions** (`/equipe/roles`, owners uniquement) : chaque rôle du serveur Discord → joueur, recruteur ou admin. Ajout et retrait d'owners par ID Discord.

Les pages publiques (accueil, lore) sont régénérées au plus tard 5 min après une modification, et aussitôt après un changement fait dans l'administration.

### Notifications

- Chaque décision crée une notification (textes dans `src/content/notifications.ts`), en plus du MP Discord.
- La cloche du portail se rafraîchit toutes les 60 s quand l'onglet est visible.
- À l'ouverture de la cloche, tout est marqué comme lu.

### Limite d'actions

`lib/rate-limit.ts` limite chaque membre par action et par minute : 5 envois de candidature, 10 notes, 20 décisions, 60 actions d'administration, etc. Le compteur est en base (table `rate_limits`), donc il fonctionne même avec plusieurs serveurs. Au-delà de la limite, un message demande d'attendre une minute.

---

## Le site et le bot Discord

Ce sont **deux programmes distincts** qui partagent **la même base PostgreSQL** et **la même application Discord**.

| | Site (ce dépôt) | Bot (dépôt `bot-neahelike`) |
|---|---|---|
| Ce que c'est | Application web Next.js | Processus Discord connecté en permanence |
| Rôle | Vitrine, candidatures whitelist, espace équipe, administration du contenu du site | Commandes, modules et tickets sur le serveur Discord |
| Discord | Appels REST ponctuels avec le token du bot : lire un membre et ses rôles, donner ou retirer un rôle, envoyer un MP | Connecté à la gateway Discord, réagit aux événements du serveur |
| Base de données | Tables du site ; **possède le schéma et toutes les migrations** | Tables `bot_*` ; écrit aussi la présence dans `users` et lit `events` (voir ci-dessous) |

Règles de cohabitation :

- **Toute modification de structure de la base, y compris pour le bot, se fait dans ce dépôt** (`src/db/schema.ts` + migration). Le bot ne fait qu'utiliser les tables.
- Le site ne lit pas les tables du bot pour fonctionner. Elles sont décrites dans le schéma pour que les migrations les créent.
- **Partage de la table `users`** :
  - **Le site seul calcule le rang** (`users.rank`, à partir des owners et de `role_ranks`) et écrit l'événement `rang.change`.
  - **Le bot met à jour la présence en temps réel** : arrivée et départ du serveur (`in_guild`, événements `discord.rejoint` / `discord.quitte`), pseudo et avatar. Quand les rôles d'un membre changent sur Discord, ou qu'il quitte le serveur, le bot remet `roles_synced_at` à `null` : le site relit le rang à la page suivante.
  - Le bot n'écrit jamais `rank`, ni les CGU, et ne supprime jamais de compte.
- **Blacklist partagée** : le site et la commande `/blacklist` du bot lisent et écrivent la même table `blacklist`. Le bot indique `source = 'bot'`. Lever une blacklist supprime la ligne (et le bannissement Discord) ; l'historique reste dans `events` pour le site.
  - Le site garde sa propre synchronisation (à la connexion et toutes les 5 minutes) : il fonctionne même si le bot est éteint, seulement avec un peu plus de délai.
- Le bot **lit** `events` pour relayer certains événements (dont les changements de rang) dans son salon de logs.
- Les rôles « attente de wl » et whitelist sont donnés **par le site** au moment des décisions, pas par le bot.
- Les demandes des joueurs (par exemple la suppression de compte prévue par les CGU) passent par les **tickets du bot**. Un admin agit ensuite depuis la fiche du joueur sur le site.

Ce que gère le bot, d'après ses tables :

- sa configuration par serveur : préfixe, couleurs, profil, statut (`bot_guild_config`) ;
- des niveaux de permission liés à des rôles Discord (`bot_permission_levels`, `bot_permission_level_roles`) ;
- des modules activables, avec leurs réglages (`bot_modules`) ;
- le rang requis par commande (`bot_command_permissions`) ;
- des messages personnalisés (`bot_messages`) ;
- des tickets : un salon privé par demande, avec catégories, formulaire d'ouverture, prise en charge, transcription à la fermeture et note de satisfaction (`bot_tickets`) ;
- des giveaways avec leurs participants et gagnants (`bot_giveaways`, `bot_giveaway_entries`) ;
- le casier de modération : avertissements, exclusions, expulsions, bannissements définitifs ou temporaires, jamais supprimés mais marqués levés (`bot_sanctions`). `user_id` est l'ID Discord, sans lien avec `users` : on peut sanctionner quelqu'un qui n'a pas de compte sur le site.

Pour l'installation, les commandes et les variables du bot, voir le README du dépôt `bot-neahelike`.

---

## Modifier les textes et le contenu

| Quoi | Où |
|---|---|
| Nom, liens (invitation Discord…), menu | `src/content/site.ts` |
| Lore, affinités et créatures d'origine | `src/content/lore.ts` |
| Règlement | `src/content/reglement.ts` |
| FAQ | `src/content/faq.ts` |
| CGU, confidentialité, mentions légales | `src/content/legal.ts` |
| Textes de la candidature (introductions, consignes, âge minimum, délai) | `src/content/candidature.ts` |
| Messages privés envoyés aux joueurs | `src/content/equipe.ts` |
| Notifications du portail | `src/content/notifications.ts` |
| Owners permanents | `src/content/owners.ts` |

Le règlement et la FAQ ne se modifient que dans le code : ils n'ont pas d'écran d'administration.

**Après une modification des CGU**, changez `updatedAt`, ou incrémentez `revision` si c'est le même jour. Tous les joueurs devront alors accepter la nouvelle version à leur prochaine visite.

Le contenu « vivant » (places ouvertes, entreprises, critères, rôles) se gère depuis l'administration du site, pas dans le code.

---

## Design

Le site reprend le langage visuel de l'interface en jeu, « The Struck Plaque » : plaques de bronze martelé, reliefs dorés, coins carrés, police Marcellus.

- `src/styles/tokens.css` : jetons (`--nh-*` : couleurs, recettes de plaque, mouvement) et remappage des jetons Arc UI.
- `src/components/plaque/` : primitives réutilisables (`Plaque`, `Rivet`, `DotsRow`, `Spiral`, `Badge`, `Pin`, `PinCheckbox`, `TextField`, `TextAreaField`, `ObliquePanel`, `Scene`, `Logo`, `ButtonLink`).
- `src/components/arc/` : composants Arc UI restylés. Variantes de bouton : `primary`, `secondary`, `cavity`, `ghost`, `danger`.
- **Illustrations** : elles ne sont pas encore produites. Le composant `Scene` affiche un fond « scène » avec la description de l'image attendue. Pour en ajouter une, déposer le fichier dans `public/images/` et passer `src` à `Scene`.
- **Accessibilité** :
  - contrastes vérifiés (axe-core) ;
  - focus clavier visible ;
  - lien « Aller au contenu » ;
  - titres hiérarchisés ;
  - mise en page testée à 375 px de large.

---

## Tests

- `pnpm test` : tests rapides des règles (étapes et validation de la candidature, rangs, notes, badges, délai de recandidature). Ils ne demandent ni base ni réseau.
- `pnpm test:e2e` : parcours complets dans un vrai navigateur :
  - site public, à 375 px de large sans débordement ;
  - accès au portail selon le rang ;
  - candidature, demande de modification, correction, validation de l'écrit, entretien, whitelist.

  Ils tournent sur une **base de test**, jamais sur la base de production :

  ```bash
  DATABASE_URL=postgres://.../nea_test pnpm db:migrate     # une fois
  E2E_DATABASE_URL=postgres://.../nea_test pnpm test:e2e
  ```

  Ils lancent leur propre serveur (port 3100) et un **faux Discord** local (`tests/e2e/fake-discord.ts`, branché par la variable `DISCORD_API_URL`, ignorée en production). Aucun appel n'est donc fait au vrai Discord, et les messages privés envoyés sont vérifiés. Deux comptes de test (ID `9000000000000000xx`) sont recréés à chaque lancement. Il faut un `AUTH_SECRET` (`.env.local`) et Chromium (`pnpm exec playwright install chromium`).

---

## Sécurité

- **Aucun secret dans le dépôt** : tout passe par les variables d'environnement (`.env*` est ignoré par git).
- Chaque écriture passe par une Server Action qui revérifie la session, le rang (relu sur Discord pour les actions sensibles) et la limite d'actions. Toutes les entrées sont validées par Zod côté serveur.
- Le joueur ne voit jamais les notes internes. Le recruteur ne voit pas les notes réservées aux admins (le filtre est fait côté serveur).
- **RLS activée sans règle sur toutes les tables** : seul le propriétaire des tables y accède, rien n'est exposé par une API publique de la base.
- Le token du bot ne quitte jamais le serveur. `DISCORD_API_URL` (faux Discord des tests) est ignorée en production.

---

## À faire avant l'ouverture

- [ ] **Pages légales** (`src/content/legal.ts`) : les textes sont provisoires. Compléter le responsable de publication, l'hébergeur et le contact, puis faire relire.
- [ ] **Illustrations** à produire et à brancher (voir [Design](#design)).
- [ ] **Administration › Rôles et permissions** : régler les rôles et enregistrer une première fois.
- [ ] **Administration › Reprises** : ajouter les entreprises du serveur. Vérifier les places des affinités et créatures et les critères de refus.
- [ ] **Nom de domaine** : `NEXT_PUBLIC_SITE_URL` et redirection OAuth Discord.
- [ ] **`NEXT_PUBLIC_INDEXABLE=true`** le jour de l'ouverture.
- [ ] Mettre à jour `src/content/owners.ts` si l'équipe des owners change.
