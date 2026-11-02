# Vision et état du projet

Point d'entrée pour reprendre le travail dans une nouvelle session. Dernière mise à jour : 2026-11-02.

## L'idée en une phrase
Aider une personne à **comprendre ses analyses biologiques** et à choisir **des leviers de santé dont l'efficacité est prouvée**, avec une **bibliothèque** sourcée (mini-Wikipédia scientifique) à portée de main, sans que ses données quittent son téléphone.

## Pour qui, et dans quel ordre
- Utilisateur type : 25 à 55 ans, fait des bilans sanguins, lit sur la santé, se méfie du marketing des compléments, n'a pas de médecin qui prend le temps d'expliquer.
- Ordre : l'auteur seul, puis ses collègues (il fait de la recherche médicale et connaît des médecins), puis le public. Fonctions payantes plus tard.
- Cible : l'individu (B2C), pas un outil de cabinet. Les médecins servent de relecteurs des fiches et de cadre pour la future étude de cohorte, pas de canal de distribution.
- Positionnement : l'avis indépendant et sourcé sur ce qui marche vraiment. La vie privée est un argument de confiance, pas le produit. Pas de revenus d'affiliation sur les compléments : ils détruiraient l'indépendance, qui est le seul avantage.

## Les deux parties
1. **Wiki** (public) : recherche et lecture des fiches, niveau de preuve toujours visible.
2. **Suivi** (privé, local) : profil, mesures, journal, leviers classés pour ses mesures.

Trois moments clés : « je reçois mon bilan » (situer chaque valeur, ce qui peut la fausser), « que puis-je faire ? » (leviers classés par lien avec mes mesures puis par preuve, effets sur les autres systèmes), « est-ce que ça a marché ? » (courbe d'une mesure avec les leviers suivis entre deux bilans).

Hors périmètre : suivi alimentaire détaillé (calories, macros), scores de longévité ou « âge biologique » (marketing non validé), diagnostic.

## Principes non négociables
- Chaque affirmation d'efficacité porte un niveau de preuve (A à D, M, ?) ; « aucune donnée » est une réponse normale. Règles complètes : `vendor/eternal/CLAUDE.md`.
- Quand deux référentiels divergent (ferritine OMS 2020 ≤ 15 contre ASH 2026 ≤ 30), l'app montre les deux avec leur source.
- Le LLM explique, il ne décide pas : seuils, contre-indications, interactions et classement sont déterministes. Plus tard seulement.
- Pas de dose, de reconstitution ni de protocole pour un injectable non autorisé.
- Données locales, pas de compte, export complet, aucune donnée personnelle dans le dépôt.
- Information éducative, pas un avis médical, affiché à chaque recommandation.

## Vie privée et partage
- Local d'abord. Partage anonyme **opt-in** plus tard, uniquement des classes grossières (tranche d'âge de 10 ans, sexe, pays, quintile d'un marqueur, leviers, tendance du ressenti). Jamais de valeur exacte, de date précise ni de texte libre. Le contenu exact est montré avant envoi.
- Garanties à combiner pour les études de cohorte : agrégation par calcul multipartite (Stoffel MPC, SDK Rust, maturité non vérifiée : aucune documentation développeur officielle trouvée), seuil minimal par groupe (k ≈ 20), bruit de confidentialité différentielle. Les résultats d'une telle cohorte sont des hypothèses (tag B ou ?), jamais A.
- Stoffel **ne rend pas anonymes les appels à un LLM** : le texte envoyé à l'API reste en clair pour le fournisseur. Pistes réalistes : minimiser et catégoriser le profil avant envoi, relais sans compte, petit modèle local, rétention zéro.
- Juridique à vérifier avant toute diffusion (RGPD données de santé, HDS si hébergement, dispositif médical si recommandations individuelles) : non sourcé ici.

## Design (maquette validée par l'auteur)
Maquette cliquable : https://claude.ai/artifact/E5TTWfwF6mJAutH3wwPoRL (privée) ; source dans `docs/maquette/index.html` (HTML autonome, polices Google Fonts en ligne).
- Cinq onglets : Aujourd'hui, Mesures, Leviers, Savoir, Moi.
- Niveau de preuve en premier : lettre dans une pastille dont l'intensité varie (A plein, B moyen, C clair, D pointillé, ? hachuré) ; couleurs d'état séparées (dans la cible, à regarder, hors cible, zone discutée).
- Calme et clinique, mobile d'abord. Fiche d'une mesure : valeur, barre de zones, courbe avec seuils, recommandations, ce qui peut fausser, leviers liés, source.

## Pile technique (détails et conditions de remise en cause : `decisions.md`)
- PWA : TypeScript, SvelteKit statique, Dexie (IndexedDB), service worker. Pas de serveur ni de compte.
- Moteur de règles en paquet pur, séparé de l'interface, avec vecteurs de test en JSON (`moteur/vecteurs/`). Portable en Rust/WASM si besoin (Stoffel, chiffrement).
- Données utilisateur en JSON versionné (`docs/format-donnees.md`), export chiffré.
- Emballage Capacitor seulement si Apple Santé / Health Connect devient nécessaire.
- Rust n'est pas pour l'interface : la durabilité vient du format des données, des tests du moteur et de peu de dépendances, pas du langage.

## Dépôts
- `~/Documents/Git/eternal` (GitHub Dante-Berth/eternal) : bibliothèque, 416 fiches Markdown, 3 373 PMID. Règles dans son `CLAUDE.md`, skills `/nouvelle-fiche` et `/relecture`, vérifications par `python3 scripts/verifier.py`. Fiches triées par type dans `fiches/<type>/`.
- `~/Documents/Git/eternal-app` (GitHub Dante-Berth/eternal-app) : l'app. Sous-module `vendor/eternal`. Commits : un par fonctionnalité essentielle ici ; gros commits par thème dans `eternal`.

## Fait
- Bibliothèque : 38 fiches biomarqueurs, dont 14 créées ou complétées le 2026-11-01 avec un tableau de seuils sourcés (colonnes fixes : Marqueur, Unité, Borne, Signification, Population, Source).
- Bibliothèque : `donnees/marqueurs.json` (id, nom, fiche principale, unité usuelle, conversions affines, forme « paire » pour la tension), champ `marqueurs:` sur les 38 fiches biomarqueurs, contrôles dans `verifier.py`.
- App : squelette SvelteKit (`app/`), wiki (recherche + lecture + hors-ligne), moteur de statut (`moteur/`, 6 marqueurs, 19 vecteurs). `.gitignore`, `decisions.md`, sous-module, compilateur Python (fiches → `build/index.json`, `build/fiches/<id>.json`, `build/seuils.json`), format de données v1, 19 vecteurs de test du moteur, 10 tests.

## Constats sur la bibliothèque (compilateur, 2026-11-02)
- Les 38 fiches biomarqueurs ont un tableau de seuils, mais beaucoup de bornes ne sont que des descriptions d'études (médiane, +1 écart-type) et non des seuils d'action : le moteur ne leur donnera pas de statut.
- 66 lignes de seuils sur 372 ont une source « non retrouvée » : le moteur ne leur donne jamais de statut.
- 30 fiches sur 38 n'ont pas d'`unite` (fiches multi-marqueurs).
- Identifiants stables des marqueurs : `donnees/marqueurs.json` (82 marqueurs, résolu le 2026-11-02). Il reste à relier les libellés des tableaux de seuils (« Uricémie », « PA domicile »…) à ces identifiants : fait par le moteur à l'étape 3, ou par une colonne dédiée.
- Seuils à recontrôler : ferritine ASH 2026 (source secondaire), hémoglobine OMS 2024, glycémie OMS/IDF 2006. Toutes les fiches de ce lot sont `sources_verifiees: partielle`.
- Pas de fiche obésité/surpoids dans `conditions/`. `apob-lipides-et-statines` et la fiche LDL-C se recoupent (non fusionnées).

## Prochaines étapes, dans l'ordre
1. **Bibliothèque** (reste) : compléter les fiches sans seuils (CRP, Lp(a), vitamine D faites le 2026-11-02 ; 12 restantes) (chaque seuil sourcé, PMID vérifié) ; décider comment lier les lignes de seuils à un identifiant de marqueur ; `population` par marqueur si le moteur en a besoin. Fait : `donnees/marqueurs.json`, champ `marqueurs:`, validation par `verifier.py`.
2. **Environnement** : installer Node (via nvm), puis `npm create svelte` dans `eternal-app`.
3. **Moteur** : implémenter le statut d'une mesure en TypeScript contre `moteur/vecteurs/statut.json`, puis classement des leviers et alertes. Il faut aussi des interactions (`donnees/interactions.json`, à écrire côté bibliothèque) et des contre-indications structurées.
4. **Wiki** : fait le 2026-11-02 pour la recherche, la lecture et le hors-ligne (`app/src/routes/savoir/`). Reste : liens entre fiches par domaine, fiche d'un marqueur avec ses seuils lus par le moteur, installation PWA (manifeste, icônes), référencement si le wiki devient public.
5. **Suivi** : saisie des mesures, courbes, journal, export chiffré.
6. Plus tard : étude de cohorte (cadre éthique et CNIL à vérifier), Stoffel, LLM, import Apple Santé, paiement.

## Questions ouvertes
- Fusion des doublons restants dans la bibliothèque (ApoB/LDL, sécrétagogues de GH).
- Faut-il publier le code ou la bibliothèque en open source ? Modèle de monétisation exact (abonnement, achat unique) et compatibilité avec l'anonymat (jeton sans compte).
- Relecture des fiches par des médecins (champ `relu_par`) : à décider.
