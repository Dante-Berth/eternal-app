<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const onglets = ['Aujourd’hui', 'Mesures', 'Leviers', 'Savoir', 'Forme', 'Moi'];
	const dansSavoir = $derived(page.url.pathname.includes('/savoir'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#1b3a5c" />
</svelte:head>

<div class="coque">
	<main>{@render children()}</main>
	<nav aria-label="Sections">
		{#each onglets as nom (nom)}
			{#if nom === 'Savoir'}
				<a href={resolve('/savoir')} aria-current={dansSavoir ? 'page' : undefined}>{nom}</a>
			{:else if nom === 'Forme'}
				<a href={resolve('/forme')} aria-current={page.url.pathname.includes('/forme') ? 'page' : undefined}>{nom}</a>
			{:else if nom === 'Moi'}
				<a href={resolve('/moi')} aria-current={page.url.pathname.includes('/moi') ? 'page' : undefined}>{nom}</a>
			{:else}
				<span aria-disabled="true" title="Pas encore disponible">{nom}</span>
			{/if}
		{/each}
	</nav>
</div>

<style>
	.coque { display: flex; flex-direction: column; height: 100dvh; max-width: 760px; margin: 0 auto; background: var(--bg); }
	main { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
	nav { display: flex; border-top: 1px solid var(--line); background: var(--surface);
		padding-bottom: env(safe-area-inset-bottom, 0); }
	nav a, nav span { flex: 1; text-align: center; padding: 12px 2px; font-size: 0.78rem; font-weight: 600;
		color: var(--muted); text-decoration: none; min-width: 0; }
	nav a[aria-current='page'] { color: var(--accent); box-shadow: inset 0 3px 0 var(--accent); }
	nav span { opacity: 0.45; }
</style>
