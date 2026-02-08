<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { fiscalResult } from '$lib/stores/results';
	import { fiscalParams } from '$lib/stores/fiscal';
	import { formatCompact } from '$lib/model/format';
	import type { FiscalResult, FiscalParams } from '$lib/model/fiscal-engine';

	let result = $state<FiscalResult | null>(null);
	let params = $state<FiscalParams | null>(null);

	$effect(() => {
		const unsub = fiscalResult.subscribe((v) => {
			result = v;
		});
		return unsub;
	});

	$effect(() => {
		const unsub = fiscalParams.subscribe((v) => {
			params = v;
		});
		return unsub;
	});

	// Local slider state
	let corporateTaxPct = $derived(params ? Math.round(params.corporateTaxRate * 100) : 21);
	let capGainsTaxPct = $derived(params ? Math.round(params.capitalGainsTaxRate * 100) : 15);
	let safetyNetCost = $derived(params ? params.safetyNetCostPerPerson : 25_000);
	let equalizeToggle = $derived(params ? params.equalizeCapGainsTax : false);

	function updateParam(key: keyof FiscalParams, value: number | boolean) {
		fiscalParams.update((p) => ({ ...p, [key]: value }));
	}

	// Chart data — all pre-computed as $derived for reactivity
	let projections = $derived(result?.yearlyProjections ?? []);

	// Revenue series (pre-computed, not inline in template)
	let revTotalData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.totalFederalRevenue / 1e12 }))
	);
	let revCorporateData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.corporateTaxRevenue / 1e12 }))
	);
	let revIncomeData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.incomeTaxRevenue / 1e12 }))
	);
	let revPayrollData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.payrollTaxRevenue / 1e12 }))
	);
	let revCapGainsData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.capitalGainsTaxRevenue / 1e12 }))
	);

	let baselineRevenue = $derived(
		params
			? (params.baselineCorporateTaxRevenue +
					params.baselineIncomeTaxRevenue +
					params.baselinePayrollTaxRevenue +
					params.baselineOtherRevenue) /
				1e12
			: 4.9
	);

	let maxRevenue = $derived(
		Math.max(baselineRevenue * 1.1, ...revTotalData.map((d) => d.value)) * 1.1
	);

	let baselineRevenueLineData = $derived(
		revTotalData.length > 0
			? [
					{ year: revTotalData[0].year, value: baselineRevenue },
					{ year: revTotalData[revTotalData.length - 1].year, value: baselineRevenue }
				]
			: []
	);

	// Deficit chart data
	let deficitData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.annualDeficit / 1e12 }))
	);

	let baselineDeficit = $derived(
		params
			? (params.baselineNonInterestSpending +
					params.baselineNationalDebt * params.baselineDebtInterestRate -
					(params.baselineCorporateTaxRevenue +
						params.baselineIncomeTaxRevenue +
						params.baselinePayrollTaxRevenue +
						params.baselineOtherRevenue)) /
				1e12
			: 1.8
	);

	let maxDeficit = $derived(Math.max(...deficitData.map((d) => d.value), baselineDeficit) * 1.15);

	let baselineDeficitLineData = $derived(
		deficitData.length > 0
			? [
					{ year: deficitData[0].year, value: baselineDeficit },
					{ year: deficitData[deficitData.length - 1].year, value: baselineDeficit }
				]
			: []
	);

	// Debt chart data
	let debtData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.totalNationalDebt / 1e12 }))
	);

	let baselineDebtPath = $derived.by(() => {
		if (!params || projections.length === 0) return [];
		let debt = params.baselineNationalDebt;
		const baseRevenue =
			params.baselineCorporateTaxRevenue +
			params.baselineIncomeTaxRevenue +
			params.baselinePayrollTaxRevenue +
			params.baselineOtherRevenue;
		return projections.map((yr, i) => {
			const spending =
				params!.baselineNonInterestSpending * Math.pow(1 + params!.spendingGrowthRate, i);
			const interest = debt * params!.baselineDebtInterestRate;
			const deficit = spending + interest - baseRevenue;
			debt += deficit;
			return { year: yr.year, value: debt / 1e12 };
		});
	});

	let maxDebt = $derived(
		Math.max(
			...debtData.map((d) => d.value),
			...baselineDebtPath.map((d) => d.value)
		) * 1.1
	);

	// Debt-to-GDP chart data
	let debtToGDPData = $derived(
		projections.map((yr) => ({ year: yr.year, value: yr.debtToGDP * 100 }))
	);

	let maxDebtToGDP = $derived(Math.max(200, ...debtToGDPData.map((d) => d.value)) * 1.1);

	let gdpRef100Data = $derived(
		debtToGDPData.length > 0
			? [
					{ year: debtToGDPData[0].year, value: 100 },
					{ year: debtToGDPData[debtToGDPData.length - 1].year, value: 100 }
				]
			: []
	);

	let gdpRef150Data = $derived(
		debtToGDPData.length > 0
			? [
					{ year: debtToGDPData[0].year, value: 150 },
					{ year: debtToGDPData[debtToGDPData.length - 1].year, value: 150 }
				]
			: []
	);

	// Revenue at year 15 shortfall
	let revenueShortfallYr15 = $derived.by(() => {
		if (!result || !params) return 0;
		const yr15 = result.yearlyProjections[15];
		if (!yr15) return 0;
		const baseline =
			params.baselineCorporateTaxRevenue +
			params.baselineIncomeTaxRevenue +
			params.baselinePayrollTaxRevenue +
			params.baselineOtherRevenue;
		return baseline - yr15.totalFederalRevenue;
	});

	// Payroll tax hole insight
	let payrollHoleYr15 = $derived.by(() => {
		if (!result || !params) return 0;
		const yr15 = result.yearlyProjections[15];
		if (!yr15) return 0;
		return params.baselinePayrollTaxRevenue - yr15.payrollTaxRevenue;
	});

	// Key for forcing chart re-renders
	let chartKey = $derived(JSON.stringify([
		result?.peakDeficitYear,
		result?.debtToGDPAtYear30,
		params?.corporateTaxRate,
		params?.capitalGainsTaxRate,
		params?.safetyNetCostPerPerson,
		params?.equalizeCapGainsTax
	]));
</script>

{#if result && params && projections.length > 0}
	<div class="space-y-8">
		<!-- Header -->
		<div class="space-y-3">
			<h2 class="text-2xl font-bold text-text">The Tax Problem</h2>
			<p class="text-text-muted leading-relaxed max-w-3xl">
				Workers pay ~37% in combined income + payroll tax. Investors pay ~15% capital gains tax.
				When AI displaces workers into investors, the government loses over half the tax revenue per
				person — even in the best case. Workers who don't become investors generate zero tax revenue
				and cost the government safety net spending.
			</p>
		</div>

		<!-- Stat cards -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input">
				<div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
					Revenue Shortfall at Year 15
				</div>
				<span class="text-2xl font-bold text-red">{formatCompact(revenueShortfallYr15)}/yr</span>
			</div>
			<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input">
				<div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
					National Debt at Year 30
				</div>
				<span class="text-2xl font-bold text-red"
					>{formatCompact(
						result.yearlyProjections[result.yearlyProjections.length - 1].totalNationalDebt
					)}</span
				>
			</div>
			<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-bg-input">
				<div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
					Debt-to-GDP at Year 30
				</div>
				<span class="text-2xl font-bold text-red"
					>{Math.round(result.debtToGDPAtYear30 * 100)}%</span
				>
			</div>
		</div>

		<!-- Controls -->
		<div class="bg-bg-card rounded-lg p-5 space-y-4">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">Tax Parameters</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Corporate tax rate -->
				<div class="space-y-1">
					<div class="flex justify-between items-center">
						<label for="corp-tax" class="text-sm text-text-muted">Corporate Tax Rate</label>
						<span class="text-sm font-bold text-accent">{corporateTaxPct}%</span>
					</div>
					<input
						id="corp-tax"
						type="range"
						min="15"
						max="35"
						step="1"
						value={corporateTaxPct}
						oninput={(e) =>
							updateParam('corporateTaxRate', Number((e.target as HTMLInputElement).value) / 100)}
						class="w-full accent-accent"
					/>
					<div class="flex justify-between text-xs text-text-muted">
						<span>15%</span>
						<span>21%</span>
						<span>35%</span>
					</div>
				</div>

				<!-- Capital gains tax rate -->
				<div class="space-y-1">
					<div class="flex justify-between items-center">
						<label for="capgains-tax" class="text-sm text-text-muted"
							>Capital Gains Tax Rate</label
						>
						<span class="text-sm font-bold text-accent">{capGainsTaxPct}%</span>
					</div>
					<input
						id="capgains-tax"
						type="range"
						min="0"
						max="30"
						step="1"
						value={capGainsTaxPct}
						oninput={(e) =>
							updateParam(
								'capitalGainsTaxRate',
								Number((e.target as HTMLInputElement).value) / 100
							)}
						class="w-full accent-accent"
					/>
					<div class="flex justify-between text-xs text-text-muted">
						<span>0%</span>
						<span>15%</span>
						<span>30%</span>
					</div>
				</div>

				<!-- Safety net cost -->
				<div class="space-y-1">
					<div class="flex justify-between items-center">
						<label for="safety-net" class="text-sm text-text-muted"
							>Safety Net Cost / Person</label
						>
						<span class="text-sm font-bold text-accent">{formatCompact(safetyNetCost)}/yr</span>
					</div>
					<input
						id="safety-net"
						type="range"
						min="10000"
						max="50000"
						step="1000"
						value={safetyNetCost}
						oninput={(e) =>
							updateParam(
								'safetyNetCostPerPerson',
								Number((e.target as HTMLInputElement).value)
							)}
						class="w-full accent-accent"
					/>
					<div class="flex justify-between text-xs text-text-muted">
						<span>$10k</span>
						<span>$25k</span>
						<span>$50k</span>
					</div>
				</div>

				<!-- Equalize toggle -->
				<div class="flex items-center gap-3 pt-4">
					<button
						aria-label="Toggle equalize capital gains tax"
						onclick={() => updateParam('equalizeCapGainsTax', !equalizeToggle)}
						class="relative inline-flex h-8 w-14 md:h-6 md:w-11 items-center rounded-full transition-colors {equalizeToggle
							? 'bg-accent'
							: 'bg-bg-input'}"
					>
						<span
							class="inline-block h-5 w-5 md:h-4 md:w-4 transform rounded-full bg-white transition-transform {equalizeToggle
								? 'translate-x-8 md:translate-x-6'
								: 'translate-x-1'}"
						></span>
					</button>
					<span class="text-sm text-text-muted">
						Tax capital gains at income rates ({Math.round((params?.effectiveIncomeTaxRate ?? 0.22) * 100)}%)
					</span>
				</div>
			</div>
		</div>

		<!-- Chart 1: Tax Revenue Breakdown -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Tax Revenue Breakdown
			</h3>
			<div class="h-48 md:h-72" style="--chart-area-fill: transparent;">
				{#key chartKey}
					<Chart
						data={revTotalData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[revTotalData[0].year, revTotalData[revTotalData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxRevenue]}
						yNice
						padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => '$' + v.toFixed(1) + 'T'} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

							<!-- Baseline reference -->
							<Spline
								data={baselineRevenueLineData}
								x="year"
								y="value"
								stroke="#6b7280"
								strokeWidth={1}
							/>

							<!-- Corporate tax (green, rising) -->
							<Spline
								data={revCorporateData}
								x="year"
								y="value"
								stroke="#4ade80"
								strokeWidth={2}
							/>

							<!-- Income tax (red, falling) -->
							<Spline
								data={revIncomeData}
								x="year"
								y="value"
								stroke="#f87171"
								strokeWidth={2}
							/>

							<!-- Payroll tax (orange, falling) -->
							<Spline
								data={revPayrollData}
								x="year"
								y="value"
								stroke="#fb923c"
								strokeWidth={2}
							/>

							<!-- Capital gains tax (accent, rising) -->
							<Spline
								data={revCapGainsData}
								x="year"
								y="value"
								stroke="#38bdf8"
								strokeWidth={2}
							/>

							<!-- Total revenue (yellow) -->
							<Spline
								data={revTotalData}
								x="year"
								y="value"
								stroke="#fbbf24"
								strokeWidth={2}
							/>
						</Svg>
					</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-yellow inline-block"></span> Total revenue
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-green inline-block"></span> Corporate tax
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-red inline-block"></span> Income tax
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-orange inline-block"></span> Payroll tax
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-accent inline-block"></span> Capital gains tax
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-gray-500 inline-block"></span> Baseline
				</span>
			</div>
		</div>

		<!-- Chart 2: Annual Deficit -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Annual Deficit
			</h3>
			<div class="h-48 md:h-64" style="--chart-area-fill: rgba(248, 113, 113, 0.15);">
				{#key chartKey}
					<Chart
						data={deficitData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[deficitData[0].year, deficitData[deficitData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxDeficit]}
						yNice
						padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => '$' + v.toFixed(1) + 'T'} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

							<!-- Baseline deficit (dashed) -->
							<Spline
								data={baselineDeficitLineData}
								x="year"
								y="value"
								stroke="#6b7280"
								strokeWidth={1}
							/>

							<Area />
							<Spline stroke="#f87171" strokeWidth={2} />
						</Svg>
					</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-red inline-block"></span> Annual deficit (AI displacement)
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-gray-500 inline-block"></span> Baseline deficit
				</span>
			</div>
		</div>

		<!-- Chart 3: National Debt -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				National Debt
			</h3>
			<div class="h-48 md:h-64" style="--chart-area-fill: rgba(251, 191, 36, 0.15);">
				{#key chartKey}
					<Chart
						data={debtData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[debtData[0].year, debtData[debtData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxDebt]}
						yNice
						padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => '$' + v.toFixed(0) + 'T'} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

							<!-- Baseline debt trajectory (gray) -->
							<Spline
								data={baselineDebtPath}
								x="year"
								y="value"
								stroke="#6b7280"
								strokeWidth={1}
							/>

							<Area />
							<Spline stroke="#fbbf24" strokeWidth={2} />
						</Svg>
					</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-yellow inline-block"></span> National debt (AI displacement)
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-gray-500 inline-block"></span> Baseline trajectory
				</span>
			</div>
		</div>

		<!-- Chart 4: Debt-to-GDP -->
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Debt-to-GDP Ratio
			</h3>
			<div class="h-48 md:h-64" style="--chart-area-fill: rgba(251, 146, 60, 0.15);">
				{#key chartKey}
					<Chart
						data={debtToGDPData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[debtToGDPData[0].year, debtToGDPData[debtToGDPData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxDebtToGDP]}
						yNice
						padding={{ left: 44, bottom: 24, top: 8, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => v + '%'} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

							<!-- 100% reference -->
							<Spline
								data={gdpRef100Data}
								x="year"
								y="value"
								stroke="#4ade80"
								strokeWidth={1}
							/>

							<!-- 150% reference -->
							<Spline
								data={gdpRef150Data}
								x="year"
								y="value"
								stroke="#f87171"
								strokeWidth={1}
							/>

							<Area />
							<Spline stroke="#fb923c" strokeWidth={2} />
						</Svg>
					</Chart>
				{/key}
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-orange inline-block"></span> Debt-to-GDP
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-green inline-block"></span> 100% of GDP
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-red inline-block"></span> 150% of GDP
				</span>
			</div>
		</div>

		<!-- Insight callout -->
		<div class="bg-bg-card rounded-lg p-3 sm:p-5 border border-accent/30">
			<p class="text-text leading-relaxed">
				Even if capital gains were taxed at income tax rates, the
				<span class="font-bold text-orange">payroll tax hole</span> of
				<span class="font-bold text-red">{formatCompact(payrollHoleYr15)}/yr</span> remains.
				Payroll tax (Social Security + Medicare) has no equivalent for investment income — displaced
				workers simply stop contributing. This alone creates a structural deficit that no capital
				gains rate adjustment can fix.
			</p>
		</div>
	</div>
{/if}
