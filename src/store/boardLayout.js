/**
 * Mobile-first board fit with iPhone 16 Pro as the primary design target.
 *
 * iPhone 16 Pro CSS viewport (portrait): 402 × 874 logical px
 * Dynamic Island safe-area handled via env() in CSS + DOM inset measurement.
 */

export const MOBILE_PORTRAIT_MAX_WIDTH = 430;
export const MOBILE_LAYOUT_MAX_WIDTH = 768;

/** Primary layout reference device — 100% token scale at this width */
export const IPHONE_16_PRO = {
  width: 402,
  height: 874,
  minTokenPx: 56,
  minNameFontPx: 15,
  maxTokenAdjust: 14,
};

/** Portrait token scale: 250% on narrow screens → 100% at iPhone 16 Pro width+ */
export const PORTRAIT_TOKEN_SCALE = {
  max: 2.5,
  min: 1.0,
  narrowWidth: 320,
  referenceWidth: IPHONE_16_PRO.width,
};

/**
 * Portrait default token multiplier (2.5 at ≤320px → 1.0 at ≥402px, linear).
 */
export function getPortraitTokenScale(width) {
  const { max, min, narrowWidth, referenceWidth } = PORTRAIT_TOKEN_SCALE;
  if (width <= narrowWidth) return max;
  if (width >= referenceWidth) return min;
  const t = (width - narrowWidth) / (referenceWidth - narrowWidth);
  return Math.round((max + t * (min - max)) * 100) / 100;
}

export function isPortraitLayout(width, height) {
  return height >= width;
}

/**
 * All portrait (tall/narrow) layouts use iPhone 16 Pro as the design reference.
 */
export function getMobileProfile(width, height) {
  if (!isPortraitLayout(width, height)) return "landscape";
  return "iphone16pro";
}

export function applyLayoutProfileClass(width, height) {
  if (typeof document === "undefined") return;
  const portrait = isPortraitLayout(width, height);
  document.documentElement.classList.toggle("layout-portrait", portrait);
  document.documentElement.classList.toggle(
    "layout-iphone16pro",
    portrait,
  );
}

export function portraitMinTokenPx(width) {
  const scale = Math.min(1.1, Math.max(0.82, width / IPHONE_16_PRO.width));
  return Math.round(IPHONE_16_PRO.minTokenPx * scale);
}

export function seatBaseSize(playerCount) {
  if (playerCount < 7) return 18;
  if (playerCount <= 10) return 16;
  if (playerCount <= 15) return 14;
  return 12;
}

export function getViewportSize() {
  if (typeof window === "undefined") {
    return { width: IPHONE_16_PRO.width, height: IPHONE_16_PRO.height };
  }
  const vv = window.visualViewport;
  return {
    width: vv ? vv.width : window.innerWidth,
    height: vv ? vv.height : window.innerHeight,
  };
}

function unitPx(unit, width, height) {
  return unit === "vw" ? width / 100 : height / 100;
}

function tokenDiameterPx(base, unit, width, height) {
  return base * unitPx(unit, width, height);
}

/**
 * Estimate chrome that overlaps the seat circle within #townsquare.
 */
export function measureBoardInsets() {
  const insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (typeof document === "undefined") return insets;

  const ts = document.querySelector("#townsquare");
  if (!ts) return insets;

  const tsRect = ts.getBoundingClientRect();

  const consider = (el, sides) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    if (r.bottom < tsRect.top + 8 || r.top > tsRect.bottom - 8) return;

    if (sides.includes("left") && r.left <= tsRect.left + tsRect.width * 0.55) {
      insets.left = Math.max(insets.left, r.right - tsRect.left + 2);
    }
    if (
      sides.includes("right") &&
      r.right >= tsRect.left + tsRect.width * 0.45
    ) {
      insets.right = Math.max(insets.right, tsRect.right - r.left + 2);
    }
    if (sides.includes("top") && r.top <= tsRect.top + tsRect.height * 0.35) {
      insets.top = Math.max(insets.top, r.bottom - tsRect.top + 2);
    }
    if (
      sides.includes("bottom") &&
      r.bottom >= tsRect.top + tsRect.height * 0.6
    ) {
      insets.bottom = Math.max(insets.bottom, tsRect.bottom - r.top + 2);
    }
  };

  consider(document.querySelector(".left-panels"), ["left", "top"]);
  consider(document.querySelector("#controls"), ["right", "top"]);
  consider(document.querySelector("#townsquare > .bluffs:not(.closed)"), [
    "left",
    "bottom",
  ]);
  consider(document.querySelector("#townsquare > .fabled:not(.closed)"), [
    "right",
    "bottom",
  ]);
  consider(document.querySelector(".info"), ["top"]);

  return insets;
}

/**
 * Compute the largest circle arm and token size that still fit inside the board.
 * Optimizes for token size first (bigger role images), then arm length.
 */
export function computeBoardFit({
  boardWidth,
  boardHeight,
  playerCount,
  zoom = 0,
  unit = "vw",
  insets = { left: 0, right: 0, top: 0, bottom: 0 },
  edgeMargin = 2,
  profile = "iphone16pro",
  viewportWidth = boardWidth,
}) {
  if (!playerCount || boardWidth <= 0 || boardHeight <= 0) {
    return { armPercent: 50, tokenAdjust: 0 };
  }

  const cx = boardWidth / 2;
  const cy = boardHeight / 2;

  const isPortrait = profile === "iphone16pro";
  const portraitScale = isPortrait ? getPortraitTokenScale(viewportWidth) : 1;
  const minArm = isPortrait ? 30 : 28;
  const nameClearanceRatio = isPortrait ? 0.26 : 0.22;
  const minTokenPx = isPortrait
    ? portraitMinTokenPx(viewportWidth) * portraitScale
    : 48;
  const maxAdjust = isPortrait ? IPHONE_16_PRO.maxTokenAdjust : 12;
  const margin = isPortrait ? 3 : edgeMargin;
  const baseSize = seatBaseSize(playerCount) + zoom;

  function scaledTokenVw(base) {
    return base * portraitScale;
  }

  function armForTokenBase(base) {
    const tokenPx = tokenDiameterPx(
      scaledTokenVw(base),
      unit,
      boardWidth,
      boardHeight,
    );
    const half = tokenPx / 2;
    const nameClearance = tokenPx * nameClearanceRatio;

    const maxRFromLeft = cx - insets.left - margin - half;
    const maxRFromRight = boardWidth - cx - insets.right - margin - half;
    const maxRWidth = Math.max(0, Math.min(maxRFromLeft, maxRFromRight));

    const maxRFromTop = cy - insets.top - margin - tokenPx - nameClearance;
    const maxRFromBottom = boardHeight - cy - insets.bottom - margin - half;
    const maxRHeight = Math.max(0, Math.min(maxRFromTop, maxRFromBottom));

    const maxRadiusPx = Math.min(maxRWidth, maxRHeight);
    return Math.min(50, (maxRadiusPx / boardHeight) * 100);
  }

  let best = { armPercent: 50, tokenAdjust: 0, score: 0 };

  for (let adjust = -4; adjust <= maxAdjust; adjust += 0.5) {
    const base = baseSize + adjust;
    if (base < 8) continue;

    const tokenPx = tokenDiameterPx(
      scaledTokenVw(base),
      unit,
      boardWidth,
      boardHeight,
    );
    if (tokenPx < minTokenPx) continue;

    const arm = armForTokenBase(base);
    if (arm < minArm) continue;

    const score = base * 1000 + arm;
    if (score > best.score) {
      best = {
        armPercent: Math.round(arm * 10) / 10,
        tokenAdjust: Math.round(adjust * 10) / 10,
        score,
      };
    }
  }

  if (best.score === 0) {
    let tokenAdjust = 0;
    let base = baseSize;
    let armPercent = armForTokenBase(base);
    while (armPercent < minArm && tokenAdjust > -10) {
      tokenAdjust -= 0.5;
      base = baseSize + tokenAdjust;
      armPercent = armForTokenBase(base);
    }
    return {
      armPercent: Math.round(Math.max(minArm, Math.min(50, armPercent)) * 10) / 10,
      tokenAdjust: Math.round(tokenAdjust * 10) / 10,
    };
  }

  return {
    armPercent: best.armPercent,
    tokenAdjust: best.tokenAdjust,
  };
}

export function shouldApplyMobileBoardFit(width, height) {
  return isPortraitLayout(width, height);
}

export function syncBoardLayout(store) {
  if (typeof window === "undefined" || !store) return;

  const { width, height } = getViewportSize();
  const profile = getMobileProfile(width, height);
  applyLayoutProfileClass(width, height);

  const playerCount = store.state.players?.players?.length || 0;
  const { zoom, unit, boardArm, boardTokenAdjust } = store.state.grimoire;

  if (!playerCount || !shouldApplyMobileBoardFit(width, height)) {
    if (boardArm !== 50 || boardTokenAdjust !== 0) {
      store.commit("setBoardArm", 50);
      store.commit("setBoardTokenAdjust", 0);
    }
    return;
  }

  const ts = document.querySelector("#townsquare");
  const boardWidth = ts ? ts.clientWidth : width;
  const boardHeight = ts ? ts.clientHeight : height;
  const insets = measureBoardInsets();
  const fit = computeBoardFit({
    boardWidth,
    boardHeight,
    playerCount,
    zoom,
    unit,
    insets,
    profile,
    viewportWidth: width,
  });

  if (boardArm !== fit.armPercent) {
    store.commit("setBoardArm", fit.armPercent);
  }
  if (boardTokenAdjust !== fit.tokenAdjust) {
    store.commit("setBoardTokenAdjust", fit.tokenAdjust);
  }
}

export function bindBoardLayoutSync(store) {
  if (typeof window === "undefined" || !store) return () => {};

  let frame = null;
  let observer = null;

  const run = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = null;
      syncBoardLayout(store);
    });
  };

  window.addEventListener("resize", run);
  window.addEventListener("orientationchange", run);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", run);
    window.visualViewport.addEventListener("scroll", run);
  }

  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(run);
    const panels = document.querySelector(".left-panels");
    if (panels) observer.observe(panels);
    const ts = document.querySelector("#townsquare");
    if (ts) observer.observe(ts);
  }

  run();

  const unsubscribe = store.subscribe(mutation => {
    const type = mutation.type;
    if (
      type.startsWith("players/") ||
      type === "setZoom" ||
      type === "setUnit"
    ) {
      run();
    }
  });

  return () => {
    unsubscribe();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("resize", run);
    window.removeEventListener("orientationchange", run);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", run);
      window.visualViewport.removeEventListener("scroll", run);
    }
    if (observer) observer.disconnect();
  };
}
