import React, { useState } from 'react';
import "@/styles/global.css";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Box, 
  FolderOpen, 
  Terminal, 
  Settings 
} from "lucide-react";

import { ViewDashboard } from './views/ViewDashboard';
import { ViewAppManager } from './views/ViewAppManager';
import { ViewFileExplorer } from './views/ViewFileExplorer';
import { ViewFlasher } from './views/ViewFlasher';
import { ViewUtilities } from './views/ViewUtilities';

const VIEWS = {
  DASHBOARD: 'dashboard',
  APPS: 'apps',
  FILES: 'files',
  FLASHER: 'flasher',
  UTILS: 'utils',
};

export function MainLayout() {
  const [activeView, setActiveView] = useState(VIEWS.DASHBOARD);

  const renderActiveView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return <ViewDashboard />;
      case VIEWS.APPS:
        return <ViewAppManager />;
      case VIEWS.FILES:
        return <ViewFileExplorer />;
      case VIEWS.FLASHER:
        return <ViewFlasher />;
      case VIEWS.UTILS:
        return <ViewUtilities />;
      default:
        return <ViewDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      
      <aside className="w-64 border-r bg-muted/40 p-4">
        
        <div className="mb-6 flex items-center px-2">
          <Terminal className="mr-2 h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">ADB Kit</h2>
        </div>
        
        <nav className="flex flex-col space-y-1">
          <Button 
            variant={activeView === VIEWS.DASHBOARD ? "secondary" : "ghost"}
            className="justify-start text-base"
            onClick={() => setActiveView(VIEWS.DASHBOARD)}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant={activeView === VIEWS.APPS ? "secondary" : "ghost"}
            className="justify-start text-base"
            onClick={() => setActiveView(VIEWS.APPS)}
          >
            <Box className="mr-2 h-4 w-4" />
            Application
          </Button>
          <Button 
            variant={activeView === VIEWS.FILES ? "secondary" : "ghost"}
            className="justify-start text-base"
            onClick={() => setActiveView(VIEWS.FILES)}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            File
          </Button>
          <Button 
            variant={activeView === VIEWS.FLASHER ? "secondary" : "ghost"}
            className="justify-start text-base"
            onClick={() => setActiveView(VIEWS.FLASHER)}
          >
            <Terminal className="mr-2 h-4 w-4" />
            Flasher
          </Button>
          <Button 
            variant={activeView === VIEWS.UTILS ? "secondary" : "ghost"}
            className="justify-start text-base"
            onClick={() => setActiveView(VIEWS.UTILS)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Utility
          </Button>
        </nav>
      </aside>
      
      <main className="flex-1 p-6 overflow-auto">
        {renderActiveView()}
      </main>
      
    </div>
  );
}
