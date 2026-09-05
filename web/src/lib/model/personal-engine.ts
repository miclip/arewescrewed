import type { PersonalInputs, PersonalOutcome, PortfolioResult, ScenarioParams } from './types';
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
	scenarioName: string,
	portfolioResult: PortfolioResult
): PersonalOutcome {
	const sector = getSector(personal.selectedSector);
	const displacementYear = computeDisplacementYear(
		sector,
		params.baseYear,
		params.rampYears,
		params.laborReductionPct
	);

	const requiredPortfolio = personal.incomeTarget / WITHDRAWAL_RATE;

	// Build accumulation path year by year
	const accumulationPath: { year: number; value: number }[] = [];
	let currentValue = personal.currentSavings;
	const annualSavings = personal.monthlySavings * 12;

	for (let yearIdx = 0; yearIdx <= params.yearsForward; yearIdx++) {
		const year = params.baseYear + yearIdx;
		accumulationPath.push({ year, value: currentValue });

		// Growth rate for the step out of this year: portfolio's yearIdx → yearIdx+1 return.
		// Indexing on yearIdx (not yearIdx-1) keeps each year's return applied exactly once.
		const fromValue = portfolioResult.yearlyResults[yearIdx]?.portfolioValue;
		const toValue = portfolioResult.yearlyResults[yearIdx + 1]?.portfolioValue;
		const growthRate =
			fromValue && fromValue > 0 && toValue ? toValue / fromValue - 1 : 0;

		// Compound growth + new savings
		currentValue = currentValue * (1 + growthRate) + annualSavings;
	}

	// Find portfolio value at displacement year.
	// Aggressive slider combinations can push displacement past the projection horizon;
	// clamp to the last modelled year rather than reporting a value we never modelled.
	const rawDisplacementIdx = displacementYear - params.baseYear;
	const displacementBeyondHorizon = rawDisplacementIdx >= accumulationPath.length;
	const displacementIdx = Math.max(
		0,
		Math.min(rawDisplacementIdx, accumulationPath.length - 1)
	);
	const portfolioAtDisplacement = accumulationPath[displacementIdx].value;

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

	if (displacementBeyondHorizon) {
		const lastYear = accumulationPath[accumulationPath.length - 1].year;
		verdictMessage += ` (Displacement lands in ${displacementYear}, past the ${lastYear} projection horizon — figures shown are as of ${lastYear}.)`;
	}

	return {
		scenarioName,
		displacementYear,
		requiredPortfolio,
		accumulationPath,
		displacementBeyondHorizon,
		portfolioAtDisplacement,
		gap,
		monthlyNeededToClose,
		verdict,
		verdictMessage
	};
}

/**
 * Resolve the ScenarioParams for all 4 presets.
 * If customParams + activePresetName provided, the user's customizations
 * (the diff from their active preset) are applied to all 4 scenarios.
 *
 * Split out from computeAllScenarios so callers can cache the portfolio runs
 * these params drive — they depend only on the scenario, never on PersonalInputs.
 */
export function resolvePresetParams(
	customParams?: ScenarioParams,
	activePresetName?: PresetName
): { label: string; params: ScenarioParams }[] {
	return PRESET_ORDER.map((name) => {
		const preset = PRESETS[name];
		const params = { ...preset.params };

		// Apply user's slider customizations to all scenarios
		if (customParams && activePresetName) {
			const activeBase = PRESETS[activePresetName].params;
			for (const key of Object.keys(activeBase) as (keyof ScenarioParams)[]) {
				if (customParams[key] !== activeBase[key]) {
					(params as unknown as Record<string, unknown>)[key] = customParams[key];
				}
			}
		}

		return { label: preset.label, params };
	});
}

/**
 * Compute personal outcome for all 4 preset scenarios.
 * `portfolioResults` must align with resolvePresetParams() order.
 */
export function computeAllScenarios(
	personal: PersonalInputs,
	presetParams: { label: string; params: ScenarioParams }[],
	portfolioResults: PortfolioResult[]
): PersonalOutcome[] {
	return presetParams.map((entry, i) =>
		computePersonalOutcome(personal, entry.params, entry.label, portfolioResults[i])
	);
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
	if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
	return Math.round(n).toString();
}
