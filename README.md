# Néa Hélikè

Site vitrine et portail whitelist du serveur roleplay FiveM **Néa Hélikè** (mythologie grecque).

## Stack

- **Next.js 15** (App Router) + **TypeScript**, CSS Modules
- **Arc UI** (uiarc.dev) installé via la CLI shadcn, restylé en « Struck Plaque »
- À venir : Supabase (base de données, présence temps réel), Auth.js (Discord), bot Discord

## Démarrer

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm lint
pnpm build
```

## Design

Le site reprend le langage visuel de l'interface en jeu, « The Struck Plaque » : plaques de bronze martelé, reliefs dorés, coins carrés.

- `docs/design/README.md` : handoff des maquettes (jetons, recettes, écrans). Il fait foi pour les écrans livrés.
- `docs/design/DESIGN-ingame-struck-plaque.md` : design system en jeu, la référence en cas de doute.
- `docs/design/designs/*.dc.html` : maquettes HTML. Ouvrir avec `npx serve docs/design/designs`.
- `/kit` : page (non indexée) qui présente tous les composants du site.

## Organisation

| Dossier | Rôle |
|---|---|
| `src/styles/tokens.css` | Jetons Néa Hélikè (`--nh-*`) et remappage des jetons Arc UI |
| `src/components/arc/` | Composants Arc UI (restylés : variantes de bouton `primary`, `secondary`, `cavity`, `ghost`, `danger`) |
| `src/components/plaque/` | Primitives : `Plaque`, `Rivet`, `DotsRow`, `Spiral`, `Badge`, `Pin`, `PinCheckbox`, `TextField`, `TextAreaField`, `ObliquePanel`, `Scene`, `Logo`, `ButtonLink` |
| `src/app/` | Pages (App Router) |
| `public/images/` | Logo et, plus tard, illustrations |

## Illustrations

Les illustrations ne sont pas encore produites. Le composant `Scene` affiche à leur place un fond « scène » avec la description de l'image attendue. Il suffit ensuite de lui passer `src`.
