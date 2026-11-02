<script lang="ts">
	import { resolve } from '$app/paths';
	import Pastille from '#lib/wiki/Pastille.svelte';
	import { chercher } from '#lib/wiki/recherche.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const TYPES: Record<string, string> = {
		condition: 'Conditions', biomarqueur: 'Biomarqueurs', actif: 'Leviers', produit: 'Produits',
		protocole: 'Protocoles', acte: 'Actes',
	};
	const PREUVES = ['A', 'B', 'C', 'D', 'M', '?'];

	let requete = $state('');
	let type = $state('');
	let cible = $state('');
	let preuve = $state('');
	let tout = $state(false);

	const metas = $derived(new Map(data.metas.map((m) => [m.id, m])));
	const resultats = $derived(chercher(requete, data.recherche, metas, { type, cible, preuve }));
	const LIMITE = 60;
	const affiches = $derived(tout ? resultats : resultats.slice(0, LIMITE));
	const filtre = $derived(Boolean(requete.trim() || type || cible || preuve));
</script>

<svelte:head><title>Savoir · Eternal</title></svelte:head>

<div class="page">
	<header>
		<p class="eyebrow">Savoir</p>
		<h1>Bibliothèque</h1>
		<p class="muted small">{data.metas.length} fiches sourcées. Le niveau de preuve précède chaque affirmation d’efficacité.</p>
	</header>

	<form role="search" onsubmit={(e) => e.preventDefault()}>
		<label class="sr" for="q">Rechercher une fiche</label>
		<input id="q" type="search" bind:value={requete} placeholder="Ferritine, vitamine D, sommeil…"
			autocomplete="off" enterkeyhint="search" />
		<div class="filtres">
			<label>Type
				<select bind:value={type}>
					<option value="">Tous</option>
					{#each Object.entries(TYPES) as [k, nom] (k)}<option value={k}>{nom}</option>{/each}
				</select>
			</label>
			<label>Domaine
				<select bind:value={cible}>
					<option value="">Tous</option>
					{#each Object.keys(data.cibles) as k (k)}<option value={k}>{k}</option>{/each}
				</select>
			</label>
			<label>Preuve
				<select bind:value={preuve}>
					<option value="">Toutes</option>
					{#each PREUVES as p (p)}<option value={p}>{p}</option>{/each}
				</select>
			</label>
		</div>
	</form>

	<p class="compte small muted" aria-live="polite">
		{resultats.length} fiche{resultats.length > 1 ? 's' : ''}{filtre ? '' : ' au total'}
	</p>

	{#if resultats.length === 0}
		<p class="vide">Aucune fiche ne correspond. Une absence de résultat n’est pas une absence de preuve : la bibliothèque ne couvre pas tout.</p>
	{:else}
		<ul class="liste">
			{#each affiches as f (f.id)}
				<li>
					<a href={resolve('/savoir/[id]', { id: f.id })}>
						<Pastille niveau={f.preuve_globale} />
						<span class="corps">
							<strong>{f.titre}</strong>
							{#if f.resume}<span class="resume small muted">{f.resume}</span>{/if}
							<span class="meta small muted">{TYPES[f.type] ?? f.type} · {f.cibles.join(', ')}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
		{#if !tout && resultats.length > LIMITE}
			<button type="button" onclick={() => (tout = true)}>Afficher les {resultats.length - LIMITE} autres</button>
		{/if}
	{/if}
</div>

<style>
	.page { padding: 18px max(16px, env(safe-area-inset-right, 0)) 28px max(16px, env(safe-area-inset-left, 0)); display: flex; flex-direction: column; gap: 14px; }
	.eyebrow { margin: 0 0 4px; font-size: 0.74rem; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
	header p { margin: 4px 0 0; }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
	input[type='search'] { width: 100%; font: inherit; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); color: var(--ink); }
	.filtres { display: flex; gap: 8px; margin-top: 8px; }
	.filtres label { flex: 1; font-size: 0.74rem; color: var(--muted); display: flex; flex-direction: column; gap: 3px; min-width: 0; }
	select { font: inherit; font-size: 0.9rem; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--ink); min-width: 0; }
	.compte { margin: 0; }
	.liste { list-style: none; margin: 0; padding: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
	.liste li + li { border-top: 1px solid var(--line); }
	.liste a { display: flex; gap: 12px; padding: 12px 14px; text-decoration: none; color: inherit; align-items: flex-start; }
	.corps { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
	.resume { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.vide { background: var(--surface); border: 1px dashed var(--line); border-radius: 14px; padding: 16px; margin: 0; color: var(--muted); }
	button { font: inherit; padding: 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); cursor: pointer; }
</style>
