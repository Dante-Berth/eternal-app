import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { statutMesure } from '../src/index.js';
import type { Marqueur, Regles, ResultatStatut } from '../src/index.js';

const lire = <T>(chemin: string): T =>
	JSON.parse(readFileSync(new URL(chemin, import.meta.url), 'utf-8')) as T;

const marqueurs = lire<{ marqueurs: Marqueur[] }>('../../vendor/eternal/donnees/marqueurs.json').marqueurs;
const regles = lire<Regles>('../regles/statut.json');
const vecteurs = lire<{ cas: Array<Record<string, any>> }>('../vecteurs/statut.json').cas;

const UNITE_DE_CLE: Record<string, string> = { valeur_g_par_l: 'g/L', valeur_pct: '%', valeur_nmol_par_l: 'nmol/L' };

describe('vecteurs de statut', () => {
	for (const cas of vecteurs) {
		it(cas.nom, () => {
			const r = statutMesure(
				{ marqueur: cas.marqueur, valeur: cas.valeur, unite: cas.unite, sexe: cas.sexe }, marqueurs, regles,
			);
			const attendu = cas.attendu;
			if (attendu.erreur) {
				expect(r).toMatchObject({ erreur: attendu.erreur });
				return;
			}
			expect(r).not.toHaveProperty('erreur');
			const res = r as ResultatStatut;
			expect(res.statut).toBe(attendu.statut);
			if (attendu.referentiels) expect([...res.referentiels].sort()).toEqual([...attendu.referentiels].sort());
			if (attendu.divergence !== undefined) expect(res.divergence).toBe(attendu.divergence);
			if (attendu.message_contient) expect(res.messages.join(' ')).toContain(attendu.message_contient);
			for (const [cle, unite] of Object.entries(UNITE_DE_CLE)) {
				if (attendu[cle] === undefined) continue;
				expect(res.unite_usuelle).toBe(unite);
				expect(res.valeur_usuelle as number).toBeCloseTo(attendu[cle], 0);
				expect(Math.abs((res.valeur_usuelle as number) - attendu[cle])).toBeLessThan(0.02 * attendu[cle]);
			}
		});
	}
});
