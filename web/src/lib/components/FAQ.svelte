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
					q: 'Why does the extreme scenario drop off so much?',
					a: 'The demand death spiral. In the extreme scenario, 95% of jobs are replaced in just 8 years, but only 30% of displaced workers become investors. The other 70% lose their income and stop buying things. Companies see revenue collapse because their customers are broke — fewer jobs means less spending means less revenue means lower stock prices. Even a baby\'s portfolio isn\'t immune: it compounds nicely in the early years, then the demand collapse drags everything down. This is the whole point of the model — without widespread adoption of the investor model, extreme automation destroys the consumer base that funds corporate profits.'
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
			category: 'Baby Born Today',
			items: [
				{
					q: 'Why a birth grant instead of monthly contributions?',
					a: 'Compound growth is exponential — the earlier money enters the market, the more it multiplies. A $50k lump sum at birth has 21 years to compound before the child turns 21. Monthly contributions starting later miss the most powerful compounding years. The model shows this clearly: a birth grant of $50k can grow to several hundred thousand by age 21, while reaching the same amount through monthly savings starting at age 22 requires dramatically higher contributions.'
				},
				{
					q: 'Where does the cost-of-living reduction come from?',
					a: 'The supply chain cascade. As AI automates not just individual companies but their entire supply chains — shipping, manufacturing, agriculture, energy — the cost of producing everything drops. A baby born today will enter adulthood in a world where $75k of purchasing power might only cost $45k-$55k in nominal terms. The model tracks this using the same S-curve as workforce displacement, applied to non-labor costs across the economy.'
				},
				{
					q: 'Is $50k per baby realistic as government policy?',
					a: 'About 3.6 million babies are born in the US each year. At $50k each, that\'s $180 billion/year — roughly 3% of the federal budget. For context, the US spends ~$900B/year on defense. Whether it\'s politically feasible is a different question, but the math isn\'t absurd. And if the alternative is supporting those same people with $25k/year safety net spending for decades, the birth grant is dramatically cheaper.'
				},
				{
					q: 'What happens if the market crashes during those 21 years?',
					a: 'The model uses portfolio growth rates derived from the scenario engine, which includes demand feedback effects. In moderate scenarios, growth is strong because AI-boosted profits drive returns. In extreme scenarios with low investor adoption, demand collapse drags down returns. Real markets would also have volatility the model doesn\'t capture. But over 21-year horizons, equities have historically recovered from every crash. The 4% SWR rule already accounts for sequence-of-returns risk.'
				},
				{
					q: 'Why age 21 as the unlock age?',
					a: 'It\'s a balance. Younger unlock ages (18) risk the money being spent before the person understands its purpose. Older ages (25, 30) mean the person has years without access during peak displacement. Age 21 gives 21 years of compounding and unlocks right around when most people are establishing financial independence. The model could work with other unlock ages — the compound math just shifts.'
				}
			]
		},
		{
			category: 'Taxation & Government',
			items: [
				{
					q: 'Why does the deficit explode even when corporate tax revenue rises?',
					a: 'Because the math is lopsided. Workers pay ~37% in combined income tax (~22%) and payroll tax (~15.3%). Investors pay ~15% capital gains. So when a worker earning $60k becomes an investor earning $60k, the government goes from collecting ~$22k/year to ~$9k/year — a 60% drop per person. Corporate tax revenue does rise as AI-boosted profits grow, but it can\'t offset losing income and payroll tax from tens of millions of workers simultaneously.'
				},
				{
					q: 'Why can\'t we just tax capital gains at income rates to fix it?',
					a: 'It helps, but it doesn\'t solve the problem. Even if you equalize capital gains to income tax rates (22%), you still lose the entire payroll tax (15.3% — funding Social Security and Medicare). There\'s no payroll tax equivalent for investment income. A worker paying 37% total becomes an investor paying 22% — still a 40% revenue drop per person. The payroll tax hole alone runs into hundreds of billions per year at moderate displacement levels.'
				},
				{
					q: 'What about a "robot tax" or automation tax?',
					a: 'It\'s one of many policy ideas being discussed. A robot tax would charge companies for displacing workers, essentially making them fund the safety net for displaced workers. The challenge is implementation: what counts as "automation"? Does upgrading software count? Does a self-checkout lane count? And if you make automation expensive, you slow down the productivity gains that make the investor model work. It\'s a real tension with no easy answer.'
				},
				{
					q: 'Why does debt-to-GDP get so extreme in some scenarios?',
					a: 'It\'s a double squeeze. The numerator (debt) grows because deficits compound — you\'re borrowing more each year AND paying interest on all previous borrowing. The denominator (GDP) shrinks because displaced workers without income stop spending, which drags down economic output. When debt grows while GDP shrinks, the ratio explodes. This is why the demand model matters so much: without the investor model propping up consumer spending, you get a fiscal death spiral on top of the economic one.'
				},
				{
					q: 'How does the safety net cost work?',
					a: 'Displaced workers who don\'t become investors (the "unemployed" in the model) cost the government roughly $25k/year per person in safety net spending — unemployment insurance, food assistance, Medicaid, housing vouchers, etc. This is a conservative estimate; actual per-person costs vary widely. In the extreme scenario with 30% investor adoption, that\'s ~106 million unemployed people × $25k = $2.7 trillion/year in additional spending on top of the existing budget.'
				}
			]
		},
		{
			category: 'Taking Action',
			items: [
				{
					q: 'What should I actually do?',
					a: 'This isn\'t financial advice — we\'re not qualified to give any. But the model does highlight a few things worth thinking about: understanding your displacement timeline (try the "Your Outlook" tab with your numbers), thinking about how your skills relate to AI, and generally being aware that the economic landscape is shifting. What you do with that information is up to you and probably a conversation worth having with an actual financial advisor.'
				},
				{
					q: 'What investments should I consider?',
					a: 'Talk to a financial advisor — seriously. This model explores an economic thesis, it doesn\'t recommend specific investments. The 10-company portfolio (NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM) is used to illustrate the model\'s mechanics, not as a recommendation. Your actual investment strategy should account for your full financial picture, risk tolerance, and tax situation — none of which this website knows anything about.'
				},
				{
					q: 'How much time do I have?',
					a: 'It depends on your sector. Under the moderate scenario, warehouse and logistics workers face displacement around 2032-2035, while education and healthcare workers have until the 2040s. But the time to start building a portfolio is now — compound growth needs time to work. Every year of delay makes the required monthly savings significantly higher.'
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
