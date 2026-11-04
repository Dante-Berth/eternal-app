<script lang="ts">
	import { onMount } from 'svelte';
	import Courbe from '#lib/suivi/Courbe.svelte';
	import {
		ajouterSeance, dernieresSeries, historique, nomsExercices, seancesRecentes, supprimerSeance, volume,
		type Exercice,
	} from '#lib/muscu/seances.js';
	import { stockageMuscu } from '#lib/muscu/stockage.svelte.js';

	onMount(() => stockageMuscu.charger());
	const carnet = $derived(stockageMuscu.carnet);
	const aujourdhui = new Date().toISOString().slice(0, 10);
	const jolie = (d: string) => d.split('-').reverse().join('/');

	type Ligne = { reps: string; charge: string };
	let date = $state(aujourdhui);
	let titre = $state('');
	let brouillon = $state<Array<{ nom: string; series: Ligne[] }>>([]);
	let nouveau = $state('');
	let erreur = $state('');

	const noms = $derived(nomsExercices(carnet));

	function ajouterExercice(e: SubmitEvent) {
		e.preventDefault();
		const nom = nouveau.trim();
		if (!nom) return;
		const prec = dernieresSeries(carnet, nom);
		brouillon.push({ nom, series: (prec.length ? prec : [{ reps: 0, charge: 0 }]).map((s) => ({ reps: s.reps ? String(s.reps) : '', charge: s.reps ? String(s.charge) : '' })) });
		nouveau = '';
	}
	const num = (s: string) => Number(s.trim().replace(',', '.'));

	function enregistrer() {
		const exercices: Exercice[] = brouillon.map((b) => ({
			nom: b.nom,
			series: b.series.filter((s) => s.reps.trim() !== '').map((s) => ({ reps: num(s.reps), charge: s.charge.trim() === '' ? 0 : num(s.charge) })),
		}));
		const apres = ajouterSeance(carnet, date, exercices, titre);
		if (apres === carnet) { erreur = 'Aucune série valide : répétitions entières > 0, charge ≥ 0.'; return; }
		erreur = '';
		stockageMuscu.definir(apres);
		brouillon = [];
		titre = '';
	}

	let choisi = $state('');
	let metrique = $state<'e1rm' | 'charge_max' | 'volume' | 'reps_max'>('e1rm');
	const METRIQUES = { e1rm: '1RM estimé (kg)', charge_max: 'Charge max (kg)', volume: 'Volume (kg)', reps_max: 'Répétitions max' } as const;
	const exo = $derived(choisi && noms.includes(choisi) ? choisi : (noms[0] ?? ''));
	const histo = $derived(exo ? historique(carnet, exo) : []);
	const points = $derived(histo.map((h) => ({ date: h.date, valeur: h[metrique] })));
</script>

<svelte:head><title>Muscu · Eternal</title></svelte:head>

<div class="page">
	<header>
		<p class="eyebrow">Muscu</p>
		<h1>Carnet d’entraînement</h1>
		<p class="muted small">
			Vos séances restent sur cet appareil. Ce carnet enregistre et trace, il ne prescrit ni charge ni volume.
			{#if !stockageMuscu.persiste}<strong class="avert">Le stockage du navigateur est refusé : rien ne sera conservé après fermeture.</strong>{/if}
		</p>
	</header>

	<section>
		<h2>Nouvelle séance</h2>
		<div class="ligne2">
			<input type="date" bind:value={date} max={aujourdhui} aria-label="Date de la séance" />
			<input type="text" bind:value={titre} placeholder="Nom (ex. Pousser)" aria-label="Nom de la séance" />
		</div>

		{#each brouillon as b, i (i)}
			<div class="exo">
				<div class="entete">
					<strong>{b.nom}</strong>
					<button type="button" onclick={() => brouillon.splice(i, 1)} aria-label="Retirer {b.nom}">Retirer</button>
				</div>
				{#each b.series as s, j (j)}
					<div class="serie">
						<span class="data n">{j + 1}</span>
						<input type="text" inputmode="numeric" bind:value={s.reps} placeholder="reps" aria-label="Répétitions série {j + 1}" />
						<input type="text" inputmode="decimal" bind:value={s.charge} placeholder="kg" aria-label="Charge série {j + 1}" />
						<button type="button" onclick={() => b.series.splice(j, 1)} aria-label="Retirer la série {j + 1}">×</button>
					</div>
				{/each}
				<button type="button" onclick={() => b.series.push({ reps: b.series.at(-1)?.reps ?? '', charge: b.series.at(-1)?.charge ?? '' })}>+ Série</button>
			</div>
		{/each}

		<form class="ajout" onsubmit={ajouterExercice}>
			<input list="noms-exos" bind:value={nouveau} placeholder="Exercice (ex. Squat)" aria-label="Ajouter un exercice" />
			<datalist id="noms-exos">{#each noms as n (n)}<option value={n}></option>{/each}</datalist>
			<button type="submit">Ajouter</button>
		</form>
		<p class="muted small">Les séries de la dernière fois sont préremplies. Charge vide = poids du corps.</p>
		{#if erreur}<p class="avert small" role="alert">{erreur}</p>{/if}
		<button class="primaire" type="button" onclick={enregistrer} disabled={brouillon.length === 0}>Enregistrer la séance</button>
	</section>

	{#if noms.length}
		<section>
			<h2>Progression</h2>
			<div class="ligne2">
				<select value={exo} onchange={(e) => (choisi = e.currentTarget.value)} aria-label="Exercice">
					{#each noms as n (n)}<option value={n}>{n}</option>{/each}
				</select>
				<select bind:value={metrique} aria-label="Mesure">
					{#each Object.entries(METRIQUES) as [k, v] (k)}<option value={k}>{v}</option>{/each}
				</select>
			</div>
			<Courbe {points} unite={metrique === 'reps_max' ? 'reps' : 'kg'} titre="{exo} · {METRIQUES[metrique]}" />
			{#if metrique === 'e1rm'}<p class="muted small">1RM estimé par la formule d’Epley : une estimation, moins fiable au-delà de ~10 répétitions.</p>{/if}
			<table>
				<thead><tr><th>Date</th><th>1RM est.</th><th>Charge max</th><th>Volume</th></tr></thead>
				<tbody>
					{#each [...histo].reverse() as h (h.date)}
						<tr><td class="data">{jolie(h.date)}</td><td class="data">{h.e1rm}</td><td class="data">{h.charge_max}</td><td class="data">{h.volume}</td></tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section>
			<h2>Séances</h2>
			{#each seancesRecentes(carnet) as s (s.id)}
				<details class="seance">
					<summary><span>{jolie(s.date)}{s.nom ? ` · ${s.nom}` : ''}</span><span class="muted small">{s.exercices.length} exo</span></summary>
					<div class="corps">
						{#each s.exercices as e (e.nom)}
							<p><strong>{e.nom}</strong> <span class="data">{e.series.map((x) => `${x.reps}×${x.charge}`).join('  ')}</span>
								<span class="muted small"> · volume {Math.round(volume(e.series))} kg</span></p>
						{/each}
						<button type="button" onclick={() => stockageMuscu.definir(supprimerSeance(carnet, s.id))}>Supprimer la séance</button>
					</div>
				</details>
			{/each}
		</section>
	{/if}
</div>

<style>
	.page { padding: 20px 16px 32px; display: grid; gap: 22px; }
	.eyebrow { margin: 0 0 4px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
	.avert { color: var(--bad); }
	section { display: grid; gap: 10px; }
	.ligne2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.ajout { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
	input, select { font: inherit; padding: 9px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); min-width: 0; width: 100%; }
	button { font: inherit; font-size: 0.86rem; padding: 6px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); }
	button:disabled { opacity: 0.5; }
	.primaire { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); padding: 11px; font-size: 1rem; font-weight: 600; }
	.exo { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); padding: 10px; display: grid; gap: 8px; }
	.entete { display: flex; justify-content: space-between; align-items: center; }
	.serie { display: grid; grid-template-columns: 24px 1fr 1fr auto; gap: 8px; align-items: center; }
	.n { color: var(--muted); text-align: center; }
	table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	th { text-align: left; font-size: 0.78rem; color: var(--muted); font-weight: 600; }
	th, td { padding: 6px 4px; border-bottom: 1px solid var(--line); }
	.seance { border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
	.seance summary { display: flex; justify-content: space-between; gap: 12px; padding: 12px; cursor: pointer; }
	.corps { padding: 0 12px 12px; display: grid; gap: 6px; }
	.corps p { margin: 0; }
</style>
