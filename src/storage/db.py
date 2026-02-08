"""
SQLite storage for normalized financial data.

Schema designed for the scenario engine — each company has annual snapshots
with all the fields needed to model labor replacement scenarios.
"""

import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).parent.parent.parent / "data" / "financials.db"


def get_connection(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(conn: sqlite3.Connection):
    """Create tables if they don't exist."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS companies (
            cik TEXT PRIMARY KEY,
            ticker TEXT NOT NULL,
            name TEXT NOT NULL,
            sector TEXT,
            industry TEXT,
            sic_code TEXT
        );

        CREATE TABLE IF NOT EXISTS annual_financials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cik TEXT NOT NULL REFERENCES companies(cik),
            fiscal_year INTEGER NOT NULL,
            -- Core financials (USD)
            revenue REAL,
            cost_of_revenue REAL,
            operating_expenses REAL,
            operating_income REAL,
            net_income REAL,
            sga REAL,
            research_and_dev REAL,
            -- Labor-related
            headcount INTEGER,
            stock_based_comp REAL,
            estimated_labor_cost REAL,
            labor_cost_method TEXT,  -- 'reported', 'estimated', 'hybrid'
            -- Shareholder returns
            dividends_paid REAL,
            shares_outstanding REAL,
            -- Metadata
            data_quality TEXT,  -- 'high', 'medium', 'low'
            source TEXT DEFAULT 'edgar',
            UNIQUE(cik, fiscal_year)
        );

        CREATE TABLE IF NOT EXISTS labor_estimates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cik TEXT NOT NULL REFERENCES companies(cik),
            fiscal_year INTEGER NOT NULL,
            headcount INTEGER,
            avg_wage_estimate REAL,
            benefits_multiplier REAL,
            stock_based_comp REAL,
            total_labor_cost REAL,
            labor_pct_of_revenue REAL,
            labor_pct_of_opex REAL,
            method TEXT NOT NULL,  -- how we estimated
            confidence TEXT,  -- 'high', 'medium', 'low'
            UNIQUE(cik, fiscal_year)
        );

        CREATE INDEX IF NOT EXISTS idx_annual_cik_year
            ON annual_financials(cik, fiscal_year);
        CREATE INDEX IF NOT EXISTS idx_labor_cik_year
            ON labor_estimates(cik, fiscal_year);
    """)
    conn.commit()


def upsert_company(conn: sqlite3.Connection, cik: str, ticker: str, name: str,
                    sector: str | None = None, industry: str | None = None,
                    sic_code: str | None = None):
    conn.execute("""
        INSERT INTO companies (cik, ticker, name, sector, industry, sic_code)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(cik) DO UPDATE SET
            ticker=excluded.ticker,
            name=excluded.name,
            sector=COALESCE(excluded.sector, companies.sector),
            industry=COALESCE(excluded.industry, companies.industry),
            sic_code=COALESCE(excluded.sic_code, companies.sic_code)
    """, (cik, ticker, name, sector, industry, sic_code))
    conn.commit()


def upsert_annual_financial(conn: sqlite3.Connection, cik: str,
                            fiscal_year: int, **kwargs):
    # Build dynamic upsert from provided kwargs
    valid_cols = {
        "revenue", "cost_of_revenue", "operating_expenses", "operating_income",
        "net_income", "sga", "research_and_dev", "headcount",
        "stock_based_comp", "estimated_labor_cost", "labor_cost_method",
        "dividends_paid", "shares_outstanding", "data_quality", "source",
    }
    cols = {k: v for k, v in kwargs.items() if k in valid_cols}

    all_cols = ["cik", "fiscal_year"] + list(cols.keys())
    all_vals = [cik, fiscal_year] + list(cols.values())
    placeholders = ", ".join(["?"] * len(all_vals))
    col_names = ", ".join(all_cols)

    update_parts = [f"{k}=excluded.{k}" for k in cols.keys()]
    update_clause = ", ".join(update_parts)

    conn.execute(f"""
        INSERT INTO annual_financials ({col_names})
        VALUES ({placeholders})
        ON CONFLICT(cik, fiscal_year) DO UPDATE SET {update_clause}
    """, all_vals)
    conn.commit()
