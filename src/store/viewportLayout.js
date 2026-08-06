/**
 * GStone-style viewport unit: landscape → vh, portrait → vw.
 * Layout profile classes for LeftPanels default expanded state.
 */

export function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: 402, height: 874 };
  }
  const vv = window.visualViewport;
  return {
    width: vv ? vv.width : window.innerWidth,
    height: vv ? vv.height : window.innerHeight,
  };
}

export function isPortraitLayout(width, height) {
  return height >= width;
}

export function applyLayoutProfileClass(width, height) {
  if (typeof document === "undefined") return;
  const portrait = isPortraitLayout(width, height);
  document.documentElement.classList.toggle("layout-portrait", portrait);
  document.documentElement.classList.toggle("layout-landscape", !portrait);
  // Drop legacy class from v2.19 iPhone typography overrides
  document.documentElement.classList.remove("layout-iphone16pro");
}

export function seatBaseSize(playerCount) {
  if (playerCount < 7) return 18;
  if (playerCount <= 10) return 16;
  if (playerCount <= 15) return 14;
  return 12;
}

export function resolveViewportUnit(
  width = typeof window !== "undefined" ? window.innerWidth : 1024,
  height = typeof window !== "undefined" ? window.innerHeight : 768,
) {
  return width > height ? "vh" : "vw";
}

export function syncViewportUnit(store) {
  if (typeof window === "undefined" || !store) return;
  const { width, height } = getViewportSize();
  applyLayoutProfileClass(width, height);
  const unit = resolveViewportUnit(width, height);
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
