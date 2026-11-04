<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { alertesInteractions, type Cote } from '#moteur';
	import Pastille from '#lib/wiki/Pastille.svelte';
	import { chercher } from '#lib/wiki/recherche.js';
	import {
		NIVEAUX, ajouterTraitement, definirHabitude, supprimerTraitement, terminerTraitement, type Niveau,
	} from '#lib/profil/profil.js';
	import { stockage } from '#lib/profil/stockage.svelte.js';
	import { stockageSuivi } from '#lib/suivi/stockage.svelte.js';
	import { stockageMuscu } from '#lib/muscu/stockage.svelte.js';
	import { exporter, importer } from '#lib/sauvegarde/sauvegarde.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	onMount(() => {
		stockage.charger();
		stockageSuivi.charger();
		stockageMuscu.charger();
	});

	const aujourdhui = new Date().toISOString().slice(0, 10);
	const metas = $derived(new Map(data.metas.map((m) => [m.id, m])));
	const profil = $derived(stockage.profil);
	const substances = $derived(Object.entries(data.interactions.substances));
	const niveauDe = (id: string) => profil.habitudes.find((h) => h.habitude === id)?.niveau ?? '';
	const actif = (t: { fin?: string | null }) => !t.fin || t.fin > aujourdhui;
	const resultat = $derived(alertesInteractions(profil, data.interactions, aujourdhui));

	const LIBELLE_NIVEAU: Record<Niveau, string> = {
		jamais: 'Jamais', occasionnel: 'Occasionnel', regulier: 'Régulier', quotidien: 'Quotidien',
	};
	const CATEGORIES = {
		alerte: { titre: 'Interactions documentées', aide: 'Observées chez l’humain ou dans un texte réglementaire.' },
		prudence: { titre: 'Interactions plausibles', aide: 'Mécanisme ou cas isolés : non démontré.' },
		aucune_donnee: { titre: 'Aucune donnée', aide: 'Non recherché, introuvable ou sans effet démontré. Ce n’est pas une garantie d’absence d’interaction.' },
	} as const;

	function nomCote(c: Cote): string {
		if (c.fiche) return metas.get(c.fiche)?.titre ?? c.fiche;
		if (c.substance) return data.interactions.substances[c.substance]?.nom ?? c.substance;
		return data.habitudes.find((h) => h.id === c.habitude)?.nom ?? c.habitude ?? '';
	}
	const nomTraitement = (t: { fiche?: string; substance?: string }) =>
		nomCote({ fiche: t.fiche, substance: t.substance });

	let requete = $state('');
	const trouves = $derived(
		requete.trim().length < 2 ? [] : chercher(requete, data.recherche, metas, { type: 'actif' }).slice(0, 6),
	);
	const maj = (p: typeof profil) => stockage.definir(p);

	let message = $state('');
	function telecharger() {
		const texte = exporter({ profil: stockage.profil, suivi: stockageSuivi.suivi, carnet: stockageMuscu.carnet });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
		a.download = `eternal-sauvegarde-${aujourdhui}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
		message = 'Sauvegarde téléchargée. Elle contient vos données de santé : rangez-la en lieu sûr.';
	}
	async function restaurer(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const fichier = input.files?.[0];
		input.value = '';
		if (!fichier) return;
		const r = importer(await fichier.text());
		if (!r.ok) { message = r.erreur; return; }
		const { traitements, habitudes, mesures, seances } = r.resume;
		if (!confirm(`Remplacer les données de cet appareil par la sauvegarde ?\n${traitements} traitement(s), ${habitudes} habitude(s), ${mesures} mesure(s) de forme, ${seances} séance(s).`)) return;
		stockage.definir(r.sauvegarde.profil);
		stockageSuivi.definir(r.sauvegarde.suivi);
		stockageMuscu.definir(r.sauvegarde.carnet);
		message = 'Sauvegarde restaurée.';
	}
</script>

<svelte:head><title>Moi · Eternal</title></svelte:head>

<div class="page">
	<header>
		<p class="eyebrow">Moi</p>
		<h1>Traitements et habitudes</h1>
		<p class="muted small">
			Ce que vous déclarez reste sur cet appareil. {#if !stockage.persiste}<strong class="avert">Le stockage du navigateur est refusé : rien ne sera conservé après fermeture.</strong>{/if}
		</p>
	</header>

	<section>
		<h2>Médicaments (classes)</h2>
		<ul class="liste">
			{#each substances as [id, s] (id)}
				{@const t = profil.traitements.find((x) => x.substance === id && actif(x))}
				<li>
					<label>
						<input type="checkbox" checked={Boolean(t)}
							onchange={(e) => maj(e.currentTarget.checked
								? ajouterTraitement(profil, { substance: id }, aujourdhui)
								: terminerTraitement(profil, t!.id, aujourdhui))} />
						{s.nom}
					</label>
				</li>
			{/each}
		</ul>
		<p class="muted small">« Anticoagulants (sans précision) » ne couvre pas les interactions écrites pour une seule classe : choisissez la classe si vous la connaissez.</p>
	</section>

	<section>
		<h2>Leviers de la bibliothèque</h2>
		<ul class="liste">
			{#each profil.traitements.filter((t) => t.fiche && actif(t)) as t (t.id)}
				<li>
					<a href={resolve('/savoir/[id]', { id: t.fiche! })}>{nomTraitement(t)}</a>
					<button type="button" onclick={() => maj(supprimerTraitement(profil, t.id))}>Retirer</button>
				</li>
			{/each}
		</ul>
		<label class="sr" for="ajout">Ajouter un levier</label>
		<input id="ajout" type="search" bind:value={requete} placeholder="Ajouter : ail, ginkgo, vitamine E…" autocomplete="off" />
		{#if trouves.length}
			<ul class="liste">
				{#each trouves as m (m.id)}
					<li>
						<span><Pastille niveau={m.preuve_globale} /> {m.titre}</span>
						<button type="button" onclick={() => { maj(ajouterTraitement(profil, { fiche: m.id }, aujourdhui)); requete = ''; }}>Ajouter</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section>
		<h2>Habitudes</h2>
		<p class="muted small">Non renseigné ≠ « jamais » : sans réponse, l’interaction ne peut pas être vérifiée.</p>
		<ul class="liste">
			{#each data.habitudes as h (h.id)}
				<li>
					<label for={`h-${h.id}`}>{h.nom}</label>
					<select id={`h-${h.id}`} value={niveauDe(h.id)}
						onchange={(e) => maj(definirHabitude(profil, h.id, (e.currentTarget.value || null) as Niveau | null))}>
						<option value="">Non renseigné</option>
						{#each NIVEAUX as n (n)}<option value={n}>{LIBELLE_NIVEAU[n]}</option>{/each}
					</select>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-live="polite">
		<h2>Interactions</h2>
		{#if !profil.traitements.some(actif)}
			<p class="muted">Déclarez un traitement pour vérifier ses interactions.</p>
		{:else}
			{#each Object.entries(CATEGORIES) as [cat, c] (cat)}
				{@const items = resultat.alertes.filter((a) => a.categorie === cat)}
				{#if items.length}
					<div class={`bloc ${cat}`}>
						<h3>{c.titre} ({items.length})</h3>
						<p class="muted small">{c.aide}</p>
						<ul>
							{#each items as a (a.id)}
								<li>
									<p><Pastille niveau={a.preuve} /> <strong>{nomCote(a.a)}</strong> × <strong>{nomCote(a.b)}</strong></p>
									<p class="small">{a.effet}</p>
									<p class="muted small">
										Gravité : {a.gravite === 'inconnue' ? 'non évaluée' : a.gravite}.
										{a.conduite ?? 'Aucune conduite sourcée : demandez à votre pharmacien ou à votre médecin.'}
										{#if a.sources.length}Sources : {a.sources.map((s) => s.pmid ? `PMID ${s.pmid}` : 'texte officiel').join(', ')}.{/if}
									</p>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/each}
			{#if resultat.a_renseigner.length}
				<div class="bloc renseigner">
					<h3>À renseigner</h3>
					<p class="muted small">Ces habitudes comptent pour vos traitements, mais elles ne sont pas déclarées : aucune vérification n’a pu être faite.</p>
					<ul>
						{#each resultat.a_renseigner as r (r.habitude)}
							<li>{data.habitudes.find((h) => h.id === r.habitude)?.nom ?? r.habitude} ({r.interactions.length})</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if !resultat.alertes.length && !resultat.a_renseigner.length}
				<p class="muted">Aucune interaction connue dans la bibliothèque pour ces déclarations. La bibliothèque ne couvre aujourd’hui que les anticoagulants et antiagrégants : ce n’est pas une garantie.</p>
			{/if}
		{/if}
	</section>

	<section>
		<h2>Bilan</h2>
		<p class="muted small">Résumé de vos séances et mesures sur 30 jours, 3 mois ou 1 an ; exports CSV pour analyser vous-même.</p>
		<a class="lien-bouton" href={resolve('/bilan')}>Ouvrir mon bilan</a>
	</section>

	<section>
		<h2>Sauvegarde</h2>
		<p class="muted small">Profil, mesures de forme et séances de muscu sont stockés dans ce navigateur seulement. Vider les données du site les efface : exportez régulièrement. Le fichier n’est ni chiffré ni envoyé.</p>
		<div class="actions">
			<button type="button" onclick={telecharger}>Exporter (JSON)</button>
			<label class="fichier">Importer<input type="file" accept="application/json,.json" onchange={restaurer} /></label>
		</div>
		{#if message}<p class="small" role="status">{message}</p>{/if}
	</section>
</div>

<style>
	.actions { display: flex; gap: 8px; }
	.lien-bouton { display: grid; place-items: center; min-height: 44px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); text-decoration: none; font-weight: 600; }
	.fichier { flex: none; font: inherit; font-size: 0.86rem; padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); cursor: pointer; }
	.fichier input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.page { padding: 20px 16px 32px; display: grid; gap: 22px; }
	.eyebrow { margin: 0 0 4px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
	.avert { color: var(--bad); }
	section { display: grid; gap: 8px; }
	.liste { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
	.liste li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; background: var(--surface); }
	label { flex: 1; }
	input[type='search'], select { font: inherit; padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); max-width: 100%; }
	button { font: inherit; font-size: 0.86rem; padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--soft); color: var(--ink); }
	.bloc { border: 1px solid var(--line); border-left-width: 4px; border-radius: 10px; padding: 12px; background: var(--surface); display: grid; gap: 6px; }
	.bloc ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
	.bloc p { margin: 0; }
	.alerte { border-left-color: var(--bad); }
	.prudence { border-left-color: var(--warn); }
	.aucune_donnee, .renseigner { border-left-color: var(--muted); }
	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
