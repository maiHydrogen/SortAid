
# ✅ Scholarship Finder – Project Checklist

---

## 🔧 Phase 1: Project Setup & Planning
**Goal:** Establish the project structure, tools, and shared understanding.

- [x] Create project root folder with `frontend/`, `backend/`, and `scrapers/` subfolders.
- [x] Initialize frontend with `Vite` or `Create React App`.
- [x] Initialize backend with `npm init` and install Express.
- [x] Set up MongoDB (local or Atlas), and install `mongoose`.
- [x] Create a `.env` file with variables (Mongo URI, ports, etc.).
- [x] Set up GitHub repo and `.gitignore`.
- [x] Install Python and required scraping libraries: `beautifulsoup4`, `scrapy`, `pymongo`.

---

## 🗃️ Phase 2: Database Design
**Goal:** Design MongoDB collections and implement CRUD with Mongoose.

- [x] Define **StudentProfile** schema
- [x] Define **Scholarship** schema
- [x] Create Mongoose models and validate with sample data.
- [x] Implement basic CRUD endpoints (GET/POST/PUT/DELETE) for both collections.

---

## 🕷️ Phase 3: Web Scraper Development
**Goal:** Extract, clean, and store real scholarship data.

- [x] Set up Python script structure
- [x] Extract: `title`, `amount`, `eligibility`, `deadline`, `link`
- [x] Handle pagination
- [ ] Normalize data
- [x] Connect to MongoDB via `pymongo`
- [x] Add logging and exception handling
- [ ] Schedule scrapers using cron or backend-trigger

---

## 🧠 Phase 4: Matching & Recommendation Logic
**Goal:** Match scholarships with students based on profile fields.

- [ ] Build `GET /api/scholarships/match/:userId` endpoint
- [ ] Match and rank logic
- [ ] Return ranked list
- [ ] Flag scholarships with **urgent deadlines**

---

## 🌐 Phase 5: API Development
**Goal:** Build REST API for student profiles and scholarship lists.

### Student Profile APIs
- [ ] `POST /api/profile`
- [ ] `GET /api/profile/:userId`

### Scholarship APIs
- [ ] `GET /api/scholarships/match/:userId`
- [ ] `GET /api/scholarships`
- [ ] `GET /api/scholarship/:id`

---

## 🎨 Phase 6: Frontend Development
**Goal:** Create a clean, user-friendly interface in React.

### Components
- [ ] `ProfileForm`
- [ ] `ScholarshipList`
- [ ] `ScholarshipCard`
- [ ] `NotificationBadge`

### Features
- [ ] Input validation
- [ ] Submit profile
- [ ] Fetch & display matches
- [ ] Responsive design
- [ ] Loading/error handling

---

## 🧪 Phase 7: Testing & Debugging
**Goal:** Ensure stability across all modules.

- [ ] Unit test scraper scripts
- [ ] API testing with Postman
- [ ] Frontend testing
- [ ] Responsive design test

---

## 🚀 Phase 8: Deployment
**Goal:** Take the app live.

- [ ] Deploy frontend to Vercel/Netlify
- [ ] Deploy backend to Render/Heroku
- [ ] Use MongoDB Atlas
- [ ] Schedule scrapers
- [ ] Set up CORS, env variables
- [ ] Final QA testing

---

## 🌱 Phase 9: Optional Enhancements

- [ ] 🔐 JWT Authentication
- [ ] 📬 Email/SMS notifications
- [ ] ❤️ Save favorites
- [ ] 📊 Admin Dashboard
- [ ] ✨ Sentiment tags
