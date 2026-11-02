import { describe, expect, it } from 'vitest';
import { ajouterTraitement, definirHabitude, lireProfil, profilVide, supprimerTraitement, terminerTraitement } from './profil.js';

describe('profil', () => {
	it('un stockage absent, illisible ou étranger donne un profil vide', () => {
		expect(lireProfil(null)).toEqual(profilVide());
		expect(lireProfil('{pas du json')).toEqual(profilVide());
		expect(lireProfil('[1,2]')).toEqual(profilVide());
	});
	it('écarte les entrées invalides', () => {
		const p = lireProfil(JSON.stringify({
			habitudes: [{ habitude: 'alcool', niveau: 'beaucoup' }, { habitude: 'cafe', niveau: 'regulier' }],
			traitements: [{ id: 'a', fiche: 'x', substance: 'y' }, { id: 'b' }, { id: 'c', substance: 'avk' }],
		}));
		expect(p.habitudes).toEqual([{ habitude: 'cafe', niveau: 'regulier' }]);
		expect(p.traitements.map((t) => t.id)).toEqual(['c']);
	});
	it('définir une habitude remplace, null la retire (= non renseignée)', () => {
		let p = definirHabitude(profilVide(), 'alcool', 'regulier');
		p = definirHabitude(p, 'alcool', 'jamais');
		expect(p.habitudes).toEqual([{ habitude: 'alcool', niveau: 'jamais' }]);
		expect(definirHabitude(p, 'alcool', null).habitudes).toEqual([]);
	});
	it('traitement : pas de doublon actif, fin puis suppression', () => {
		let p = ajouterTraitement(profilVide(), { substance: 'avk' }, '2026-01-01');
		expect(ajouterTraitement(p, { substance: 'avk' }, '2026-02-01').traitements).toHaveLength(1);
		const id = p.traitements[0]!.id;
		p = terminerTraitement(p, id, '2026-03-01');
		expect(p.traitements[0]!.fin).toBe('2026-03-01');
		expect(ajouterTraitement(p, { substance: 'avk' }, '2026-04-01').traitements).toHaveLength(2);
		expect(supprimerTraitement(p, id).traitements).toEqual([]);
	});
});
