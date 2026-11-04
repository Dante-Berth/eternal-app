/** Carnet de musculation local : séances → exercices → séries. Aucun conseil de charge ni de volume ici. */
import { dateValide } from '../suivi/mesures.js';

export interface Serie { reps: number; charge: number; rpe?: number }
export interface Exercice { nom: string; series: Serie[] }
export interface Seance { id: string; date: string; nom?: string; exercices: Exercice[] }
export interface Carnet { seances: Seance[] }

export const carnetVide = (): Carnet => ({ seances: [] });

const serieValide = (s: unknown): s is Serie => {
	const x = s as Serie;
	return !!x && Number.isInteger(x.reps) && x.reps > 0 && x.reps <= 1000
		&& Number.isFinite(x.charge) && x.charge >= 0 && x.charge <= 2000
		&& (x.rpe === undefined || (Number.isFinite(x.rpe) && x.rpe >= 1 && x.rpe <= 10));
};
const nettoyerSerie = (s: Serie): Serie => ({ reps: s.reps, charge: s.charge, ...(s.rpe !== undefined ? { rpe: s.rpe } : {}) });

/** Nettoie les exercices : nom non vide, séries valides ; les exercices sans série sont retirés. */
function nettoyer(exos: unknown): Exercice[] {
	if (!Array.isArray(exos)) return [];
	const out: Exercice[] = [];
	for (const e of exos as Array<Partial<Exercice>>) {
		const nom = typeof e?.nom === 'string' ? e.nom.trim().slice(0, 80) : '';
		const series = Array.isArray(e?.series) ? e.series.filter(serieValide).map(nettoyerSerie) : [];
		if (nom && series.length) out.push({ nom, series });
	}
	return out;
}

export function lireCarnet(brut: string | null): Carnet {
	if (!brut) return carnetVide();
	try {
		const o = JSON.parse(brut) as { seances?: unknown };
		if (!o || !Array.isArray(o.seances)) return carnetVide();
		const vus = new Set<string>();
		const seances: Seance[] = [];
		for (const s of o.seances as Array<Partial<Seance>>) {
			if (!s || typeof s.id !== 'string' || vus.has(s.id) || !dateValide(s.date)) continue;
			const exercices = nettoyer(s.exercices);
			if (!exercices.length) continue;
			vus.add(s.id);
			seances.push({ id: s.id, date: s.date, ...(typeof s.nom === 'string' && s.nom ? { nom: s.nom.slice(0, 80) } : {}), exercices });
		}
		return { seances };
	} catch {
		return carnetVide();
	}
}

let n = 0;
const nouvelId = () => `${Date.now().toString(36)}-${(n++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Ajoute une séance ; refuse (renvoie le carnet inchangé) si la date est invalide ou s'il ne reste aucune série valide. */
export function ajouterSeance(c: Carnet, date: string, exercices: Exercice[], nom?: string): Carnet {
	const exos = nettoyer(exercices);
	if (!dateValide(date) || !exos.length) return c;
	const titre = nom?.trim();
	return { seances: [...c.seances, { id: nouvelId(), date, ...(titre ? { nom: titre.slice(0, 80) } : {}), exercices: exos }] };
}

export const supprimerSeance = (c: Carnet, id: string): Carnet => ({ seances: c.seances.filter((s) => s.id !== id) });

export const seancesRecentes = (c: Carnet): Seance[] => [...c.seances].sort((a, b) => b.date.localeCompare(a.date));

const cle = (nom: string) => nom.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu, '');

/** Noms déjà utilisés (première graphie rencontrée), pour la saisie. */
export function nomsExercices(c: Carnet): string[] {
	const vus = new Map<string, string>();
	for (const s of seancesRecentes(c)) for (const e of s.exercices) if (!vus.has(cle(e.nom))) vus.set(cle(e.nom), e.nom);
	return [...vus.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Volume d'une série = répétitions × charge (kg). Pour du poids du corps (charge 0) le volume vaut 0 : suivre les répétitions. */
export const volume = (ss: Serie[]) => ss.reduce((t, s) => t + s.reps * s.charge, 0);

/** Estimation de 1RM par la formule d'Epley (charge × (1 + reps/30)). C'est une estimation, d'autant moins fiable que les répétitions sont nombreuses. */
export const e1rm = (s: Serie) => (s.reps === 1 ? s.charge : s.charge * (1 + s.reps / 30));

export interface PointExercice { date: string; charge_max: number; e1rm: number; volume: number; reps_max: number }

/** Une valeur par date pour un exercice (séries de la même date regroupées), par date croissante. */
export function historique(c: Carnet, nom: string): PointExercice[] {
	const par = new Map<string, Serie[]>();
	for (const s of c.seances) for (const e of s.exercices) if (cle(e.nom) === cle(nom)) par.set(s.date, [...(par.get(s.date) ?? []), ...e.series]);
	return [...par.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, ss]) => ({
		date,
		charge_max: Math.max(...ss.map((s) => s.charge)),
		e1rm: Math.round(Math.max(...ss.map(e1rm)) * 10) / 10,
		volume: Math.round(volume(ss) * 10) / 10,
		reps_max: Math.max(...ss.map((s) => s.reps)),
	}));
}

/** Séries de la dernière séance où l'exercice apparaît (pour préremplir). */
export function dernieresSeries(c: Carnet, nom: string): Serie[] {
	for (const s of seancesRecentes(c)) {
		const e = s.exercices.find((x) => cle(x.nom) === cle(nom));
		if (e) return e.series;
	}
	return [];
}

/** Ajoute `pas` à une valeur saisie (virgule ou point), sans descendre sous 0 ; champ vide = 0. */
export function ajuster(saisie: string, pas: number): string {
	const v = Number(saisie.trim().replace(',', '.'));
	const base = Number.isFinite(v) ? v : 0;
	return String(Math.max(0, Math.round((base + pas) * 100) / 100));
}
