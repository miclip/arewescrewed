<script lang="ts">
	import ProviderRevenueChart from './ProviderRevenueChart.svelte';
	import CapturedValueChart from './CapturedValueChart.svelte';
	import { Chart, Svg, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { providerProjections } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { ProviderYearProjection } from '$lib/model/provider-engine';

	let projections = $state<ProviderYearProjection[]>([]);

	$effect(() => {
		const unsub = providerProjections.subscribe((v) => {
			projections = v;
		});
		return unsub;
	});

	// Market cap chart data
	let marketCapData = $derived(
		projections.map((p) => ({ year: p.year, value: p.providerMarketCap / 1e12 }))
	);

	let maxMarketCap = $derived(
		marketCapData.length > 0 ? Math.max(...marketCapData.map((d) => d.value)) * 1.15 : 1
	);

	// Margin chart data
	let marginData = $derived(
		projections.map((p) => ({ year: p.year, value: p.providerGrossMargin * 100 }))
	);

	// Key metrics
	let peakRevenue = $derived(
		projections.length > 0 ? Math.max(...projections.map((p) => p.providerRevenue)) : 0
	);
	let peakRevenueYear = $derived(() => {
		if (projections.length === 0) return 0;
		let year = projections[0].year;
		let max = 0;
		for (const p of projections) {
			if (p.providerRevenue > max) {
				max = p.providerRevenue;
				year = p.year;
			}
		}
		return year;
	});
	let totalCumulativeRevenue = $derived(
		projections.length > 0 ? projections[projections.length - 1].cumulativeProviderRevenue : 0
	);
	let peakMarketCap = $derived(
		projections.length > 0 ? Math.max(...projections.map((p) => p.providerMarketCap)) : 0
	);
	let endMargin = $derived(
		projections.length > 0 ? projections[projections.length - 1].providerGrossMargin : 0
	);
	let peakTrainingCost = $derived(
		projections.length > 0 ? Math.max(...projections.map((p) => p.trainingRdCost)) : 0
	);
</script>

<div class="space-y-8">
	<!-- Section 1: Intro -->
	<div class="space-y-3">
		<h2 class="text-xl font-bold text-text">The Other Side of the Equation</h2>
		<p class="text-sm text-text-muted leading-relaxed">
			Every dollar companies spend replacing workers with AI flows as revenue to AI providers
			— Anthropic, OpenAI, Google DeepMind, and others. The deployer model shows what happens
			to the companies <em>buying</em> AI. This view shows what happens to the companies
			<em>selling</em> it.
		</p>
		<p class="text-sm text-text-muted leading-relaxed">
			The revenue curve is <strong>hump-shaped</strong>: as the S-curve ramps up, more workers
			are displaced and AI spend surges. But per-worker AI costs decline exponentially (cheaper
			hardware, better models), so total provider revenue peaks mid-ramp then falls — even as
			AI handles more work.
		</p>
		<p class="text-sm text-text-muted leading-relaxed">
			However, <strong>margins tell a different story</strong>. Hardware costs fall faster than
			providers cut prices, so gross margins expand from ~60% toward 85%. Profits can grow even
			as revenue declines — the same dynamic that made cloud computing so profitable.
		</p>
		<p class="text-sm text-text-muted leading-relaxed">
			There's a catch: <strong>training costs keep rising</strong>. Inference (running models)
			gets cheaper, but training new models gets more expensive — each generation requires more
			compute, more data, more experimentation. GPT-4's final training run cost an estimated
			$40-78M; frontier models are now approaching $1B per run. Eventually AI helps reduce
			its own R&D costs, but in the near term, escalating training spend is a real drag on
			provider profits.
		</p>
	</div>

	<!-- Key metrics bar -->
	{#if projections.length > 0}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			<div class="bg-bg-card rounded-xl border border-bg-input p-3 text-center">
				<div class="text-text-muted text-xs">Peak Revenue</div>
				<div class="text-lg font-bold font-mono text-accent">{formatCompact(peakRevenue)}</div>
				<div class="text-text-muted/70 text-[10px]">in {peakRevenueYear()}</div>
			</div>
			<div class="bg-bg-card rounded-xl border border-bg-input p-3 text-center">
				<div class="text-text-muted text-xs">Cumulative Revenue</div>
				<div class="text-lg font-bold font-mono text-accent">
					{formatCompact(totalCumulativeRevenue)}
				</div>
				<div class="text-text-muted/70 text-[10px]">over 30 years</div>
			</div>
			<div class="bg-bg-card rounded-xl border border-bg-input p-3 text-center">
				<div class="text-text-muted text-xs">Peak Market Cap</div>
				<div class="text-lg font-bold font-mono text-accent">{formatCompact(peakMarketCap)}</div>
				<div class="text-text-muted/70 text-[10px]">provider industry total</div>
			</div>
			<div class="bg-bg-card rounded-xl border border-bg-input p-3 text-center">
				<div class="text-text-muted text-xs">Peak Training/R&D</div>
				<div class="text-lg font-bold font-mono" style="color: #f87171;">{formatCompact(peakTrainingCost)}</div>
				<div class="text-text-muted/70 text-[10px]">per year (industry-wide)</div>
			</div>
		</div>
	{/if}

	<!-- Section 2: Revenue hump chart -->
	<ProviderRevenueChart />

	<!-- Section 3: Margin expansion -->
	{#if marginData.length > 0}
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				Provider Gross Margin Expansion
			</h3>
			<p class="text-xs text-text-muted">
				As GPU costs fall and models become more efficient, providers keep more of each revenue dollar. This is why profits can grow even as total revenue declines.
			</p>
			<div class="h-40 md:h-48">
				<Chart
					data={marginData}
					x="year"
					xScale={scaleLinear()}
					xDomain={[marginData[0].year, marginData[marginData.length - 1].year]}
					y="value"
					yScale={scaleLinear()}
					yDomain={[50, 90]}
					yNice
					padding={{ left: 40, bottom: 24, top: 8, right: 4 }}
				>
					<Svg>
						<Axis placement="left" format={(v) => `${v}%`} />
						<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />
						<Spline stroke="#fbbf24" strokeWidth={2} />
					</Svg>
				</Chart>
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 inline-block" style="background: #fbbf24;"></span> Gross Margin %
				</span>
			</div>
		</div>
	{/if}

	<!-- Section 4: Market Cap -->
	{#if marketCapData.length > 0}
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
				AI Provider Market Cap (Industry Total)
			</h3>
			<p class="text-xs text-text-muted">
				Market cap = profit x P/E multiple. Even with falling revenue, expanding margins and
				steady profits support substantial valuations.
			</p>
			<div class="h-48 md:h-56" style="--chart-area-fill: rgba(56, 189, 248, 0.1);">
				<Chart
					data={marketCapData}
					x="year"
					xScale={scaleLinear()}
					xDomain={[marketCapData[0].year, marketCapData[marketCapData.length - 1].year]}
					y="value"
					yScale={scaleLinear()}
					yDomain={[0, maxMarketCap]}
					yNice
					padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
				>
					<Svg>
						<Axis placement="left" format={(v) => `$${v.toFixed(1)}T`} />
						<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />
						<Spline stroke="#38bdf8" strokeWidth={2} />
					</Svg>
				</Chart>
			</div>
			<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 bg-accent inline-block"></span> Total Provider Market Cap
				</span>
			</div>
		</div>
	{/if}

	<!-- Section 5: Captured Value -->
	<CapturedValueChart />

	<!-- Section 6: Key Takeaways -->
	{#if projections.length > 0}
		<div class="bg-bg-card rounded-xl border border-bg-input p-4 sm:p-6 space-y-3">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">Key Takeaways</h3>
			<div class="space-y-2 text-sm text-text-muted">
				<p>
					<strong class="text-text">Revenue peaks, then falls.</strong> AI provider revenue is
					a hump, not a hockey stick. Peak spending occurs mid-ramp when the most workers are
					being displaced at still-high per-worker costs. After that, hardware improvements
					make AI dirt cheap.
				</p>
				<p>
					<strong class="text-text">But margins expand — with a caveat.</strong> Hardware costs
					fall faster than providers cut prices, expanding gross margins. But training new
					models gets more expensive each generation. The net effect: profits grow in the
					mid-term as margins expand, but escalating R&D is a constant headwind. Eventually
					AI helps reduce its own research costs, easing the pressure.
				</p>
				<p>
					<strong class="text-text">Big tech already owns the upside.</strong> Through
					ownership stakes in AI providers, companies like Microsoft, Amazon, and Google
					capture value from <em>both</em> sides of the equation — they save on labor
					<em>and</em> profit from the AI they buy.
				</p>
				<p>
					<strong class="text-text">For the investor model:</strong> this reinforces the
					thesis. The same companies you'd own as an investor (MSFT, AMZN, GOOGL) are
					positioned on both sides. Your portfolio captures deployer savings <em>and</em>
					provider profits.
				</p>
			</div>
		</div>
	{/if}
</div>
