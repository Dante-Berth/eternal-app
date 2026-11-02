import { describe, expect, it } from 'vitest';
import { chercher, normaliser } from './recherche.js';
import type { EntreeRecherche, FicheMeta } from './types.js';

const meta = (id: string, titre: string, o: Partial<FicheMeta> = {}): FicheMeta => ({
	id, titre, type: 'actif', famille: '', cibles: ['peau'], preuve_globale: 'B', statut_fr: '',
	derniere_maj: '', sources_verifiees: '', resume: '', marqueurs: [], nb_pmid: 0, ...o,
});
const entree = (id: string, titre: string, o: Partial<EntreeRecherche> = {}): EntreeRecherche => ({
	id, titre: normaliser(titre), resume: '', sections: '', corps: '', ...o,
});

const metas = new Map([
	['a', meta('a', 'Vitamine D', { type: 'actif', preuve_globale: 'A', cibles: ['muscle-os'] })],
	['b', meta('b', 'Biomarqueur : vitamine D (25-OH-D)', { type: 'biomarqueur', preuve_globale: 'B' })],
	['c', meta('c', 'Ginseng', { preuve_globale: '?' })],
]);
const index = [
	entree('a', 'Vitamine D'),
	entree('b', 'Biomarqueur : vitamine D (25-OH-D)'),
	entree('c', 'Ginseng', { resume: normaliser('Effet sur la vitamine C et la fatigue') }),
];

describe('normaliser', () => {
	it('retire accents, casse et ponctuation', () => {
		expect(normaliser('Œstradiol, HbA1c (%)')).toBe('oestradiol hba1c');
		expect(normaliser('Ferritine — carence')).toBe('ferritine carence');
		expect(normaliser('Éléments')).toBe('elements');
	});
});

describe('chercher', () => {
	it('trouve sans tenir compte des accents ni de la casse', () => {
		expect(chercher('VITAMINE d', index, metas).map((m) => m.id)).toEqual(['a', 'b']);
	});
	it('exige tous les mots', () => {
		expect(chercher('vitamine fatigue', index, metas).map((m) => m.id)).toEqual(['c']);
		expect(chercher('vitamine zinc', index, metas)).toEqual([]);
	});
	it('classe le titre devant le résumé, puis la preuve la plus forte', () => {
		expect(chercher('vitamine', index, metas).map((m) => m.id)).toEqual(['a', 'b', 'c']);
	});
	it('filtre par type, cible et preuve', () => {
		expect(chercher('', index, metas, { type: 'biomarqueur' }).map((m) => m.id)).toEqual(['b']);
		expect(chercher('', index, metas, { cible: 'muscle-os' }).map((m) => m.id)).toEqual(['a']);
		expect(chercher('', index, metas, { preuve: '?' }).map((m) => m.id)).toEqual(['c']);
	});
	it('sans requête : tout, trié par preuve puis titre', () => {
		expect(chercher('', index, metas).map((m) => m.id)).toEqual(['a', 'b', 'c']);
	});
});
