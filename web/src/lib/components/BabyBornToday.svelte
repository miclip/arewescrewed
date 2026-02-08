<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { babyOutcome } from '$lib/stores/results';
	import { babyInputs } from '$lib/stores/baby';
	import { formatCompact } from '$lib/model/format';
	import { BASE_INCOME_TARGET } from '$lib/model/baby-engine';
	import type { BabyOutcome } from '$lib/model/baby-engine';

	let outcome = $state<BabyOutcome | null>(null);
	let giftAmount = $state(50_000);

	$effect(() => {
		const unsub = babyOutcome.subscribe((v) => {
			outcome = v;
		});
		return unsub;
	});

	$effect(() => {
		const unsub = babyInputs.subscribe((v) => {
			giftAmount = v.giftAmount;
		});
		return unsub;
	});

	function updateGift(val: number) {
		giftAmount = val;
		babyInputs.update((b) => ({ ...b, giftAmount: val }));
	}

	// Portfolio value chart data
	let valueData = $derived(outcome?.growthPath ?? []);
	let maxValue = $derived(
		Math.max(outcome?.requiredFor75k ?? 0, ...valueData.map((d) => d.value)) * 1.1
	);

	// Target line at $1.875M
	let targetData = $derived(
		valueData.length > 0
			? [
					{ year: valueData[0].year, value: outcome?.requiredFor75k ?? 0 },
					{ year: valueData[valueData.length - 1].year, value: outcome?.requiredFor75k ?? 0 }
				]
			: []
	);

	// Unlock year vertical line
	let unlockLineData = $derived(
		outcome
			? [
					{ year: outcome.unlockYear, value: 0 },
					{ year: outcome.unlockYear, value: maxValue }
				]
			: []
	);

	// Income chart data
	let incomeData = $derived(outcome?.growthPath.map((p) => ({ year: p.year, age: p.age, value: p.income })) ?? []);
	let maxIncome = $derived(
		Math.max(BASE_INCOME_TARGET, ...incomeData.map((d) => d.value)) * 1.1
	);

	// Income target line
	let incomeTargetData = $derived(
		incomeData.length > 0
			? [
					{ year: incomeData[0].year, value: BASE_INCOME_TARGET },
					{ year: incomeData[incomeData.length - 1].year, value: BASE_INCOME_TARGET }
				]
			: []
	);

	// Cost-adjusted income target line (what $75k purchasing power actually costs)
	let adjustedIncomeTargetData = $derived(
		outcome && outcome.costOfLivingPath.length > 0
			? outcome.costOfLivingPath.map((p) => ({
					year: p.year,
					value: p.adjustedIncomeNeeded
				}))
			: []
	);

	// Unlock year vertical for income chart
	let incomeUnlockLineData = $derived(
		outcome
			? [
					{ year: outcome.unlockYear, value: 0 },
					{ year: outcome.unlockYear, value: maxIncome }
				]
			: []
	);

	// Cost of living chart data
	let costData = $derived(
		outcome?.costOfLivingPath.map((p) => ({
			year: p.year,
			age: p.age,
			value: p.costFraction * 100
		})) ?? []
	);

	let costUnlockLineData = $derived(
		outcome
			? [
					{ year: outcome.unlockYear, value: 0 },
					{ year: outcome.unlockYear, value: 110 }
				]
			: []
	);

	// Comparison: monthly savings needed starting at age 22 to reach same value at 30
	let monthlySavingsComparison = $derived.by(() => {
		if (!outcome || outcome.valueAt30 <= 0) return 0;
		const annualRate = 0.08;
		const months = 8 * 12;
		const monthlyRate = annualRate / 12;
		const fvFactorMonthly = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
		return fvFactorMonthly > 0 ? outcome.valueAt30 / fvFactorMonthly : 0;
	});

	let costReductionAtUnlockPct = $derived(
		outcome ? Math.round((1 - outcome.costFractionAtUnlock) * 100) : 0
	);

	// Key for forcing chart re-renders when data changes
	let chartKey = $derived(JSON.stringify([
		outcome?.valueAtUnlock,
		outcome?.valueAt30,
		outcome?.giftAmount,
		outcome?.giftNeededFor75k
	]));
</script>

{#if outcome}
	<div class="space-y-8">
		<!-- Header -->
		<div class="space-y-3">
			<h2 class="text-2xl font-bold text-text">A Baby Born Today</h2>
			<p class="text-text-muted leading-relaxed max-w-2xl">
				What if the state gave every newborn a lump-sum investment grant at birth? By the time they enter the workforce,
				AI displacement will be well underway — but decades of compound growth could give them a head start.
				And as AI drives costs down across the economy, $75k of purchasing power won't cost $75k anymore.
			</p>
		</div>

		<!-- Gift amount slider -->
		<div class="bg-bg-card rounded-lg p-3 sm:p-5 space-y-3">
			<div class="flex justify-between items-center">
				<label for="gift-slider" class="text-sm font-medium text-text-muted">
					Birth Grant Amount
				</label>
				<span class="text-lg font-bold text-accent">{formatCompact(giftAmount)}</span>
			</div>
			<input
				id="gift-slider"
				type="range"
				min="1000"
				max="200000"
				step="1000"
				value={giftAmount}
				oninput={(e) => updateGift(Number((e.target as HTMLInputElement).value))}
				class="w-full accent-accent"
			/>
			<div class="flex justify-between text-xs text-text-muted">
				<span>$1k</span>
				<span>$50k</span>
				<span>$100k</span>
				<span>$200k</span>
			</div>
		</div>

		<!-- "Gift needed" callout -->
		<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input space-y-2">
			<div class="text-xs font-medium text-text-muted uppercase tracking-wide">
				What grant provides $75k/yr at age 21?
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<div class="flex items-baseline gap-2">
						<span class="text-xl font-bold text-accent">{formatCompact(outcome.giftNeededFor75k)}</span>
						<span class="text-xs text-text-muted">in today's dollars</span>
					</div>
					<p class="text-xs text-text-muted mt-1">
						Assumes costs stay at today's levels
					</p>
				</div>
				<div>
					<div class="flex items-baseline gap-2">
						<span class="text-xl font-bold text-green">{formatCompact(outcome.giftNeededFor75kAdjusted)}</span>
						<span class="text-xs text-text-muted">cost-adjusted</span>
					</div>
					<p class="text-xs text-text-muted mt-1">
						Costs drop ~{costReductionAtUnlockPct}% by age 21 — $75k lifestyle only costs {formatCompact(BASE_INCOME_TARGET * outcome.costFractionAtUnlock)}
					</p>
				</div>
			</div>
		</div>

		<!-- Key stat cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input">
				<div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
					At Age 21 (Unlock)
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold text-accent">{formatCompact(outcome.valueAtUnlock)}</span>
					<span class="text-xs text-text-muted">portfolio</span>
				</div>
				<div class="flex items-baseline gap-2 mt-2">
					<span class="text-lg font-semibold text-text">{formatCompact(outcome.annualIncomeAtUnlock)}/yr</span>
					<span class="text-xs text-text-muted">passive income (4% withdrawal)</span>
				</div>
			</div>
			<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input">
				<div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
					At Age 30
				</div>
				<div class="flex items-baseline gap-2">
					<span class="text-2xl font-bold text-green">{formatCompact(outcome.valueAt30)}</span>
					<span class="text-xs text-text-muted">portfolio</span>
				</div>
				<div class="flex items-baseline gap-2 mt-2">
					<span class="text-lg font-semibold text-text">{formatCompact(outcome.annualIncomeAt30)}/yr</span>
					<span class="text-xs text-text-muted">passive income (4% withdrawal)</span>
				</div>
			</div>
		</div>

		<!-- Chart 1: Portfolio Growth -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Portfolio Value Over Time
			</h3>
			<div class="h-48 md:h-72" style="--chart-area-fill: rgba(56, 189, 248, 0.15);">
				{#key chartKey}
				<Chart
					data={valueData}
					x="year"
					xScale={scaleLinear()}
					xDomain={[valueData[0].year, valueData[valueData.length - 1].year]}
					y="value"
					yScale={scaleLinear()}
					yDomain={[0, maxValue]}
					yNice
					padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
				>
					<Svg>
						<Axis placement="left" format={(v) => formatCompact(v)} />
						<Axis placement="bottom" format={(v) => String(Math.round(v))} />

						<!-- $1.875M target line (green) -->
						<Spline
							data={targetData}
							x="year"
							y="value"
							stroke="#4ade80"
							strokeWidth={1}
						/>

						<!-- Unlock year vertical (yellow) -->
						<Spline
							data={unlockLineData}
							x="year"
							y="value"
							stroke="#fbbf24"
							strokeWidth={1}
						/>

						<!-- Portfolio value area -->
						<Area />
						<Spline stroke="#38bdf8" strokeWidth={2} />
					</Svg>
				</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-accent inline-block"></span> Portfolio value
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-green inline-block"></span> $75k income target ({formatCompact(outcome.requiredFor75k)})
				</span>
				<span class="flex items-center gap-1">
					<span class="w-0.5 h-3 bg-yellow inline-block"></span> Unlock: age 21 ({outcome.unlockYear})
				</span>
			</div>
		</div>

		<!-- Chart 2: Annual Income at 4% SWR -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Annual Income at 4% SWR
			</h3>
			<div class="h-48 md:h-64" style="--chart-area-fill: rgba(74, 222, 128, 0.15);">
				{#key chartKey}
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
						<Axis placement="bottom" format={(v) => String(Math.round(v))} />

						<!-- $75k target line (red, nominal) -->
						<Spline
							data={incomeTargetData}
							x="year"
							y="value"
							stroke="#f87171"
							strokeWidth={1}
						/>

						<!-- Cost-adjusted income needed (orange, declining) -->
						<Spline
							data={adjustedIncomeTargetData}
							x="year"
							y="value"
							stroke="#fb923c"
							strokeWidth={1}
						/>

						<!-- Unlock year vertical (yellow) -->
						<Spline
							data={incomeUnlockLineData}
							x="year"
							y="value"
							stroke="#fbbf24"
							strokeWidth={1}
						/>

						<!-- Income area -->
						<Area />
						<Spline stroke="#4ade80" strokeWidth={2} />
					</Svg>
				</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-green inline-block"></span> Annual income (4% SWR)
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-red inline-block"></span> $75k nominal
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-orange inline-block"></span> $75k cost-adjusted
				</span>
				<span class="flex items-center gap-1">
					<span class="w-0.5 h-3 bg-yellow inline-block"></span> Unlock: age 21
				</span>
			</div>
		</div>

		<!-- Chart 3: Declining Cost of Living -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Cost of Living (% of Today)
			</h3>
			<p class="text-xs text-text-muted">
				As AI automates supply chains — shipping, manufacturing, agriculture — the cost of everything drops.
				This is what $75k of today's lifestyle costs over time.
			</p>
			<div class="h-48 md:h-56" style="--chart-area-fill: rgba(251, 146, 60, 0.15);">
				{#key chartKey}
				<Chart
					data={costData}
					x="year"
					xScale={scaleLinear()}
					xDomain={[costData[0].year, costData[costData.length - 1].year]}
					y="value"
					yScale={scaleLinear()}
					yDomain={[0, 110]}
					yNice
					padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
				>
					<Svg>
						<Axis placement="left" format={(v) => v + '%'} />
						<Axis placement="bottom" format={(v) => String(Math.round(v))} />

						<!-- Unlock year vertical (yellow) -->
						<Spline
							data={costUnlockLineData}
							x="year"
							y="value"
							stroke="#fbbf24"
							strokeWidth={1}
						/>

						<!-- Cost of living line -->
						<Area />
						<Spline stroke="#fb923c" strokeWidth={2} />
					</Svg>
				</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-orange inline-block"></span> Cost of living
				</span>
				<span class="flex items-center gap-1">
					<span class="w-0.5 h-3 bg-yellow inline-block"></span> Unlock: age 21
				</span>
			</div>
		</div>

		<!-- Comparison callout -->
		{#if monthlySavingsComparison > 0}
			<div class="bg-bg-card rounded-lg p-5 border border-accent/30">
				<p class="text-text leading-relaxed">
					A <span class="font-bold text-accent">{formatCompact(giftAmount)}</span> grant at birth could grow to
					<span class="font-bold text-green">{formatCompact(outcome.valueAt30)}</span> by age 30,
					generating <span class="font-bold text-green">{formatCompact(outcome.annualIncomeAt30)}/yr</span>.
					To reach that same amount starting from scratch at age 22, you'd need to save
					<span class="font-bold text-yellow">{formatCompact(monthlySavingsComparison)}/mo</span> for 8 years.
				</p>
			</div>
		{/if}
	</div>
{/if}
