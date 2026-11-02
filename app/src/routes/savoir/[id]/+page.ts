import { chargerFiche } from '#lib/wiki/donnees.js';

export async function load({ fetch, params }) {
	return { fiche: await chargerFiche(fetch, params.id) };
}

// Une page prérendue par fiche : les identifiants viennent des données compilées (npm run donnees).
export async function entries() {
	const { readFile } = await import('node:fs/promises');
	const index = JSON.parse(await readFile('static/data/index.json', 'utf-8')) as { fiches: { id: string }[] };
	return index.fiches.map(({ id }) => ({ id }));
}
