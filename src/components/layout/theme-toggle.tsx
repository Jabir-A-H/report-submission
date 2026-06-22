"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const themeOptions = [
  {
    id: "light",
    label: "লাইট",
    icon: Sun,
    bg: "bg-[hsl(220,33%,98%)]",
    fg: "border-[hsl(190,90%,40%)]",
    dot: "bg-[hsl(190,90%,40%)]",
  },
  {
    id: "dark",
    label: "ডার্ক",
    icon: Moon,
    bg: "bg-[hsl(222,47%,11%)]",
    fg: "border-[hsl(190,90%,45%)]",
    dot: "bg-[hsl(190,90%,45%)]",
  },
  {
    id: "solarized-light",
    label: "সোলার",
    icon: Palette,
    bg: "bg-[hsl(44,87%,94%)]",
    fg: "border-[hsl(175,59%,40%)]",
    dot: "bg-[hsl(175,59%,40%)]",
  },
  {
    id: "solarized-dark",
    label: "সো. ডার্ক",
    icon: Palette,
    bg: "bg-[hsl(192,100%,13%)]",
    fg: "border-[hsl(175,59%,40%)]",
    dot: "bg-[hsl(175,59%,40%)]",
  },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* eslint-disable-next-line react-hooks/set-state-in-effect */
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-[72px]" />;

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {themeOptions.map((t) => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg transition-all duration-200 group",
              isActive
                ? "bg-primary/10 ring-1.5 ring-primary/40"
                : "hover:bg-muted/60"
            )}
            aria-label={`Theme: ${t.id}`}
          >
            {/* Preview swatch */}
            <div
              className={cn(
                "w-8 h-5 rounded-md border-2 flex items-center justify-center transition-transform",
                t.bg,
                isActive ? t.fg : "border-border",
                !isActive && "group-hover:scale-105"
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-opacity",
                  t.dot,
                  isActive ? "opacity-100" : "opacity-40"
                )}
              />
            </div>
            <span
              className={cn(
                "text-[9px] font-bold leading-none transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
