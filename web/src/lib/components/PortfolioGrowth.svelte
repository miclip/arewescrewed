<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { portfolioResult } from '$lib/stores/results';
	import { personalInputs } from '$lib/stores/personal';
	import { formatCompact } from '$lib/model/format';
	import type { PortfolioResult } from '$lib/model/types';

	let result = $state<PortfolioResult | null>(null);
	let income = $state(75_000);

	$effect(() => {
		const unsub = portfolioResult.subscribe((v) => { result = v; });
		return unsub;
	});
	$effect(() => {
		const unsub = personalInputs.subscribe((v) => { income = v.incomeTarget; });
		return unsub;
	});

	let requiredPortfolio = $derived(income / 0.04);
	let scaleFactor = $derived(requiredPortfolio / 1_000_000);

	let valueData = $derived(
		result?.yearlyResults.map((yr) => ({
			year: yr.year,
			value: yr.portfolioValue * scaleFactor
		})) ?? []
	);

	let targetData = $derived(
		valueData.length > 0
			? [
					{ year: valueData[0].year, value: requiredPortfolio },
					{ year: valueData[valueData.length - 1].year, value: requiredPortfolio }
				]
			: []
	);

	let maxVal = $derived(
		valueData.length > 0
			? Math.max(requiredPortfolio, ...valueData.map((d) => d.value)) * 1.1
			: 1
	);
</script>

{#if valueData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Portfolio Value Growth
		</h3>
		<p class="text-xs text-text-muted">
			How your portfolio appreciates as AI-driven companies grow earnings. Target: {formatCompact(requiredPortfolio)} for {formatCompact(income)}/yr at 4% SWR.
		</p>
		<div class="h-56" style="--chart-area-fill: rgba(56, 189, 248, 0.15);">
			<Chart
				data={valueData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[valueData[0].year, valueData[valueData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxVal]}
				yNice
				padding={{ left: 56, bottom: 28, top: 8, right: 8 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompact(v)} />
					<Axis placement="bottom" format={(v) => String(Math.round(v))} />

					<!-- Required portfolio target -->
					<Spline
						data={targetData}
						x="year"
						y="value"
						stroke="#f87171"
						strokeWidth={1}
					/>

					<!-- Portfolio value -->
					<Area />
					<Spline stroke="#38bdf8" strokeWidth={2} />
				</Svg>
			</Chart>
		</div>
		<div class="flex gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-accent inline-block"></span> Portfolio value
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-red inline-block"></span> Required: {formatCompact(requiredPortfolio)}
			</span>
		</div>
	</div>
{/if}
