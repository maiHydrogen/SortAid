"""Single entrypoint for running the SortAid scholarship scrapers.

Usage (from the repo root):
    python -m scrapers.cli --source scholarships360
    python -m scrapers.cli --source all
    python -m scrapers.cli --source internationalscholarships --full
"""
import argparse
import logging

from scrapers.base import get_mongo_client, get_scholarships_collection, setup_logging
from scrapers.sources import fastweb, internationalscholarships, scholarships360

SOURCES = {
    "scholarships360": scholarships360.run,
    "internationalscholarships": internationalscholarships.run,
    "fastweb": fastweb.run,
}


def main():
    parser = argparse.ArgumentParser(description="Run SortAid scholarship scrapers.")
    parser.add_argument(
        "--source",
        choices=[*SOURCES.keys(), "all"],
        default="all",
        help="Which source to scrape (default: all)",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Force a full re-scrape instead of resuming from progress (only internationalscholarships supports resuming)",
    )
    args = parser.parse_args()

    setup_logging("scraping.log")
    client = get_mongo_client()
    collection = get_scholarships_collection(client)

    try:
        targets = SOURCES.keys() if args.source == "all" else [args.source]
        for name in targets:
            print(f"Running {name} scraper...")
            logging.info(f"--- Running {name} scraper ---")
            try:
                results = SOURCES[name](collection, force_full_scrape=args.full)
                print(f"{name}: scraped {len(results)} scholarships")
                logging.info(f"{name}: scraped and stored {len(results)} scholarships")
            except Exception as e:
                logging.error(f"{name} scraper failed: {e}")
                print(f"{name} scraper failed — see scraping.log")
    finally:
        client.close()
        logging.info("MongoDB connection closed")


if __name__ == "__main__":
    main()
