import json
import os
import re
import unittest

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def charger(*chemin):
    with open(os.path.join(RACINE, *chemin), encoding="utf-8") as f:
        return json.load(f)


class TestDonnees(unittest.TestCase):
    def test_exemple_respecte_le_format_v1(self):
        d = charger("docs", "exemple-donnees.json")
        self.assertEqual(d["schema_version"], 1)
        self.assertIn(d["profil"]["sexe"], ("F", "M", "autre", None))
        for m in d["mesures"]:
            self.assertIsInstance(m["valeur"], (int, float))
            self.assertTrue(m["unite"])
            self.assertRegex(m["date"], ISO)
        for t in d["traitements"]:
            self.assertRegex(t["debut"], ISO)
            self.assertTrue(t["fin"] is None or ISO.match(t["fin"]))
        for j in d["journal"]:
            self.assertIn(j["ressenti"], range(1, 6))
        self.assertIs(d["partage"]["actif"], False)

    def test_identifiants_de_mesure_uniques(self):
        ids = [m["id"] for m in charger("docs", "exemple-donnees.json")["mesures"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_vecteurs_bien_formes(self):
        v = charger("moteur", "vecteurs", "statut.json")
        statuts = {"ok", "a_regarder", "hors_cible", "discute", "inconnu"}
        noms = [c["nom"] for c in v["cas"]]
        self.assertEqual(len(noms), len(set(noms)))
        for c in v["cas"]:
            self.assertIn("marqueur", c)
            self.assertTrue(("statut" in c["attendu"] and c["attendu"]["statut"] in statuts) or "erreur" in c["attendu"], c["nom"])


if __name__ == "__main__":
    unittest.main()
