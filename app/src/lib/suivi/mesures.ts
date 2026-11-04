/** Suivi de la forme (force, souplesse, endurance). Local, sans seuil : on montre l'évolution de la personne, pas un verdict. */

export type Famille = 'force' | 'souplesse' | 'endurance';

export interface Epreuve {
	id: string;
	famille: Famille;
	nom: string;
	unite: string;
	/** Sens dans lequel la valeur s'améliore (« plus » : monter est mieux). Convention de lecture, pas un seuil. */
	sens: 'plus' | 'moins';
	protocole: string;
}

export const FAMILLES: Record<Famille, string> = { force: 'Force', souplesse: 'Étirement et souplesse', endurance: 'Endurance' };

export const EPREUVES: Epreuve[] = [
	{ id: 'prehension', famille: 'force', nom: 'Force de préhension', unite: 'kg', sens: 'plus',
		protocole: 'Dynamomètre à main, debout, bras le long du corps. Meilleur de 3 essais, toujours la même main.' },
	{ id: 'pompes', famille: 'force', nom: 'Pompes', unite: 'répétitions', sens: 'plus',
		protocole: 'Maximum d’affilée en gardant le même niveau d’exigence (amplitude, corps aligné) à chaque fois.' },
	{ id: 'lever-chaise', famille: 'force', nom: '5 levers de chaise', unite: 's', sens: 'moins',
		protocole: 'Chronométrer 5 levers de chaise le plus vite possible, bras croisés. Même chaise à chaque fois.' },
	{ id: 'planche', famille: 'force', nom: 'Planche (gainage)', unite: 's', sens: 'plus',
		protocole: 'Durée de tenue sur les avant-bras, corps aligné, arrêt dès que la posture se dégrade.' },
	{ id: 'assis-pieds', famille: 'souplesse', nom: 'Assis, atteinte des pieds', unite: 'cm', sens: 'plus',
		protocole: 'Assis jambes tendues, pointe des doigts vers l’avant. 0 = bout des pieds, négatif si on ne les atteint pas.' },
	{ id: 'genou-mur', famille: 'souplesse', nom: 'Cheville, genou au mur', unite: 'cm', sens: 'plus',
		protocole: 'Distance maximale du pied au mur en gardant le talon au sol et le genou qui touche le mur. Chaque cheville séparément.' },
	{ id: 'marche-6min', famille: 'endurance', nom: 'Marche de 6 minutes', unite: 'm', sens: 'plus',
		protocole: 'Distance parcourue à la marche rapide en 6 minutes, sur un parcours plat identique.' },
	{ id: 'cooper', famille: 'endurance', nom: 'Test de Cooper (12 min)', unite: 'm', sens: 'plus',
		protocole: 'Distance maximale en 12 minutes de course ou de marche, sur un parcours identique.' },
	{ id: 'fc-repos', famille: 'endurance', nom: 'Fréquence cardiaque au repos', unite: 'bpm', sens: 'moins',
		protocole: 'Au réveil, allongé, avant de se lever. Moyenne sur plusieurs jours si possible.' },
	{ id: 'vo2max', famille: 'endurance', nom: 'VO₂max estimée', unite: 'mL/kg/min', sens: 'plus',
		protocole: 'Estimation d’une montre ou d’un test. Les appareils diffèrent : garder le même.' },
];

export interface Mesure {
	id: string;
	epreuve: string;
	date: string; // AAAA-MM-JJ
	valeur: number;
	note?: string;
}

export interface Suivi {
	mesures: Mesure[];
}

export const suiviVide = (): Suivi => ({ mesures: [] });

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dateValide(s: unknown): s is string {
	if (typeof s !== 'string' || !DATE.test(s)) return false;
	const d = new Date(`${s}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Lit le suivi stocké ; ignore ce qui est invalide. */
export function lireSuivi(brut: string | null): Suivi {
	if (!brut) return suiviVide();
	try {
		const o = JSON.parse(brut) as { mesures?: unknown };
		if (!o || !Array.isArray(o.mesures)) return suiviVide();
		const ids = new Set(EPREUVES.map((e) => e.id));
		const vus = new Set<string>();
		const mesures: Mesure[] = [];
		for (const m of o.mesures as Array<Partial<Mesure>>) {
			if (!m || typeof m.id !== 'string' || vus.has(m.id)) continue;
			if (typeof m.epreuve !== 'string' || !ids.has(m.epreuve)) continue;
			if (!dateValide(m.date) || typeof m.valeur !== 'number' || !Number.isFinite(m.valeur)) continue;
			vus.add(m.id);
			mesures.push({ id: m.id, epreuve: m.epreuve, date: m.date, valeur: m.valeur,
				...(typeof m.note === 'string' && m.note ? { note: m.note.slice(0, 200) } : {}) });
		}
		return { mesures };
	} catch {
		return suiviVide();
	}
}

let compteur = 0;
const nouvelId = () => `${Date.now().toString(36)}-${(compteur++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function ajouterMesure(s: Suivi, epreuve: string, date: string, valeur: number, note?: string): Suivi {
	if (!EPREUVES.some((e) => e.id === epreuve) || !dateValide(date) || !Number.isFinite(valeur)) return s;
	return { mesures: [...s.mesures, { id: nouvelId(), epreuve, date, valeur, ...(note ? { note: note.slice(0, 200) } : {}) }] };
}

export function supprimerMesure(s: Suivi, id: string): Suivi {
	return { mesures: s.mesures.filter((m) => m.id !== id) };
}

/** Série d'une épreuve, par date croissante (à date égale : ordre de saisie). */
export function serie(s: Suivi, epreuve: string): Mesure[] {
	return s.mesures.filter((m) => m.epreuve === epreuve).sort((a, b) => a.date.localeCompare(b.date));
}

export interface Resume {
	n: number;
	premiere: Mesure;
	derniere: Mesure;
	meilleure: Mesure;
	ecart: number;
	/** « mieux » / « moins bien » selon le sens de l'épreuve ; « stable » si écart nul. Pas de seuil de signification. */
	evolution: 'mieux' | 'moins bien' | 'stable';
}

export function resume(mesures: Mesure[], sens: 'plus' | 'moins'): Resume | null {
	if (mesures.length === 0) return null;
	const premiere = mesures[0];
	const derniere = mesures[mesures.length - 1];
	const meilleure = mesures.reduce((b, m) => ((sens === 'plus' ? m.valeur > b.valeur : m.valeur < b.valeur) ? m : b));
	const ecart = Math.round((derniere.valeur - premiere.valeur) * 100) / 100;
	const evolution = ecart === 0 ? 'stable' : (ecart > 0) === (sens === 'plus') ? 'mieux' : 'moins bien';
	return { n: mesures.length, premiere, derniere, meilleure, ecart, evolution };
}

/** Lecture d'un tableau collé « date ; valeur » (séparateurs ; tabulation, virgule ou espace ; JJ/MM/AAAA accepté). */
export function lireTableau(texte: string): { lignes: Array<{ date: string; valeur: number }>; rejetees: string[] } {
	const lignes: Array<{ date: string; valeur: number }> = [];
	const rejetees: string[] = [];
	for (const brute of texte.split(/\r?\n/)) {
		const l = brute.trim();
		if (!l) continue;
		const m = /^(\S+?)\s*[;\t,\s]\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(l);
		let date = m?.[1] ?? '';
		const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
		if (fr) date = `${fr[3]}-${fr[2]}-${fr[1]}`;
		const valeur = m ? Number(m[2].replace(',', '.')) : NaN;
		if (m && dateValide(date) && Number.isFinite(valeur)) lignes.push({ date, valeur });
		else rejetees.push(l);
	}
	return { lignes, rejetees };
}
