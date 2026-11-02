# Décisions techniques

Chaque décision indique ce qui la remettrait en cause. Date : 2026-11-02.

| Décision | Pourquoi | Ce qui la remettrait en cause |
|---|---|---|
| PWA (TypeScript, Svelte, SvelteKit statique) | un seul code, installable par lien, standards web stables, itération rapide sur l'interface | besoin d'Apple Santé / Health Connect (→ emballage Capacitor, sans réécriture) |
| Pas de serveur ni de compte en v1 | les données de santé restent sur l'appareil ; rien à héberger, pas d'HDS | fonction payante ou synchronisation entre appareils |
| Données utilisateur en JSON versionné (`schema_version`), export complet | la donnée dure plus que la pile ; on peut quitter l'app sans rien perdre | aucune : à conserver |
| Moteur de règles séparé de l'interface, avec vecteurs de test en JSON | la valeur métier est portable ; un portage (Rust/WASM) se vérifie avec les mêmes tests | calcul lourd côté serveur, ou besoin de Stoffel (SDK Rust) |
| Compilateur en Python (bibliothèque standard) | même outillage que la bibliothèque (`verifier.py`, `graphe.py`) ; aucune dépendance | la compilation passe en CI Node : alors portage en TypeScript |
| Bibliothèque en sous-module git | version des connaissances épinglée et reproductible | fiches publiées sous forme de paquet versionné |
| Rust pour Stoffel et le chiffrement, plus tard, derrière la même interface | SDK Stoffel en Rust ; seul usage où Rust est un avantage net | Stoffel écarté après vérification de sa maturité |
