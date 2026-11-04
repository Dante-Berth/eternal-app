<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { bilan, decaler } from '#lib/bilan/bilan.js';
	import { csvForme, csvMuscu } from '#lib/bilan/csv.js';
	import { stockageMuscu } from '#lib/muscu/stockage.svelte.js';
	import { stockageSuivi } from '#lib/suivi/stockage.svelte.js';
	import { telecharger } from '#lib/ui/telecharger.js';

	onMount(() => {
		stockageMuscu.charger();
		stockageSuivi.charger();
	});
	const aujourdhui = new Date().toISOString().slice(0, 10);
	const PERIODES = [{ jours: 30, nom: '30 jours' }, { jours: 90, nom: '3 mois' }, { jours: 365, nom: '1 an' }];
	let jours = $state(90);
	const b = $derived(bilan(stockageMuscu.carnet, stockageSuivi.suivi, decaler(aujourdhui, -jours), aujourdhui));
	const jolie = (d: string) => d.split('-').reverse().join('/');
	const signe = (n: number) => (n > 0 ? `+${n}` : String(n));
	const vide = $derived(b.seances === 0 && b.forme.length === 0);
</script>

<svelte:head><title>Bilan · Eternal</title></svelte:head>

<div class="page">
	<header>
		<p class="eyebrow">Bilan</p>
		<h1>{jolie(b.debut)} → {jolie(b.fin)}</h1>
		<div class="periodes noprint" role="group" aria-label="Période">
			{#each PERIODES as p (p.jours)}
				<button type="button" aria-pressed={jours === p.jours} onclick={() => (jours = p.jours)}>{p.nom}</button>
			{/each}
		</div>
	</header>

	{#if vide}
		<p class="muted">Rien à résumer sur cette période. Enregistrez des <a href={resolve('/muscu')}>séances</a> ou des <a href={resolve('/forme')}>mesures</a>.</p>
	{:else}
		{#if b.seances}
			<section>
				<h2>Musculation</h2>
				<p class="chiffres">
					<span><strong class="data">{b.seances}</strong> séance{b.seances > 1 ? 's' : ''}</span>
					<span><strong class="data">{b.jours_actifs}</strong> jour{b.jours_actifs > 1 ? 's' : ''} actif{b.jours_actifs > 1 ? 's' : ''}</span>
					<span><strong class="data">{b.volume_total}</strong> kg soulevés</span>
				</p>
				<table>
					<thead><tr><th>Exercice</th><th>Séances</th><th>1RM est. (début → fin)</th></tr></thead>
					<tbody>
						{#each b.exercices as e (e.nom)}
							<tr>
								<td>{e.nom}</td><td class="data">{e.seances}</td>
								<td class="data">{e.e1rm_debut} → {e.e1rm_fin}{#if e.ecart !== null} ({signe(e.ecart)}){/if}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		{#if b.forme.length}
			<section>
				<h2>Force, souplesse, endurance</h2>
				<table>
					<thead><tr><th>Épreuve</th><th>Première → dernière</th><th>Évolution</th></tr></thead>
					<tbody>
						{#each b.forme as f (f.epreuve)}
							<tr>
								<td>{f.epreuve}</td>
								<td class="data">{f.resume.premiere.valeur} → {f.resume.derniere.valeur} {f.unite}</td>
								<td>{f.resume.n > 1 ? `${signe(f.resume.ecart)} (${f.resume.evolution})` : '1 seule mesure'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/if}

		<p class="muted small">
			Bilan descriptif de vos propres saisies : il ne juge pas votre niveau et ne remplace pas l’avis d’un professionnel.
			Une mesure varie d’un jour à l’autre ; le 1RM est estimé (formule d’Epley), pas mesuré.
		</p>
	{/if}

	<section class="noprint">
		<h2>Traiter vos données</h2>
		<p class="muted small">Fichiers CSV (séparateur « ; », décimales avec point, UTF-8) pour un tableur ou Python : tout l’historique, pas seulement cette période.</p>
		<div class="actions">
			<button type="button" onclick={() => telecharger(`eternal-muscu-${aujourdhui}.csv`, csvMuscu(stockageMuscu.carnet), 'text/csv;charset=utf-8')}>CSV muscu</button>
			<button type="button" onclick={() => telecharger(`eternal-forme-${aujourdhui}.csv`, csvForme(stockageSuivi.suivi), 'text/csv;charset=utf-8')}>CSV forme</button>
			<button type="button" onclick={() => window.print()}>Imprimer / PDF</button>
		</div>
	</section>
</div>

<style>
	.page { padding: 20px 16px 32px; display: grid; gap: 22px; }
	.eyebrow { margin: 0 0 4px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
	section { display: grid; gap: 10px; }
	.periodes, .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
	.actions { margin-top: 0; }
	button { font: inherit; font-size: 0.9rem; min-height: 44px; padding: 6px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); }
	button[aria-pressed='true'] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
	.chiffres { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; }
	.chiffres strong { font-size: 1.3rem; }
	table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	th { text-align: left; font-size: 0.78rem; color: var(--muted); font-weight: 600; }
	th, td { padding: 8px 4px; border-bottom: 1px solid var(--line); vertical-align: top; }
	@media print {
		.noprint { display: none; }
		:global(nav), :global(.sous) { display: none !important; }
		:global(.coque) { height: auto !important; }
		:global(main) { overflow: visible !important; }
	}
</style>
