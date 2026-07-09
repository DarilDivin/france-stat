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
| `estim-pop-dep-sexe-gca-1975-2023.xls` | Téléchargement INSEE brut d'origine (série 1975-2023, population par département/sexe/âge). Conservé comme archive de référence — **non lu par le code**. |
| `estim-pop-dep-2023.csv` | Extrait de l'année 2023 découpé depuis le fichier ci-dessus. C'est l'unique entrée du pipeline de conversion. |
| `population.json` | Généré à partir du CSV par [`scripts/convert.ts`](scripts/convert.ts). C'est le seul fichier de données réellement consommé par l'application (`hooks/usePopulationData.tsx`). |
| `france-departements-avec-outre-mer.geojson` | Contours géographiques des 101 départements (métropole + DOM), utilisé par la carte. Indépendant du pipeline de population. |

Source : [INSEE — Estimations de population par département, sexe et grande classe d'âge](https://www.insee.fr/fr/statistiques/1893198).

### Régénérer `population.json`

Si `estim-pop-dep-2023.csv` change (nouvelle année, correction), régénérer le JSON avec :

```bash
pnpm data:convert
```

Le script ([`scripts/convert.ts`](scripts/convert.ts)) parse le CSV, puis valide les données avant d'écrire le fichier :
- vérifie que chaque département a un code et un nom ;
- vérifie qu'il n'y a ni doublon, ni département manquant ou inattendu par rapport à la liste des codes INSEE connus ;
- vérifie que `hommes + femmes = ensemble` pour chaque tranche d'âge et le total.

En cas d'incohérence, le script affiche le détail des erreurs, s'arrête avec un code de sortie non nul, et **n'écrit pas** `population.json` — les données publiées restent donc toujours cohérentes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
