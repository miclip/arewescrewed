import { derived } from 'svelte/store';
import { personalInputs } from './personal';
import { babyInputs } from './baby';
import { fiscalParams } from './fiscal';
import { providerParams } from './provider';
import { scenarioParams, activePreset } from './scenario';
import {
	computePersonalOutcome,
	computeAllScenarios,
	resolvePresetParams
} from '$lib/model/personal-engine';
import { computeBabyOutcome } from '$lib/model/baby-engine';
import { computeFiscalProjection } from '$lib/model/fiscal-engine';
import { computeProviderProjections } from '$lib/model/provider-engine';
import { buildEqualWeightPortfolio, runPortfolioScenario } from '$lib/model/portfolio-engine';
import { runScenario } from '$lib/model/scenario-engine';
import { PORTFOLIO_COMPANIES } from '$lib/model/companies';
import { PRESETS, type PresetName } from '$lib/model/presets';
import type { PersonalOutcome, PortfolioResult, YearProjection } from '$lib/model/types';

/**
 * Allocations depend only on the (static) company list, so build them once.
 * Portfolio runs are the expensive part of the model — 10 companies × 31 years —
 * and nothing in PersonalInputs affects them, so every store below keys them on
 * the scenario alone. Dragging an income or savings slider must not re-run them.
 */
const ALLOCATIONS = buildEqualWeightPortfolio(PORTFOLIO_COMPANIES, 1_000_000);

/** Portfolio result for the current scenario (corporate model for charts) */
export const portfolioResult = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => {
		return runPortfolioScenario($params, PRESETS[$preset].label, ALLOCATIONS);
	}
);

/** Dystopia variant: same scenario but zero investor adoption */
export const dystopiaResult = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => {
		const dystopiaParams = { ...$params, investorModelAdoption: 0 };
		return runPortfolioScenario(dystopiaParams, PRESETS[$preset].label + ' (No Investors)', ALLOCATIONS);
	}
);

/** Personal outcome for the currently selected scenario */
export const personalOutcome = derived(
	[personalInputs, scenarioParams, activePreset, portfolioResult],
	([$personal, $params, $preset, $portfolio]) => {
		return computePersonalOutcome($personal, $params, PRESETS[$preset].label, $portfolio);
	}
);

/** Scenario params for all 4 presets, with the user's customizations applied */
const allPresetParams = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => resolvePresetParams($params, $preset)
);

/** One portfolio run per preset — cached on the scenario, not on personal inputs */
const allPresetPortfolios = derived(allPresetParams, ($presets) =>
	$presets.map((entry) => runPortfolioScenario(entry.params, entry.label, ALLOCATIONS))
);

/** Personal outcomes for ALL 4 preset scenarios (comparison view) */
export const allScenariosOutcome = derived(
	[personalInputs, allPresetParams, allPresetPortfolios],
	([$personal, $presets, $portfolios]) => {
		return computeAllScenarios($personal, $presets, $portfolios);
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

/** Fiscal base data — company projections cached by scenario (not recomputed on tax slider changes) */
const fiscalBaseData = derived(
	[scenarioParams, activePreset],
	([$params, $preset]) => {
		const companies = PORTFOLIO_COMPANIES;
		const companyProjections = companies.map((c) => runScenario($params, c));
		return { companyProjections, companies, params: $params };
	}
);

/** Fiscal impact projection — only reruns fiscal math when tax params change */
export const fiscalResult = derived(
	[fiscalBaseData, fiscalParams],
	([$base, $fiscal]) => {
		return computeFiscalProjection($base.companyProjections, $base.companies, $base.params, $fiscal);
	}
);

/** AI provider projections — reuses cached company projections */
export const providerProjections = derived(
	[fiscalBaseData, providerParams],
	([$base, $provider]) => {
		return computeProviderProjections($base.companyProjections, $provider, $base.params);
	}
);
