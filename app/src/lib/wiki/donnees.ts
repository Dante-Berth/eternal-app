import { asset } from '$app/paths';
import type { EntreeRecherche, Fiche, FicheMeta } from './types.js';

type Fetch = typeof fetch;

async function json<T>(fetch: Fetch, chemin: string): Promise<T> {
	const r = await fetch(asset(chemin as Parameters<typeof asset>[0]));
	if (!r.ok) throw new Error(`${chemin} : HTTP ${r.status}`);
	return (await r.json()) as T;
}

export async function chargerIndex(fetch: Fetch) {
	const [index, recherche] = await Promise.all([
		json<{ fiches: FicheMeta[]; vocabulaire: { cibles?: Record<string, string> } }>(fetch, '/data/index.json'),
		json<{ fiches: EntreeRecherche[] }>(fetch, '/data/recherche.json'),
	]);
	return { metas: index.fiches, cibles: index.vocabulaire.cibles ?? {}, recherche: recherche.fiches };
}

export function chargerFiche(fetch: Fetch, id: string): Promise<Fiche> {
	return json<Fiche>(fetch, `/data/fiches/${id}.json`);
}
