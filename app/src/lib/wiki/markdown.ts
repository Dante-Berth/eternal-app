import { Marked, type Tokens } from 'marked';

const RE_TAG = /\[([ABCDM?])((?:, [^\]]*)?)\]/g;

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Remplace les tags de preuve [A], [B, cohorte]… par une pastille, hors des balises HTML. */
export function pastilles(html: string): string {
	return html
		.split(/(<[^>]+>)/)
		.map((morceau) => morceau.startsWith('<') ? morceau : morceau.replace(RE_TAG, (_m, lettre: string, qualif: string) => {
			const k = lettre === '?' ? 'Q' : lettre;
			const titre = `Niveau de preuve ${lettre}${qualif ? esc(qualif) : ''}`;
			return `<span class="ev ev-${k} ev-inline" title="${titre}">${lettre}</span>${qualif ? `<span class="ev-qualif">${esc(qualif.slice(2))}</span>` : ''}`;
		}))
		.join('');
}

/**
 * Markdown d'une fiche → HTML. Les liens `fiche:<id>` deviennent des liens internes (via `lienFiche`),
 * le HTML brut est échappé, les liens externes s'ouvrent sans référent.
 */
export function rendre(markdown: string, lienFiche: (id: string) => string): string {
	const marked = new Marked({ gfm: true, breaks: false });
	marked.use({
		renderer: {
			html({ text }: Tokens.HTML | Tokens.Tag) {
				return esc(text);
			},
			link({ href, title, tokens }: Tokens.Link) {
				const texte = this.parser.parseInline(tokens);
				const t = title ? ` title="${esc(title)}"` : '';
				if (href.startsWith('fiche:')) return `<a href="${esc(lienFiche(href.slice(6)))}"${t}>${texte}</a>`;
				if (/^https?:/.test(href)) return `<a href="${esc(href)}"${t} rel="noopener noreferrer" target="_blank">${texte}</a>`;
				return `<span class="lien-mort">${texte}</span>`;
			},
		},
	});
	return pastilles(marked.parse(markdown, { async: false }));
}
