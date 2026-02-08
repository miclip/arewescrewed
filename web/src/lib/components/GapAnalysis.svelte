<script lang="ts">
	import { allScenariosOutcome } from '$lib/stores/results';
	import { PRESET_ORDER, PRESETS } from '$lib/model/presets';
	import { formatCompact } from '$lib/model/format';
	import type { PersonalOutcome } from '$lib/model/types';

	let outcomes = $state<PersonalOutcome[]>([]);

	$effect(() => {
		const unsub = allScenariosOutcome.subscribe((v) => {
			outcomes = v;
		});
		return unsub;
	});

	const colors = ['#38bdf8', '#4ade80', '#fbbf24', '#f87171'];

	let maxAbsGap = $derived(
		outcomes.length > 0
			? Math.max(...outcomes.map((o) => Math.abs(o.gap))) * 1.1
			: 1
	);
</script>

{#if outcomes.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Gap Analysis by Scenario
		</h3>
		<p class="text-xs text-text-muted">
			Surplus or shortfall at displacement year. Green = you have enough. Red = you don't.
		</p>
		<div class="space-y-3 mt-3">
			{#each PRESET_ORDER as name, i}
				{@const outcome = outcomes[i]}
				{@const pct = outcome ? Math.min(Math.abs(outcome.gap) / maxAbsGap, 1) * 100 : 0}
				{@const isPositive = outcome && outcome.gap >= 0}
				<div class="space-y-1">
					<div class="flex justify-between text-xs">
						<span class="text-text-muted">
							<span class="inline-block w-2 h-2 rounded-full mr-1" style="background: {colors[i]}"></span>
							{PRESETS[name].label}
							<span class="text-text-muted/60 ml-1">displaced {outcome?.displacementYear}</span>
						</span>
						<span class="font-mono" class:text-green={isPositive} class:text-red={!isPositive}>
							{isPositive ? '+' : ''}{formatCompact(outcome?.gap ?? 0)}
						</span>
					</div>
					<div class="h-3 bg-bg-input rounded-full overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500"
							style="width: {pct}%; background: {isPositive ? '#4ade80' : '#f87171'};"
						></div>
					</div>
					{#if outcome && !isPositive}
						<div class="text-[10px] text-text-muted/60">
							Need {formatCompact(outcome.monthlyNeededToClose)}/mo extra to close gap
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}
