# School Select

Annuaire éditorial des écoles privées internationales en Tunisie (scalable Maghreb).

## Stack

- HTML statique 100 % servi par Vercel — aucun framework SPA/SSR.
- Pipeline de build Node.js : `data/schools/*.json` → `scripts/build-schools.mjs` → `public/{slug}/index.html`.
- Schéma AJV strict (`data/school.schema.json`) — chaque fiche est validée avant rendu.
- Mini-Mustache maison embarqué dans le build script (pas de dépendance externe).
- Design system : `public/design/tokens.css` (palette Ink + Jade, source unique).

Seules dépendances runtime du build : `ajv` et `ajv-formats`.

## Structure

```
data/
  school.schema.json           Source de vérité du contrat école
  fiche-ecole-template.html    Template HTML utilisé par le build
  schools/                     Une école = un JSON (slug.json)
scripts/
  build-schools.mjs            Pipeline de build (validation + rendu + sitemap)
public/                        Sortie servie par Vercel (index.html par dossier)
  design/tokens.css            Design system
  data/schools.json            Index agrégé (généré, consommé client-side)
  sitemap.xml, robots.txt
vercel.json                    buildCommand + redirects + headers
```

## Commandes

```bash
npm run build         # Génère public/{slug}/index.html pour les 17 écoles
npm run build:dry     # Pareil sans écriture sur disque (preview)
npm run validate      # Valide les JSONs sans rendre
npm run preview       # Sert public/ en local sur :3001 (via npx serve)
```

## Ajouter une école

1. Créer `data/schools/{slug}.json` en suivant `data/school.schema.json`.
2. `npm run build`. Si le JSON est invalide, AJV remontera les erreurs.
3. Vérifier `public/{slug}/index.html` rendu.
4. Commit + push : Vercel auto-deploy via `buildCommand` dans `vercel.json`.

### Règle `classification.verified`

Toute école publiée doit avoir `verified: true`. Cela signifie que son existence a été cross-vérifiée par au moins deux sources publiques : son site officiel + un registre d'accréditation (IBO, AEFE, Cambridge, BSO ou équivalent). La valeur `false` est réservée à un état interne « en attente de validation » et ne doit jamais apparaître sur l'annuaire en production.

## Règles éditoriales

- **Pas de notation, pas de rating, pas de score, pas de classement, pas de Top X.** Les écoles sont présentées factuellement, sans hiérarchie.
- **Sources officielles uniquement** : AEFE, IBO, Cambridge, BSO, ministère TN.
- **Périmètre** : écoles privées internationales (curriculum non-tunisien ou bilingue international).
- Neutralité éditoriale stricte. Pas de partenariat commercial qui infléchirait le contenu.

## Statut

V1 en cours. 17 écoles TN référencées à ce jour. Phase de collecte photos en cours hors automatisation.
