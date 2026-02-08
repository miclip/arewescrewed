<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { amazonProjections } from '$lib/stores/results';
	import { formatCompactNum } from '$lib/model/format';
	import type { YearProjection } from '$lib/model/types';

	let projections = $state<YearProjection[]>([]);

	$effect(() => {
		const unsub = amazonProjections.subscribe((v) => { projections = v; });
		return unsub;
	});

	let remainingData = $derived(
		projections.map((p) => ({ year: p.year, value: p.remainingHeadcount }))
	);

	let originalData = $derived(
		projections.map((p) => ({ year: p.year, value: p.originalHeadcount }))
	);

	let maxCount = $derived(originalData.length > 0 ? originalData[0].value * 1.1 : 1);
</script>

{#if remainingData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Amazon: Workforce Displacement
		</h3>
		<p class="text-xs text-text-muted">
			The S-curve ramp: displacement starts slowly, accelerates in the middle years, then plateaus. 1.56M employees today.
		</p>
		<div class="h-56" style="--chart-area-fill: rgba(251, 146, 60, 0.15);">
			<Chart
				data={remainingData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[remainingData[0].year, remainingData[remainingData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxCount]}
				yNice
				padding={{ left: 52, bottom: 28, top: 8, right: 8 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompactNum(v)} />
					<Axis placement="bottom" format={(v) => String(Math.round(v))} />

					<!-- Original headcount (dashed line) -->
					<Spline
						data={originalData}
						x="year"
						y="value"
						stroke="rgba(56, 189, 248, 0.4)"
						strokeWidth={1}
					/>

					<!-- Remaining workforce (fill + line) -->
					<Area />
					<Spline stroke="#fb923c" strokeWidth={2} />
				</Svg>
			</Chart>
		</div>
		<div class="flex gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-orange inline-block"></span> Remaining workers
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-accent/40 inline-block"></span> Original headcount
			</span>
		</div>
	</div>
{/if}
