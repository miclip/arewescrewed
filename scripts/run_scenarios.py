#!/usr/bin/env python3
"""
Run labor replacement scenarios for Amazon and show the investor model.

This is the core output: what happens to Amazon's economics as AI replaces
human labor, and what does that mean for investor returns?
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ingestion.edgar import EdgarClient, KNOWN_CIKS
from src.normalization.normalize import normalize_facts, compute_derived_fields
from src.models.labor import estimate_amazon_labor
from src.models.scenario import run_scenario, SCENARIOS, ScenarioResult


def format_billions(val: float) -> str:
    if abs(val) >= 1e9:
        return f"${val / 1e9:.1f}B"
    if abs(val) >= 1e6:
        return f"${val / 1e6:.0f}M"
    return f"${val:,.0f}"


def print_scenario(result: ScenarioResult, name: str):
    print()
    print(f"{'=' * 100}")
    print(f"  SCENARIO: {name.upper()}")
    print(f"  Labor reduction: {result.params.labor_reduction_pct:.0%} | "
          f"AI cost/worker: ${result.params.ai_cost_per_worker_year:,.0f}/yr "
          f"(declining {result.params.ai_cost_decline_rate:.0%}/yr)")
    print(f"  Margin retention: {result.params.margin_retention_pct:.0%} | "
          f"Demand adjustment: {result.params.demand_adjustment:.0%} | "
          f"Dividend payout: {result.params.dividend_payout_ratio:.0%}")
    print(f"{'=' * 100}")
    print()

    print(f"  {'Year':<6} {'Headcount':>12} {'Labor Cost':>14} {'AI Cost':>14} "
          f"{'Net Savings':>14} {'New Profit':>14} {'Margin':>8} "
          f"{'Dividends':>14} {'Div/Share':>10}")
    print(f"  {'-' * 98}")

    for p in result.projections:
        print(f"  {p.year:<6} "
              f"{p.remaining_headcount:>12,} "
              f"{format_billions(p.new_labor_cost):>14} "
              f"{format_billions(p.ai_compute_cost):>14} "
              f"{format_billions(p.net_savings):>14} "
              f"{format_billions(p.new_profit):>14} "
              f"{p.profit_margin_new:>7.1f}% "
              f"{format_billions(p.dividends_total):>14} "
              f"{f'${p.dividend_per_share:.2f}':>10}")


def print_investor_model(results: dict[str, ScenarioResult]):
    """
    The punchline: how much do you need to invest to live on dividends?
    """
    print()
    print("=" * 100)
    print("  THE INVESTOR MODEL: What investment is needed to replace wage income?")
    print("=" * 100)
    print()

    target_incomes = [50_000, 75_000, 100_000, 150_000]

    for name, result in results.items():
        # Use year 5 projection (midpoint)
        p5 = result.projections[5]
        # Use year 10 projection (endpoint)
        p10 = result.projections[10]

        if p5.shares_outstanding == 0:
            continue

        # Current share price (approximate — in real model, we'd pull this)
        # Amazon ~$230 as of early 2026
        share_price = 230.0

        print(f"  --- {name.upper()} scenario ---")
        print(f"  Year 5 ({p5.year}): Dividend/share = ${p5.dividend_per_share:.2f}")
        print(f"  Year 10 ({p10.year}): Dividend/share = ${p10.dividend_per_share:.2f}")

        yield_5 = (p5.dividend_per_share / share_price * 100) if share_price else 0
        yield_10 = (p10.dividend_per_share / share_price * 100) if share_price else 0
        print(f"  Dividend yield at $230/share: Year 5 = {yield_5:.1f}%, Year 10 = {yield_10:.1f}%")
        print()

        print(f"  {'Target Income':>16} {'Shares Needed':>16} {'Investment @$230':>18} "
              f"{'Shares (Yr10)':>16} {'Investment (Yr10)':>18}")
        print(f"  {'-' * 86}")

        for income in target_incomes:
            shares_5 = (income / p5.dividend_per_share) if p5.dividend_per_share > 0 else float('inf')
            invest_5 = shares_5 * share_price
            shares_10 = (income / p10.dividend_per_share) if p10.dividend_per_share > 0 else float('inf')
            invest_10 = shares_10 * share_price

            if shares_5 == float('inf'):
                print(f"  ${income:>15,}   {'N/A (no div)':>16}")
            else:
                print(f"  ${income:>15,}   {shares_5:>14,.0f}   {format_billions(invest_5):>18} "
                      f"  {shares_10:>14,.0f}   {format_billions(invest_10):>18}")
        print()

    # Portfolio diversification note
    print("  NOTE: These figures are for Amazon alone. A diversified portfolio")
    print("  across the S&P 500 would spread risk and likely improve yield,")
    print("  as many S&P 500 companies already pay significant dividends.")
    print()
    print("  KEY INSIGHT: Even in conservative scenarios, AI-driven profit expansion")
    print("  could make dividend-based income viable with achievable investment levels.")
    print("  The question isn't IF this happens — it's how fast and whether we")
    print("  create the structures for broad participation before it does.")


def main():
    cik = KNOWN_CIKS["AMZN"]
    print("Pulling Amazon financials from SEC EDGAR...")

    with EdgarClient() as client:
        facts = client.extract_financials(cik, annual_only=True)
        by_year = normalize_facts(facts)

    # Use most recent full year as base
    base_year = max(by_year.keys())
    base_data = compute_derived_fields(by_year[base_year])
    print(f"Base year: {base_year}")
    print(f"  Revenue: {format_billions(base_data.get('revenue', 0))}")
    print(f"  Operating Income: {format_billions(base_data.get('operating_income', 0))}")

    # Get labor estimate
    labor = estimate_amazon_labor(base_year, base_data)
    if labor is None:
        print("ERROR: Could not estimate labor cost")
        sys.exit(1)

    print(f"  Estimated Total Labor Cost: {format_billions(labor.total_labor_cost)}")
    print(f"  Headcount: {labor.headcount:,}")
    print(f"  Labor as % of Revenue: {labor.labor_pct_of_revenue:.1f}%")

    # Run all scenarios
    results: dict[str, ScenarioResult] = {}
    for name, params in SCENARIOS.items():
        params.base_year = base_year
        result = run_scenario(params, "Amazon", base_data, labor)
        results[name] = result
        print_scenario(result, name)

    # Print the investor model
    print_investor_model(results)


if __name__ == "__main__":
    main()
