<script lang="ts">
	import FAQ from '$lib/components/FAQ.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>FAQ — Are We Screwed?</title>
	<meta name="description" content="Answers on AI job displacement, the investor model, the 4% rule, and how the model works." />

	<!-- FAQPage structured data lives here, on the only route that renders these
	     questions and answers in the DOM. -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
			"@type": "FAQPage",
			"mainEntity": [
				{
					"@type": "Question",
					"name": "Will AI replace my job?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "It depends on what you do. AI is already replacing tasks that involve processing information, generating text, analyzing data, and writing code. A company doesn't need to replace 100% of a job to cut headcount; replacing 60% of the work means they need 40% fewer people."
					}
				},
				{
					"@type": "Question",
					"name": "How is AI different from previous automation waves?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Previous waves replaced physical or routine tasks. AI targets cognitive work directly: writing, analysis, coding, design, legal research, medical diagnosis. When the tool can think and reason, the traditional escape hatch of 'upskill to knowledge work' doesn't apply the same way."
					}
				},
				{
					"@type": "Question",
					"name": "What is the investor model alternative to UBI?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Instead of relying on wages or government transfers, displaced workers shift to earning returns on a diversified portfolio of companies that benefit from AI automation. When companies replace workers with AI, their profits increase and flow to shareholders through dividends and rising share prices."
					}
				},
				{
					"@type": "Question",
					"name": "What is the 4% safe withdrawal rate?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "The 4% rule comes from the Trinity Study (1998). It says you can withdraw 4% of a diversified portfolio annually and have a very high probability of not running out of money over 30 years. If you need $75,000/year, you need $1,875,000 invested."
					}
				},
				{
					"@type": "Question",
					"name": "Why not Universal Basic Income (UBI)?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "UBI could work economically, but it concentrates enormous power in whoever controls the payments. The investor model distributes income across thousands of companies — no single entity can cut you off."
					}
				},
				{
					"@type": "Question",
					"name": "What is the AI job displacement timeline?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Technology adoption follows an S-curve: slow start, rapid acceleration in the middle, then plateau. Under the moderate scenario, warehouse and logistics workers face displacement around 2032-2035, while education and healthcare workers have until the 2040s."
					}
				},
				{
					"@type": "Question",
					"name": "What about trades — plumbers, electricians, carpenters?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Physical labor is further back in the queue, but it's not safe. The non-physical parts of trades are already at risk: quoting, scheduling, invoicing, permit applications. Companies like Boston Dynamics and Tesla are investing billions in humanoid robots. The model places trades in the later displacement window (2040s+)."
					}
				},
				{
					"@type": "Question",
					"name": "How much money do I need to survive AI displacement?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Using the 4% safe withdrawal rate, divide your target annual income by 0.04. For $75,000/year, you need $1,875,000 invested in a diversified portfolio. The interactive calculator on this site lets you plug in your actual numbers to see your personal gap or surplus."
					}
				},
				{
					"@type": "Question",
					"name": "What is the demand feedback loop in AI displacement?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "If AI displaces workers and they lose income, they stop buying things. Companies see revenue drop because their customers are broke. It's a death spiral: fewer jobs, less spending, less revenue, more cuts. The investor model partially replaces wages with investment income, propping up demand."
					}
				},
				{
					"@type": "Question",
					"name": "Is there hope if AI replaces most jobs?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Absolutely. AI eliminating most human labor could mean nobody doing work they hate, universal access to healthcare and education, and abundance beyond anything in human history. The difference is whether we start planning now. The solutions exist — what's missing is urgency."
					}
				}
			]
		
	})}</script>`}
</svelte:head>

<nav class="sticky top-0 z-40 bg-bg/95 backdrop-blur border-b border-bg-input">
	<div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
		<a
			href="{base}/"
			class="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors"
		>
			<svg viewBox="0 0 24 24" class="w-4 h-4 fill-none stroke-current" stroke-width="2">
				<polyline points="15 18 9 12 15 6" />
			</svg>
			Home
		</a>
	</div>
</nav>

<main class="max-w-3xl mx-auto px-4 py-8">
	<FAQ />
</main>

<Footer />
