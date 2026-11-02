#!/usr/bin/env python3
"""Compile les fiches d'eternal en JSON pour l'app (bibliothèque standard uniquement).

Usage :
  python3 compilateur/compiler.py [--source vendor/eternal] [--sortie build]

Sorties (déterministes, sans horodatage) :
  index.json        métadonnées de toutes les fiches + vocabulaire (chargé au démarrage de l'app)
  fiches/<id>.json  une fiche : sections Markdown, liens, PMID (chargée à la demande)
  marqueurs.json    identifiants stables des marqueurs, unités et conversions (copie de donnees/marqueurs.json)
  seuils.json       lignes des tableaux « Valeurs, unités et seuils », une par seuil

L'identifiant d'une fiche est son nom de fichier sans .md. Les liens Markdown entre fiches sont
réécrits en `fiche:<id>`. Le compilateur ne déduit rien du texte : il recopie frontmatter, liens,
PMID et tableaux de seuils.
"""
import argparse
import json
import os
import re
import subprocess
import sys

SCHEMA_VERSION = 1
COLONNES_SEUILS = ["Marqueur", "Unité", "Borne", "Signification", "Population", "Source"]
RE_LIEN = re.compile(r"\]\(([^)\s]+)\)")
RE_PMID = re.compile(r"PMID[\s:]*(\d{5,9}(?:\s*(?:,|;|/|et)\s*\d{5,9})*)")
RE_TAG = re.compile(r"\[([ABCDM?])\b")
PIED = "Fiche éducative à usage personnel."


class ErreurCompilation(Exception):
    pass


def frontmatter(texte):
    """Retourne (dict, corps). Sous-ensemble de YAML : `clé: valeur`, listes `[a, b]`, commentaires `# …`."""
    if not texte.startswith("---\n"):
        return {}, texte
    fin = texte.find("\n---\n", 4)
    if fin < 0:
        return {}, texte
    fm = {}
    for ligne in texte[4:fin].splitlines():
        m = re.match(r"([A-Za-z_][\w-]*):\s*(.*)$", ligne)
        if not m:
            continue
        v = m.group(2)
        if not v.startswith(('"', "'")):
            v = re.split(r"\s+#", v, maxsplit=1)[0]
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            fm[m.group(1)] = [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
        else:
            fm[m.group(1)] = v.strip("\"'")
    return fm, texte[fin + 5:]


def sections(corps):
    """Découpe sur les titres `## `. Retourne (intro, [(titre, texte)])."""
    intro, liste, cour = [], [], None
    for ligne in corps.splitlines():
        if ligne.startswith("## "):
            if cour:
                liste.append((cour[0], "\n".join(cour[1]).strip()))
            cour = (ligne[3:].strip(), [])
        elif cour:
            cour[1].append(ligne)
        elif not ligne.startswith("# "):
            intro.append(ligne)
    if cour:
        liste.append((cour[0], "\n".join(cour[1]).strip()))
    return "\n".join(intro).strip(), liste


def pmids(texte):
    vus = []
    for m in RE_PMID.finditer(texte):
        for p in re.findall(r"\d{5,9}", m.group(1)):
            if p not in vus:
                vus.append(p)
    return vus


def reecrire_liens(texte, chemin, ids_par_chemin, liens):
    def sub(m):
        cible = m.group(1)
        if re.match(r"[a-z]+:|#", cible):
            return m.group(0)
        dest = os.path.normpath(os.path.join(os.path.dirname(chemin), cible.partition("#")[0]))
        fid = ids_par_chemin.get(dest)
        if not fid:
            return m.group(0)
        if fid not in liens:
            liens.append(fid)
        return "](fiche:%s)" % fid
    return RE_LIEN.sub(sub, texte)


def seuils_de(fid, texte_section):
    """Lignes des tableaux dont l'en-tête est exactement COLONNES_SEUILS."""
    lignes, actif = [], False
    for ligne in texte_section.splitlines():
        if not ligne.startswith("|"):
            actif = False
            continue
        cases = [c.strip() for c in ligne.strip().strip("|").split("|")]
        if cases == COLONNES_SEUILS:
            actif = True
            continue
        if not actif or set("".join(cases)) <= set("-: "):
            continue
        if len(cases) != len(COLONNES_SEUILS):
            raise ErreurCompilation("%s : ligne de seuils à %d colonnes : %s" % (fid, len(cases), ligne[:80]))
        d = dict(zip(["marqueur", "unite", "borne", "signification", "population", "source"], cases))
        tag = RE_TAG.search(d["source"])
        d["preuve"] = tag.group(1) if tag else ""
        d["non_retrouve"] = "non retrouvé" in ligne.lower()
        d["fiche"] = fid
        lignes.append(d)
    return lignes


def resume(texte_tldr):
    for ligne in texte_tldr.splitlines():
        if ligne.startswith("- "):
            t = re.sub(r"\*\*|\[([^\]]*)\]\([^)]*\)", lambda m: m.group(1) or "", ligne[2:]).strip()
            return t if len(t) <= 300 else t[:297].rstrip() + "…"
    return ""


def lister(source):
    base = os.path.join(source, "fiches")
    out = []
    for racine, _, fichiers in os.walk(base):
        for f in fichiers:
            if f.endswith(".md"):
                out.append(os.path.relpath(os.path.join(racine, f), source))
    return sorted(out)


def compiler(source):
    chemins = lister(source)
    ids_par_chemin, vus = {}, {}
    for c in chemins:
        fid = os.path.basename(c)[:-3]
        if fid in vus:
            raise ErreurCompilation("identifiant en double : %s (%s, %s)" % (fid, vus[fid], c))
        vus[fid] = c
        ids_par_chemin[c] = fid
    index, fiches, seuils = [], {}, []
    for c in chemins:
        fid = ids_par_chemin[c]
        with open(os.path.join(source, c), encoding="utf-8") as fh:
            texte = fh.read()
        fm, corps = frontmatter(texte)
        if not fm.get("titre"):
            raise ErreurCompilation("%s : titre absent du frontmatter" % c)
        liens = []
        corps = reecrire_liens(corps, c, ids_par_chemin, liens)
        intro, secs = sections(corps)
        pied = ""
        if secs and PIED in secs[-1][1]:
            t, pied_i = secs[-1][1], secs[-1][1].rfind(PIED)
            pied = t[pied_i:].strip()
            secs[-1] = (secs[-1][0], t[:pied_i].strip())
        dict_secs = [{"titre": t, "markdown": m} for t, m in secs]
        for t, m in secs:
            if t.startswith("Valeurs, unités et seuils"):
                seuils.extend(seuils_de(fid, m))
        tldr = next((m for t, m in secs if t.startswith("TL;DR")), "")
        meta = {
            "id": fid, "titre": fm["titre"], "type": fm.get("type", ""), "famille": fm.get("famille", ""),
            "cibles": fm.get("cibles", []), "preuve_globale": fm.get("preuve_globale", ""),
            "statut_fr": fm.get("statut_fr", ""), "derniere_maj": fm.get("derniere_maj", ""),
            "sources_verifiees": fm.get("sources_verifiees", ""), "unite": fm.get("unite", ""),
            "mesure": fm.get("mesure", ""), "marqueurs": fm.get("marqueurs", []), "resume": resume(tldr),
            "nb_pmid": len(pmids(texte)), "nb_seuils": 0,
        }
        index.append(meta)
        fiches[fid] = dict(meta, intro=intro, sections=dict_secs, liens=sorted(liens), pmid=pmids(texte), pied=pied)
    nb = {}
    for s in seuils:
        nb[s["fiche"]] = nb.get(s["fiche"], 0) + 1
    for m in index:
        m["nb_seuils"] = nb.get(m["id"], 0)
        fiches[m["id"]]["nb_seuils"] = m["nb_seuils"]
    return index, fiches, seuils


def commit_source(source):
    try:
        r = subprocess.run(["git", "-C", source, "rev-parse", "HEAD"], capture_output=True, text=True, check=True)
        return r.stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def ecrire(chemin, obj):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, sort_keys=True, indent=1)
        f.write("\n")


def main(argv=None):
    ici = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--source", default=os.environ.get("ETERNAL_DIR", os.path.join(ici, "vendor", "eternal")))
    p.add_argument("--sortie", default=os.path.join(ici, "build"))
    a = p.parse_args(argv)
    if not os.path.isdir(os.path.join(a.source, "fiches")):
        sys.exit("Source introuvable : %s (git submodule update --init ?)" % a.source)
    try:
        index, fiches, seuils = compiler(a.source)
    except ErreurCompilation as e:
        sys.exit("ERREUR " + str(e))
    vocab_chemin = os.path.join(a.source, "donnees", "vocabulaire.json")
    vocab = {}
    if os.path.exists(vocab_chemin):
        with open(vocab_chemin, encoding="utf-8") as fh:
            vocab = json.load(fh)
    ecrire(os.path.join(a.sortie, "index.json"), {
        "schema_version": SCHEMA_VERSION, "source_commit": commit_source(a.source),
        "vocabulaire": vocab, "fiches": index})
    for fid, f in fiches.items():
        ecrire(os.path.join(a.sortie, "fiches", fid + ".json"), dict(f, schema_version=SCHEMA_VERSION))
    marqueurs_chemin = os.path.join(a.source, "donnees", "marqueurs.json")
    if os.path.exists(marqueurs_chemin):
        with open(marqueurs_chemin, encoding="utf-8") as fh:
            ecrire(os.path.join(a.sortie, "marqueurs.json"), json.load(fh))
    ecrire(os.path.join(a.sortie, "seuils.json"), {"schema_version": SCHEMA_VERSION, "seuils": seuils})
    print("%d fiches, %d lignes de seuils (%d à source non retrouvée) → %s" % (
        len(index), len(seuils), sum(1 for s in seuils if s["non_retrouve"]), a.sortie))


if __name__ == "__main__":
    main()
