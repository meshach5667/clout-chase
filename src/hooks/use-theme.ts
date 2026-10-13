import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getResolvedTheme,
  getStoredTheme,
  subscribeToThemeChange,
  type ThemeMode,
} from "@/lib/theme";

export function useTheme() {
  const mode = useSyncExternalStore(
    subscribeToThemeChange,
    getStoredTheme,
    () => "dark" as ThemeMode,
  );

  const resolved = getResolvedTheme(mode);

  return {
    theme: mode,
    resolvedTheme: resolved,
    setTheme: (newMode: ThemeMode) => applyTheme(newMode),
  };
}
