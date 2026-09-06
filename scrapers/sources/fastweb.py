"""Scraper for https://www.fastweb.com/directory/scholarships-by-major"""
import logging
import time
from datetime import datetime
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from scrapers.base import build_session
from scrapers.parsing_utils import parse_amount, parse_deadline
from scrapers.validation import check_failure_rate, validate_scholarship

BASE_URL = "https://www.fastweb.com/directory/scholarships-by-major"
BASE_DOMAIN = "https://www.fastweb.com"


def scrape_majors_directory(session, base_url):
    try:
        response = session.get(base_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        majors = []
        for parent_ul in soup.find_all("ul", class_="no-bullet parent-ul"):
            for parent_li in parent_ul.find_all("li", class_="parent-li", recursive=False):
                parent_a = parent_li.find("a")
                if parent_a:
                    majors.append((parent_a.text.strip(), parent_a["href"]))

                child_ul = parent_li.find_next_sibling("ul", class_="no-bullet child-ul")
                if child_ul:
                    for child_li in child_ul.find_all("li", class_="child-li"):
                        child_a = child_li.find("a")
                        if child_a:
                            majors.append((child_a.text.strip(), child_a["href"]))

        logging.info(f"Found {len(majors)} academic majors")
        return majors
    except Exception as e:
        logging.error(f"Failed to scrape majors directory: {e}")
        return []


def scrape_scholarship_list(session, major_name, major_url):
    try:
        response = session.get(major_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        scholarships = []
        table = soup.find("table", class_="scholarship_table scholarship_list")
        if not table:
            logging.warning(f"No scholarship table found for major: {major_name}")
            return scholarships

        for entry in table.find_all("tbody", class_="scholarship_wrap"):
            title_row = entry.find("tr", class_="hide-for-small-only")
            if not title_row:
                continue
            title_cell = title_row.find("td", class_="title")
            title_tag = title_cell.find("h3") if title_cell else None
            link = title_tag.find("a") if title_tag else None
            if link:
                scholarships.append((link.text.strip(), urljoin(BASE_DOMAIN, link["href"])))

        logging.info(f"Found {len(scholarships)} scholarships for major: {major_name}")
        return scholarships
    except Exception as e:
        logging.error(f"Failed to scrape scholarship list for {major_name}: {e}")
        return []


def scrape_scholarship_details(session, scholarship_title, scholarship_url):
    try:
        response = session.get(scholarship_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        source_tag = soup.find("p", class_="award-provider")
        source = source_tag.text.strip() if source_tag else "N/A"

        amount_wrapper = soup.find("div", class_="award-amount-wrapper")
        amount_tag = amount_wrapper.find("p", class_="award-info") if amount_wrapper else None
        amount = amount_tag.text.strip() if amount_tag else "N/A"

        deadline_wrapper = soup.find("div", class_="award-deadline-wrapper")
        deadline_tag = deadline_wrapper.find("p", class_="award-info") if deadline_wrapper else None
        deadline = deadline_tag.text.strip() if deadline_tag else "N/A"

        eligibility = {"course": "Not specified", "gpa": None, "location": "US"}
        description_tag = soup.find("p", class_="award-description")
        if description_tag:
            description = description_tag.text.strip()
            if "pursuing studies in" in description.lower():
                start = description.lower().find("pursuing studies in") + len("pursuing studies in")
                end = description.find(".", start)
                if end == -1:
                    end = len(description)
                eligibility["course"] = description[start:end].strip()
            if "gpa of" in description.lower():
                gpa_start = description.lower().find("gpa of") + len("gpa of")
                gpa_end = description.find(" ", gpa_start)
                if gpa_end == -1:
                    gpa_end = len(description)
                try:
                    eligibility["gpa"] = float(description[gpa_start:gpa_end].strip())
                except ValueError:
                    pass
            if "Post-9/11 GI Bill" in description or "Fry Scholarship" in description:
                eligibility["location"] = "U.S."

        return {
            "title": scholarship_title,
            "source": source,
            "amount": amount,
            "amountValue": parse_amount(amount),
            "eligibility": eligibility,
            "deadline": deadline,
            "deadlineDate": parse_deadline(deadline),
            "applicationLink": scholarship_url,
            "scrapedAt": datetime.now(),
        }
    except Exception as e:
        logging.error(f"Failed to scrape details for {scholarship_title}: {e}")
        return None


def run(collection, force_full_scrape=False):
    """force_full_scrape is accepted for CLI-uniformity but unused — this
    source doesn't support resuming."""
    session = build_session()
    all_scholarships = []
    valid_count = invalid_count = 0

    majors = scrape_majors_directory(session, BASE_URL)
    if not majors:
        logging.warning("No majors found. Exiting.")
        return all_scholarships

    for major_name, major_url in majors:
        scholarships = scrape_scholarship_list(session, major_name, major_url)
        for title, url in scholarships:
            scholarship = scrape_scholarship_details(session, title, url)
            problems = validate_scholarship(scholarship) if scholarship else ["scrape failed"]

            if not problems:
                valid_count += 1
                all_scholarships.append(scholarship)
                try:
                    collection.insert_one(scholarship)
                    logging.info(f"Inserted scholarship: {title}")
                except Exception as e:
                    logging.error(f"Error inserting scholarship {title}: {e}")
            else:
                invalid_count += 1
                logging.warning(f"[fastweb] Rejected '{title}': {', '.join(problems)}")

            time.sleep(1)
        time.sleep(2)

    check_failure_rate("fastweb", valid_count, invalid_count)
    return all_scholarships
