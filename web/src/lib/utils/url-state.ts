import type { PersonalInputs, ScenarioParams } from '$lib/model/types';
import type { PresetName } from '$lib/model/presets';
import { PRESETS } from '$lib/model/presets';
import { SECTORS } from '$lib/model/sectors';

interface UrlState {
	personal: PersonalInputs;
	preset: PresetName;
	params?: Partial<ScenarioParams>;
}

const KEY_MAP: Record<string, string> = {
	incomeTarget: 'inc',
	currentSavings: 'sav',
	monthlySavings: 'mo',
	selectedSector: 'sec',
	preset: 'p',
	laborReductionPct: 'lr',
	aiCostPerWorkerYear: 'ac',
	aiCostDeclineRate: 'ad',
	marginRetentionPct: 'mr',
	dividendPayoutRatio: 'dp',
	rampYears: 'ry',
	revenueGrowthRate: 'rg',
	investorModelAdoption: 'ia',
	supplyChainCostPct: 'sc',
	aiSubsidyYears: 'sy',
	aiCostCorrectionPct: 'cc',
	wageShareOfSpending: 'ws',
	essentialsFloor: 'ef'
};

/**
 * Valid range for every shareable param, mirroring the slider bounds in
 * AdvancedControls.svelte. Values from a URL are untrusted: a hand-edited or
 * truncated link must not be able to push NaN or an out-of-range value into the
 * engines, where it propagates silently into every chart.
 */
const PARAM_RANGES: Record<string, [number, number]> = {
	laborReductionPct: [0.05, 0.95],
	rampYears: [3, 30],
	aiCostPerWorkerYear: [10_000, 120_000],
	aiCostDeclineRate: [0.05, 0.4],
	aiSubsidyYears: [0, 8],
	aiCostCorrectionPct: [1.0, 4.0],
	marginRetentionPct: [0.1, 1.0],
	dividendPayoutRatio: [0.1, 0.8],
	revenueGrowthRate: [0.0, 0.1],
	investorModelAdoption: [0.0, 1.0],
	supplyChainCostPct: [0.0, 0.6],
	wageShareOfSpending: [0.4, 1.0],
	essentialsFloor: [0.0, 0.5]
};

const PERSONAL_RANGES: Record<string, [number, number]> = {
	incomeTarget: [10_000, 1_000_000],
	currentSavings: [0, 100_000_000],
	monthlySavings: [0, 1_000_000]
};

/** Parse a query value into a finite number clamped to range, or null if unusable. */
function parseBounded(raw: string | null, range: [number, number]): number | null {
	if (raw === null || raw.trim() === '') return null;
	const n = Number(raw);
	if (!Number.isFinite(n)) return null;
	return Math.min(range[1], Math.max(range[0], n));
}

export function encodeUrlState(personal: PersonalInputs, preset: PresetName, params: ScenarioParams): string {
	const sp = new URLSearchParams();

	sp.set(KEY_MAP.incomeTarget, String(personal.incomeTarget));
	sp.set(KEY_MAP.currentSavings, String(personal.currentSavings));
	sp.set(KEY_MAP.monthlySavings, String(personal.monthlySavings));
	sp.set(KEY_MAP.selectedSector, personal.selectedSector);
	sp.set(KEY_MAP.preset, preset);

	// Only encode params that differ from the preset
	const presetParams = PRESETS[preset].params;
	for (const [key, shortKey] of Object.entries(KEY_MAP)) {
		if (key in presetParams && key in params) {
			const presetVal = (presetParams as unknown as Record<string, unknown>)[key];
			const currentVal = (params as unknown as Record<string, unknown>)[key];
			if (presetVal !== currentVal) {
				sp.set(shortKey, String(currentVal));
			}
		}
	}

	return '?' + sp.toString();
}

export function decodeUrlState(search: string): UrlState | null {
	const sp = new URLSearchParams(search);
	if (!sp.has(KEY_MAP.preset)) return null;

	const preset = sp.get(KEY_MAP.preset) as PresetName;
	if (!(preset in PRESETS)) return null;

	const sectorParam = sp.get(KEY_MAP.selectedSector);
	const personal: PersonalInputs = {
		incomeTarget:
			parseBounded(sp.get(KEY_MAP.incomeTarget), PERSONAL_RANGES.incomeTarget) ?? 75_000,
		currentSavings:
			parseBounded(sp.get(KEY_MAP.currentSavings), PERSONAL_RANGES.currentSavings) ?? 50_000,
		monthlySavings:
			parseBounded(sp.get(KEY_MAP.monthlySavings), PERSONAL_RANGES.monthlySavings) ?? 1_000,
		selectedSector:
			sectorParam && SECTORS.some((s) => s.name === sectorParam)
				? sectorParam
				: 'Technology/Software'
	};

	// Apply any custom param overrides, skipping anything unparseable or out of range
	const baseParams = { ...PRESETS[preset].params };
	const paramOverrides: Partial<ScenarioParams> = {};

	for (const [key, shortKey] of Object.entries(KEY_MAP)) {
		if (!(key in baseParams) || !sp.has(shortKey)) continue;
		const range = PARAM_RANGES[key];
		if (!range) continue;
		const parsed = parseBounded(sp.get(shortKey), range);
		if (parsed === null) continue;
		(paramOverrides as unknown as Record<string, unknown>)[key] = parsed;
	}

	return { personal, preset, params: paramOverrides };
}
