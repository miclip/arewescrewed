<script lang="ts">
	import { amazonProjections, amazonDystopiaProjections } from '$lib/stores/results';
	import { scenarioParams, activePreset } from '$lib/stores/scenario';
	import { PRESETS, type PresetName } from '$lib/model/presets';
	import { formatCompact, formatPct, formatNumber, formatCurrency } from '$lib/model/format';
	import { PORTFOLIO_COMPANIES } from '$lib/model/companies';
	import ProfitProjection from './ProfitProjection.svelte';
	import TwoFutures from './TwoFutures.svelte';
	import WorkforceChart from './WorkforceChart.svelte';
	import type { YearProjection, ScenarioParams } from '$lib/model/types';

	const amazon = PORTFOLIO_COMPANIES.find((c) => c.ticker === 'AMZN')!;
	let currentParams = $state<ScenarioParams | null>(null);
	$effect(() => {
		const unsub = scenarioParams.subscribe((v) => { currentParams = v; });
		return unsub;
	});

	let projections = $state<YearProjection[]>([]);
	let preset = $state<PresetName>('moderate');

	$effect(() => {
		const unsub = amazonProjections.subscribe((v) => { projections = v; });
		return unsub;
	});
	$effect(() => {
		const unsub = activePreset.subscribe((v) => { preset = v; });
		return unsub;
	});

	// Amazon snapshot values at year 15 and year 30
	let mid = $derived(projections[15] ?? projections[projections.length - 1]);
	let end = $derived(projections[projections.length - 1]);
	let start = $derived(projections[0]);
</script>

<div class="space-y-8">
	<!-- The Problem -->
	<div class="space-y-4">
		<h2 class="text-2xl font-bold">The Problem</h2>
		<div class="text-text-muted leading-relaxed space-y-3">
			<p>
				AI is replacing human labor. Not in some distant future — now. Information workers are first:
				coders, analysts, writers, customer service, legal research, accounting. The jobs that run on
				knowledge and language are exactly what large language models turn out to be good at.
			</p>
			<p>
				This isn't a temporary disruption. Unlike previous automation waves that replaced physical tasks
				and created new cognitive ones, AI targets cognitive work directly. When the tool can think,
				write, and reason, the "just learn to code" escape hatch closes.
			</p>
		</div>
	</div>

	<!-- Do Nothing = Collapse -->
	<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-3">
		<h3 class="font-semibold text-red">Do Nothing: Demand Collapse</h3>
		<div class="text-sm text-text-muted space-y-2 leading-relaxed">
			<p>
				If displaced workers simply lose their income, consumer spending collapses. Displaced workers
				cut nearly all their spending. Remove the wages, remove the customers. Companies automate their way to record
				efficiency — then watch their revenue crater because nobody can afford to buy anything.
			</p>
			<p>
				This is the death spiral: fewer jobs → less spending → less revenue → more cuts → fewer jobs.
				Even the most profitable AI-powered company can't survive selling to an economy where 80% of
				purchasing power has evaporated.
			</p>
		</div>
	</div>

	<!-- Why Not UBI -->
	<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-3">
		<h3 class="font-semibold text-yellow">Why Not <a href="https://en.wikipedia.org/wiki/Universal_basic_income" target="_blank" rel="noopener noreferrer" class="underline hover:text-yellow/80">UBI</a>?</h3>
		<div class="text-sm text-text-muted space-y-2 leading-relaxed">
			<p>
				The obvious answer is Universal Basic Income — government pays everyone a living wage. But UBI
				concentrates enormous financial power in whoever controls the government. Your income becomes
				a political lever.
			</p>
			<p>
				When governments control income, the temptation to weaponize it follows. China's social credit
				system docks benefits for dissent. Canada froze bank accounts of trucker protest donors in 2022.
				Authoritarian regimes routinely cut pensions and benefits to political opponents. UBI at scale
				would hand that same lever to whoever holds power — your entire livelihood tied to one
				institution's continued goodwill.
			</p>
		</div>
	</div>

	<!-- The Investor Model -->
	<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-3">
		<h3 class="font-semibold text-green">The Investor Model: Own the Machines</h3>
		<div class="text-sm text-text-muted space-y-2 leading-relaxed">
			<p>
				There's a third option: if AI replaces your labor, <em>own the AI</em>. Not the technology itself,
				but the companies deploying it. When a corporation replaces workers with AI, its profits explode.
				Those profits flow to shareholders as dividends and rising share prices.
			</p>
			<p>
				The investor model is simple: displaced workers shift from earning wages to earning returns on a
				portfolio of AI-powered companies. No government gatekeeper. No political litmus test. Your income
				comes from owning a piece of the economy, not from a bureaucrat's approval.
			</p>
			<p>
				The critical question is: can you accumulate enough before displacement hits? This model
				calculates the full picture — labor displacement, AI costs, demand feedback loops, supply chain
				effects, and what it means for corporate profits and shareholder returns. Let's walk through it
				with Amazon as an example.
			</p>
		</div>
	</div>

	<!-- Amazon Example header -->
	<div class="space-y-3">
		<h2 class="text-2xl font-bold">The Amazon Example</h2>
		<p class="text-text-muted leading-relaxed">
			Amazon has {formatNumber(amazon.headcount)} employees, {formatCompact(amazon.estimatedLaborCost)} in labor costs, and {formatCompact(amazon.revenue)} in revenue.
			What happens when AI starts replacing that workforce?
		</p>
	</div>

	{#if start && mid && end}
		<!-- The math explained -->
		<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-4">
			<h3 class="font-semibold text-accent">The Core Math</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
				<div class="space-y-1">
					<div class="text-text-muted">Today</div>
					<div>Revenue: <span class="font-mono text-accent">{formatCompact(start.originalRevenue)}</span></div>
					<div>Profit: <span class="font-mono">{formatCompact(start.newProfit)}</span></div>
					<div>Workers: <span class="font-mono">{formatNumber(start.originalHeadcount)}</span></div>
				</div>
				<div class="space-y-1">
					<div class="text-text-muted">Year 15 ({start.year + 15})</div>
					<div>Revenue: <span class="font-mono text-accent">{formatCompact(mid.adjustedRevenue)}</span></div>
					<div>Profit: <span class="font-mono">{formatCompact(mid.newProfit)}</span></div>
					<div>Workers: <span class="font-mono">{formatNumber(mid.remainingHeadcount)}</span></div>
					<div>AI cost/worker: <span class="font-mono">{formatCompact(mid.aiCostPerWorkerThisYear)}/yr</span></div>
				</div>
				<div class="space-y-1">
					<div class="text-text-muted">Year 30 ({start.year + 30})</div>
					<div>Revenue: <span class="font-mono text-accent">{formatCompact(end.adjustedRevenue)}</span></div>
					<div>Profit: <span class="font-mono">{formatCompact(end.newProfit)}</span></div>
					<div>Workers: <span class="font-mono">{formatNumber(end.remainingHeadcount)}</span></div>
					<div>Margin: <span class="font-mono">{formatPct(end.profitMarginNew)}</span></div>
				</div>
			</div>
		</div>

		<!-- How the model works -->
		<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-3">
			<h3 class="font-semibold text-accent">How the Model Works</h3>
			<div class="text-sm text-text-muted space-y-2 leading-relaxed">
				<p>
					<strong class="text-text">S-Curve Displacement:</strong> Workers aren't replaced overnight.
					The model uses a smoothstep function — slow adoption, rapid middle phase, then plateau.
					Under the {PRESETS[preset].label.toLowerCase()} scenario, {formatPct(PRESETS[preset].params.laborReductionPct * 100, 0)} of jobs
					are replaced over {PRESETS[preset].params.rampYears} years.
				</p>
				<p>
					<strong class="text-text">AI Costs Decline:</strong> Replacing a worker costs
					{formatCompact(PRESETS[preset].params.aiCostPerWorkerYear)}/year today — but this is heavily
					subsidized (AI companies are burning cash to gain market share). After
					{PRESETS[preset].params.aiSubsidyYears} years, subsidies end and real costs spike
					{formatPct((PRESETS[preset].params.aiCostCorrectionPct - 1) * 100, 0)} before resuming their
					{formatPct(PRESETS[preset].params.aiCostDeclineRate * 100, 0)}/year decline (like Moore's Law).
					Net savings = labor savings minus AI compute costs.
				</p>
				<p>
					<strong class="text-text">Demand Feedback:</strong> Here's the key insight — if displaced workers
					have no income, consumer spending collapses. The model tracks this: displaced workers cut ~{currentParams ? Math.round(currentParams.wageShareOfSpending * 100) : 90}% of spending.
					Without the investor model, demand craters to an essentials floor of {currentParams ? Math.round(currentParams.essentialsFloor * 100) : 20}% — just food, shelter, and utilities.
					<em>With</em> investor adoption, dividend/capital gains income partially replaces wages.
				</p>
				<p>
					<strong class="text-text">Supply Chain Cascade:</strong> It's not just direct labor. As the whole
					economy automates, suppliers charge less too — shipping, manufacturing, raw materials all get cheaper.
					This compounds the profit effect.
				</p>
				<p>
					<strong class="text-text">4% Safe Withdrawal Rate:</strong> Your income comes from the <a href="https://en.wikipedia.org/wiki/Trinity_study" target="_blank" rel="noopener noreferrer" class="text-accent underline hover:text-accent-hover">Trinity Study's</a>
					4% rule — dividends count first, then sell appreciated shares for the rest. Share prices track
					earnings growth (constant <a href="https://en.wikipedia.org/wiki/Price%E2%80%93earnings_ratio" target="_blank" rel="noopener noreferrer" class="text-accent underline hover:text-accent-hover">P/E</a> assumption).
				</p>
			</div>
		</div>
	{/if}

	<!-- Charts -->
	<div class="grid grid-cols-1 gap-8">
		<WorkforceChart />
		<ProfitProjection />
		<TwoFutures />
	</div>

</div>
