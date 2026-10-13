// Pure recommendation-state module (Requirement 13: single source of
// truth). Given a resolved location, a selected date, and that date's
// normalized forecast day (see js/weather.js), computes one state object
// that every view reads from. No DOM access, no I/O.

import {
  TOPS,
  BOTTOMS,
  JACKETS,
  FOOTWEAR,
  ACCESSORIES,
  CATEGORY_RULES,
  RECOMMENDATION_WORDING,
  REMINDER_WORDING,
  CHECKLIST_LABELS,
} from "./content.js";

// ---- Seeded PRNG ---------------------------------------------------------
// Seeded by location + date (Requirement 8 / spec step 6) so revisiting the
// same location/date reproduces the same outfit and wording with nothing
// stored beyond the saved location.

function hashStringToSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, array) {
  return array[Math.floor(rng() * array.length)];
}

// ---- Outfit category ------------------------------------------------------

export function categorize(feelsLikeF) {
  if (feelsLikeF >= 90) return "scorching";
  if (feelsLikeF >= 70) return "warm";
  if (feelsLikeF >= 48) return "mild";
  if (feelsLikeF >= 33) return "cold";
  return "freezing";
}

// ---- Footwear (Requirement/spec step 2) -----------------------------------

function pickFootwear(category, day) {
  const categoryEligible = category === "scorching" || category === "warm";
  const precipOk = day.precipProbMax != null && day.precipProbMax < 30;
  const windOk = day.windGustsMaxMph != null && day.windGustsMaxMph < 20;
  return categoryEligible && precipOk && windOk ? "open" : "closed";
}

// ---- Reminders (spec step 3) -----------------------------------------------
// Each reminder is "active", "inactive", or "missing" (its underlying value
// was unavailable, so it is left out rather than guessed - Requirement 29).

function evaluateReminders(day) {
  const r = {};

  r.umbrella =
    day.precipProbMax == null ? "missing" : day.precipProbMax >= 30 ? "active" : "inactive";

  if (day.precipProbMax == null) {
    r.poncho = "missing";
  } else if (day.precipProbMax >= 60) {
    r.poncho = "active";
  } else if (day.precipProbMax >= 30) {
    r.poncho = day.windGustsMaxMph == null ? "missing" : day.windGustsMaxMph >= 20 ? "active" : "inactive";
  } else {
    r.poncho = "inactive";
  }

  const uvStatus = day.uvIndexMax == null ? "missing" : day.uvIndexMax >= 3 ? "active" : "inactive";
  r.sunscreen = uvStatus;
  r.hat = uvStatus;

  r.hydration =
    day.feelsLikeMaxF == null ? "missing" : day.feelsLikeMaxF >= 80 ? "active" : "inactive";

  return r;
}

// ---- Outfit assembly (spec step 4) -----------------------------------------

// Top and bottom rotate through their pools with a per-location step, so two
// consecutive dates never get the same top (or bottom) when the pool has more
// than one choice. Still a pure function of location + date, and still chosen
// independently of each other and of the reminders.
function pickRotating(array, location, date, salt) {
  if (array.length === 1) return array[0];
  const key = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}|${salt}`;
  const offset = hashStringToSeed(`${key}|offset`) % array.length;
  const step = 1 + (hashStringToSeed(`${key}|step`) % (array.length - 1));
  const dayNumber = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  return array[(offset + dayNumber * step) % array.length];
}

function assembleOutfit(category, rng, location, date) {
  const tops = TOPS.filter((t) => t.categories.includes(category));
  const bottoms = BOTTOMS.filter((b) => b.categories.includes(category));
  const rules = CATEGORY_RULES[category];

  const top = pickRotating(tops, location, date, "top");
  const bottom = pickRotating(bottoms, location, date, "bottom");

  let jacket = null;
  if (rules.jacket === "always") jacket = JACKETS[category];
  else if (rules.jacket === "optional") jacket = rng() < 0.5 ? JACKETS[category] : null;

  const scarf = rules.scarf === "always";

  let warmHat = false;
  if (rules.warmHat === "always") warmHat = true;
  else if (rules.warmHat === "optional") warmHat = rng() < 0.5;

  return { top, bottom, jacket, scarf, warmHat };
}

// ---- Screen-reader description (Requirement 27) ----------------------------

function describeOutfit(outfit, footwearId, accessoryFlags) {
  const parts = [outfit.top.label, outfit.bottom.label];
  if (outfit.jacket) parts.push(outfit.jacket.label);
  if (outfit.scarf) parts.push(ACCESSORIES.scarf.label);
  if (outfit.warmHat) parts.push(ACCESSORIES.warmHat.label);
  parts.push(FOOTWEAR[footwearId].label);
  if (accessoryFlags.sunHat) parts.push(ACCESSORIES.sunHat.label);
  if (accessoryFlags.poncho) parts.push(ACCESSORIES.poncho.label);
  if (accessoryFlags.umbrella) parts.push(ACCESSORIES.umbrella.label);

  const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + ", and " + parts.slice(-1) : parts[0];
  return `An otter wearing ${list}.`;
}

// ---- Checklist (spec step 7) ------------------------------------------------

function buildChecklist(reminders, outfit) {
  const items = [];
  if (reminders.umbrella === "active") items.push({ type: "umbrella", label: CHECKLIST_LABELS.umbrella });
  if (reminders.poncho === "active") items.push({ type: "poncho", label: CHECKLIST_LABELS.poncho });
  if (reminders.sunscreen === "active") items.push({ type: "sunscreen", label: CHECKLIST_LABELS.sunscreen });
  if (reminders.hat === "active") items.push({ type: "hat", label: CHECKLIST_LABELS.hat });
  if (reminders.hydration === "active") items.push({ type: "hydration", label: CHECKLIST_LABELS.hydration });
  if (outfit.jacket) {
    // The type picks the icon, so it distinguishes the two looks too.
    items.push(outfit.scarf
      ? { type: "jacketAndScarf", label: CHECKLIST_LABELS.jacketAndScarf }
      : { type: "jacket", label: CHECKLIST_LABELS.jacket });
  }
  return items;
}

/**
 * Compute the single recommendation state for one location + date.
 *
 * @param {{latitude:number, longitude:number}} location
 * @param {string} date - "YYYY-MM-DD", the location-local date
 * @param {object} day - normalized forecast day from js/weather.js
 * @returns the recommendation state object every view reads from
 */
export function computeRecommendationState(location, date, day) {
  const feelsLikeF = day.feelsLikeMaxF ?? day.tempMaxF;
  const category = categorize(feelsLikeF);
  const footwear = pickFootwear(category, day);
  const reminders = evaluateReminders(day);

  const seed = hashStringToSeed(`${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}|${date}`);
  const rng = mulberry32(seed);

  const outfit = assembleOutfit(category, rng, location, date);
  const recommendationText = pick(rng, RECOMMENDATION_WORDING[category]);

  const reminderMessages = {};
  for (const type of ["umbrella", "poncho", "sunscreen", "hat", "hydration"]) {
    if (reminders[type] === "active") {
      reminderMessages[type] = pick(rng, REMINDER_WORDING[type]);
    }
  }

  const accessoryFlags = {
    sunHat: reminders.hat === "active",
    poncho: reminders.poncho === "active",
    umbrella: reminders.umbrella === "active",
  };

  const checklist = buildChecklist(reminders, outfit);

  const missingFields = [];
  if (day.feelsLikeMaxF == null) missingFields.push("feels-like temperature");
  if (day.precipProbMax == null) missingFields.push("precipitation chance");
  if (day.windGustsMaxMph == null) missingFields.push("wind gusts");
  if (day.uvIndexMax == null) missingFields.push("UV index");

  return {
    location,
    date,
    category,
    feelsLikeF,
    tempMaxF: day.tempMaxF,
    tempMinF: day.tempMinF,
    precipProbMax: day.precipProbMax,
    windGustsMaxMph: day.windGustsMaxMph,
    uvIndexMax: day.uvIndexMax,
    weatherCode: day.weatherCode,
    sunrise: day.sunrise,
    sunset: day.sunset,
    footwear,
    outfit,
    accessoryFlags,
    recommendationText,
    reminders: Object.entries(reminders)
      .filter(([, status]) => status === "active")
      .map(([type]) => ({ type, message: reminderMessages[type] })),
    checklist,
    missingFields,
    description: describeOutfit(outfit, footwear, accessoryFlags),
  };
}
