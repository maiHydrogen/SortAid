import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import time
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Connect to MongoDB Atlas (replace with your credentials)
client = MongoClient("mongodb+srv://himanshu011raj:TzKbVSIJ9vYAEMTF@cluster0.ibr2mwi.mongodb.net/SortAid?retryWrites=true&w=majority&appName=Cluster0")
db = client["SortAid"]
scholarships_collection = db["scholarships"]

# Headers to mimic a browser
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

# Standardize the data format
def normalize_data(title, amount, eligibility, deadline, link, source):
    return {
        "title": title.strip(),
        "source": source,
        "amount": amount.strip() if amount else "Not specified",
        "eligibility": eligibility if eligibility else {"course": "Engineering", "gpa": 2.0, "location": "Any"},  # Default for now
        "deadline": deadline.strip() if deadline else "Not specified",
        "applicationLink": link,
        "scrapedAt": datetime.utcnow()
    }

# Parse eligibility from the detail page
def scrape_eligibility(detail_url):
    eligibility = {"course": "Engineering", "gpa": 2.0, "location": "Any"}
    try:
        response = requests.get(detail_url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Placeholder selector for eligibility - we'll update this once we have the detail page HTML
        eligibility_section = soup.select_one("div.eligibility, p.eligibility, div#scholarship-details")
        if eligibility_section:
            eligibility_text = eligibility_section.text
            if "GPA" in eligibility_text:
                gpa_str = eligibility_text.split("GPA:")[1].split(",")[0].strip()
                eligibility["gpa"] = float(gpa_str) if gpa_str.replace('.', '', 1).isdigit() else 2.0
            if "Location:" in eligibility_text:
                location = eligibility_text.split("Location:")[1].split(",")[0].strip()
                eligibility["location"] = location if location else "Any"
        return eligibility
    except Exception as e:
        logging.error(f"Error scraping eligibility from {detail_url}: {e}")
        return eligibility

# Scrape Scholarships.com
def scrape_scholarships_com():
    base_url = "https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory/academic-major/engineering"
    scholarships = []
    page = 1
    max_pages = 3  # Limit to 3 pages for now

    while page <= max_pages:
        url = f"{base_url}?sortOrder=title&sortDirection=asc&page={page}"
        logging.info(f"Scraping page {page}: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            logging.error(f"Failed to fetch page {page}: {e}")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        scholarship_rows = soup.select("table#award-grid tbody tr")

        if not scholarship_rows:
            logging.warning("No scholarships found on this page. Selector might be wrong.")
            break

        for row in scholarship_rows:
            try:
                title_elem = row.select_one("td a.blacklink")
                title = title_elem.text.strip() if title_elem else "Unknown"
                link = title_elem["href"] if title_elem else ""
                if link and not link.startswith("http"):
                    link = "https://www.scholarships.com" + link

                amount_elem = row.select_one("td span")
                amount = amount_elem.text.strip() if amount_elem else "Not specified"

                deadline_elem = row.find("td", string=lambda text: text and "Due Date:" in text)
                deadline = deadline_elem.text.replace("Due Date:", "").strip() if deadline_elem else "Not specified"

                # Scrape eligibility from the detail page
                eligibility = scrape_eligibility(link) if link else None

                scholarship = normalize_data(title, amount, eligibility, deadline, link, "Scholarships.com")
                scholarships.append(scholarship)
                logging.info(f"Scraped scholarship: {title}")
                time.sleep(1)
            except Exception as e:
                logging.error(f"Error scraping scholarship: {e}")
                continue

        # Check for pagination (placeholder - we'll update this once we have pagination HTML)
        next_page = soup.select_one("a.next-page")  # Placeholder selector
        if next_page and "href" in next_page.attrs:
            page += 1
        else:
            break
        time.sleep(2)

    return scholarships

# Main function
def main():
    print("Starting scraper for Scholarships.com...")
    all_scholarships = scrape_scholarships_com()
    if all_scholarships:
        scholarships_collection.insert_many(all_scholarships)
        print(f"Inserted {len(all_scholarships)} scholarships into MongoDB")
    else:
        print("No scholarships found")

if __name__ == "__main__":
    main()