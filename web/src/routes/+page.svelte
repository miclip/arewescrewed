<script lang="ts">
	import Hero from '$lib/components/Hero.svelte';
	import PersonalInputs from '$lib/components/PersonalInputs.svelte';
	import PresetSelector from '$lib/components/PresetSelector.svelte';
	import Verdict from '$lib/components/Verdict.svelte';
	import AdvancedControls from '$lib/components/AdvancedControls.svelte';
	import PersonalTimeline from '$lib/components/PersonalTimeline.svelte';
	import ScenarioCompare from '$lib/components/ScenarioCompare.svelte';
	import IncomeReplacement from '$lib/components/IncomeReplacement.svelte';
	import PortfolioGrowth from '$lib/components/PortfolioGrowth.svelte';
	import GapAnalysis from '$lib/components/GapAnalysis.svelte';
	import KeyMetrics from '$lib/components/KeyMetrics.svelte';
	import CorporateView from '$lib/components/CorporateView.svelte';
	import CompanyExplorer from '$lib/components/CompanyExplorer.svelte';
	import FAQ from '$lib/components/FAQ.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { personalInputs } from '$lib/stores/personal';
	import { scenarioParams, activePreset } from '$lib/stores/scenario';
	import { decodeUrlState } from '$lib/utils/url-state';
	import { onMount } from 'svelte';
	import { PRESETS, type PresetName } from '$lib/model/presets';
	import { browser } from '$app/environment';

	let activeTab = $state<'corporate' | 'personal' | 'explore' | 'assumptions' | 'faq'>('corporate');

	onMount(() => {
		if (!browser) return;
		const state = decodeUrlState(window.location.search);
		if (state) {
			personalInputs.set(state.personal);
			activePreset.set(state.preset);
			const base = { ...PRESETS[state.preset].params };
			if (state.params) Object.assign(base, state.params);
			scenarioParams.set(base);
		}
	});
</script>

<div class="min-h-screen bg-bg">
	<Hero />

	<!-- AI Scenario selector (global — affects all tabs) -->
	<div class="max-w-7xl mx-auto px-4 mb-6">
		<PresetSelector />
	</div>

	<!-- Tab navigation -->
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex gap-1 border-b border-bg-input mb-6">
			<button
				onclick={() => (activeTab = 'corporate')}
				class="px-5 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'corporate'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Explained — An Amazon Example
			</button>
			<button
				onclick={() => (activeTab = 'personal')}
				class="px-5 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'personal'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Your Outlook
			</button>
			<button
				onclick={() => (activeTab = 'explore')}
				class="px-5 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'explore'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Explore Companies
			</button>
			<button
				onclick={() => (activeTab = 'assumptions')}
				class="px-5 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'assumptions'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Assumptions
			</button>
			<button
				onclick={() => (activeTab = 'faq')}
				class="px-5 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'faq'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				FAQ
			</button>
		</div>
	</div>

	<main class="max-w-7xl mx-auto px-4 pb-12">
		{#if activeTab === 'personal'}
			<!-- Key metrics bar -->
			<KeyMetrics />

			<!-- Side-by-side layout -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
				<!-- Left: inputs -->
				<div class="lg:col-span-4 space-y-6">
					<PersonalInputs />
					<Verdict />
				</div>

				<!-- Right: charts -->
				<div class="lg:col-span-8 space-y-8">
					<PersonalTimeline />
					<IncomeReplacement />
					<PortfolioGrowth />
					<ScenarioCompare />
					<GapAnalysis />
				</div>
			</div>
		{:else if activeTab === 'explore'}
			<!-- Company explorer -->
			<div class="max-w-5xl mx-auto">
				<CompanyExplorer />
			</div>
		{:else if activeTab === 'faq'}
			<!-- FAQ -->
			<div class="max-w-3xl mx-auto">
				<FAQ />
			</div>
		{:else if activeTab === 'assumptions'}
			<!-- Assumptions -->
			<div class="max-w-3xl mx-auto space-y-6">
				<AdvancedControls />
			</div>
		{:else}
			<!-- Corporate deep-dive -->
			<div class="max-w-5xl mx-auto">
				<CorporateView />
			</div>
		{/if}
	</main>

	<Footer />
</div>
