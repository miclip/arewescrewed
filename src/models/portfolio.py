"""
Portfolio model: simulate a diversified investment portfolio across
multiple companies and sectors.

A person doesn't invest in one company. They build a portfolio:
- AI infrastructure providers (the ones selling the compute)
- Tech giants (massive labor forces to cut, huge profit potential)
- Traditional dividend payers (already returning capital)
- Consumer staples / healthcare (demand-resilient)

The portfolio model runs scenarios per-company then aggregates
to show total portfolio yield and income.
"""

from dataclasses import dataclass, field

from src.models.scenario import ScenarioParams, YearProjection, run_scenario
from src.models.labor import LaborEstimate


@dataclass
class CompanyProfile:
    """A company in the portfolio with its financials and labor estimate."""
    ticker: str
    name: str
    cik: str
    sector: str
    # Financials (base year)
    revenue: float
    operating_income: float
    net_income: float
    shares_outstanding: float
    current_dividend_per_share: float  # What they pay TODAY
    share_price: float                 # Current price
    # Labor
    headcount: int
    estimated_labor_cost: float
    labor_pct_of_revenue: float
    # Portfolio weight
    weight: float = 0.0  # Fraction of portfolio (0.0 to 1.0)


@dataclass
class PortfolioAllocation:
    """How capital is allocated across companies."""
    company: CompanyProfile
    dollars_invested: float
    shares_owned: float
    weight: float


@dataclass
class PortfolioYearResult:
    """Portfolio-level results for one year."""
    year: int
    total_dividends: float
    total_invested: float
    portfolio_yield: float            # Annual dividends / total invested
    annual_income: float              # Same as total_dividends for the investor
    # Capital gains & total return
    portfolio_value: float = 0.0              # Current market value of holdings
    capital_gains_income: float = 0.0         # Additional income from selling shares
    total_income: float = 0.0                 # Dividends + capital gains
    total_return_pct: float = 0.0             # Total income / initial investment %
    # Breakdown
    company_dividends: dict[str, float] = field(default_factory=dict)
    company_values: dict[str, float] = field(default_factory=dict)


@dataclass
class PortfolioResult:
    """Full portfolio simulation result."""
    scenario_name: str
    total_invested: float
    allocations: list[PortfolioAllocation]
    yearly_results: list[PortfolioYearResult] = field(default_factory=list)


# Representative portfolio of companies across sectors.
# Financials are FY2024/2025 actuals or best estimates.
# These are hand-curated for the model — in production we'd pull all from EDGAR.
PORTFOLIO_COMPANIES: list[CompanyProfile] = [
    # AI Infrastructure — these BENEFIT from AI spending
    CompanyProfile(
        ticker="NVDA", name="NVIDIA", cik="0001045810",
        sector="AI Infrastructure",
        revenue=130.5e9, operating_income=81.4e9, net_income=72.9e9,
        shares_outstanding=24.5e9, current_dividend_per_share=0.04,
        share_price=130.0,
        headcount=36_000, estimated_labor_cost=14.4e9,
        labor_pct_of_revenue=11.0,
    ),
    CompanyProfile(
        ticker="MSFT", name="Microsoft", cik="0000789019",
        sector="Technology",
        revenue=254.2e9, operating_income=118.5e9, net_income=97.1e9,
        shares_outstanding=7.43e9, current_dividend_per_share=3.32,
        share_price=415.0,
        headcount=228_000, estimated_labor_cost=55.0e9,
        labor_pct_of_revenue=21.6,
    ),
    CompanyProfile(
        ticker="AAPL", name="Apple", cik="0000320193",
        sector="Technology",
        revenue=391.0e9, operating_income=125.8e9, net_income=97.2e9,
        shares_outstanding=15.1e9, current_dividend_per_share=1.00,
        share_price=235.0,
        headcount=161_000, estimated_labor_cost=42.0e9,
        labor_pct_of_revenue=10.7,
    ),
    CompanyProfile(
        ticker="GOOGL", name="Alphabet", cik="0001652044",
        sector="Technology",
        revenue=350.0e9, operating_income=112.4e9, net_income=94.3e9,
        shares_outstanding=12.2e9, current_dividend_per_share=0.80,
        share_price=185.0,
        headcount=183_000, estimated_labor_cost=56.0e9,
        labor_pct_of_revenue=16.0,
    ),
    CompanyProfile(
        ticker="AMZN", name="Amazon", cik="0001018724",
        sector="Technology / Retail",
        revenue=716.9e9, operating_income=80.0e9, net_income=77.7e9,
        shares_outstanding=10.8e9, current_dividend_per_share=0.0,
        share_price=230.0,
        headcount=1_556_000, estimated_labor_cost=185.0e9,
        labor_pct_of_revenue=25.8,
    ),
    CompanyProfile(
        ticker="META", name="Meta Platforms", cik="0001326801",
        sector="Technology",
        revenue=164.5e9, operating_income=68.0e9, net_income=56.2e9,
        shares_outstanding=2.53e9, current_dividend_per_share=2.00,
        share_price=600.0,
        headcount=74_000, estimated_labor_cost=24.5e9,
        labor_pct_of_revenue=14.9,
    ),
    # Traditional Dividend Payers
    CompanyProfile(
        ticker="JPM", name="JPMorgan Chase", cik="0000019617",
        sector="Financial Services",
        revenue=180.0e9, operating_income=62.0e9, net_income=54.0e9,
        shares_outstanding=2.85e9, current_dividend_per_share=5.00,
        share_price=250.0,
        headcount=313_000, estimated_labor_cost=50.0e9,
        labor_pct_of_revenue=27.8,
    ),
    CompanyProfile(
        ticker="JNJ", name="Johnson & Johnson", cik="0000200406",
        sector="Healthcare",
        revenue=89.0e9, operating_income=22.0e9, net_income=14.6e9,
        shares_outstanding=2.41e9, current_dividend_per_share=4.96,
        share_price=155.0,
        headcount=131_000, estimated_labor_cost=18.5e9,
        labor_pct_of_revenue=20.8,
    ),
    CompanyProfile(
        ticker="PG", name="Procter & Gamble", cik="0000080424",
        sector="Consumer Staples",
        revenue=84.0e9, operating_income=20.2e9, net_income=15.0e9,
        shares_outstanding=2.36e9, current_dividend_per_share=4.03,
        share_price=165.0,
        headcount=107_000, estimated_labor_cost=14.5e9,
        labor_pct_of_revenue=17.3,
    ),
    CompanyProfile(
        ticker="XOM", name="ExxonMobil", cik="0000034088",
        sector="Energy",
        revenue=340.0e9, operating_income=52.0e9, net_income=33.7e9,
        shares_outstanding=4.21e9, current_dividend_per_share=3.96,
        share_price=108.0,
        headcount=62_000, estimated_labor_cost=11.0e9,
        labor_pct_of_revenue=3.2,
    ),
]


def build_equal_weight_portfolio(
    companies: list[CompanyProfile],
    total_investment: float,
) -> list[PortfolioAllocation]:
    """Allocate capital equally across all companies."""
    per_company = total_investment / len(companies)
    allocations = []
    for co in companies:
        shares = per_company / co.share_price
        allocations.append(PortfolioAllocation(
            company=co,
            dollars_invested=per_company,
            shares_owned=shares,
            weight=1.0 / len(companies),
        ))
    return allocations


def build_custom_weight_portfolio(
    companies: list[CompanyProfile],
    weights: dict[str, float],
    total_investment: float,
) -> list[PortfolioAllocation]:
    """Allocate capital by custom weights (ticker -> weight fraction)."""
    allocations = []
    for co in companies:
        w = weights.get(co.ticker, 0.0)
        dollars = total_investment * w
        shares = dollars / co.share_price if co.share_price > 0 else 0
        allocations.append(PortfolioAllocation(
            company=co,
            dollars_invested=dollars,
            shares_owned=shares,
            weight=w,
        ))
    return allocations


def run_portfolio_scenario(
    scenario_params: ScenarioParams,
    scenario_name: str,
    allocations: list[PortfolioAllocation],
    withdrawal_rate: float = 0.04,
) -> PortfolioResult:
    """
    Run a scenario across a full portfolio.

    For each company, runs the labor replacement scenario, then
    aggregates dividend income and capital gains across the portfolio.

    Capital gains model: share prices track earnings growth.
    Total income uses a safe withdrawal rate (default 4%) — the
    well-studied retirement planning approach. Dividends count toward
    the withdrawal; capital gains selling covers the rest.
    """
    total_invested = sum(a.dollars_invested for a in allocations)

    result = PortfolioResult(
        scenario_name=scenario_name,
        total_invested=total_invested,
        allocations=allocations,
    )

    # Run scenario per company, collect dividend projections
    company_projections: dict[str, list[YearProjection]] = {}
    for alloc in allocations:
        co = alloc.company
        # Build a labor estimate for this company
        labor = LaborEstimate(
            year=scenario_params.base_year,
            headcount=co.headcount,
            avg_compensation=co.estimated_labor_cost / co.headcount / 1.4
                if co.headcount > 0 else 0,
            benefits_multiplier=1.4,
            stock_based_comp=0,  # Already included in estimated_labor_cost
            total_labor_cost=co.estimated_labor_cost,
            labor_pct_of_revenue=co.labor_pct_of_revenue,
            labor_pct_of_opex=0,
            method="estimated",
            confidence="medium",
        )
        financials = {
            "revenue": co.revenue,
            "operating_income": co.operating_income,
            "shares_outstanding_diluted": co.shares_outstanding,
        }
        scenario_result = run_scenario(scenario_params, co.name, financials, labor)
        company_projections[co.ticker] = scenario_result.projections

    # Aggregate per year
    num_years = scenario_params.years_forward + 1
    for year_idx in range(num_years):
        year = scenario_params.base_year + year_idx
        total_divs = 0.0
        portfolio_value = 0.0
        company_divs = {}
        company_vals = {}

        for alloc in allocations:
            co = alloc.company
            proj = company_projections[co.ticker][year_idx]

            # --- Dividend income ---
            scenario_dps = proj.dividend_per_share
            existing_dps = co.current_dividend_per_share
            total_dps = existing_dps + scenario_dps
            investor_divs = alloc.shares_owned * total_dps
            total_divs += investor_divs
            company_divs[co.ticker] = investor_divs

            # --- Share price tracks earnings growth ---
            # P/E stays constant; price moves with profit
            if co.operating_income > 0:
                profit_ratio = proj.new_profit / co.operating_income
            else:
                profit_ratio = 1.0
            projected_price = co.share_price * max(0, profit_ratio)
            company_val = alloc.shares_owned * projected_price
            portfolio_value += company_val
            company_vals[co.ticker] = company_val

        portfolio_yield = (total_divs / total_invested * 100) if total_invested else 0

        # Total return: 4% safe withdrawal rate applied to portfolio value.
        # Dividends count toward the withdrawal. Sell shares for the rest.
        swr_income = portfolio_value * withdrawal_rate
        capital_gains = max(0, swr_income - total_divs)
        total_income = total_divs + capital_gains
        total_return_pct = (total_income / total_invested * 100) if total_invested else 0

        result.yearly_results.append(PortfolioYearResult(
            year=year,
            total_dividends=total_divs,
            total_invested=total_invested,
            portfolio_yield=portfolio_yield,
            annual_income=total_divs,
            portfolio_value=portfolio_value,
            capital_gains_income=capital_gains,
            total_income=total_income,
            total_return_pct=total_return_pct,
            company_dividends=company_divs,
            company_values=company_vals,
        ))

    return result


def find_income_milestone_year(
    portfolio_result: PortfolioResult,
    target_income: float,
) -> int | None:
    """Find the first year where dividend income reaches the target."""
    for yr in portfolio_result.yearly_results:
        if yr.annual_income >= target_income:
            return yr.year
    return None


def find_total_income_milestone_year(
    portfolio_result: PortfolioResult,
    target_income: float,
) -> int | None:
    """Find the first year where total income (dividends + capital gains) reaches the target."""
    for yr in portfolio_result.yearly_results:
        if yr.total_income >= target_income:
            return yr.year
    return None
