<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { providerProjections } from '$lib/stores/results';
	import { formatCompactNum } from '$lib/model/format';
	import type { ProviderYearProjection } from '$lib/model/provider-engine';

	let projections = $state<ProviderYearProjection[]>([]);

	$effect(() => {
		const unsub = providerProjections.subscribe((v) => {
			projections = v;
		});
		return unsub;
	});

	let revenueData = $derived(
		projections.map((p) => ({ year: p.year, value: p.providerRevenue / 1e9 }))
	);

	let profitData = $derived(
		projections.map((p) => ({ year: p.year, value: p.providerProfit / 1e9 }))
	);

	let trainingCostData = $derived(
		projections.map((p) => ({ year: p.year, value: p.trainingRdCost / 1e9 }))
	);

	let maxRevenue = $derived(
		revenueData.length > 0
			? Math.max(
					...revenueData.map((d) => d.value),
					...profitData.map((d) => d.value),
					...trainingCostData.map((d) => d.value)
				) * 1.15
			: 1
	);

	// Find peak year
	let peakIdx = $derived.by(() => {
		let idx = 0;
		let max = 0;
		for (let i = 0; i < revenueData.length; i++) {
			if (revenueData[i].value > max) {
				max = revenueData[i].value;
				idx = i;
			}
		}
		return idx;
	});

	let peakYear = $derived(revenueData.length > 0 ? revenueData[peakIdx].year : 0);
	let peakValue = $derived(revenueData.length > 0 ? revenueData[peakIdx].value : 0);
</script>

{#if revenueData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			AI Provider Revenue (Economy-Wide)
		</h3>
		<p class="text-xs text-text-muted">
			Revenue peaks at <span class="text-accent font-mono">${peakValue.toFixed(0)}B</span> in
			<span class="text-accent font-mono">{peakYear}</span> — workers displaced via S-curve but
			per-worker AI cost declines exponentially, creating a hump.
		</p>
		<div class="h-48 md:h-56" style="--chart-area-fill: rgba(139, 92, 246, 0.15);">
			<Chart
				data={revenueData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[revenueData[0].year, revenueData[revenueData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxRevenue]}
				yNice
				padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => `$${formatCompactNum(v * 1e9).replace('$', '')}`} />
					<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

					<!-- Revenue hump (fill + line) -->
					<Area />
					<Spline stroke="#8b5cf6" strokeWidth={2} />

					<!-- Profit line -->
					<Spline
						data={profitData}
						x="year"
						y="value"
						stroke="#4ade80"
						strokeWidth={1.5}
					/>

					<!-- Training/R&D cost line -->
					<Spline
						data={trainingCostData}
						x="year"
						y="value"
						stroke="#f87171"
						strokeWidth={1.5}
					/>
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 inline-block" style="background: #8b5cf6;"></span> Revenue
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 inline-block" style="background: #4ade80;"></span> Profit
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 inline-block" style="background: #f87171;"></span> Training/R&D
			</span>
		</div>
	</div>
{/if}
