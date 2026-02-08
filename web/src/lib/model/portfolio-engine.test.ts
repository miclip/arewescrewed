import { describe, it, expect } from 'vitest';
import { buildEqualWeightPortfolio, runPortfolioScenario } from './portfolio-engine';
import { PRESETS } from './presets';
import { PORTFOLIO_COMPANIES } from './companies';

describe('buildEqualWeightPortfolio', () => {
	it('allocates equally across all companies', () => {
		const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
		expect(allocations.length).toBe(PORTFOLIO_COMPANIES.length);
		const perCompany = 1_000_000 / PORTFOLIO_COMPANIES.length;
		for (const alloc of allocations) {
			expect(alloc.dollarsInvested).toBeCloseTo(perCompany, 2);
			expect(alloc.weight).toBeCloseTo(1 / PORTFOLIO_COMPANIES.length, 4);
		}
	});

	it('calculates correct shares owned from price', () => {
		const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
		for (const alloc of allocations) {
			const expected = alloc.dollarsInvested / alloc.company.sharePrice;
			expect(alloc.sharesOwned).toBeCloseTo(expected, 4);
		}
	});

	it('total invested matches input', () => {
		const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 500_000);
		const total = allocations.reduce((sum, a) => sum + a.dollarsInvested, 0);
		expect(total).toBeCloseTo(500_000, 2);
	});
});

describe('runPortfolioScenario', () => {
	const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);

	it('produces correct number of yearly results', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		expect(result.yearlyResults.length).toBe(31);
		expect(result.scenarioName).toBe('Moderate');
		expect(result.totalInvested).toBe(1_000_000);
	});

	it('year 0 portfolio value is close to invested amount', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		// Year 0 should be approximately the invested amount (slight variance from profit ratio at year 0)
		expect(result.yearlyResults[0].portfolioValue).toBeGreaterThan(800_000);
		expect(result.yearlyResults[0].portfolioValue).toBeLessThan(1_200_000);
	});

	it('portfolio value grows under moderate scenario', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		expect(result.yearlyResults[15].portfolioValue).toBeGreaterThan(result.yearlyResults[0].portfolioValue);
		expect(result.yearlyResults[30].portfolioValue).toBeGreaterThan(result.yearlyResults[15].portfolioValue);
	});

	it('total income = dividends + capital gains', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		for (const yr of result.yearlyResults) {
			expect(yr.totalIncome).toBeCloseTo(yr.totalDividends + yr.capitalGainsIncome, 2);
		}
	});

	it('capital gains = max(0, SWR income - dividends)', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		for (const yr of result.yearlyResults) {
			const swrIncome = yr.portfolioValue * 0.04;
			const expectedCapGains = Math.max(0, swrIncome - yr.totalDividends);
			expect(yr.capitalGainsIncome).toBeCloseTo(expectedCapGains, 2);
		}
	});

	it('dividends are tracked per company', () => {
		const result = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		const yr15 = result.yearlyResults[15];
		// Should have entries for all companies
		expect(Object.keys(yr15.companyDividends).length).toBe(PORTFOLIO_COMPANIES.length);
		// Sum of per-company dividends should equal total
		const sumDivs = Object.values(yr15.companyDividends).reduce((a, b) => a + b, 0);
		expect(sumDivs).toBeCloseTo(yr15.totalDividends, 2);
	});

	it('dystopia scenario shows lower portfolio value', () => {
		const normal = runPortfolioScenario(PRESETS.moderate.params, 'Normal', allocations);
		const dystopia = runPortfolioScenario(
			{ ...PRESETS.moderate.params, investorModelAdoption: 0 },
			'Dystopia',
			allocations
		);
		// Dystopia should have lower portfolio value by year 20
		expect(dystopia.yearlyResults[20].portfolioValue).toBeLessThan(normal.yearlyResults[20].portfolioValue);
	});

	it('extreme scenario generates less total income than moderate by year 30', () => {
		const moderate = runPortfolioScenario(PRESETS.moderate.params, 'Moderate', allocations);
		const extreme = runPortfolioScenario(PRESETS.extreme.params, 'Extreme', allocations);
		// Extreme has lower investor adoption and more demand collapse
		expect(extreme.yearlyResults[30].totalIncome).toBeLessThan(moderate.yearlyResults[30].totalIncome);
	});
});
