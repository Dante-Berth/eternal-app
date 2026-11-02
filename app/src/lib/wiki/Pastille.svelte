<script lang="ts">
	let { niveau, titre }: { niveau: string; titre?: string } = $props();
	const k = $derived(niveau === '?' ? 'Q' : niveau);
	const libelle: Record<string, string> = {
		A: 'méta-analyse ou plusieurs essais randomisés chez l’humain',
		B: 'petits essais humains, études ouvertes, séries de cas',
		C: 'études animales',
		D: 'in vitro uniquement',
		M: 'marketing, sans étude',
		'?': 'aucune donnée trouvée',
	};
</script>

<span class="ev ev-{k}" title={titre ?? `Niveau de preuve ${niveau} : ${libelle[niveau] ?? 'inconnu'}`} role="img"
	aria-label={`Niveau de preuve ${niveau}`}>{niveau}</span>
