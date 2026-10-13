export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "cloutchase-theme";
const THEME_CHANGE_EVENT = "cloutchase-theme-change";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // fallback if localStorage is blocked
  }
  return "system";
}

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getResolvedTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const resolved = getResolvedTheme(mode);
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Also set color-scheme style for native scrollbars/inputs
  root.style.colorScheme = resolved;

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }

  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { detail: { mode, resolved } }),
  );
}

export function subscribeToThemeChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustom = () => callback();
  window.addEventListener(THEME_CHANGE_EVENT, handleCustom);

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMedia = () => {
    if (getStoredTheme() === "system") {
      applyTheme("system");
      callback();
    }
  };
  mediaQuery.addEventListener("change", handleMedia);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustom);
    mediaQuery.removeEventListener("change", handleMedia);
  };
}
