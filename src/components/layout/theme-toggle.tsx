"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-10 h-10" />;

  const themeIcons: Record<string, any> = {
    light: Sun,
    dark: Moon,
    "solarized-light": Palette,
    "solarized-dark": Monitor,
  };

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(theme || "light");
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = themeIcons[theme as string] || Sun;

  return (
    <button
      onClick={cycleTheme}
      className="tap-target rounded-full hover:bg-muted relative group overflow-hidden"
      aria-label="Toggle theme"
    >
      <Icon className="w-5 h-5 text-foreground transition-transform group-hover:rotate-12" />
    </button>
  );
}
