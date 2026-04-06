"""
bank_parser.py — The Hype Campaign Tracker
===========================================
Parses Indian bank statement CSV and Excel files (SBI, ICICI, HDFC, Axis,
Kotak) into structured credit records. Handles metadata header rows, encoding
quirks, multiple column naming conventions, and Indian payment reference
formats.
"""

from __future__ import annotations

import hashlib
import io
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
import zipfile
import msoffcrypto
import pandas as pd

log = logging.getLogger(__name__)

class PasswordRequiredError(ValueError):
    """Raised when password protection is detected but no valid password was provided."""
    pass

# ─────────────────────────────────────────────────────────────────────────────
# Column name aliases — covers SBI, ICICI, HDFC, Axis, Kotak, Paytm Payments
# ─────────────────────────────────────────────────────────────────────────────

_DATE_ALIASES = {
    "date", "value date", "txn date", "transaction date",
    "posting date", "booking date", "trans date",
}

_DESC_ALIASES = {
    "description", "narration", "particulars", "details",
    "transaction details", "remarks", "transaction remarks",
    "transaction narration", "chq/ref no. or description",
}

_CREDIT_ALIASES = {
    "credit", "credit amount", "credits", "deposit",
    "deposit amount", "cr amount", "cr", "credit(inr)",
}

_DEBIT_ALIASES = {
    "debit", "debit amount", "debits", "withdrawal",
    "withdrawal amount", "dr amount", "dr", "debit(inr)",
}

_AMOUNT_ALIASES = {
    "amount",
}

# ─────────────────────────────────────────────────────────────────────────────
# Indian payment reference patterns
#   UTR  : 22-char alphanumeric  (NEFT / RTGS)
#   IMPS : 12-digit numeric
#   UPI  : starts with UPI + 10+ chars
# ─────────────────────────────────────────────────────────────────────────────

_REF_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b([A-Z]{4}\d{18})\b"),               # NEFT UTR  (22 chars)
    re.compile(r"\b(\d{12})\b"),                        # IMPS ref  (12 digits)
    re.compile(r"\b(UPI[A-Z0-9]{10,})\b"),              # UPI ref
    re.compile(r"\b([A-Z0-9]{15,22})\b"),               # Generic fallback
]

# ─────────────────────────────────────────────────────────────────────────────
# Data class for a parsed credit record
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CreditRecord:
    credit_date:  str
    amount:       float
    description:  str
    neft_ref:     str
    match_conf:   str = "UNMATCHED"
    raw_date:     str = ""
    extra:        dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "credit_date": self.credit_date,
            "amount":      self.amount,
            "description": self.description,
            "neft_ref":    self.neft_ref,
            "match_conf":  self.match_conf,
        }

# ─────────────────────────────────────────────────────────────────────────────
# ParseResult — carries records AND diagnostics
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ParseResult:
    records:      list[CreditRecord]
    total_rows:   int
    skipped_rows: int
    columns_used: dict[str, str]
    warnings:     list[str] = field(default_factory=list)

    @property
    def total_amount(self) -> float:
        return sum(r.amount for r in self.records)

    def to_dicts(self) -> list[dict[str, Any]]:
        return [r.to_dict() for r in self.records]

# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _load_dataframe(file_bytes: bytes, file_name: str | None = None, password: str | None = None) -> pd.DataFrame:
    """
    Attempt to read the statement as CSV or Excel, dealing with Zip and Encrypted formats.
    """
    file_name = (file_name or "").lower()

    # 1. Check if it's a ZIP file
    if file_name.endswith(".zip") or zipfile.is_zipfile(io.BytesIO(file_bytes)):
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                # Find the first valid csv/xlsx inside
                target_name = next((name for name in zf.namelist() if not name.startswith("__MACOSX/") and name.endswith((".csv", ".xlsx", ".xls"))), None)
                if not target_name:
                    raise ValueError("Found ZIP file, but no CSV or Excel file inside.")
                
                pwd_bytes = password.encode('utf-8') if password else None
                try:
                    file_bytes = zf.read(target_name, pwd=pwd_bytes)
                except RuntimeError as e:
                    if "password required" in str(e).lower() or "bad password" in str(e).lower():
                        raise PasswordRequiredError("ZIP file is encrypted.")
                    raise
                file_name = target_name.lower()
        except zipfile.BadZipFile:
            pass

    # 2. Check for MS Office Encryption
    try:
        office_file = msoffcrypto.OfficeFile(io.BytesIO(file_bytes))
        if office_file.is_encrypted():
            if not password:
                raise PasswordRequiredError("Excel file is password protected.")
            office_file.load_key(password=password)
            decrypted = io.BytesIO()
            office_file.decrypt(decrypted)
            file_bytes = decrypted.getvalue()
    except PasswordRequiredError:
        raise
    except Exception:
        # Not a recognizable encrypted MS Office file; proceed normally.
        pass

    if file_name.endswith((".xlsx", ".xlsm")):
        try:
            # We ignore header rows to find the correct table start
            raw = pd.read_excel(
                io.BytesIO(file_bytes),
                header=None,
                dtype=str,
                engine="openpyxl",
            )
            header_row = _find_header_row(raw)
            df = pd.read_excel(
                io.BytesIO(file_bytes),
                skiprows=header_row,
                dtype=str,
                engine="openpyxl",
            )
            df.columns = df.columns.str.strip()
            return df
        except Exception as exc:
            if "File is not a zip file" in str(exc) or "BadZipFile" in str(exc):
                # An encrypted excel without msoffcrypto loading properly might throw BadZipFile
                raise PasswordRequiredError("The file might be encrypted or corrupted.")
            raise ValueError(f"Could not read Excel statement: {exc}") from exc

    if file_name.endswith(".xls"):
        raise ValueError(".xls files are not supported natively unless decrypted. Please try CSV instead.")

    encodings = ("utf-8", "utf-8-sig", "latin-1", "cp1252")
    last_exc: Exception | None = None

    for enc in encodings:
        try:
            # First pass: read raw to detect metadata rows
            raw = pd.read_csv(
                io.BytesIO(file_bytes),
                header=None,
                encoding=enc,
                dtype=str,
                on_bad_lines="skip",
            )
            header_row = _find_header_row(raw)
            df = pd.read_csv(
                io.BytesIO(file_bytes),
                skiprows=header_row,
                encoding=enc,
                dtype=str,
                on_bad_lines="skip",
            )
            df.columns = df.columns.str.strip()
            return df
        except Exception as exc:
            last_exc = exc

    raise ValueError(f"Could not decode CSV with any known encoding: {last_exc}")


def _find_header_row(raw: pd.DataFrame) -> int:
    """
    Scan the first 15 rows to find which one contains recognised column headers.
    Returns the row index so pd.read_csv can use it via skiprows.
    """
    all_aliases = _DATE_ALIASES | _DESC_ALIASES | _CREDIT_ALIASES | _DEBIT_ALIASES | _AMOUNT_ALIASES
    for i, row in raw.head(15).iterrows():
        normalized = {str(v).strip().lower() for v in row.values if pd.notna(v)}
        if len(normalized & all_aliases) >= 2:
            return int(i)
    return 0  # Assume row 0 if nothing found


def _detect_column(df: pd.DataFrame, aliases: set[str]) -> str | None:
    """Return the first DataFrame column whose normalised name matches any alias."""
    for col in df.columns:
        if col.strip().lower() in aliases:
            return col
    return None


def _detect_columns(df: pd.DataFrame) -> dict[str, str | None]:
    """Detect all relevant columns; handle single-amount-column CSVs."""
    return {
        "date":   _detect_column(df, _DATE_ALIASES),
        "desc":   _detect_column(df, _DESC_ALIASES),
        "credit": _detect_column(df, _CREDIT_ALIASES),
        "debit":  _detect_column(df, _DEBIT_ALIASES),
        "amount": _detect_column(df, _AMOUNT_ALIASES),
    }


def _parse_amount(raw: str) -> float | None:
    """
    Clean and parse an amount string.
    Returns None for blank / NaN / non-numeric cells.
    """
    cleaned = re.sub(r"[₹,\s]", "", str(raw)).strip()
    if not cleaned or cleaned.lower() in ("nan", "-", "nil"):
        return None
    try:
        val = float(cleaned)
        return val if val > 0 else None
    except ValueError:
        return None


def _normalise_date(raw: str) -> str:
    """
    Attempt to parse common Indian bank date formats and return ISO 8601.
    Falls back to the original string if nothing matches.
    """
    raw = raw.strip()
    formats = (
        "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%d-%b-%Y",
        "%d/%m/%y", "%d-%m-%y", "%Y-%m-%d", "%d %B %Y",
        "%d-%b-%y", "%d/%b/%Y",
    )
    for fmt in formats:
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    log.debug("Unrecognised date format: %r — storing as-is", raw)
    return raw


def _extract_ref(description: str) -> str:
    """
    Extract the most specific payment reference from a narration string.
    Tries UTR → IMPS → UPI → generic alphanumeric → deterministic hash.
    """
    for pattern in _REF_PATTERNS:
        match = pattern.search(description.upper())
        if match:
            return match.group(1)
    # Deterministic fallback — same input always produces the same ref
    digest = hashlib.sha256(description.encode()).hexdigest()[:16].upper()
    return f"REF-{digest}"

# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def parse_bank_csv(
    file_bytes: bytes,
    file_name: str | None = None,
    filter_keyword: str = "THE HYP",
    min_amount: float = 0.01,
    password: str | None = None,
) -> list[dict[str, Any]]:
    """
    Parse a bank statement CSV or Excel file and return cleaned THE HYPE credit records.

    Args:
        file_bytes:     Raw bytes of the uploaded file.
        file_name:      Original filename used to detect CSV vs Excel.
        filter_keyword: Narration substring filter (case-insensitive).
                        Pass an empty string to return ALL credits.
        min_amount:     Credits below this value are ignored (default ₹0.01).

    Returns:
        List of dicts, each with keys:
            credit_date, amount, description, neft_ref, match_conf

    Raises:
        ValueError: If required columns cannot be detected.
        PasswordRequiredError: If the statement needs a password to decrypt.
    """
    result = _parse_bank_csv_internal(file_bytes, file_name, filter_keyword, min_amount, password)

    log.info(
        "Bank CSV parsed — %d credit records (₹%.2f total) | "
        "rows: %d total / %d skipped | columns: %s",
        len(result.records),
        result.total_amount,
        result.total_rows,
        result.skipped_rows,
        result.columns_used,
    )

    for warning in result.warnings:
        log.warning(warning)

    return result.to_dicts()


def _parse_bank_csv_internal(
    file_bytes: bytes,
    file_name: str | None,
    filter_keyword: str,
    min_amount: float,
    password: str | None,
) -> ParseResult:
    """Internal implementation — returns a rich ParseResult for diagnostics."""
    df = _load_dataframe(file_bytes, file_name, password=password)
    cols = _detect_columns(df)

    # Validate mandatory columns
    missing: list[str] = []
    if not cols["date"]:
        missing.append("date")
    if not cols["desc"]:
        missing.append("description")
    has_credit_col  = bool(cols["credit"])
    has_amount_col  = bool(cols["amount"])
    if not has_credit_col and not has_amount_col:
        missing.append("credit/amount")

    if missing:
        raise ValueError(
            f"Could not auto-detect required columns: {missing}. "
            f"Available columns: {list(df.columns)}"
        )

    columns_used = {k: v for k, v in cols.items() if v}
    records:  list[CreditRecord] = []
    skipped:  int = 0
    warnings: list[str] = []
    keyword   = filter_keyword.upper()

    for idx, row in df.iterrows():
        try:
            # ── 1. Raw description ────────────────────────────────────────
            desc = str(row[cols["desc"]]).strip()
            if not desc or desc.lower() == "nan":
                skipped += 1
                continue

            # ── 2. Keyword filter ─────────────────────────────────────────
            if keyword and keyword not in desc.upper():
                continue

            # ── 3. Resolve credit amount ──────────────────────────────────
            amount: float | None = None

            if has_credit_col:
                amount = _parse_amount(row[cols["credit"]])

            # Single-amount-column bank (signed or unsigned with separate debit col)
            if amount is None and has_amount_col:
                raw_amount = _parse_amount(row[cols["amount"]])
                if raw_amount is not None:
                    # If there's a debit column and it has a value, this row is a debit
                    if cols["debit"]:
                        raw_debit = _parse_amount(row[cols["debit"]])
                        if raw_debit is None:
                            amount = raw_amount   # debit cell is blank → this is a credit
                    else:
                        amount = raw_amount

            if amount is None or amount < min_amount:
                continue

            # ── 4. Date ───────────────────────────────────────────────────
            raw_date    = str(row[cols["date"]]).strip()
            parsed_date = _normalise_date(raw_date)
            if parsed_date == raw_date and parsed_date.lower() == "nan":
                skipped += 1
                continue

            # ── 5. Payment reference ──────────────────────────────────────
            neft_ref = _extract_ref(desc)

            records.append(CreditRecord(
                credit_date = parsed_date,
                amount      = amount,
                description = desc[:250],
                neft_ref    = neft_ref,
                raw_date    = raw_date,
            ))

        except Exception as exc:
            skipped += 1
            warnings.append(f"Row {idx} skipped: {exc}")
            log.debug("Row %d skipped: %s", idx, exc, exc_info=True)

    # Warn if zero records found but rows existed
    total_rows = len(df)
    if total_rows > 0 and not records and keyword:
        warnings.append(
            f"0 records matched filter '{filter_keyword}'. "
            f"Verify the keyword or check the description column content."
        )

    return ParseResult(
        records      = records,
        total_rows   = total_rows,
        skipped_rows = skipped,
        columns_used = columns_used,
        warnings     = warnings,
    )