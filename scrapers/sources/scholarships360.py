"""Scraper for https://scholarships360.org/scholarships/search/"""
import logging
import time
from datetime import datetime

from bs4 import BeautifulSoup
from pymongo.errors import BulkWriteError

from scrapers.base import build_session
from scrapers.parsing_utils import parse_amount, parse_deadline
from scrapers.validation import check_failure_rate, validate_scholarship

BASE_URL = "https://scholarships360.org/scholarships/search/"


def get_total_pages(session, url):
    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        pagination = soup.find("ul", class_="pagination-items")
        if pagination:
            return int(pagination.find_all("li")[-2].text)
        return 1
    except Exception as e:
        logging.error(f"Failed to get total pages: {e}")
        return 1


def scrape_page(session, url):
    try:
        response = session.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        scholarships = []
        for card in soup.find_all("div", class_="re-scholarship-card-data-wrap"):
            title_elem = card.find("h4", class_="re-verified_title")
            title_elem = title_elem.find("a") if title_elem else None
            title = title_elem.text.strip() if title_elem else "N/A"

            provider_wrap = card.find("div", class_="re-scholarship-card-mob_top")
            provider_elem = provider_wrap.find("p") if provider_wrap else None
            source = provider_elem.text.strip() if provider_elem else "N/A"

            info_values = card.find_all("span", class_="re-scholarship-card-info-value")
            amount = info_values[0].text.strip() if len(info_values) > 0 else "N/A"
            deadline = info_values[1].text.strip() if len(info_values) > 1 else "N/A"

            scholarships.append(
                {
                    "title": title,
                    "source": source,
                    "amount": amount,
                    "amountValue": parse_amount(amount),
                    "deadline": deadline,
                    "deadlineDate": parse_deadline(deadline),
                    "eligibility": {
                        "course": "Any high school and College Course",
                        "gpa": None,
                        "location": "US",
                    },
                    "applicationLink": "https://scholarships360.org/scholarships/search/",
                    "scrapedAt": datetime.now(),
                }
            )

        return scholarships
    except Exception as e:
        logging.error(f"Failed to scrape {url}: {e}")
        return []


def run(collection, force_full_scrape=False):
    """force_full_scrape is accepted for CLI-uniformity but unused here —
    this source doesn't support resuming (unlike internationalscholarships)."""
    session = build_session()
    all_scholarships = []
    valid_count = invalid_count = 0

    total_pages = get_total_pages(session, BASE_URL)
    logging.info(f"Total pages detected: {total_pages}")

    for page in range(1, total_pages + 1):
        page_url = f"{BASE_URL}?page={page}" if page > 1 else BASE_URL
        logging.info(f"Scraping page {page}...")
        scraped = scrape_page(session, page_url)

        page_valid = []
        for record in scraped:
            problems = validate_scholarship(record)
            if problems:
                invalid_count += 1
                logging.warning(f"[scholarships360] Rejected '{record.get('title', '?')}': {', '.join(problems)}")
            else:
                valid_count += 1
                page_valid.append(record)

        all_scholarships.extend(page_valid)
        logging.info(f"Scraped {len(page_valid)}/{len(scraped)} valid scholarships from page {page}")

        if page_valid:
            try:
                collection.insert_many(page_valid, ordered=False)
                logging.info(f"Inserted {len(page_valid)} scholarships from page {page}")
            except BulkWriteError as e:
                logging.error(f"Error inserting scholarships from page {page}: {e}")

        time.sleep(1)

    check_failure_rate("scholarships360", valid_count, invalid_count)
    return all_scholarships
