"use client";

// Knapp for å bytte mellom lys og mørk modus
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Bytt til lys modus" : "Bytt til mørk modus"}
      className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-stone-700 transition-colors text-base leading-none cursor-pointer"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
