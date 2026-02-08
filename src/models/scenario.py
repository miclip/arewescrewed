"""
Scenario engine: model what happens to company economics as human labor
is replaced by AI at various levels.

Core question: If a company replaces X% of human labor with AI,
what happens to profits, dividends, and investor returns?

Key variables:
- labor_reduction_pct: 0-95% of human labor replaced
- ai_cost_per_replaced_worker: annual AI compute cost to replace one worker
- ai_cost_decline_rate: annual decline in AI costs (like Moore's Law)
- margin_retention_pct: how much of cost savings companies keep vs pass through
- demand_adjustment: how revenue changes as employment shifts
- dividend_payout_ratio: what % of profits become dividends
"""

from dataclasses import dataclass, field

from src.models.labor import LaborEstimate


@dataclass
class ScenarioParams:
    """Parameters for a labor replacement scenario."""
    labor_reduction_pct: float          # 0.0 to 0.95 — FINAL target after ramp
    ai_cost_per_worker_year: float      # Current annual AI cost per replaced worker
    ai_cost_decline_rate: float         # Annual decline (e.g., 0.25 = 25% cheaper/yr)
    margin_retention_pct: float         # 0.0 to 1.0 — savings kept vs price passthrough
    demand_adjustment: float            # IGNORED — kept for backward compat
    dividend_payout_ratio: float        # 0.0 to 1.0
    years_forward: int                  # How many years to project
    base_year: int                      # Starting year for projection
    ramp_years: int = 15               # Years to reach full labor_reduction_pct
    revenue_growth_rate: float = 0.04  # Annual revenue growth (4% default)
    # Demand model: consumer spending = f(wage_income + investment_income)
    # wage_income_share = fraction of GDP that is wages (currently ~60% in US)
    # If 50% of workers are displaced AND they have no replacement income,
    # consumer spending drops by ~30% (0.50 × 0.60). With investor model,
    # dividend income partially replaces lost wages, softening the blow.
    investor_model_adoption: float = 0.0  # 0.0 = nobody invests, 1.0 = full adoption
    wage_share_of_spending: float = 0.60  # BLS: wages are ~60% of consumer spending
    essentials_floor: float = 0.50        # Even unemployed people buy essentials (govt, savings)
    # Supply chain: as AI transforms the ENTIRE economy, non-labor costs drop too.
    # Goods, shipping, infrastructure all get cheaper as suppliers automate.
    supply_chain_cost_pct: float = 0.0    # 0.0 to 0.60 — non-labor cost reduction at full ramp


@dataclass
class YearProjection:
    """Projected financials for one year under a scenario."""
    year: int
    # Workforce
    original_headcount: int
    remaining_headcount: int
    replaced_workers: int
    # Costs
    original_labor_cost: float
    new_labor_cost: float
    ai_compute_cost: float
    labor_savings: float               # Before AI costs
    net_savings: float                 # After AI costs
    # Financials
    original_revenue: float
    adjusted_revenue: float            # After demand adjustment
    original_profit: float
    new_profit: float
    profit_increase: float
    profit_margin_original: float
    profit_margin_new: float
    # Shareholder returns
    dividends_total: float
    dividend_per_share: float
    shares_outstanding: float
    # Supply chain
    supply_chain_savings: float            # Non-labor cost reduction from economy-wide AI
    # AI cost details
    ai_cost_per_worker_this_year: float


@dataclass
class ScenarioResult:
    """Full result of running a scenario."""
    params: ScenarioParams
    company_name: str
    base_year_data: dict
    projections: list[YearProjection] = field(default_factory=list)


def run_scenario(
    params: ScenarioParams,
    company_name: str,
    base_financials: dict[str, float | int],
    labor_estimate: LaborEstimate,
) -> ScenarioResult:
    """
    Run a scenario projection for a company.

    Takes base year financials + labor estimate and projects forward
    under the given scenario parameters.
    """
    result = ScenarioResult(
        params=params,
        company_name=company_name,
        base_year_data=base_financials,
    )

    base_revenue = base_financials.get("revenue", 0)
    base_profit = base_financials.get("operating_income", 0)
    base_shares = base_financials.get("shares_outstanding_diluted", 0)

    # Non-labor operating costs = total opex - labor
    # These also decline as the supply chain automates
    base_total_opex = base_revenue - base_profit
    base_non_labor = max(0, base_total_opex - labor_estimate.total_labor_cost)

    for year_offset in range(params.years_forward + 1):
        year = params.base_year + year_offset

        # Gradual ramp: labor replacement increases over ramp_years
        # using an S-curve (logistic) for realistic adoption
        if params.ramp_years > 0:
            ramp_frac = min(1.0, year_offset / params.ramp_years)
            # S-curve: slow start, fast middle, slow end
            current_reduction = params.labor_reduction_pct * (
                ramp_frac ** 2 * (3 - 2 * ramp_frac)  # smoothstep
            )
        else:
            current_reduction = params.labor_reduction_pct

        # Revenue grows over time
        revenue_this_year = base_revenue * (
            (1 + params.revenue_growth_rate) ** year_offset
        )

        # AI costs decline over time
        ai_cost_this_year = params.ai_cost_per_worker_year * (
            (1 - params.ai_cost_decline_rate) ** year_offset
        )

        # Workers replaced (gradual ramp)
        replaced = int(labor_estimate.headcount * current_reduction)
        remaining = labor_estimate.headcount - replaced

        # Cost changes
        original_labor = labor_estimate.total_labor_cost
        new_labor = original_labor * (1 - current_reduction)
        ai_cost = replaced * ai_cost_this_year
        labor_savings = original_labor - new_labor
        net_savings = labor_savings - ai_cost

        # Demand model: economy-wide labor displacement crushes consumer spending
        # UNLESS displaced workers have replacement income (the investor model).
        #
        # Without investor model: displaced workers = lost consumer spending
        #   demand_hit = economy_wide_displacement × wage_share_of_spending
        #   But there's a floor — essentials spending continues (govt programs, savings)
        #
        # With investor model: dividend income replaces lost wages
        #   The more people invest, the less demand drops
        #
        # This is economy-wide, not just this company's workers.
        # We assume the displacement rate here represents the broader economy.
        economy_displacement = current_reduction  # proxy for economy-wide
        lost_wage_spending = economy_displacement * params.wage_share_of_spending
        # Investor model offsets some of the lost spending
        investor_offset = lost_wage_spending * params.investor_model_adoption
        # Net demand hit (with floor — people still buy essentials)
        net_demand_loss = max(0, lost_wage_spending - investor_offset)
        demand_factor = max(params.essentials_floor, 1.0 - net_demand_loss)
        adjusted_revenue = revenue_this_year * demand_factor

        # Supply chain: non-labor costs also decline as suppliers automate
        # Same S-curve ramp as labor (the whole economy transforms together)
        non_labor_this_year = base_non_labor * (
            (1 + params.revenue_growth_rate) ** year_offset
        )
        sc_savings = non_labor_this_year * (
            params.supply_chain_cost_pct * (
                ramp_frac ** 2 * (3 - 2 * ramp_frac)
            ) if params.ramp_years > 0 else params.supply_chain_cost_pct
        )

        # Profit model:
        # 1. Base business profit grows with revenue but SHRINKS with demand
        #    (if nobody's buying, Amazon doesn't make money regardless of costs)
        # 2. Labor savings are additive on top (cost-side improvement)
        # 3. Supply chain savings add further (non-labor costs also drop)
        base_profit_grown = base_profit * (
            (1 + params.revenue_growth_rate) ** year_offset
        )
        # Demand collapse hits the base business directly
        base_profit_demand_adjusted = base_profit_grown * demand_factor
        total_cost_savings = net_savings + sc_savings
        retained_savings = total_cost_savings * params.margin_retention_pct
        new_profit = base_profit_demand_adjusted + retained_savings

        # Profit margins
        margin_orig = (base_profit_grown / revenue_this_year * 100) if revenue_this_year else 0
        margin_new = (new_profit / adjusted_revenue * 100) if adjusted_revenue else 0

        # Dividends
        dividends = max(0, new_profit * params.dividend_payout_ratio)
        div_per_share = (dividends / base_shares) if base_shares else 0

        result.projections.append(YearProjection(
            year=year,
            original_headcount=labor_estimate.headcount,
            remaining_headcount=remaining,
            replaced_workers=replaced,
            original_labor_cost=original_labor,
            new_labor_cost=new_labor,
            ai_compute_cost=ai_cost,
            labor_savings=labor_savings,
            net_savings=net_savings,
            original_revenue=revenue_this_year,
            adjusted_revenue=adjusted_revenue,
            original_profit=base_profit_demand_adjusted,
            new_profit=new_profit,
            profit_increase=new_profit - base_profit_demand_adjusted,
            supply_chain_savings=sc_savings,
            profit_margin_original=margin_orig,
            profit_margin_new=margin_new,
            dividends_total=dividends,
            dividend_per_share=div_per_share,
            shares_outstanding=base_shares,
            ai_cost_per_worker_this_year=ai_cost_this_year,
        ))

    return result


# Pre-built scenario presets — each with investor_model_adoption = 0.7
# (assumes broad but not universal investment participation)
SCENARIOS: dict[str, ScenarioParams] = {
    "conservative": ScenarioParams(
        labor_reduction_pct=0.25,
        ai_cost_per_worker_year=80_000,
        ai_cost_decline_rate=0.15,
        margin_retention_pct=0.60,
        demand_adjustment=0.95,           # Ignored, kept for compat
        dividend_payout_ratio=0.30,
        years_forward=30,
        base_year=2025,
        ramp_years=20,
        revenue_growth_rate=0.04,
        investor_model_adoption=0.70,     # 70% of displaced workers invest
        supply_chain_cost_pct=0.15,       # 15% non-labor cost reduction
    ),
    "moderate": ScenarioParams(
        labor_reduction_pct=0.50,
        ai_cost_per_worker_year=60_000,
        ai_cost_decline_rate=0.20,
        margin_retention_pct=0.50,
        demand_adjustment=0.90,
        dividend_payout_ratio=0.40,
        years_forward=30,
        base_year=2025,
        ramp_years=15,
        revenue_growth_rate=0.04,
        investor_model_adoption=0.70,
        supply_chain_cost_pct=0.25,       # 25% non-labor cost reduction
    ),
    "aggressive": ScenarioParams(
        labor_reduction_pct=0.75,
        ai_cost_per_worker_year=40_000,
        ai_cost_decline_rate=0.25,
        margin_retention_pct=0.40,
        demand_adjustment=0.85,
        dividend_payout_ratio=0.50,
        years_forward=30,
        base_year=2025,
        ramp_years=10,
        revenue_growth_rate=0.03,
        investor_model_adoption=0.70,
        supply_chain_cost_pct=0.40,       # 40% non-labor cost reduction
    ),
    "extreme": ScenarioParams(
        labor_reduction_pct=0.95,
        ai_cost_per_worker_year=30_000,
        ai_cost_decline_rate=0.30,
        margin_retention_pct=0.30,
        demand_adjustment=0.80,
        dividend_payout_ratio=0.60,
        years_forward=30,
        base_year=2025,
        ramp_years=8,
        revenue_growth_rate=0.02,
        investor_model_adoption=0.70,
        supply_chain_cost_pct=0.60,       # 60% non-labor cost reduction
    ),
}


def make_dystopia_variant(params: ScenarioParams) -> ScenarioParams:
    """
    Create a 'no investor model' variant of a scenario.

    Same labor displacement, but nobody has replacement income.
    Demand collapses to the essentials floor.
    """
    from dataclasses import replace
    return replace(params, investor_model_adoption=0.0)
