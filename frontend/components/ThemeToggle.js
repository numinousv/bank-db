import { useState, useEffect } from "react";

// dark mode = default. persists the choice in localStorage.
// Initial theme is read lazily (no mount-effect setState); the effect
// below only syncs the choice to the DOM (external system).
function readTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("theme");
  return saved === "light" || saved === "dark" ? saved : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle color theme"
    >
      Theme: {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
