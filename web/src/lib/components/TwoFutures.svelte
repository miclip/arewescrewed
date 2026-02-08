<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { scenarioParams } from '$lib/stores/scenario';
	import { runScenario } from '$lib/model/scenario-engine';
	import { PORTFOLIO_COMPANIES } from '$lib/model/companies';
	import type { ScenarioParams } from '$lib/model/types';

	const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;

	let params = $state<ScenarioParams | null>(null);

	$effect(() => {
		const unsub = scenarioParams.subscribe((v) => { params = v; });
		return unsub;
	});

	let investorData = $derived.by(() => {
		if (!params) return [];
		return runScenario(params, amazon).map((p) => ({ year: p.year, value: p.adjustedRevenue / 1e9 }));
	});

	let dystopiaData = $derived.by(() => {
		if (!params) return [];
		const dystopiaParams = { ...params, investorModelAdoption: 0 };
		return runScenario(dystopiaParams, amazon).map((p) => ({ year: p.year, value: p.adjustedRevenue / 1e9 }));
	});

	let maxRev = $derived(
		investorData.length > 0
			? Math.max(...investorData.map((d) => d.value), ...dystopiaData.map((d) => d.value)) * 1.1
			: 1
	);
</script>

{#if investorData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Two Futures: Amazon Revenue ($B)
		</h3>
		<p class="text-xs text-text-muted">
			If displaced workers invest (green), consumer spending holds up. Without the investor model (red), demand collapses — even profitable companies shrink.
		</p>
		<div class="h-48 md:h-56" style="--chart-area-fill: rgba(74, 222, 128, 0.1);">
			<Chart
				data={investorData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[investorData[0].year, investorData[investorData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxRev]}
				yNice
				padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => `$${v.toFixed(0)}B`} />
					<Axis placement="bottom" format={(v) => String(Math.round(v))} />

					<!-- Investor model (green fill + line) -->
					<Area />
					<Spline stroke="#4ade80" strokeWidth={2} />

					<!-- Dystopia (red line with its own data) -->
					<Spline
						data={dystopiaData}
						x="year"
						y="value"
						stroke="#f87171"
						strokeWidth={2}
					/>
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-green inline-block"></span> Workers invest ({params ? Math.round(params.investorModelAdoption * 100) : 70}% adoption)
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-red inline-block"></span> No investor model
			</span>
		</div>
	</div>
{/if}
