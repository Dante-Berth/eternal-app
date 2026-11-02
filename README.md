# eternal-app

Application mobile (PWA) qui aide une personne à comprendre ses analyses et à choisir des leviers de santé
dont l'efficacité est prouvée. Ses données restent sur l'appareil. La connaissance vient de la bibliothèque
[eternal](https://github.com/Dante-Berth/eternal) (fiches sourcées avec niveau de preuve), incluse en sous-module.

Deux parties, qui ne partagent que le fichier compilé :
1. **Wiki** : recherche et lecture des fiches (publiques).
2. **Suivi** : profil, mesures, journal, leviers classés (privé, local).

## Dépôts
- `vendor/eternal` : la bibliothèque, en lecture seule. Mise à jour = avancer le sous-module.
- Après un clone : `git submodule update --init`.

## Organisation
```text
compilateur/   fiches Markdown → JSON consommé par l'app (Python, bibliothèque standard)
moteur/        règles de l'app (statut d'une mesure, classement, alertes) et leurs vecteurs de test
docs/          format des données utilisateur (versionné)
decisions.md   décisions techniques et ce qui les remettrait en cause
```

## Commandes
```sh
python3 compilateur/compiler.py          # écrit build/ (index.json, fiches/<id>.json, seuils.json)
python3 -m unittest discover tests       # tests du compilateur
```

Avertissement : information éducative, pas un avis médical.
