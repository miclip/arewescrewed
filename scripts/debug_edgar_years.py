#!/usr/bin/env python3
"""Debug the year mapping issue — look at raw EDGAR facts for Amazon revenue."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ingestion.edgar import EdgarClient, KNOWN_CIKS

cik = KNOWN_CIKS["AMZN"]
with EdgarClient() as client:
    facts = client.extract_financials(cik, annual_only=True)

    # Look at revenue facts specifically
    rev_facts = [f for f in facts if f.concept == "revenue"]
    print(f"Revenue facts: {len(rev_facts)}")
    print()
    print(f"{'fy':<6} {'fp':<6} {'period_start':<14} {'period_end':<14} "
          f"{'value':>16} {'xbrl_concept':<50} {'filed':<12}")
    print("-" * 120)
    for f in sorted(rev_facts, key=lambda x: (x.fiscal_year, x.period_end)):
        print(f"{f.fiscal_year:<6} {f.fiscal_period:<6} "
              f"{f.period_start or 'instant':<14} {f.period_end:<14} "
              f"{f.value:>16,.0f} {f.xbrl_concept:<50} {f.filed:<12}")
