<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { seancesRecentes, volume } from '#lib/muscu/seances.js';
	import { stockageMuscu } from '#lib/muscu/stockage.svelte.js';
	import { EPREUVES } from '#lib/suivi/mesures.js';
	import { stockageSuivi } from '#lib/suivi/stockage.svelte.js';

	onMount(() => {
		stockageMuscu.charger();
		stockageSuivi.charger();
	});
	const jolie = (d: string) => d.split('-').reverse().join('/');
	const derniere = $derived(seancesRecentes(stockageMuscu.carnet)[0]);
	const derniereMesure = $derived(
		[...stockageSuivi.suivi.mesures].sort((a, b) => b.date.localeCompare(a.date))[0],
	);
	const epreuve = $derived(derniereMesure ? EPREUVES.find((e) => e.id === derniereMesure.epreuve) : undefined);
	const vide = $derived(!derniere && !derniereMesure);
</script>

<svelte:head><title>Eternal</title></svelte:head>

<div class="page">
	<header>
		<h1>Aujourd’hui</h1>
		<p class="muted small">Vos données restent sur cet appareil.</p>
	</header>

	<div class="actions">
		<a class="gros primaire" href={resolve('/muscu')}>Démarrer une séance</a>
		{#if derniere}
			<a class="gros" href="{resolve('/muscu')}?reprendre=1">Refaire « {derniere.nom ?? jolie(derniere.date)} »</a>
		{/if}
		<a class="gros" href={resolve('/forme')}>Ajouter une mesure</a>
	</div>

	{#if vide}
		<section class="aide">
			<h2>Pour commencer</h2>
			<p>Enregistrez une séance de muscu ou une mesure (force de préhension, marche de 6 minutes…) : la courbe de progression apparaît dès la deuxième entrée.</p>
			<p class="muted small">Le <a href={resolve('/savoir')}>Savoir</a> contient 416 fiches sourcées sur les leviers de santé, avec leur niveau de preuve.</p>
		</section>
	{:else}
		<section>
			<h2>Dernières données</h2>
			{#if derniere}
				<a class="carte" href={resolve('/muscu')}>
					<span class="muted small">Séance du {jolie(derniere.date)}{derniere.nom ? ` · ${derniere.nom}` : ''}</span>
					<span>{derniere.exercices.map((e) => e.nom).join(', ')}</span>
					<span class="muted small">Volume {Math.round(derniere.exercices.reduce((t, e) => t + volume(e.series), 0))} kg</span>
				</a>
			{/if}
			{#if derniereMesure && epreuve}
				<a class="carte" href={resolve('/forme')}>
					<span class="muted small">Mesure du {jolie(derniereMesure.date)}</span>
					<span>{epreuve.nom} : <strong class="data">{derniereMesure.valeur} {epreuve.unite}</strong></span>
				</a>
			{/if}
		</section>
	{/if}
</div>

<style>
	.page { padding: 20px 16px 32px; display: grid; gap: 22px; }
	.actions { display: grid; gap: 10px; }
	.gros { display: grid; place-items: center; min-height: 56px; padding: 12px; border: 1px solid var(--line); border-radius: 12px;
		background: var(--surface); color: var(--ink); font-size: 1.05rem; font-weight: 600; text-decoration: none; text-align: center; }
	.primaire { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
	section { display: grid; gap: 8px; }
	.aide p { margin: 0; }
	.carte { display: grid; gap: 2px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); text-decoration: none; }
</style>
