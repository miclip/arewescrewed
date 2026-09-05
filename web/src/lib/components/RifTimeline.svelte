<script lang="ts">
	import { Chart, Svg, Bars, Axis } from 'layerchart';
	import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
	import { AMAZON_RIFS, AMAZON_RIF_TOTAL } from '$lib/model/amazon-rifs';
	import { formatCompactNum } from '$lib/model/format';

	// Color key: string values for the ordinal scale
	let chartData = $derived(
		AMAZON_RIFS.map((rif) => ({
			...rif,
			category: rif.aiDriven ? 'ai' : 'other'
		}))
	);

	let maxJobs = $derived(
		Math.max(...chartData.map((d) => d.jobsCut)) * 1.15
	);
</script>

<div class="space-y-2">
	<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">
		Amazon: Corporate Layoffs Since 2022
	</h3>
	<div class="text-xs text-text-muted space-y-1.5 leading-relaxed">
		<p>
			Amazon has cut ~{(AMAZON_RIF_TOTAL / 1000).toFixed(0)}K corporate jobs across {AMAZON_RIFS.length} rounds
			since late 2022. Early rounds were post-COVID correction and cost-cutting — not AI-driven.
			But the pattern is worth watching: the 2025-2026 rounds (~30K jobs) coincide with Amazon's
			2026 AI capex guidance of ~$220B and explicit "AI restructuring" language.
		</p>
		<p>
			This isn't proof that AI is the primary driver yet — but these are exactly the signals
			the model predicts we'd see at the start of the S-curve. Total headcount actually rose
			(1.55M → 1.60M in the year to June 2026) because ~1.2M warehouse and logistics roles
			were untouched and kept hiring into 20% revenue growth. That doesn't undercut the
			thesis — it dates it. Every Amazon round so far has landed in corporate, technical,
			media and admin functions; the physical layer hasn't started.
		</p>
	</div>

	<!-- Bar chart: jobs cut per round -->
	<div class="h-52 md:h-64">
		<Chart
			data={chartData}
			x="label"
			xScale={scaleBand().padding(0.25)}
			y="jobsCut"
			yScale={scaleLinear()}
			yDomain={[0, maxJobs]}
			yNice
			c="category"
			cScale={scaleOrdinal()}
			cDomain={['other', 'ai']}
			cRange={['rgba(148, 163, 184, 0.5)', '#fb923c']}
			padding={{ left: 44, bottom: 28, top: 8, right: 4 }}
		>
			<Svg>
				<Axis placement="left" format={(v) => formatCompactNum(v)} />
				<Axis placement="bottom" />
				<Bars radius={2} rounded="top" strokeWidth={0} />
			</Svg>
		</Chart>
	</div>

	<div class="flex flex-wrap gap-2 sm:gap-4 text-xs text-text-muted justify-center">
		<span class="flex items-center gap-1">
			<span class="w-3 h-3 rounded-sm inline-block" style="background: rgba(148, 163, 184, 0.5);"></span> Cost-cutting / restructuring
		</span>
		<span class="flex items-center gap-1">
			<span class="w-3 h-3 rounded-sm bg-orange inline-block"></span> AI-linked rounds
		</span>
		<span class="text-text-muted/60">
			Total: ~{(AMAZON_RIF_TOTAL / 1000).toFixed(0)}K jobs
		</span>
	</div>
</div>
