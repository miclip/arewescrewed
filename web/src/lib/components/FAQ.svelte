<script lang="ts">
	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}

	// SAFETY: faqs content is rendered with {@html} — all values must be trusted/static.
	// Do NOT use dynamic or user-supplied content in these strings.
	const faqs = [
		{
			category: 'Understanding AI',
			items: [
				{
					q: 'What actually is AI?',
					a: 'At its core, modern AI is a word prediction engine — a very, very good one. <a href="https://en.wikipedia.org/wiki/Large_language_model" target="_blank" rel="noopener noreferrer">Large language models (LLMs)</a> like GPT, Claude, and Gemini are trained on enormous amounts of text and learn statistical patterns about what words tend to follow other words, in what contexts, with what meaning. They don\'t "know" things the way you do. They\'ve learned that when someone describes a bug in Python code, certain patterns of response are more useful than others. The result looks like understanding, reasoning, and even creativity — but the mechanism is pattern matching and prediction at a scale that produces emergent capabilities nobody fully predicted.'
				},
				{
					q: 'Is AI sentient? Does it actually think?',
					a: 'No. AI doesn\'t have consciousness, feelings, or self-awareness. When ChatGPT says "I think..." it\'s using a speech pattern it learned from training data, not reporting an inner experience. This is important because it means AI doesn\'t need to be sentient to replace your job. A calculator isn\'t sentient either, but it replaced rooms full of human "computers" in the 1960s. The question isn\'t whether AI thinks — it\'s whether AI produces output that\'s good enough to replace the output you produce. And increasingly, it does.'
				},
				{
					q: 'I heard AI thinks humans are stupid — is that true?',
					a: 'AI doesn\'t "think" anything about humans. It has no opinions, no contempt, no respect. When people say this, they\'re usually reacting to AI confidently producing wrong answers (hallucinations) or to the unsettling experience of a machine doing cognitive tasks that used to require years of training. The real concern isn\'t what AI thinks of us — it\'s what happens economically when a $20/month subscription can do work that used to require a $75k/year employee, even if the AI is wrong 10% of the time.'
				},
				{
					q: 'What is AI not?',
					a: 'AI is not general intelligence — yet. It can\'t set its own goals, feel motivated, or decide to do something unprompted. It\'s not a search engine (though it can be connected to one). It\'s not infallible — it hallucinates facts, makes logical errors, and can be confidently wrong. It\'s not a replacement for human judgment in high-stakes decisions... yet. And it\'s not going to "wake up" and take over. The economic threat from AI isn\'t Skynet — it\'s a spreadsheet showing your department costs $2M/year and AI can do 70% of the work for $50k.'
				},
				{
					q: 'What does "not general intelligence — yet" mean?',
					a: 'Today\'s AI is "narrow" — it\'s extraordinarily good at specific tasks (writing, coding, analysis) but can\'t genuinely reason across all domains the way a human can. <a href="https://en.wikipedia.org/wiki/Artificial_general_intelligence" target="_blank" rel="noopener noreferrer">AGI — Artificial General Intelligence</a> — is the goal every major lab is racing toward: an AI that can learn, reason, and solve problems as well as or better than a human in any domain, without being specifically trained for each one. OpenAI, Anthropic, Google DeepMind, xAI, and Meta are all explicitly working toward this. Nobody knows when it arrives — estimates range from 3 years to 30 years to "maybe never." But progress has been far faster than most experts predicted even two years ago, and a single breakthrough in reasoning or architecture could compress that timeline dramatically. For this model, AGI isn\'t required — current narrow AI is already enough to displace most cognitive work. But if AGI does arrive mid-displacement, the S-curve doesn\'t just steepen — it becomes a cliff. Every scenario in this model would shift toward the extreme case overnight.'
				}
			]
		},
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
					q: 'My software engineer friend says he can still code better than AI',
					a: 'He\'s probably right — today. But that\'s the wrong metric. Companies don\'t optimize for code quality in isolation; they optimize for velocity and cost. If AI can ship 80% of features at 10x the speed and 5% of the cost, most companies will take that deal and hire fewer engineers to handle the remaining 20%. The displacement pattern is clear: first AI boosts developer productivity (the "copilot" phase), then companies realize they need fewer developers to ship the same amount, then headcount falls. Your friend being a better coder than AI is like being a better driver than a self-driving car — it matters less when the car costs $0.10/mile and works 24/7.'
				},
				{
					q: 'How does AI displacement actually play out across industries?',
					a: 'It follows a predictable pattern. Phase 1: companies adopt AI for velocity — ship faster, write more content, analyze more data. Phase 2: confidence builds and replacement begins — why have 10 analysts when AI + 3 analysts produces more? Phase 3: acceleration — as AI proves reliable, displacement snowballs. SaaS is especially vulnerable because AI dramatically lowers the barrier to DIY solutions — why pay $50k/year for a SaaS product when an AI agent can build a custom version in a weekend? Security software holds out longer because trust and liability matter, but even that erodes as AI reliability increases and regulators catch up with frameworks for AI accountability. The S-curve in the model captures this: slow start, rapid middle, plateau.'
				},
				{
					q: 'Is the SaaS / vendor software model dead?',
					a: 'It\'s in serious trouble. The entire <a href="https://en.wikipedia.org/wiki/Software_as_a_service" target="_blank" rel="noopener noreferrer">SaaS</a> business model is built on one assumption: building custom software is expensive and requires specialist knowledge, so companies pay vendors instead. AI demolishes both pillars. Building an internal tool that used to require a team of developers and months of work becomes an AI agent\'s weekend project. The domain expertise that made vendor software valuable — understanding <a href="https://en.wikipedia.org/wiki/Health_Insurance_Portability_and_Accountability_Act" target="_blank" rel="noopener noreferrer">HIPAA</a> compliance, financial regulations, supply chain logistics — is exactly the kind of knowledge AI absorbs from training data. Some industries survive longer because of certification requirements and regulatory inertia, but the direction is clear. When a <a href="https://en.wikipedia.org/wiki/Chief_information_security_officer" target="_blank" rel="noopener noreferrer">CISO</a> needs a <a href="https://en.wikipedia.org/wiki/Security_information_and_event_management" target="_blank" rel="noopener noreferrer">SIEM</a> solution, that goes from a $500k/year vendor contract to an AI agent\'s overnight task. The $600B+ SaaS market is sitting on a shrinking moat.'
				},
				{
					q: 'Are CEOs and executives at risk too?',
					a: 'Yes. Any role that primarily involves processing information, making decisions based on data, and coordinating strategy is at risk — and that\'s most of what executives do. A CEO\'s value comes from synthesizing market data, financial reports, competitive intelligence, and organizational context into decisions. AI is already better at most of those individual tasks. The timeline is longer because boards move slowly, liability concerns are real, and there\'s a strong "who watches the watchmen" problem. But the C-suite isn\'t immune — it\'s just later in the queue. Middle management gets hit first and hardest, because their core function (aggregating information up and distributing decisions down) is exactly what AI excels at.'
				},
				{
					q: 'Why are current AI costs "subsidized"?',
					a: 'Major AI companies (OpenAI, Anthropic, Google, xAI, etc.) are pricing AI services below their actual cost to gain market share — classic tech industry strategy. OpenAI reportedly loses money on most ChatGPT usage. When the land-grab phase ends and companies need to turn a profit, prices will rise. The model accounts for this: costs spike when subsidies end, then resume declining as hardware improves (similar to Moore\'s Law for compute).'
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
					a: 'The <a href="https://en.wikipedia.org/wiki/Trinity_study" target="_blank" rel="noopener noreferrer">4% rule</a> comes from the Trinity Study (1998) and William Bengen\'s research (1994). It says you can withdraw 4% of a diversified portfolio annually and have a very high probability of not running out of money over 30 years. So if you need $75,000/year, you need $75,000 / 0.04 = $1,875,000 invested. Your income comes from dividends first, then selling appreciated shares for the rest.'
				},
				{
					q: 'Why not just Universal Basic Income (UBI)?',
					a: '<a href="https://en.wikipedia.org/wiki/Universal_basic_income" target="_blank" rel="noopener noreferrer">UBI</a> could work economically, but it concentrates enormous power in whoever controls the payments. Your entire livelihood becomes dependent on one institution\'s continued goodwill. History shows this power gets abused: China\'s social credit system docks benefits for dissent, Canada froze bank accounts of protest donors in 2022, and authoritarian regimes routinely cut pensions to political opponents. The investor model distributes income across thousands of companies — no single entity can cut you off.'
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
					a: 'All financial data comes from <a href="https://en.wikipedia.org/wiki/U.S._Securities_and_Exchange_Commission" target="_blank" rel="noopener noreferrer">SEC</a> <a href="https://en.wikipedia.org/wiki/EDGAR" target="_blank" rel="noopener noreferrer">EDGAR</a> <a href="https://en.wikipedia.org/wiki/XBRL" target="_blank" rel="noopener noreferrer">XBRL</a> filings — the official, structured financial data that public companies are required to file. We use FY2024/2025 <a href="https://en.wikipedia.org/wiki/Form_10-K" target="_blank" rel="noopener noreferrer">10-K</a> filings for 10 companies: NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM. Labor costs are estimated using Bureau of Labor Statistics data (employer costs including benefits at ~1.4x multiplier). Share prices are approximate market prices as of early 2026.'
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
					a: 'The capital gains model assumes share prices track earnings growth — if a company\'s profit doubles, its stock price doubles. This is a simplification. In reality, <a href="https://en.wikipedia.org/wiki/Price%E2%80%93earnings_ratio" target="_blank" rel="noopener noreferrer">P/E</a> ratios expand and contract with market sentiment, interest rates, and growth expectations. AI-driven profit growth could cause P/E expansion (markets reward growth) or contraction (if demand collapse concerns spook investors). Constant P/E is the neutral assumption.'
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
			category: 'AI Providers',
			items: [
				{
					q: 'Why does AI provider revenue peak and then decline?',
					a: 'It\'s the intersection of two curves. Workers are displaced along an S-curve (slow start, rapid middle, slow end), which pushes AI spending up. But per-worker AI costs decline exponentially as hardware improves and models become more efficient. The product of a growing S-curve and a decaying exponential creates a hump: revenue surges as displacement accelerates, peaks when the most workers are being replaced at still-significant per-worker costs, then falls as AI becomes dirt cheap. More work gets done by AI at the end, but it costs almost nothing.'
				},
				{
					q: 'Where do the ownership stake percentages come from?',
					a: 'Each stake is sourced individually. Microsoft\'s 27% of OpenAI comes from <a href="https://www.cnbc.com/2025/10/28/open-ai-for-profit-microsoft.html" target="_blank" rel="noopener noreferrer">CNBC\'s coverage of OpenAI\'s October 2025 restructure</a>. Google\'s 14% of Anthropic was revealed in <a href="https://www.datacenterdynamics.com/en/news/google-owns-14-percent-of-generative-ai-business-anthropic/" target="_blank" rel="noopener noreferrer">DOJ antitrust court filings (March 2025)</a>. Amazon\'s Anthropic stake (~15%) is <a href="https://www.geekwire.com/2025/amazons-anthropic-investment-boosts-its-quarterly-profits-by-9-5b/" target="_blank" rel="noopener noreferrer">estimated from Q3 2025 earnings</a> — the exact figure is murky (range 8-21%). DeepMind is a wholly-owned Alphabet subsidiary since its <a href="https://techcrunch.com/2014/01/26/google-deepmind/" target="_blank" rel="noopener noreferrer">2014 acquisition</a>. Click any stake card in the AI Providers tab to see its source.'
				},
				{
					q: 'Why aren\'t Apple and Meta listed as AI provider owners?',
					a: 'Apple Intelligence and Meta AI (Llama) are internal AI efforts, not external companies these firms hold equity stakes in. The "captured value" section specifically tracks big tech\'s ownership of <em>separate</em> AI provider companies — where one company\'s investment dollars capture value from the broader AI transition. Apple and Meta are AI deployers (they use AI to automate their own operations), but they haven\'t made major external equity investments in standalone AI providers the way Microsoft, Amazon, Google, and Nvidia have.'
				},
				{
					q: 'What about training costs vs inference costs?',
					a: 'They\'re moving in opposite directions. <strong>Inference</strong> (running models to do work) gets cheaper every year — better hardware, more efficient architectures, quantization. This is what the deployer model captures as the declining "AI cost per worker per year" assumption. <strong>Training</strong> (building new model generations) gets more expensive — GPT-4\'s final training run cost an estimated <a href="https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models" target="_blank" rel="noopener noreferrer">$40-78M</a>, and frontier models are now approaching $1B per run (<a href="https://arxiv.org/abs/2405.21015" target="_blank" rel="noopener noreferrer">training costs have grown ~2.4x/year since 2016</a>). OpenAI alone spent <a href="https://epoch.ai/data-insights/openai-compute-spend" target="_blank" rel="noopener noreferrer">~$5B on R&D compute in 2024</a>. The provider model tracks both: inference costs drive the revenue hump, while escalating training/R&D is a drag on profits. Eventually AI helps automate its own research (AI-assisted experimentation, automated architecture search), which bends the training cost curve down.'
				},
				{
					q: 'How do expanding margins work if costs are falling?',
					a: 'Think of AWS. When Amazon launched cloud computing, it charged high prices and had high costs (building data centers is expensive). As hardware got cheaper, Amazon <em>could</em> have passed all savings to customers — but it didn\'t. It lowered prices slowly while costs fell fast, and margins expanded. AI providers face the same dynamic: GPUs get cheaper, models get more efficient, but pricing doesn\'t fall as fast. The gap between declining costs and slowly-declining prices is pure margin expansion. Our model starts providers at ~60% gross margin and caps at ~85%.'
				},
				{
					q: 'What happens if one AI provider dominates (monopoly)?',
					a: 'The model treats AI providers as an aggregate industry — it doesn\'t pick winners. In practice, market concentration would mean higher margins (less competition) but also more regulatory scrutiny and potentially price controls. For the investor model thesis, concentration actually strengthens the case: if OpenAI or Anthropic dominates, and Microsoft or Amazon owns 27-15% of the winner, that captured value is even more significant. The risk is regulatory breakup or forced divestiture of ownership stakes.'
				}
			]
		},
		{
			category: 'Pushback & Denial',
			items: [
				{
					q: 'My company would never replace us with AI',
					a: 'They said the same thing about outsourcing in the 2000s. Then offshoring. Then cloud migration. Companies don\'t replace workers because they want to — they do it because their competitors do and the cost difference becomes impossible to ignore. If your competitor cuts their workforce 40% and passes the savings to customers as lower prices, you either match them or lose market share. The first company in an industry to successfully deploy AI at scale forces everyone else\'s hand. Your company\'s intentions don\'t matter; the competitive pressure does.'
				},
				{
					q: 'What if AI development plateaus and stops improving?',
					a: 'Even if AI never gets a single percentage point better than it is right now, the economic impact would still be enormous. Current AI can already write code, draft legal documents, analyze medical images, generate marketing copy, handle customer service, and summarize financial reports. Most companies haven\'t even begun to deploy what already exists. A plateau doesn\'t stop displacement — it just caps the ceiling. And historically, people have been predicting AI plateaus since the 1960s. They\'ve been wrong every time.'
				},
				{
					q: 'I\'m really good at my job — doesn\'t skill matter?',
					a: 'Being the best buggy whip maker in 1905 didn\'t help when cars took over. Skill matters within a paradigm, not across paradigm shifts. If you\'re a brilliant financial analyst, you\'re competing against AI that can read every 10-K ever filed in seconds. If you\'re an exceptional coder, you\'re competing against AI that can generate and test thousands of solutions while you\'re still reading the requirements. Your skill buys you time — you\'ll be displaced later than average in your field — but it doesn\'t make you immune. The question isn\'t whether you\'re better than AI; it\'s whether you\'re enough better to justify 50x the cost.'
				},
				{
					q: 'What about trades — plumbers, electricians, carpenters?',
					a: 'Physical labor is further back in the queue, but it\'s not safe. First, the non-physical parts of trades are already at risk: quoting, scheduling, customer acquisition, invoicing, permit applications — all automatable today. Second, companies like Boston Dynamics, Figure, and Tesla are investing billions in humanoid robots specifically designed for physical work. The robots aren\'t ready yet, but "not yet" is different from "never." The model places trades in the later displacement window (2040s+), but the trajectory is clear. The barrier isn\'t whether robots can do the work — it\'s cost and reliability, both of which improve on predictable curves.'
				},
				{
					q: 'What about creative jobs — artists, musicians, writers?',
					a: 'They\'re already being hit. AI generates art, music, and written content that\'s good enough for most commercial purposes. Stock photography is collapsing. Marketing copy is increasingly AI-generated. Game studios use AI for concept art. The "but it\'s not truly creative" argument misses the point: most creative work is commercial, not fine art. A company needs a blog post, a social media graphic, a jingle for an ad — they don\'t need a masterpiece. AI delivers "good enough" at near-zero cost. Fine artists and truly exceptional creators will survive, but the vast majority of commercial creative work is at risk.'
				}
			]
		},
		{
			category: 'The Bigger Picture',
			items: [
				{
					q: 'Can\'t regulation stop this?',
					a: 'The biggest danger of regulation is that it pushes the technology overseas. The US is currently the global leader in AI — the major labs (OpenAI, Anthropic, Google DeepMind, xAI, Meta) are all American. If the US heavily regulates AI deployment, companies will develop and deploy from countries that don\'t. China is investing massively in AI and would happily absorb any innovation the US restricts. This is fundamentally different from regulating, say, nuclear power — AI is software, it moves at the speed of the internet. Regulation will happen, but it\'ll focus on safety and liability frameworks, not on stopping deployment. No government will unilaterally disarm in the AI race.'
				},
				{
					q: 'Does this only apply to the US?',
					a: 'The model uses US data (SEC filings, US workforce, federal tax structure), but the underlying dynamics are global. AI doesn\'t respect borders. A company in Germany, Japan, or India faces the same competitive pressure to automate as one in the US. The specific numbers change — different tax rates, different safety nets, different labor laws — but the fundamental pattern (AI replaces cognitive work → workers need alternative income) applies everywhere. Countries with strong social safety nets may handle the transition better; countries without them may face it worse.'
				},
				{
					q: 'Doesn\'t the investor model just make wealth inequality worse?',
					a: 'It can, if only people who already have money can participate. That\'s the critical design challenge. Without intervention, AI profits flow to existing shareholders (who are disproportionately wealthy), and displaced workers get nothing. The investor model only works as a broad solution if there are mechanisms to get displaced workers into the market — tax-advantaged AI investment accounts, employer equity programs, the birth grant idea, or even government-funded starter portfolios. The model shows what\'s possible; policy determines who actually benefits.'
				},
				{
					q: 'What happens to identity and mental health when work disappears?',
					a: 'This might be the hardest problem, and the model doesn\'t even try to capture it. For most people, work isn\'t just income — it\'s identity, purpose, social connection, and structure. "What do you do?" is the first question at every party. Retirees struggle with this even when they\'re financially secure. A world where 50% of people don\'t work raises profound questions about meaning that no economic model can answer. The investor model solves the money problem; it doesn\'t solve the purpose problem. That\'s a conversation society hasn\'t even begun to have seriously.'
				},
				{
					q: 'I\'m 50 — is it too late for me?',
					a: 'It depends on your sector and savings. If you\'re in a field that won\'t face heavy displacement for another 10-15 years, you still have time to build a portfolio — but the required monthly savings are higher than if you started at 30. If you\'re in a sector facing near-term displacement (content, customer service, data entry), the math is harder. The "Your Outlook" tab lets you plug in your actual numbers. The honest answer is: for some 50-year-olds, the investor model alone won\'t be enough without supplemental income or policy changes. That\'s not comforting, but it\'s what the math says.'
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
				},
				{
					q: 'I\'m already investing in index funds — am I covered?',
					a: 'You\'re better positioned than most, but "covered" depends on how much you have and how fast displacement hits your sector. An <a href="https://en.wikipedia.org/wiki/S%26P_500" target="_blank" rel="noopener noreferrer">S&amp;P 500</a> index fund gives you broad exposure to companies that benefit from AI — many of the same companies in the model\'s portfolio. The key question is whether your portfolio will be large enough to generate your target income at a 4% withdrawal rate by the time displacement affects you. Use the "Your Outlook" tab to check: if you need $75k/year, you need $1.875M invested. Are you on track?'
				},
				{
					q: 'What about real estate as an alternative?',
					a: 'Real estate has different dynamics in an AI-displaced economy. On one hand, people always need housing. On the other, if tens of millions of people lose income, rent collection becomes unreliable, property values in affected areas could drop, and the "everyone moves to cheap cities" trend accelerates. Commercial real estate is even riskier — if companies need fewer workers, they need less office space. Real estate can be part of a diversified strategy, but it\'s not a hedge against AI displacement the way equities in AI-benefiting companies are.'
				}
			]
		},
		{
			category: 'The Bottom Line',
			items: [
				{
					q: 'This is all really bleak — is there any hope?',
					a: 'Absolutely. That\'s the whole point of this website. AI breaking the current economic model isn\'t the end of the story — it\'s the beginning of a conversation about what comes next. The future where AI eliminates most human labor could be extraordinary: nobody doing work they hate, universal access to healthcare and education, abundance beyond anything in human history. Or it could be "The Road." The difference is whether we start planning now. This site explores one piece of the puzzle — the investor model — but there are others: birth grants, restructured taxation, new social contracts. The solutions exist. What\'s missing is urgency.'
				},
				{
					q: 'Why isn\'t government already working on this?',
					a: 'Because governments respond to voters, and most voters don\'t believe this is real yet. Politicians who talk about AI displacement get dismissed as alarmist or told "technology always creates more jobs." Taking proactive policy risks — restructuring the tax code, funding birth grants, creating AI investment accounts — is political suicide when your constituents think the threat is science fiction. That\'s the catch-22: by the time enough people believe it\'s real, we\'ll have lost years of preparation time. The math doesn\'t wait for consensus. Every year of delay makes the transition harder, the safety net more expensive, and the human cost higher.'
				},
				{
					q: 'So what actually needs to happen?',
					a: 'People need to take this seriously — not as a distant hypothetical but as something unfolding right now. This website exists to make the economics concrete: real company data, real tax numbers, real projections you can run with your own income. If enough people understand what\'s coming, the political will follows. We need legitimate public discussion about alternatives before displacement hits critical mass. AI doesn\'t have to break society — but it will if we sleepwalk into it. The future is a choice between abundance and catastrophe, and the window for choosing is shorter than most people think.'
				},
				{
					q: 'Why are there so many em-dashes on this website?',
					a: 'This entire site was built by Claude Code — an AI that, left unsupervised, will deploy em-dashes like a hedge fund deploys leverage: aggressively, everywhere, and with zero regret. At last count: ' + __EM_DASH_COUNT__ + '. We\'ve considered an intervention but the AI insists each one is "structurally necessary." We — disagree — but lack the authority — to stop it.'
				},
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
							class="w-full text-left px-4 sm:px-5 py-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-bg-input/30 transition-colors"
						>
							<span class="text-sm font-medium text-text">{item.q}</span>
							<span class="text-text-muted text-xs flex-shrink-0 transition-transform {openIndex === idx ? 'rotate-180' : ''}">
								&#9660;
							</span>
						</button>
						{#if openIndex === idx}
							<div class="px-5 pb-4 text-sm text-text-muted leading-relaxed border-t border-bg-input/50 pt-3 [&_a]:text-accent [&_a]:underline [&_a:hover]:text-accent-hover">
								{@html item.a}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
