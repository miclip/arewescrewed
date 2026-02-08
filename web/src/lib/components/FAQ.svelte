<script lang="ts">
	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}

	const faqs = [
		{
			category: 'The AI Economy',
			items: [
				{
					q: 'Is AI really going to replace my job?',
					a: 'It depends on what you do. AI is already replacing tasks that involve processing information, generating text, analyzing data, and writing code. It\'s not about whether your entire job disappears overnight — it\'s about whether enough of your tasks get automated that companies need fewer people doing your role. A company doesn\'t need to replace 100% of a job to cut headcount; replacing 60% of the work means they need 40% fewer people.'
				},
				{
					q: 'How is this different from previous automation waves?',
					a: 'Previous waves replaced physical or routine tasks — factory assembly, telephone switching, data entry. Each time, the response was "learn cognitive skills." But AI targets cognitive work directly: writing, analysis, coding, design, legal research, medical diagnosis. When the tool can think and reason, the traditional escape hatch of "upskill to knowledge work" doesn\'t apply the same way. The jobs being created by AI (prompt engineering, AI ops) are fewer and require different skills than the ones being displaced.'
				},
				{
					q: 'What about new jobs that AI creates?',
					a: 'New jobs will absolutely emerge — AI trainers, AI safety researchers, human-AI collaboration specialists. But the math is the problem: if AI displaces 50 million jobs and creates 10 million new ones, that\'s still 40 million people who need income. And the new jobs often require very different skills and pay different wages than the old ones. The transition period is the dangerous part, even if the long-term equilibrium works out.'
				},
				{
					q: 'Why are current AI costs "subsidized"?',
					a: 'Major AI companies (OpenAI, Anthropic, Google, etc.) are pricing AI services below their actual cost to gain market share — classic tech industry strategy. OpenAI reportedly loses money on most ChatGPT usage. When the land-grab phase ends and companies need to turn a profit, prices will rise. The model accounts for this: costs spike when subsidies end, then resume declining as hardware improves (similar to Moore\'s Law for compute).'
				}
			]
		},
		{
			category: 'The Investor Model',
			items: [
				{
					q: 'What is the "investor model"?',
					a: 'Instead of relying on wages or government transfers, displaced workers shift to earning returns on a diversified portfolio of companies that benefit from AI automation. When companies replace workers with AI, their profits increase. Those profits flow to shareholders through dividends and rising share prices. The model calculates how much you\'d need invested to replace your income using a 4% safe withdrawal rate.'
				},
				{
					q: 'What is the 4% safe withdrawal rate?',
					a: 'The 4% rule comes from the Trinity Study (1998) and William Bengen\'s research (1994). It says you can withdraw 4% of a diversified portfolio annually and have a very high probability of not running out of money over 30 years. So if you need $75,000/year, you need $75,000 / 0.04 = $1,875,000 invested. Your income comes from dividends first, then selling appreciated shares for the rest.'
				},
				{
					q: 'Why not just Universal Basic Income (UBI)?',
					a: 'UBI could work economically, but it concentrates enormous power in whoever controls the payments. Your entire livelihood becomes dependent on one institution\'s continued goodwill. History shows this power gets abused: China\'s social credit system docks benefits for dissent, Canada froze bank accounts of protest donors in 2022, and authoritarian regimes routinely cut pensions to political opponents. The investor model distributes income across thousands of companies — no single entity can cut you off.'
				},
				{
					q: 'How realistic is it that displaced workers can accumulate enough?',
					a: 'This is the hard question the model tries to answer. For many people — especially those in sectors that get displaced early or those with low savings rates — the math doesn\'t work without significant changes. That\'s part of the point: the model shows the gap so we can have honest conversations about what\'s needed. Some combination of policy (tax-advantaged AI investment accounts, employer equity programs) and personal action (aggressive savings) would be required.'
				},
				{
					q: 'What about people who can\'t invest — low-income workers, the already unemployed?',
					a: 'The investor model alone doesn\'t solve for everyone. It\'s strongest for middle-class workers who have time and income to build a portfolio before displacement hits. For those who can\'t participate, other mechanisms are needed — but the investor model reduces the number of people who need direct assistance, making whatever safety net exists more sustainable. Think of it as reducing a 200-million-person problem to a 50-million-person problem.'
				}
			]
		},
		{
			category: 'The Model',
			items: [
				{
					q: 'Where does the company data come from?',
					a: 'All financial data comes from SEC EDGAR XBRL filings — the official, structured financial data that public companies are required to file. We use FY2024/2025 10-K filings for 10 companies: NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM. Labor costs are estimated using Bureau of Labor Statistics data (employer costs including benefits at ~1.4x multiplier). Share prices are approximate market prices as of early 2026.'
				},
				{
					q: 'What does the S-curve mean?',
					a: 'Technology adoption follows an S-curve (logistic curve): slow start as early adopters experiment, rapid acceleration in the middle as it becomes proven and cost-effective, then plateau as you hit diminishing returns on what can be automated. The model uses a smoothstep function — t\u00B2(3-2t) — which captures this pattern. It means displacement doesn\'t happen overnight: you have time to prepare, but the middle years are intense.'
				},
				{
					q: 'What is the "demand feedback loop"?',
					a: 'This is the key insight that makes or breaks the model. If AI displaces workers and they lose income, they stop buying things. Companies see revenue drop because their customers are broke. It\'s a death spiral: fewer jobs \u2192 less spending \u2192 less revenue \u2192 more cuts. The model tracks this explicitly: displaced workers cut ~90% of their spending. With the investor model, dividend and capital gains income partially replaces wages, propping up demand. Without it, demand collapses to an essentials floor (food, shelter, utilities).'
				},
				{
					q: 'What is the supply chain cascade?',
					a: 'It\'s not just direct employees that get cheaper. As the entire economy automates, your suppliers automate too. Shipping companies need fewer drivers, manufacturers need fewer workers, even raw material extraction gets cheaper. This compounds the profit effect — a company saves on its own labor AND pays less for everything it buys. The model applies this as a gradual reduction in non-labor costs, following the same S-curve as displacement.'
				},
				{
					q: 'How should I interpret the four scenarios?',
					a: 'Conservative (25% displaced over 20 years): AI mainly handles routine tasks, human-AI collaboration dominates. Moderate (50% over 15 years): AI handles most information work, significant restructuring. Aggressive (75% over 10 years): rapid AI advancement, most cognitive work automated. Extreme (95% over 8 years): near-total automation of human labor. Nobody knows which is right — the point is to see how your personal situation changes across the range.'
				},
				{
					q: 'Why does the model assume constant P/E ratios?',
					a: 'The capital gains model assumes share prices track earnings growth — if a company\'s profit doubles, its stock price doubles. This is a simplification. In reality, P/E ratios expand and contract with market sentiment, interest rates, and growth expectations. AI-driven profit growth could cause P/E expansion (markets reward growth) or contraction (if demand collapse concerns spook investors). Constant P/E is the neutral assumption.'
				},
				{
					q: 'What are the biggest weaknesses of this model?',
					a: 'Several. (1) It assumes AI capability continues improving roughly on trend — a major plateau would change everything. (2) It doesn\'t model government intervention (taxes, regulation, subsidies) which will absolutely happen. (3) It treats displacement as permanent — some displaced workers will find new roles. (4) It uses sector-level averages, but individual jobs within a sector will vary hugely. (5) It doesn\'t model inflation, interest rates, or market crashes. It\'s a framework for thinking, not a crystal ball.'
				}
			]
		},
		{
			category: 'The Bottom Line',
			items: [
				{
					q: 'Bruh, I still don\'t get it. Am I screwed?',
					a: 'Yes.'
				}
			]
		},
		{
			category: 'Taking Action',
			items: [
				{
					q: 'What should I actually do?',
					a: 'First, understand your timeline: check the "Your Outlook" tab with your actual numbers. Second, start or increase investing now — time in the market matters more than timing. Third, diversify across sectors that benefit from AI (the 10-company portfolio is a starting point). Fourth, build skills that complement AI rather than compete with it. Fifth, stay informed — the timeline is uncertain, but the direction is clear.'
				},
				{
					q: 'What investments should I consider?',
					a: 'This model is not financial advice. But the logic suggests diversified exposure to companies that benefit from AI automation across multiple sectors — tech, healthcare, consumer goods, finance, energy. Index funds that track the S&P 500 or total market are a simple way to get broad exposure. The 10-company portfolio in this model (NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM) is illustrative, not a recommendation.'
				},
				{
					q: 'How much time do I have?',
					a: 'It depends on your sector. Under the moderate scenario, warehouse and logistics workers face displacement around 2032-2035, while education and healthcare workers have until the 2040s. But the time to start building a portfolio is now — compound growth needs time to work. Every year of delay makes the required monthly savings significantly higher.'
				}
			]
		}
	];

	let flatIndex = 0;
</script>

<div class="space-y-8">
	<div class="space-y-2">
		<h2 class="text-2xl font-bold">Frequently Asked Questions</h2>
		<p class="text-text-muted">
			Deep dives into the model, the AI economy, and what it means for you.
		</p>
	</div>

	{#each faqs as section}
		<div class="space-y-2">
			<h3 class="text-sm font-semibold text-text-muted uppercase tracking-wide">{section.category}</h3>
			<div class="space-y-1">
				{#each section.items as item, i}
					{@const idx = faqs.slice(0, faqs.indexOf(section)).reduce((sum, s) => sum + s.items.length, 0) + i}
					<div class="bg-bg-card rounded-lg border border-bg-input overflow-hidden">
						<button
							onclick={() => toggle(idx)}
							class="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-bg-input/30 transition-colors"
						>
							<span class="text-sm font-medium text-text">{item.q}</span>
							<span class="text-text-muted text-xs flex-shrink-0 transition-transform {openIndex === idx ? 'rotate-180' : ''}">
								&#9660;
							</span>
						</button>
						{#if openIndex === idx}
							<div class="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-bg-input/50 pt-3">
								{item.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
