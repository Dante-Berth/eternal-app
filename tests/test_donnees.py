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

    def test_traitement_avec_fiche_ou_substance_jamais_les_deux(self):
        for t in charger("docs", "exemple-donnees.json")["traitements"]:
            self.assertEqual(("fiche" in t) + ("substance" in t), 1, t["id"])

    def test_habitudes_en_niveaux_grossiers_sans_texte_libre(self):
        niveaux = {"jamais", "occasionnel", "regulier", "quotidien"}
        habitudes = charger("docs", "exemple-donnees.json")["profil"]["habitudes"]
        self.assertEqual(len({h["habitude"] for h in habitudes}), len(habitudes))
        for h in habitudes:
            self.assertEqual(set(h), {"habitude", "niveau"})
            self.assertIn(h["niveau"], niveaux)
            self.assertRegex(h["habitude"], r"^[a-z0-9]+(-[a-z0-9]+)*$")

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


MARQUEURS = os.path.join(RACINE, "vendor", "eternal", "donnees", "marqueurs.json")


def convertir(marqueur, valeur, unite):
    """Valeur dans l'unité usuelle du marqueur (même formule que le moteur)."""
    if unite == marqueur["unite"]:
        return valeur
    for cv in marqueur.get("conversions", []):
        if cv["unite"] == unite:
            return valeur * cv["facteur"] + cv.get("decalage", 0)
    raise KeyError(unite)


@unittest.skipUnless(os.path.exists(MARQUEURS), "sous-module eternal absent")
class TestMarqueurs(unittest.TestCase):
    def setUp(self):
        self.par_id = {m["id"]: m for m in charger("vendor", "eternal", "donnees", "marqueurs.json")["marqueurs"]}

    def test_marqueurs_des_vecteurs_connus_et_unites_convertibles(self):
        for c in charger("moteur", "vecteurs", "statut.json")["cas"]:
            m = self.par_id.get(c["marqueur"])
            self.assertIsNotNone(m, c["nom"])
            if "erreur" not in c["attendu"]:
                convertir(m, 1, c["unite"])

    def test_conversions_attendues_par_les_vecteurs(self):
        attendu = {"valeur_g_par_l": "g/L", "valeur_pct": "%", "valeur_nmol_par_l": "nmol/L"}
        vus = 0
        for c in charger("moteur", "vecteurs", "statut.json")["cas"]:
            for cle, unite in attendu.items():
                if cle in c["attendu"]:
                    m = self.par_id[c["marqueur"]]
                    self.assertEqual(m["unite"], unite, c["nom"])
                    self.assertAlmostEqual(convertir(m, c["valeur"], c["unite"]), c["attendu"][cle], delta=0.02 * c["attendu"][cle], msg=c["nom"])
                    vus += 1
        self.assertGreaterEqual(vus, 3)


if __name__ == "__main__":
    unittest.main()
