<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	const actif = $derived(page.url.pathname.includes('/forme') ? 'forme' : 'muscu');
</script>

<nav class="sous" aria-label="Entraînement">
	<a href={resolve('/muscu')} aria-current={actif === 'muscu' ? 'page' : undefined}>Séances de muscu</a>
	<a href={resolve('/forme')} aria-current={actif === 'forme' ? 'page' : undefined}>Force · souplesse · endurance</a>
</nav>

<style>
	.sous { display: flex; gap: 4px; padding: 4px; background: var(--soft); border: 1px solid var(--line); border-radius: 12px; }
	a { flex: 1; text-align: center; padding: 10px 6px; min-height: 44px; display: grid; place-items: center; border-radius: 9px;
		font-size: 0.86rem; font-weight: 600; color: var(--muted); text-decoration: none; line-height: 1.2; }
	a[aria-current='page'] { background: var(--surface); color: var(--accent); box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 15%, transparent); }
</style>
