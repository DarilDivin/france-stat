This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Données

Toutes les données sont statiques, servies depuis `public/data/` — il n'y a aucune route API ni serveur de données.

| Fichier | Rôle |
|---|---|
| `estim-pop-dep-sexe-gca-1975-2026.xlsx` | Téléchargement INSEE brut d'origine (série 1975-2026, population par département/sexe/grande classe d'âge, une feuille par année). Source unique du pipeline. |
| `population.json` | Millésime le plus récent (2026), généré à partir du xlsx par [`scripts/convert.ts`](scripts/convert.ts). Seul fichier de données consommé par l'application pour la vue courante (`hooks/usePopulationData.tsx`). |
| `population-history.json` | Série complète 1975-2026 (population totale par département et par année), générée à partir du même xlsx par [`scripts/convert-history.ts`](scripts/convert-history.ts). Alimente le graphique d'évolution (`PopulationTrendChart`). |
| `france-departements-avec-outre-mer.geojson` | Contours géographiques des 101 départements (métropole + DOM), utilisé par la carte. Indépendant du pipeline de population. |

Source : [INSEE — Estimation de la population au 1ᵉʳ janvier](https://www.insee.fr/fr/statistiques/8721456) (série par département, sexe et grande classe d'âge).

### Régénérer les données

Quand l'INSEE publie un nouveau millésime (nouvelle année, ou fichier corrigé), remplacer `estim-pop-dep-sexe-gca-1975-YYYY.xlsx` dans `public/data/`, mettre à jour le nom de fichier attendu par `XLS_PATH` dans `scripts/convert.ts` et `scripts/convert-history.ts`, puis régénérer :

```bash
pnpm data:convert          # population.json — dernière année du classeur
pnpm data:convert-history  # population-history.json — toutes les années du classeur
```

`convert.ts` prend automatiquement la feuille de l'année la plus récente du classeur (pas besoin d'extraction manuelle). Les deux scripts valident les données avant d'écrire le fichier :
- vérifient que chaque département a un code et un nom ;
- vérifient qu'il n'y a ni doublon, ni département manquant ou inattendu par rapport à la liste des codes INSEE connus (la couverture DOM varie selon l'année) ;
- vérifient que `hommes + femmes = ensemble` pour chaque tranche d'âge et le total ;
- `convert-history.ts` vérifie en plus que sa dernière année coïncide avec `population.json`, puisque les deux fichiers dérivent de la même source par des chemins différents.

En cas d'incohérence, le script affiche le détail des erreurs, s'arrête avec un code de sortie non nul, et **n'écrit pas** le fichier de sortie — les données publiées restent donc toujours cohérentes.

Penser aussi à mettre à jour les mentions du millésime codées en dur dans l'UI (`app/page.tsx`, `components/Footer.tsx`, `components/charts/PopulationTrendChart.tsx`).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
