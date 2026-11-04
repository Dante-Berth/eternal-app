import { lireSuivi, suiviVide, type Suivi } from './mesures.js';

const CLE = 'eternal.suivi.v1';

/** Suivi de forme local, jamais envoyé : localStorage, repli en mémoire si refusé. */
class StockageSuivi {
	suivi = $state<Suivi>(suiviVide());
	persiste = $state(true);

	charger() {
		try {
			this.suivi = lireSuivi(localStorage.getItem(CLE));
		} catch {
			this.persiste = false;
		}
	}

	definir(s: Suivi) {
		this.suivi = s;
		try {
			localStorage.setItem(CLE, JSON.stringify(s));
			this.persiste = true;
		} catch {
			this.persiste = false;
		}
	}
}

export const stockageSuivi = new StockageSuivi();
