# SortAid

A scholarship portal that aggregates scholarships from education portals, government sites, and scholarship platforms, then matches them against a student's profile (GPA, course, location, interests).

## Tech stack

| Layer      | Tech |
|------------|------|
| Frontend   | React 19 (Vite), React Router |
| Backend    | Node.js, Express 5, MongoDB (Mongoose), JWT auth (bcryptjs + jsonwebtoken) |
| Scrapers   | Python, BeautifulSoup, Requests, PyMongo |

## Project structure

```
backend/     Express REST API + Mongoose models
frontend/    React (Vite) single-page app
scrapers/    Standalone Python scripts that populate MongoDB with scholarship listings
```

## Getting started

### 1. Database

You need a MongoDB instance — either a local one or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI, PORT, JWT_SECRET
npm start
```

The API listens on `http://localhost:8000` by default (`PORT` in `.env`).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:8000
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### 4. Scrapers (optional, populates real scholarship data)

All three sources share one CLI entrypoint, run from the **repo root** (not from inside `scrapers/`):

```bash
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirement.txt

python -m scrapers.cli --source all                       # run every source
python -m scrapers.cli --source scholarships360           # or just one
python -m scrapers.cli --source internationalscholarships --full   # ignore saved resume progress
```

It reads `MONGODB_URI` from `backend/.env` (or from the environment, if already set — that's what the CI schedule below uses) and writes into the `scholarships` collection, normalizing `amount`/`deadline` into `amountValue`/`deadlineDate` along the way. Respect each site's terms of service and `robots.txt`, and keep the built-in rate limiting (`time.sleep(...)`) in place — these are polite, low-volume scrapers, not high-throughput crawlers.

Source code lives in `scrapers/sources/` (one module per site); `scrapers/base.py` holds the shared HTTP session/retry/logging/Mongo setup.

## Tests & CI

```bash
cd backend && npm test      # Jest + Supertest, against an in-memory MongoDB
pytest scrapers              # parsing-logic unit tests
```

`.github/workflows/ci.yml` runs backend tests, frontend lint+build, and the scraper tests on every push/PR to `main`.

`.github/workflows/scrape.yml` runs the scraper CLI on a daily schedule (and via manual dispatch). It needs a `MONGODB_URI` repository secret (Settings → Secrets and variables → Actions) — it's not set up by this session, add it once you're ready to turn scheduled scraping on.

## Auth model

- Passwords are hashed with bcrypt before being stored (never in plaintext).
- `POST /api/profile/login` and `POST /api/profile/register` return a JWT (`token`) alongside `userId`.
- Every route that reads or writes a specific user's data requires `Authorization: Bearer <token>` and only allows a user to access their own resource — a token can't be used to read or edit someone else's profile.
- Scholarship *browsing* routes (`GET /api/scholarships`, `GET /api/scholarships/:id`) are public by design; no login is required to see what's available.

## Known gaps

- The scholarship-creation/update/delete routes (`POST/PUT/DELETE /api/scholarships`) have no auth yet — there's no admin-role concept in the app. They're meant for internal/scraper use only; don't expose them to the public frontend as-is.
- Scraped `amount`/`deadline` are free text; `amountValue`/`deadlineDate` are best-effort normalized fields populated by the scrapers (with a runtime fallback for older rows that predate them).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Screenshots

![Screenshot 2025-06-07 234636](https://github.com/user-attachments/assets/985b210e-ca7a-4a96-b479-9367e4538f45)
![Screenshot 2025-06-07 234620](https://github.com/user-attachments/assets/0732ccb5-7f88-4596-97a8-8d56dd30e170)
![Screenshot 2025-06-07 234607](https://github.com/user-attachments/assets/8f7dfa60-882d-4e09-8016-c7e2e702ab7e)

*(from an earlier UI pass — due for a refresh since the frontend redesign)*
