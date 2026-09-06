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

Source code lives in `scrapers/sources/` (one module per site); `scrapers/base.py` holds the shared HTTP session/retry/logging/Mongo setup. Every scraped record is checked against `scrapers/validation.py` before being written — records missing required fields (or full of placeholder text like `"N/A"`) are rejected and logged, and if more than half of a run's records fail validation, it's logged as an error (`scraping.log`) so a site's HTML changing under a scraper shows up loudly instead of quietly filling the database with garbage.

## Tests & CI

```bash
cd backend && npm test      # Jest + Supertest, against an in-memory MongoDB
pytest scrapers              # parsing-logic unit tests
```

`.github/workflows/ci.yml` runs backend tests, frontend lint+build, and the scraper tests on every push/PR to `main`.

`.github/workflows/scrape.yml` runs the scraper CLI on a daily schedule (and via manual dispatch). It needs a `MONGODB_URI` repository secret (Settings → Secrets and variables → Actions) — it's not set up by this session, add it once you're ready to turn scheduled scraping on.

## Auth model

- Passwords are hashed with bcrypt before being stored (never in plaintext).
- `POST /api/profile/login` and `POST /api/profile/register` return a JWT (`token`) alongside `userId` and `isAdmin`.
- Every route that reads or writes a specific user's data requires `Authorization: Bearer <token>` and only allows a user to access their own resource — a token can't be used to read or edit someone else's profile.
- Scholarship *browsing* routes (`GET /api/scholarships`, `GET /api/scholarships/:id`) are public by design; no login is required to see what's available.
- Scholarship *write* routes (`POST/PUT/DELETE /api/scholarships`) require `Authorization` **and** an admin account.

## Admin access

There's no self-serve way to become an admin (rightly so — a signup form has no business granting elevated access). To make a user an admin, flip it directly in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```

That user's *existing* login session picks it up immediately (the check re-reads the user from the DB on every admin request rather than trusting a flag baked into the JWT) — no need to log out/in. Once set, the "Admin" nav link appears and `/admin` becomes reachable, letting you add/edit/delete scholarships through a UI instead of `curl`/Postman.

## Matching algorithm

`backend/utils/matching.js` (unit-tested in `backend/tests/matching.test.js`) scores each scholarship a student is eligible for:

- **Hard filters**: course and GPA requirements, and the deadline must not have already passed.
- **Deadline urgency**: +8 within 7 days, +5 within 30, +2 within 90.
- **Award size**: +5 for $10k+, +3 for $5k+, +1 for $1k+.
- **Location**: a soft +2 bonus (not a filter) when the profile's location and the scholarship's overlap — scraped location strings are too inconsistent ("US" vs "New York") to safely exclude on.
- **Interests**: +1 per interest keyword found in the title/course, capped at +3. This is a plain substring check, not real NLP — a cheap relevance nudge, not a claim of semantic matching.

## Known gaps

- Admin promotion/demotion has no UI — it's a direct database edit (see above). Fine for a small trusted team, not something to scale past.
- Scraped `amount`/`deadline` are free text; `amountValue`/`deadlineDate` are best-effort normalized fields populated by the scrapers (with a runtime fallback for older rows that predate them).
- CORS is wide open (`cors()` with no origin restriction) — fine for development, worth tightening to the deployed frontend's origin before this goes anywhere public-facing long-term.

## Deployment

**Live demo:** _not deployed yet — add the link here once it's up._

The stack maps cleanly onto Atlas (DB) + Render (backend) + Vercel (frontend), all of which have workable free tiers:

1. **Database** — create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user, and allow network access from anywhere (0.0.0.0/0) or specifically from Render's IPs. Copy the connection string.
2. **Backend on [Render](https://render.com)** — "New +" → "Blueprint", point it at this repo; it'll pick up [`render.yaml`](render.yaml) at the root. Render will ask you to fill in the `MONGODB_URI` and `JWT_SECRET` env vars it left blank (`sync: false` in the blueprint) — use the Atlas connection string and a long random secret. Once deployed, note the service URL (e.g. `https://sortaid-backend.onrender.com`).
3. **Frontend on [Vercel](https://vercel.com)** — "Add New" → "Project", import this repo, and set **Root Directory** to `frontend`. Vercel auto-detects Vite (build command `npm run build`, output `dist`); [`frontend/vercel.json`](frontend/vercel.json) adds the SPA rewrite React Router needs so refreshing `/scholarships` doesn't 404. Add an environment variable `VITE_API_URL` set to the Render backend URL from step 2, then deploy.
4. Update this README's "Live demo" line with the Vercel URL once it's live.

Render's free tier spins the backend down after inactivity — the first request after idling can take ~30-60s to wake it up. That's a Render behavior, not a SortAid bug, but worth knowing before assuming something's broken.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Screenshots

![Screenshot 2025-06-07 234636](https://github.com/user-attachments/assets/985b210e-ca7a-4a96-b479-9367e4538f45)
![Screenshot 2025-06-07 234620](https://github.com/user-attachments/assets/0732ccb5-7f88-4596-97a8-8d56dd30e170)
![Screenshot 2025-06-07 234607](https://github.com/user-attachments/assets/8f7dfa60-882d-4e09-8016-c7e2e702ab7e)

*(from an earlier UI pass — due for a refresh since the frontend redesign)*
