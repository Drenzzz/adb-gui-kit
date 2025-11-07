import React, { useState, useRef, useEffect } from 'react';
import { RunShellCommand } from '../../../wailsjs/go/backend/App';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type HistoryEntry = {
  type: 'command' | 'result' | 'error';
  text: string;
};

export function ViewShell({ activeView }: { activeView: string }) {
  const [command, setCommand] = useState("");
  const [outputHistory, setOutputHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || isLoading || command.trim() === "") {
      return;
    }

    e.preventDefault();
    const trimmedCommand = command.trim();
    
    setIsLoading(true);
    setCommand("");
    
    const newHistory: HistoryEntry[] = [
      ...outputHistory,
      { type: 'command', text: trimmedCommand },
    ];
    setOutputHistory(newHistory);
    
    try {
      const result = await RunShellCommand(trimmedCommand);
      setOutputHistory([
        ...newHistory,
        { type: 'result', text: result.trim() || "(No output)" },
      ]);
    } catch (err) {
      const error = err as Error;
      setOutputHistory([
        ...newHistory,
        { type: 'error', text: error.message },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.children[1] as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [outputHistory]);

  useEffect(() => {
    if (!isLoading) {
      document.getElementById('shell-input')?.focus();
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-4"> 
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Shell Terminal
          </CardTitle>
          <CardDescription>
            Run custom `adb shell` commands directly. This is not an interactive TTY (e.g., 'nano' will not work).
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0 gap-4 overflow-hidden">
          
          <ScrollArea className="flex-1 bg-muted/50 rounded-md border" ref={scrollAreaRef}>
            <div className="p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {outputHistory.length === 0 ? (
                  <span className="text-muted-foreground">
                    Welcome to ADB Shell. Type a command and press Enter.
                  </span>
                ) : (
                  outputHistory.map((entry, index) => (
                    <div key={index} className="flex gap-2">
                      <span className={cn(
                        "flex-shrink-0",
                        entry.type === 'command' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {entry.type === 'command' ? '$' : '>'}
                      </span>
                      <span className={cn(
                        entry.type === 'error' && 'text-destructive'
                      )}>
                        {entry.text}
                      </span>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing...</span>
                  </div>
                )}
              </pre>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-primary" />
            <Input 
              id="shell-input"
              placeholder="Type your command here (e.g., ls /sdcard/)"
              className="font-mono"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
