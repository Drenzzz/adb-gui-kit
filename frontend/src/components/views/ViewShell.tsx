import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Terminal, ChevronRight } from "lucide-react";
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
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && command.trim() !== "") {
      const trimmedCommand = command.trim();
      
      const newHistory: HistoryEntry[] = [
        ...outputHistory,
        { type: 'command', text: trimmedCommand },
      ];

      newHistory.push({
        type: 'result',
        text: `Coming Soon.`,
      });

      setOutputHistory(newHistory);
      setCommand("");
      e.preventDefault();
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

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] gap-4"> 
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Shell Terminal
          </CardTitle>
          <CardDescription>
            Run a custom `adb shell` or adb `bla bla bla` command.).
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0 gap-4 overflow-hidden">
          
          <ScrollArea className="flex-1 bg-muted/50 rounded-md border" ref={scrollAreaRef}>
            <div className="p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {outputHistory.length === 0 ? (
                  <span className="text-muted-foreground">
                    Welcome to ADB Shell. Type command and press Enter.
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
              </pre>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>

          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-primary" />
            <Input 
              placeholder="Type your command here (ex: ls /sdcard/)"
              className="font-mono"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
