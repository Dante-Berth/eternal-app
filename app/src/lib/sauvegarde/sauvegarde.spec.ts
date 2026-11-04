import { describe, expect, it } from 'vitest';
import { exporter, importer } from './sauvegarde.js';
import { profilVide } from '../profil/profil.js';
import { ajouterMesure, suiviVide } from '../suivi/mesures.js';
import { ajouterSeance, carnetVide } from '../muscu/seances.js';

describe('sauvegarde', () => {
	const s = {
		profil: { ...profilVide(), habitudes: [{ habitude: 'cafe', niveau: 'quotidien' as const }] },
		suivi: ajouterMesure(suiviVide(), 'pompes', '2026-01-01', 20),
		carnet: ajouterSeance(carnetVide(), '2026-01-02', [{ nom: 'Squat', series: [{ reps: 5, charge: 100 }] }]),
	};
	it('fait un aller-retour sans perte', () => {
		const r = importer(exporter(s));
		expect(r.ok && r.sauvegarde).toEqual(s);
		expect(r.ok && r.resume).toEqual({ traitements: 0, habitudes: 1, mesures: 1, seances: 1 });
	});
	it('refuse un fichier étranger ou illisible, tolère une partie absente', () => {
		expect(importer('pas du json').ok).toBe(false);
		expect(importer('{"format":"autre"}').ok).toBe(false);
		expect(importer('{"format":"eternal-sauvegarde","version":2}').ok).toBe(false);
		const r = importer('{"format":"eternal-sauvegarde","version":1}');
		expect(r.ok && r.resume).toEqual({ traitements: 0, habitudes: 0, mesures: 0, seances: 0 });
	});
	it('écarte les entrées invalides d’une sauvegarde modifiée à la main', () => {
		const j = JSON.parse(exporter(s));
		j.suivi.mesures.push({ id: 'x', epreuve: 'zzz', date: '2026-01-01', valeur: 1 });
		const r = importer(JSON.stringify(j));
		expect(r.ok && r.resume.mesures).toBe(1);
	});
});
