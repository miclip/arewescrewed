<script lang="ts">
	import { personalInputs } from '$lib/stores/personal';
	import { SECTORS } from '$lib/model/sectors';
	import { formatCurrency } from '$lib/model/format';

	let incomeTarget = $state(75_000);
	let currentSavings = $state(50_000);
	let monthlySavings = $state(1_000);
	let selectedSector = $state('Technology/Software');

	// Sync initial from store
	$effect(() => {
		const unsub = personalInputs.subscribe((v) => {
			incomeTarget = v.incomeTarget;
			currentSavings = v.currentSavings;
			monthlySavings = v.monthlySavings;
			selectedSector = v.selectedSector;
		});
		return unsub;
	});

	function update() {
		personalInputs.set({
			incomeTarget,
			currentSavings,
			monthlySavings,
			selectedSector
		});
	}
</script>

<div class="space-y-5">
	<h2 class="text-lg font-semibold text-text">Your Situation</h2>

	<div>
		<label class="block text-sm text-text-muted mb-1" for="income-target">
			Annual income needed
			<span class="text-accent font-mono">{formatCurrency(incomeTarget)}</span>
		</label>
		<input
			id="income-target"
			type="range"
			min="30000"
			max="200000"
			step="5000"
			bind:value={incomeTarget}
			oninput={update}
			class="w-full accent-accent"
		/>
		<div class="flex justify-between text-xs text-text-muted">
			<span>$30k</span>
			<span>$200k</span>
		</div>
	</div>

	<div>
		<label class="block text-sm text-text-muted mb-1" for="current-savings">Current savings / investments</label>
		<input
			id="current-savings"
			type="number"
			min="0"
			max="5000000"
			step="5000"
			bind:value={currentSavings}
			oninput={update}
			class="w-full bg-bg-input text-text rounded px-3 py-2 text-sm font-mono border border-bg-input focus:border-accent focus:outline-none"
		/>
	</div>

	<div>
		<label class="block text-sm text-text-muted mb-1" for="monthly-savings">
			Monthly savings
			<span class="text-accent font-mono">{formatCurrency(monthlySavings)}/mo</span>
		</label>
		<input
			id="monthly-savings"
			type="range"
			min="0"
			max="5000"
			step="100"
			bind:value={monthlySavings}
			oninput={update}
			class="w-full accent-accent"
		/>
		<div class="flex justify-between text-xs text-text-muted">
			<span>$0</span>
			<span>$5k</span>
		</div>
	</div>

	<div>
		<label class="block text-sm text-text-muted mb-1" for="sector-select">Your job sector</label>
		<select
			id="sector-select"
			bind:value={selectedSector}
			onchange={update}
			class="w-full bg-bg-input text-text rounded px-3 py-2 text-sm border border-bg-input focus:border-accent focus:outline-none"
		>
			{#each SECTORS as sector}
				<option value={sector.name}>
					{sector.name}
				</option>
			{/each}
		</select>
	</div>
</div>
