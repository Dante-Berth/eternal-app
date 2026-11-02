# CLAUDE.md : eternal-app

Application mobile (PWA) de suivi des analyses biologiques et de leviers de santé prouvés. Langue : français. Ton : direct, sceptique.

## À faire en premier dans une nouvelle session
1. Lire `VISION.md` (idée, principes, état, **prochaines étapes dans l'ordre**) puis `decisions.md`.
2. `git submodule update --init` si `vendor/eternal` est vide ; `python3 -m unittest discover tests` doit passer.
3. Reprendre à la section « Prochaines étapes » de `VISION.md`, étape 1.

## Règles
- `vendor/eternal` est en lecture seule. Une correction de connaissance se fait dans le dépôt `~/Documents/Git/eternal` (ses règles : son `CLAUDE.md`), puis on avance le sous-module.
- Jamais de donnée personnelle de santé dans ce dépôt ; `.gitignore` exclut les exports.
- Le niveau de preuve reste visible partout où une affirmation d'efficacité apparaît. Aucun seuil sans source ; un seuil `non_retrouve` ne donne jamais de statut.
- Le moteur de règles reste séparé de l'interface et passe `moteur/vecteurs/*.json` tels quels.
- Pas de dose ni de protocole pour un injectable non autorisé.
- Commit après chaque fonctionnalité essentielle, message `Thème : ce qui change`, sans pousser sans demande. Terminer le message par la ligne `Co-Authored-By` fournie par l'environnement.
- Node n'était pas installé au 2026-11-02 : ne pas inventer de code TypeScript non exécutable ; installer Node d'abord (étape 2).

## Commandes
```sh
python3 compilateur/compiler.py        # écrit build/ (ignoré par git)
python3 -m unittest discover tests
```
