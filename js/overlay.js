// Generic accessible modal-dialog overlay (Requirement 26): renders into
// #overlay-root as role="alertdialog", traps focus while open, and
// returns focus to whatever triggered it when closed. Content/actions are
// supplied by the caller (js/overlay-controller.js decides what to show).

const root = () => document.getElementById("overlay-root");

let returnFocusEl = null;
let keydownHandler = null;
let focusinHandler = null;

function getFocusable(container) {
  return Array.from(
    container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((el) => !el.disabled && el.offsetParent !== null);
}

export function isOpen() {
  return root().childElementCount > 0;
}

/**
 * @param {object} opts
 * @param {string} opts.heading
 * @param {string} opts.body
 * @param {Array<{label:string, onClick:Function, primary?:boolean}>} opts.actions
 * @param {boolean} [opts.showOtter]
 */
export function showOverlay({ heading, body, actions, showOtter }) {
  returnFocusEl = document.activeElement;

  const backdrop = document.createElement("div");
  backdrop.className = "overlay-backdrop";

  const dialog = document.createElement("div");
  dialog.className = "overlay-window";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "overlay-heading");
  dialog.setAttribute("aria-describedby", "overlay-body");
  dialog.tabIndex = -1;

  if (showOtter) {
    const otter = document.createElement("div");
    otter.className = "otter-art overlay-otter";
    otter.setAttribute("aria-hidden", "true");
    dialog.appendChild(otter);
  }

  const headingEl = document.createElement("h2");
  headingEl.id = "overlay-heading";
  headingEl.textContent = heading;

  const bodyEl = document.createElement("p");
  bodyEl.id = "overlay-body";
  bodyEl.textContent = body;

  const actionsEl = document.createElement("div");
  actionsEl.className = "overlay-actions";
  actions.forEach((action) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = action.primary ? "btn btn-primary" : "btn btn-secondary";
    btn.textContent = action.label;
    btn.addEventListener("click", action.onClick);
    actionsEl.appendChild(btn);
  });

  dialog.append(headingEl, bodyEl, actionsEl);
  backdrop.appendChild(dialog);
  root().innerHTML = "";
  root().appendChild(backdrop);

  dialog.focus();

  keydownHandler = (e) => {
    if (e.key !== "Tab") return;
    const focusable = getFocusable(dialog);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  focusinHandler = (e) => {
    if (!dialog.contains(e.target)) {
      dialog.focus();
    }
  };

  document.addEventListener("keydown", keydownHandler, true);
  document.addEventListener("focusin", focusinHandler, true);
}

export function hideOverlay() {
  if (!isOpen()) return;

  document.removeEventListener("keydown", keydownHandler, true);
  document.removeEventListener("focusin", focusinHandler, true);
  keydownHandler = null;
  focusinHandler = null;

  root().innerHTML = "";

  if (returnFocusEl && document.contains(returnFocusEl) && typeof returnFocusEl.focus === "function") {
    returnFocusEl.focus();
  } else {
    document.getElementById("main-content")?.focus();
  }
  returnFocusEl = null;
}
