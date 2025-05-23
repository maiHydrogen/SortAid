import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import time
from datetime import datetime

# Connect to MongoDB Atlas
client = MongoClient("mongodb+srv://himanshu011raj:TzKbVSIJ9vYAEMTF@cluster0.ibr2mwi.mongodb.net/SortAid?retryWrites=true&w=majority&appName=Cluster0")
db = client["SortAid"]
scholarships_collection = db["scholarships"]

# Headers to mimic a browser
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def normalize_data(title, amount, eligibility, deadline, link, source):
    # Basic normalization (can be expanded based on actual data)
    return {
        "title": title.strip(),
        "source": source,
        "amount": amount.strip() if amount else "Not specified",
        "eligibility": eligibility,
        "deadline": deadline.strip() if deadline else "Not specified",
        "applicationLink": link,
        "scrapedAt": datetime.utcnow()
    }

def scrape_fastweb():
    url = "https://www.fastweb.com/college-scholarships"  # Adjust based on actual page
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    scholarships = []
    # Example: Adjust selectors based on Fastweb's actual HTML structure
    for item in soup.select("div.scholarship-item"):  # Placeholder selector
        title = item.select_one("h3").text if item.select_one("h3") else "Unknown"
        amount = item.select_one(".amount").text if item.select_one(".amount") else "Not specified"
        deadline = item.select_one(".deadline").text if item.select_one(".deadline") else "Not specified"
        link = item.select_one("a")["href"] if item.select_one("a") else url
        eligibility = {"course": "Any", "gpa": 2.0, "location": "USA"}  # Placeholder
        scholarship = normalize_data(title, amount, eligibility, deadline, link, "Fastweb")
        scholarships.append(scholarship)
        time.sleep(1)  # Delay to avoid rate-limiting
    return scholarships

def scrape_scholarships_com():
    url = "https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory/"  # Adjust based on actual page
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    scholarships = []
    # Example: Adjust selectors based on Scholarships.com's actual HTML structure
    for item in soup.select("tr.scholarship-row"):  # Placeholder selector
        title = item.select_one("a.scholarship-title").text if item.select_one("a.scholarship-title") else "Unknown"
        amount = item.select_one(".amount").text if item.select_one(".amount") else "Not specified"
        deadline = item.select_one(".deadline").text if item.select_one(".deadline") else "Not specified"
        link = item.select_one("a.scholarship-title")["href"] if item.select_one("a.scholarship-title") else url
        eligibility = {"course": "Any", "gpa": 2.5, "location": "USA"}  # Placeholder
        scholarship = normalize_data(title, amount, eligibility, deadline, link, "Scholarships.com")
        scholarships.append(scholarship)
        time.sleep(1)
    return scholarships

def scrape_mit():
    url = "https://sfs.mit.edu/undergraduate-students/types-of-aid/scholarships/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    scholarships = []
    # Example: Adjust selectors based on MIT's actual HTML structure
    for item in soup.select("div.scholarship"):  # Placeholder selector
        title = item.select_one("h2").text if item.select_one("h2") else "Unknown"
        amount = item.select_one(".amount").text if item.select_one(".amount") else "Not specified"
        deadline = item.select_one(".deadline").text if item.select_one(".deadline") else "Not specified"
        link = item.select_one("a")["href"] if item.select_one("a") else url
        eligibility = {"course": "Any", "gpa": 3.0, "location": "Massachusetts"}  # Placeholder
        scholarship = normalize_data(title, amount, eligibility, deadline, link, "MIT")
        scholarships.append(scholarship)
        time.sleep(1)
    return scholarships

def main():
    print("Starting scraper...")
    all_scholarships = []

    # Scrape each source
    print("Scraping Fastweb...")
    all_scholarships.extend(scrape_fastweb())
    print("Scraping Scholarships.com...")
    all_scholarships.extend(scrape_scholarships_com())
    print("Scraping MIT...")
    all_scholarships.extend(scrape_mit())

    # Insert into MongoDB
    if all_scholarships:
        scholarships_collection.insert_many(all_scholarships)
        print(f"Inserted {len(all_scholarships)} scholarships into MongoDB")
    else:
        print("No scholarships found")

if __name__ == "__main__":
    main()