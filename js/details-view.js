// Details screen: location controls, day picker, selected-day forecast,
// hourly weather/precipitation, and the animation toggle.

import * as app from "./app.js";
import { describeWeatherCode, createWeatherIcon } from "./weathercodes.js";
import { localDateString, localHour } from "./tz.js";
import { setAnimationPaused } from "./motion.js";

function formatDayLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatHourLabel(hour) {
  const period = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${period}`;
}

function renderDayPicker(state) {
  const container = document.getElementById("day-picker");
  const days = state.forecast?.days ?? [];
  const buttons = Array.from(container.children);
  const sameDates = buttons.length === days.length &&
    buttons.every((btn, index) => btn.dataset.date === days[index].date);

  // Keep the focused button in the DOM when selection or weather changes.
  // Rebuilding the entire picker sends keyboard focus back to the page body.
  if (!sameDates) container.replaceChildren();

  days.forEach((day, index) => {
    const btn = sameDates ? buttons[index] : document.createElement("button");
    btn.type = "button";
    btn.className = "day-cell";
    btn.dataset.date = day.date;
    const isSelected = day.date === state.selectedDate;
    btn.setAttribute("aria-pressed", String(isSelected));

    const hi = day.tempMaxF != null ? `${Math.round(day.tempMaxF)}°` : "--";
    const lo = day.tempMinF != null ? `${Math.round(day.tempMinF)}°` : "--";
    btn.setAttribute(
      "aria-label",
      `${formatDayLabel(day.date)}, ${describeWeatherCode(day.weatherCode).label}, high ${hi}, low ${lo}`
    );

    const label = document.createElement("span");
    label.className = "day-cell-label";
    label.textContent = formatDayLabel(day.date);

    const icon = createWeatherIcon(day.weatherCode, "day-cell-icon");

    btn.replaceChildren(label, icon);
    if (!sameDates) {
      btn.addEventListener("click", () => app.selectDate(day.date));
      container.appendChild(btn);
    }
  });
}

function renderHourlyRow(state) {
  const container = document.getElementById("hourly-row");
  container.innerHTML = "";

  const day = app.getSelectedDay();
  if (!day || !state.location) return;

  const isToday = state.selectedDate === localDateString(state.location.timezone);
  const nowHour = isToday ? localHour(state.location.timezone) : null;

  day.hours.forEach((hourData) => {
    const cell = document.createElement("div");
    cell.className = "hour-cell";
    const isNow = hourData.hour === nowHour;
    if (isNow) cell.classList.add("is-now");

    const timeLabel = document.createElement("span");
    timeLabel.textContent = formatHourLabel(hourData.hour);

    const temp = document.createElement("span");
    temp.textContent = hourData.tempF != null ? `${Math.round(hourData.tempF)}°` : "--";

    cell.append(timeLabel, temp);
    cell.setAttribute(
      "aria-label",
      `${formatHourLabel(hourData.hour)}${isNow ? ", now" : ""}, ${temp.textContent}`
    );
    container.appendChild(cell);
  });
}

function renderLocationError(state) {
  const errorEl = document.getElementById("location-error");
  if (state.fieldError) {
    errorEl.textContent = state.fieldError;
    errorEl.hidden = false;
  } else {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
}

function renderSelectedDayPanel(state) {
  const panel = document.getElementById("selected-day-panel");

  const day = app.getSelectedDay();
  if (!day) {
    panel.classList.remove("visible");
    return;
  }

  panel.classList.add("visible");
  document.getElementById("selected-day-label").textContent = formatDayLabel(day.date);

  const hi = day.tempMaxF != null ? `${Math.round(day.tempMaxF)}°` : "--";
  const lo = day.tempMinF != null ? `${Math.round(day.tempMinF)}°` : "--";
  document.getElementById("selected-day-temps").textContent = `${hi} / ${lo}`;

  const weatherEl = document.getElementById("selected-day-weather");
  weatherEl.textContent = "";
  weatherEl.append(createWeatherIcon(day.weatherCode, "weather-icon"), describeWeatherCode(day.weatherCode).label);
}

function renderPrecipChart(state) {
  const container = document.getElementById("precip-chart");
  container.innerHTML = "";

  const day = app.getSelectedDay();
  if (!day) return;

  const maxPrecip = Math.max(...day.hours.map((h) => h.precipProb || 0), 1);
  const isToday = state.location && state.selectedDate === localDateString(state.location.timezone);
  const nowHour = isToday ? localHour(state.location.timezone) : null;

  day.hours.forEach((hourData) => {
    const col = document.createElement("div");
    col.className = "precip-col";
    if (hourData.hour === nowHour) col.classList.add("is-now");

    const bar = document.createElement("div");
    bar.className = "precip-bar";
    const precip = hourData.precipProb || 0;
    bar.style.height = `${(precip / maxPrecip) * 100}%`;
    bar.setAttribute("aria-label", `${precip}% precipitation at ${formatHourLabel(hourData.hour)}`);
    col.appendChild(bar);
    container.appendChild(col);
  });
}

// Home's status line is hidden while Details is open, so Details has its own
// loading message (Requirement 28: announced via role="status", focus stays put).
function renderLoadingStatus(state) {
  document.getElementById("details-status").hidden = !state.loading;
  document.getElementById("details-status-spinner").hidden = !state.loading;
  document.getElementById("details-status-text").textContent = state.loading ? "Loading forecast…" : "";
}

function render(state) {
  renderLoadingStatus(state);
  renderDayPicker(state);
  renderLocationError(state);
  renderSelectedDayPanel(state);
  renderHourlyRow(state);
  renderPrecipChart(state);
}

export function initDetailsView() {
  const form = document.getElementById("location-form");
  const cityInput = document.getElementById("input-city");
  const stateInput = document.getElementById("input-state");
  const useMyLocationBtn = document.getElementById("btn-use-my-location");
  const clearLocationBtn = document.getElementById("btn-clear-location");
  const pauseToggle = document.getElementById("toggle-pause-animation");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    app.submitManualLocation(cityInput.value, stateInput.value);
  });

  useMyLocationBtn.addEventListener("click", () => {
    app.useMyLocation();
  });

  clearLocationBtn.addEventListener("click", () => {
    cityInput.value = "";
    stateInput.value = "";
    app.clearSavedLocation();
  });

  pauseToggle.addEventListener("change", () => {
    setAnimationPaused(pauseToggle.checked);
  });

  app.onChange(render);
  render(app.getState());
}
