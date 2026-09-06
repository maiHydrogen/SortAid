"""Sanity-checks scraped scholarship records before they're written to
MongoDB. A source's HTML changing under a scraper tends to show up as
records full of "N/A"/empty fields rather than an exception — this catches
that instead of silently filling the database with garbage.
"""
import logging

REQUIRED_FIELDS = ("title", "source", "amount", "deadline", "applicationLink")
PLACEHOLDER_VALUES = {"", "n/a", "na", "none", "null"}


def validate_scholarship(record):
    """Returns a list of problems with `record` (empty list = valid)."""
    problems = []
    for field in REQUIRED_FIELDS:
        value = record.get(field)
        if value is None or str(value).strip().lower() in PLACEHOLDER_VALUES:
            problems.append(f"missing/placeholder '{field}'")
    return problems


def check_failure_rate(source_name, valid_count, invalid_count, threshold=0.5):
    """Logs a loud error when more than `threshold` of a run's records failed
    validation — that ratio is the signature of broken selectors, not just a
    few odd listings."""
    total = valid_count + invalid_count
    if total and (invalid_count / total) > threshold:
        logging.error(
            f"[{source_name}] {invalid_count}/{total} scraped records failed validation "
            f"({invalid_count / total:.0%}) — the site's markup may have changed; check selectors."
        )
