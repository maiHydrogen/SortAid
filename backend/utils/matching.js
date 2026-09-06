// Pulled out of the route handler so the scoring logic can be unit-tested
// on its own, without spinning up Express/Mongo.
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const GLOBAL_LOCATIONS = new Set(['any', 'global', 'worldwide', 'international']);

// Parses a display string ("$500", "05/01/2026") for scholarships that
// predate the amountValue/deadlineDate normalization done at scrape time.
function fallbackAmount(amountText) {
  const parsed = parseFloat((amountText || '').replace(/[^0-9.-]+/g, ''));
  return Number.isNaN(parsed) ? null : parsed;
}

function fallbackDeadline(deadlineText) {
  const parsed = new Date(deadlineText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Scores one scholarship against one student profile.
 * Returns `null` when the scholarship isn't eligible at all (wrong
 * course/GPA, or the deadline has already passed) — the caller should drop
 * those instead of ranking them low.
 */
function scoreScholarship(scholarship, profile) {
  const eligibility = scholarship.eligibility || {};

  const courseMatch = eligibility.course
    ? eligibility.course.toLowerCase() === (profile.course || '').toLowerCase()
    : true;
  const gpaMatch = eligibility.gpa != null ? profile.gpa >= eligibility.gpa : true;
  if (!courseMatch || !gpaMatch) return null;

  const deadlineDate = scholarship.deadlineDate || fallbackDeadline(scholarship.deadline);
  if (deadlineDate && deadlineDate.getTime() < Date.now()) return null; // expired

  let score = 0;

  if (deadlineDate) {
    const daysLeft = (deadlineDate.getTime() - Date.now()) / MS_PER_DAY;
    if (daysLeft <= 7) score += 8;
    else if (daysLeft <= 30) score += 5;
    else if (daysLeft <= 90) score += 2;
  }

  const amountValue = scholarship.amountValue ?? fallbackAmount(scholarship.amount);
  if (amountValue != null) {
    if (amountValue >= 10000) score += 5;
    else if (amountValue >= 5000) score += 3;
    else if (amountValue >= 1000) score += 1;
  }

  // Location is a soft signal, not a hard filter — scraped location strings
  // are too inconsistent ("US" vs "New York") to safely exclude on.
  const profileLocation = (profile.location || '').trim().toLowerCase();
  const scholarshipLocation = (eligibility.location || '').trim().toLowerCase();
  const isGlobal = GLOBAL_LOCATIONS.has(scholarshipLocation);
  if (profileLocation && scholarshipLocation && !isGlobal) {
    if (scholarshipLocation.includes(profileLocation) || profileLocation.includes(scholarshipLocation)) {
      score += 2;
    }
  }

  // Crude keyword overlap between the student's stated interests and the
  // scholarship's title/course — not real NLP, just a cheap relevance nudge.
  const haystack = `${scholarship.title || ''} ${eligibility.course || ''}`.toLowerCase();
  const interestHits = (profile.interests || []).filter(
    (interest) => interest && haystack.includes(interest.toLowerCase())
  );
  score += Math.min(interestHits.length, 3);

  return score;
}

/**
 * Filters `scholarships` down to the ones `profile` is eligible for, each
 * annotated with a `score`, sorted highest score first.
 */
function matchScholarships(scholarships, profile) {
  const matched = [];
  for (const scholarship of scholarships) {
    const score = scoreScholarship(scholarship, profile);
    if (score !== null) {
      const doc = scholarship._doc || scholarship;
      matched.push({ ...doc, score });
    }
  }
  matched.sort((a, b) => b.score - a.score);
  return matched;
}

module.exports = { scoreScholarship, matchScholarships };
