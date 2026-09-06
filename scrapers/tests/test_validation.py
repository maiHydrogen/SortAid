import logging

from scrapers.validation import check_failure_rate, validate_scholarship

GOOD_RECORD = {
    "title": "Merit Award",
    "source": "Test U",
    "amount": "$500",
    "deadline": "2099-01-01",
    "applicationLink": "https://example.com",
}


def test_valid_record_has_no_problems():
    assert validate_scholarship(GOOD_RECORD) == []


def test_missing_field_is_reported():
    record = {**GOOD_RECORD, "title": ""}
    problems = validate_scholarship(record)
    assert len(problems) == 1
    assert "title" in problems[0]


def test_placeholder_values_are_treated_as_missing():
    record = {**GOOD_RECORD, "amount": "N/A", "deadline": "n/a"}
    problems = validate_scholarship(record)
    assert len(problems) == 2


def test_check_failure_rate_logs_error_over_threshold(caplog):
    with caplog.at_level(logging.ERROR):
        check_failure_rate("test-source", valid_count=1, invalid_count=9)
    assert any("test-source" in r.message for r in caplog.records)


def test_check_failure_rate_silent_under_threshold(caplog):
    with caplog.at_level(logging.ERROR):
        check_failure_rate("test-source", valid_count=9, invalid_count=1)
    assert not any(r.levelno == logging.ERROR for r in caplog.records)
