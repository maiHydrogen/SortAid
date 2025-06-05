import requests
from bs4 import BeautifulSoup
import logging
import time
from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os
from urllib.parse import urljoin
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import math

# Load environment variables from .env file located in the parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend\.env')
if not os.path.exists(env_path):
    logging.error(f".env file not found at {env_path}")
    raise FileNotFoundError(f".env file not found at {env_path}")

load_dotenv(env_path)

# Set up logging
logging.basicConfig(filename='scraping.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# MongoDB Atlas connection setup
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logging.error("MONGODB_URI not found in .env file")
    raise ValueError("MONGODB_URI not found in .env file")

logging.info(f"Using MongoDB URI: {MONGODB_URI[:50]}... (masked for security)")

try:
    client = MongoClient(MONGODB_URI)
    db = client['SortAid']
    collection = db['scholarships']
    progress_collection = db['scrape_progress_internationalscholarships']  # Separate progress collection
    logging.info("Connected to MongoDB Atlas") # Separate progress collection
except ConnectionFailure as e:
    logging.error(f"Failed to connect to MongoDB: {e}")
    raise

# Base domain for constructing absolute URLs
BASE_DOMAIN = "https://www.internationalscholarships.com"

# Headers to mimic a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.internationalscholarships.com/",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

# Set up a session with retry logic
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))
session.headers.update(HEADERS)

# Function to get total number of pages
def get_total_pages(scholarship_list_url):
    try:
        response = session.get(scholarship_list_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Assumption: Look for pagination links (e.g., <ul class="pagination">)
        pagination = soup.find('ul', class_='pagination')
        if not pagination:
            logging.warning("No pagination found; assuming single page")
            return 1

        # Find the last page number
        page_links = pagination.find_all('a', href=True)
        last_page = 1
        for link in page_links:
            href = link['href']
            if 'page=' in href:
                try:
                    page_num = int(href.split('page=')[-1])
                    last_page = max(last_page, page_num)
                except ValueError:
                    continue

        logging.info(f"Total pages found: {last_page}")
        return last_page
    except (requests.RequestException, ValueError) as e:
        logging.error(f"Failed to determine total pages: {e}")
        return 1

# Function to scrape the scholarship list page
def scrape_scholarship_list(list_url):
    try:
        response = session.get(list_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        scholarships = []  # List of tuples: (scholarship_title, scholarship_url)

        # Assumption: Scholarships are in a table or list
        # Try finding a table first
        scholarship_table = soup.find('table')
        if scholarship_table:
            rows = scholarship_table.find_all('tr')
            for row in rows:
                title_cell = row.find('td')
                if not title_cell:
                    continue
                title_link = title_cell.find('a', href=True)
                if not title_link:
                    continue
                scholarship_title = title_link.text.strip()
                relative_url = title_link['href']
                scholarship_url = urljoin(BASE_DOMAIN, relative_url)
                scholarships.append((scholarship_title, scholarship_url))
        else:
            # Try finding a list
            scholarship_list = soup.find('ul', class_='scholarship-list') or soup.find('ol')
            if scholarship_list:
                items = scholarship_list.find_all('li')
                for item in items:
                    title_link = item.find('a', href=True)
                    if not title_link:
                        continue
                    scholarship_title = title_link.text.strip()
                    relative_url = title_link['href']
                    scholarship_url = urljoin(BASE_DOMAIN, relative_url)
                    scholarships.append((scholarship_title, scholarship_url))
            else:
                logging.warning(f"No scholarship table or list found on page: {list_url}")

        logging.info(f"Extracted {len(scholarships)} scholarships from page: {list_url}")
        return scholarships
    except requests.RequestException as e:
        logging.error(f"Error scraping scholarship list from {list_url}: {e}")
        return []

# Function to scrape the scholarship details page
def scrape_scholarship_details(scholarship_title, scholarship_url):
    try:
        response = session.get(scholarship_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Validate the title
        title_tag = soup.find('h1', class_='title')
        if title_tag:
            page_title = title_tag.text.strip()
            if page_title != scholarship_title:
                logging.warning(f"Title mismatch on page {scholarship_url}: expected '{scholarship_title}', got '{page_title}'")
        else:
            logging.warning(f"Could not find title on page {scholarship_url}")

        # Extract source
        source_tag = soup.find('span', class_='author')
        source = source_tag.text.strip() if source_tag else 'N/A'

        # Extract amount and deadline from the award-restrictions table
        restrictions_table = soup.find('table', class_='award-restrictions')
        amount = 'N/A'
        deadline = 'N/A'
        host_countries = 'N/A'
        course_field = 'N/A'
        if restrictions_table:
            restriction_divs = restrictions_table.find_all('div', class_='clear')
            for div in restriction_divs:
                header = div.find('h4')
                if not header:
                    continue
                header_text = header.text.strip()
                value = div.find('p').text.strip() if div.find('p') else 'N/A'
                if header_text == 'Amount':
                    amount = value
                elif header_text == 'Deadline':
                    deadline = value
                elif header_text == 'You must be studying in one of the following countries':
                    host_countries = value
                elif header_text == 'You must be studying one of the following':
                    course_field = value

        # Extract eligibility details from description
        eligibility = {
            'course': course_field,
            'gpa': None,
            'location': host_countries
        }
        description_sections = soup.find_all('div', class_='award-description')
        description_text = ''
        for section in description_sections:
            paragraphs = section.find_all('p')
            for p in paragraphs:
                description_text += p.text.strip() + ' '

        if description_text:
            # Extract GPA (e.g., if present)
            if "gpa" in description_text.lower():
                gpa_start = description_text.lower().find("gpa of") + len("gpa of")
                gpa_end = description_text.find(" ", gpa_start)
                if gpa_end == -1:
                    gpa_end = len(description_text)
                try:
                    eligibility['gpa'] = float(description_text[gpa_start:gpa_end].strip())
                except ValueError as e:
                    logging.debug(f"Could not parse GPA for {scholarship_title}: {e}")

        # Construct the scholarship document
        scholarship = {
            'title': scholarship_title,
            'source': source,
            'amount': amount,
            'eligibility': eligibility,
            'deadline': deadline,
            'applicationLink': scholarship_url,
            'scrapedAt': datetime.now(timezone.utc)  # Use UTC time for consistency
        }

        logging.debug(f"Scraped scholarship details: {scholarship}")
        return scholarship
    except requests.RequestException as e:
        logging.error(f"Failed to scrape details for {scholarship_title}: {e}")
        return None

# Function to get the last processed scholarship
def get_last_processed_scholarship():
    last_processed = progress_collection.find_one(
        {'status': {'$in': ['completed', 'failed']}},
        sort=[('processed_at', -1)]
    )
    if last_processed:
        return last_processed['scholarship_title'], last_processed['scholarship_url'], last_processed['status']
    return None, None, None

# Function to mark a scholarship as processed
def mark_scholarship_processed(scholarship_title, scholarship_url, status):
    try:
        progress_collection.update_one(
            {'scholarship_title': scholarship_title, 'scholarship_url': scholarship_url},
            {
                '$set': {
                    'scholarship_title': scholarship_title,
                    'scholarship_url': scholarship_url,
                    'status': status,
                    'processed_at': datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
    except Exception as e:
        logging.error(f"Error updating progress for {scholarship_title}: {e}")

# Main function to orchestrate the scraping process
def scrape_internationalscholarships(base_url, force_full_scrape=False):
    all_scholarships = []

    # Step 1: Check the last processed scholarship unless forcing a full scrape
    if not force_full_scrape:
        last_scholarship_title, last_scholarship_url, last_status = get_last_processed_scholarship()
        logging.info(f"Last processed scholarship: {last_scholarship_title}, URL: {last_scholarship_url}, status: {last_status}")
    else:
        last_scholarship_title, last_scholarship_url, last_status = None, None, None
        logging.info("Forcing a full scrape: ignoring previous progress")

    # Step 2: Determine total pages
    total_pages = get_total_pages(base_url)
    if total_pages <= 0:
        logging.warning("No pages to scrape. Exiting.")
        return all_scholarships

    # Step 3: Scrape scholarships from each page
    start_processing = False if last_scholarship_title else True
    for page in range(1, total_pages + 1):
        page_url = f"{base_url}?page={page}"
        logging.info(f"Processing page {page}/{total_pages}: {page_url}")

        # Scrape the scholarship list for this page
        scholarships = scrape_scholarship_list(page_url)
        if not scholarships:
            logging.warning(f"No scholarships found on page {page}. Continuing to next page.")
            time.sleep(2)  # Reduced delay between pages
            continue

        # Process each scholarship
        for idx, (scholarship_title, scholarship_url) in enumerate(scholarships, 1):
            # Skip scholarships until we reach the last processed one
            if not start_processing:
                if scholarship_title == last_scholarship_title and scholarship_url == last_scholarship_url:
                    if last_status == 'completed':
                        logging.info(f"Skipping already processed scholarship: {scholarship_title} ({scholarship_url})")
                        continue
                    elif last_status == 'failed':
                        logging.info(f"Reprocessing failed scholarship: {scholarship_title} ({scholarship_url})")
                        start_processing = True
                else:
                    logging.info(f"Skipping already processed scholarship: {scholarship_title} ({scholarship_url})")
                    continue
            else:
                logging.info(f"Processing scholarship {idx}/{len(scholarships)} on page {page}: {scholarship_title}")

            # Scrape details for this scholarship
            scholarship = scrape_scholarship_details(scholarship_title, scholarship_url)
            if scholarship:
                all_scholarships.append(scholarship)

                # Insert into MongoDB incrementally using update_one to handle duplicates
                try:
                    result = collection.update_one(
                        {'title': scholarship['title'], 'source': scholarship['source']},
                        {'$set': scholarship},
                        upsert=True
                    )
                    if result.matched_count > 0:
                        logging.info(f"Updated scholarship: {scholarship_title}")
                    else:
                        logging.info(f"Inserted new scholarship: {scholarship_title}")
                    mark_scholarship_processed(scholarship_title, scholarship_url, 'completed')
                except Exception as e:
                    logging.error(f"Error inserting/updating scholarship {scholarship_title}: {e}")
                    mark_scholarship_processed(scholarship_title, scholarship_url, 'failed')
            else:
                logging.warning(f"Failed to scrape details for {scholarship_title}; marking as failed")
                mark_scholarship_processed(scholarship_title, scholarship_url, 'failed')

            # Rate limiting: 2-second delay between requests
            time.sleep(2)

        # Additional delay between pages to avoid overwhelming the server
        time.sleep(2)

    return all_scholarships

# Base URL of the InternationalScholarships page
base_url = "https://www.internationalscholarships.com/scholarships/"

# Scrape all scholarships and store in MongoDB
try:
    # Set force_full_scrape=True to reprocess all scholarships, or False to resume
    scholarship_data = scrape_internationalscholarships(base_url, force_full_scrape=False)
    logging.info(f"Scraped and stored {len(scholarship_data)} scholarships in total")
    print(f"Scraped and stored {len(scholarship_data)} scholarships in MongoDB")
finally:
    try:
        client.close()
        logging.info("MongoDB connection closed")
    except Exception as e:
        logging.error(f"Error closing MongoDB connection: {e}")