import type { ScenarioParams } from './types';
import { PORTFOLIO_COMPANIES } from './companies';
import { buildEqualWeightPortfolio, runPortfolioScenario } from './portfolio-engine';

const WITHDRAWAL_RATE = 0.04;
const BASE_INCOME_TARGET = 75_000;

/** Smoothstep S-curve (same as scenario-engine) */
function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

export interface BabyInputs {
	giftAmount: number; // default: $50,000
	unlockAge: number; // fixed: 21
}

export interface BabyGrowthPoint {
	year: number;
	age: number;
	value: number;
	income: number; // value * 0.04
}

export interface CostOfLivingPoint {
	year: number;
	age: number;
	/** Cost as fraction of today's cost (1.0 = no change, 0.6 = 40% cheaper) */
	costFraction: number;
	/** What $75k buys at reduced cost (effective purchasing power) */
	adjustedIncomeNeeded: number;
}

export interface BabyOutcome {
	birthYear: number;
	unlockYear: number;
	giftAmount: number;
	growthPath: BabyGrowthPoint[];
	costOfLivingPath: CostOfLivingPoint[];
	valueAtUnlock: number;
	annualIncomeAtUnlock: number;
	valueAt30: number;
	annualIncomeAt30: number;
	requiredFor75k: number; // $75k / 0.04 = $1.875M (today's dollars)
	/** Gift amount needed so 4% SWR at unlock = $75k (today's dollars) */
	giftNeededFor75k: number;
	/** Gift amount needed so 4% SWR at unlock = cost-adjusted $75k */
	giftNeededFor75kAdjusted: number;
	/** Cost of living fraction at unlock year */
	costFractionAtUnlock: number;
}

/**
 * Compute baby investment outcome.
 *
 * 1. Run portfolio model with $1M to extract year-over-year growth rates
 * 2. Compound giftAmount using those growth rates (no additional contributions)
 * 3. Track portfolio value and 4% SWR income at each year
 * 4. Compute cost-of-living decline from supply chain cascade
 * 5. Reverse-engineer gift needed for livable income at unlock
 */
export function computeBabyOutcome(
	inputs: BabyInputs,
	params: ScenarioParams,
	scenarioName: string
): BabyOutcome {
	const birthYear = params.baseYear;
	const unlockYear = birthYear + inputs.unlockAge;

	// Compute cost-of-living path from supply chain S-curve
	const costOfLivingPath: CostOfLivingPoint[] = [];
	for (let yearIdx = 0; yearIdx <= params.yearsForward; yearIdx++) {
		const rampFrac = params.rampYears > 0
			? Math.min(1.0, yearIdx / params.rampYears)
			: 1.0;
		const scReduction = params.supplyChainCostPct * smoothstep(rampFrac);
		const costFraction = 1.0 - scReduction;
		costOfLivingPath.push({
			year: birthYear + yearIdx,
			age: yearIdx,
			costFraction,
			adjustedIncomeNeeded: BASE_INCOME_TARGET * costFraction
		});
	}

	const costFractionAtUnlock = inputs.unlockAge < costOfLivingPath.length
		? costOfLivingPath[inputs.unlockAge].costFraction
		: costOfLivingPath[costOfLivingPath.length - 1].costFraction;

	if (inputs.giftAmount <= 0) {
		const emptyPath: BabyGrowthPoint[] = [];
		for (let yearIdx = 0; yearIdx <= params.yearsForward; yearIdx++) {
			emptyPath.push({
				year: birthYear + yearIdx,
				age: yearIdx,
				value: 0,
				income: 0
			});
		}
		return {
			birthYear,
			unlockYear,
			giftAmount: inputs.giftAmount,
			growthPath: emptyPath,
			costOfLivingPath,
			valueAtUnlock: 0,
			annualIncomeAtUnlock: 0,
			valueAt30: 0,
			annualIncomeAt30: 0,
			requiredFor75k: BASE_INCOME_TARGET / WITHDRAWAL_RATE,
			giftNeededFor75k: 0,
			giftNeededFor75kAdjusted: 0,
			costFractionAtUnlock
		};
	}

	// Get portfolio growth rates from the model
	const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
	const portfolioResult = runPortfolioScenario(params, scenarioName, allocations);

	// Compound the gift amount using portfolio growth rates
	const growthPath: BabyGrowthPoint[] = [];
	let currentValue = inputs.giftAmount;

	// Also track compound multiplier to reverse-engineer required gift
	let compoundMultiplier = 1.0;

	for (let yearIdx = 0; yearIdx <= params.yearsForward; yearIdx++) {
		const year = birthYear + yearIdx;
		growthPath.push({
			year,
			age: yearIdx,
			value: currentValue,
			income: currentValue * WITHDRAWAL_RATE
		});

		// Growth rate from portfolio model
		let growthRate: number;
		if (yearIdx === 0) {
			const yr0 = portfolioResult.yearlyResults[0]?.portfolioValue;
			const yr1 = portfolioResult.yearlyResults[1]?.portfolioValue;
			growthRate = yr0 && yr0 > 0 && yr1 ? (yr1 / yr0) - 1 : 0;
		} else if (yearIdx < portfolioResult.yearlyResults.length) {
			const prevValue = portfolioResult.yearlyResults[yearIdx - 1].portfolioValue;
			const currValue = portfolioResult.yearlyResults[yearIdx].portfolioValue;
			growthRate = prevValue > 0 ? (currValue / prevValue) - 1 : 0;
		} else {
			growthRate = 0;
		}

		// Compound growth only — no additional contributions
		currentValue = currentValue * (1 + growthRate);
		if (yearIdx < inputs.unlockAge) {
			compoundMultiplier *= (1 + growthRate);
		}
	}

	// Extract milestone values
	const unlockIdx = inputs.unlockAge;
	const valueAtUnlock =
		unlockIdx >= 0 && unlockIdx < growthPath.length ? growthPath[unlockIdx].value : currentValue;

	const age30Idx = 30;
	const valueAt30 =
		age30Idx >= 0 && age30Idx < growthPath.length ? growthPath[age30Idx].value : currentValue;

	// Reverse-engineer: what gift is needed so value_at_unlock * 0.04 = $75k?
	// valueAtUnlock = giftAmount * compoundMultiplier
	// need: giftNeeded * compoundMultiplier * 0.04 = 75000
	const requiredPortfolioAt21 = BASE_INCOME_TARGET / WITHDRAWAL_RATE;
	const giftNeededFor75k = compoundMultiplier > 0
		? requiredPortfolioAt21 / compoundMultiplier
		: 0;

	// Cost-adjusted version: what if $75k of purchasing power only costs $75k * costFraction?
	const adjustedTarget = BASE_INCOME_TARGET * costFractionAtUnlock;
	const adjustedPortfolio = adjustedTarget / WITHDRAWAL_RATE;
	const giftNeededFor75kAdjusted = compoundMultiplier > 0
		? adjustedPortfolio / compoundMultiplier
		: 0;

	return {
		birthYear,
		unlockYear,
		giftAmount: inputs.giftAmount,
		growthPath,
		costOfLivingPath,
		valueAtUnlock,
		annualIncomeAtUnlock: valueAtUnlock * WITHDRAWAL_RATE,
		valueAt30,
		annualIncomeAt30: valueAt30 * WITHDRAWAL_RATE,
		requiredFor75k: requiredPortfolioAt21,
		giftNeededFor75k,
		giftNeededFor75kAdjusted,
		costFractionAtUnlock
	};
}
