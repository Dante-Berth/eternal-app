import { chargerIndex } from '#lib/wiki/donnees.js';

export async function load({ fetch }) {
	return chargerIndex(fetch);
}
