# Mon App - Starter (Vite + React + Supabase)

Ce repo est un starter minimal pour une application de gestion de cotisations,
conçue pour être déployée sur **GitHub Pages** (frontend statique) et connectée à **Supabase**
pour l'auth, la base Postgres, le stockage et le temps réel.

## Contenu
- `src/` : code React minimal (Dashboard, Cotisations, Supabase client)
- `vite.config.js` : `base` configuré pour GitHub Pages
- `package.json` : scripts (build, deploy)

## Configuration (avant de lancer)
1. Crée un projet Supabase et copie ton `PROJECT_URL` et `ANON_KEY`.
2. Crée un fichier `.env` à la racine avec :
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Installe les dépendances :
   ```
   npm install
   ```
4. Lancer en local :
   ```
   npm run dev
   ```
5. Déployer sur GitHub Pages :
   - Initialise le repo GitHub et pousse le code.
   - Exécute :
     ```
     npm run build
     npm run deploy
     ```
   - Ou configure GitHub Actions / Pages selon tes préférences.

## Remarques
- Ne mets jamais de clés secrètes dans le repo public.
- Le client Supabase utilise la clé `anon` (publique) ; pour les opérations sensibles, utilise Edge Functions ou policies côté Supabase.
