"use client";

import React, { useState, useEffect } from "react";
import "@/styles/global.css";
import {
  LayoutDashboard,
  Box,
  FolderOpen,
  Terminal,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

import { ViewDashboard } from "./views/ViewDashboard";
import { ViewAppManager } from "./views/ViewAppManager";
import { ViewFileExplorer } from "./views/ViewFileExplorer";
import { ViewFlasher } from "./views/ViewFlasher";
import { ViewUtilities } from "./views/ViewUtilities";
import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "./ThemeProvider";
import { ViewShell } from './views/ViewShell';
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LoadingOverlay } from "@/components/layout/LoadingOverlay";

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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shellHistory, setShellHistory] = useState<HistoryEntry[]>([]);
  const [shellCommandHistory, setShellCommandHistory] = useState<string[]>([]);

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
        <LoadingOverlay isLoading={isLoading} progress={progress} />
        <div
          className={cn(
            "relative flex h-screen bg-background text-foreground overflow-hidden",
            isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500 ease-in-out"
          )}
        >
          <AppSidebar
            navItems={NAV_ITEMS}
            activeView={activeView}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            onSelectView={(id) => setActiveView(id as ViewType)}
          />

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
