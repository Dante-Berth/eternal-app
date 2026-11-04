<script lang="ts">
	import Courbe from './Courbe.svelte';
	import { lireTableau, resume, type Epreuve, type Mesure } from './mesures.js';

	let { epreuve, mesures, ajouter, supprimer }: {
		epreuve: Epreuve;
		mesures: Mesure[];
		ajouter: (date: string, valeur: number, note?: string) => void;
		supprimer: (id: string) => void;
	} = $props();

	const aujourdhui = new Date().toISOString().slice(0, 10);
	let date = $state(aujourdhui);
	let valeur = $state('');
	let colle = $state('');
	let bilan = $state('');
	const r = $derived(resume(mesures, epreuve.sens));
	const jolie = (d: string) => d.split('-').reverse().join('/');
	const signe = (n: number) => (n > 0 ? `+${n}` : String(n));

	function saisir(e: SubmitEvent) {
		e.preventDefault();
		const v = Number(valeur.replace(',', '.'));
		if (valeur.trim() === '' || !Number.isFinite(v) || !date) return;
		ajouter(date, v);
		valeur = '';
	}
	function importer() {
		const { lignes, rejetees } = lireTableau(colle);
		for (const l of lignes) ajouter(l.date, l.valeur);
		bilan = `${lignes.length} ligne${lignes.length > 1 ? 's' : ''} importée${lignes.length > 1 ? 's' : ''}${rejetees.length ? `, ${rejetees.length} ignorée${rejetees.length > 1 ? 's' : ''} : ${rejetees.slice(0, 3).join(' | ')}` : ''}.`;
		if (!rejetees.length) colle = '';
	}
</script>

<details class="carte">
	<summary>
		<span class="nom">{epreuve.nom}</span>
		{#if r}
			<span class="data val">{r.derniere.valeur} <small>{epreuve.unite}</small></span>
		{:else}
			<span class="muted small">aucune mesure</span>
		{/if}
	</summary>
	<div class="corps">
		<p class="muted small">{epreuve.protocole} {epreuve.sens === 'moins' ? 'Une valeur plus basse est meilleure.' : ''}</p>

		<form onsubmit={saisir}>
			<input type="date" bind:value={date} max={aujourdhui} aria-label="Date" required />
			<input type="text" inputmode="decimal" bind:value={valeur} placeholder={epreuve.unite} aria-label="Valeur en {epreuve.unite}" required />
			<button type="submit">Ajouter</button>
		</form>

		{#if r}
			<Courbe points={mesures} unite={epreuve.unite} titre={epreuve.nom} />
			<p class="small">
				{r.n} mesure{r.n > 1 ? 's' : ''}.
				{#if r.n > 1}
					Depuis la première ({jolie(r.premiere.date)}) : <strong class="data">{signe(r.ecart)} {epreuve.unite}</strong>
					({r.evolution}). Meilleure : <span class="data">{r.meilleure.valeur}</span>.
					<span class="muted">Une mesure varie d’un jour à l’autre : un petit écart ne prouve rien.</span>
				{/if}
			</p>
			<table>
				<thead><tr><th>Date</th><th>Valeur ({epreuve.unite})</th><th><span class="sr">Supprimer</span></th></tr></thead>
				<tbody>
					{#each [...mesures].reverse() as m (m.id)}
						<tr>
							<td class="data">{jolie(m.date)}</td>
							<td class="data">{m.valeur}</td>
							<td><button class="x" onclick={() => supprimer(m.id)} aria-label="Supprimer la mesure du {jolie(m.date)}">×</button></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		<details class="coller">
			<summary class="small">Coller un tableau (date ; valeur)</summary>
			<textarea bind:value={colle} rows="4" placeholder={'2026-01-05;31,5\n12/02/2026;33'} aria-label="Tableau à importer"></textarea>
			<button type="button" onclick={importer} disabled={!colle.trim()}>Importer</button>
			{#if bilan}<p class="small" role="status">{bilan}</p>{/if}
		</details>
	</div>
</details>

<style>
	.carte { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
	summary { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 12px; cursor: pointer; }
	.nom { font-weight: 600; }
	.val small { color: var(--muted); }
	.corps { padding: 0 12px 12px; display: grid; gap: 10px; }
	.corps p { margin: 0; }
	form { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
	input, textarea { font: inherit; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); min-width: 0; width: 100%; }
	button { font: inherit; font-size: 0.86rem; padding: 6px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); }
	button:disabled { opacity: 0.5; }
	table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	th { text-align: left; font-size: 0.78rem; color: var(--muted); font-weight: 600; }
	th, td { padding: 6px 4px; border-bottom: 1px solid var(--line); }
	td:last-child, th:last-child { text-align: right; width: 40px; }
	.x { padding: 2px 9px; font-size: 1.1rem; line-height: 1; }
	.coller { display: grid; gap: 8px; }
	.coller > summary { padding: 4px 0; color: var(--accent); }
	.coller[open] { gap: 8px; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
