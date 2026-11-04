<script lang="ts">
	import { onDestroy } from 'svelte';
	import { PRESETS, afficher, reste } from './repos.js';

	let fin = $state(0);
	let maintenant = $state(Date.now());
	let termine = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;
	const restant = $derived(fin ? reste(fin, maintenant) : 0);
	const actif = $derived(fin > 0 && !termine);

	function lancer(s: number) {
		fin = Date.now() + s * 1000;
		maintenant = Date.now();
		termine = false;
		clearInterval(timer);
		timer = setInterval(() => {
			maintenant = Date.now();
			if (reste(fin, maintenant) === 0) { clearInterval(timer); termine = true; signaler(); }
		}, 250);
	}
	function arreter() { clearInterval(timer); fin = 0; termine = false; }
	function signaler() {
		try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignoré */ }
		try {
			const ctx = new AudioContext();
			const o = ctx.createOscillator();
			o.frequency.value = 880;
			o.connect(ctx.destination);
			o.start();
			o.stop(ctx.currentTime + 0.25);
		} catch { /* pas de son : le texte « Repos terminé » reste affiché */ }
	}
	onDestroy(() => clearInterval(timer));
</script>

<div class="repos" class:fini={termine} role="timer" aria-live="off">
	{#if actif}
		<strong class="data temps">{afficher(restant)}</strong>
		<button type="button" onclick={() => lancer(restant + 15)}>+15 s</button>
		<button type="button" onclick={arreter}>Arrêter</button>
	{:else if termine}
		<strong role="status">Repos terminé</strong>
		<button type="button" onclick={arreter}>OK</button>
	{:else}
		<span class="muted small">Repos</span>
		{#each PRESETS as s (s)}<button type="button" onclick={() => lancer(s)}>{afficher(s)}</button>{/each}
	{/if}
</div>

<style>
	.repos { position: sticky; top: 8px; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin: 0 -4px;
		border: 1px solid var(--line); border-radius: 12px; background: var(--surface); box-shadow: 0 2px 8px color-mix(in srgb, var(--ink) 12%, transparent); }
	.repos.fini { border-color: var(--ok); background: var(--ok-bg); color: var(--ok); }
	.temps { font-size: 1.6rem; margin-right: auto; }
	strong:not(.temps) { margin-right: auto; }
	button { font: inherit; font-size: 0.9rem; min-height: 44px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); }
	.repos span { margin-right: auto; }
</style>
