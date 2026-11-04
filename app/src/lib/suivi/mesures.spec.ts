import { describe, expect, it } from 'vitest';
import { ajouterMesure, dateValide, lireSuivi, lireTableau, resume, serie, supprimerMesure, suiviVide } from './mesures.js';
import { tracer } from './courbe.js';

describe('suivi de forme', () => {
	it('trie la série par date et résume selon le sens de l’épreuve', () => {
		let s = suiviVide();
		s = ajouterMesure(s, 'lever-chaise', '2026-03-01', 9);
		s = ajouterMesure(s, 'lever-chaise', '2026-01-01', 12);
		const r = resume(serie(s, 'lever-chaise'), 'moins')!;
		expect(r.premiere.valeur).toBe(12);
		expect(r.ecart).toBe(-3);
		expect(r.evolution).toBe('mieux'); // chrono plus court
		expect(r.meilleure.valeur).toBe(9);
	});
	it('rejette épreuve inconnue, date impossible et valeur non finie', () => {
		let s = suiviVide();
		s = ajouterMesure(s, 'inconnue', '2026-01-01', 1);
		s = ajouterMesure(s, 'pompes', '2026-02-30', 1);
		s = ajouterMesure(s, 'pompes', '2026-01-01', NaN);
		expect(s.mesures).toHaveLength(0);
		expect(dateValide('2026-02-29')).toBe(false);
	});
	it('supprime et relit le stockage en ignorant l’invalide', () => {
		let s = ajouterMesure(suiviVide(), 'pompes', '2026-01-01', 10);
		const id = s.mesures[0].id;
		const relu = lireSuivi(JSON.stringify({ mesures: [...s.mesures, { id: 'x', epreuve: 'zzz', date: '2026-01-01', valeur: 1 }, s.mesures[0]] }));
		expect(relu.mesures).toHaveLength(1);
		expect(supprimerMesure(s, id).mesures).toHaveLength(0);
		expect(lireSuivi('pas du json').mesures).toHaveLength(0);
	});
	it('lit un tableau collé (virgule décimale, JJ/MM/AAAA, lignes rejetées)', () => {
		const { lignes, rejetees } = lireTableau('2026-01-05;31,5\n12/02/2026\t33\n2026-03-01 34.2\nbla\n2026-13-01;3');
		expect(lignes).toEqual([
			{ date: '2026-01-05', valeur: 31.5 },
			{ date: '2026-02-12', valeur: 33 },
			{ date: '2026-03-01', valeur: 34.2 },
		]);
		expect(rejetees).toEqual(['bla', '2026-13-01;3']);
	});
	it('trace l’axe horizontal selon le temps réel', () => {
		const t = tracer([{ date: '2026-01-01', valeur: 1 }, { date: '2026-01-02', valeur: 2 }, { date: '2026-01-11', valeur: 3 }], 320, 180)!;
		const [a, b, c] = t.points;
		expect(b.x - a.x).toBeCloseTo((c.x - a.x) / 10, 5);
		expect(c.y).toBeLessThan(a.y); // valeur haute = haut de l’écran
		expect(tracer([], 320, 180)).toBeNull();
		expect(tracer([{ date: '2026-01-01', valeur: 5 }], 320, 180)!.points).toHaveLength(1);
	});
});
