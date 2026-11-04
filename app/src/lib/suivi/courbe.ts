/** Géométrie d'une courbe chronologique : l'axe horizontal suit le temps réel, pas le rang des points. */

export interface Point { date: string; valeur: number }
export interface PointTrace extends Point { x: number; y: number }
export interface Trace {
	points: PointTrace[];
	chemin: string;
	min: number;
	max: number;
	debut: string;
	fin: string;
}

const jour = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86_400_000;

/** Ordonnée : bornes arrondies avec une marge, pour que la courbe ne colle pas aux bords. L'axe ne part pas de zéro (on lit l'évolution). */
export function tracer(pts: Point[], largeur: number, hauteur: number, marge = { g: 40, d: 12, h: 12, b: 24 }): Trace | null {
	if (pts.length === 0) return null;
	const tri = [...pts].sort((a, b) => a.date.localeCompare(b.date));
	const vals = tri.map((p) => p.valeur);
	let min = Math.min(...vals);
	let max = Math.max(...vals);
	if (min === max) { min -= 1; max += 1; }
	const pad = (max - min) * 0.1;
	min -= pad; max += pad;
	const t0 = jour(tri[0].date);
	const t1 = jour(tri[tri.length - 1].date);
	const w = largeur - marge.g - marge.d;
	const h = hauteur - marge.h - marge.b;
	const points = tri.map((p) => ({
		...p,
		x: marge.g + (t1 === t0 ? w / 2 : ((jour(p.date) - t0) / (t1 - t0)) * w),
		y: marge.h + (1 - (p.valeur - min) / (max - min)) * h,
	}));
	const chemin = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
	return { points, chemin, min, max, debut: tri[0].date, fin: tri[tri.length - 1].date };
}
