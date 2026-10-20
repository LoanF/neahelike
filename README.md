# Néa Hélikè

Site vitrine et portail whitelist du serveur roleplay FiveM **Néa Hélikè** (mythologie grecque).

## Stack

- **Next.js 15** (App Router) + **TypeScript**, CSS Modules
- **Arc UI** (uiarc.dev) installé via la CLI shadcn, restylé en « Struck Plaque »
- **Auth.js** (connexion Discord), **Drizzle** + **Supabase** (Postgres)
- À venir : présence temps réel, bot Discord

## Démarrer

```bash
pnpm install
cp .env.example .env.local   # puis remplir les valeurs
pnpm db:migrate              # crée les tables dans Supabase
pnpm dev                     # http://localhost:3000
pnpm lint
pnpm build
```

## Portail : configuration Discord

1. Créer une application sur https://discord.com/developers/applications.
2. **OAuth2** : copier le Client ID et le Client Secret dans `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET`, et ajouter la redirection `https://<domaine>/api/auth/callback/discord` (et `http://localhost:3000/api/auth/callback/discord` en local).
3. **Bot** : générer le token (`DISCORD_BOT_TOKEN`), activer l'intent « Server Members », puis inviter le bot sur le serveur avec la permission « Gérer les rôles ». Son rôle doit être placé **au-dessus** des rôles Initié, Aspirant et Hélikéen.
4. Copier l'ID du serveur et des rôles (mode développeur Discord → clic droit → Copier l'identifiant).

Les permissions du site suivent les rôles Discord : rôle Staff → staff, rôle Recruteur → recruteur, sinon joueur. Elles sont relues à chaque connexion puis toutes les 5 minutes ; quitter le serveur ou perdre un rôle retire aussitôt les droits.

## Design

Le site reprend le langage visuel de l'interface en jeu, « The Struck Plaque » : plaques de bronze martelé, reliefs dorés, coins carrés.

- `src/styles/tokens.css` : jetons du design system (couleurs, recettes de plaque, mouvement).
- `docs/lore/` : diapos de référence du lore.
- `/kit` : page (non indexée) qui présente tous les composants du site.

## Organisation

| Dossier | Rôle |
|---|---|
| `src/styles/tokens.css` | Jetons Néa Hélikè (`--nh-*`) et remappage des jetons Arc UI |
| `src/components/arc/` | Composants Arc UI (restylés : variantes de bouton `primary`, `secondary`, `cavity`, `ghost`, `danger`) |
| `src/components/plaque/` | Primitives : `Plaque`, `Rivet`, `DotsRow`, `Spiral`, `Badge`, `Pin`, `PinCheckbox`, `TextField`, `TextAreaField`, `ObliquePanel`, `Scene`, `Logo`, `ButtonLink` |
| `src/content/` | **Tous les textes du site** : lore, règlement, FAQ, pages légales, liens (Discord), places ouvertes/closes |
| `src/components/site/` | En-tête, pied de page, sections, emblèmes dessinés du lore |
| `src/app/` | Pages (App Router) : `(site)/` pour le site public |
| `public/images/` | Logo et, plus tard, illustrations |

## Illustrations

Les illustrations ne sont pas encore produites. Le composant `Scene` affiche à leur place un fond « scène » avec la description de l'image attendue. Il suffit ensuite de lui passer `src`.
