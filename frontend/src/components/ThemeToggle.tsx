import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  isCollapsed,
}: {
  className?: string;
  isCollapsed?: boolean;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "justify-start text-base transition-colors duration-200 hover:bg-muted/70 dark:hover:bg-muted/30",
          className,
          isCollapsed && "justify-center px-0"
        )}
        disabled
      >
        <Sun className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
        <span className={cn(isCollapsed && "hidden")}>Loading...</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const iconClass = cn("h-4 w-4", !isCollapsed && "mr-2");

  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      className={cn(
        "justify-start text-base transition-colors duration-200 hover:bg-muted/70 dark:hover:bg-muted/30",
        className,
        isCollapsed && "justify-center px-0"
      )}
    >
      {isDark ? (
        <Sun className={iconClass} />
      ) : (
        <Moon className={iconClass} />
      )}
      <span className={cn(isCollapsed && "hidden")}>
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </Button>
  );
}
