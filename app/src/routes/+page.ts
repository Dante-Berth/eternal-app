import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

// Seul le Savoir existe pour l'instant.
export function load() {
	redirect(307, resolve('/savoir'));
}
