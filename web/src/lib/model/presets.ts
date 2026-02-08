import type { ScenarioParams } from './types';

export type PresetName = 'conservative' | 'moderate' | 'aggressive' | 'extreme';

export interface PresetInfo {
	name: PresetName;
	label: string;
	description: string;
	color: string;
	params: ScenarioParams;
}

const BASE_SCENARIO: Omit<ScenarioParams, 'laborReductionPct' | 'aiCostPerWorkerYear' | 'aiCostDeclineRate' | 'marginRetentionPct' | 'dividendPayoutRatio' | 'rampYears' | 'revenueGrowthRate' | 'supplyChainCostPct' | 'investorModelAdoption'> = {
	yearsForward: 30,
	baseYear: 2025,
	wageShareOfSpending: 0.9,
	essentialsFloor: 0.2,
	aiSubsidyYears: 3, // ~3 years of below-cost AI pricing (2025-2028)
	aiCostCorrectionPct: 2.0 // Costs double when subsidies end
};

export const PRESETS: Record<PresetName, PresetInfo> = {
	conservative: {
		name: 'conservative',
		label: 'Conservative',
		description: '25% jobs replaced over 20 years',
		color: 'var(--color-conservative)',
		params: {
			...BASE_SCENARIO,
			laborReductionPct: 0.25,
			aiCostPerWorkerYear: 40_000, // Easy jobs, mature tech
			aiCostDeclineRate: 0.15,
			marginRetentionPct: 0.6,
			dividendPayoutRatio: 0.3,
			investorModelAdoption: 0.8, // Gradual change, people adapt
			rampYears: 20,
			revenueGrowthRate: 0.04,
			supplyChainCostPct: 0.15
		}
	},
	moderate: {
		name: 'moderate',
		label: 'Moderate',
		description: '50% jobs replaced over 15 years',
		color: 'var(--color-moderate)',
		params: {
			...BASE_SCENARIO,
			laborReductionPct: 0.5,
			aiCostPerWorkerYear: 60_000, // Mix of easy and moderate jobs
			aiCostDeclineRate: 0.2,
			marginRetentionPct: 0.5,
			dividendPayoutRatio: 0.4,
			investorModelAdoption: 0.7,
			rampYears: 15,
			revenueGrowthRate: 0.04,
			supplyChainCostPct: 0.25
		}
	},
	aggressive: {
		name: 'aggressive',
		label: 'Aggressive',
		description: '75% jobs replaced over 10 years',
		color: 'var(--color-aggressive)',
		params: {
			...BASE_SCENARIO,
			laborReductionPct: 0.75,
			aiCostPerWorkerYear: 80_000, // Harder specialized roles
			aiCostDeclineRate: 0.25,
			marginRetentionPct: 0.4,
			dividendPayoutRatio: 0.4,
			investorModelAdoption: 0.5, // Fast disruption, less time to adapt
			rampYears: 10,
			revenueGrowthRate: 0.03,
			supplyChainCostPct: 0.4
		}
	},
	extreme: {
		name: 'extreme',
		label: 'Extreme',
		description: '95% jobs replaced over 8 years',
		color: 'var(--color-extreme)',
		params: {
			...BASE_SCENARIO,
			laborReductionPct: 0.95,
			aiCostPerWorkerYear: 100_000, // Hardest jobs, bleeding edge AI
			aiCostDeclineRate: 0.3,
			marginRetentionPct: 0.3,
			dividendPayoutRatio: 0.3, // Companies hoard cash in crisis
			investorModelAdoption: 0.3, // Rapid collapse, no time to adapt
			rampYears: 8,
			revenueGrowthRate: 0.02,
			supplyChainCostPct: 0.6
		}
	}
};

export const PRESET_ORDER: PresetName[] = ['conservative', 'moderate', 'aggressive', 'extreme'];
