import type { ScenarioParams, YearProjection, CompanyProfile } from './types';
import { smoothstep } from './math';

export interface ProviderParams {
	providerMargin: number; // starting gross margin (~60%)
	providerMarginCap: number; // max gross margin as hardware costs fall (~85%)
	marginExpansionRate: number; // annual margin expansion from falling hardware costs
	providerLaborPct: number; // % of revenue spent on elite workforce (~30%)
	providerAutomationRate: number; // providers automate their own workforce too
	peMultiple: number; // high-growth P/E for market cap (~40-60)
	economyScaleFactor: number; // portfolio→economy multiplier (~21x)
	baseAnnualTrainingCost: number; // year-0 industry-wide training/R&D spend (~$30B)
	trainingCostGrowthRate: number; // annual growth in training costs (~15%/yr — bigger models, more data)
	trainingCostAiReduction: number; // AI eventually reduces R&D cost too (0-1, applied via S-curve)
}

export interface ProviderYearProjection {
	year: number;
	totalAiSpend: number; // sum of aiComputeCost across portfolio
	economyAiSpend: number; // scaled to full economy
	providerRevenue: number; // = economyAiSpend
	providerGrossMargin: number; // margin % this year (expands over time)
	providerCosts: number;
	providerLaborCost: number;
	trainingRdCost: number; // training & R&D expenditure this year
	providerProfit: number;
	providerMarketCap: number; // profit × P/E
	cumulativeProviderRevenue: number;
}

export interface CapturedStake {
	owner: string; // "Amazon", "Microsoft", etc.
	provider: string; // "Anthropic", "OpenAI", etc.
	stakePct: number; // ownership %
	invested: string; // investment amount (display)
	color: string; // chart color
	source: string; // source description
	sourceUrl: string; // source URL
}

/**
 * Big-tech → AI-provider ownership stakes. Sources verified as of late 2025.
 *
 * Only includes external investment stakes, not internal AI efforts.
 * DeepMind is included as a 100% acquisition (wholly-owned subsidiary).
 */
export const CAPTURED_STAKES: CapturedStake[] = [
	{
		owner: 'Microsoft',
		provider: 'OpenAI',
		stakePct: 0.27,
		invested: '~$13.8B',
		color: '#38bdf8',
		source: 'CNBC, Oct 2025 — post PBC restructure (diluted from 32.5%)',
		sourceUrl: 'https://www.cnbc.com/2025/10/28/open-ai-for-profit-microsoft.html'
	},
	{
		owner: 'Amazon',
		provider: 'Anthropic',
		stakePct: 0.15,
		invested: '$8B committed',
		color: '#fb923c',
		source: 'GeekWire, Oct 2025 — inferred from Q3 earnings (range 8-21%, using midpoint)',
		sourceUrl: 'https://www.geekwire.com/2025/amazons-anthropic-investment-boosts-its-quarterly-profits-by-9-5b/'
	},
	{
		owner: 'Google',
		provider: 'DeepMind',
		stakePct: 1.0,
		invested: '~$500M (2014 acquisition)',
		color: '#4ade80',
		source: 'TechCrunch, Jan 2014 — wholly-owned subsidiary of Alphabet',
		sourceUrl: 'https://techcrunch.com/2014/01/26/google-deepmind/'
	},
	{
		owner: 'Google',
		provider: 'Anthropic',
		stakePct: 0.14,
		invested: '>$3B',
		color: '#a3e635',
		source: 'DOJ antitrust court filings, Mar 2025 (capped at 15%, no voting rights)',
		sourceUrl: 'https://www.datacenterdynamics.com/en/news/google-owns-14-percent-of-generative-ai-business-anthropic/'
	},
	{
		owner: 'Nvidia',
		provider: 'Anthropic',
		stakePct: 0.03,
		invested: 'Up to $10B',
		color: '#76d9c4',
		source: 'CNBC, Nov 2025 — at $350B valuation',
		sourceUrl: 'https://www.cnbc.com/2025/11/18/anthropic-ai-azure-microsoft-nvidia.html'
	},
	{
		owner: 'Microsoft',
		provider: 'Anthropic',
		stakePct: 0.014,
		invested: 'Up to $5B',
		color: '#60a5fa',
		source: 'GeekWire, Nov 2025 — at $350B valuation',
		sourceUrl: 'https://www.geekwire.com/2025/microsoft-to-invest-5b-in-anthropic-as-claude-maker-commits-30b-to-azure-in-new-nvidia-alliance/'
	}
];

export const DEFAULT_PROVIDER_PARAMS: ProviderParams = {
	providerMargin: 0.60, // ~60% gross margin today (high pricing, GPU-heavy costs)
	providerMarginCap: 0.85, // ceiling as hardware costs plummet
	marginExpansionRate: 0.02, // +2pp/year margin expansion from falling hardware costs
	providerLaborPct: 0.30, // small elite workforce (~30% of revenue)
	providerAutomationRate: 0.5, // providers heavily automate themselves
	peMultiple: 50, // high-growth tech P/E
	economyScaleFactor: 21, // portfolio ~$471B labor ÷ ~$10T US labor ≈ 1/21
	baseAnnualTrainingCost: 30e9, // ~$30B/yr industry-wide training/R&D (2025 estimate)
	trainingCostGrowthRate: 0.15, // 15%/yr — bigger models, more data, each generation more expensive
	trainingCostAiReduction: 0.5 // AI eventually automates ~50% of its own R&D (S-curve)
};

/**
 * Compute AI provider industry projections from portfolio company projections.
 *
 * Key insight: every company's `aiComputeCost` flows as revenue to AI providers.
 * Revenue follows a hump shape — workers displaced via S-curve but per-worker AI
 * cost declines exponentially, so revenue peaks mid-ramp then falls.
 *
 * Margin expansion: as hardware costs fall faster than pricing, provider margins
 * expand from ~60% toward ~85%, boosting profits even as revenue declines.
 *
 * Training/R&D costs: separate from inference costs and growing — each new model
 * generation costs more to train. Eventually AI helps reduce its own R&D costs
 * (AI-assisted research, automated experimentation), but the near-term trend is up.
 */
export function computeProviderProjections(
	companyProjections: YearProjection[][],
	params: ProviderParams,
	scenarioParams: ScenarioParams
): ProviderYearProjection[] {
	const numYears = scenarioParams.yearsForward + 1;
	const projections: ProviderYearProjection[] = [];
	let cumulativeRevenue = 0;

	for (let yearIdx = 0; yearIdx < numYears; yearIdx++) {
		const year = scenarioParams.baseYear + yearIdx;

		// Sum aiComputeCost across all companies
		const totalAiSpend = companyProjections.reduce(
			(sum, compProj) => sum + compProj[yearIdx].aiComputeCost,
			0
		);

		// Scale to full US economy
		const economyAiSpend = totalAiSpend * params.economyScaleFactor;
		const providerRevenue = economyAiSpend;
		cumulativeRevenue += providerRevenue;

		// Expanding margins: hardware costs fall faster than pricing
		const currentMargin = Math.min(
			params.providerMarginCap,
			params.providerMargin + params.marginExpansionRate * yearIdx
		);

		// Provider costs and profit
		// Labor costs shrink as providers automate themselves (S-curve)
		let rampFrac: number;
		if (scenarioParams.rampYears > 0) {
			rampFrac = Math.min(1.0, yearIdx / scenarioParams.rampYears);
		} else {
			rampFrac = 1.0;
		}
		const automationProgress = params.providerAutomationRate * smoothstep(rampFrac);
		const laborCost = providerRevenue * params.providerLaborPct * (1 - automationProgress);

		// Training/R&D costs: grow each year (bigger models) but AI eventually reduces them.
		// Capped at gross profit minus labor — providers can't sustain R&D spend exceeding
		// what's left after COGS and labor (they'd go bankrupt or cut R&D to survive).
		const rawTrainingCost = params.baseAnnualTrainingCost *
			Math.pow(1 + params.trainingCostGrowthRate, yearIdx);
		const aiRdReduction = params.trainingCostAiReduction * smoothstep(rampFrac);
		const uncappedTrainingCost = rawTrainingCost * (1 - aiRdReduction);
		const grossProfit = providerRevenue * currentMargin;
		const trainingRdCost = Math.min(uncappedTrainingCost, Math.max(0, grossProfit - laborCost));

		const providerProfit = Math.max(0, grossProfit - laborCost - trainingRdCost);

		// Market cap via P/E
		const providerMarketCap = providerProfit * params.peMultiple;

		projections.push({
			year,
			totalAiSpend,
			economyAiSpend,
			providerRevenue,
			providerGrossMargin: currentMargin,
			providerCosts: providerRevenue - providerProfit,
			providerLaborCost: laborCost,
			trainingRdCost,
			providerProfit,
			providerMarketCap,
			cumulativeProviderRevenue: cumulativeRevenue
		});
	}

	return projections;
}

/** Sum of captured value for each owner at a given year's market cap */
export function computeCapturedValues(
	totalProviderMarketCap: number
): { owner: string; value: number; stakes: { provider: string; pct: number }[] }[] {
	const ownerMap = new Map<
		string,
		{ totalPct: number; stakes: { provider: string; pct: number }[] }
	>();

	for (const stake of CAPTURED_STAKES) {
		const existing = ownerMap.get(stake.owner);
		// Each stake captures that % of the total provider market cap
		// This is a simplification — assumes providers share market cap equally
		// In reality, OpenAI and Anthropic dominate, but this gives directional view
		const providerShare = 1 / CAPTURED_STAKES.length; // equal share assumption
		if (existing) {
			existing.totalPct += stake.stakePct * providerShare;
			existing.stakes.push({ provider: stake.provider, pct: stake.stakePct });
		} else {
			ownerMap.set(stake.owner, {
				totalPct: stake.stakePct * providerShare,
				stakes: [{ provider: stake.provider, pct: stake.stakePct }]
			});
		}
	}

	return Array.from(ownerMap.entries()).map(([owner, data]) => ({
		owner,
		value: totalProviderMarketCap * data.totalPct,
		stakes: data.stakes
	}));
}
