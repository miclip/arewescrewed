<script lang="ts">
	import { Chart, Svg, Spline, Axis, Rule } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
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

	let maxValue = $derived(
		Math.max(
			...outcomes.flatMap((o) => [o.requiredPortfolio, ...o.accumulationPath.map((d) => d.value)])
		) * 1.1 || 1
	);

	let years = $derived(outcomes[0]?.accumulationPath ?? []);
</script>

{#if outcomes.length > 0 && years.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Scenario Comparison
		</h3>
		<div class="h-64">
			<Chart
				data={years}
				x="year"
				xScale={scaleLinear()}
				xDomain={[years[0].year, years[years.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxValue]}
				yNice
				padding={{ left: 52, bottom: 28, top: 8, right: 8 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompact(v)} />
					<Axis placement="bottom" format={(v) => String(Math.round(v))} />

					<!-- Same accumulation line for all (they diverge due to different growth rates) -->
					{#each outcomes as outcome, i}
						<Spline
							data={outcome.accumulationPath}
							x="year"
							y="value"
							class="stroke-2"
							stroke={colors[i]}
						/>
						<!-- Displacement year marker -->
						<Rule
							x={outcome.displacementYear}
							class="stroke-dashed"
							style="stroke: {colors[i]}; opacity: 0.4"
						/>
					{/each}
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-3 text-xs text-text-muted justify-center">
			{#each PRESET_ORDER as name, i}
				{@const outcome = outcomes[i]}
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 inline-block" style="background: {colors[i]}"></span>
					{PRESETS[name].label}
					{#if outcome}
						<span class="font-mono" style="color: {colors[i]}">
							({outcome.gap >= 0 ? '+' : ''}{formatCompact(outcome.gap)})
						</span>
					{/if}
				</span>
			{/each}
		</div>
	</div>
{/if}
