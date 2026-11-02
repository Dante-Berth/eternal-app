import type { EntreeRecherche, FicheMeta, Filtres } from './types.js';

/** Même normalisation que compilateur/compiler.py : minuscules, sans accents, ponctuation → espaces. */
export function normaliser(texte: string): string {
	return texte
		.toLowerCase()
		.replace(/œ/g, 'oe')
		.replace(/æ/g, 'ae')
		.normalize('NFD')
		.replace(/\p{Mn}/gu, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

const ORDRE_PREUVE: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, M: 4, '?': 5 };

function pointsChamp(champ: string, mot: string, poids: number): number {
	if (!champ) return 0;
	const i = champ.indexOf(mot);
	if (i < 0) return 0;
	const debutDeMot = i === 0 || champ[i - 1] === ' ';
	return poids + (debutDeMot ? poids / 2 : 0);
}

/**
 * Tous les mots de la requête doivent apparaître (sous-chaîne) dans la fiche ; score pondéré par champ.
 * Sans requête : toutes les fiches du filtre, triées par titre.
 */
export function chercher(
	requete: string, index: EntreeRecherche[], metas: Map<string, FicheMeta>, filtres: Filtres = {},
): FicheMeta[] {
	const mots = normaliser(requete).split(' ').filter(Boolean);
	const resultats: { meta: FicheMeta; score: number }[] = [];
	for (const e of index) {
		const meta = metas.get(e.id);
		if (!meta) continue;
		if (filtres.type && meta.type !== filtres.type) continue;
		if (filtres.cible && !meta.cibles.includes(filtres.cible)) continue;
		if (filtres.preuve && meta.preuve_globale !== filtres.preuve) continue;
		let score = 0;
		let tous = true;
		for (const mot of mots) {
			const s = pointsChamp(e.titre, mot, 10) + pointsChamp(e.resume, mot, 4)
				+ pointsChamp(e.sections, mot, 2) + pointsChamp(e.corps, mot, 1);
			if (s === 0) { tous = false; break; }
			score += s;
		}
		if (tous) resultats.push({ meta, score });
	}
	resultats.sort((a, b) =>
		b.score - a.score
		|| (ORDRE_PREUVE[a.meta.preuve_globale] ?? 9) - (ORDRE_PREUVE[b.meta.preuve_globale] ?? 9)
		|| a.meta.titre.localeCompare(b.meta.titre, 'fr'));
	return resultats.map((r) => r.meta);
}
