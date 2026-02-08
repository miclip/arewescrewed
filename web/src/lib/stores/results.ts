import { derived } from 'svelte/store';
import { personalInputs } from './personal';
import { babyInputs } from './baby';
import { fiscalParams } from './fiscal';
import { scenarioParams, activePreset } from './scenario';
import { computePersonalOutcome, computeAllScenarios } from '$lib/model/personal-engine';
import { computeBabyOutcome } from '$lib/model/baby-engine';
import { computeFiscalProjection } from '$lib/model/fiscal-engine';
import { buildEqualWeightPortfolio, runPortfolioScenario } from '$lib/model/portfolio-engine';
import { runScenario } from '$lib/model/scenario-engine';
import { PORTFOLIO_COMPANIES } from '$lib/model/companies';
import { PRESETS, type PresetName } from '$lib/model/presets';
import type { PersonalOutcome, PortfolioResult, YearProjection } from '$lib/model/types';

/** Personal outcome for the currently selected scenario */
export const personalOutcome = derived(
	[personalInputs, scenarioParams, activePreset],
	([$personal, $params, $preset]) => {
		return computePersonalOutcome($personal, $params, PRESETS[$preset].label);
	}
);

/** Personal outcomes for ALL 4 preset scenarios (comparison view) */
export const allScenariosOutcome = derived(
	[personalInputs, scenarioParams, activePreset],
	([$personal, $params, $preset]) => {
		return computeAllScenarios($personal, $params, $preset);
	}
);

/** Portfolio result for the current scenario (corporate model for charts) */
export const portfolioResult = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => {
		const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
		return runPortfolioScenario($params, PRESETS[$preset].label, allocations);
	}
);

/** Dystopia variant: same scenario but zero investor adoption */
export const dystopiaResult = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => {
		const dystopiaParams = { ...$params, investorModelAdoption: 0 };
		const allocations = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);
		return runPortfolioScenario(dystopiaParams, PRESETS[$preset].label + ' (No Investors)', allocations);
	}
);

/** Amazon-specific scenario projections for the corporate deep-dive */
export const amazonProjections = derived(
	scenarioParams,
	($params) => {
		const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;
		return runScenario($params, amazon);
	}
);

/** Amazon dystopia projections (no investor model) */
export const amazonDystopiaProjections = derived(
	scenarioParams,
	($params) => {
		const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;
		const dystopiaParams = { ...$params, investorModelAdoption: 0 };
		return runScenario(dystopiaParams, amazon);
	}
);

/** Baby investment outcome for current scenario — reuses portfolioResult to avoid redundant computation */
export const babyOutcome = derived(
	[babyInputs, scenarioParams, portfolioResult],
	([$baby, $params, $portfolio]) => {
		return computeBabyOutcome($baby, $params, $portfolio);
	}
);

/** Fiscal impact projection for current scenario */
export const fiscalResult = derived(
	[scenarioParams, activePreset, fiscalParams],
	([$params, $preset, $fiscal]) => {
		const companies = PORTFOLIO_COMPANIES;
		const companyProjections = companies.map((c) => runScenario($params, c));
		const allocations = buildEqualWeightPortfolio(companies, 1_000_000);
		const portfolio = runPortfolioScenario($params, PRESETS[$preset].label, allocations);
		return computeFiscalProjection(companyProjections, companies, $params, portfolio, $fiscal);
	}
);
