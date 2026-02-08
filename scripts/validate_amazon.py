#!/usr/bin/env python3
"""
End-to-end validation: pull Amazon financials from EDGAR, normalize, and display.

Amazon (AMZN) known data points for validation:
- 2024 revenue: ~$637.9B
- 2024 net income: ~$59.2B
- 2024 headcount: ~1,556,000 (reported in 10-K but NOT in XBRL)
- 2024 operating income: ~$68.6B
- 2024 SBC: ~$24.2B
- Amazon does NOT pay dividends
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ingestion.edgar import EdgarClient, KNOWN_CIKS
from src.normalization.normalize import normalize_facts, compute_derived_fields
from src.storage.db import get_connection, init_db, upsert_company, upsert_annual_financial


def format_billions(val: float | None) -> str:
    if val is None:
        return "N/A"
    return f"${val / 1e9:.1f}B"


def format_number(val: float | int | None) -> str:
    if val is None:
        return "N/A"
    return f"{val:,.0f}"


def main():
    cik = KNOWN_CIKS["AMZN"]
    print(f"Pulling Amazon financials from SEC EDGAR (CIK: {cik})...")
    print()

    with EdgarClient() as client:
        # Pull raw facts
        facts = client.extract_financials(cik, annual_only=True)
        print(f"Extracted {len(facts)} annual facts from EDGAR")

        # Show which concepts we found
        concepts_found = set(f.concept for f in facts)
        print(f"Concepts found: {sorted(concepts_found)}")
        print()

        # Normalize into yearly snapshots
        by_year = normalize_facts(facts)

        # Display results
        print("=" * 90)
        print(f"{'Year':<6} {'Revenue':>14} {'COGS':>14} {'OpIncome':>14} "
              f"{'NetIncome':>14} {'SBC':>14}")
        print("=" * 90)

        for year in sorted(by_year.keys()):
            data = compute_derived_fields(by_year[year])
            print(f"{year:<6} "
                  f"{format_billions(data.get('revenue')):>14} "
                  f"{format_billions(data.get('cost_of_revenue')):>14} "
                  f"{format_billions(data.get('operating_income')):>14} "
                  f"{format_billions(data.get('net_income')):>14} "
                  f"{format_billions(data.get('stock_based_comp')):>14}")

        print()
        print("-" * 90)
        print(f"{'Year':<6} {'G&A':>14} {'Marketing':>14} {'Shares(D)':>14} "
              f"{'Headcount':>14} {'Dividends':>14}")
        print("-" * 90)

        for year in sorted(by_year.keys()):
            data = by_year[year]
            shares = data.get("shares_outstanding_diluted")
            shares_str = format_number(shares) if shares else "N/A"
            print(f"{year:<6} "
                  f"{format_billions(data.get('general_and_admin')):>14} "
                  f"{format_billions(data.get('marketing')):>14} "
                  f"{shares_str:>14} "
                  f"{format_number(data.get('headcount')):>14} "
                  f"{format_billions(data.get('dividends_paid')):>14}")

        # Validate against known 2024 data points
        print()
        print("=" * 90)
        print("VALIDATION against known Amazon 2024 data:")
        print("=" * 90)
        data_2024 = by_year.get(2024, {})

        validations = [
            ("Revenue", data_2024.get("revenue"), 637.9e9, 5e9),
            ("Net Income", data_2024.get("net_income"), 59.2e9, 5e9),
            ("Operating Income", data_2024.get("operating_income"), 68.6e9, 5e9),
            ("SBC", data_2024.get("stock_based_comp"), 24.2e9, 3e9),
        ]

        all_pass = True
        for name, actual, expected, tolerance in validations:
            if actual is None:
                print(f"  {name}: MISSING")
                all_pass = False
                continue
            diff = abs(actual - expected)
            status = "PASS" if diff <= tolerance else "FAIL"
            if status == "FAIL":
                all_pass = False
            print(f"  {name}: {format_billions(actual)} "
                  f"(expected ~{format_billions(expected)}) [{status}]")

        # Check for missing critical fields
        missing = []
        if "headcount" not in concepts_found:
            missing.append("headcount (NOT in XBRL — need alternative source)")
        if "dividends_paid" not in concepts_found:
            missing.append("dividends_paid (Amazon doesn't pay dividends — OK)")
        if "sga" not in concepts_found:
            missing.append("sga (Amazon reports G&A + Marketing separately)")
        if "research_and_dev" not in concepts_found:
            missing.append("research_and_dev (Amazon calls it 'Technology & Content' — not standard XBRL)")

        if missing:
            print()
            print("Missing concepts (expected gaps):")
            for m in missing:
                print(f"  - {m}")

        # Store in SQLite
        print()
        print("Storing in SQLite...")
        conn = get_connection()
        init_db(conn)
        upsert_company(conn, cik, "AMZN", "Amazon.com Inc",
                        sector="Consumer Discretionary", industry="Internet Retail")

        for year in sorted(by_year.keys()):
            data = compute_derived_fields(by_year[year])
            upsert_annual_financial(
                conn, cik, year,
                revenue=data.get("revenue"),
                cost_of_revenue=data.get("cost_of_revenue"),
                operating_expenses=data.get("total_costs_and_expenses"),
                operating_income=data.get("operating_income"),
                net_income=data.get("net_income"),
                sga=data.get("sga"),
                research_and_dev=data.get("research_and_dev"),
                stock_based_comp=data.get("stock_based_comp"),
                dividends_paid=data.get("dividends_paid"),
                shares_outstanding=data.get("shares_outstanding_diluted"),
                headcount=data.get("headcount"),
                source="edgar",
            )

        conn.close()
        print("Done! Data stored in data/financials.db")

        if all_pass:
            print()
            print("ALL VALIDATIONS PASSED")
        else:
            print()
            print("SOME VALIDATIONS FAILED — check output above")


if __name__ == "__main__":
    main()
