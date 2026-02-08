<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { portfolioResult } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { PortfolioResult } from '$lib/model/types';

	let result = $state<PortfolioResult | null>(null);

	$effect(() => {
		const unsub = portfolioResult.subscribe((v) => { result = v; });
		return unsub;
	});

	let dividendData = $derived(
		result?.yearlyResults.map((yr) => ({ year: yr.year, value: yr.totalDividends })) ?? []
	);

	let totalData = $derived(
		result?.yearlyResults.map((yr) => ({ year: yr.year, value: yr.totalIncome })) ?? []
	);

	let maxIncome = $derived(
		totalData.length > 0 ? Math.max(...totalData.map((d) => d.value)) * 1.1 : 1
	);
</script>

{#if totalData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Portfolio Income (per $1M invested)
		</h3>
		<p class="text-xs text-text-muted">
			Annual income from a 10-company portfolio using the 4% safe withdrawal rate. Dividends + selling appreciated shares.
		</p>
		<div class="h-48 md:h-56" style="--chart-area-fill: rgba(56, 189, 248, 0.15);">
			<Chart
				data={totalData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[totalData[0].year, totalData[totalData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxIncome]}
				yNice
				padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompact(v)} />
					<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

					<!-- Total income (fill + line) -->
					<Area />
					<Spline stroke="#38bdf8" strokeWidth={2} />

					<!-- Dividends only (green line) -->
					<Spline
						data={dividendData}
						x="year"
						y="value"
						stroke="#4ade80"
						strokeWidth={2}
					/>
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-accent inline-block"></span> Total income (4% SWR)
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-moderate inline-block"></span> Dividends only
			</span>
		</div>
	</div>
{/if}
