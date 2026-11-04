import { describe, expect, it } from 'vitest';
import { bilan, decaler } from './bilan.js';
import { csvForme, csvMuscu, champ } from './csv.js';
import { ajouterSeance, carnetVide } from '../muscu/seances.js';
import { ajouterMesure, suiviVide } from '../suivi/mesures.js';

const sq = (reps: number, charge: number) => [{ nom: 'Squat', series: [{ reps, charge }] }];
let c = carnetVide();
c = ajouterSeance(c, '2026-01-01', sq(5, 80)); // hors période
c = ajouterSeance(c, '2026-03-01', sq(5, 90), 'Jambes');
c = ajouterSeance(c, '2026-03-15', sq(5, 100));
let s = suiviVide();
s = ajouterMesure(s, 'prehension', '2026-02-01', 30);
s = ajouterMesure(s, 'prehension', '2026-03-10', 32);
s = ajouterMesure(s, 'prehension', '2026-04-10', 40); // hors période

describe('bilan', () => {
	it('résume la période et ignore ce qui est hors période', () => {
		const b = bilan(c, s, '2026-02-01', '2026-03-31');
		expect(b.seances).toBe(2);
		expect(b.volume_total).toBe(950);
		expect(b.exercices[0]).toMatchObject({ nom: 'Squat', seances: 2, volume: 950, ecart: 11.7 });
		expect(b.forme).toHaveLength(1);
		expect(b.forme[0].resume).toMatchObject({ n: 2, ecart: 2, evolution: 'mieux' });
	});
	it('n’invente pas d’écart avec une seule séance', () => {
		expect(bilan(c, s, '2026-03-10', '2026-03-31').exercices[0].ecart).toBeNull();
		expect(bilan(carnetVide(), suiviVide(), '2026-01-01', '2026-02-01').exercices).toEqual([]);
	});
	it('décale les dates', () => {
		expect(decaler('2026-03-01', -30)).toBe('2026-01-30');
		expect(decaler('2026-12-31', 1)).toBe('2027-01-01');
	});
});

describe('csv', () => {
	it('écrit une ligne par série, ordre chronologique, avec en-tête et BOM', () => {
		const l = csvMuscu(c).replace('﻿', '').trim().split('\n');
		expect(l[0]).toBe('date;seance;exercice;serie;repetitions;charge_kg;rpe;e1rm_estime_kg');
		expect(l[1].startsWith('2026-01-01;;Squat;1;5;80;;')).toBe(true);
		expect(l).toHaveLength(4);
		expect(csvMuscu(c).startsWith('﻿')).toBe(true);
	});
	it('exporte la forme avec famille et unité', () => {
		expect(csvForme(s)).toContain('2026-02-01;Force;Force de préhension;30;kg');
	});
	it('échappe les champs et neutralise les formules', () => {
		expect(champ('a;b')).toBe('"a;b"');
		expect(champ('dit "x"')).toBe('"dit ""x"""');
		expect(champ('=SOMME(A1)')).toBe("'=SOMME(A1)");
		expect(champ(-5)).toBe('-5'); // un nombre négatif reste un nombre
	});
});
