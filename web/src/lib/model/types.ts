/** Parameters for a labor replacement scenario. */
export interface ScenarioParams {
	laborReductionPct: number; // 0.0 to 0.95 — FINAL target after ramp
	aiCostPerWorkerYear: number; // Current annual AI cost per replaced worker
	aiCostDeclineRate: number; // Annual decline (e.g., 0.25 = 25% cheaper/yr)
	marginRetentionPct: number; // 0.0 to 1.0 — savings kept vs price passthrough
	dividendPayoutRatio: number; // 0.0 to 1.0
	yearsForward: number; // How many years to project
	baseYear: number; // Starting year for projection
	rampYears: number; // Years to reach full laborReductionPct
	revenueGrowthRate: number; // Annual revenue growth (4% default)
	investorModelAdoption: number; // 0.0 = nobody invests, 1.0 = full adoption
	wageShareOfSpending: number; // How much spending displaced workers cut (default 90%)
	essentialsFloor: number; // Even unemployed people buy essentials
	supplyChainCostPct: number; // 0.0 to 0.60 — non-labor cost reduction at full ramp
	// AI subsidy model: current AI pricing is below true cost (land grab pricing).
	// When subsidies end, costs spike before hardware improvements catch up.
	aiSubsidyYears: number; // Years until subsidized pricing ends (0 = no subsidy)
	aiCostCorrectionPct: number; // Cost multiplier at subsidy end (e.g., 2.0 = costs double)
}

/** Projected financials for one year under a scenario. */
export interface YearProjection {
	year: number;
	// Workforce
	originalHeadcount: number;
	remainingHeadcount: number;
	replacedWorkers: number;
	// Costs
	originalLaborCost: number;
	newLaborCost: number;
	aiComputeCost: number;
	laborSavings: number;
	netSavings: number;
	// Financials
	originalRevenue: number;
	adjustedRevenue: number;
	originalProfit: number;
	newProfit: number;
	profitIncrease: number;
	profitMarginOriginal: number;
	profitMarginNew: number;
	// Shareholder returns
	dividendsTotal: number;
	dividendPerShare: number;
	sharesOutstanding: number;
	// Supply chain
	supplyChainSavings: number;
	// AI cost details
	aiCostPerWorkerThisYear: number;
}

/** Static company data for the portfolio. */
export interface CompanyProfile {
	ticker: string;
	name: string;
	sector: string;
	revenue: number;
	operatingIncome: number;
	netIncome: number;
	sharesOutstanding: number;
	currentDividendPerShare: number;
	sharePrice: number;
	headcount: number;
	estimatedLaborCost: number;
	laborPctOfRevenue: number;
}

/** How capital is allocated to one company. */
export interface PortfolioAllocation {
	company: CompanyProfile;
	dollarsInvested: number;
	sharesOwned: number;
	weight: number;
}

/** Portfolio-level results for one year. */
export interface PortfolioYearResult {
	year: number;
	totalDividends: number;
	totalInvested: number;
	portfolioYield: number;
	annualIncome: number;
	portfolioValue: number;
	capitalGainsIncome: number;
	totalIncome: number;
	totalReturnPct: number;
	companyDividends: Record<string, number>;
	companyValues: Record<string, number>;
}

/** Full portfolio simulation result. */
export interface PortfolioResult {
	scenarioName: string;
	totalInvested: number;
	allocations: PortfolioAllocation[];
	yearlyResults: PortfolioYearResult[];
}

/** User's personal financial inputs. */
export interface PersonalInputs {
	incomeTarget: number; // Annual income needed
	currentSavings: number; // Current investment portfolio
	monthlySavings: number; // Monthly savings rate
	selectedSector: string; // Job sector for displacement timing
}

/** Personal outcome under a specific scenario. */
export interface PersonalOutcome {
	scenarioName: string;
	displacementYear: number; // Year when >50% likely displaced
	requiredPortfolio: number; // incomeTarget / 0.04
	accumulationPath: { year: number; value: number }[];
	portfolioAtDisplacement: number;
	gap: number; // negative = shortfall, positive = surplus
	monthlyNeededToClose: number; // Additional monthly savings needed
	verdict: 'on_track' | 'tight' | 'gap';
	verdictMessage: string;
}

/** A job sector with its AI displacement characteristics. */
export interface SectorProfile {
	name: string;
	displacementPct: number;
	rampYears: number;
	description: string;
}
