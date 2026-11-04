<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const chemin = $derived(page.url.pathname);
	const onglets = $derived([
		{ nom: 'Jour', href: resolve('/'), actif: !/\/(savoir|muscu|forme|moi|bilan)/.test(chemin) },
		{ nom: 'Sport', href: resolve('/muscu'), actif: /\/(muscu|forme)/.test(chemin) },
		{ nom: 'Savoir', href: resolve('/savoir'), actif: chemin.includes('/savoir') },
		{ nom: 'Moi', href: resolve('/moi'), actif: /\/(moi|bilan)/.test(chemin) },
	]);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#1b3a5c" />
</svelte:head>

<div class="coque">
	<main>{@render children()}</main>
	<nav aria-label="Sections">
		{#each onglets as o (o.nom)}
			<a href={o.href} aria-current={o.actif ? 'page' : undefined}>{o.nom}</a>
		{/each}
	</nav>
</div>

<style>
	.coque { display: flex; flex-direction: column; height: 100dvh; max-width: 760px; margin: 0 auto; background: var(--bg); }
	main { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
	nav { display: flex; border-top: 1px solid var(--line); background: var(--surface);
		padding-bottom: env(safe-area-inset-bottom, 0); }
	nav a { flex: 1; text-align: center; padding: 14px 2px; min-height: 48px; font-size: 0.86rem; font-weight: 600;
		color: var(--muted); text-decoration: none; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	nav a[aria-current='page'] { color: var(--accent); box-shadow: inset 0 3px 0 var(--accent); }
</style>
