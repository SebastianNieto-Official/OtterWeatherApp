const VIEWS = ["details", "home", "info"];
const listeners = new Set();
let currentView = "home";

function viewSection(view) {
  return document.getElementById(`view-${view}`);
}

function navBtn(view) {
  return document.getElementById(`nav-${view}`);
}

export function getCurrentView() {
  return currentView;
}

export function onViewChange(callback) {
  listeners.add(callback);
}

export function navigate(view) {
  if (!VIEWS.includes(view) || view === currentView) {
    if (!VIEWS.includes(view)) return;
  }

  VIEWS.forEach((v) => {
    const section = viewSection(v);
    const btn = navBtn(v);
    const isActive = v === view;
    if (section) section.hidden = !isActive;
    if (btn) {
      if (isActive) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    }
  });

  currentView = view;
  listeners.forEach((cb) => cb(view));
}

export function initRouter() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });
  navigate(currentView);
}
