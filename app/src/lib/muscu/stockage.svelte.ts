import { carnetVide, lireCarnet, type Carnet } from './seances.js';

const CLE = 'eternal.muscu.v1';

/** Carnet de musculation local, jamais envoyé : localStorage, repli en mémoire si refusé. */
class StockageMuscu {
	carnet = $state<Carnet>(carnetVide());
	persiste = $state(true);

	charger() {
		try {
			this.carnet = lireCarnet(localStorage.getItem(CLE));
		} catch {
			this.persiste = false;
		}
	}

	definir(c: Carnet) {
		this.carnet = c;
		try {
			localStorage.setItem(CLE, JSON.stringify(c));
			this.persiste = true;
		} catch {
			this.persiste = false;
		}
	}
}

export const stockageMuscu = new StockageMuscu();
