# Agents — guide rapide

Ce projet n'est **pas** une app Next.js. C'est un site statique généré par `scripts/build-schools.mjs`.

## Ce qui ship

- `vercel.json` → `buildCommand: node scripts/build-schools.mjs`, `outputDirectory: public`, `framework: null`.
- Le contenu servi en prod = exactement ce qu'il y a sous `public/` après build.

## Avant de modifier quoi que ce soit

1. **Donnée école** : éditer `data/schools/{slug}.json`, validé par `data/school.schema.json` (AJV strict, `additionalProperties: false`). Toujours rebuild pour voir le résultat.
2. **Rendu fiche** : `data/fiche-ecole-template.html`. Moteur Mustache maison — `{{var}}` échappe HTML, `{{{var}}}` rend en raw (utiliser pour JSON-LD). Sections `{{#x}}…{{/x}}` et `{{^x}}…{{/x}}`.
3. **Pages éditoriales** : écrites à la main sous `public/{page}/index.html` (homepage, ecoles, comparer, quiz, blog, a-propos, contact, cgu, confidentialite, mentions-legales). Pas régénérées — modifier à la main.
4. **Tokens** : `public/design/tokens.css` est la source unique. `/comparer/`, `/quiz/`, `/ecoles/` ont chacune un `:root` inline avec des tokens page-spécifiques — à ne pas confondre.

## Règles dures

- TypeScript strict si TS introduit (`any` interdit, `@ts-ignore` interdit).
- Pas de notation/rating/score/classement/Top X dans la donnée ni les pages.
- Pas d'image générée → `public/og-default.jpg` est à fournir manuellement.
- Toute modif du template ou du schéma doit être suivie d'un rebuild + revalidation AJV des 17 fiches + parse des JSON-LD générés.

## Sanity checks

```bash
npm run validate                 # AJV sur data/schools/
npm run build                    # rebuild complet
# Puis vérifier :
#  - 17/17 fiches générées sous public/
#  - JSON-LD <script> de chaque fiche parsable via JSON.parse
#  - aucune référence cassée dans similar_schools
```
