import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "hc";

const KEY = "ct-theme";

function apply(theme: Theme) {
  const r = document.documentElement;
  r.classList.toggle("dark", theme !== "light");
  r.classList.toggle("hc", theme === "hc");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const t = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
      setThemeState(t);
      apply(t);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* ignore */
    }
    // Notify diagram renderer to re-init mermaid theme
    window.dispatchEvent(new CustomEvent("ct-theme-change", { detail: t }));
  }, []);

  const cycle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "hc" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, cycle };
}
