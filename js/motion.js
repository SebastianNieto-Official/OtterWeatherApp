// Manual "Pause character animation" control (Requirement 24). The
// automatic prefers-reduced-motion stop lives entirely in CSS
// (css/styles.css); this only handles the explicit user toggle, which is
// never persisted (research.md: the pause setting resets on reload).

// Set on <html> so every otter (Home and the no-location overlay) obeys it.
export function setAnimationPaused(paused) {
  document.documentElement.classList.toggle("motion-paused", paused);
}
