/** Minuteur de repos fondé sur l'heure de fin (reste juste même si le navigateur ralentit l'onglet). */
export const PRESETS = [60, 90, 120, 180];

export const reste = (fin: number, maintenant: number): number => Math.max(0, Math.ceil((fin - maintenant) / 1000));

export const afficher = (secondes: number): string =>
	`${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;
