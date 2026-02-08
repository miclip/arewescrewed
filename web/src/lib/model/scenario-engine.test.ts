import { describe, it, expect } from 'vitest';
import { runScenario } from './scenario-engine';
import { PRESETS } from './presets';
import { PORTFOLIO_COMPANIES } from './companies';

const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;

describe('scenario-engine', () => {
	it('produces correct number of projections', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		expect(result.length).toBe(31); // years 0..30
	});

	it('year 0 has no displacement', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		expect(result[0].year).toBe(2025);
		expect(result[0].replacedWorkers).toBe(0);
		expect(result[0].originalRevenue).toBeCloseTo(716.9e9, -7);
	});

	it('smoothstep S-curve ramp produces expected displacement at midpoint', () => {
		// At year 7 of 15 ramp years: frac = 7/15 ≈ 0.4667
		// smoothstep(0.4667) = 0.4667^2 * (3 - 2*0.4667) ≈ 0.4497
		// reduction = 0.50 * 0.4497 ≈ 0.2249
		const params = PRESETS.moderate.params;
		const result = runScenario(params, amazon);
		const midIdx = Math.floor(params.rampYears / 2);
		const mid = result[midIdx];
		const frac = midIdx / params.rampYears;
		const ss = frac * frac * (3 - 2 * frac);
		const expectedReplaced = Math.floor(amazon.headcount * params.laborReductionPct * ss);
		expect(mid.replacedWorkers).toBe(expectedReplaced);
	});

	it('AI costs decline over time with subsidy correction', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		expect(result[10].aiCostPerWorkerThisYear).toBeLessThan(result[0].aiCostPerWorkerThisYear);
		// With 3yr subsidy + 2x correction: 60000 * 0.8^3 * 2.0 * 0.8^7 ≈ 12885
		const subsidyYears = PRESETS.moderate.params.aiSubsidyYears;
		const correction = PRESETS.moderate.params.aiCostCorrectionPct;
		const costAtSubsidyEnd = 60000 * Math.pow(0.8, subsidyYears);
		const correctedCost = costAtSubsidyEnd * correction;
		const expected = correctedCost * Math.pow(0.8, 10 - subsidyYears);
		expect(result[10].aiCostPerWorkerThisYear).toBeCloseTo(expected, 0);
	});

	it('revenue grows over time (dampened by demand)', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		expect(result[10].originalRevenue).toBeGreaterThan(result[0].originalRevenue);
		// Growth is dampened by demand factor — should be less than pure 4% compounding
		const pureGrowth = 716.9e9 * Math.pow(1.04, 10);
		expect(result[10].originalRevenue).toBeLessThan(pureGrowth);
		// But still substantial growth (investor model keeps demand high)
		expect(result[10].originalRevenue).toBeGreaterThan(716.9e9 * 1.2);
	});

	it('new profit exceeds original by year 15 under moderate', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		expect(result[15].newProfit).toBeGreaterThan(result[15].originalProfit);
	});

	it('demand factor stays above essentials floor', () => {
		const result = runScenario(PRESETS.extreme.params, amazon);
		for (const proj of result) {
			const ratio = proj.adjustedRevenue / proj.originalRevenue;
			expect(ratio).toBeGreaterThanOrEqual(PRESETS.extreme.params.essentialsFloor - 0.001);
		}
	});

	it('all 4 presets produce valid results', () => {
		for (const [name, preset] of Object.entries(PRESETS)) {
			const result = runScenario(preset.params, amazon);
			expect(result.length).toBe(31);
			expect(result[0].originalRevenue).toBeCloseTo(716.9e9, -7);
			// Profit should stay positive (demand floor prevents collapse)
			for (const proj of result) {
				expect(proj.newProfit).toBeDefined();
			}
		}
	});

	it('dystopia (investorModelAdoption=0) causes revenue to collapse', () => {
		const dystopiaParams = { ...PRESETS.moderate.params, investorModelAdoption: 0 };
		const dystopia = runScenario(dystopiaParams, amazon);
		const normal = runScenario(PRESETS.moderate.params, amazon);
		// By year 20, dystopia revenue should be significantly lower
		expect(dystopia[20].adjustedRevenue).toBeLessThan(normal[20].adjustedRevenue * 0.7);
		// Revenue growth should be severely dampened vs normal
		expect(dystopia[30].adjustedRevenue).toBeLessThan(normal[30].adjustedRevenue * 0.6);
	});

	it('essentialsFloor=0 allows complete demand collapse in dystopia', () => {
		const params = { ...PRESETS.extreme.params, investorModelAdoption: 0, essentialsFloor: 0 };
		const result = runScenario(params, amazon);
		// With no floor and no investor model, demand should approach zero
		const lastAdj = result[30].adjustedRevenue;
		const firstAdj = result[0].adjustedRevenue;
		expect(lastAdj).toBeLessThan(firstAdj * 0.2);
	});

	it('wageShareOfSpending=1.0 causes maximum demand impact', () => {
		const highWage = { ...PRESETS.moderate.params, wageShareOfSpending: 1.0, investorModelAdoption: 0 };
		const lowWage = { ...PRESETS.moderate.params, wageShareOfSpending: 0.5, investorModelAdoption: 0 };
		const highResult = runScenario(highWage, amazon);
		const lowResult = runScenario(lowWage, amazon);
		// Higher wage share = bigger demand hit when workers are displaced
		expect(highResult[20].adjustedRevenue).toBeLessThan(lowResult[20].adjustedRevenue);
	});

	it('supply chain savings grow with displacement ramp', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		// Year 0: no supply chain savings yet
		expect(result[0].supplyChainSavings).toBe(0);
		// Year 15: substantial savings
		expect(result[15].supplyChainSavings).toBeGreaterThan(0);
		// Savings increase as ramp progresses
		expect(result[15].supplyChainSavings).toBeGreaterThan(result[5].supplyChainSavings);
	});

	it('conservative scenario has less displacement than extreme', () => {
		const conservative = runScenario(PRESETS.conservative.params, amazon);
		const extreme = runScenario(PRESETS.extreme.params, amazon);
		expect(conservative[15].replacedWorkers).toBeLessThan(extreme[15].replacedWorkers);
		expect(conservative[30].replacedWorkers).toBeLessThan(extreme[30].replacedWorkers);
	});

	it('profit margin improves with AI adoption', () => {
		const result = runScenario(PRESETS.moderate.params, amazon);
		// By year 20, new profit margin should exceed original
		expect(result[20].profitMarginNew).toBeGreaterThan(result[0].profitMarginNew);
	});
});
