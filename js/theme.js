// Day/night appearance (Requirements 38-40). The app is light between the
// selected location's sunrise and sunset and dark otherwise, switching by
// itself while it is open. Two session-only settings on Details can override
// that; like the pause setting they are never stored (Requirement 33).

import * as app from "./app.js";
import { localDateTimeString } from "./tz.js";

const CHECK_EVERY_MS = 60 * 1000;

// "dark" or "light" for the location's current local time. Sunrise and sunset
// come from the forecast already fetched; with no location or no data the
// light theme is used. Which forecast day is selected does not matter.
export function themeFor(state, now = new Date()) {
  if (!state.location || !state.forecast) return "light";

  const nowLocal = localDateTimeString(state.location.timezone, now);
  const today = state.forecast.days.find((day) => day.date === nowLocal.slice(0, 10));
  if (!today || !today.sunrise || !today.sunset) return "light";

  // Same "YYYY-MM-DDTHH:MM" shape, so plain text comparison orders them.
  return nowLocal < today.sunrise || nowLocal >= today.sunset ? "dark" : "light";
}

const settings = { auto: true, manualDark: false };
let clock = () => new Date();

// Which theme is showing right now, given the settings.
function currentTheme() {
  if (settings.auto) return themeFor(app.getState(), clock());
  return settings.manualDark ? "dark" : "light";
}

export function applyTheme() {
  document.documentElement.dataset.theme = currentTheme();
}

// `getNow` lets a test supply a simulated time; the app itself uses the clock.
export function initTheme(getNow) {
  if (getNow) clock = getNow;

  const autoBox = document.getElementById("toggle-auto-theme");
  const manualRow = document.getElementById("theme-manual-row");
  const darkBox = document.getElementById("toggle-dark-mode");

  autoBox.addEventListener("change", () => {
    settings.auto = autoBox.checked;
    if (!settings.auto) {
      // Start from what is on screen, so unticking changes nothing by itself.
      settings.manualDark = document.documentElement.dataset.theme === "dark";
      darkBox.checked = settings.manualDark;
    }
    manualRow.hidden = settings.auto;
    applyTheme();
  });

  darkBox.addEventListener("change", () => {
    settings.manualDark = darkBox.checked;
    applyTheme();
  });

  app.onChange(applyTheme);
  setInterval(applyTheme, CHECK_EVERY_MS);
  applyTheme();
}
