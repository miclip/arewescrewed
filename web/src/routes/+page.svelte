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
	import PortfolioIncome from '$lib/components/PortfolioIncome.svelte';
	import KeyMetrics from '$lib/components/KeyMetrics.svelte';
	import CorporateView from '$lib/components/CorporateView.svelte';
	import CompanyExplorer from '$lib/components/CompanyExplorer.svelte';
	import FiscalImpact from '$lib/components/FiscalImpact.svelte';
	import AIProviders from '$lib/components/AIProviders.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { personalInputs } from '$lib/stores/personal';
	import { scenarioParams, activePreset } from '$lib/stores/scenario';
	import { portfolioResult } from '$lib/stores/results';
	import { formatCompact } from '$lib/model/format';
	import type { PortfolioResult as PortfolioResultType } from '$lib/model/types';
	import { decodeUrlState } from '$lib/utils/url-state';
	import { onMount } from 'svelte';
	import { PRESETS, type PresetName } from '$lib/model/presets';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';

	let activeTab = $state<'corporate' | 'personal' | 'explore' | 'fiscal' | 'providers'>('corporate');
	let showAssumptions = $state(false);
	let portfolio = $state<PortfolioResultType | null>(null);

	$effect(() => {
		const unsub = portfolioResult.subscribe((v) => { portfolio = v; });
		return unsub;
	});

	// Lock body scroll below lg breakpoint when assumptions panel is open.
	// Tracked with matchMedia rather than a one-shot window.innerWidth read, so
	// resizing or rotating past the breakpoint releases a lock that is no longer
	// wanted instead of leaving the page unscrollable.
	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 1023px)');
		const apply = () => {
			document.body.style.overflow = showAssumptions && mq.matches ? 'hidden' : '';
		};
		apply();
		mq.addEventListener('change', apply);
		return () => {
			mq.removeEventListener('change', apply);
			document.body.style.overflow = '';
		};
	});

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

<svelte:window onkeydown={(e) => e.key === 'Escape' && showAssumptions && (showAssumptions = false)} />

<div class="min-h-screen bg-bg">
	<Hero />

	<!-- AI Scenario selector (global — affects all tabs) -->
	<div class="max-w-7xl mx-auto px-4 mb-6">
		<PresetSelector />
	</div>

	<!-- Tab navigation -->
	<div class="max-w-7xl mx-auto px-4 transition-all duration-300 {showAssumptions ? 'assumptions-open' : ''}">
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
				aria-label="Toggle assumptions panel"
				aria-expanded={showAssumptions}
				onclick={() => (showAssumptions = !showAssumptions)}
				class="ml-auto flex-shrink-0 px-3 py-2.5 md:px-4 md:py-3 transition-colors border-b-2 {showAssumptions
					? 'border-accent text-accent'
					: 'border-transparent text-text-muted hover:text-text'}"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
				</svg>
			</button>
		</div>
	</div>

	<main class="max-w-7xl mx-auto px-4 pb-12 transition-all duration-300 {showAssumptions ? 'assumptions-open' : ''}">
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
						<PortfolioIncome />
						{#if portfolio}
							<div class="bg-bg-card rounded-xl border border-bg-input p-3 sm:p-5 space-y-3">
								<h3 class="font-semibold text-accent">10-Company Portfolio</h3>
								<p class="text-xs text-text-muted mb-2">
									Equal-weight allocation across sectors. Per $1M invested, year 15 total income:
								</p>
								<div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
									{#each portfolio.allocations as alloc}
										{@const yr15 = portfolio.yearlyResults[15]}
										{@const div = yr15?.companyDividends[alloc.company.ticker] ?? 0}
										<div class="bg-bg/50 rounded p-2">
											<div class="font-semibold text-text">{alloc.company.ticker}</div>
											<div class="text-text-muted">{alloc.company.name}</div>
											<div class="font-mono text-accent">{formatCompact(div)}/yr</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
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
		{:else}
			<div id="panel-corporate" role="tabpanel">
				<div class="max-w-5xl mx-auto">
					<CorporateView />
				</div>
			</div>
		{/if}
	</main>

	<!-- Assumptions slide-out panel -->
	{#if showAssumptions}
		<!-- Mobile backdrop -->
		<button
			class="fixed inset-0 bg-black/50 z-30 sm:hidden"
			onclick={() => (showAssumptions = false)}
			aria-label="Close assumptions panel"
			tabindex="-1"
		></button>

		<aside
			class="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-bg border-l border-bg-input z-40 flex flex-col shadow-2xl"
			transition:fly={{ x: 380, duration: 250 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-bg-input">
				<h2 class="text-lg font-semibold text-text">Assumptions</h2>
				<button
					onclick={() => (showAssumptions = false)}
					aria-label="Close assumptions panel"
					class="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-bg-input transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Scrollable body -->
			<div class="flex-1 overflow-y-auto px-4 py-4">
				<AdvancedControls />
			</div>
		</aside>
	{/if}

	<Footer />
</div>
