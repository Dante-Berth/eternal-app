// Site statique sans serveur (decisions.md). Les pages sont prérendues comme simples coquilles : le contenu vient de
// /data/*.json, chargé côté client et mis en cache par le service worker pour la lecture hors ligne.
export const prerender = true;
export const ssr = false;
