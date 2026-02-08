<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { personalOutcome } from '$lib/stores/results';
	import { personalInputs } from '$lib/stores/personal';
	import { formatCompact } from '$lib/model/format';
	import type { PersonalOutcome } from '$lib/model/types';

	let outcome = $state<PersonalOutcome | null>(null);
	let income = $state(75_000);

	$effect(() => {
		const unsub = personalOutcome.subscribe((v) => { outcome = v; });
		return unsub;
	});
	$effect(() => {
		const unsub = personalInputs.subscribe((v) => { income = v.incomeTarget; });
		return unsub;
	});

	// Portfolio income = accumulated portfolio value × 4% SWR each year
	let incomeData = $derived(
		outcome?.accumulationPath.map((pt) => ({
			year: pt.year,
			value: pt.value * 0.04
		})) ?? []
	);

	let targetData = $derived(
		incomeData.length > 0
			? [
					{ year: incomeData[0].year, value: income },
					{ year: incomeData[incomeData.length - 1].year, value: income }
				]
			: []
	);

	let maxIncome = $derived(
		incomeData.length > 0
			? Math.max(income, ...incomeData.map((d) => d.value)) * 1.1
			: 1
	);

	// Find crossover year
	let crossoverYear = $derived.by(() => {
		for (const d of incomeData) {
			if (d.value >= income) return d.year;
		}
		return null;
	});
</script>

{#if incomeData.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Income Replacement
		</h3>
		<p class="text-xs text-text-muted">
			When does your portfolio income match your {formatCompact(income)}/yr target?
			{#if crossoverYear}
				<span class="text-green font-semibold">Crosses in {crossoverYear}.</span>
			{:else}
				<span class="text-red font-semibold">Doesn't reach target in this timeframe.</span>
			{/if}
		</p>
		<div class="h-48 md:h-56" style="--chart-area-fill: rgba(74, 222, 128, 0.1);">
			<Chart
				data={incomeData}
				x="year"
				xScale={scaleLinear()}
				xDomain={[incomeData[0].year, incomeData[incomeData.length - 1].year]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxIncome]}
				yNice
				padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis placement="left" format={(v) => formatCompact(v)} />
					<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

					<!-- Income target line -->
					<Spline
						data={targetData}
						x="year"
						y="value"
						stroke="#f87171"
						strokeWidth={1}
					/>

					<!-- Portfolio income -->
					<Area />
					<Spline stroke="#4ade80" strokeWidth={2} />
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-green inline-block"></span> Portfolio income (4% SWR)
			</span>
			<span class="flex items-center gap-1">
				<span class="w-3 h-0.5 bg-red inline-block"></span> Target: {formatCompact(income)}/yr
			</span>
		</div>
	</div>
{/if}
