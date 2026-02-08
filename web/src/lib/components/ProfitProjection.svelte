<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { amazonProjections } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { YearProjection } from '$lib/model/types';

	let projections = $state<YearProjection[]>([]);

	$effect(() => {
		const unsub = amazonProjections.subscribe((v) => {
			projections = v;
		});
		return unsub;
	});

	let baselineData = $derived(
		projections.map((p) => ({ year: p.year, value: p.originalProfit / 1e9 }))
	);

	let profitData = $derived(
		projections.map((p) => ({ year: p.year, value: p.newProfit / 1e9 }))
	);

	let maxProfit = $derived(
		Math.max(
			...baselineData.map((d) => d.value),
			...profitData.map((d) => d.value)
		) * 1.1 || 1
	);
</script>

{#if profitData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Amazon: Profit Projection ($B)
		</h3>
		<p class="text-xs text-text-muted">
			How AI labor savings explode Amazon's bottom line. Base profit grows with revenue; AI savings stack on top.
		</p>
		<div class="h-48 md:h-56" style="--chart-area-fill: rgba(56, 189, 248, 0.15);">
			<Chart
				data={profitData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[profitData[0].year, profitData[profitData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxProfit]}
				yNice
				padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => `$${v.toFixed(0)}B`} />
					<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

					<!-- New profit with AI savings (fill + line) -->
					<Area />
					<Spline stroke="#38bdf8" strokeWidth={2} />

					<!-- Original profit baseline (dashed red line) -->
					<Spline
						data={baselineData}
						x="year"
						y="value"
						stroke="rgba(248, 113, 113, 0.6)"
						strokeWidth={1}
					/>
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-accent inline-block"></span> With AI savings
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-red/60 inline-block"></span> Baseline
			</span>
		</div>
	</div>
{/if}
