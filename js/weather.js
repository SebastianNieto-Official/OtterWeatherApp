// Open-Meteo access layer (Requirement 9: the only weather provider).
// Two responsibilities: resolve a US city/state to coordinates + time
// zone, and fetch the 7-day/hourly forecast for a resolved location.

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const STATE_ABBR_TO_NAME = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export class WeatherServiceError extends Error {
  constructor(kind) {
    super(`Weather service error: ${kind}`);
    this.kind = kind; // "network" | "http"
  }
}

function normalizeStateInput(stateRaw) {
  const trimmed = stateRaw.trim();
  const upper = trimmed.toUpperCase();
  if (STATE_ABBR_TO_NAME[upper]) return STATE_ABBR_TO_NAME[upper].toLowerCase();
  return trimmed.toLowerCase();
}

/**
 * Resolve a US city/state to coordinates + time zone via Open-Meteo
 * geocoding. Returns { ok: true, location } or { ok: false, reason }
 * where reason is "missing" | "not-found" | "service-error".
 */
export async function geocodeUSLocation(cityInput, stateInput) {
  const city = (cityInput || "").trim();
  const stateRaw = (stateInput || "").trim();
  if (!city || !stateRaw) {
    return { ok: false, reason: "missing" };
  }

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
  let data;
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, reason: "service-error" };
    data = await res.json();
  } catch {
    return { ok: false, reason: "service-error" };
  }

  const results = data.results || [];
  const wantedState = normalizeStateInput(stateRaw);

  const match = results.find(
    (r) => r.country_code === "US" && r.admin1 && r.admin1.toLowerCase() === wantedState
  );

  if (!match) return { ok: false, reason: "not-found" };

  return {
    ok: true,
    location: {
      name: match.name,
      state: match.admin1,
      latitude: match.latitude,
      longitude: match.longitude,
      timezone: match.timezone,
    },
  };
}

const DAILY_VARS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "precipitation_probability_max",
  "wind_gusts_10m_max",
  "uv_index_max",
  "weathercode",
  "sunrise",
  "sunset",
].join(",");

const HOURLY_VARS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "wind_gusts_10m",
  "uv_index",
  "weathercode",
].join(",");

/**
 * Fetch the 7-day forecast (today + 6) for a resolved location, in that
 * location's own time zone (Requirement 10). Throws WeatherServiceError
 * on network failure or a non-2xx response (Requirement 30); a missing
 * individual field inside an otherwise-successful response is left as
 * null for the caller to handle (Requirement 29).
 */
export async function fetchForecast(latitude, longitude, timezone) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
    forecast_days: "7",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    daily: DAILY_VARS,
    hourly: HOURLY_VARS,
  });

  let res;
  try {
    res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  } catch {
    throw new WeatherServiceError("network");
  }
  if (!res.ok) throw new WeatherServiceError("http");

  const data = await res.json();
  return normalizeForecast(data);
}

function dateOf(isoLocalString) {
  return isoLocalString.slice(0, 10);
}

function normalizeForecast(data) {
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const days = (daily.time || []).map((date, i) => ({
    date,
    tempMaxF: daily.temperature_2m_max?.[i] ?? null,
    tempMinF: daily.temperature_2m_min?.[i] ?? null,
    feelsLikeMaxF: daily.apparent_temperature_max?.[i] ?? null,
    precipProbMax: daily.precipitation_probability_max?.[i] ?? null,
    windGustsMaxMph: daily.wind_gusts_10m_max?.[i] ?? null,
    uvIndexMax: daily.uv_index_max?.[i] ?? null,
    weatherCode: daily.weathercode?.[i] ?? null,
    sunrise: daily.sunrise?.[i] ?? null,
    sunset: daily.sunset?.[i] ?? null,
    hours: [],
  }));

  const dayByDate = new Map(days.map((d) => [d.date, d]));

  (hourly.time || []).forEach((time, i) => {
    const day = dayByDate.get(dateOf(time));
    if (!day) return;
    day.hours.push({
      time,
      hour: Number(time.slice(11, 13)),
      tempF: hourly.temperature_2m?.[i] ?? null,
      feelsLikeF: hourly.apparent_temperature?.[i] ?? null,
      precipProb: hourly.precipitation_probability?.[i] ?? null,
      windGustsMph: hourly.wind_gusts_10m?.[i] ?? null,
      uvIndex: hourly.uv_index?.[i] ?? null,
      weatherCode: hourly.weathercode?.[i] ?? null,
    });
  });

  return { timezone: data.timezone, days };
}
