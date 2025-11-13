"use client";

import React, { useState, useEffect } from "react";
import "@/styles/global.css";
import {
  LayoutDashboard,
  Box,
  FolderOpen,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
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
import { WelcomeScreen } from "./WelcomeScreen";
import { ViewShell } from './views/ViewShell';

const VIEWS = {
  DASHBOARD: "dashboard",
  APPS: "apps",
  FILES: "files",
  FLASHER: "flasher",
  UTILS: "utils",
  SHELL: 'shell',
} as const;

type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const LOADING_DURATION = 750;

export type HistoryEntry = {
  type: 'command' | 'result' | 'error';
  text: string;
};

const NAV_ITEMS = [
  { id: VIEWS.DASHBOARD, icon: LayoutDashboard, label: "Dashboard" },
  { id: VIEWS.APPS, icon: Box, label: "Application" },
  { id: VIEWS.FILES, icon: FolderOpen, label: "File" },
  { id: VIEWS.FLASHER, icon: Terminal, label: "Flasher" },
  { id: VIEWS.UTILS, icon: Settings, label: "Utility" },
  { id: VIEWS.SHELL, icon: Terminal, label: "Terminal" },
];

export function MainLayout() {
  const [activeView, setActiveView] = useState<ViewType>(VIEWS.DASHBOARD);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shellHistory, setShellHistory] = useState<HistoryEntry[]>([]);
  const [shellCommandHistory, setShellCommandHistory] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
      case VIEWS.SHELL:
        return (
          <ViewShell 
            activeView={activeView} 
            history={shellHistory}
            setHistory={setShellHistory}
            commandHistory={shellCommandHistory}
            setCommandHistory={setShellCommandHistory}
          />
        );
      default:
        return <ViewDashboard activeView={activeView} />;
    }
  };  

  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;

    const tick = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }
      const elapsed = timestamp - startTime;
      const nextProgress = Math.min(
        100,
        (elapsed / LOADING_DURATION) * 100
      );
      setProgress(nextProgress);

      if (elapsed < LOADING_DURATION) {
        animationFrame = requestAnimationFrame(tick);
      } else {
        setIsLoading(false);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={0}>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-50" 
            >
              <WelcomeScreen progress={progress} />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={cn(
            "relative flex h-screen bg-background text-foreground overflow-hidden",
            isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500 ease-in-out"
          )}
        >
          <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex flex-col bg-gradient-to-b from-muted/50 via-muted/30 to-background border-r border-border/50 backdrop-blur-xl"
          >
            <div
              className={cn(
                "relative h-20 flex items-center border-b border-border/50 gap-3",
                isCollapsed ? "px-0 justify-center" : "pl-6 pr-4 justify-between"
              )}
            >
              <motion.div 
                className={cn("flex items-center gap-3", !isCollapsed && "w-full")}
                animate={{ justifyContent: isCollapsed ? "center" : "flex-start" }}
              >
                <div className={cn("relative", isCollapsed && "mx-auto")}>
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
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
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        ADBKit
                      </h1>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              {!isCollapsed && (
                <ThemeToggle
                  showLabel={false}
                  className="ml-auto w-12 h-12 rounded-2xl border border-border/60 p-0"
                />
              )}
            </div>

            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveView(item.id)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "relative w-full rounded-xl transition-all duration-300 overflow-hidden group",
                          isCollapsed ? "h-12 p-0" : "h-12 px-4",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
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

                        <div className={cn(
                          "relative z-10 flex items-center h-full",
                          isCollapsed ? "justify-center" : "gap-3"
                        )}>
                          <Icon className={cn(
                            "transition-all duration-300",
                            isActive ? "h-5 w-5" : "h-[18px] w-[18px]"
                          )} />
                          
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="font-medium text-[15px]"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground/30 rounded-r-full" />
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
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    "absolute -right-4 top-1/2 -translate-y-1/2 z-20",
                    "h-8 w-8 rounded-2xl",
                    "bg-background border border-border shadow-md",
                    "flex items-center justify-center",
                    "hover:bg-muted transition-all duration-200",
                    "hover:shadow-lg hover:border-primary/30"
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

          <main className="flex-1 overflow-auto custom-scroll">
            <div className="min-h-full p-6">
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
            </div>
          </main>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  );
}
