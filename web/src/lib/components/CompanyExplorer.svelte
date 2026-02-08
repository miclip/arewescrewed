<script lang="ts">
	import { Chart, Svg, Area, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { PORTFOLIO_COMPANIES } from '$lib/model/companies';
	import { PRESETS, PRESET_ORDER, type PresetName } from '$lib/model/presets';
	import { runScenario } from '$lib/model/scenario-engine';
	import { formatCompact, formatCompactNum, formatPct, formatNumber } from '$lib/model/format';
	import { scenarioParams, activePreset, isCustomized } from '$lib/stores/scenario';
	import type { CompanyProfile, ScenarioParams, YearProjection } from '$lib/model/types';

	let selectedTicker = $state('AMZN');

	let params = $state<ScenarioParams>(PRESETS.moderate.params);
	let selectedPreset = $state<PresetName>('moderate');
	let customized = $state(false);

	$effect(() => {
		const unsub = scenarioParams.subscribe((v) => { params = v; });
		return unsub;
	});
	$effect(() => {
		const unsub = activePreset.subscribe((v) => { selectedPreset = v; });
		return unsub;
	});
	$effect(() => {
		const unsub = isCustomized.subscribe((v) => { customized = v; });
		return unsub;
	});

	let company = $derived(PORTFOLIO_COMPANIES.find((c) => c.ticker === selectedTicker)!);

	let projections = $derived(runScenario(params, company));
	let dystopiaProjections = $derived(
		runScenario({ ...params, investorModelAdoption: 0 }, company)
	);

	let start = $derived(projections[0]);
	let mid = $derived(projections[15] ?? projections[projections.length - 1]);
	let end = $derived(projections[projections.length - 1]);

	// Chart data
	let workforceData = $derived(projections.map((p) => ({ year: p.year, value: p.remainingHeadcount })));
	let originalHcData = $derived(projections.map((p) => ({ year: p.year, value: p.originalHeadcount })));
	let profitData = $derived(projections.map((p) => ({ year: p.year, value: p.newProfit / 1e9 })));
	let baselineProfitData = $derived(projections.map((p) => ({ year: p.year, value: p.originalProfit / 1e9 })));
	let revenueData = $derived(projections.map((p) => ({ year: p.year, value: p.adjustedRevenue / 1e9 })));
	let dystopiaRevenueData = $derived(dystopiaProjections.map((p) => ({ year: p.year, value: p.adjustedRevenue / 1e9 })));

	let maxHc = $derived(originalHcData.length > 0 ? originalHcData[0].value * 1.1 : 1);
	let maxProfit = $derived(Math.max(...profitData.map((d) => d.value), ...baselineProfitData.map((d) => d.value)) * 1.1 || 1);
	let maxRev = $derived(Math.max(...revenueData.map((d) => d.value), ...dystopiaRevenueData.map((d) => d.value)) * 1.1 || 1);

	const presetColors: Record<PresetName, string> = {
		conservative: '#38bdf8',
		moderate: '#4ade80',
		aggressive: '#fbbf24',
		extreme: '#f87171'
	};
</script>

<div class="space-y-6">
	<!-- Controls -->
	<div class="flex flex-wrap gap-4 items-end">
		<div>
			<label for="company-select" class="block text-xs text-text-muted mb-1">Company</label>
			<select
				id="company-select"
				bind:value={selectedTicker}
				class="bg-bg-input text-text border border-bg-input rounded px-3 py-2 text-sm focus:border-accent focus:outline-none"
			>
				{#each PORTFOLIO_COMPANIES as c}
					<option value={c.ticker}>{c.ticker} — {c.name}</option>
				{/each}
			</select>
		</div>
		<div class="text-xs text-text-muted">
			Scenario: <span class="font-medium" style="color: {presetColors[selectedPreset]}">{PRESETS[selectedPreset].label}{customized ? ' (Custom)' : ''}</span>
			<span class="text-text-muted/60">— change in Assumptions tab</span>
		</div>
	</div>

	<!-- Company snapshot -->
	{#if start && end}
		<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5">
			<div class="flex items-baseline gap-3 mb-4">
				<h3 class="text-xl font-bold">{company.name}</h3>
				<span class="text-text-muted text-sm">{company.sector}</span>
			</div>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
				<div>
					<div class="text-text-muted text-xs">Revenue</div>
					<div class="font-mono">{formatCompact(company.revenue)}</div>
				</div>
				<div>
					<div class="text-text-muted text-xs">Employees</div>
					<div class="font-mono">{formatNumber(company.headcount)}</div>
				</div>
				<div>
					<div class="text-text-muted text-xs">Labor Cost</div>
					<div class="font-mono">{formatCompact(company.estimatedLaborCost)} ({company.laborPctOfRevenue}%)</div>
				</div>
				<div>
					<div class="text-text-muted text-xs">Dividend/Share</div>
					<div class="font-mono">{company.currentDividendPerShare > 0 ? `$${company.currentDividendPerShare.toFixed(2)}` : 'None'}</div>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-bg-input text-sm">
				<div class="space-y-1">
					<div class="text-text-muted text-xs">{PRESETS[selectedPreset].label} — Year 15</div>
					<div>Profit: <span class="font-mono text-accent">{formatCompact(mid.newProfit)}</span> <span class="text-text-muted">(was {formatCompact(mid.originalProfit)})</span></div>
					<div>Workers: <span class="font-mono">{formatNumber(mid.remainingHeadcount)}</span> <span class="text-text-muted">(of {formatNumber(mid.originalHeadcount)})</span></div>
				</div>
				<div class="space-y-1">
					<div class="text-text-muted text-xs">{PRESETS[selectedPreset].label} — Year 30</div>
					<div>Profit: <span class="font-mono text-accent">{formatCompact(end.newProfit)}</span></div>
					<div>Margin: <span class="font-mono">{formatPct(end.profitMarginNew)}</span> <span class="text-text-muted">(was {formatPct(end.profitMarginOriginal)})</span></div>
				</div>
				<div class="space-y-1">
					<div class="text-text-muted text-xs">Profit Multiplier</div>
					<div class="text-2xl font-bold text-accent">{(end.newProfit / start.originalProfit).toFixed(1)}x</div>
					<div class="text-text-muted text-xs">vs today's profit</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Charts grid -->
	{#if workforceData.length > 0}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Workforce -->
			<div class="space-y-2">
				<h4 class="text-sm font-semibold text-text-muted uppercase tracking-wide">Workforce</h4>
				<div class="h-48" style="--chart-area-fill: rgba(251, 146, 60, 0.15);">
					<Chart
						data={workforceData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[workforceData[0].year, workforceData[workforceData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxHc]}
						yNice
						padding={{ left: 44, bottom: 24, top: 4, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => formatCompactNum(v)} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />
							<Spline data={originalHcData} x="year" y="value" stroke="rgba(56, 189, 248, 0.4)" strokeWidth={1} />
							<Area />
							<Spline stroke="#fb923c" strokeWidth={2} />
						</Svg>
					</Chart>
				</div>
			</div>

			<!-- Profit -->
			<div class="space-y-2">
				<h4 class="text-sm font-semibold text-text-muted uppercase tracking-wide">Profit ($B)</h4>
				<div class="h-48" style="--chart-area-fill: rgba(56, 189, 248, 0.15);">
					<Chart
						data={profitData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[profitData[0].year, profitData[profitData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxProfit]}
						yNice
						padding={{ left: 44, bottom: 24, top: 4, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => `$${v.toFixed(0)}B`} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />
							<Spline data={baselineProfitData} x="year" y="value" stroke="rgba(248, 113, 113, 0.5)" strokeWidth={1} />
							<Area />
							<Spline stroke="#38bdf8" strokeWidth={2} />
						</Svg>
					</Chart>
				</div>
				<div class="flex gap-3 text-[10px] text-text-muted justify-center">
					<span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-accent inline-block"></span> With AI</span>
					<span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-red/50 inline-block"></span> Baseline</span>
				</div>
			</div>

			<!-- Revenue: Two Futures -->
			<div class="space-y-2 lg:col-span-2">
				<h4 class="text-sm font-semibold text-text-muted uppercase tracking-wide">Revenue: Investor Model vs Collapse ($B)</h4>
				<div class="h-48" style="--chart-area-fill: rgba(74, 222, 128, 0.1);">
					<Chart
						data={revenueData}
						x="year"
						xScale={scaleLinear()}
						xDomain={[revenueData[0].year, revenueData[revenueData.length - 1].year]}
						y="value"
						yScale={scaleLinear()}
						yDomain={[0, maxRev]}
						yNice
						padding={{ left: 48, bottom: 24, top: 4, right: 4 }}
					>
						<Svg>
							<Axis placement="left" format={(v) => `$${v.toFixed(0)}B`} />
							<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />
							<Area />
							<Spline stroke="#4ade80" strokeWidth={2} />
							<Spline data={dystopiaRevenueData} x="year" y="value" stroke="#f87171" strokeWidth={2} />
						</Svg>
					</Chart>
				</div>
				<div class="flex gap-3 text-[10px] text-text-muted justify-center">
					<span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-green inline-block"></span> With investor model</span>
					<span class="flex items-center gap-1"><span class="w-2 h-0.5 bg-red inline-block"></span> No investor model</span>
				</div>
			</div>
		</div>
	{/if}
</div>
