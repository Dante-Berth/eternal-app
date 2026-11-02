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

## Proposition de pilote
Commencer par **les antivitamines K** : 39 fiches concernées, sujet à fort enjeu, sources connues (RCP, EFSA, PubMed). Étapes :
1. Relire les 45 lignes du sondage (`python3 compilateur/sonde_interactions.py anticoagul warfarine "antivitamine K"`), vérifier chaque PMID, trier en `documente` / `plausible` / `non_demontre` / `aucune_donnee`.
2. Écrire `donnees/interactions.json` et `substances`, étendre `verifier.py` (fiches et PMID existants, statut permis, une source par `documente`).
3. Ajouter `substance` au format utilisateur, puis les alertes au moteur avec des vecteurs de test (une alerte, une absence de donnée, un résultat négatif).
Puis, dans l'ordre : grossesse et allaitement (157 et 83 fiches, forme la plus homogène), insuffisance rénale (39), CYP.

## Décisions pour l'auteur
1. Pilote sur les antivitamines K, ou un autre point de départ ?
2. Source de gravité : échelle maison, ou référentiel public (par exemple le thésaurus ANSM des interactions médicamenteuses, à vérifier avant usage : non lu ici) ?
3. Relecture médicale des paires `documente` avant affichage (`relu_par`) : obligatoire ou non ?
4. Ajouter les médicaments courants comme `substances` sans fiche, ou créer de vraies fiches ? Les créer demande un travail de bibliothèque beaucoup plus lourd.
5. Que faire quand la bibliothèque ne sait rien : se taire, ou afficher « aucune donnée » à chaque levier suivi ? (Proposition : afficher, pour ne pas donner une fausse assurance.)
