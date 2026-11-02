# Format des données utilisateur (version 1)

Fichier unique `eternal-donnees.json`, stocké sur l'appareil (IndexedDB) et exporté tel quel (chiffré à l'export).
Il ne contient que ce que la personne saisit. La connaissance (seuils, fiches) n'y est jamais copiée : on y
renvoie par identifiant, pour que les seuils puissent être corrigés dans la bibliothèque sans toucher aux données.

## Règles
- `schema_version` : entier, incrémenté à chaque changement incompatible. Toute version a une migration testée vers la suivante.
- Les valeurs sont stockées **telles que saisies**, avec leur unité. Aucune conversion destructive.
- Dates en ISO 8601 (`2026-11-02`). Identifiants : chaînes minuscules avec tirets.
- `marqueur` désigne un marqueur de la bibliothèque (identifiant stable défini dans `eternal/donnees/marqueurs.json` ; la mesure est exprimée dans une unité convertible vers l'unité usuelle du marqueur ; `forme: "paire"` = valeur `[systolique, diastolique]`).
  `fiche` désigne un identifiant de fiche (nom de fichier sans `.md`).
- Aucun champ de texte libre n'entre dans le futur partage anonyme (voir `partage`).

## Structure
```json
{
  "schema_version": 1,
  "profil": { "annee_naissance": 1988, "sexe": "F", "objectifs": ["energie", "coeur"] },
  "mesures": [
    { "id": "m-0001", "marqueur": "ferritine", "valeur": 22, "unite": "µg/L", "date": "2026-10-12", "note": "" }
  ],
  "traitements": [
    { "id": "t-0001", "fiche": "fer-et-ferritine", "debut": "2026-10-20", "fin": null }
  ],
  "journal": [
    { "date": "2026-11-01", "ressenti": 4, "leviers": ["marche", "avoine"] }
  ],
  "partage": { "actif": false }
}
```

| Champ | Type | Remarque |
|---|---|---|
| `profil.sexe` | `"F"`, `"M"`, `"autre"` ou `null` | sert à choisir la bonne ligne de seuil (population) |
| `mesures[].valeur` | nombre | la valeur exacte reste locale |
| `mesures[].unite` | chaîne | unité du résultat de laboratoire |
| `traitements[].fin` | date ou `null` | `null` = en cours ; sert aux interactions et aux artefacts de mesure |
| `journal[].ressenti` | entier 1 à 5 | 1 = très mal, 5 = très bien |
| `partage.actif` | booléen | `false` par défaut ; jamais activé sans action explicite |

## Futur partage anonyme (non implémenté)
Seules des classes grossières peuvent sortir de l'appareil (tranche d'âge de 10 ans, sexe, pays, quintile d'un marqueur,
liste de leviers, tendance du ressenti). Jamais de valeur exacte, de date précise ni de texte libre. Le contenu exact est
affiché avant tout envoi.
