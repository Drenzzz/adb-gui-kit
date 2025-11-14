import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronLeft } from "lucide-react";

export type SidebarNavItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

interface AppSidebarProps {
  navItems: SidebarNavItem[];
  activeView: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectView: (id: string) => void;
}

export function AppSidebar({
  navItems,
  activeView,
  isCollapsed,
  onToggleCollapse,
  onSelectView,
}: AppSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col border-r border-border/50 bg-gradient-to-b from-muted/50 via-muted/30 to-background backdrop-blur-xl"
    >
      <div
        className={cn(
          "relative flex h-20 items-center gap-3 border-b border-border/50",
          isCollapsed ? "justify-center px-0" : "justify-between pl-6 pr-4"
        )}
      >
        <motion.div
          className={cn("flex items-center gap-3", !isCollapsed && "w-full")}
          animate={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
        >
          <div className={cn("relative", isCollapsed && "mx-auto")}>
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <img
              src="/logo.png"
              alt="ADBKit logo"
              className={cn(
                "relative h-10 w-10 object-contain transition-all duration-300",
                isCollapsed && "h-11 w-11"
              )}
            />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold text-transparent">
                  ADBKit
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        {!isCollapsed && (
          <ThemeToggle
            showLabel={false}
            className="ml-auto h-12 w-12 rounded-2xl border border-border/60 p-0"
          />
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectView(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-xl transition-all duration-300",
                    isCollapsed ? "h-12 p-0" : "h-12 px-4",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  {hoveredItem === item.id && !isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5"
                    />
                  )}

                  <div
                    className={cn(
                      "relative z-10 flex h-full items-center",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}
                  >
                    <Icon
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "h-5 w-5" : "h-[18px] w-[18px]"
                      )}
                    />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-[15px] font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/30" />
                  )}
                </motion.button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onToggleCollapse}
            className={cn(
              "absolute -right-4 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-2xl border border-border bg-background shadow-md transition-all duration-200",
              "hover:border-primary/30 hover:bg-muted hover:shadow-lg"
            )}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isCollapsed ? "Expand" : "Collapse"}
        </TooltipContent>
      </Tooltip>
    </motion.aside>
  );
}
