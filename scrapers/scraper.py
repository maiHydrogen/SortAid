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

# Function to get the total number of pages
def get_total_pages(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        pagination = soup.find('ul', class_='pagination-items')
        if pagination:
            last_page = int(pagination.find_all('li')[-2].text)
            return last_page
        return 1
    except requests.RequestException as e:
        logging.error(f"Failed to get total pages: {e}")
        return 1

# Function to scrape scholarship data from a single page
def scrape_scholarships_from_page(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        scholarships = []
        scholarship_cards = soup.find_all('div', class_='re-scholarship-card-data-wrap')

        for card in scholarship_cards:
            scholarship = {}
            # Title and application link (from the <a> tag in the title)
            title_elem = card.find('h4', class_='re-verified_title').find('a')
            scholarship['title'] = title_elem.text.strip() if title_elem else 'N/A'
            scholarship['applicationLink'] = title_elem['href'] if title_elem and 'href' in title_elem.attrs else 'N/A'

            # Source (provider)
            provider_elem = card.find('div', class_='re-scholarship-card-mob_top').find('p')
            scholarship['source'] = provider_elem.text.strip() if provider_elem else 'N/A'

            # Amount
            award_elem = card.find('span', class_='re-scholarship-card-info-value')
            scholarship['amount'] = award_elem.text.strip() if award_elem else 'N/A'

            # Deadline
            deadline_elem = card.find_all('span', class_='re-scholarship-card-info-value')[1]
            scholarship['deadline'] = deadline_elem.text.strip() if deadline_elem else 'N/A'

            # Eligibility (inferred or default values)
            desc_elem = card.find('div', class_='re-scholarship-card-main-hidden').find('p')
            description = desc_elem.text.strip() if desc_elem else 'N/A'
            
            # Infer course and location from description if possible (basic approach)
            scholarship['eligibility'] = {
                'course': 'Any high school and College Course',  # Could parse description for keywords like "undergraduate", "graduate"
                'gpa': None,      # Not available in the data
                'location': 'US'  # parse description for location keywords
            }
            #application link
            scholarship['applicationLink'] = 'https://scholarships360.org/scholarships/search/'

            # Scraped timestamp
            scholarship['scrapedAt'] = datetime.now()

            scholarships.append(scholarship)

        return scholarships
    except requests.RequestException as e:
        logging.error(f"Failed to scrape {url}: {e}")
        return []

# Function to handle pagination and scrape all pages
def scrape_all_scholarships(base_url):
    all_scholarships = []
    total_pages = get_total_pages(base_url)
    logging.info(f"Total pages detected: {total_pages}")

    for page in range(1, total_pages + 1):
        page_url = f"{base_url}?page={page}" if page > 1 else base_url
        logging.info(f"Scraping page {page}...")
        scholarships = scrape_scholarships_from_page(page_url)
        all_scholarships.extend(scholarships)
        logging.info(f"Scraped {len(scholarships)} scholarships from page {page}")

        # Insert scholarships into MongoDB
        if scholarships:
            try:
                collection.insert_many(scholarships, ordered=False)
                logging.info(f"Inserted {len(scholarships)} scholarships into MongoDB from page {page}")
            except BulkWriteError as e:
                logging.error(f"Error inserting scholarships from page {page}: {e}")

        # Add a 1-second delay to be polite to the server
        time.sleep(1)

    return all_scholarships

# Base URL of the page to scrape
base_url = "https://scholarships360.org/scholarships/search/"

# Scrape all scholarships and store in MongoDB
try:
    scholarship_data = scrape_all_scholarships(base_url)
    logging.info(f"Scraped and stored {len(scholarship_data)} scholarships in total")
    print(f"Scraped and stored {len(scholarship_data)} scholarships in MongoDB")
finally:
    client.close()
    logging.info("MongoDB connection closed")