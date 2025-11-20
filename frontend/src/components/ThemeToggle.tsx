import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className, isCollapsed, showLabel = true }: { className?: string; isCollapsed?: boolean; showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldShowLabel = showLabel && !isCollapsed;

  if (!mounted) {
    return (
      <Button variant="ghost" className={cn("text-base transition-colors duration-200 hover:bg-muted/70 dark:hover:bg-muted/30", shouldShowLabel ? "justify-start" : "justify-center px-0", className)} disabled>
        <Sun className={cn("h-4 w-4", shouldShowLabel && "mr-2")} />
        {shouldShowLabel && <span>Loading...</span>}
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const iconClass = cn("h-4 w-4", shouldShowLabel && "mr-2");

  return (
    <Button variant="ghost" onClick={toggleTheme} className={cn("text-base transition-colors duration-200 hover:bg-muted/70 dark:hover:bg-muted/30", shouldShowLabel ? "justify-start" : "justify-center px-0", className)}>
      {isDark ? <Sun className={iconClass} /> : <Moon className={iconClass} />}
      {shouldShowLabel && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );
}
