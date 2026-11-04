/** Exports CSV pour traiter ses données soi-même (tableur, Python). Séparateur « ; », décimales avec point, UTF-8 avec BOM. */
import { e1rm, seancesRecentes, type Carnet } from '../muscu/seances.js';
import { EPREUVES, FAMILLES, type Suivi } from '../suivi/mesures.js';

/** Échappe un champ ; neutralise les débuts de formule (= + - @) qu'un tableur exécuterait. */
export function champ(v: string | number | undefined): string {
	let s = v === undefined ? '' : String(v);
	if (/^[=+\-@\t\r]/.test(s) && typeof v === 'string') s = `'${s}`;
	return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const ligne = (cs: Array<string | number | undefined>) => cs.map(champ).join(';');
const BOM = '﻿';

export function csvMuscu(c: Carnet): string {
	const lignes = [ligne(['date', 'seance', 'exercice', 'serie', 'repetitions', 'charge_kg', 'rpe', 'e1rm_estime_kg'])];
	for (const s of [...seancesRecentes(c)].reverse())
		for (const e of s.exercices)
			e.series.forEach((x, i) => lignes.push(ligne([s.date, s.nom, e.nom, i + 1, x.reps, x.charge, x.rpe, Math.round(e1rm(x) * 10) / 10])));
	return BOM + lignes.join('\n') + '\n';
}

export function csvForme(s: Suivi): string {
	const lignes = [ligne(['date', 'famille', 'epreuve', 'valeur', 'unite'])];
	const tri = [...s.mesures].sort((a, b) => a.date.localeCompare(b.date));
	for (const m of tri) {
		const e = EPREUVES.find((x) => x.id === m.epreuve);
		if (e) lignes.push(ligne([m.date, FAMILLES[e.famille], e.nom, m.valeur, e.unite]));
	}
	return BOM + lignes.join('\n') + '\n';
}
