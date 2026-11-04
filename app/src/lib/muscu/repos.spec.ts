import { describe, expect, it } from 'vitest';
import { afficher, reste } from './repos.js';

describe('minuteur de repos', () => {
	it('compte jusqu’à l’heure de fin sans passer sous zéro', () => {
		expect(reste(10_000, 0)).toBe(10);
		expect(reste(10_000, 9_001)).toBe(1);
		expect(reste(10_000, 12_000)).toBe(0);
	});
	it('formate en m:ss', () => {
		expect(afficher(90)).toBe('1:30');
		expect(afficher(5)).toBe('0:05');
		expect(afficher(0)).toBe('0:00');
	});
});
