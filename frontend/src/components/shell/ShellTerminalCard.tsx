import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/components/MainLayout";

interface ShellTerminalCardProps {
  command: string;
  onCommandChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  history: HistoryEntry[];
  onClearLog: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export function ShellTerminalCard({ command, onCommandChange, onKeyDown, isLoading, history, onClearLog, scrollAreaRef }: ShellTerminalCardProps) {
  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Universal Terminal
          </CardTitle>
          <CardDescription>Run 'adb', 'adb shell', or 'fastboot' commands directly.</CardDescription>
        </div>

        <Button variant="destructive" size="sm" className="ml-4" onClick={onClearLog}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Log
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
        <ScrollArea className="flex-1 rounded-md border bg-muted/50" ref={scrollAreaRef}>
          <div className="p-4">
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">
              {history.length === 0 ? (
                <span className="text-muted-foreground">
                  Welcome. Type your command below.
                  {"\n"}Examples:
                  {"\n"} adb devices
                  {"\n"} adb shell ls /sdcard/
                  {"\n"} fastboot devices
                </span>
              ) : (
                history.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <span className={cn("flex-shrink-0", entry.type === "command" ? "text-primary" : "text-muted-foreground")}>{entry.type === "command" ? "$" : ">"}</span>
                    <span className={cn(entry.type === "error" && "text-destructive")}>{entry.text}</span>
                  </div>
                ))
              )}
            </pre>
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-primary" />
          <Input
            placeholder="Type command... (e.g., adb devices, adb shell ls, fastboot devices)"
            className="font-mono"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            autoFocus
          />
        </div>
      </CardContent>
    </Card>
  );
}
