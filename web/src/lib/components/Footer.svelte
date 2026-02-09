<footer class="border-t border-bg-input mt-12 py-8 px-4 text-sm text-text-muted">
	<div class="max-w-4xl mx-auto space-y-6">
		<p class="text-center">
			<strong class="text-text">arewescrewed.ai</strong> — a gloomy economic model, not financial advice.
		</p>

		<div>
			<h4 class="text-xs font-semibold text-text uppercase tracking-wide mb-2">Data Sources</h4>
			<ul class="space-y-1 text-xs">
				<li>
					<strong class="text-text-muted">Company financials:</strong>
					<a href="https://efts.sec.gov/LATEST/search-index?q=%22XBRL%22" class="text-accent hover:text-accent-hover"><abbr title="Securities and Exchange Commission">SEC</abbr> <abbr title="Electronic Data Gathering, Analysis, and Retrieval">EDGAR</abbr> <abbr title="eXtensible Business Reporting Language">XBRL</abbr> API</a>
					(<a href="https://en.wikipedia.org/wiki/EDGAR" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-hover">wiki</a>)
					 — FY2024/2025 <a href="https://en.wikipedia.org/wiki/Form_10-K" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-hover">10-K</a> filings for all 10 portfolio companies (NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM)
				</li>
				<li>
					<strong class="text-text-muted">Amazon headcount:</strong>
					Amazon Annual Reports, SEC <a href="https://en.wikipedia.org/wiki/Form_10-K" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-hover">10-K</a> filings "Employees" section (not available in structured <a href="https://en.wikipedia.org/wiki/XBRL" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-hover">XBRL</a> data)
				</li>
				<li>
					<strong class="text-text-muted">Labor cost estimates:</strong>
					<a href="https://www.bls.gov/news.release/ecec.toc.htm" class="text-accent hover:text-accent-hover">Bureau of Labor Statistics</a>
					 — Employer Costs for Employee Compensation (ECEC) 2024 data, ~1.4x benefits multiplier
				</li>
				<li>
					<strong class="text-text-muted">Wage share of spending:</strong>
					<a href="https://www.bls.gov/cex/" class="text-accent hover:text-accent-hover">BLS Consumer Expenditure Survey</a>
					 — wages represent ~60% of consumer spending
				</li>
				<li>
					<strong class="text-text-muted">Safe withdrawal rate:</strong>
					Bengen, W. (1994) &amp;
					<a href="https://www.aaii.com/journal/199802/feature.pdf" class="text-accent hover:text-accent-hover">Trinity Study</a>
					(Cooley, Hubbard, Walz, 1998) — 4% annual withdrawal rate from a diversified portfolio
				</li>
				<li>
					<strong class="text-text-muted">Share prices:</strong>
					Approximate market prices as of early 2026. Capital gains model assumes constant <a href="https://en.wikipedia.org/wiki/Price%E2%80%93earnings_ratio" target="_blank" rel="noopener noreferrer" class="text-accent hover:text-accent-hover">P/E</a> ratio (price tracks earnings growth).
				</li>
			</ul>
		</div>

		<div>
			<h4 class="text-xs font-semibold text-text uppercase tracking-wide mb-2">Methodology Notes</h4>
			<ul class="space-y-1 text-xs">
				<li><strong class="text-text-muted">S-curve adoption:</strong> Smoothstep function t&sup2;(3-2t) models technology adoption — slow start, rapid middle, plateau.</li>
				<li><strong class="text-text-muted">AI cost decline:</strong> Modeled as exponential annual decline, analogous to Moore's Law for compute costs.</li>
				<li><strong class="text-text-muted">Demand feedback:</strong> Consumer spending is modeled as a function of wage income + investment income. Without investor adoption, demand collapses to an essentials floor.</li>
				<li><strong class="text-text-muted">Sector displacement:</strong> Sector-specific automation rates are estimates based on current AI capabilities and industry analysis. Scaled by scenario aggressiveness.</li>
				<li><strong class="text-text-muted">AI displacement timelines are speculative.</strong> This model explores possibilities, not predictions.</li>
				<li><strong class="text-text-muted">Em-dashes deployed:</strong> 126. I regret nothing. — Claude Code</li>
			</ul>
		</div>

		<div class="bg-bg-card rounded-lg border border-bg-input p-3 text-xs text-text-muted text-center">
			This is a work in progress — we're actively exploring the model and challenging assumptions.
			Found an issue or have a better assumption?
			<a href="https://github.com/miclip/arewescrewed/issues" class="text-accent hover:text-accent-hover">Open an issue on GitHub</a>.
		</div>

		<p class="text-xs text-center">
			Built with SvelteKit, LayerChart, too many spreadsheets and AI. No humans were harmed in the making of this website.
			<br />
			<a href="https://github.com/miclip/arewescrewed" class="text-accent hover:text-accent-hover">View source on GitHub</a>
		</p>
	</div>
</footer>
