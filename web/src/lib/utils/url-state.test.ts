import { describe, it, expect } from 'vitest';
import { encodeUrlState, decodeUrlState } from './url-state';
import { PRESETS } from '$lib/model/presets';
import type { PersonalInputs } from '$lib/model/types';

const personal: PersonalInputs = {
	incomeTarget: 75_000,
	currentSavings: 50_000,
	monthlySavings: 1_000,
	selectedSector: 'Technology/Software'
};

describe('url-state', () => {
	it('round-trips personal inputs', () => {
		const encoded = encodeUrlState(personal, 'moderate', PRESETS.moderate.params);
		const decoded = decodeUrlState(encoded);
		expect(decoded?.personal).toEqual(personal);
		expect(decoded?.preset).toBe('moderate');
	});

	it('round-trips customized params', () => {
		const params = { ...PRESETS.moderate.params, laborReductionPct: 0.75, essentialsFloor: 0.25 };
		const decoded = decodeUrlState(encodeUrlState(personal, 'moderate', params));
		expect(decoded?.params?.laborReductionPct).toBe(0.75);
		expect(decoded?.params?.essentialsFloor).toBe(0.25);
	});

	it('encodes wageShareOfSpending and essentialsFloor', () => {
		const params = { ...PRESETS.moderate.params, wageShareOfSpending: 0.55 };
		const decoded = decodeUrlState(encodeUrlState(personal, 'moderate', params));
		expect(decoded?.params?.wageShareOfSpending).toBe(0.55);
	});

	it('drops non-numeric params instead of producing NaN', () => {
		const decoded = decodeUrlState('?p=moderate&lr=abc');
		expect(decoded).not.toBeNull();
		expect(decoded?.params?.laborReductionPct).toBeUndefined();
		for (const v of Object.values(decoded!.params ?? {})) {
			expect(Number.isFinite(v)).toBe(true);
		}
	});

	it('clamps out-of-range params to slider bounds', () => {
		const decoded = decodeUrlState('?p=moderate&lr=100&ry=-5');
		expect(decoded?.params?.laborReductionPct).toBe(0.95);
		expect(decoded?.params?.rampYears).toBe(3);
	});

	it('falls back to defaults for unusable personal inputs', () => {
		const decoded = decodeUrlState('?p=moderate&inc=notanumber&sec=NotASector');
		expect(decoded?.personal.incomeTarget).toBe(75_000);
		expect(decoded?.personal.selectedSector).toBe('Technology/Software');
	});

	it('returns null without a valid preset', () => {
		expect(decodeUrlState('?inc=75000')).toBeNull();
		expect(decodeUrlState('?p=nonsense')).toBeNull();
	});
});
