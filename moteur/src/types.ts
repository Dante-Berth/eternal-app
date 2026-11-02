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

export type StatutInteraction = 'documente' | 'plausible' | 'non_demontre' | 'aucune_donnee';
/** alerte = documenté ; prudence = plausible ; aucune_donnee = rien à signaler faute de donnée (≠ « sans risque »). */
export type CategorieAlerte = 'alerte' | 'prudence' | 'aucune_donnee';

export interface Cote {
	fiche?: string;
	substance?: string;
	habitude?: string;
}

export interface SourceInteraction {
	pmid?: string;
	texte?: string;
	fiche?: string;
}

export interface Interaction {
	id: string;
	a: Cote;
	b: Cote;
	statut: StatutInteraction;
	effet: string;
	gravite: string;
	conduite: string | null;
	preuve: string;
	sources: SourceInteraction[];
}

export interface DonneesInteractions {
	substances: Record<string, { nom: string; inclut?: string[] }>;
	interactions: Interaction[];
}

export interface Declaration {
	habitudes?: Array<{ habitude: string; niveau: 'jamais' | 'occasionnel' | 'regulier' | 'quotidien' }>;
	traitements?: Array<{ fiche?: string; substance?: string; debut?: string; fin?: string | null }>;
}

export interface Alerte {
	id: string;
	categorie: CategorieAlerte;
	statut: StatutInteraction;
	a: Cote;
	b: Cote;
	effet: string;
	gravite: string;
	conduite: string | null;
	preuve: string;
	sources: SourceInteraction[];
}

export interface ResultatAlertes {
	alertes: Alerte[];
	/** Habitudes non déclarées dont dépend une interaction d'un traitement actif : vérification impossible. */
	a_renseigner: Array<{ habitude: string; interactions: string[] }>;
}
