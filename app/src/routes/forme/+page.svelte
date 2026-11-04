<script lang="ts">
	import { onMount } from 'svelte';
	import SousOnglets from '#lib/ui/SousOnglets.svelte';
	import CarteEpreuve from '#lib/suivi/CarteEpreuve.svelte';
	import { EPREUVES, FAMILLES, ajouterMesure, serie, supprimerMesure, type Famille } from '#lib/suivi/mesures.js';
	import { stockageSuivi } from '#lib/suivi/stockage.svelte.js';

	onMount(() => stockageSuivi.charger());
	const suivi = $derived(stockageSuivi.suivi);
	const familles = Object.keys(FAMILLES) as Famille[];
</script>

<svelte:head><title>Forme · Eternal</title></svelte:head>

<div class="page">
	<SousOnglets />
	<header>
		<p class="eyebrow">Forme</p>
		<h1>Force, souplesse, endurance</h1>
		<p class="muted small">
			Vos mesures restent sur cet appareil. Cette page montre votre évolution, sans note ni seuil : aucune valeur de référence n’est affichée tant qu’elle n’est pas sourcée.
			{#if !stockageSuivi.persiste}<strong class="avert">Le stockage du navigateur est refusé : rien ne sera conservé après fermeture.</strong>{/if}
		</p>
	</header>

	{#each familles as f (f)}
		<section>
			<h2>{FAMILLES[f]}</h2>
			{#each EPREUVES.filter((e) => e.famille === f) as e (e.id)}
				<CarteEpreuve
					epreuve={e}
					mesures={serie(suivi, e.id)}
					ajouter={(date, valeur) => stockageSuivi.definir(ajouterMesure(stockageSuivi.suivi, e.id, date, valeur))}
					supprimer={(id) => stockageSuivi.definir(supprimerMesure(stockageSuivi.suivi, id))}
				/>
			{/each}
		</section>
	{/each}
</div>

<style>
	.page { padding: 20px 16px 32px; display: grid; gap: 22px; }
	.eyebrow { margin: 0 0 4px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
	.avert { color: var(--bad); }
	section { display: grid; gap: 8px; }
</style>
