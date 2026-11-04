/** Bilan sur une période : ce qui a été fait et comment ça a évolué. Descriptif : aucun seuil, aucun verdict. */
import { historique, volume, type Carnet } from '../muscu/seances.js';
import { EPREUVES, resume, serie, type Resume, type Suivi } from '../suivi/mesures.js';

export interface LigneExercice {
	nom: string;
	seances: number;
	volume: number;
	e1rm_debut: number;
	e1rm_fin: number;
	/** Écart de 1RM estimé entre la première et la dernière séance de la période ; null avec une seule séance. */
	ecart: number | null;
}
export interface LigneForme { epreuve: string; unite: string; resume: Resume }
export interface Bilan {
	debut: string;
	fin: string;
	seances: number;
	jours_actifs: number;
	volume_total: number;
	exercices: LigneExercice[];
	forme: LigneForme[];
}

/** Date AAAA-MM-JJ décalée de `jours` (négatif = passé), en UTC pour éviter les décalages d'heure d'été. */
export function decaler(date: string, jours: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + jours);
	return d.toISOString().slice(0, 10);
}

export function bilan(carnet: Carnet, suivi: Suivi, debut: string, fin: string): Bilan {
	const dans = (d: string) => d >= debut && d <= fin;
	const seances = carnet.seances.filter((s) => dans(s.date));
	const noms = new Map<string, string>();
	for (const s of seances) for (const e of s.exercices) {
		const k = e.nom.trim().toLocaleLowerCase('fr');
		if (!noms.has(k)) noms.set(k, e.nom);
	}
	const exercices: LigneExercice[] = [...noms.values()].map((nom) => {
		const h = historique({ seances }, nom);
		const ecart = h.length > 1 ? Math.round((h[h.length - 1].e1rm - h[0].e1rm) * 10) / 10 : null;
		return { nom, seances: h.length, volume: Math.round(h.reduce((t, p) => t + p.volume, 0)),
			e1rm_debut: h[0].e1rm, e1rm_fin: h[h.length - 1].e1rm, ecart };
	}).sort((a, b) => b.seances - a.seances || a.nom.localeCompare(b.nom, 'fr'));
	const forme: LigneForme[] = [];
	for (const e of EPREUVES) {
		const r = resume(serie(suivi, e.id).filter((m) => dans(m.date)), e.sens);
		if (r) forme.push({ epreuve: e.nom, unite: e.unite, resume: r });
	}
	return {
		debut, fin, seances: seances.length,
		jours_actifs: new Set(seances.map((s) => s.date)).size,
		volume_total: Math.round(seances.reduce((t, s) => t + s.exercices.reduce((u, e) => u + volume(e.series), 0), 0)),
		exercices, forme,
	};
}
