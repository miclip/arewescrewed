<script lang="ts">
	import { personalOutcome } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { PersonalOutcome } from '$lib/model/types';

	let outcome = $state<PersonalOutcome | null>(null);

	$effect(() => {
		const unsub = personalOutcome.subscribe((v) => {
			outcome = v;
		});
		return unsub;
	});

	const statusConfig = {
		on_track: { icon: '&#9679;', color: 'text-green', bg: 'bg-green/10 border-green/30', label: 'On Track' },
		tight: { icon: '&#9679;', color: 'text-yellow', bg: 'bg-yellow/10 border-yellow/30', label: 'Tight' },
		gap: { icon: '&#9679;', color: 'text-red', bg: 'bg-red/10 border-red/30', label: 'Gap' }
	};
</script>

{#if outcome}
	{@const status = statusConfig[outcome.verdict]}
	<div class="space-y-4">
		<h2 class="text-lg font-semibold text-text">The Verdict</h2>

		<div class="rounded-xl border p-4 {status.bg}">
			<div class="flex items-center gap-2 mb-3">
				<span class="text-2xl {status.color}">{@html status.icon}</span>
				<span class="font-bold text-lg {status.color}">{status.label}</span>
			</div>

			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-text-muted">Required portfolio</span>
					<span class="font-mono font-semibold">{formatCompact(outcome.requiredPortfolio)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-text-muted">Your sector displaced by</span>
					<span class="font-mono font-semibold">{outcome.displacementYear}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-text-muted">Projected portfolio then</span>
					<span class="font-mono font-semibold">{formatCompact(outcome.portfolioAtDisplacement)}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-text-muted">{outcome.gap >= 0 ? 'Surplus' : 'Gap'}</span>
					<span class="font-mono font-semibold {outcome.gap >= 0 ? 'text-green' : 'text-red'}">
						{outcome.gap >= 0 ? '+' : '-'}{formatCompact(Math.abs(outcome.gap))}
					</span>
				</div>
				{#if outcome.monthlyNeededToClose > 0}
					<div class="flex justify-between">
						<span class="text-text-muted">Extra monthly savings needed</span>
						<span class="font-mono font-semibold text-yellow">{formatCompact(outcome.monthlyNeededToClose)}/mo</span>
					</div>
				{/if}
			</div>
		</div>

		<p class="text-sm text-text-muted leading-relaxed">{outcome.verdictMessage}</p>
	</div>
{/if}
