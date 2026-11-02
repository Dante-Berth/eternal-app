<script lang="ts">
	import { resolve } from '$app/paths';
	import Pastille from '#lib/wiki/Pastille.svelte';
	import { rendre } from '#lib/wiki/markdown.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const f = $derived(data.fiche);

	const lien = (id: string) => resolve('/savoir/[id]', { id });
	const sections = $derived(f.sections.map((s) => ({ ...s, html: rendre(s.markdown, lien) })));
	const intro = $derived(f.intro ? rendre(f.intro, lien) : '');

	const STATUT: Record<string, string> = {
		cosmetique: 'cosmétique', complement_alimentaire: 'complément alimentaire', aliment: 'aliment',
		medicament_sans_ordonnance: 'médicament sans ordonnance', medicament_ordonnance: 'médicament sur ordonnance',
		hors_amm: 'hors AMM', dispositif_medical: 'dispositif médical', acte_medical: 'acte médical',
		non_autorise: 'non autorisé', non_applicable: '', mixte: 'statut mixte',
	};
	const VERIF: Record<string, string> = {
		true: 'sources vérifiées', partielle: 'sources vérifiées en partie', false: 'sources non vérifiées',
	};
	// Ouvert par défaut : le résumé, et les sections sur la sécurité et les mythes.
	const ouverte = (t: string) => /^(TL;DR|Verdict)/.test(t);
</script>

<svelte:head><title>{f.titre} · Eternal</title></svelte:head>

<article class="page">
	<a class="retour small" href={resolve('/savoir')}>← Bibliothèque</a>

	<header>
		<div class="titre">
			<Pastille niveau={f.preuve_globale} />
			<h1>{f.titre}</h1>
		</div>
		<p class="puces small">
			<span>{f.type}</span>
			{#each f.cibles as c (c)}<span>{c}</span>{/each}
			{#if STATUT[f.statut_fr]}<span>{STATUT[f.statut_fr]}</span>{/if}
		</p>
		<p class="small muted">
			Niveau de preuve global {f.preuve_globale} · {VERIF[f.sources_verifiees] ?? f.sources_verifiees} · mis à jour le {f.derniere_maj}
			{#if f.nb_pmid}· {f.nb_pmid} références PubMed{/if}
		</p>
		{#if f.sources_verifiees !== 'true'}
			<p class="alerte small">Cette fiche contient des affirmations non entièrement vérifiées ; les points marqués <span class="ev ev-Q ev-inline">?</span> n’ont pas de source.</p>
		{/if}
	</header>

	{#if intro}<div class="prose bloc">{@html intro}</div>{/if}

	{#each sections as s (s.titre)}
		<details class="bloc" open={ouverte(s.titre)}>
			<summary><h2>{s.titre}</h2></summary>
			<div class="prose">{@html s.html}</div>
		</details>
	{/each}

	{#if f.pied}<p class="pied small muted">{f.pied}</p>{/if}
</article>

<style>
	.page { padding: 14px max(16px, env(safe-area-inset-right, 0)) 32px max(16px, env(safe-area-inset-left, 0)); display: flex; flex-direction: column; gap: 14px; }
	.retour { text-decoration: none; }
	.titre { display: flex; gap: 12px; align-items: flex-start; }
	.titre :global(.ev) { margin-top: 4px; }
	.puces { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 6px; padding: 0; }
	.puces span { background: var(--soft); border: 1px solid var(--line); border-radius: 99px; padding: 2px 10px; }
	header p { margin: 4px 0 0; }
	.alerte { background: var(--warn-bg); color: var(--warn); border-radius: 10px; padding: 8px 12px; }
	.bloc { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
	summary { cursor: pointer; list-style-position: outside; }
	summary h2 { display: inline; }
	details[open] > summary { margin-bottom: 4px; }
	.pied { margin: 4px 0 0; }
</style>
