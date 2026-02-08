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

		// Growth rate: use portfolio's total return rate for this year
		const yearResult = portfolioResult.yearlyResults[yearIdx];
		// Portfolio return = (value at year / initial) - 1, annualized for this year
		let growthRate: number;
		if (yearIdx === 0) {
			growthRate = 0.08; // Assume 8% first year
		} else {
			const prevValue = portfolioResult.yearlyResults[yearIdx - 1].portfolioValue;
			growthRate = prevValue > 0
				? (yearResult.portfolioValue / prevValue) - 1
				: 0.08;
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
		// Simple FV of annuity: gap = PMT * ((1+r)^n - 1) / r
		// Solve for PMT
		const yearsToDisplacement = displacementIdx;
		const r = 0.08; // Approximate annual return
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
 */
export function computeAllScenarios(
	personal: PersonalInputs
): PersonalOutcome[] {
	return PRESET_ORDER.map((name) => {
		const preset = PRESETS[name];
		return computePersonalOutcome(personal, preset.params, preset.label);
	});
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
	if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
	return Math.round(n).toString();
}
