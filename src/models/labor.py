"""
Labor cost estimation module.

Estimates total labor cost per company per year from:
1. Employee headcount (from 10-K text, since XBRL often lacks it)
2. Average compensation by industry (BLS data)
3. Benefits multiplier (BLS employer costs for employee compensation)
4. Stock-based compensation (from EDGAR XBRL)

For companies that DO report total compensation in filings, we use that directly.
For others, we estimate: total_labor = headcount × avg_comp × benefits_multiplier + SBC
"""

from dataclasses import dataclass


@dataclass
class LaborEstimate:
    year: int
    headcount: int
    avg_compensation: float       # Base salary + wages
    benefits_multiplier: float    # Total comp / wages ratio (BLS says ~1.4x)
    stock_based_comp: float
    total_labor_cost: float
    labor_pct_of_revenue: float
    labor_pct_of_opex: float
    method: str                   # 'reported', 'estimated', 'hybrid'
    confidence: str               # 'high', 'medium', 'low'


# Amazon headcount from 10-K filings (not in XBRL, manually extracted from filings).
# Sources: Amazon Annual Reports, SEC 10-K filings "Employees" section.
# Note: Amazon reports full-time and part-time employees; these are total.
AMAZON_HEADCOUNT: dict[int, int] = {
    2007: 17_000,
    2008: 20_700,
    2009: 24_300,
    2010: 33_700,
    2011: 56_200,
    2012: 88_400,
    2013: 117_300,
    2014: 154_100,
    2015: 230_800,
    2016: 341_400,
    2017: 566_000,
    2018: 647_500,
    2019: 798_000,
    2020: 1_298_000,
    2021: 1_608_000,
    2022: 1_541_000,
    2023: 1_525_000,
    2024: 1_556_000,
    2025: 1_556_000,  # Placeholder — update when 10-K text is available
}

# BLS average total compensation by broad industry sector (annual, 2024 estimates).
# Source: BLS Employer Costs for Employee Compensation (ECEC).
# These are rough averages — the model can be refined with more granular data.
# Format: industry -> (avg_annual_wages, benefits_multiplier)
# benefits_multiplier = total_comp / wages (includes health, retirement, taxes)
BLS_INDUSTRY_COMP: dict[str, tuple[float, float]] = {
    "internet_retail": (75_000, 1.42),      # Warehouse + tech mix
    "technology": (130_000, 1.38),           # Software, cloud, etc.
    "financial_services": (100_000, 1.45),
    "healthcare": (65_000, 1.40),
    "retail": (35_000, 1.35),               # Traditional retail
    "manufacturing": (55_000, 1.42),
    "energy": (90_000, 1.40),
    "telecommunications": (80_000, 1.38),
    "consumer_staples": (50_000, 1.38),
    "default": (65_000, 1.40),
}


def estimate_labor_cost(
    year: int,
    headcount: int | None,
    stock_based_comp: float | None,
    revenue: float | None,
    total_costs: float | None,
    industry: str = "default",
) -> LaborEstimate | None:
    """
    Estimate total labor cost for a company-year.

    Returns None if we don't have enough data (at minimum, need headcount).
    """
    if headcount is None or headcount == 0:
        return None

    avg_comp, benefits_mult = BLS_INDUSTRY_COMP.get(
        industry, BLS_INDUSTRY_COMP["default"]
    )

    sbc = stock_based_comp or 0.0

    # Base labor cost = headcount × avg_comp × benefits_multiplier
    base_labor = headcount * avg_comp * benefits_mult
    total_labor = base_labor + sbc

    # Calculate percentages
    labor_pct_rev = (total_labor / revenue * 100) if revenue else 0.0
    labor_pct_opex = (total_labor / total_costs * 100) if total_costs else 0.0

    return LaborEstimate(
        year=year,
        headcount=headcount,
        avg_compensation=avg_comp,
        benefits_multiplier=benefits_mult,
        stock_based_comp=sbc,
        total_labor_cost=total_labor,
        labor_pct_of_revenue=labor_pct_rev,
        labor_pct_of_opex=labor_pct_opex,
        method="estimated",
        confidence="medium",
    )


def estimate_amazon_labor(
    year: int,
    financials: dict[str, float | int],
) -> LaborEstimate | None:
    """
    Estimate Amazon's labor cost for a given year using known headcount data.

    Amazon is a special case because:
    - Huge mix of warehouse workers (~70%) and tech workers (~30%)
    - We use a blended average that accounts for this split
    """
    headcount = AMAZON_HEADCOUNT.get(year)
    if headcount is None:
        return None

    sbc = financials.get("stock_based_comp", 0)
    revenue = financials.get("revenue")
    total_costs = financials.get("total_costs_and_expenses")

    # Amazon-specific blended compensation:
    # ~70% warehouse/logistics at ~$40k avg + ~30% corporate/tech at ~$160k avg
    warehouse_pct = 0.70
    tech_pct = 0.30
    warehouse_avg = 40_000
    tech_avg = 160_000
    blended_avg = (warehouse_pct * warehouse_avg) + (tech_pct * tech_avg)
    benefits_mult = 1.40  # BLS average

    base_labor = headcount * blended_avg * benefits_mult
    total_labor = base_labor + sbc

    labor_pct_rev = (total_labor / revenue * 100) if revenue else 0.0
    labor_pct_opex = (total_labor / total_costs * 100) if total_costs else 0.0

    return LaborEstimate(
        year=year,
        headcount=headcount,
        avg_compensation=blended_avg,
        benefits_multiplier=benefits_mult,
        stock_based_comp=sbc,
        total_labor_cost=total_labor,
        labor_pct_of_revenue=labor_pct_rev,
        labor_pct_of_opex=labor_pct_opex,
        method="estimated",
        confidence="medium",
    )
