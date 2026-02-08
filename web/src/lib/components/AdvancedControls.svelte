<script lang="ts">
	import { scenarioParams } from '$lib/stores/scenario';
	import type { ScenarioParams } from '$lib/model/types';

	let params = $state<ScenarioParams | null>(null);
	let tooltipKey = $state<string | null>(null);

	$effect(() => {
		const unsub = scenarioParams.subscribe((v) => {
			params = { ...v };
		});
		return unsub;
	});

	function update() {
		if (params) scenarioParams.set({ ...params });
	}

	function toggleTooltip(key: string) {
		tooltipKey = tooltipKey === key ? null : key;
	}

	interface SliderDef {
		key: keyof ScenarioParams;
		label: string;
		min: number;
		max: number;
		step: number;
		format: (v: number) => string;
		group: string;
		explanation: string;
	}

	const sliders: SliderDef[] = [
		{ key: 'laborReductionPct', label: 'Labor reduction %', min: 0.05, max: 0.95, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'AI Adoption', explanation: 'The final percentage of human jobs replaced by AI at full ramp. 50% means half of all positions are automated.' },
		{ key: 'rampYears', label: 'Ramp years', min: 3, max: 30, step: 1, format: (v) => `${v} yrs`, group: 'AI Adoption', explanation: 'How many years to reach full labor reduction. Uses an S-curve: slow start, rapid middle, slow finish. Shorter = faster disruption.' },
		{ key: 'aiCostPerWorkerYear', label: 'AI cost / worker / year', min: 10000, max: 120000, step: 5000, format: (v) => `$${(v / 1000).toFixed(0)}k`, group: 'AI Adoption', explanation: 'Annual cost of AI compute to replace one human worker today. This is a subsidized price — real costs are higher. Declines each year by the AI cost decline rate.' },
		{ key: 'aiCostDeclineRate', label: 'AI cost decline rate', min: 0.05, max: 0.40, step: 0.05, format: (v) => `${Math.round(v * 100)}%/yr`, group: 'AI Adoption', explanation: 'How fast AI costs drop each year (like Moore\'s Law). At 20%, a $60k AI worker costs $6k in 10 years.' },
		{ key: 'aiSubsidyYears', label: 'AI subsidy period', min: 0, max: 8, step: 1, format: (v) => v === 0 ? 'None' : `${v} yrs`, group: 'AI Adoption', explanation: 'Current AI pricing is below true cost — companies like OpenAI and Anthropic are subsidizing to grab market share. When subsidies end, costs spike before hardware improvements catch up.' },
		{ key: 'aiCostCorrectionPct', label: 'Post-subsidy cost jump', min: 1.0, max: 4.0, step: 0.25, format: (v) => `${v.toFixed(1)}x`, group: 'AI Adoption', explanation: 'How much AI costs increase when subsidies end. 2x means costs double to reflect true hardware/power/cooling costs. After the correction, the normal decline rate resumes.' },
		{ key: 'marginRetentionPct', label: 'Margin retention', min: 0.1, max: 1.0, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Economics', explanation: 'How much of the labor savings companies keep as profit vs. pass to consumers as lower prices. 50% = split evenly.' },
		{ key: 'dividendPayoutRatio', label: 'Dividend payout ratio', min: 0.1, max: 0.8, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Economics', explanation: 'What fraction of new AI-driven profits companies pay out as dividends. Remainder is reinvested or used for buybacks.' },
		{ key: 'revenueGrowthRate', label: 'Revenue growth', min: 0.0, max: 0.10, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%/yr`, group: 'Economics', explanation: 'Annual baseline revenue growth before demand effects. Represents overall economic/market expansion.' },
		{ key: 'investorModelAdoption', label: 'Investor model adoption', min: 0.0, max: 1.0, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Demand', explanation: 'What % of displaced workers replace their wages with investment income. At 0% demand collapses; at 70%+ the economy stabilizes.' },
		{ key: 'supplyChainCostPct', label: 'Supply chain cost reduction', min: 0.0, max: 0.60, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Demand', explanation: 'As the whole economy automates, non-labor costs drop too — shipping, manufacturing, raw materials. This compounds the profit effect.' },
		{ key: 'wageShareOfSpending', label: 'Spending cut when displaced', min: 0.4, max: 1.0, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Demand', explanation: 'How much of their spending displaced workers cut. At 90%, someone who loses their job cuts 90% of spending. Also dampens revenue growth — companies can\'t grow when customers are disappearing.' },
		{ key: 'essentialsFloor', label: 'Demand floor', min: 0.0, max: 0.50, step: 0.05, format: (v) => `${Math.round(v * 100)}%`, group: 'Demand', explanation: 'The minimum demand even in total collapse — food, shelter, utilities, healthcare. At 20%, the economy shrinks to bare essentials. At 0%, no floor at all.' },
	];

	let groups = $derived([...new Set(sliders.map((s) => s.group))]);
</script>

{#if params}
	<div class="space-y-4">
		<h2 class="text-lg font-semibold text-text">Assumptions</h2>

		{#each groups as group}
			<div>
				<h4 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{group}</h4>
				<div class="space-y-3">
					{#each sliders.filter((s) => s.group === group) as slider}
						<div>
							<div class="flex justify-between text-xs mb-1">
								<span class="text-text-muted flex items-center gap-1">
									{slider.label}
									<button
										onclick={() => toggleTooltip(slider.key)}
										class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-text-muted/40 text-text-muted/60 hover:border-accent hover:text-accent transition-colors text-[10px] leading-none"
										aria-label="Explain {slider.label}"
									>?</button>
								</span>
								<span class="text-accent font-mono">
									{slider.format(params[slider.key] as number)}
								</span>
							</div>
							{#if tooltipKey === slider.key}
								<div class="text-xs text-text-muted bg-bg/80 border border-bg-input rounded p-2 mb-1">
									{slider.explanation}
								</div>
							{/if}
							<input
								type="range"
								min={slider.min}
								max={slider.max}
								step={slider.step}
								value={params[slider.key]}
								oninput={(e) => {
									(params as any)[slider.key] = Number((e.target as HTMLInputElement).value);
									update();
								}}
								class="w-full accent-accent"
							/>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
