import { writable, derived } from 'svelte/store';
import type { ScenarioParams } from '$lib/model/types';
import { PRESETS, type PresetName } from '$lib/model/presets';

export const activePreset = writable<PresetName>('moderate');

export const scenarioParams = writable<ScenarioParams>({ ...PRESETS.moderate.params });

/** Apply a preset and update params */
export function applyPreset(name: PresetName): void {
	activePreset.set(name);
	scenarioParams.set({ ...PRESETS[name].params });
}

/** Check if current params match a preset */
export const isCustomized = derived(
	[activePreset, scenarioParams],
	([$activePreset, $scenarioParams]) => {
		const preset = PRESETS[$activePreset].params;
		return JSON.stringify($scenarioParams) !== JSON.stringify(preset);
	}
);
