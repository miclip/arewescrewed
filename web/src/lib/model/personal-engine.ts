import type { PersonalInputs, PersonalOutcome, ScenarioParams } from './types';
import { PORTFOLIO_COMPANIES } from './companies';
import { buildEqualWeightPortfolio, runPortfolioScenario } from './portfolio-engine';
import { getSector, computeDisplacementYear } from './sectors';
import { PRESETS, PRESET_ORDER, type PresetName } from './presets';

const WITHDRAWAL_RATE = 0.04;

/**
 * Compute personal outcome for a single scenario.
 *
 * 1. Sector + scenario → displacement year (when >50% of sector displaced)
 * 2. Income target → required portfolio (target / 4% SWR)
 * 3. Current savings + monthly savings → accumulation path (compounding with portfolio returns)
 * 4. Compare portfolio at displacement year vs required → gap/surplus
 * 5. Determine verdict
 */
export function computePersonalOutcome(
	personal: PersonalInputs,
	params: ScenarioParams,
	scenarioName: string
): PersonalOutcome {
	const sector = getSector(personal.selectedSector);
	const displacementYear = computeDisplacementYear(
		sector,
		params.baseYear,
		params.rampYears,
		params.laborReductionPct
	);

	const requiredPortfolio = personal.incomeTarget / WITHDRAWAL_RATE;

	// Run portfolio model to get annual returns for growth rate estimation
	const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
	const portfolioResult = runPortfolioScenario(params, scenarioName, allocations);

	// Build accumulation path year by year
	const accumulationPath: { year: number; value: number }[] = [];
	let currentValue = personal.currentSavings;
	const annualSavings = personal.monthlySavings * 12;

	for (let yearIdx = 0; yearIdx <= params.yearsForward; yearIdx++) {
		const year = params.baseYear + yearIdx;
		accumulationPath.push({ year, value: currentValue });

		// Growth rate: use portfolio's year-over-year value change
		let growthRate: number;
		if (yearIdx === 0) {
			// Use year 0→1 return from portfolio model
			const yr0 = portfolioResult.yearlyResults[0]?.portfolioValue;
			const yr1 = portfolioResult.yearlyResults[1]?.portfolioValue;
			growthRate = yr0 && yr0 > 0 && yr1 ? (yr1 / yr0) - 1 : 0;
		} else {
			const prevValue = portfolioResult.yearlyResults[yearIdx - 1].portfolioValue;
			const currValue = portfolioResult.yearlyResults[yearIdx].portfolioValue;
			growthRate = prevValue > 0
				? (currValue / prevValue) - 1
				: 0;
		}

		// Compound growth + new savings
		currentValue = currentValue * (1 + growthRate) + annualSavings;
	}

	// Find portfolio value at displacement year
	const displacementIdx = displacementYear - params.baseYear;
	const portfolioAtDisplacement =
		displacementIdx >= 0 && displacementIdx < accumulationPath.length
			? accumulationPath[displacementIdx].value
			: currentValue;

	const gap = portfolioAtDisplacement - requiredPortfolio;

	// Calculate monthly savings needed to close gap (if negative)
	let monthlyNeededToClose = 0;
	if (gap < 0 && displacementIdx > 0) {
		// Compute average annual return from portfolio model
		const yr0Val = portfolioResult.yearlyResults[0]?.portfolioValue ?? 0;
		const yrNVal = portfolioResult.yearlyResults[displacementIdx]?.portfolioValue ?? yr0Val;
		const avgReturn = yr0Val > 0 && displacementIdx > 0
			? Math.pow(yrNVal / yr0Val, 1 / displacementIdx) - 1
			: 0.06;
		// Simple FV of annuity: gap = PMT * ((1+r)^n - 1) / r
		const yearsToDisplacement = displacementIdx;
		const r = Math.max(0.01, avgReturn);
		const fvFactor = (Math.pow(1 + r, yearsToDisplacement) - 1) / r;
		monthlyNeededToClose = fvFactor > 0 ? Math.abs(gap) / fvFactor / 12 : 0;
	}

	// Determine verdict
	let verdict: PersonalOutcome['verdict'];
	let verdictMessage: string;

	if (gap >= 0) {
		verdict = 'on_track';
		verdictMessage = `You're projected to have $${formatCompact(portfolioAtDisplacement)} by ${displacementYear} — $${formatCompact(gap)} surplus over the $${formatCompact(requiredPortfolio)} needed.`;
	} else if (Math.abs(gap) < requiredPortfolio * 0.2) {
		verdict = 'tight';
		verdictMessage = `Close but tight. You'll have $${formatCompact(portfolioAtDisplacement)} of the $${formatCompact(requiredPortfolio)} needed by ${displacementYear}. Save an extra $${formatCompact(monthlyNeededToClose)}/mo to close the gap.`;
	} else {
		verdict = 'gap';
		verdictMessage = `Gap of $${formatCompact(Math.abs(gap))}. You'll need $${formatCompact(requiredPortfolio)} by ${displacementYear} but are projected to have $${formatCompact(portfolioAtDisplacement)}. Need $${formatCompact(monthlyNeededToClose)}/mo additional savings.`;
	}

	return {
		scenarioName,
		displacementYear,
		requiredPortfolio,
		accumulationPath,
		portfolioAtDisplacement,
		gap,
		monthlyNeededToClose,
		verdict,
		verdictMessage
	};
}

/**
 * Compute personal outcome for all 4 preset scenarios.
 * If customParams + activePresetName provided, user's customizations
 * (the diff from their active preset) are applied to all 4 scenarios.
 */
export function computeAllScenarios(
	personal: PersonalInputs,
	customParams?: ScenarioParams,
	activePresetName?: PresetName
): PersonalOutcome[] {
	return PRESET_ORDER.map((name) => {
		const preset = PRESETS[name];
		let params = { ...preset.params };

		// Apply user's slider customizations to all scenarios
		if (customParams && activePresetName) {
			const activeBase = PRESETS[activePresetName].params;
			for (const key of Object.keys(activeBase) as (keyof ScenarioParams)[]) {
				if (customParams[key] !== activeBase[key]) {
					(params as any)[key] = customParams[key];
				}
			}
		}

		return computePersonalOutcome(personal, params, preset.label);
	});
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
	if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
	return Math.round(n).toString();
}
