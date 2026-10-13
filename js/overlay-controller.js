// Decides which overlay (if any) should be showing, from app state +
// current view, and wires each overlay's actions back into app/router.
// Precedence: a geolocation error, then a service error, then (Home only,
// Requirement 5) no resolved location. A partial/missing-data issue never
// reaches this module - that stays inline (Requirement 29, checkpoint 9).

import * as app from "./app.js";
import * as router from "./router.js";
import { showOverlay, hideOverlay, isOpen } from "./overlay.js";

const GEOLOCATION_MESSAGES = {
  denied: {
    heading: "Location permission denied",
    body:
      "Your browser blocked access to your location. Enable location access for this site in your browser's settings, then try again, or enter your location manually.",
  },
  unavailable: {
    heading: "Location unavailable",
    body: "We couldn't determine your location right now. Try again, or enter your location manually.",
  },
  timeout: {
    heading: "Location request timed out",
    body: "Finding your location took too long. Try again, or enter your location manually.",
  },
};

function focusCityInput() {
  // Deferred a tick so the just-navigated Details view is visible (not
  // display:none) before focus moves, which browsers otherwise ignore.
  setTimeout(() => {
    document.getElementById("input-city")?.focus();
  }, 0);
}

function goToDetailsAndFocusCity() {
  router.navigate("details");
  focusCityInput();
}

function computeDesiredOverlay(state, view) {
  if (state.geolocationError) {
    return { kind: "geolocation-error", ...GEOLOCATION_MESSAGES[state.geolocationError.code] };
  }

  if (state.serviceError) {
    const body =
      state.serviceError.source === "geocode"
        ? "We couldn't look up that location right now."
        : "We couldn't load the forecast right now.";
    return { kind: "service-error", heading: "Something went wrong", body };
  }

  if (view === "home" && !state.location) {
    return {
      kind: "no-location",
      heading: "No location yet",
      body: "Pick a US city to get today's otter-approved outfit.",
    };
  }

  return null;
}

function buildActions(kind) {
  if (kind === "no-location") {
    return [
      {
        label: "Choose location",
        primary: true,
        onClick: () => {
          hideOverlay();
          currentKind = null;
          goToDetailsAndFocusCity();
        },
      },
    ];
  }

  if (kind === "service-error") {
    return [
      { label: "Retry", primary: true, onClick: () => app.retryServiceError() },
      {
        label: "Change location",
        onClick: () => {
          app.dismissServiceError();
          hideOverlay();
          currentKind = null;
          goToDetailsAndFocusCity();
        },
      },
    ];
  }

  // geolocation-error
  return [
    {
      label: "Enter location manually",
      primary: true,
      onClick: () => {
        app.dismissGeolocationError();
        hideOverlay();
        currentKind = null;
        goToDetailsAndFocusCity();
      },
    },
  ];
}

let currentKind = null;

function sync() {
  const desired = computeDesiredOverlay(app.getState(), router.getCurrentView());

  if (!desired) {
    if (isOpen()) hideOverlay();
    currentKind = null;
    return;
  }

  // Already showing the right kind (e.g. a "Retry" in flight) - leave the
  // open dialog and its focus alone.
  if (desired.kind === currentKind) return;
  currentKind = desired.kind;

  showOverlay({
    heading: desired.heading,
    body: desired.body,
    actions: buildActions(desired.kind),
    showOtter: desired.kind === "no-location",
  });
}

export function initOverlayController() {
  app.onChange(sync);
  router.onViewChange(sync);
  sync();
}
