import type { ScenarioParams, YearProjection, CompanyProfile } from './types';
import { smoothstep } from './math';

/**
 * Run a scenario projection for a company.
 * Direct port of Python run_scenario() — must match exactly.
 */
export function runScenario(
	params: ScenarioParams,
	company: CompanyProfile
): YearProjection[] {
	const baseRevenue = company.revenue;
	const baseProfit = company.operatingIncome;
	const baseShares = company.sharesOutstanding;
	const headcount = company.headcount;
	const totalLaborCost = company.estimatedLaborCost;

	// Non-labor operating costs
	const baseTotalOpex = baseRevenue - baseProfit;
	const baseNonLabor = Math.max(0, baseTotalOpex - totalLaborCost);

	const projections: YearProjection[] = [];
	let cumulativeGrowth = 1.0;

	for (let yearOffset = 0; yearOffset <= params.yearsForward; yearOffset++) {
		const year = params.baseYear + yearOffset;

		// Gradual ramp with S-curve
		let currentReduction: number;
		let rampFrac: number;
		if (params.rampYears > 0) {
			rampFrac = Math.min(1.0, yearOffset / params.rampYears);
			currentReduction = params.laborReductionPct * smoothstep(rampFrac);
		} else {
			rampFrac = 1.0;
			currentReduction = params.laborReductionPct;
		}

		// Demand model (computed first — dampens revenue growth)
		const economyDisplacement = currentReduction;
		const lostWageSpending = economyDisplacement * params.wageShareOfSpending;
		const investorOffset = lostWageSpending * params.investorModelAdoption;
		const netDemandLoss = Math.max(0, lostWageSpending - investorOffset);
		const demandFactor = Math.max(params.essentialsFloor, 1.0 - netDemandLoss);

		// Revenue: growth rate dampened by demand (can't grow when customers are disappearing)
		if (yearOffset > 0) {
			cumulativeGrowth *= (1 + params.revenueGrowthRate * demandFactor);
		}
		const revenueThisYear = baseRevenue * cumulativeGrowth;

		// AI costs: subsidized early, then correction, then natural decline.
		// During subsidy period: costs decline from the (artificially low) starting price.
		// At subsidy end: costs jump by correction factor (the "true cost" reveal).
		// After correction: costs resume declining from the corrected level.
		let aiCostThisYear: number;
		const subsidyYears = params.aiSubsidyYears ?? 0;
		const correctionPct = params.aiCostCorrectionPct ?? 1.0;
		if (subsidyYears > 0 && yearOffset < subsidyYears) {
			// Still subsidized — decline from the artificially low price
			aiCostThisYear =
				params.aiCostPerWorkerYear * Math.pow(1 - params.aiCostDeclineRate, yearOffset);
		} else if (subsidyYears > 0) {
			// Post-subsidy: cost at end of subsidy × correction, then decline continues
			const costAtSubsidyEnd =
				params.aiCostPerWorkerYear * Math.pow(1 - params.aiCostDeclineRate, subsidyYears);
			const correctedCost = costAtSubsidyEnd * correctionPct;
			const yearsPostCorrection = yearOffset - subsidyYears;
			aiCostThisYear = correctedCost * Math.pow(1 - params.aiCostDeclineRate, yearsPostCorrection);
		} else {
			// No subsidy model — simple decline
			aiCostThisYear =
				params.aiCostPerWorkerYear * Math.pow(1 - params.aiCostDeclineRate, yearOffset);
		}

		// Workers replaced
		const replaced = Math.floor(headcount * currentReduction);
		const remaining = headcount - replaced;

		// Cost changes
		const originalLabor = totalLaborCost;
		const newLabor = originalLabor * (1 - currentReduction);
		const aiCost = replaced * aiCostThisYear;
		const laborSavings = originalLabor - newLabor;
		const netSavings = laborSavings - aiCost;

		const adjustedRevenue = revenueThisYear * demandFactor;

		// Supply chain savings (growth tracks demand-dampened revenue growth)
		const nonLaborThisYear = baseNonLabor * cumulativeGrowth;
		const scSavings =
			params.rampYears > 0
				? nonLaborThisYear * (params.supplyChainCostPct * smoothstep(rampFrac))
				: nonLaborThisYear * params.supplyChainCostPct;

		// Profit model (base profit grows with demand-dampened revenue)
		const baseProfitGrown = baseProfit * cumulativeGrowth;
		const baseProfitDemandAdjusted = baseProfitGrown * demandFactor;
		const totalCostSavings = netSavings + scSavings;
		// Savings are only realised on the business that still exists. Without the
		// demandFactor here, a collapse scenario banks savings computed on the full
		// (uncollapsed) cost base while profit sits on collapsed revenue — which drove
		// margins above 100% and made total demand collapse read as the most profitable
		// outcome on screen.
		const retainedSavings = totalCostSavings * params.marginRetentionPct * demandFactor;
		const newProfit = baseProfitDemandAdjusted + retainedSavings;

		// Profit margins — both measured against their own world's revenue, so the
		// demandFactor cancels and the two are directly comparable.
		const marginOrig = revenueThisYear ? (baseProfitGrown / revenueThisYear) * 100 : 0;
		const marginNew = adjustedRevenue ? (newProfit / adjustedRevenue) * 100 : 0;

		// Dividends
		const dividends = Math.max(0, newProfit * params.dividendPayoutRatio);
		const divPerShare = baseShares ? dividends / baseShares : 0;

		projections.push({
			year,
			originalHeadcount: headcount,
			remainingHeadcount: remaining,
			replacedWorkers: replaced,
			originalLaborCost: originalLabor,
			newLaborCost: newLabor,
			aiComputeCost: aiCost,
			laborSavings,
			netSavings,
			originalRevenue: revenueThisYear,
			adjustedRevenue,
			originalProfit: baseProfitDemandAdjusted,
			newProfit,
			profitIncrease: newProfit - baseProfitDemandAdjusted,
			profitMarginOriginal: marginOrig,
			profitMarginNew: marginNew,
			dividendsTotal: dividends,
			dividendPerShare: divPerShare,
			sharesOutstanding: baseShares,
			supplyChainSavings: scSavings,
			aiCostPerWorkerThisYear: aiCostThisYear
		});
	}

	return projections;
}
