import React, { useState, useRef, useEffect } from 'react';
import { 
  RunShellCommand, 
  RunAdbHostCommand, 
  RunFastbootHostCommand 
} from '../../../wailsjs/go/backend/App';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const handleClearLog = () => {
    setOutputHistory([]);
  };

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
      let result = "";
      
      if (trimmedCommand.startsWith("adb shell ")) {
        const shellCmd = trimmedCommand.substring(10).trim();
        if (shellCmd) {
          result = await RunShellCommand(shellCmd);
        } else {
          throw new Error("Usage: adb shell <command...>");
        }

      } else if (trimmedCommand.startsWith("adb ")) {
        const hostCmd = trimmedCommand.substring(4).trim();
        if (hostCmd) {
          result = await RunAdbHostCommand(hostCmd);
        } else {
          throw new Error("Usage: adb <command...>");
        }

      } else if (trimmedCommand.startsWith("fastboot ")) {
        const fastbootCmd = trimmedCommand.substring(9).trim();
        if (fastbootCmd) {
          result = await RunFastbootHostCommand(fastbootCmd);
        } else {
          throw new Error("Usage: fastboot <command...>");
        }
      
      } else {
        throw new Error(`Unknown command: "${trimmedCommand}".`);
      }

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
      const viewport = scrollAreaRef.current.children[0] as HTMLDivElement;
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Terminal />
              Universal Terminal
            </CardTitle>
            <CardDescription>
              Run 'adb', 'adb shell', or 'fastboot' commands directly.
            </CardDescription>
          </div>
          
          <Button
            variant="destructive"
            size="sm"
            className="ml-4"
            onClick={handleClearLog}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Log
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0 gap-4 overflow-hidden">
          
          <ScrollArea className="flex-1 bg-muted/50 rounded-md border" ref={scrollAreaRef}>
            <div className="p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {outputHistory.length === 0 ? (
                  <span className="text-muted-foreground">
                    Welcome. Type your command below.\nExamples:\n  adb devices\n  adb shell ls /sdcard/\n  fastboot devices
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
          </ScrollArea>

          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-primary" />
            <Input 
              id="shell-input"
              placeholder="Type command... (e.g., adb devices, adb shell ls, fastboot devices)"
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
