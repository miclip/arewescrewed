# Are We Screwed?

An economic model exploring what happens when AI replaces human labor — and whether humans can sustain themselves as investors in AI-powered companies.

**Live site:** [arewescrewed.ai](https://arewescrewed.ai)

## The Thesis

AI is replacing information workers. If displaced workers simply lose their income, consumer spending collapses and even the most profitable AI-powered company watches its revenue crater. UBI concentrates too much power in government. The third option: displaced workers become investors in the companies deploying AI, replacing wage income with dividends and capital gains.

This model calculates whether that's actually viable.

## What the Model Does

- **S-curve labor displacement** across 4 scenarios (conservative to extreme)
- **Demand feedback loops** — displaced workers cut spending, which reduces corporate revenue, which reduces profits (demand-dampened growth)
- **AI cost modeling** — subsidized pricing today, correction when subsidies end, then Moore's Law-style decline
- **Supply chain cascade** — as the whole economy automates, non-labor costs drop too
- **10-company portfolio** — NVDA, MSFT, AAPL, GOOGL, AMZN, META, JPM, JNJ, PG, XOM
- **Personal financial calculator** — given your income, savings, and sector, can you accumulate enough before displacement hits?
- **4% safe withdrawal rate** — dividends first, then capital gains (Trinity Study)

## Project Structure

```
├── src/                  # Python data pipeline
│   ├── ingestion/        # SEC EDGAR XBRL API client
│   ├── normalization/    # Financial data normalization
│   ├── storage/          # SQLite storage
│   └── models/           # Scenario engine, portfolio model
├── web/                  # SvelteKit interactive website
│   └── src/lib/
│       ├── model/        # TypeScript port of scenario/portfolio engines
│       ├── components/   # Svelte 5 UI components + LayerChart charts
│       ├── stores/       # Reactive state management
│       └── utils/        # URL state encoding
├── scripts/              # Data validation and scenario runners
└── wearenotscrewed.ipynb # Jupyter notebook (analytical deep-dive)
```

## Running Locally

### Website

```bash
cd web
npm install
npm run dev
```

### Python Model

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Requires a populated SQLite database from the EDGAR pipeline (see `scripts/`).

## Data Sources

- **Company financials:** [SEC EDGAR XBRL API](https://efts.sec.gov/LATEST/search-index?q=%22XBRL%22) — FY2024/2025 10-K filings
- **Labor cost estimates:** [BLS Employer Costs for Employee Compensation](https://www.bls.gov/news.release/ecec.toc.htm) — ~1.4x benefits multiplier
- **Safe withdrawal rate:** Bengen (1994) & [Trinity Study](https://www.aaii.com/journal/199802/feature.pdf) (Cooley, Hubbard, Walz, 1998)

## Tech Stack

**Python:** pandas, numpy, httpx, SQLite

**Web:** SvelteKit, Svelte 5, TypeScript, TailwindCSS v4, LayerChart, D3

**CI/CD:** GitHub Actions → GitHub Pages (static prerendered site)

## Disclaimer

This is a speculative economic model, not financial advice. AI displacement timelines are estimates. The model explores possibilities, not predictions.

## License

[MIT](LICENSE)
