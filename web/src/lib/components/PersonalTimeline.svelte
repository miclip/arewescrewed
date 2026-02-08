<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { personalOutcome } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { PersonalOutcome } from '$lib/model/types';

	let outcome = $state<PersonalOutcome | null>(null);

	$effect(() => {
		const unsub = personalOutcome.subscribe((v) => {
			outcome = v;
		});
		return unsub;
	});

	let data = $derived(outcome?.accumulationPath ?? []);

	// Target line: flat line at required portfolio value
	let targetData = $derived(
		data.length > 0
			? [
					{ year: data[0].year, value: outcome?.requiredPortfolio ?? 0 },
					{ year: data[data.length - 1].year, value: outcome?.requiredPortfolio ?? 0 }
				]
			: []
	);

	// Displacement year vertical line: from 0 to max
	let maxValue = $derived(
		Math.max(outcome?.requiredPortfolio ?? 0, ...data.map((d) => d.value)) * 1.1
	);

	let displacementLineData = $derived(
		outcome
			? [
					{ year: outcome.displacementYear, value: 0 },
					{ year: outcome.displacementYear, value: maxValue }
				]
			: []
	);
</script>

{#if outcome && data.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Your Portfolio Path
		</h3>
		<div class="h-64" style="--chart-area-fill: rgba(56, 189, 248, 0.2);">
			<Chart
				{data}
				x="year"
				xScale={scaleLinear()}
				xDomain={[data[0].year, data[data.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxValue]}
				yNice
				padding={{ left: 52, bottom: 28, top: 8, right: 8 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompact(v)} />
					<Axis placement="bottom" format={(v) => String(Math.round(v))} />

					<!-- Required portfolio target line (red dashed horizontal) -->
					<Spline
						data={targetData}
						x="year"
						y="value"
						stroke="#f87171"
						strokeWidth={1}
					/>

					<!-- Displacement year (yellow dashed vertical) -->
					<Spline
						data={displacementLineData}
						x="year"
						y="value"
						stroke="#fbbf24"
						strokeWidth={1}
					/>

					<!-- Accumulation area (fill + line) -->
					<Area />
					<Spline stroke="#38bdf8" strokeWidth={2} />
				</Svg>
			</Chart>
		</div>
		<div class="flex gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-accent inline-block"></span> Your portfolio
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-red inline-block"></span> Target: {formatCompact(outcome.requiredPortfolio)}
			</span>
			<span class="flex items-center gap-1">
				<span class="w-0.5 h-3 bg-yellow inline-block"></span> Displaced: {outcome.displacementYear}
			</span>
		</div>
	</div>
{/if}
