"""Shared helpers for turning the free-text fields scraped off scholarship
pages ("$500", "May 1, 2025", "Varies") into normalized values the matching
API can filter/sort on directly, instead of re-parsing the display strings
on every request.
"""
import re

try:
    from dateutil import parser as date_parser
except ImportError:  # pragma: no cover - see requirement.txt
    date_parser = None


def parse_amount(text):
    """Extract a numeric dollar amount from strings like '$500', 'Up to
    $2,500', or 'Full tuition'. Returns None when no number is present."""
    if not text:
        return None
    match = re.search(r"[\d,]+(?:\.\d+)?", text)
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def parse_deadline(text):
    """Best-effort parse of a scraped deadline string into a datetime.
    Returns None when the text isn't a recognizable date (e.g. 'Rolling')."""
    if not text or date_parser is None:
        return None
    try:
        return date_parser.parse(text, fuzzy=True)
    except (ValueError, OverflowError, TypeError):
        return None
