# Étude : données d'interactions

Date : 2026-11-02. Statut : **étude et proposition, rien d'implémenté**. Sert l'étape 3 de `VISION.md` (alertes de sécurité du moteur). Les chiffres viennent de `vendor/eternal` au commit 6823c62 ; le script `compilateur/sonde_interactions.py` les reproduit.

## Ce que la bibliothèque contient aujourd'hui
- Aucune donnée structurée : pas de `donnees/interactions.json`. Tout est dans la prose des sections « Sécurité, interactions, incompatibilités » (173 fiches sous ce titre exact, une trentaine de variantes d'intitulé pour 261 fiches au total).
- 179 des 231 fiches d'actifs ont une telle section ; aucune fiche produit, protocole, acte ou biomarqueur. Les 29 médicaments de la bibliothèque sont des traitements esthétiques, hormonaux ou métaboliques (finastéride, metformine, statines, rapamycine…), pas les médicaments courants : **aucun anticoagulant, antidépresseur, antihypertenseur ou antidiabétique n'a de fiche**.
- Les sections sont de la prose à puces, avec un gras en tête de puce (« **Warfarine** : … »). Elles mélangent effets indésirables, contre-indications, grossesse, interactions et incompatibilités entre actifs.
- Niveaux de preuve dans ces sections : 473 `[?]`, 305 `[B]`, 73 `[A]`, 22 `[D]`, 21 `[C]`, 7 `[M]`. **La majorité des mentions disent qu'on ne sait pas.**
- Liens entre fiches : 98 fiches de sécurité renvoient vers une autre fiche (195 liens distincts, dont 152 vers des actifs). Ces liens sont des renvois, pas des interactions typées.
- Sujets les plus fréquents (nombre de fiches) : grossesse 157, allaitement 83, insuffisance rénale 39, anticoagulants 32, alcool 18, contre-indications 17, warfarine 14, CYP 13, statines 11.

## Trois pièges pour une extraction
Sonde sur « anticoagulant, warfarine, antivitamine K » : 45 lignes dans 39 fiches.
1. **Absence de donnée ≠ interaction** : 21 lignes sur 45 disent « non recherché » ou « aucune étude retrouvée ». Une extraction naïve fabriquerait 21 faux signaux (ou, pire, 21 fausses assurances).
2. **Résultats négatifs** : le ginseng n'a pas changé l'INR dans deux petits essais ; la grenade n'élève pas l'exposition aux substrats du CYP2C9 chez l'humain. Ce sont des « pas d'interaction démontrée », à stocker comme tels.
3. **Lignes hors sujet** qui citent le mot (apnée du sommeil, hépatotoxicité de la nicotinamide) : la relecture humaine reste nécessaire.

Conclusion : le jeu de données se **construit à la main, par relecture**, avec un statut explicite par paire ; le script ne fait que présenter les candidats.

## Ce qu'il faudrait modéliser
Un seul fichier `donnees/interactions.json` dans `eternal`, validé par `verifier.py` comme `marqueurs.json`.

```json
{
  "schema_version": 1,
  "substances": {
    "antivitamine-k": { "nom": "Antivitamines K", "type": "classe",
      "membres": ["warfarine", "acenocoumarol", "fluindione"], "fiche": null }
  },
  "interactions": [
    {
      "id": "avk--vitamine-k-alimentaire",
      "a": { "fiche": "legumes-verts-a-feuilles" },
      "b": { "substance": "antivitamine-k" },
      "statut": "documente",
      "mecanisme": "pharmacodynamique",
      "effet": "la vitamine K alimentaire déplace l'INR",
      "gravite": "moderee",
      "conduite": "consommation régulière, ne pas la supprimer ; avis du médecin ou du pharmacien",
      "preuve": "B",
      "sources": [{ "pmid": "à relire", "fiche": "cruciferes-brocoli-et-sulforaphane" }]
    }
  ],
  "contre_indications": [
    { "fiche": "…", "situation": "grossesse", "statut": "documente", "preuve": "…", "sources": [] }
  ]
}
```
(Exemple illustratif, à relire avant tout usage : la gravité et la conduite ne sont pas encore validées.)

Valeurs proposées :
- `statut` : `documente` (effet observé chez l'humain ou texte réglementaire), `plausible` (mécanisme ou cas isolés, non démontré), `non_demontre` (testé, rien trouvé), `aucune_donnee` (non recherché ou introuvable).
- `mecanisme` : `pharmacocinetique` (CYP, absorption), `pharmacodynamique`, `additif`, `chimique` (incompatibilité de formule).
- `gravite` : échelle à définir avec une source ; ne jamais l'inventer.
- `sources` : PMID vérifiés, ou texte réglementaire (RCP, ANSM, BDPM) avec date de consultation, comme dans les tableaux de seuils.

## Comportement du moteur (proposition)
- `documente` : alerte, avec le niveau de preuve visible. `plausible` : mention « prudence », jamais présentée comme un fait. `non_demontre` et `aucune_donnee` : affichés comme « aucune donnée », **jamais comme « pas d'interaction »**. C'est la règle de la bibliothèque (« aucune donnée est une réponse normale »).
- Pas de dose ni de conduite pour un injectable non autorisé (règle du projet).
- Le LLM peut expliquer une alerte, il ne la décide pas.

## Trou à combler côté données de l'utilisateur
Le format v1 ne connaît que `traitements[].fiche` : on ne peut déclarer qu'un levier de la bibliothèque. Or l'interaction qui compte vient d'un **médicament hors bibliothèque** (anticoagulant, antidépresseur, etc.). Il faudra un champ `substance` (identifiant d'une classe ou d'une DCI de `substances`) et une saisie assistée, sans stocker de texte libre. C'est un changement additif du format (v1 → v1.1 ou v2) à décider avant d'écrire le moteur d'alertes.

## Aliments et mode de vie déclarés par la personne
Décision de l'auteur (2026-11-02) : la personne peut ajouter ce qui la concerne, pour que les interactions couvrent aussi l'alimentation et le mode de vie (pamplemousse, alcool, légumes verts riches en vitamine K, café, tabac, soja, activité physique…).
- **Format** : `profil.habitudes[]`, déjà ajouté à `docs/format-donnees.md` : un identifiant de `eternal/donnees/habitudes.json` et un niveau parmi `jamais`, `occasionnel`, `regulier`, `quotidien`. Pas de quantité ni de texte libre (même règle que pour le futur partage anonyme).
- **Bibliothèque** (à écrire dans `eternal`) : `donnees/habitudes.json`, avec le même contrôle que `marqueurs.json` ; une habitude pointe vers sa fiche quand elle en a une (par exemple `legumes-verts-a-feuilles`). Les interactions peuvent viser une `fiche`, une `substance` ou une `habitude` (`"b": { "habitude": "pamplemousse" }`).
- **Moteur** : une interaction n'est évaluée que si les deux côtés sont connus de la personne. Une habitude non déclarée produit « non renseigné, aucune vérification possible », pas « aucun risque ». L'interface peut proposer de la déclarer au moment où elle ajoute un traitement concerné.
- **Vie privée** : les habitudes sont des données de santé, locales et exportées avec le reste ; elles sont exclues du partage anonyme tant qu'aucune classe grossière n'a été décidée pour elles.
- **Preuve** : une interaction avec un aliment suit les mêmes statuts que les autres. Beaucoup n'ont aucune donnée humaine (le pamplemousse est l'exception bien établie pour le CYP3A4 ; la grenade ne l'est pas, voir plus haut) : ne pas transformer une idée reçue en alerte.

## Résultat du pilote (2026-11-02)
Les 45 lignes du sondage ont été relues par trois relecteurs indépendants, chaque PMID vérifié dans PubMed (`get_article_metadata`), puis fusionnées en **43 paires** dans `eternal/donnees/interactions.json` (commit 0b14c71) avec `habitudes.json` (6 habitudes déclarables). `verifier.py` contrôle les références, les statuts et que chaque PMID cité figure dans une fiche.
- **Statuts** : 25 `aucune_donnee`, 13 `plausible`, 4 `documente`, 1 `non_demontre`. Autrement dit, **la bibliothèque ne sait rien ou presque sur la plupart des paires**, et l'interface devra le dire.
- **Documentés** : vitamine K alimentaire × antivitamine K (essai croisé randomisé, INR 3,1 → 2,8 avec un régime enrichi ; les preuves de revue sont contradictoires selon la dose), glucosamine × antivitamine K (plus de 40 cas, EFSA), vitamine E × anticoagulants et antiagrégants (avis EFSA 2024, texte réglementaire sans chiffre).
- **Rétrogradés par la relecture** : ail, ginkgo, mélatonine, grenade, rhodiola passent de « documenté » (fiche) à `plausible`, car le résumé ne contient pas de chiffre d'interaction. Trois paires du ginkgo avaient des statuts contradictoires entre relecteurs : le plus prudent a été retenu.
- **Conduite** : `null` partout. Aucun RCP, ANSM ou EFSA n'a été relu directement ; ils sont cités de seconde main. Remplir `conduite` demande de lire ces textes.
- **Gravité** : `inconnue` partout (échelle non choisie).
- **Points faibles connus** : le côté `antivitamine-k` généralise parfois une source qui ne nomme que la warfarine (dit dans `commentaire`) ; l'entrée boswellia (in vitro, preuve D) est à la limite de `aucune_donnee` ; une entrée de peptides (selank) décrit un effet propre sur la coagulation et pas une interaction médicamenteuse ; PMID 20630973 a été retiré faute de résumé lisible. La mélatonine (cas avec la warfarine) et les oméga-3 ont une ligne traitée dans leur propre fiche.
- **Non traité** : les antihypertenseurs, antidiabétiques, immunosuppresseurs, chimiothérapies et antidépresseurs cités dans les mêmes fiches (hors périmètre du pilote).

## Plan du pilote (réalisé pour l'étape 1)
Commencer par **les antivitamines K** : 39 fiches concernées, sujet à fort enjeu, sources connues (RCP, EFSA, PubMed). Étapes :
1. Relire les 45 lignes du sondage (`python3 compilateur/sonde_interactions.py anticoagul warfarine "antivitamine K"`), vérifier chaque PMID, trier en `documente` / `plausible` / `non_demontre` / `aucune_donnee`.
2. Écrire `donnees/interactions.json` et `substances`, étendre `verifier.py` (fiches et PMID existants, statut permis, une source par `documente`).
3. Ajouter `substance` au format utilisateur, puis les alertes au moteur avec des vecteurs de test (une alerte, une absence de donnée, un résultat négatif).
Puis, dans l'ordre : grossesse et allaitement (157 et 83 fiches, forme la plus homogène), insuffisance rénale (39), CYP.

## Décisions
Validées par l'auteur le 2026-11-02 : le principe de l'étude, le pilote sur les antivitamines K, l'affichage de « aucune donnée » plutôt que le silence, et l'ajout par la personne de ses habitudes.

Encore ouvertes :
1. **Source de gravité** : échelle maison, ou référentiel public (par exemple le thésaurus ANSM des interactions médicamenteuses, à vérifier avant usage : non lu ici) ? Tant que rien n'est tranché, `gravite` reste `inconnue`.
2. **Relecture médicale** des paires `documente` avant affichage (`relu_par`) : obligatoire ou non ? Proposition : obligatoire avant toute diffusion hors de l'auteur.
3. **Médicaments courants** : `substances` sans fiche (rapide, suffit pour détecter) ou vraies fiches (travail de bibliothèque beaucoup plus lourd) ? Proposition : `substances` d'abord.
