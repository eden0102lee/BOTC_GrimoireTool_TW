/**
 * GStone-style viewport unit: landscape → vh, portrait → vw.
 * Keeps the seat circle sized to the shorter axis on each orientation.
 */

export function resolveViewportUnit(
  width = typeof window !== "undefined" ? window.innerWidth : 1024,
  height = typeof window !== "undefined" ? window.innerHeight : 768,
) {
  return width > height ? "vh" : "vw";
}

export function syncViewportUnit(store) {
  if (typeof window === "undefined" || !store) return;
  const unit = resolveViewportUnit(
    window.visualViewport ? window.visualViewport.width : window.innerWidth,
    window.visualViewport ? window.visualViewport.height : window.innerHeight,
  );
  if (store.state.grimoire.unit !== unit) {
    store.commit("setUnit", unit);
  }
}

export function bindViewportUnitSync(store) {
  if (typeof window === "undefined" || !store) return () => {};

  let frame = null;
  const handler = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      syncViewportUnit(store);
    });
  };

  window.addEventListener("resize", handler);
  window.addEventListener("orientationchange", handler);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);
  }

  syncViewportUnit(store);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("resize", handler);
    window.removeEventListener("orientationchange", handler);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", handler);
      window.visualViewport.removeEventListener("scroll", handler);
    }
  };
}
