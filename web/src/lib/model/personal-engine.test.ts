import { describe, it, expect } from 'vitest';
import {
	computePersonalOutcome,
	computeAllScenarios,
	resolvePresetParams
} from './personal-engine';
import { buildEqualWeightPortfolio, runPortfolioScenario } from './portfolio-engine';
import { PORTFOLIO_COMPANIES } from './companies';
import { PRESETS, type PresetName } from './presets';
import type { PersonalInputs, ScenarioParams } from './types';

// The portfolio run is now supplied by the caller (it depends only on the
// scenario, so the store layer caches it). These helpers keep the tests reading
// the way they did before that change.
const ALLOCATIONS = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);

function outcome(inputs: PersonalInputs, params: ScenarioParams, label: string) {
	return computePersonalOutcome(
		inputs,
		params,
		label,
		runPortfolioScenario(params, label, ALLOCATIONS)
	);
}

function allScenarios(
	inputs: PersonalInputs,
	customParams?: ScenarioParams,
	activePreset?: PresetName
) {
	const presets = resolvePresetParams(customParams, activePreset);
	return computeAllScenarios(
		inputs,
		presets,
		presets.map((e) => runPortfolioScenario(e.params, e.label, ALLOCATIONS))
	);
}

const defaultInputs: PersonalInputs = {
	incomeTarget: 75_000,
	currentSavings: 50_000,
	monthlySavings: 1_000,
	selectedSector: 'Technology/Software'
};

describe('personal-engine', () => {
	it('required portfolio = income / 4% SWR', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.requiredPortfolio).toBe(75_000 / 0.04);
		expect(result.requiredPortfolio).toBe(1_875_000);
	});

	it('accumulation path starts at current savings', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.accumulationPath[0].value).toBe(50_000);
		expect(result.accumulationPath[0].year).toBe(2025);
	});

	it('accumulation grows over time', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		const last = result.accumulationPath[result.accumulationPath.length - 1];
		expect(last.value).toBeGreaterThan(defaultInputs.currentSavings);
	});

	it('technology sector displacement year is reasonable under moderate', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		// Tech: 45% displacement (baseline), moderate doesn't scale it (50%/50% = 1x)
		// 45% < 50% threshold, so uses half-of-max → smoothstep(t) = 0.5 → t ≈ 0.5
		// effectiveRamp = 16 * (15/15) = 16, so ~2025 + 8 = 2033
		expect(result.displacementYear).toBeGreaterThanOrEqual(2031);
		expect(result.displacementYear).toBeLessThanOrEqual(2035);
	});

	it('higher savings reduces gap', () => {
		const lowSave = outcome(
			{ ...defaultInputs, monthlySavings: 500 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const highSave = outcome(
			{ ...defaultInputs, monthlySavings: 3000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(highSave.gap).toBeGreaterThan(lowSave.gap);
	});

	it('verdict changes based on gap', () => {
		// Very high savings should be on_track
		const richPerson = outcome(
			{ ...defaultInputs, currentSavings: 2_000_000, monthlySavings: 5000 },
			PRESETS.conservative.params,
			'Conservative'
		);
		expect(richPerson.verdict).toBe('on_track');
	});

	it('computeAllScenarios returns 4 outcomes', () => {
		const results = allScenarios(defaultInputs);
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
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		const yr15Value = result.accumulationPath[15]?.value ?? 0;
		expect(yr15Value).toBeGreaterThan(300_000);
		expect(yr15Value).toBeLessThan(1_500_000);
	});

	it('different sectors produce different displacement years', () => {
		const warehouse = outcome(
			{ ...defaultInputs, selectedSector: 'Warehouse/Logistics' },
			PRESETS.moderate.params,
			'Moderate'
		);
		const education = outcome(
			{ ...defaultInputs, selectedSector: 'Education' },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(warehouse.displacementYear).toBeLessThan(education.displacementYear);
	});

	it('computeAllScenarios with custom params applies diff to all presets', () => {
		// Customize moderate's wageShareOfSpending
		const customParams = { ...PRESETS.moderate.params, wageShareOfSpending: 0.5 };
		const results = allScenarios(defaultInputs, customParams, 'moderate');
		// All 4 scenarios should reflect the customization
		expect(results.length).toBe(4);
		// The customized param should affect outcomes differently than default
		const defaultResults = allScenarios(defaultInputs);
		// With lower wageShareOfSpending, demand holds up better → bigger portfolios
		for (let i = 0; i < 4; i++) {
			// More favorable demand → higher portfolio at displacement
			expect(results[i].portfolioAtDisplacement).toBeGreaterThanOrEqual(
				defaultResults[i].portfolioAtDisplacement * 0.9 // allow some tolerance
			);
		}
	});

	it('zero savings results in gap verdict', () => {
		const result = outcome(
			{ ...defaultInputs, currentSavings: 0, monthlySavings: 0 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(result.verdict).toBe('gap');
		expect(result.gap).toBeLessThan(0);
		expect(result.portfolioAtDisplacement).toBeLessThan(result.requiredPortfolio);
	});

	it('extreme scenario displaces sooner than conservative', () => {
		const extreme = outcome(defaultInputs, PRESETS.extreme.params, 'Extreme');
		const conservative = outcome(defaultInputs, PRESETS.conservative.params, 'Conservative');
		expect(extreme.displacementYear).toBeLessThan(conservative.displacementYear);
	});

	it('higher income target requires larger portfolio', () => {
		const low = outcome(
			{ ...defaultInputs, incomeTarget: 50_000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		const high = outcome(
			{ ...defaultInputs, incomeTarget: 150_000 },
			PRESETS.moderate.params,
			'Moderate'
		);
		expect(high.requiredPortfolio).toBe(150_000 / 0.04);
		expect(low.requiredPortfolio).toBe(50_000 / 0.04);
		expect(high.requiredPortfolio).toBeGreaterThan(low.requiredPortfolio);
	});

	it('monthlyNeededToClose is positive when there is a gap', () => {
		const result = outcome(
			{ ...defaultInputs, currentSavings: 0, monthlySavings: 100 },
			PRESETS.moderate.params,
			'Moderate'
		);
		if (result.gap < 0) {
			expect(result.monthlyNeededToClose).toBeGreaterThan(0);
		}
	});

	it('accumulation path has correct length', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.accumulationPath.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});

	it('applies each portfolio year return exactly once (no duplicated first year)', () => {
		const params = PRESETS.moderate.params;
		const noSavings = { ...defaultInputs, currentSavings: 100_000, monthlySavings: 0 };
		const result = outcome(noSavings, params, 'Moderate');
		const path = result.accumulationPath;

		const implied = path.slice(1).map((p, i) => p.value / path[i].value - 1);
		// The first two steps used to be identical because year 0's return was
		// applied twice, shifting every later year by one.
		expect(implied[0]).not.toBeCloseTo(implied[1], 9);

		const portfolio = runPortfolioScenario(params, 'Moderate', ALLOCATIONS);
		const expectedFirst =
			portfolio.yearlyResults[1].portfolioValue / portfolio.yearlyResults[0].portfolioValue - 1;
		const expectedSecond =
			portfolio.yearlyResults[2].portfolioValue / portfolio.yearlyResults[1].portfolioValue - 1;
		expect(implied[0]).toBeCloseTo(expectedFirst, 9);
		expect(implied[1]).toBeCloseTo(expectedSecond, 9);
	});

	it('flags displacement past the projection horizon and clamps reported values', () => {
		const params = { ...PRESETS.moderate.params, laborReductionPct: 0.85, rampYears: 30 };
		const result = outcome({ ...defaultInputs, selectedSector: 'Healthcare' }, params, 'Custom');
		const path = result.accumulationPath;
		const lastYear = path[path.length - 1].year;

		expect(result.displacementYear).toBeGreaterThan(lastYear);
		expect(result.displacementBeyondHorizon).toBe(true);
		// Reported portfolio must be a value that exists on the plotted path.
		expect(result.portfolioAtDisplacement).toBe(path[path.length - 1].value);
		expect(result.verdictMessage).toContain(String(lastYear));
	});

	it('does not flag displacement inside the horizon', () => {
		const result = outcome(defaultInputs, PRESETS.moderate.params, 'Moderate');
		expect(result.displacementBeyondHorizon).toBe(false);
		const idx = result.displacementYear - PRESETS.moderate.params.baseYear;
		expect(result.portfolioAtDisplacement).toBe(result.accumulationPath[idx].value);
	});
});
