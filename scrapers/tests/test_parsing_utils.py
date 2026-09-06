from scrapers.parsing_utils import parse_amount, parse_deadline


def test_parse_amount_simple_dollar_string():
    assert parse_amount("$500") == 500.0


def test_parse_amount_with_commas_and_prefix_text():
    assert parse_amount("Up to $2,500") == 2500.0


def test_parse_amount_with_no_number_returns_none():
    assert parse_amount("Full tuition") is None


def test_parse_amount_handles_empty_and_none():
    assert parse_amount("") is None
    assert parse_amount(None) is None


def test_parse_deadline_recognizable_date():
    result = parse_deadline("May 1, 2025")
    assert result is not None
    assert (result.year, result.month, result.day) == (2025, 5, 1)


def test_parse_deadline_with_surrounding_text():
    result = parse_deadline("Deadline: March 15, 2026")
    assert result is not None
    assert (result.year, result.month, result.day) == (2026, 3, 15)


def test_parse_deadline_non_date_text_returns_none():
    assert parse_deadline("Rolling") is None


def test_parse_deadline_handles_empty_and_none():
    assert parse_deadline("") is None
    assert parse_deadline(None) is None
