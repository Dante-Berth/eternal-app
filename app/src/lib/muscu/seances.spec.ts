import { describe, expect, it } from 'vitest';
import { ajuster, ajouterSeance, carnetVide, dernieresSeries, e1rm, historique, lireCarnet, nomsExercices, supprimerSeance, volume } from './seances.js';

const squat = (series: Array<[number, number]>) => ({ nom: 'Squat', series: series.map(([reps, charge]) => ({ reps, charge })) });

describe('carnet de musculation', () => {
	it('calcule volume et 1RM estimé (Epley)', () => {
		expect(volume([{ reps: 5, charge: 100 }, { reps: 3, charge: 110 }])).toBe(830);
		expect(e1rm({ reps: 5, charge: 100 })).toBeCloseTo(116.67, 1);
		expect(e1rm({ reps: 1, charge: 140 })).toBe(140);
	});
	it('regroupe un exercice par date, sans tenir compte casse ni accents', () => {
		let c = ajouterSeance(carnetVide(), '2026-02-01', [squat([[5, 100]])]);
		c = ajouterSeance(c, '2026-01-01', [{ nom: ' squat ', series: [{ reps: 5, charge: 90 }, { reps: 5, charge: 95 }] }]);
		const h = historique(c, 'SQUAT');
		expect(h.map((p) => p.date)).toEqual(['2026-01-01', '2026-02-01']);
		expect(h[0].charge_max).toBe(95);
		expect(h[0].volume).toBe(925);
		expect(nomsExercices(c)).toEqual(['Squat']);
		expect(dernieresSeries(c, 'squat')).toEqual([{ reps: 5, charge: 100 }]);
	});
	it('refuse séries invalides, date impossible, séance vide', () => {
		const vide = carnetVide();
		expect(ajouterSeance(vide, '2026-02-30', [squat([[5, 100]])])).toBe(vide);
		expect(ajouterSeance(vide, '2026-02-01', [squat([[0, 100], [2.5, 50], [5, -1]])])).toBe(vide);
		const c = ajouterSeance(vide, '2026-02-01', [squat([[5, 0], [0, 10]])]); // charge 0 = poids du corps, valide
		expect(c.seances[0].exercices[0].series).toHaveLength(1);
	});
	it('relit le stockage en écartant l’invalide, et supprime', () => {
		const c = ajouterSeance(carnetVide(), '2026-02-01', [squat([[5, 100]])], 'Jambes');
		const relu = lireCarnet(JSON.stringify({ seances: [...c.seances, c.seances[0], { id: 'z', date: 'x', exercices: [] }] }));
		expect(relu.seances).toHaveLength(1);
		expect(relu.seances[0].nom).toBe('Jambes');
		expect(supprimerSeance(c, c.seances[0].id).seances).toHaveLength(0);
		expect(lireCarnet(null).seances).toHaveLength(0);
	});
	it('ajuste une saisie sans descendre sous zéro', () => {
		expect(ajuster('100', 2.5)).toBe('102.5');
		expect(ajuster('2,5', -2.5)).toBe('0');
		expect(ajuster('', 1)).toBe('1');
		expect(ajuster('abc', -1)).toBe('0');
		expect(ajuster('0.1', 0.2)).toBe('0.3');
	});
});
