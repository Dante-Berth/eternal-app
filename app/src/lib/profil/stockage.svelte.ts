import { lireProfil, profilVide, type Profil } from './profil.js';

const CLE = 'eternal.profil.v1';

/** Profil local, jamais envoyé : localStorage, avec repli en mémoire si le stockage est refusé. */
class Stockage {
	profil = $state<Profil>(profilVide());
	persiste = $state(true);

	charger() {
		try {
			this.profil = lireProfil(localStorage.getItem(CLE));
		} catch {
			this.persiste = false;
		}
	}

	definir(p: Profil) {
		this.profil = p;
		try {
			localStorage.setItem(CLE, JSON.stringify(p));
			this.persiste = true;
		} catch {
			this.persiste = false;
		}
	}
}

export const stockage = new Stockage();
