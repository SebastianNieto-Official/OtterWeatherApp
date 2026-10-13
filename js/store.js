// localStorage persistence (Requirement 3/33: only the most recent
// location is ever stored - no ticks, pause setting, or outfit history).

const LOCATION_KEY = "otterWeather.savedLocation";

export function saveLocation(location) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Storage unavailable (private browsing, quota) - app still works
    // in-memory for the session, it just won't persist across reloads.
  }
}

export function loadLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocation() {
  try {
    localStorage.removeItem(LOCATION_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
