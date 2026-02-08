<script lang="ts">
	import { personalOutcome } from '$lib/stores/results';
	import { formatCompact, formatCurrency } from '$lib/model/format';
	import type { PersonalOutcome } from '$lib/model/types';

	let outcome = $state<PersonalOutcome | null>(null);

	$effect(() => {
		const unsub = personalOutcome.subscribe((v) => { outcome = v; });
		return unsub;
	});
</script>

{#if outcome}
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		<div class="bg-bg-card rounded-lg p-3 border border-bg-input">
			<div class="text-xs text-text-muted mb-1">Required Portfolio</div>
			<div class="text-lg font-bold font-mono text-accent">
				{formatCompact(outcome.requiredPortfolio)}
			</div>
		</div>
		<div class="bg-bg-card rounded-lg p-3 border border-bg-input">
			<div class="text-xs text-text-muted mb-1">Displacement Year</div>
			<div class="text-lg font-bold font-mono text-yellow">
				{outcome.displacementYear}
			</div>
		</div>
		<div class="bg-bg-card rounded-lg p-3 border border-bg-input">
			<div class="text-xs text-text-muted mb-1">Projected Portfolio</div>
			<div class="text-lg font-bold font-mono">
				{formatCompact(outcome.portfolioAtDisplacement)}
			</div>
		</div>
		<div class="bg-bg-card rounded-lg p-3 border border-bg-input">
			<div class="text-xs text-text-muted mb-1">{outcome.gap >= 0 ? 'Surplus' : 'Gap'}</div>
			<div class="text-lg font-bold font-mono {outcome.gap >= 0 ? 'text-green' : 'text-red'}">
				{outcome.gap >= 0 ? '+' : '-'}{formatCompact(Math.abs(outcome.gap))}
			</div>
		</div>
	</div>
{/if}
