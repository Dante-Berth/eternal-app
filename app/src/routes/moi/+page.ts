import { asset } from '$app/paths';
import { chargerIndex } from '#lib/wiki/donnees.js';
import type { DonneesInteractions } from '#moteur';

type Habitudes = { habitudes: Array<{ id: string; nom: string; fiche: string | null }> };

export async function load({ fetch }) {
	const lire = async <T>(chemin: string) => (await (await fetch(asset(chemin as Parameters<typeof asset>[0]))).json()) as T;
	const [idx, interactions, habitudes] = await Promise.all([
		chargerIndex(fetch),
		lire<DonneesInteractions & { substances: Record<string, { nom: string; type?: string }> }>('/data/interactions.json'),
		lire<Habitudes>('/data/habitudes.json'),
	]);
	return { metas: idx.metas, recherche: idx.recherche, interactions, habitudes: habitudes.habitudes };
}
