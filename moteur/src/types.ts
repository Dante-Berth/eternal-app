export type Statut = 'ok' | 'discute' | 'a_regarder' | 'hors_cible' | 'inconnu';
export type Sexe = 'F' | 'M';

export interface Conversion {
	unite: string;
	facteur: number;
	decalage?: number;
}

export interface Marqueur {
	id: string;
	unite: string;
	forme?: 'paire';
	conversions?: Conversion[];
}

export interface Condition {
	i?: number;
	min?: number;
	max?: number;
	max_inclus?: number;
}

export interface Bande {
	si?: Condition[];
	sexe?: Sexe;
	statut: Statut;
	message?: string;
}

export interface Referentiel {
	nom: string;
	fiabilite?: 'secondaire';
	source: string;
	bandes: Bande[];
}

export interface RegleMarqueur {
	plausible?: [number, number];
	referentiels?: Referentiel[];
	inconnu?: string;
}

export interface Regles {
	schema_version: number;
	marqueurs: Record<string, RegleMarqueur>;
}

export interface Mesure {
	marqueur: string;
	valeur: number | number[];
	unite: string;
	sexe?: Sexe;
}

export interface ResultatStatut {
	statut: Statut;
	valeur_usuelle: number | number[];
	unite_usuelle: string;
	referentiels: string[];
	divergence: boolean;
	messages: string[];
	sources: string[];
}

export type CodeErreur = 'marqueur_inconnu' | 'unite_inconnue' | 'valeur_implausible' | 'forme_invalide';

export interface ErreurStatut {
	erreur: CodeErreur;
	detail: string;
}
