#!/usr/bin/env python3
"""Sonde de lecture seule : lignes des sections « Sécurité » qui parlent d'une substance ou d'une classe.

Usage :
  python3 compilateur/sonde_interactions.py anticoagul warfarine "antivitamine K" [--source vendor/eternal]

Sortie TSV (fiche, tags de preuve, état, ligne) pour une relecture MANUELLE. Rien n'est déduit : l'état
« absence » signale une ligne qui dit « non recherché / aucune donnée » (ce n'est pas une interaction),
« documente » une ligne avec au moins un tag A ou B ou un PMID, « a_lire » le reste.
"""
import argparse
import glob
import os
import re
import sys

RE_ABSENCE = re.compile(r"non (?:re)?cherch|non v[ée]rifi|aucune (?:donn|[ée]tude|interaction)|non relu|non document|pas de donn", re.I)


def sections_securite(texte):
    m = re.search(r"^## (?:Sécurité|Incompatibilités)[^\n]*\n(.*?)(?=^## |\Z)", texte, re.S | re.M)
    return m.group(1) if m else ""


def etat(ligne, tags):
    if RE_ABSENCE.search(ligne):
        return "absence"
    if {"A", "B"} & set(tags) or re.search(r"PMID \d", ligne):
        return "documente"
    return "a_lire"


def sonder(source, mots):
    motif = re.compile("|".join(re.escape(m) for m in mots), re.I)
    for chemin in sorted(glob.glob(os.path.join(source, "fiches", "*", "*.md"))):
        with open(chemin, encoding="utf-8") as f:
            sec = sections_securite(f.read())
        for ligne in sec.splitlines():
            if motif.search(ligne):
                tags = re.findall(r"\[([ABCDM?])[\],]", ligne)
                propre = re.sub(r"\s+", " ", ligne.strip(" -*"))
                yield os.path.basename(chemin)[:-3], "".join(tags) or "-", etat(ligne, tags), propre


def main(argv=None):
    ici = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("mots", nargs="+")
    p.add_argument("--source", default=os.path.join(ici, "vendor", "eternal"))
    a = p.parse_args(argv)
    n = 0
    for fiche, tags, e, ligne in sonder(a.source, a.mots):
        print("\t".join([fiche, tags, e, ligne]))
        n += 1
    print("%d lignes" % n, file=sys.stderr)


if __name__ == "__main__":
    main()
