// Home screen: otter + clothing layers, weather icon, written
// recommendation, reminders, and the packing checklist, all read from the
// single recommendation state (Requirement 13). The otter is a base image
// with one transparent SVG layer per garment/accessory stacked on top.

import * as app from "./app.js";
import { FOOTWEAR, ACCESSORIES } from "./content.js";
import { describeWeatherCode, createWeatherIcon } from "./weathercodes.js";
import { localDateString } from "./tz.js";

let lastChecklistKey = null;

function formatDisplayDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function renderStatus(state, recState) {
  const statusEl = document.getElementById("home-status");
  const spinnerEl = document.getElementById("home-status-spinner");
  const textEl = document.getElementById("home-status-text");

  if (state.loading) {
    statusEl.hidden = false;
    spinnerEl.hidden = false;
    textEl.textContent = "Loading forecast…";
    return;
  }

  if (recState && recState.missingFields.length > 0) {
    statusEl.hidden = false;
    spinnerEl.hidden = true;
    textEl.textContent = "Some weather data is unavailable for this forecast; related reminders are left out.";
    return;
  }

  statusEl.hidden = true;
  spinnerEl.hidden = true;
  textEl.textContent = "";
}

function renderHeader(state, recState) {
  const locationEl = document.getElementById("home-location");
  const dateEl = document.getElementById("home-date");
  const unitsSourceEl = document.getElementById("home-units-source");
  const dataSourceEl = document.getElementById("home-data-source");
  const badgeEl = document.getElementById("home-weather-badge");

  if (!state.location || !recState) {
    locationEl.textContent = "No location set";
    dateEl.textContent = "—";
    unitsSourceEl.textContent = "—";
    dataSourceEl.textContent = "—";
    badgeEl.textContent = "";
    return;
  }

  locationEl.textContent = state.location.state
    ? `${state.location.name}, ${state.location.state}`
    : state.location.name;

  const isToday = recState.date === localDateString(state.location.timezone);
  dateEl.textContent = `${isToday ? "Today" : "Forecast"} · ${formatDisplayDate(recState.date)}`;

  const day = app.getSelectedDay();
  const fmt = (t) => (t != null ? `${Math.round(t)}°F` : "--");
  unitsSourceEl.textContent = day ? `High ${fmt(day.tempMaxF)} · Low ${fmt(day.tempMinF)}` : "—";
  dataSourceEl.textContent = "Source: Open-Meteo";

  const { label } = describeWeatherCode(recState.weatherCode);
  badgeEl.textContent = "";
  badgeEl.append(createWeatherIcon(recState.weatherCode, "weather-icon"), label);
}

function renderRecommendationAndReminders(recState) {
  const recEl = document.getElementById("home-recommendation");
  const remindersEl = document.getElementById("home-reminders");
  remindersEl.innerHTML = "";

  if (!recState) {
    recEl.textContent = "—";
    return;
  }

  recEl.textContent = recState.recommendationText;

  recState.reminders.forEach((reminder) => {
    const li = document.createElement("li");
    li.dataset.reminderType = reminder.type;
    const icon = createReminderIcon(reminder.type);
    if (icon) li.append(icon);
    li.append(reminder.message);
    remindersEl.appendChild(li);
  });
}

// Umbrella and hydration use Lucide SVGs (CSS masks); poncho, hat and
// sunscreen use the generated PNG icons.
const LUCIDE_REMINDER_ICONS = { umbrella: "umbrella", hydration: "droplet" };
// (the jacket icons are standalone SVGs built from the otter's jacket and
// scarf layers: one with the scarf, one without).
const GENERATED_REMINDER_ICONS = {
  poncho: "reminder-poncho.png",
  hat: "reminder-hat.png",
  sunscreen: "reminder-sunscreen.png",
  jacket: "reminder-jacket-only.svg",
  jacketAndScarf: "reminder-jacket.svg",
};

function createReminderIcon(type) {
  if (GENERATED_REMINDER_ICONS[type]) {
    const img = document.createElement("img");
    img.className = "reminder-icon-img";
    img.src = `assets/art/${GENERATED_REMINDER_ICONS[type]}`;
    img.alt = "";
    return img;
  }
  if (!LUCIDE_REMINDER_ICONS[type]) return null;
  const span = document.createElement("span");
  span.className = `reminder-icon reminder-icon-${type}`;
  span.setAttribute("aria-hidden", "true");
  return span;
}

function renderWeekStrip(state) {
  const container = document.getElementById("week-strip");
  container.innerHTML = "";

  if (!state.forecast) return;

  state.forecast.days.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "week-strip-cell";
    if (day.date === state.selectedDate) cell.classList.add("is-selected");

    const label = document.createElement("span");
    label.textContent = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });

    const icon = createWeatherIcon(day.weatherCode, "weather-icon-small");

    const temps = document.createElement("span");
    const hi = day.tempMaxF != null ? `${Math.round(day.tempMaxF)}°` : "--";
    const lo = day.tempMinF != null ? `${Math.round(day.tempMinF)}°` : "--";
    temps.textContent = `${hi}/${lo}`;

    cell.append(label, icon, temps);
    container.appendChild(cell);
  });
}

// Stacking order matters: garments go on bottom-to-top, with the poncho
// under the scarf and hats/umbrella last. The base otter is the element's
// CSS background, so a missing outfit still shows the plain otter.
function outfitLayerIds(recState) {
  const { outfit, footwear, accessoryFlags } = recState;
  return [
    outfit.bottom.id,
    outfit.top.id,
    FOOTWEAR[footwear].id,
    outfit.jacket?.id,
    accessoryFlags.poncho && ACCESSORIES.poncho.id,
    outfit.scarf && ACCESSORIES.scarf.id,
    outfit.warmHat && ACCESSORIES.warmHat.id,
    accessoryFlags.sunHat && ACCESSORIES.sunHat.id,
    accessoryFlags.umbrella && ACCESSORIES.umbrella.id,
  ].filter(Boolean);
}

function renderOtter(recState) {
  const otterEl = document.getElementById("otter-art");
  otterEl.replaceChildren();

  if (!recState) {
    otterEl.setAttribute("aria-label", "");
    return;
  }

  otterEl.setAttribute("aria-label", recState.description);

  outfitLayerIds(recState).forEach((id) => {
    const img = document.createElement("img");
    img.className = "otter-layer";
    img.src = `assets/art/${id}.svg`;
    img.alt = "";
    otterEl.appendChild(img);
  });
}

function renderChecklist(recState) {
  const checklistEl = document.getElementById("checklist");
  const itemsEl = document.getElementById("checklist-items");

  if (!recState || recState.checklist.length === 0) {
    checklistEl.hidden = true;
    itemsEl.innerHTML = "";
    lastChecklistKey = null;
    return;
  }

  const key = `${recState.location.latitude},${recState.location.longitude}|${recState.date}|${recState.checklist.map((i) => `${i.type}:${i.label}`).join(",")}`;
  checklistEl.hidden = false;

  // Rebuild only when the day (or its checklist contents) actually changed,
  // so ticking an item (Requirement 15: in memory only) survives re-renders
  // triggered by unrelated state changes for the same day.
  if (key === lastChecklistKey) return;
  lastChecklistKey = key;

  itemsEl.innerHTML = "";
  recState.checklist.forEach((item) => {
    const li = document.createElement("li");
    const checkboxId = `checklist-${item.type}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = checkboxId;
    checkbox.dataset.itemType = item.type;

    const label = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = item.label;
    const icon = createReminderIcon(item.type);
    label.append(checkbox, ...(icon ? [icon] : []), labelText);

    li.append(label);
    itemsEl.appendChild(li);
  });
}

function render(state) {
  const recState = app.getRecommendationState();
  renderStatus(state, recState);
  renderHeader(state, recState);
  renderWeekStrip(state);
  renderRecommendationAndReminders(recState);
  renderOtter(recState);
  renderChecklist(recState);
}

export function initHomeView() {
  app.onChange(render);
  render(app.getState());
}
