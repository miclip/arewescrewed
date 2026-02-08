<script lang="ts">
	import { activePreset, applyPreset } from '$lib/stores/scenario';
	import { PRESETS, PRESET_ORDER, type PresetName } from '$lib/model/presets';

	let current = $state<PresetName>('moderate');

	$effect(() => {
		const unsub = activePreset.subscribe((v) => {
			current = v;
		});
		return unsub;
	});

	const colorMap: Record<PresetName, string> = {
		conservative: 'bg-conservative/20 border-conservative text-conservative',
		moderate: 'bg-moderate/20 border-moderate text-moderate',
		aggressive: 'bg-aggressive/20 border-aggressive text-aggressive',
		extreme: 'bg-extreme/20 border-extreme text-extreme'
	};

	const activeColorMap: Record<PresetName, string> = {
		conservative: 'bg-conservative text-bg',
		moderate: 'bg-moderate text-bg',
		aggressive: 'bg-aggressive text-bg',
		extreme: 'bg-extreme text-bg'
	};
</script>

<div class="space-y-3">
	<h2 class="text-lg font-semibold text-text">AI Scenario</h2>
	<div class="grid grid-cols-4 gap-2">
		{#each PRESET_ORDER as name}
			{@const preset = PRESETS[name]}
			<button
				onclick={() => applyPreset(name)}
				class="rounded-lg border px-3 py-2 text-left transition-all text-sm {current === name
					? activeColorMap[name] + ' border-transparent font-semibold'
					: colorMap[name] + ' hover:opacity-80'}"
			>
				<div class="font-medium">{preset.label}</div>
				<div class="text-xs opacity-75">{preset.description}</div>
			</button>
		{/each}
	</div>
</div>
