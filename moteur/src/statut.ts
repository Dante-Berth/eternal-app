import type {
	Bande, Condition, ErreurStatut, Marqueur, Mesure, Referentiel, Regles, ResultatStatut, Sexe, Statut,
} from './types.js';

const GRAVITE: Record<Statut, number> = { ok: 0, discute: 1, a_regarder: 2, hors_cible: 3, inconnu: -1 };

function convertir(m: Marqueur, valeur: number, unite: string): number | null {
	if (unite === m.unite) return valeur;
	const cv = m.conversions?.find((c) => c.unite === unite);
	return cv ? valeur * cv.facteur + (cv.decalage ?? 0) : null;
}

function conditionVraie(c: Condition, valeurs: number[]): boolean {
	const v = valeurs[c.i ?? 0];
	if (v === undefined) return false;
	return (c.min === undefined || v >= c.min)
		&& (c.max === undefined || v < c.max)
		&& (c.max_inclus === undefined || v <= c.max_inclus);
}

function bandeApplicable(b: Bande, valeurs: number[], sexe?: Sexe): boolean {
	if (b.sexe && b.sexe !== sexe) return false;
	return !b.si || b.si.some((c) => conditionVraie(c, valeurs));
}

function evaluer(r: Referentiel, valeurs: number[], sexe?: Sexe): Bande | undefined {
	return r.bandes.find((b) => bandeApplicable(b, valeurs, sexe));
}

/** Statut d'une mesure. Fonction pure : les marqueurs et les règles sont fournis par l'appelant. */
export function statutMesure(
	mesure: Mesure, marqueurs: Marqueur[], regles: Regles,
): ResultatStatut | ErreurStatut {
	const m = marqueurs.find((x) => x.id === mesure.marqueur);
	if (!m) return { erreur: 'marqueur_inconnu', detail: mesure.marqueur };
	const paire = m.forme === 'paire';
	const brut = Array.isArray(mesure.valeur) ? mesure.valeur : [mesure.valeur];
	if (brut.length !== (paire ? 2 : 1) || brut.some((v) => !Number.isFinite(v))) {
		return { erreur: 'forme_invalide', detail: `${mesure.marqueur} : ${paire ? 'paire [systolique, diastolique]' : 'un nombre'} attendu` };
	}
	const valeurs: number[] = [];
	for (const v of brut) {
		const c = convertir(m, v, mesure.unite);
		if (c === null) return { erreur: 'unite_inconnue', detail: `${mesure.marqueur} : ${mesure.unite}` };
		valeurs.push(c);
	}
	const regle = regles.marqueurs[m.id];
	const [bas, haut] = regle?.plausible ?? [-Infinity, Infinity];
	if (valeurs.some((v) => v < bas || v > haut)) {
		return { erreur: 'valeur_implausible', detail: `${m.id} : ${valeurs.join('/')} ${m.unite} hors de [${bas}, ${haut}]` };
	}
	const valeur_usuelle = paire ? valeurs : valeurs[0]!;
	const base = { valeur_usuelle, unite_usuelle: m.unite };
	if (!regle?.referentiels?.length) {
		return { ...base, statut: 'inconnu', referentiels: [], divergence: false, messages: regle?.inconnu ? [regle.inconnu] : [], sources: [] };
	}
	const evalues = regle.referentiels
		.map((r) => ({ r, b: evaluer(r, valeurs, mesure.sexe) }))
		.filter((e): e is { r: Referentiel; b: Bande } => e.b !== undefined);
	if (!evalues.length) {
		return { ...base, statut: 'inconnu', referentiels: [], divergence: false, messages: [], sources: [] };
	}
	const pire = Math.max(...evalues.map((e) => GRAVITE[e.b.statut]));
	const signales = evalues.filter((e) => e.b.statut !== 'ok');
	const statut = (Object.keys(GRAVITE) as Statut[]).find((s) => GRAVITE[s] === pire)!;
	return {
		...base,
		statut,
		referentiels: signales.map((e) => e.r.nom),
		divergence: signales.length > 0 && signales.length < evalues.length,
		messages: signales.flatMap((e) => (e.b.message ? [e.b.message] : [])),
		sources: (signales.length ? signales : evalues).map((e) => e.r.source),
	};
}
