"use client";

import { useEffect } from "react";

export default function ThemeToggle() {
  useEffect(() => {
    const saved = window.localStorage.getItem("mocktest-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = saved === "dark" || saved === "light" ? saved : preferred;
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("mocktest-theme", next);
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle light and dark mode" title="Toggle theme">
      <span className="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
      <span className="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
    </button>
  );
}
