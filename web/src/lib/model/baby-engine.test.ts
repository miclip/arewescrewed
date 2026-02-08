import { describe, it, expect } from 'vitest';
import { computeBabyOutcome } from './baby-engine';
import { PRESETS, PRESET_ORDER } from './presets';
import type { BabyInputs } from './baby-engine';

const defaultInputs: BabyInputs = {
	giftAmount: 50_000,
	unlockAge: 21
};

describe('baby-engine', () => {
	it('grant compounds correctly — year 0 = giftAmount', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.growthPath[0].value).toBe(50_000);
		expect(result.growthPath[0].age).toBe(0);
	});

	it('unlock age milestone values are positive and > giftAmount', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.valueAtUnlock).toBeGreaterThan(defaultInputs.giftAmount);
		expect(result.annualIncomeAtUnlock).toBeGreaterThan(0);
	});

	it('zero grant = zero growth but valid giftNeeded values', () => {
		const result = computeBabyOutcome(
			{ giftAmount: 0, unlockAge: 21 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(result.valueAtUnlock).toBe(0);
		expect(result.annualIncomeAtUnlock).toBe(0);
		expect(result.valueAt30).toBe(0);
		expect(result.growthPath.every((p) => p.value === 0)).toBe(true);
		// giftNeeded should still be computed from growth rates, not zero
		expect(result.giftNeededFor75k).toBeGreaterThan(0);
		expect(result.giftNeededFor75kAdjusted).toBeGreaterThan(0);
	});

	it('all 4 presets produce valid results', () => {
		for (const name of PRESET_ORDER) {
			const preset = PRESETS[name];
			const result = computeBabyOutcome(defaultInputs, preset.params, preset.label);
			expect(result.growthPath.length).toBeGreaterThan(0);
			expect(result.valueAtUnlock).toBeGreaterThan(0);
			expect(result.birthYear).toBe(preset.params.baseYear);
			expect(result.unlockYear).toBe(preset.params.baseYear + 21);
		}
	});

	it('income = value * 0.04', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.annualIncomeAtUnlock).toBeCloseTo(result.valueAtUnlock * 0.04, 2);
		expect(result.annualIncomeAt30).toBeCloseTo(result.valueAt30 * 0.04, 2);
		for (const point of result.growthPath) {
			expect(point.income).toBeCloseTo(point.value * 0.04, 2);
		}
	});

	it('requiredFor75k is $1.875M', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.requiredFor75k).toBe(1_875_000);
	});

	it('growth path has correct length (yearsForward + 1)', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.growthPath.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});

	it('value grows monotonically in early years', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.conservative.params, 'Conservative');
		for (let i = 1; i <= 3; i++) {
			expect(result.growthPath[i].value).toBeGreaterThanOrEqual(result.growthPath[i - 1].value * 0.95);
		}
	});

	it('larger grant produces proportionally larger outcome', () => {
		const small = computeBabyOutcome(
			{ giftAmount: 5_000, unlockAge: 21 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const large = computeBabyOutcome(
			{ giftAmount: 50_000, unlockAge: 21 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const ratio = large.valueAtUnlock / small.valueAtUnlock;
		expect(ratio).toBeCloseTo(10, 0);
	});

	it('sanity: $50k at ~8% for 21 years ≈ $250k ballpark', () => {
		// FV = 50000 * 1.08^21 ≈ $251,690
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.valueAtUnlock).toBeGreaterThan(100_000);
		expect(result.valueAtUnlock).toBeLessThan(1_000_000);
	});

	it('value at 30 > value at unlock', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.valueAt30).toBeGreaterThan(result.valueAtUnlock);
	});

	it('giftNeededFor75k is positive and reasonable', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.giftNeededFor75k).toBeGreaterThan(0);
		// Should be in the hundreds-of-thousands range (need $1.875M at 21)
		expect(result.giftNeededFor75k).toBeGreaterThan(100_000);
		expect(result.giftNeededFor75k).toBeLessThan(2_000_000);
	});

	it('cost-adjusted grant needed is less than nominal', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.giftNeededFor75kAdjusted).toBeLessThan(result.giftNeededFor75k);
		expect(result.giftNeededFor75kAdjusted).toBeGreaterThan(0);
	});

	it('cost of living path declines over time', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.costOfLivingPath[0].costFraction).toBe(1.0);
		const last = result.costOfLivingPath[result.costOfLivingPath.length - 1];
		expect(last.costFraction).toBeLessThan(1.0);
		expect(result.costFractionAtUnlock).toBeLessThan(1.0);
	});

	it('cost of living path has correct length', () => {
		const result = computeBabyOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.costOfLivingPath.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});
});
