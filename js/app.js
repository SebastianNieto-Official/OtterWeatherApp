// Central app controller: owns the one piece of state every view reads
// from (resolved location, forecast, selected date) and the actions that
// change it. No direct DOM access - views subscribe via onChange().

import { geocodeUSLocation, fetchForecast, WeatherServiceError } from "./weather.js";
import { saveLocation, loadLocation, clearLocation } from "./store.js";
import { computeRecommendationState } from "./recommendation.js";

const state = {
  location: null, // { name, state, latitude, longitude, timezone } | null
  forecast: null, // { timezone, days: [...] } | null
  selectedDate: null, // "YYYY-MM-DD" | null
  loading: false,
  fieldError: null, // inline manual-entry error message (Requirement 1)
  serviceError: null, // { source: "geocode" | "forecast" } (Requirement 30)
  geolocationError: null, // { code: "denied" | "unavailable" | "timeout" } (Requirement 31)
};

let lastManualEntry = null; // { city, state } - for retrying a geocode service error
let locationRequestId = 0;

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(state));
}

export function onChange(fn) {
  listeners.add(fn);
}

export function getState() {
  return state;
}

function clearTransientErrors() {
  state.fieldError = null;
  state.serviceError = null;
  state.geolocationError = null;
}

// A location action owns its whole lookup/forecast sequence. Older responses
// must not update state, storage, errors, or the latest action's loading flag.
function beginLocationRequest({ showLoading = true } = {}) {
  const requestId = ++locationRequestId;
  clearTransientErrors();
  state.loading = showLoading;
  notify();
  return requestId;
}

function isCurrentRequest(requestId) {
  return requestId === locationRequestId;
}

function finishLocationRequest(requestId) {
  if (!isCurrentRequest(requestId) || !state.loading) return;
  state.loading = false;
  notify();
}

function firstAvailableDate(forecast) {
  return forecast.days.length > 0 ? forecast.days[0].date : null;
}

async function loadForecastFor(location, requestId) {
  if (!isCurrentRequest(requestId)) return;
  state.location = location;
  // Never display the previous city's weather under the new city's name.
  state.forecast = null;
  state.selectedDate = null;
  if (location.timezone !== "auto") saveLocation(location);
  notify();
  try {
    const forecast = await fetchForecast(location.latitude, location.longitude, location.timezone);
    if (!isCurrentRequest(requestId)) return;
    state.location = { ...location, timezone: forecast.timezone };
    saveLocation(state.location);
    state.forecast = forecast;
    state.selectedDate = firstAvailableDate(forecast);
    state.serviceError = null;
  } catch (err) {
    if (!isCurrentRequest(requestId)) return;
    state.forecast = null;
    state.selectedDate = null;
    if (err instanceof WeatherServiceError) {
      state.serviceError = { source: "forecast" };
    } else {
      throw err;
    }
  } finally {
    finishLocationRequest(requestId);
  }
}

export async function init() {
  const saved = loadLocation();
  if (saved) {
    const requestId = beginLocationRequest();
    await loadForecastFor(saved, requestId);
  } else {
    notify();
  }
}

export async function submitManualLocation(city, stateInput) {
  lastManualEntry = { city, state: stateInput };
  const requestId = beginLocationRequest();
  try {
    const result = await geocodeUSLocation(city, stateInput);
    if (!isCurrentRequest(requestId)) return;

    if (!result.ok) {
      if (result.reason === "missing") {
        state.fieldError = "Enter both a city and a state.";
      } else if (result.reason === "not-found") {
        state.fieldError = "Couldn't find a US city and state matching that entry.";
      } else {
        state.serviceError = { source: "geocode" };
      }
      return;
    }

    await loadForecastFor(result.location, requestId);
  } finally {
    finishLocationRequest(requestId);
  }
}

function mapGeolocationError(err) {
  if (err.code === err.PERMISSION_DENIED) return "denied";
  if (err.code === err.POSITION_UNAVAILABLE) return "unavailable";
  if (err.code === err.TIMEOUT) return "timeout";
  return "unavailable";
}

export function useMyLocation() {
  // No loading indicator while the browser's permission prompt is open:
  // nothing is being fetched yet, and the User may take a while to answer.
  const requestId = beginLocationRequest({ showLoading: false });

  if (!("geolocation" in navigator)) {
    state.geolocationError = { code: "unavailable" };
    notify();
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isCurrentRequest(requestId)) {
          resolve();
          return;
        }
        const location = {
          name: "Current location",
          state: null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: "auto",
        };

        // Position received: the forecast fetch is what the User waits on.
        // It also supplies the concrete time zone before the location is saved.
        state.loading = true;
        loadForecastFor(location, requestId).then(resolve, reject);
      },
      (err) => {
        if (isCurrentRequest(requestId)) {
          state.geolocationError = { code: mapGeolocationError(err) };
          notify();
        }
        resolve();
      },
      { timeout: 10000 }
    );
  });
}

export function clearSavedLocation() {
  ++locationRequestId;
  lastManualEntry = null;
  clearLocation();
  state.location = null;
  state.forecast = null;
  state.selectedDate = null;
  state.loading = false;
  clearTransientErrors();
  notify();
}

export function selectDate(date) {
  const exists = state.forecast?.days.some((d) => d.date === date);
  if (!exists) return;
  state.selectedDate = date;
  notify();
}

export function dismissServiceError() {
  state.serviceError = null;
  notify();
}

/** Re-attempts whichever request last produced the current service error
 * (Requirement 30: "Retry" re-fetches once unblocked). */
export async function retryServiceError() {
  if (!state.serviceError) return;
  if (state.serviceError.source === "geocode" && lastManualEntry) {
    await submitManualLocation(lastManualEntry.city, lastManualEntry.state);
  } else if (state.serviceError.source === "forecast" && state.location) {
    const location = state.location;
    const requestId = beginLocationRequest();
    await loadForecastFor(location, requestId);
  }
}

export function dismissGeolocationError() {
  state.geolocationError = null;
  notify();
}

export function getSelectedDay() {
  if (!state.forecast || !state.selectedDate) return null;
  return state.forecast.days.find((d) => d.date === state.selectedDate) || null;
}

export function getRecommendationState() {
  const day = getSelectedDay();
  if (!state.location || !day) return null;
  return computeRecommendationState(state.location, state.selectedDate, day);
}
