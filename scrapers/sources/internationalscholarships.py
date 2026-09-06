"""Scraper for https://www.internationalscholarships.com/scholarships/

Unlike the other sources, this one tracks progress in a separate Mongo
collection so a crashed/interrupted run can resume where it left off instead
of re-scraping everything (pass force_full_scrape=True to ignore that and
start over).
"""
import logging
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scrapers.base import build_session
from scrapers.parsing_utils import parse_amount, parse_deadline
from scrapers.validation import check_failure_rate, validate_scholarship

BASE_URL = "https://www.internationalscholarships.com/scholarships/"
BASE_DOMAIN = "https://www.internationalscholarships.com"


def get_total_pages(session, list_url):
    try:
        response = session.get(list_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        pagination = soup.find("ul", class_="pagination")
        if not pagination:
            logging.warning("No pagination found; assuming single page")
            return 1

        last_page = 1
        for link in pagination.find_all("a", href=True):
            if "page=" in link["href"]:
                try:
                    last_page = max(last_page, int(link["href"].split("page=")[-1]))
                except ValueError:
                    continue

        logging.info(f"Total pages found: {last_page}")
        return last_page
    except Exception as e:
        logging.error(f"Failed to determine total pages: {e}")
        return 1


def scrape_scholarship_list(session, list_url):
    try:
        response = session.get(list_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        scholarships = []
        table = soup.find("table")
        if table:
            rows = table.find_all("tr")
        else:
            container = soup.find("ul", class_="scholarship-list") or soup.find("ol")
            rows = container.find_all("li") if container else []

        for row in rows:
            title_link = row.find("a", href=True)
            if not title_link:
                continue
            scholarships.append((title_link.text.strip(), urljoin(BASE_DOMAIN, title_link["href"])))

        logging.info(f"Extracted {len(scholarships)} scholarships from page: {list_url}")
        return scholarships
    except Exception as e:
        logging.error(f"Error scraping scholarship list from {list_url}: {e}")
        return []


def scrape_scholarship_details(session, scholarship_title, scholarship_url):
    try:
        response = session.get(scholarship_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        source_tag = soup.find("span", class_="author")
        source = source_tag.text.strip() if source_tag else "N/A"

        amount, deadline, host_countries, course_field = "N/A", "N/A", "N/A", "N/A"
        restrictions_table = soup.find("table", class_="award-restrictions")
        if restrictions_table:
            for div in restrictions_table.find_all("div", class_="clear"):
                header = div.find("h4")
                if not header:
                    continue
                header_text = header.text.strip()
                value = div.find("p").text.strip() if div.find("p") else "N/A"
                if header_text == "Amount":
                    amount = value
                elif header_text == "Deadline":
                    deadline = value
                elif header_text == "You must be studying in one of the following countries":
                    host_countries = value
                elif header_text == "You must be studying one of the following":
                    course_field = value

        eligibility = {"course": course_field, "gpa": None, "location": host_countries}

        description_text = " ".join(
            p.text.strip()
            for section in soup.find_all("div", class_="award-description")
            for p in section.find_all("p")
        )
        if "gpa" in description_text.lower():
            gpa_start = description_text.lower().find("gpa of") + len("gpa of")
            gpa_end = description_text.find(" ", gpa_start)
            if gpa_end == -1:
                gpa_end = len(description_text)
            try:
                eligibility["gpa"] = float(description_text[gpa_start:gpa_end].strip())
            except ValueError:
                pass

        return {
            "title": scholarship_title,
            "source": source,
            "amount": amount,
            "amountValue": parse_amount(amount),
            "eligibility": eligibility,
            "deadline": deadline,
            "deadlineDate": parse_deadline(deadline),
            "applicationLink": scholarship_url,
            "scrapedAt": datetime.now(timezone.utc),
        }
    except Exception as e:
        logging.error(f"Failed to scrape details for {scholarship_title}: {e}")
        return None


def _get_last_processed(progress_collection):
    last = progress_collection.find_one(
        {"status": {"$in": ["completed", "failed"]}}, sort=[("processed_at", -1)]
    )
    if last:
        return last["scholarship_title"], last["scholarship_url"], last["status"]
    return None, None, None


def _mark_processed(progress_collection, title, url, status):
    try:
        progress_collection.update_one(
            {"scholarship_title": title, "scholarship_url": url},
            {"$set": {"scholarship_title": title, "scholarship_url": url, "status": status,
                      "processed_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
    except Exception as e:
        logging.error(f"Error updating progress for {title}: {e}")


def run(collection, force_full_scrape=False):
    session = build_session()
    progress_collection = collection.database["scrape_progress_internationalscholarships"]
    all_scholarships = []
    valid_count = invalid_count = 0

    if force_full_scrape:
        last_title, last_url, last_status = None, None, None
        logging.info("Forcing a full scrape: ignoring previous progress")
    else:
        last_title, last_url, last_status = _get_last_processed(progress_collection)
        logging.info(f"Last processed scholarship: {last_title}, URL: {last_url}, status: {last_status}")

    total_pages = get_total_pages(session, BASE_URL)
    if total_pages <= 0:
        logging.warning("No pages to scrape. Exiting.")
        return all_scholarships

    start_processing = not last_title
    for page in range(1, total_pages + 1):
        page_url = f"{BASE_URL}?page={page}"
        logging.info(f"Processing page {page}/{total_pages}: {page_url}")

        scholarships = scrape_scholarship_list(session, page_url)
        if not scholarships:
            logging.warning(f"No scholarships found on page {page}. Continuing to next page.")
            time.sleep(2)
            continue

        for title, url in scholarships:
            if not start_processing:
                if title == last_title and url == last_url:
                    if last_status == "completed":
                        continue
                    start_processing = True  # last one failed — retry it
                else:
                    continue

            scholarship = scrape_scholarship_details(session, title, url)
            problems = validate_scholarship(scholarship) if scholarship else ["scrape failed"]

            if not problems:
                valid_count += 1
                all_scholarships.append(scholarship)
                try:
                    collection.update_one(
                        {"title": scholarship["title"], "source": scholarship["source"]},
                        {"$set": scholarship},
                        upsert=True,
                    )
                    _mark_processed(progress_collection, title, url, "completed")
                except Exception as e:
                    logging.error(f"Error inserting/updating scholarship {title}: {e}")
                    _mark_processed(progress_collection, title, url, "failed")
            else:
                invalid_count += 1
                logging.warning(f"[internationalscholarships] Rejected '{title}': {', '.join(problems)}")
                _mark_processed(progress_collection, title, url, "failed")

            time.sleep(2)

        time.sleep(2)

    check_failure_rate("internationalscholarships", valid_count, invalid_count)
    return all_scholarships
