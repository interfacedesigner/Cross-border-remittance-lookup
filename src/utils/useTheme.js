import { useState, useCallback, useEffect } from "react";
import { getColors } from "../styles/theme";

const STORAGE_KEY = "app-theme";

function detectTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [mode, setModeState] = useState(detectTheme);

  const setMode = useCallback((m) => {
    const next = m === "dark" ? "dark" : "light";
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const c = getColors(mode);
  return { mode, setMode, toggle, c };
}
