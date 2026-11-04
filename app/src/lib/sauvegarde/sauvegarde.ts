/** Sauvegarde locale : un fichier JSON avec profil, mesures de forme et carnet de musculation. Rien n'est envoyé. */
import { lireProfil, type Profil } from '../profil/profil.js';
import { lireSuivi, type Suivi } from '../suivi/mesures.js';
import { lireCarnet, type Carnet } from '../muscu/seances.js';

export const FORMAT = 'eternal-sauvegarde';

export interface Sauvegarde { profil: Profil; suivi: Suivi; carnet: Carnet }

export function exporter(s: Sauvegarde, maintenant = new Date()): string {
	return JSON.stringify({ format: FORMAT, version: 1, date: maintenant.toISOString(), ...s }, null, 2);
}

export type ResultatImport =
	| { ok: true; sauvegarde: Sauvegarde; resume: { traitements: number; habitudes: number; mesures: number; seances: number } }
	| { ok: false; erreur: string };

/** Relit une sauvegarde en revalidant chaque partie (les entrées invalides sont écartées). Une partie absente reste vide. */
export function importer(texte: string): ResultatImport {
	let o: Record<string, unknown>;
	try {
		o = JSON.parse(texte) as Record<string, unknown>;
	} catch {
		return { ok: false, erreur: 'Ce fichier n’est pas du JSON.' };
	}
	if (!o || typeof o !== 'object' || o.format !== FORMAT) return { ok: false, erreur: 'Ce fichier n’est pas une sauvegarde Eternal.' };
	if (o.version !== 1) return { ok: false, erreur: `Version de sauvegarde non prise en charge : ${String(o.version)}.` };
	const part = (k: string) => (o[k] === undefined ? null : JSON.stringify(o[k]));
	const profil = lireProfil(part('profil'));
	const suivi = lireSuivi(part('suivi'));
	const carnet = lireCarnet(part('carnet'));
	return {
		ok: true,
		sauvegarde: { profil, suivi, carnet },
		resume: { traitements: profil.traitements.length, habitudes: profil.habitudes.length, mesures: suivi.mesures.length, seances: carnet.seances.length },
	};
}
