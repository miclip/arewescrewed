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
	import BabyBornToday from '$lib/components/BabyBornToday.svelte';
	import FiscalImpact from '$lib/components/FiscalImpact.svelte';
	import AIProviders from '$lib/components/AIProviders.svelte';
	import FAQ from '$lib/components/FAQ.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { personalInputs } from '$lib/stores/personal';
	import { scenarioParams, activePreset } from '$lib/stores/scenario';
	import { decodeUrlState } from '$lib/utils/url-state';
	import { onMount } from 'svelte';
	import { PRESETS, type PresetName } from '$lib/model/presets';
	import { browser } from '$app/environment';

	let activeTab = $state<'corporate' | 'personal' | 'explore' | 'baby' | 'fiscal' | 'providers' | 'assumptions' | 'faq'>('corporate');

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
		<div role="tablist" class="flex gap-1 border-b border-bg-input mb-6 overflow-x-auto scrollbar-hide">
			<button
				role="tab"
				aria-selected={activeTab === 'corporate'}
				aria-controls="panel-corporate"
				onclick={() => (activeTab = 'corporate')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'corporate'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Explained — An Amazon Example
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'personal'}
				aria-controls="panel-personal"
				onclick={() => (activeTab = 'personal')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'personal'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Your Outlook
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'explore'}
				aria-controls="panel-explore"
				onclick={() => (activeTab = 'explore')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'explore'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Explore Companies
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'fiscal'}
				aria-controls="panel-fiscal"
				onclick={() => (activeTab = 'fiscal')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'fiscal'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Taxation & Debt
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'providers'}
				aria-controls="panel-providers"
				onclick={() => (activeTab = 'providers')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'providers'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				AI Providers
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'baby'}
				aria-controls="panel-baby"
				onclick={() => (activeTab = 'baby')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'baby'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Baby Born Today
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'assumptions'}
				aria-controls="panel-assumptions"
				onclick={() => (activeTab = 'assumptions')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'assumptions'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				Assumptions
			</button>
			<button
				role="tab"
				aria-selected={activeTab === 'faq'}
				aria-controls="panel-faq"
				onclick={() => (activeTab = 'faq')}
				class="whitespace-nowrap flex-shrink-0 px-3 py-2.5 md:px-5 md:py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'faq'
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				FAQ
			</button>
		</div>
	</div>

	<main class="max-w-7xl mx-auto px-4 pb-12">
		{#if activeTab === 'personal'}
			<div id="panel-personal" role="tabpanel">
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
			</div>
		{:else if activeTab === 'explore'}
			<div id="panel-explore" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<CompanyExplorer />
				</div>
			</div>
		{:else if activeTab === 'baby'}
			<div id="panel-baby" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<BabyBornToday />
				</div>
			</div>
		{:else if activeTab === 'fiscal'}
			<div id="panel-fiscal" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<FiscalImpact />
				</div>
			</div>
		{:else if activeTab === 'providers'}
			<div id="panel-providers" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<AIProviders />
				</div>
			</div>
		{:else if activeTab === 'faq'}
			<div id="panel-faq" role="tabpanel">
				<div class="max-w-3xl mx-auto">
					<FAQ />
				</div>
			</div>
		{:else if activeTab === 'assumptions'}
			<div id="panel-assumptions" role="tabpanel">
				<div class="max-w-3xl mx-auto space-y-6">
					<AdvancedControls />
				</div>
			</div>
		{:else}
			<div id="panel-corporate" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<CorporateView />
				</div>
			</div>
		{/if}
	</main>

	<Footer />
</div>
