/**
 * CrazyGames portal integration.
 *
 * Loads the CrazyGames SDK when the game is running inside their iframe (or when
 * ?portal=crazygames is passed for local testing) and exposes a tiny, safe API.
 * Every call is a no-op when the SDK is absent, so the game runs identically on
 * our own site.
 *
 * Docs: https://docs.crazygames.com/sdk/html5-v3/
 */

type Sdk = {
  init: () => Promise<void>;
  game: {
    gameplayStart: () => void;
    gameplayStop: () => void;
    happytime: () => void;
    loadingStart: () => void;
    loadingStop: () => void;
  };
  ad: {
    requestAd: (
      type: "midgame" | "rewarded",
      callbacks: {
        adFinished?: () => void;
        adError?: (e: unknown) => void;
        adStarted?: () => void;
      },
    ) => void;
  };
};

declare global {
  interface Window {
    CrazyGames?: { SDK?: Sdk };
  }
}

const SDK_URL = "https://sdk.crazygames.com/crazygames-sdk-v3.js";

let sdk: Sdk | null = null;
let initPromise: Promise<void> | null = null;
let gameplayActive = false;

/** True when we should talk to the portal at all. */
export function isPortalBuild() {
  if (typeof window === "undefined") return false;
  const forced = new URLSearchParams(window.location.search).get("portal");
  if (forced === "crazygames") return true;
  if (forced === "off") return false;
  // Inside an iframe on a crazygames domain.
  try {
    return window.self !== window.top && /crazygames/i.test(document.referrer);
  } catch {
    return window.self !== window.top;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk load failed")));
      if (window.CrazyGames?.SDK) resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("sdk load failed"));
    document.head.appendChild(el);
  });
}

/** Load + initialise the SDK. Resolves even if the portal isn't available. */
export function initPortal(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!isPortalBuild()) return;
    try {
      await loadScript(SDK_URL);
      const candidate = window.CrazyGames?.SDK;
      if (!candidate) return;
      await candidate.init();
      sdk = candidate;
    } catch {
      sdk = null;
    }
  })();
  return initPromise;
}

export function loadingStart() {
  try {
    sdk?.game.loadingStart();
  } catch {
    /* ignore */
  }
}

export function loadingStop() {
  try {
    sdk?.game.loadingStop();
  } catch {
    /* ignore */
  }
}

/** Call whenever the player regains control (start, resume, respawn). */
export function gameplayStart() {
  if (!sdk || gameplayActive) return;
  gameplayActive = true;
  try {
    sdk.game.gameplayStart();
  } catch {
    /* ignore */
  }
}

/** Call whenever control is taken away (pause, menu, death screen, ad). */
export function gameplayStop() {
  if (!sdk || !gameplayActive) return;
  gameplayActive = false;
  try {
    sdk.game.gameplayStop();
  } catch {
    /* ignore */
  }
}

/** Positive beat — shrine lit, boss felled, skill unlocked. */
export function happytime() {
  try {
    sdk?.game.happytime();
  } catch {
    /* ignore */
  }
}

const AD_COOLDOWN_MS = 3 * 60 * 1000;
let lastAdAt = 0;

/**
 * Show a midgame ad at a natural break (respawn), respecting the portal's
 * "don't spam the player" guidance with a local cooldown. Resolves once the ad
 * finished or immediately when no ad can be shown.
 */
export function requestMidgameAd(): Promise<void> {
  return new Promise((resolve) => {
    const now = Date.now();
    if (!sdk || now - lastAdAt < AD_COOLDOWN_MS) {
      resolve();
      return;
    }
    lastAdAt = now;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      gameplayStart();
      resolve();
    };
    try {
      gameplayStop();
      sdk.ad.requestAd("midgame", {
        adFinished: done,
        adError: done,
      });
      // Safety net: never leave the player stuck if the portal goes quiet.
      window.setTimeout(done, 45_000);
    } catch {
      done();
    }
  });
}

/** True when a rewarded ad could plausibly be shown (portal present). */
export function canShowRewarded() {
  return sdk !== null;
}

/**
 * Show a rewarded ad. Resolves true only when the ad actually finished, so the
 * caller can grant the reward (a revive). Resolves false on error/no portal.
 */
export function requestRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!sdk) {
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      gameplayStart();
      resolve(ok);
    };
    try {
      gameplayStop();
      sdk.ad.requestAd("rewarded", {
        adFinished: () => finish(true),
        adError: () => finish(false),
      });
      window.setTimeout(() => finish(false), 60_000);
    } catch {
      finish(false);
    }
  });
}
