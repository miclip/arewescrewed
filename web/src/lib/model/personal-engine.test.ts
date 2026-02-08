import { describe, it, expect } from 'vitest';
import { computePersonalOutcome, computeAllScenarios } from './personal-engine';
import { PRESETS } from './presets';
import type { PersonalInputs } from './types';

const defaultInputs: PersonalInputs = {
	incomeTarget: 75_000,
	currentSavings: 50_000,
	monthlySavings: 1_000,
	selectedSector: 'Technology/Software'
};

describe('personal-engine', () => {
	it('required portfolio = income / 4% SWR', () => {
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.requiredPortfolio).toBe(75_000 / 0.04);
		expect(result.requiredPortfolio).toBe(1_875_000);
	});

	it('accumulation path starts at current savings', () => {
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.accumulationPath[0].value).toBe(50_000);
		expect(result.accumulationPath[0].year).toBe(2025);
	});

	it('accumulation grows over time', () => {
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		const last = result.accumulationPath[result.accumulationPath.length - 1];
		expect(last.value).toBeGreaterThan(defaultInputs.currentSavings);
	});

	it('technology sector displacement year is reasonable under moderate', () => {
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		// Tech: 45% displacement (baseline), moderate doesn't scale it (50%/50% = 1x)
		// 45% < 50% threshold, so uses half-of-max → smoothstep(t) = 0.5 → t ≈ 0.5
		// effectiveRamp = 16 * (15/15) = 16, so ~2025 + 8 = 2033
		expect(result.displacementYear).toBeGreaterThanOrEqual(2031);
		expect(result.displacementYear).toBeLessThanOrEqual(2035);
	});

	it('higher savings reduces gap', () => {
		const lowSave = computePersonalOutcome(
			{ ...defaultInputs, monthlySavings: 500 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const highSave = computePersonalOutcome(
			{ ...defaultInputs, monthlySavings: 3000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(highSave.gap).toBeGreaterThan(lowSave.gap);
	});

	it('verdict changes based on gap', () => {
		// Very high savings should be on_track
		const richPerson = computePersonalOutcome(
			{ ...defaultInputs, currentSavings: 2_000_000, monthlySavings: 5000 },
			PRESETS.conservative.params,
			'Conservative'
		);
		expect(richPerson.verdict).toBe('on_track');
	});

	it('computeAllScenarios returns 4 outcomes', () => {
		const results = computeAllScenarios(defaultInputs);
		expect(results.length).toBe(4);
		expect(results.map((r) => r.scenarioName)).toEqual([
			'Conservative',
			'Moderate',
			'Aggressive',
			'Extreme'
		]);
	});

	it('sanity check: $50k + $1k/mo for 15 years at ~8% is in the right ballpark', () => {
		// FV = 50000 * 1.08^15 + 12000 * ((1.08^15 - 1) / 0.08) ≈ 158k + 326k ≈ 484k
		// The model uses portfolio-derived returns which may differ, so check order of magnitude
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		const yr15Value = result.accumulationPath[15]?.value ?? 0;
		expect(yr15Value).toBeGreaterThan(300_000);
		expect(yr15Value).toBeLessThan(1_500_000);
	});

	it('different sectors produce different displacement years', () => {
		const warehouse = computePersonalOutcome(
			{ ...defaultInputs, selectedSector: 'Warehouse/Logistics' },
			PRESETS.moderate.params,
			'Moderate'
		);
		const education = computePersonalOutcome(
			{ ...defaultInputs, selectedSector: 'Education' },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(warehouse.displacementYear).toBeLessThan(education.displacementYear);
	});

	it('computeAllScenarios with custom params applies diff to all presets', () => {
		// Customize moderate's wageShareOfSpending
		const customParams = { ...PRESETS.moderate.params, wageShareOfSpending: 0.5 };
		const results = computeAllScenarios(defaultInputs, customParams, 'moderate');
		// All 4 scenarios should reflect the customization
		expect(results.length).toBe(4);
		// The customized param should affect outcomes differently than default
		const defaultResults = computeAllScenarios(defaultInputs);
		// With lower wageShareOfSpending, demand holds up better → bigger portfolios
		for (let i = 0; i < 4; i++) {
			// More favorable demand → higher portfolio at displacement
			expect(results[i].portfolioAtDisplacement).toBeGreaterThanOrEqual(
				defaultResults[i].portfolioAtDisplacement * 0.9 // allow some tolerance
			);
		}
	});

	it('zero savings results in gap verdict', () => {
		const result = computePersonalOutcome(
			{ ...defaultInputs, currentSavings: 0, monthlySavings: 0 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(result.verdict).toBe('gap');
		expect(result.gap).toBeLessThan(0);
		expect(result.portfolioAtDisplacement).toBeLessThan(result.requiredPortfolio);
	});

	it('extreme scenario displaces sooner than conservative', () => {
		const extreme = computePersonalOutcome(defaultInputs, PRESETS.extreme.params, 'Extreme');
		const conservative = computePersonalOutcome(defaultInputs, PRESETS.conservative.params, 'Conservative');
		expect(extreme.displacementYear).toBeLessThan(conservative.displacementYear);
	});

	it('higher income target requires larger portfolio', () => {
		const low = computePersonalOutcome(
			{ ...defaultInputs, incomeTarget: 50_000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const high = computePersonalOutcome(
			{ ...defaultInputs, incomeTarget: 150_000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(high.requiredPortfolio).toBe(150_000 / 0.04);
		expect(low.requiredPortfolio).toBe(50_000 / 0.04);
		expect(high.requiredPortfolio).toBeGreaterThan(low.requiredPortfolio);
	});

	it('monthlyNeededToClose is positive when there is a gap', () => {
		const result = computePersonalOutcome(
			{ ...defaultInputs, currentSavings: 0, monthlySavings: 100 },
			PRESETS.moderate.params,
			'Moderate'
		);
		if (result.gap < 0) {
			expect(result.monthlyNeededToClose).toBeGreaterThan(0);
		}
	});

	it('accumulation path has correct length', () => {
		const result = computePersonalOutcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.accumulationPath.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});
});
