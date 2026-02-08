"""
SEC EDGAR XBRL API client.

Pulls structured financial data from SEC EDGAR for any US public company.
Free API, no key required — just a User-Agent header with contact info.

Endpoints:
- Company facts: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
- Company concept: https://data.sec.gov/api/xbrl/companyconcept/CIK{cik}/{taxonomy}/{concept}.json
"""

import time
from dataclasses import dataclass

import httpx

BASE_URL = "https://data.sec.gov/api/xbrl"
USER_AGENT = "wearenotscrewed research@wearenotscrewed.com"

# XBRL concept names we care about, mapped to our internal names.
# Some companies use different concepts for the same thing — we try multiple.
CONCEPT_MAP: dict[str, list[str]] = {
    "revenue": [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
        "SalesRevenueNet",
        "SalesRevenueGoodsNet",
    ],
    "cost_of_revenue": [
        "CostOfGoodsAndServicesSold",
        "CostOfRevenue",
        "CostOfGoodsSold",
    ],
    "total_costs_and_expenses": [
        "CostsAndExpenses",
    ],
    "operating_expenses": [
        "OperatingExpenses",
    ],
    "operating_income": [
        "OperatingIncomeLoss",
    ],
    "net_income": [
        "NetIncomeLoss",
    ],
    "sga": [
        "SellingGeneralAndAdministrativeExpense",
    ],
    "general_and_admin": [
        "GeneralAndAdministrativeExpense",
    ],
    "marketing": [
        "MarketingExpense",
        "SellingAndMarketingExpense",
    ],
    "research_and_dev": [
        "ResearchAndDevelopmentExpense",
    ],
    "stock_based_comp": [
        "ShareBasedCompensation",
        "AllocatedShareBasedCompensationExpense",
    ],
    "headcount": [
        "EntityNumberOfEmployees",
    ],
    "dividends_paid": [
        "PaymentsOfDividends",
        "PaymentsOfDividendsCommonStock",
        "PaymentsOfOrdinaryDividends",
        "Dividends",
    ],
    "shares_outstanding_diluted": [
        "WeightedAverageNumberOfDilutedSharesOutstanding",
        "WeightedAverageNumberOfShareOutstandingBasicAndDiluted",
    ],
    "shares_outstanding": [
        "CommonStockSharesOutstanding",
    ],
    "depreciation_amortization": [
        "DepreciationDepletionAndAmortization",
        "DepreciationAndAmortization",
    ],
}

# Known CIKs for major companies (saves a lookup)
KNOWN_CIKS: dict[str, str] = {
    "AMZN": "0001018724",
    "AAPL": "0000320193",
    "MSFT": "0000789019",
    "GOOGL": "0001652044",
    "META": "0001326801",
    "NVDA": "0001045810",
    "TSLA": "0001318605",
    "JPM": "0000019617",
    "WMT": "0000104169",
    "UNH": "0000731766",
}


@dataclass
class FinancialFact:
    """A single financial data point from EDGAR."""
    concept: str         # Our internal name (e.g., "revenue")
    xbrl_concept: str    # Original XBRL concept name
    value: float
    unit: str            # "USD", "shares", "pure"
    period_end: str      # e.g., "2024-12-31"
    period_start: str | None  # None for instant facts (like headcount)
    form: str            # "10-K", "10-Q", etc.
    fiscal_year: int
    fiscal_period: str   # "FY", "Q1", "Q2", "Q3", "Q4"
    filed: str           # Filing date


class EdgarClient:
    """Client for SEC EDGAR XBRL API."""

    def __init__(self, user_agent: str = USER_AGENT):
        self._client = httpx.Client(
            base_url=BASE_URL,
            headers={"User-Agent": user_agent},
            timeout=30.0,
        )
        self._last_request_time = 0.0

    def _throttle(self):
        """SEC EDGAR asks for max 10 requests/second."""
        elapsed = time.time() - self._last_request_time
        if elapsed < 0.1:
            time.sleep(0.1 - elapsed)
        self._last_request_time = time.time()

    def get_company_facts(self, cik: str) -> dict:
        """Get all XBRL facts for a company."""
        self._throttle()
        cik_padded = cik.zfill(10)
        resp = self._client.get(f"/companyfacts/CIK{cik_padded}.json")
        resp.raise_for_status()
        return resp.json()

    def get_company_concept(self, cik: str, taxonomy: str, concept: str) -> dict:
        """Get a specific XBRL concept for a company."""
        self._throttle()
        cik_padded = cik.zfill(10)
        resp = self._client.get(
            f"/companyconcept/CIK{cik_padded}/{taxonomy}/{concept}.json"
        )
        resp.raise_for_status()
        return resp.json()

    def lookup_cik(self, ticker: str) -> str | None:
        """Look up CIK by ticker symbol."""
        if ticker.upper() in KNOWN_CIKS:
            return KNOWN_CIKS[ticker.upper()]
        self._throttle()
        resp = self._client.get(
            "https://efts.sec.gov/LATEST/search-index?q="
            f'"{ticker}"&dateRange=custom&startdt=2024-01-01',
            headers={"User-Agent": USER_AGENT},
        )
        # Fallback: use the company tickers file
        return self._lookup_cik_from_tickers(ticker)

    def _lookup_cik_from_tickers(self, ticker: str) -> str | None:
        """Look up CIK from SEC's company tickers JSON."""
        self._throttle()
        resp = httpx.get(
            "https://www.sec.gov/files/company_tickers.json",
            headers={"User-Agent": USER_AGENT},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()
        for entry in data.values():
            if entry.get("ticker", "").upper() == ticker.upper():
                return str(entry["cik_str"]).zfill(10)
        return None

    def extract_financials(
        self, cik: str, annual_only: bool = True
    ) -> list[FinancialFact]:
        """
        Extract all financial facts we care about for a company.

        Returns a list of FinancialFact objects, filtered to 10-K (annual)
        filings by default.
        """
        raw = self.get_company_facts(cik)
        facts: list[FinancialFact] = []

        # EDGAR organizes by taxonomy (us-gaap, dei, etc.)
        for taxonomy_key, concepts in raw.get("facts", {}).items():
            # Normalize taxonomy name (e.g., "us-gaap" -> "us-gaap")
            taxonomy = taxonomy_key

            for xbrl_concept, concept_data in concepts.items():
                # Check if this concept maps to one we care about
                our_name = self._resolve_concept_name(xbrl_concept)
                if our_name is None:
                    continue

                # Extract facts from each unit type
                for unit_key, unit_facts in concept_data.get("units", {}).items():
                    for fact in unit_facts:
                        form = fact.get("form", "")
                        if annual_only and form != "10-K":
                            continue

                        fp = fact.get("fp", "")
                        # For 10-K, we want full year (FY) not quarterly
                        if annual_only and fp not in ("FY", "CY"):
                            # Some facts in 10-K don't have fp=FY,
                            # they might be instant values like headcount
                            if "start" in fact:
                                continue

                        facts.append(FinancialFact(
                            concept=our_name,
                            xbrl_concept=xbrl_concept,
                            value=fact.get("val", 0),
                            unit=unit_key,
                            period_end=fact.get("end", ""),
                            period_start=fact.get("start"),
                            form=form,
                            fiscal_year=fact.get("fy", 0),
                            fiscal_period=fp,
                            filed=fact.get("filed", ""),
                        ))

        return facts

    def _resolve_concept_name(self, xbrl_concept: str) -> str | None:
        """Map an XBRL concept name to our internal name."""
        for our_name, candidates in CONCEPT_MAP.items():
            if xbrl_concept in candidates:
                return our_name
        return None

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
