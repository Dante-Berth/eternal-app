export function telecharger(nom: string, texte: string, type: string) {
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([texte], { type }));
	a.download = nom;
	a.click();
	URL.revokeObjectURL(a.href);
}
