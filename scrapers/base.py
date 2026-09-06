"""Shared scraping infrastructure used by every source in scrapers/sources/:
an HTTP session with retry/backoff, the MongoDB connection, and logging
setup. Each source module used to duplicate all of this; now it just imports
from here.
"""
import logging
import os

import requests
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


def build_session(headers=None, retries=3, backoff_factor=1):
    """A requests.Session that retries transient failures (429/5xx) instead
    of giving up on the first hiccup."""
    session = requests.Session()
    retry = Retry(
        total=retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.headers.update(headers or DEFAULT_HEADERS)
    return session


def setup_logging(log_filename="scraping.log"):
    logging.basicConfig(
        filename=log_filename,
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
    )


def get_mongo_client():
    """Connects to MongoDB using MONGODB_URI. Prefers an already-set
    environment variable (e.g. a CI secret) and only falls back to reading
    backend/.env for local runs."""
    uri = os.getenv("MONGODB_URI")

    if not uri:
        env_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env"
        )
        if not os.path.exists(env_path):
            raise FileNotFoundError(f".env file not found at {env_path}")
        load_dotenv(env_path)
        uri = os.getenv("MONGODB_URI")

    if not uri:
        raise ValueError("MONGODB_URI not found in the environment or in backend/.env")

    try:
        client = MongoClient(uri)
        logging.info("Connected to MongoDB Atlas")
        return client
    except ConnectionFailure as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        raise


def get_scholarships_collection(client, db_name="SortAid"):
    return client[db_name]["scholarships"]
