"use client";

import React, { useState } from "react";
import "@/styles/global.css";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Box,
  FolderOpen,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { ViewDashboard } from "./views/ViewDashboard";
import { ViewAppManager } from "./views/ViewAppManager";
import { ViewFileExplorer } from "./views/ViewFileExplorer";
import { ViewFlasher } from "./views/ViewFlasher";
import { ViewUtilities } from "./views/ViewUtilities";
import { Toaster } from "@/components/ui/sonner";

import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "./ThemeProvider";

const VIEWS = {
  DASHBOARD: "dashboard",
  APPS: "apps",
  FILES: "files",
  FLASHER: "flasher",
  UTILS: "utils",
} as const;

type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const navButtonClass =
  "w-full text-base transition-colors duration-200 hover:bg-muted/70 dark:hover:bg-muted/30";

export function MainLayout() {
  const [activeView, setActiveView] = useState<ViewType>(VIEWS.DASHBOARD);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navIconClass = cn(
    "h-4 w-4 transition-all duration-200",
    !isCollapsed && "mr-2"
  );

  const renderActiveView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <ViewDashboard activeView={activeView} />;
      case VIEWS.APPS:
        return <ViewAppManager activeView={activeView} />;
      case VIEWS.FILES:
        return <ViewFileExplorer activeView={activeView} />;
      case VIEWS.FLASHER:
        return <ViewFlasher activeView={activeView} />;
      case VIEWS.UTILS:
        return <ViewUtilities activeView={activeView} />;
      default:
        return <ViewDashboard activeView={activeView} />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={0}>
        <div className="relative flex h-screen bg-background text-foreground overflow-hidden">
          <aside
            className={cn(
              "flex flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[72px]" : "w-64"
            )}
          >
            <div
              className={cn(
                "flex-1 flex flex-col",
                isCollapsed ? "p-2" : "p-4"
              )}
            >
              <div
                className={cn(
                  "mb-6 flex h-10 items-center px-2",
                  isCollapsed && "justify-center px-1"
                )}
              >
                <img
                  src="/logo.png"
                  alt="ADB Kit logo"
                  className={cn(
                    "h-8 w-8 object-contain transition-all duration-300 ease-in-out",
                    isCollapsed && "h-9 w-9"
                  )}
                />
                <h2
                  className={cn(
                    "ml-2 text-xl font-bold transition-opacity duration-200",
                    isCollapsed ? "w-0 opacity-0" : "opacity-100"
                  )}
                >
                  ADB Kit
                </h2>
              </div>

              <nav className="flex flex-col space-y-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === VIEWS.DASHBOARD ? "default" : "ghost"}
                      className={cn(
                        navButtonClass,
                        isCollapsed ? "justify-center px-0" : "justify-start px-3"
                      )}
                      onClick={() => setActiveView(VIEWS.DASHBOARD)}
                    >
                      <LayoutDashboard className={navIconClass} />
                      <span className={cn(isCollapsed && "hidden")}>Dashboard</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Dashboard</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === VIEWS.APPS ? "default" : "ghost"}
                      className={cn(
                        navButtonClass,
                        isCollapsed ? "justify-center px-0" : "justify-start px-3"
                      )}
                      onClick={() => setActiveView(VIEWS.APPS)}
                    >
                      <Box className={navIconClass} />
                      <span className={cn(isCollapsed && "hidden")}>Application</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Application</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === VIEWS.FILES ? "default" : "ghost"}
                      className={cn(
                        navButtonClass,
                        isCollapsed ? "justify-center px-0" : "justify-start px-3"
                      )}
                      onClick={() => setActiveView(VIEWS.FILES)}
                    >
                      <FolderOpen className={navIconClass} />
                      <span className={cn(isCollapsed && "hidden")}>File</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">File</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === VIEWS.FLASHER ? "default" : "ghost"}
                      className={cn(
                        navButtonClass,
                        isCollapsed ? "justify-center px-0" : "justify-start px-3"
                      )}
                      onClick={() => setActiveView(VIEWS.FLASHER)}
                    >
                      <Terminal className={navIconClass} />
                      <span className={cn(isCollapsed && "hidden")}>Flasher</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Flasher</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeView === VIEWS.UTILS ? "default" : "ghost"}
                      className={cn(
                        navButtonClass,
                        isCollapsed ? "justify-center px-0" : "justify-start px-3"
                      )}
                      onClick={() => setActiveView(VIEWS.UTILS)}
                    >
                      <Settings className={navIconClass} />
                      <span className={cn(isCollapsed && "hidden")}>Utility</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Utility</TooltipContent>
                </Tooltip>
              </nav>
            </div>

            <div
              className={cn(
                "mt-auto border-t border-border/40",
                isCollapsed ? "p-2" : "p-4"
              )}
            >
              <ThemeToggle isCollapsed={isCollapsed} />
            </div>
          </aside>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "absolute z-10 h-7 w-7 rounded-full p-0 transition-all duration-300 ease-in-out",
                  "top-16 -translate-y-1/2",
                  isCollapsed ? "left-[calc(72px-14px)]" : "left-[calc(256px-14px)]"
                )}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand" : "Collapse"}
            </TooltipContent>
          </Tooltip>

          <main className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pageVariants}
                transition={{ duration: 0.2 }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
