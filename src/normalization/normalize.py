"""
Normalize raw EDGAR XBRL facts into our annual financial schema.

Handles:
- Deduplication (same concept reported multiple times across filings)
- Fiscal year alignment using period_end date (NOT the EDGAR fy field)
- Full-year vs quarterly filtering
- Picking the best value when multiple XBRL concepts map to the same field

Key insight: EDGAR's `fy` field is the FILING year, not the data year.
A 10-K filing includes 3 years of comparative data plus quarterly breakdowns.
We use the period_end date to determine the actual data year.
"""

from collections import defaultdict
from datetime import datetime

from src.ingestion.edgar import FinancialFact, CONCEPT_MAP


def normalize_facts(facts: list[FinancialFact]) -> dict[int, dict[str, float | int]]:
    """
    Convert a list of raw FinancialFacts into a dict keyed by actual data year.

    Uses period_end to determine the year, and filters for full-year duration
    facts (or instant facts for point-in-time values like headcount/shares).
    """
    # Step 1: Filter to full-year or instant facts, determine actual data year
    filtered: list[tuple[int, FinancialFact]] = []
    for fact in facts:
        data_year = _get_data_year(fact)
        if data_year is None:
            continue
        if not _is_full_year_or_instant(fact):
            continue
        filtered.append((data_year, fact))

    # Step 2: Group by (concept, data_year)
    grouped: dict[tuple[str, int], list[FinancialFact]] = defaultdict(list)
    for data_year, fact in filtered:
        key = (fact.concept, data_year)
        grouped[key].append(fact)

    # Step 3: For each group, pick the best value
    by_year: dict[int, dict[str, float | int]] = defaultdict(dict)
    for (concept, year), concept_facts in grouped.items():
        best = _pick_best_fact(concept, concept_facts)
        if best is not None:
            by_year[year][concept] = best.value

    return dict(by_year)


def _get_data_year(fact: FinancialFact) -> int | None:
    """Extract the actual data year from a fact's period_end date."""
    if not fact.period_end:
        return None
    try:
        end_date = datetime.strptime(fact.period_end, "%Y-%m-%d")
        return end_date.year
    except ValueError:
        return None


def _is_full_year_or_instant(fact: FinancialFact) -> bool:
    """
    Check if a fact represents a full year of data or an instant value.

    Full-year: period_start to period_end spans ~330-400 days.
    Instant: no period_start (point-in-time values like shares outstanding).
    """
    if fact.period_start is None:
        # Instant fact (e.g., shares outstanding at a point in time)
        return True

    try:
        start = datetime.strptime(fact.period_start, "%Y-%m-%d")
        end = datetime.strptime(fact.period_end, "%Y-%m-%d")
        days = (end - start).days
        # Full year is ~365 days; allow some slack for fiscal year oddities
        return 330 <= days <= 400
    except ValueError:
        return False


def _pick_best_fact(concept: str, facts: list[FinancialFact]) -> FinancialFact | None:
    """
    Pick the best fact from a list of candidates for the same concept+year.

    Prefer:
    1. The XBRL concept that appears first in our CONCEPT_MAP (higher priority)
    2. USD over other units (for financial facts)
    3. Most recently filed (latest data is most accurate)
    """
    if not facts:
        return None

    # Build priority map: lower index = higher priority
    concept_priority = {}
    for our_name, candidates in CONCEPT_MAP.items():
        if our_name == concept:
            for i, c in enumerate(candidates):
                concept_priority[c] = i
            break

    def sort_key(f: FinancialFact):
        xbrl_priority = concept_priority.get(f.xbrl_concept, 999)
        unit_score = 0 if f.unit in ("USD", "shares") else 1
        # Prefer most recently filed (negate for ascending sort)
        filed_score = f.filed if f.filed else ""
        return (xbrl_priority, unit_score, filed_score)

    # Sort ascending by priority, then descending by filed date
    sorted_facts = sorted(facts, key=lambda f: (
        concept_priority.get(f.xbrl_concept, 999),
        0 if f.unit in ("USD", "shares") else 1,
    ))

    # Among same-priority facts, prefer most recently filed
    if sorted_facts:
        best_priority = concept_priority.get(sorted_facts[0].xbrl_concept, 999)
        same_priority = [f for f in sorted_facts
                         if concept_priority.get(f.xbrl_concept, 999) == best_priority]
        return max(same_priority, key=lambda f: f.filed or "")

    return sorted_facts[0] if sorted_facts else None


def compute_derived_fields(year_data: dict[str, float | int]) -> dict[str, float | int]:
    """Compute fields that can be derived from others."""
    result = dict(year_data)

    # If we have revenue and total costs but no operating_income
    if "operating_income" not in result:
        if "revenue" in result and "total_costs_and_expenses" in result:
            result["operating_income"] = (
                result["revenue"] - result["total_costs_and_expenses"]
            )

    # Compute labor-adjacent cost (G&A + Marketing + SBC as a proxy)
    labor_proxies = ["general_and_admin", "marketing", "stock_based_comp"]
    known_labor = sum(result.get(k, 0) for k in labor_proxies)
    if known_labor > 0:
        result["known_labor_proxy"] = known_labor

    return result
