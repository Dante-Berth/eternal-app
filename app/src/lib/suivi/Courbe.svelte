<script lang="ts">
	import { tracer, type Point } from './courbe.js';

	let { points, unite = '', titre = '' }: { points: Point[]; unite?: string; titre?: string } = $props();
	const L = 320, H = 180;
	const t = $derived(tracer(points, L, H));
	const fmt = (n: number) => String(Math.round(n * 10) / 10);
	const jolie = (d: string) => d.split('-').reverse().join('/');
</script>

{#if t}
	<svg viewBox="0 0 {L} {H}" role="img" aria-label="{titre} : {points.length} mesure{points.length > 1 ? 's' : ''}, de {jolie(t.debut)} à {jolie(t.fin)}">
		<line class="grille" x1="40" x2={L - 12} y1="12" y2="12" />
		<line class="grille" x1="40" x2={L - 12} y1={H - 24} y2={H - 24} />
		<text class="axe" x="36" y="16" text-anchor="end">{fmt(t.max)}</text>
		<text class="axe" x="36" y={H - 20} text-anchor="end">{fmt(t.min)}</text>
		<text class="axe" x="40" y={H - 6}>{jolie(t.debut)}</text>
		<text class="axe" x={L - 12} y={H - 6} text-anchor="end">{t.fin === t.debut ? '' : jolie(t.fin)}</text>
		{#if t.points.length > 1}<path d={t.chemin} class="ligne" />{/if}
		{#each t.points as p (p.date + p.valeur + p.x)}
			<circle cx={p.x} cy={p.y} r="4" class="pt"><title>{jolie(p.date)} : {fmt(p.valeur)} {unite}</title></circle>
		{/each}
	</svg>
{/if}

<style>
	svg { width: 100%; height: auto; display: block; }
	.grille { stroke: var(--line); stroke-width: 1; }
	.axe { fill: var(--muted); font-size: 10px; font-family: var(--f-data); }
	.ligne { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
	.pt { fill: var(--surface); stroke: var(--accent); stroke-width: 2; }
</style>
