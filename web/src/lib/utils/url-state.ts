import type { PersonalInputs, ScenarioParams } from '$lib/model/types';
import type { PresetName } from '$lib/model/presets';
import { PRESETS } from '$lib/model/presets';

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
	aiCostCorrectionPct: 'cc'
};

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
			const presetVal = (presetParams as Record<string, unknown>)[key];
			const currentVal = (params as Record<string, unknown>)[key];
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

	const personal: PersonalInputs = {
		incomeTarget: Number(sp.get(KEY_MAP.incomeTarget)) || 75_000,
		currentSavings: Number(sp.get(KEY_MAP.currentSavings)) || 50_000,
		monthlySavings: Number(sp.get(KEY_MAP.monthlySavings)) || 1_000,
		selectedSector: sp.get(KEY_MAP.selectedSector) || 'Technology/Software'
	};

	// Apply any custom param overrides
	const baseParams = { ...PRESETS[preset].params };
	const paramOverrides: Partial<ScenarioParams> = {};

	for (const [key, shortKey] of Object.entries(KEY_MAP)) {
		if (key in baseParams && sp.has(shortKey)) {
			const val = sp.get(shortKey)!;
			(paramOverrides as Record<string, unknown>)[key] = Number(val);
		}
	}

	return { personal, preset, params: paramOverrides };
}
