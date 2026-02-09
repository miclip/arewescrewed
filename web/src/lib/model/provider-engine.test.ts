import { describe, it, expect } from 'vitest';
import {
	computeProviderProjections,
	computeCapturedValues,
	DEFAULT_PROVIDER_PARAMS,
	CAPTURED_STAKES,
	type ProviderParams
} from './provider-engine';
import { runScenario } from './scenario-engine';
import { PORTFOLIO_COMPANIES } from './companies';
import { PRESETS, PRESET_ORDER } from './presets';

/** Helper: run the full provider pipeline for a given preset */
function runProviderForPreset(presetName: keyof typeof PRESETS, overrides?: Partial<ProviderParams>) {
	const params = PRESETS[presetName].params;
	const companyProjections = PORTFOLIO_COMPANIES.map((c) => runScenario(params, c));
	const providerParams = { ...DEFAULT_PROVIDER_PARAMS, ...overrides };
	return computeProviderProjections(companyProjections, providerParams, params);
}

describe('provider-engine', () => {
	it('correct projection length', () => {
		const result = runProviderForPreset('moderate');
		expect(result.length).toBe(PRESETS.moderate.params.yearsForward + 1);
	});

	it('year 0 revenue matches sum of aiComputeCost × scale factor', () => {
		const params = PRESETS.moderate.params;
		const companyProjections = PORTFOLIO_COMPANIES.map((c) => runScenario(params, c));
		const result = computeProviderProjections(
			companyProjections,
			DEFAULT_PROVIDER_PARAMS,
			params
		);
		const yr0AiSpend = companyProjections.reduce((sum, cp) => sum + cp[0].aiComputeCost, 0);
		expect(result[0].totalAiSpend).toBeCloseTo(yr0AiSpend, 0);
		expect(result[0].economyAiSpend).toBeCloseTo(
			yr0AiSpend * DEFAULT_PROVIDER_PARAMS.economyScaleFactor,
			0
		);
	});

	it('revenue forms a hump shape (rises then falls)', () => {
		const result = runProviderForPreset('moderate');
		// Find peak revenue
		let peakIdx = 0;
		let peakRevenue = 0;
		for (let i = 0; i < result.length; i++) {
			if (result[i].providerRevenue > peakRevenue) {
				peakRevenue = result[i].providerRevenue;
				peakIdx = i;
			}
		}
		// Peak should not be at year 0 or the last year
		expect(peakIdx).toBeGreaterThan(0);
		expect(peakIdx).toBeLessThan(result.length - 1);
		// Revenue after peak should decline
		expect(result[result.length - 1].providerRevenue).toBeLessThan(peakRevenue);
	});

	it('margins expand over time', () => {
		const result = runProviderForPreset('moderate');
		expect(result[15].providerGrossMargin).toBeGreaterThan(result[0].providerGrossMargin);
	});

	it('margins do not exceed cap', () => {
		const result = runProviderForPreset('moderate');
		for (const yr of result) {
			expect(yr.providerGrossMargin).toBeLessThanOrEqual(
				DEFAULT_PROVIDER_PARAMS.providerMarginCap + 0.001
			);
		}
	});

	it('profit is non-negative', () => {
		const result = runProviderForPreset('moderate');
		for (const yr of result) {
			expect(yr.providerProfit).toBeGreaterThanOrEqual(0);
		}
	});

	it('market cap = profit × P/E', () => {
		const result = runProviderForPreset('moderate');
		const yr10 = result[10];
		expect(yr10.providerMarketCap).toBeCloseTo(
			yr10.providerProfit * DEFAULT_PROVIDER_PARAMS.peMultiple,
			0
		);
	});

	it('cumulative revenue is monotonically increasing', () => {
		const result = runProviderForPreset('moderate');
		for (let i = 1; i < result.length; i++) {
			expect(result[i].cumulativeProviderRevenue).toBeGreaterThanOrEqual(
				result[i - 1].cumulativeProviderRevenue
			);
		}
	});

	it('extreme scenario has higher peak revenue than conservative', () => {
		const conservative = runProviderForPreset('conservative');
		const extreme = runProviderForPreset('extreme');
		const peakCons = Math.max(...conservative.map((r) => r.providerRevenue));
		const peakExt = Math.max(...extreme.map((r) => r.providerRevenue));
		expect(peakExt).toBeGreaterThan(peakCons);
	});

	it('all 4 presets produce valid results (no NaN)', () => {
		for (const name of PRESET_ORDER) {
			const result = runProviderForPreset(name);
			expect(result.length).toBeGreaterThan(0);
			for (const yr of result) {
				expect(Number.isNaN(yr.providerRevenue)).toBe(false);
				expect(Number.isNaN(yr.providerProfit)).toBe(false);
				expect(Number.isNaN(yr.providerMarketCap)).toBe(false);
			}
		}
	});

	it('computeCapturedValues distributes market cap', () => {
		const captured = computeCapturedValues(1_000_000_000_000); // $1T
		expect(captured.length).toBeGreaterThan(0);
		const totalValue = captured.reduce((sum, c) => sum + c.value, 0);
		// Total captured should be less than total market cap
		expect(totalValue).toBeLessThan(1_000_000_000_000);
		expect(totalValue).toBeGreaterThan(0);
	});

	it('CAPTURED_STAKES has expected owners', () => {
		const owners = [...new Set(CAPTURED_STAKES.map((s) => s.owner))];
		expect(owners).toContain('Microsoft');
		expect(owners).toContain('Amazon');
		expect(owners).toContain('Google');
	});

	it('training/R&D cost is 0 at year 0 (no provider revenue yet)', () => {
		const result = runProviderForPreset('moderate');
		// Year 0: no displacement → no AI spend → no revenue → training capped at 0
		expect(result[0].trainingRdCost).toBe(0);
	});

	it('training/R&D cost grows with revenue then caps at available profit', () => {
		const result = runProviderForPreset('moderate');
		// By year 5, there's real revenue and training costs are positive
		expect(result[5].trainingRdCost).toBeGreaterThan(0);
		// Training costs are always <= gross profit - labor (can't exceed what's available)
		for (const yr of result) {
			const grossProfit = yr.providerRevenue * yr.providerGrossMargin;
			expect(yr.trainingRdCost).toBeLessThanOrEqual(grossProfit - yr.providerLaborCost + 1);
		}
	});

	it('higher training cost reduces profit', () => {
		const lowTraining = runProviderForPreset('moderate', { baseAnnualTrainingCost: 10e9 });
		const highTraining = runProviderForPreset('moderate', { baseAnnualTrainingCost: 60e9 });
		const yr10Low = lowTraining[10];
		const yr10High = highTraining[10];
		expect(yr10High.providerProfit).toBeLessThan(yr10Low.providerProfit);
	});

	it('all stakes have source URLs', () => {
		for (const stake of CAPTURED_STAKES) {
			expect(stake.sourceUrl).toBeTruthy();
			expect(stake.sourceUrl.startsWith('https://')).toBe(true);
		}
	});
});
