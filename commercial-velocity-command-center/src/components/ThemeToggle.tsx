"use client";

import { useEffect, useState } from "react";

const KEY = "cvcc.theme";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (window.localStorage.getItem(KEY) as Theme | null) ?? "dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(KEY, next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-[var(--border)] bg-[var(--panelSolid)] px-3 py-2 text-xs font-semibold text-[var(--text)] hover:opacity-90"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
