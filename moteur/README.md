# Moteur de règles

Rôle : à partir des données de l'utilisateur et de `build/seuils.json`, donner le statut d'une mesure, classer
les leviers et lever les alertes de sécurité. Il ne touche ni à l'interface ni au stockage : des fonctions pures.
Le LLM, plus tard, commente ces résultats, il ne les décide pas.

Statut : **`statutMesure` implémenté** (`src/`), les 19 vecteurs passent (`npm test`, `npm run check` dans `moteur/`, après nvm).
Reste : classement des leviers et alertes de sécurité (interactions, contre-indications : données à écrire côté bibliothèque).

## Règles de statut
`regles/statut.json`, écrit à la main à partir des tableaux de seuils des fiches : chaque référentiel cite sa fiche et sa ligne.
Seuls 6 marqueurs ont une règle (ceux des vecteurs : LDL-C, ferritine, HbA1c, vitamine D, PA domicile, fer sérique).
Tout autre marqueur reçoit `inconnu`, y compris ceux dont le seuil est « non retrouvé ». Limites connues :
- LDL-C : le moteur ne connaît pas encore le risque cardiovasculaire de la personne, il applique la cible du risque faible
  (3,0 mmol/L) et le dit dans le message.
- Ferritine ASH 2026 : source secondaire (presse), marquée `fiabilite: secondaire` ; à recontrôler.
- Aucun lien automatique entre les lignes de `build/seuils.json` et les règles : à décider (colonne d'identifiant dans les
  tableaux, ou génération des règles).

## Vecteurs de test
`vecteurs/statut.json` : entrées → sorties attendues, indépendantes du langage. Toute implémentation
(TypeScript aujourd'hui, Rust/WASM peut-être demain) doit les passer telles quelles. Les valeurs de seuil
viennent des fiches de la bibliothèque, à la date indiquée dans chaque cas.

Règles que les vecteurs fixent :
- Chaque seuil garde sa source ; quand deux référentiels divergent (ferritine OMS / ASH), le résultat porte les deux.
- Une zone « discutée » (vitamine D) est un statut à part, pas un statut « normal ».
- Un seuil dont la source n'a pas été retrouvée (`non_retrouve`) ne produit jamais de statut : résultat `inconnu`.
- Une valeur hors plage physiologique plausible est refusée, pas classée.
