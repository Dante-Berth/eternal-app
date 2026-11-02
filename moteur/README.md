# Moteur de règles

Rôle : à partir des données de l'utilisateur et de `build/seuils.json`, donner le statut d'une mesure, classer
les leviers et lever les alertes de sécurité. Il ne touche ni à l'interface ni au stockage : des fonctions pures.
Le LLM, plus tard, commente ces résultats, il ne les décide pas.

Statut : **spécification et vecteurs de test uniquement.** Le code TypeScript vient avec l'initialisation de
SvelteKit (Node n'est pas installé sur la machine de développement actuelle).

## Vecteurs de test
`vecteurs/statut.json` : entrées → sorties attendues, indépendantes du langage. Toute implémentation
(TypeScript aujourd'hui, Rust/WASM peut-être demain) doit les passer telles quelles. Les valeurs de seuil
viennent des fiches de la bibliothèque, à la date indiquée dans chaque cas.

Règles que les vecteurs fixent :
- Chaque seuil garde sa source ; quand deux référentiels divergent (ferritine OMS / ASH), le résultat porte les deux.
- Une zone « discutée » (vitamine D) est un statut à part, pas un statut « normal ».
- Un seuil dont la source n'a pas été retrouvée (`non_retrouve`) ne produit jamais de statut : résultat `inconnu`.
- Une valeur hors plage physiologique plausible est refusée, pas classée.
