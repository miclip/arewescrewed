import type { ScenarioParams, YearProjection, CompanyProfile } from './types';
import type { PortfolioResult } from './types';

/** Smoothstep S-curve (same as scenario-engine) */
function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

export interface FiscalParams {
	corporateTaxRate: number;
	effectiveIncomeTaxRate: number;
	payrollTaxRate: number;
	capitalGainsTaxRate: number;
	baselineCorporateTaxRevenue: number;
	baselineIncomeTaxRevenue: number;
	baselinePayrollTaxRevenue: number;
	baselineOtherRevenue: number;            // excise, customs, estate, misc
	baselineNonInterestSpending: number;     // total spending minus interest
	baselineNationalDebt: number;
	baselineDebtInterestRate: number;
	baselineGDP: number;
	baselineUSWorkforce: number;
	spendingGrowthRate: number;
	safetyNetCostPerPerson: number;
	equalizeCapGainsTax: boolean;
}

export interface FiscalYearProjection {
	year: number;
	corporateTaxRevenue: number;
	incomeTaxRevenue: number;
	payrollTaxRevenue: number;
	capitalGainsTaxRevenue: number;
	totalFederalRevenue: number;
	baselineSpending: number;
	safetyNetSpending: number;
	interestOnDebt: number;
	totalFederalSpending: number;
	annualDeficit: number;
	totalNationalDebt: number;
	debtToGDP: number;
	nationalDisplacedWorkers: number;
	investorWorkers: number;
	unemployedWorkers: number;
	estimatedGDP: number;
}

export interface FiscalResult {
	yearlyProjections: FiscalYearProjection[];
	peakDeficitYear: number;
	peakDeficitAmount: number;
	debtToGDPAtYear30: number;
	totalRevenueLost30yr: number;
	corporateTaxGain30yr: number;
	netFiscalImpact30yr: number;
}

export const DEFAULT_FISCAL_PARAMS: FiscalParams = {
	corporateTaxRate: 0.21,
	effectiveIncomeTaxRate: 0.22,
	payrollTaxRate: 0.153,
	capitalGainsTaxRate: 0.15,
	baselineCorporateTaxRevenue: 500e9,       // FY2025 corporate income tax
	baselineIncomeTaxRevenue: 2_400e9,         // FY2025 individual income tax
	baselinePayrollTaxRevenue: 1_700e9,        // FY2025 payroll (FICA)
	baselineOtherRevenue: 300e9,               // excise, customs, estate, misc
	baselineNonInterestSpending: 5_500e9,      // FY2025 ~$6.7T total - ~$1.1T interest
	baselineNationalDebt: 36_000e9,
	baselineDebtInterestRate: 0.033,           // ~$1.19T interest / $36T debt
	baselineGDP: 29_000e9,
	baselineUSWorkforce: 160_000_000,
	spendingGrowthRate: 0.03,
	safetyNetCostPerPerson: 25_000,
	equalizeCapGainsTax: false
};

/**
 * Compute fiscal projection across the economy using portfolio model outputs as proxies.
 *
 * Uses portfolio-level profit growth to scale corporate tax, and the scenario's
 * displacement rate to scale income/payroll tax loss and capital gains tax gain.
 */
export function computeFiscalProjection(
	companyProjections: YearProjection[][],
	companies: CompanyProfile[],
	scenarioParams: ScenarioParams,
	portfolioResult: PortfolioResult,
	fiscalParams: FiscalParams
): FiscalResult {
	const numYears = scenarioParams.yearsForward + 1;

	// Sum of original operating income at year 0 across companies
	const totalBaseProfit = companies.reduce((sum, c) => sum + c.operatingIncome, 0);

	// Average wage per worker across companies
	const totalLaborCost = companies.reduce((sum, c) => sum + c.estimatedLaborCost, 0);
	const totalHeadcount = companies.reduce((sum, c) => sum + c.headcount, 0);
	const avgWagePerWorker = totalHeadcount > 0 ? totalLaborCost / totalHeadcount : 60_000;

	const yearlyProjections: FiscalYearProjection[] = [];
	let currentDebt = fiscalParams.baselineNationalDebt;
	let peakDeficitYear = scenarioParams.baseYear;
	let peakDeficitAmount = 0;
	let totalRevenueLost = 0;
	let corporateTaxGain = 0;
	let cumulativeGrowth = 1.0;

	// Baseline total revenue at year 0 (for comparison)
	const baselineTotalRevenue =
		fiscalParams.baselineCorporateTaxRevenue +
		fiscalParams.baselineIncomeTaxRevenue +
		fiscalParams.baselinePayrollTaxRevenue +
		fiscalParams.baselineOtherRevenue;

	for (let yearIdx = 0; yearIdx < numYears; yearIdx++) {
		const year = scenarioParams.baseYear + yearIdx;

		// --- Displacement rate (economy-wide proxy from scenario) ---
		let rampFrac: number;
		if (scenarioParams.rampYears > 0) {
			rampFrac = Math.min(1.0, yearIdx / scenarioParams.rampYears);
		} else {
			rampFrac = 1.0;
		}
		const currentDisplacement = scenarioParams.laborReductionPct * smoothstep(rampFrac);

		// National workforce numbers
		const nationalDisplacedWorkers = Math.floor(
			fiscalParams.baselineUSWorkforce * currentDisplacement
		);
		const investorWorkers = Math.floor(
			nationalDisplacedWorkers * scenarioParams.investorModelAdoption
		);
		const unemployedWorkers = nationalDisplacedWorkers - investorWorkers;
		const remainingWorkerFraction = 1.0 - currentDisplacement;

		// --- Demand model (mirrors scenario-engine) ---
		const lostWageSpending = currentDisplacement * scenarioParams.wageShareOfSpending;
		const investorOffset = lostWageSpending * scenarioParams.investorModelAdoption;
		const netDemandLoss = Math.max(0, lostWageSpending - investorOffset);
		const demandFactor = Math.max(scenarioParams.essentialsFloor, 1.0 - netDemandLoss);

		// Revenue growth dampened by demand
		if (yearIdx > 0) {
			cumulativeGrowth *= 1 + scenarioParams.revenueGrowthRate * demandFactor;
		}

		// --- Corporate tax: scales with portfolio profit growth ---
		const totalNewProfit = companyProjections.reduce(
			(sum, projections) => sum + projections[yearIdx].newProfit,
			0
		);
		const profitRatio = totalBaseProfit > 0 ? totalNewProfit / totalBaseProfit : 1.0;
		// Scale by profit growth AND any rate change from the 21% baseline
		const rateMultiplier = fiscalParams.corporateTaxRate / 0.21;
		const corporateTaxRevenue = fiscalParams.baselineCorporateTaxRevenue * Math.max(0, profitRatio) * rateMultiplier;

		// --- Income tax: remaining workers still pay income tax ---
		const incomeTaxRevenue = fiscalParams.baselineIncomeTaxRevenue * remainingWorkerFraction;

		// --- Payroll tax: only employed workers pay ---
		const payrollTaxRevenue = fiscalParams.baselinePayrollTaxRevenue * remainingWorkerFraction;

		// --- Capital gains tax: investors pay on their investment income ---
		const capGainsTaxRate = fiscalParams.equalizeCapGainsTax
			? fiscalParams.effectiveIncomeTaxRate
			: fiscalParams.capitalGainsTaxRate;
		const capitalGainsTaxRevenue = investorWorkers * avgWagePerWorker * capGainsTaxRate;

		const totalFederalRevenue =
			corporateTaxRevenue + incomeTaxRevenue + payrollTaxRevenue + capitalGainsTaxRevenue +
			fiscalParams.baselineOtherRevenue;

		// --- Spending (non-interest grows with inflation; interest computed on current debt) ---
		const baselineSpending =
			fiscalParams.baselineNonInterestSpending * Math.pow(1 + fiscalParams.spendingGrowthRate, yearIdx);
		const safetyNetSpending = unemployedWorkers * fiscalParams.safetyNetCostPerPerson;
		const interestOnDebt = currentDebt * fiscalParams.baselineDebtInterestRate;
		const totalFederalSpending = baselineSpending + safetyNetSpending + interestOnDebt;

		// --- Deficit and debt ---
		const annualDeficit = totalFederalSpending - totalFederalRevenue;
		currentDebt += annualDeficit;

		// --- GDP estimate ---
		const estimatedGDP = fiscalParams.baselineGDP * cumulativeGrowth * demandFactor;
		const debtToGDP = estimatedGDP > 0 ? currentDebt / estimatedGDP : 0;

		// Track peaks and totals
		if (annualDeficit > peakDeficitAmount) {
			peakDeficitAmount = annualDeficit;
			peakDeficitYear = year;
		}

		// Revenue comparison to baseline (what we lost)
		const baselineRevenueThisYear = baselineTotalRevenue;
		const revenueDiff = baselineRevenueThisYear - totalFederalRevenue;
		if (revenueDiff > 0) totalRevenueLost += revenueDiff;

		// Corporate tax gains vs year 0
		const corpGain = corporateTaxRevenue - fiscalParams.baselineCorporateTaxRevenue;
		if (corpGain > 0) corporateTaxGain += corpGain;

		yearlyProjections.push({
			year,
			corporateTaxRevenue,
			incomeTaxRevenue,
			payrollTaxRevenue,
			capitalGainsTaxRevenue,
			totalFederalRevenue,
			baselineSpending,
			safetyNetSpending,
			interestOnDebt,
			totalFederalSpending,
			annualDeficit,
			totalNationalDebt: currentDebt,
			debtToGDP,
			nationalDisplacedWorkers,
			investorWorkers,
			unemployedWorkers,
			estimatedGDP
		});
	}

	const lastYear = yearlyProjections[yearlyProjections.length - 1];

	return {
		yearlyProjections,
		peakDeficitYear,
		peakDeficitAmount,
		debtToGDPAtYear30: lastYear.debtToGDP,
		totalRevenueLost30yr: totalRevenueLost,
		corporateTaxGain30yr: corporateTaxGain,
		netFiscalImpact30yr: totalRevenueLost - corporateTaxGain
	};
}
