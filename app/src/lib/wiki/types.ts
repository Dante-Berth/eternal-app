export type Preuve = 'A' | 'B' | 'C' | 'D' | 'M' | '?';

export interface FicheMeta {
	id: string;
	titre: string;
	type: string;
	famille: string;
	cibles: string[];
	preuve_globale: string;
	statut_fr: string;
	derniere_maj: string;
	sources_verifiees: string;
	resume: string;
	marqueurs: string[];
	nb_pmid: number;
}

export interface Fiche extends FicheMeta {
	intro: string;
	sections: { titre: string; markdown: string }[];
	liens: string[];
	pmid: string[];
	pied: string;
}

export interface EntreeRecherche {
	id: string;
	titre: string;
	resume: string;
	sections: string;
	corps: string;
}

export interface Filtres {
	type?: string;
	cible?: string;
	preuve?: string;
}
