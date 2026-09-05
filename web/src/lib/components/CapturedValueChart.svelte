<script lang="ts">
	import { Chart, Svg, Axis, Spline } from 'layerchart';
	import { scaleLinear } from 'd3-scale';
	import { providerProjections } from '$lib/stores/results';
	import { CAPTURED_STAKES, computeCapturedValues } from '$lib/model/provider-engine';
	import { formatCompact, formatCompactNum } from '$lib/model/format';
	import type { ProviderYearProjection } from '$lib/model/provider-engine';

	let projections = $state<ProviderYearProjection[]>([]);

	$effect(() => {
		const unsub = providerProjections.subscribe((v) => {
			projections = v;
		});
		return unsub;
	});

	// Unique owners from stakes
	const owners = [...new Set(CAPTURED_STAKES.map((s) => s.owner))];
	const ownerColors: Record<string, string> = {};
	for (const stake of CAPTURED_STAKES) {
		if (!ownerColors[stake.owner]) ownerColors[stake.owner] = stake.color;
	}

	// Per-owner value over time
	let ownerSeries = $derived(
		owners.map((owner) => ({
			owner,
			color: ownerColors[owner],
			data: projections.map((p) => {
				const captured = computeCapturedValues(p.providerMarketCap);
				const ownerData = captured.find((c) => c.owner === owner);
				return { year: p.year, value: (ownerData?.value ?? 0) / 1e9 };
			})
		}))
	);

	let maxValue = $derived(
		ownerSeries.length > 0
			? Math.max(
					...ownerSeries.flatMap((s) => s.data.map((d) => d.value))
				) * 1.15 || 1
			: 1
	);

	// Peak captured values for summary cards
	let peakCaptured = $derived.by(() => {
		if (projections.length === 0) return [];
		// Find year with max total market cap
		let peakIdx = 0;
		let peakCap = 0;
		for (let i = 0; i < projections.length; i++) {
			if (projections[i].providerMarketCap > peakCap) {
				peakCap = projections[i].providerMarketCap;
				peakIdx = i;
			}
		}
		return computeCapturedValues(peakCap);
	});
</script>

{#if ownerSeries.length > 0 && ownerSeries[0].data.length > 0}
	<div class="space-y-2">
		<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
			Big Tech's Captured AI Value
		</h3>
		<p class="text-xs text-text-muted">
			Through ownership stakes in AI providers, big tech captures value from the entire AI
			transition — not just their own automation savings.
		</p>

		<!-- Ownership stakes cards -->
		<div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
			{#each CAPTURED_STAKES as stake}
				<a
					href={stake.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="bg-bg-card rounded-lg border border-bg-input p-2 text-xs hover:border-accent/50 transition-colors block"
				>
					<div class="text-text-muted">{stake.owner}</div>
					<div class="font-mono text-sm" style="color: {stake.color};">
						{stake.stakePct < 0.1 ? (stake.stakePct * 100).toFixed(1) : Math.round(stake.stakePct * 100)}%
					</div>
					<div class="text-text-muted/70 text-[10px]">of {stake.provider} ({stake.invested})</div>
					<div class="text-text-muted/50 text-[9px] mt-0.5 underline decoration-dotted">{stake.source.split(' — ')[0]}</div>
				</a>
			{/each}
		</div>

		<!-- Value over time chart -->
		<div class="h-48 md:h-56">
			<Chart
				data={ownerSeries[0].data}
				x="year"
				xScale={scaleLinear()}
				xDomain={[
					ownerSeries[0].data[0].year,
					ownerSeries[0].data[ownerSeries[0].data.length - 1].year
				]}
				y="value"
				yScale={scaleLinear()}
				yDomain={[0, maxValue]}
				yNice
				padding={{ left: 48, bottom: 24, top: 8, right: 4 }}
			>
				<Svg>
					<Axis
						placement="left"
						format={(v) => `$${formatCompactNum(v * 1e9).replace('$', '')}`}
					/>
					<Axis placement="bottom" ticks={5} format={(v) => String(Math.round(v))} />

					{#each ownerSeries as series}
						<Spline
							data={series.data}
							x="year"
							y="value"
							stroke={series.color}
							strokeWidth={2}
						/>
					{/each}
				</Svg>
			</Chart>
		</div>
		<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
			{#each ownerSeries as series}
				<span class="flex items-center gap-1">
					<span class="w-3 h-0.5 inline-block" style="background: {series.color};"></span>
					{series.owner}
				</span>
			{/each}
		</div>

		<!-- Peak captured summary -->
		{#if peakCaptured.length > 0}
			<div class="bg-bg-card rounded-lg border border-bg-input p-3 mt-2">
				<div class="text-xs text-text-muted mb-2">Peak captured value (at provider market cap high):</div>
				<div class="flex flex-wrap gap-3">
					{#each peakCaptured as cap}
						<div class="text-sm">
							<span class="text-text-muted">{cap.owner}:</span>
							<span class="font-mono text-accent">{formatCompact(cap.value)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
