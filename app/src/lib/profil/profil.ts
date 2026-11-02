import type { Declaration } from '#moteur';

export type Niveau = 'jamais' | 'occasionnel' | 'regulier' | 'quotidien';
export const NIVEAUX: Niveau[] = ['jamais', 'occasionnel', 'regulier', 'quotidien'];

export interface Traitement {
	id: string;
	fiche?: string;
	substance?: string;
	debut?: string;
	fin?: string | null;
}

/** Ce que la personne déclare, au format `profil.habitudes` / `traitements` de docs/format-donnees.md. */
export interface Profil {
	habitudes: Array<{ habitude: string; niveau: Niveau }>;
	traitements: Traitement[];
}

export const profilVide = (): Profil => ({ habitudes: [], traitements: [] });

/** Relit un profil stocké ; tout ce qui n'est pas reconnu est écarté plutôt que cru. */
export function lireProfil(brut: string | null): Profil {
	if (!brut) return profilVide();
	try {
		const o = JSON.parse(brut) as Partial<Profil>;
		const habitudes = (Array.isArray(o.habitudes) ? o.habitudes : [])
			.filter((h) => typeof h?.habitude === 'string' && NIVEAUX.includes(h.niveau));
		const traitements = (Array.isArray(o.traitements) ? o.traitements : [])
			.filter((t) => typeof t?.id === 'string' && (typeof t.fiche === 'string') !== (typeof t.substance === 'string'));
		return { habitudes, traitements };
	} catch {
		return profilVide();
	}
}

export function definirHabitude(p: Profil, habitude: string, niveau: Niveau | null): Profil {
	const reste = p.habitudes.filter((h) => h.habitude !== habitude);
	return { ...p, habitudes: niveau ? [...reste, { habitude, niveau }] : reste };
}

export function ajouterTraitement(p: Profil, cible: { fiche: string } | { substance: string }, debut: string): Profil {
	const deja = p.traitements.some((t) => !t.fin && ('fiche' in cible ? t.fiche === cible.fiche : t.substance === cible.substance));
	if (deja) return p;
	const id = `t-${Date.now().toString(36)}-${p.traitements.length}`;
	return { ...p, traitements: [...p.traitements, { id, ...cible, debut, fin: null }] };
}

export function terminerTraitement(p: Profil, id: string, fin: string): Profil {
	return { ...p, traitements: p.traitements.map((t) => (t.id === id ? { ...t, fin } : t)) };
}

export const supprimerTraitement = (p: Profil, id: string): Profil =>
	({ ...p, traitements: p.traitements.filter((t) => t.id !== id) });

export const enDeclaration = (p: Profil): Declaration => p;
