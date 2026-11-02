import json
import os
import shutil
import sys
import tempfile
import unittest

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(ICI), "compilateur"))
import compiler as C  # noqa: E402

MINI = os.path.join(ICI, "fixtures", "mini")


class TestCompilateur(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index, cls.fiches, cls.seuils = C.compiler(MINI)

    def test_frontmatter_liste_et_commentaire(self):
        f = self.fiches["biomarqueur-test"]
        self.assertEqual(f["cibles"], ["prevention", "longevite"])
        self.assertEqual(f["unite"], "g/L")
        self.assertEqual(f["titre"], "Biomarqueur : test (T)")

    def test_liens_reecrits_et_externes_laisses(self):
        f = self.fiches["biomarqueur-test"]
        self.assertIn("](fiche:actif-test)", f["intro"])
        self.assertIn("(https://example.org/a.md)", f["intro"])
        self.assertEqual(f["liens"], ["actif-test"])

    def test_pmid_multiples_sans_doublon(self):
        self.assertEqual(self.fiches["biomarqueur-test"]["pmid"], ["111111", "222222", "333333"])

    def test_seuils_extraits(self):
        s = self.seuils
        self.assertEqual(len(s), 3)
        self.assertEqual(s[0]["borne"], "< 1,0")
        self.assertEqual(s[0]["fiche"], "biomarqueur-test")
        self.assertEqual(s[1]["preuve"], "B")
        self.assertTrue(s[2]["non_retrouve"])
        self.assertFalse(s[0]["non_retrouve"])

    def test_pied_separe_et_resume(self):
        f = self.fiches["biomarqueur-test"]
        self.assertTrue(f["pied"].startswith("Fiche éducative"))
        self.assertNotIn("Fiche éducative", f["sections"][-1]["markdown"])
        self.assertTrue(f["resume"].startswith("Résumé du test"))

    def test_id_en_double_refuse(self):
        with tempfile.TemporaryDirectory() as d:
            for sous in ("actifs", "conditions"):
                os.makedirs(os.path.join(d, "fiches", sous))
                shutil.copy(os.path.join(MINI, "fiches", "actifs", "actif-test.md"), os.path.join(d, "fiches", sous))
            with self.assertRaises(C.ErreurCompilation):
                C.compiler(d)

    def test_ecriture_deterministe(self):
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            for sortie in (a, b):
                C.main(["--source", MINI, "--sortie", sortie])
            for nom in ("index.json", "seuils.json"):
                with open(os.path.join(a, nom), encoding="utf-8") as fa, open(os.path.join(b, nom), encoding="utf-8") as fb:
                    self.assertEqual(fa.read(), fb.read())
            self.assertTrue(os.path.exists(os.path.join(a, "fiches", "actif-test.json")))


if __name__ == "__main__":
    unittest.main()
