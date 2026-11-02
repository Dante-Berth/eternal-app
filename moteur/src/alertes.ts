import type {
	Alerte, CategorieAlerte, Declaration, DonneesInteractions, Cote, Interaction, ResultatAlertes,
} from './types.js';

const CATEGORIE: Record<Interaction['statut'], CategorieAlerte> = {
	documente: 'alerte',
	plausible: 'prudence',
	non_demontre: 'aucune_donnee',
	aucune_donnee: 'aucune_donnee',
};
const ORDRE: Record<CategorieAlerte, number> = { alerte: 0, prudence: 1, aucune_donnee: 2 };

/** Une substance couvre une autre si elle l'inclut, directement ou par ses classes incluses. */
function couvre(data: DonneesInteractions, classe: string, declaree: string, vus = new Set<string>()): boolean {
	if (classe === declaree) return true;
	if (vus.has(classe)) return false;
	vus.add(classe);
	return (data.substances[classe]?.inclut ?? []).some((c) => couvre(data, c, declaree, vus));
}

function traitementActif(t: { debut?: string; fin?: string | null }, aujourdhui: string): boolean {
	return (!t.debut || t.debut <= aujourdhui) && (!t.fin || t.fin > aujourdhui);
}

function coteActif(c: Cote, data: DonneesInteractions, d: Declaration, aujourdhui: string): boolean {
	const actifs = (d.traitements ?? []).filter((t) => traitementActif(t, aujourdhui));
	if (c.fiche) return actifs.some((t) => t.fiche === c.fiche);
	if (c.substance) {
		return actifs.some((t) => t.substance !== undefined && couvre(data, c.substance!, t.substance));
	}
	if (c.habitude) {
		const h = d.habitudes?.find((x) => x.habitude === c.habitude);
		return h !== undefined && h.niveau !== 'jamais';
	}
	return false;
}

/** Habitude visée par un côté mais absente de la déclaration (≠ déclarée « jamais »). */
function habitudeNonRenseignee(c: Cote, d: Declaration): string | null {
	if (!c.habitude) return null;
	return d.habitudes?.some((x) => x.habitude === c.habitude) ? null : c.habitude;
}

/**
 * Alertes d'interaction pour ce que la personne a déclaré. Fonction pure.
 * Une interaction n'est évaluée que si ses deux côtés sont actifs ; « aucune donnée » n'est jamais
 * rendu comme « pas d'interaction ». Gravité et conduite sont recopiées telles quelles de la source.
 */
export function alertesInteractions(
	declaration: Declaration, data: DonneesInteractions, aujourdhui: string,
): ResultatAlertes {
	const alertes: Alerte[] = [];
	const aRenseigner = new Map<string, Set<string>>();
	for (const it of data.interactions) {
		const aActif = coteActif(it.a, data, declaration, aujourdhui);
		const bActif = coteActif(it.b, data, declaration, aujourdhui);
		if (aActif && bActif) {
			alertes.push({
				id: it.id, categorie: CATEGORIE[it.statut], statut: it.statut, a: it.a, b: it.b,
				effet: it.effet, gravite: it.gravite, conduite: it.conduite, preuve: it.preuve, sources: it.sources,
			});
			continue;
		}
		for (const [actif, autre] of [[aActif, it.b], [bActif, it.a]] as const) {
			const h = actif ? habitudeNonRenseignee(autre, declaration) : null;
			if (h) (aRenseigner.get(h) ?? aRenseigner.set(h, new Set()).get(h)!).add(it.id);
		}
	}
	alertes.sort((x, y) => ORDRE[x.categorie] - ORDRE[y.categorie] || x.id.localeCompare(y.id));
	return {
		alertes,
		a_renseigner: [...aRenseigner].map(([habitude, ids]) => ({ habitude, interactions: [...ids].sort() }))
			.sort((x, y) => x.habitude.localeCompare(y.habitude)),
	};
}
