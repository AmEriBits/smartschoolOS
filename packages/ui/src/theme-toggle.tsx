"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const activeTheme = document.documentElement.dataset.theme;
    if (activeTheme === "light" || activeTheme === "dark") {
      setTheme(activeTheme);
    }
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("smartschools-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "dark"}
      className="ss-theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      type="button"
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
        {theme === "dark" ? (
          <path d="M16.2 12.1A6.7 6.7 0 0 1 7.9 3.8 6.8 6.8 0 1 0 16.2 12Z" />
        ) : (
          <>
            <circle cx="10" cy="10" r="3.3" />
            <path d="M10 1.8v1.5m0 13.4v1.5m8.2-8.2h-1.5M3.3 10H1.8m14-5.8-1.1 1.1M5.3 14.7l-1.1 1.1m11.6 0-1.1-1.1M5.3 5.3 4.2 4.2" />
          </>
        )}
      </svg>
    </button>
  );
}
