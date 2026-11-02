import { describe, expect, it } from 'vitest';
import { pastilles, rendre } from './markdown.js';

const lien = (id: string) => `/savoir/${id}`;

describe('rendre', () => {
	it('réécrit les liens de fiche et laisse les liens externes sûrs', () => {
		const h = rendre('[HbA1c](fiche:biomarqueur-hba1c) et [ADA](https://example.org/x)', lien);
		expect(h).toContain('href="/savoir/biomarqueur-hba1c"');
		expect(h).toContain('rel="noopener noreferrer"');
	});
	it('échappe le HTML brut', () => {
		const h = rendre('<script>alert(1)</script>\n\ntexte <img src=x onerror=alert(1)>', lien);
		expect(h).not.toContain('<script>');
		expect(h).not.toContain('<img');
	});
	it('ne crée aucun lien pour un schéma dangereux', () => {
		const h = rendre('[x](javascript:alert(1))', lien);
		expect(h).not.toContain('href=');
	});
	it('transforme les tags de preuve en pastilles, avec le qualificatif', () => {
		const h = rendre('Effet net [A, méta-analyse] mais [?] ailleurs.', lien);
		expect(h).toContain('ev-A');
		expect(h).toContain('ev-Q');
		expect(h).toContain('méta-analyse');
	});
	it('ne touche pas aux crochets dans les attributs', () => {
		expect(pastilles('<a title="[A]">[B]</a>')).toContain('title="[A]"');
	});
	it('rend un tableau', () => {
		expect(rendre('| a | b |\n|---|---|\n| 1 | 2 |', lien)).toContain('<table>');
	});
});
