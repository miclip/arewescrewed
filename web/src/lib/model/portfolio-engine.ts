import type {
	ScenarioParams,
	CompanyProfile,
	PortfolioAllocation,
	PortfolioYearResult,
	PortfolioResult
} from './types';
import { runScenario } from './scenario-engine';

/** Allocate capital equally across all companies. */
export function buildEqualWeightPortfolio(
	companies: CompanyProfile[],
	totalInvestment: number
): PortfolioAllocation[] {
	const perCompany = totalInvestment / companies.length;
	return companies.map((co) => ({
		company: co,
		dollarsInvested: perCompany,
		sharesOwned: perCompany / co.sharePrice,
		weight: 1.0 / companies.length
	}));
}

/**
 * Run a scenario across a full portfolio.
 * Direct port of Python run_portfolio_scenario().
 *
 * Capital gains model: share prices track earnings growth (constant P/E).
 * Total income uses a safe withdrawal rate (default 4%).
 * Dividends count toward the withdrawal; capital gains selling covers the rest.
 */
export function runPortfolioScenario(
	params: ScenarioParams,
	scenarioName: string,
	allocations: PortfolioAllocation[],
	withdrawalRate: number = 0.04
): PortfolioResult {
	const totalInvested = allocations.reduce((sum, a) => sum + a.dollarsInvested, 0);

	// Run scenario per company
	const companyProjections: Record<string, ReturnType<typeof runScenario>> = {};
	for (const alloc of allocations) {
		companyProjections[alloc.company.ticker] = runScenario(params, alloc.company);
	}

	const yearlyResults: PortfolioYearResult[] = [];
	const numYears = params.yearsForward + 1;

	for (let yearIdx = 0; yearIdx < numYears; yearIdx++) {
		const year = params.baseYear + yearIdx;
		let totalDivs = 0;
		let portfolioValue = 0;
		const companyDivs: Record<string, number> = {};
		const companyVals: Record<string, number> = {};

		for (const alloc of allocations) {
			const co = alloc.company;
			const proj = companyProjections[co.ticker][yearIdx];

			// Dividend income: existing + scenario
			const scenarioDps = proj.dividendPerShare;
			const existingDps = co.currentDividendPerShare;
			const totalDps = existingDps + scenarioDps;
			const investorDivs = alloc.sharesOwned * totalDps;
			totalDivs += investorDivs;
			companyDivs[co.ticker] = investorDivs;

			// Share price tracks earnings growth (constant P/E)
			const profitRatio = co.operatingIncome > 0
				? proj.newProfit / co.operatingIncome
				: 1.0;
			const projectedPrice = co.sharePrice * Math.max(0, profitRatio);
			const companyVal = alloc.sharesOwned * projectedPrice;
			portfolioValue += companyVal;
			companyVals[co.ticker] = companyVal;
		}

		const portfolioYield = totalInvested ? (totalDivs / totalInvested) * 100 : 0;

		// Total return: 4% SWR applied to portfolio value
		const swrIncome = portfolioValue * withdrawalRate;
		const capitalGains = Math.max(0, swrIncome - totalDivs);
		const totalIncome = totalDivs + capitalGains;
		const totalReturnPct = totalInvested ? (totalIncome / totalInvested) * 100 : 0;

		yearlyResults.push({
			year,
			totalDividends: totalDivs,
			totalInvested,
			portfolioYield,
			annualIncome: totalDivs,
			portfolioValue,
			capitalGainsIncome: capitalGains,
			totalIncome,
			totalReturnPct,
			companyDividends: companyDivs,
			companyValues: companyVals
		});
	}

	return {
		scenarioName,
		totalInvested,
		allocations,
		yearlyResults
	};
}
