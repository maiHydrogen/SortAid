from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import time
from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from pymongo.errors import ConnectionFailure, BulkWriteError

# Load environment variables from .env file located in the parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend\.env')
if not os.path.exists(env_path):
    logging.error(f".env file not found at {env_path}")
    raise FileNotFoundError(f".env file not found at {env_path}")
load_dotenv(env_path)

# Set up logging
logging.basicConfig(filename='scraping.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Connect to MongoDB Atlas
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logging.error("MONGODB_URI not found in .env file")
    raise ValueError("MONGODB_URI not found in .env file")

logging.info(f"Using MongoDB URI: {MONGODB_URI[:50]}... (masked for security)")

try:
    client = MongoClient(MONGODB_URI)
    db = client['SortAid']
    collection = db['scholarships']
    logging.info("Connected to MongoDB Atlas")
except ConnectionFailure as e:
    logging.error(f"Failed to connect to MongoDB: {e}")
    raise

# Headers to mimic a browser
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

# Base domain for constructing absolute URLs
BASE_DOMAIN = "https://www.fastweb.com"

# Function to scrape the academic majors directory page
def scrape_majors_directory(base_url):
    try:
        response = requests.get(base_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        majors = []  # List of tuples: (major_name, major_url)

        # Find all parent-ul lists
        parent_uls = soup.find_all('ul', class_='no-bullet parent-ul')
        for parent_ul in parent_uls:
            # Find all parent-li items (majors)
            parent_lis = parent_ul.find_all('li', class_='parent-li', recursive=False)
            for parent_li in parent_lis:
                # Extract parent major name and URL
                parent_a = parent_li.find('a')
                if parent_a:
                    major_name = parent_a.text.strip()
                    major_url = parent_a['href']
                    majors.append((major_name, major_url))

                # Check for subcategories (child-ul)
                child_ul = parent_li.find_next_sibling('ul', class_='no-bullet child-ul')
                if child_ul:
                    # Extract child majors
                    child_lis = child_ul.find_all('li', class_='child-li')
                    for child_li in child_lis:
                        child_a = child_li.find('a')
                        if child_a:
                            child_major_name = child_a.text.strip()
                            child_major_url = child_a['href']
                            majors.append((child_major_name, child_major_url))

        logging.info(f"Found {len(majors)} academic majors")
        return majors
    except requests.RequestException as e:
        logging.error(f"Failed to scrape majors directory: {e}")
        return []

# Function to scrape the scholarship list page for a given major
def scrape_scholarship_list(major_name, major_url):
    try:
        response = requests.get(major_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        scholarships = []  # List of tuples: (scholarship_title, scholarship_url)

        # Optional: Validate the major name from the page heading
        heading = soup.find('h2', class_='page-subheading')
        if heading:
            page_major = heading.text.strip()
            expected_heading = f"Scholarships for {major_name} Majors"
            if page_major != expected_heading:
                logging.warning(f"Major mismatch on page {major_url}: expected '{expected_heading}', got '{page_major}'")

        # Find the scholarship table
        scholarship_table = soup.find('table', class_='scholarship_table scholarship_list')
        if not scholarship_table:
            logging.warning(f"No scholarship table found for major: {major_name}")
            return scholarships

        # Find all scholarship entries (tbody with class scholarship_wrap)
        scholarship_entries = scholarship_table.find_all('tbody', class_='scholarship_wrap')
        for entry in scholarship_entries:
            # Focus on the desktop layout (hide-for-small-only)
            title_row = entry.find('tr', class_='hide-for-small-only')
            if not title_row:
                continue

            # Extract title and URL from the title cell
            title_cell = title_row.find('td', class_='title')
            if title_cell:
                title_tag = title_cell.find('h3')
                if title_tag and title_tag.find('a'):
                    scholarship_title = title_tag.find('a').text.strip()
                    relative_url = title_tag.find('a')['href']
                    # Construct absolute URL
                    scholarship_url = urljoin(BASE_DOMAIN, relative_url)
                    scholarships.append((scholarship_title, scholarship_url))

        logging.info(f"Found {len(scholarships)} scholarships for major: {major_name}")
        return scholarships
    except requests.RequestException as e:
        logging.error(f"Failed to scrape scholarship list for {major_name}: {e}")
        return []

# Function to scrape the scholarship details page
def scrape_scholarship_details(scholarship_title, scholarship_url):
    try:
        response = requests.get(scholarship_url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Validate the scholarship title
        title_tag = soup.find('h1', class_='award-name')
        if title_tag:
            page_title = title_tag.text.strip()
            if page_title != scholarship_title:
                logging.warning(f"Title mismatch on page {scholarship_url}: expected '{scholarship_title}', got '{page_title}'")

        # Extract source
        source_tag = soup.find('p', class_='award-provider')
        source = source_tag.text.strip() if source_tag else 'N/A'

        # Extract amount
        amount_wrapper = soup.find('div', class_='award-amount-wrapper')
        amount = amount_wrapper.find('p', class_='award-info').text.strip() if amount_wrapper and amount_wrapper.find('p', class_='award-info') else 'N/A'

        # Extract deadline
        deadline_wrapper = soup.find('div', class_='award-deadline-wrapper')
        deadline = deadline_wrapper.find('p', class_='award-info').text.strip() if deadline_wrapper and deadline_wrapper.find('p', class_='award-info') else 'N/A'

        # Extract eligibility details from description
        eligibility = {
            'course': 'Not specified',
            'gpa': "Not Specified",
            'location': 'US'
        }
        description_tag = soup.find('p', class_='award-description')
        if description_tag:
            description = description_tag.text.strip()
            # Extract course (e.g., "pursuing studies in STEM fields")
            if "pursuing studies in" in description.lower():
                start_idx = description.lower().find("pursuing studies in") + len("pursuing studies in")
                end_idx = description.find(".", start_idx)
                if end_idx == -1:
                    end_idx = len(description)
                course = description[start_idx:end_idx].strip()
                eligibility['course'] = course
            # Extract GPA (not present in this case)
            if "gpa" in description.lower():
                # Simple parsing for GPA, e.g., "minimum GPA of 3.0"
                gpa_start = description.lower().find("gpa of") + len("gpa of")
                gpa_end = description.find(" ", gpa_start)
                if gpa_end == -1:
                    gpa_end = len(description)
                try:
                    eligibility['gpa'] = float(description[gpa_start:gpa_end].strip())
                except ValueError:
                    pass
            # Extract location (inferred as U.S. due to GI Bill/Fry Scholarship)
            # Note: This is an assumption based on the context of the Post-9/11 GI Bill and Fry Scholarship,
            # which are U.S.-specific programs. If this inference isn't acceptable, set to 'N/A'.
            if "Post-9/11 GI Bill" in description or "Fry Scholarship" in description:
                eligibility['location'] = "U.S."

        # Construct the scholarship document
        scholarship = {
            'title': scholarship_title,
            'source': source,
            'amount': amount,
            'eligibility': eligibility,
            'deadline': deadline,
            'applicationLink': scholarship_url,
            'scrapedAt': datetime.now()
        }

        return scholarship
    except requests.RequestException as e:
        logging.error(f"Failed to scrape details for {scholarship_title}: {e}")
        return None

# Main function to orchestrate the scraping process
def scrape_fastweb_scholarships(base_url):
    all_scholarships = []

    # Step 1: Scrape the majors directory
    majors = scrape_majors_directory(base_url)
    if not majors:
        logging.warning("No majors found. Exiting.")
        return all_scholarships

    # Step 2: For each major, scrape the scholarship list
    for major_name, major_url in majors:
        scholarships = scrape_scholarship_list(major_name, major_url)
        if not scholarships:
            continue

        # Step 3: For each scholarship, scrape the details
        for scholarship_title, scholarship_url in scholarships:
            scholarship = scrape_scholarship_details(scholarship_title, scholarship_url)
            if scholarship:
                all_scholarships.append(scholarship)

                # Insert into MongoDB incrementally
                try:
                    collection.insert_one(scholarship)
                    logging.info(f"Inserted scholarship: {scholarship_title}")
                except Exception as e:
                    logging.error(f"Error inserting scholarship {scholarship_title}: {e}")

            # Rate limiting: 1-second delay between requests
            time.sleep(1)

        # Additional delay between majors to avoid overwhelming the server
        time.sleep(2)

    return all_scholarships

# Base URL of the Fastweb academic majors directory page
base_url = "https://www.fastweb.com/directory/scholarships-by-major"

# Scrape all scholarships and store in MongoDB
try:
    scholarship_data = scrape_fastweb_scholarships(base_url)
    logging.info(f"Scraped and stored {len(scholarship_data)} scholarships in total")
    print(f"Scraped and stored {len(scholarship_data)} scholarships in MongoDB")
finally:
    client.close()
    logging.info("MongoDB connection closed")