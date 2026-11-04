/// <reference lib="webworker" />
import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `eternal-${version}`;
// Tout le site est précaché : code, coquilles des pages, et données de la bibliothèque (lecture hors ligne).
const RESSOURCES = [...new Set([...immutable, ...assets, ...prerendered].map((r) => r.path as string))];

self.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(RESSOURCES)).then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches.keys()
			.then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event: FetchEvent) => {
	const requete = event.request;
	if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const enCache = await cache.match(requete, { ignoreSearch: true });
			if (enCache) return enCache;
			try {
				return await fetch(requete);
			} catch (erreur) {
				// Hors ligne sur une page jamais vue : coquille de la bibliothèque plutôt qu'une erreur réseau.
				if (requete.mode === 'navigate') {
					const secours = await cache.match('/');
					if (secours) return secours;
				}
				throw erreur;
			}
		})(),
	);
});
