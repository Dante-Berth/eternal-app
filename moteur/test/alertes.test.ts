import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { alertesInteractions } from '../src/index.js';
import type { Declaration, DonneesInteractions } from '../src/index.js';

const lire = <T>(chemin: string): T =>
	JSON.parse(readFileSync(new URL(chemin, import.meta.url), 'utf-8')) as T;

const vecteurs = lire<{ donnees: DonneesInteractions; cas: Array<Record<string, any>> }>('../vecteurs/alertes.json');

describe('vecteurs d\'alertes', () => {
	for (const cas of vecteurs.cas) {
		it(cas.nom, () => {
			const r = alertesInteractions(cas.declaration as Declaration, vecteurs.donnees, cas.aujourdhui);
			for (const cat of ['alerte', 'prudence', 'aucune_donnee']) {
				expect(r.alertes.filter((a) => a.categorie === cat).map((a) => a.id)).toEqual(cas.attendu[cat]);
			}
			expect(r.a_renseigner).toEqual(cas.attendu.a_renseigner);
			const ordre = r.alertes.map((a) => ['alerte', 'prudence', 'aucune_donnee'].indexOf(a.categorie));
			expect(ordre).toEqual([...ordre].sort((x, y) => x - y));
		});
	}
});

describe('bibliothèque réelle', () => {
	const reel = lire<DonneesInteractions>('../../vendor/eternal/donnees/interactions.json');
	it('AVK + vitamine K quotidienne : alerte documentée, gravité et conduite non inventées', () => {
		const r = alertesInteractions(
			{ habitudes: [{ habitude: 'vitamine-k-alimentaire', niveau: 'quotidien' }], traitements: [{ substance: 'antivitamine-k' }] },
			reel, '2026-11-02',
		);
		const a = r.alertes.find((x) => x.categorie === 'alerte' && x.a.habitude === 'vitamine-k-alimentaire');
		expect(a).toBeDefined();
		expect(a!.gravite).toBe('inconnue');
		expect(a!.conduite).toBeNull();
		expect(a!.sources.length).toBeGreaterThan(0);
	});
	it('AVK déclaré seul : les habitudes visées sont à renseigner', () => {
		const r = alertesInteractions({ traitements: [{ substance: 'antivitamine-k' }] }, reel, '2026-11-02');
		expect(r.alertes).toEqual([]);
		expect(r.a_renseigner.map((x) => x.habitude)).toContain('vitamine-k-alimentaire');
	});
});
