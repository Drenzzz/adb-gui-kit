import React, { useState, useRef, useEffect } from "react";
import { RunShellCommand, RunAdbHostCommand, RunFastbootHostCommand } from "../../../wailsjs/go/backend/App";

import type { HistoryEntry } from "../MainLayout";
import { ShellTerminalCard } from "@/components/shell/ShellTerminalCard";

interface ViewShellProps {
  activeView: string;
  history: HistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  commandHistory: string[];
  setCommandHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

const MAX_OUTPUT_HISTORY = 500;
const MAX_COMMAND_HISTORY = 100;

function limitHistory<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

export function ViewShell({ activeView, history, setHistory, commandHistory, setCommandHistory }: ViewShellProps) {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(commandHistory.length);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCommand(commandHistory[newIndex] || "");
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newIndex = Math.min(commandHistory.length, historyIndex + 1);
      setHistoryIndex(newIndex);

      if (newIndex === commandHistory.length) {
        setCommand("");
      } else {
        setCommand(commandHistory[newIndex]);
      }
      return;
    }

    if (e.key !== "Enter" || isLoading || command.trim() === "") {
      return;
    }

    e.preventDefault();
    const trimmedCommand = command.trim();

    if (commandHistory[commandHistory.length - 1] !== trimmedCommand) {
      setCommandHistory((prev) => limitHistory([...prev, trimmedCommand], MAX_COMMAND_HISTORY));
    }
    setHistoryIndex(commandHistory.length + 1);

    setIsLoading(true);
    setCommand("");

    const commandEntry: HistoryEntry = { type: "command", text: trimmedCommand };
    const newHistory = limitHistory([...history, commandEntry], MAX_OUTPUT_HISTORY);
    setHistory(newHistory);

    try {
      let result = "";
      if (trimmedCommand.startsWith("adb shell ")) {
        const shellCmd = trimmedCommand.substring(10).trim();
        if (shellCmd) result = await RunShellCommand(shellCmd);
        else throw new Error("Usage: adb shell <command...>");
      } else if (trimmedCommand.startsWith("adb ")) {
        const hostCmd = trimmedCommand.substring(4).trim();
        if (hostCmd) result = await RunAdbHostCommand(hostCmd);
        else throw new Error("Usage: adb <command...>");
      } else if (trimmedCommand.startsWith("fastboot ")) {
        const fastbootCmd = trimmedCommand.substring(9).trim();
        if (fastbootCmd) result = await RunFastbootHostCommand(fastbootCmd);
        else throw new Error("Usage: fastboot <command...>");
      } else {
        throw new Error(`Unknown command: "${trimmedCommand}".`);
      }
      const resultEntry: HistoryEntry = { type: "result", text: result.trim() || "(No output)" };
      setHistory((prev) => limitHistory([...prev, resultEntry], MAX_OUTPUT_HISTORY));
    } catch (err) {
      const error = err as Error;
      const errorEntry: HistoryEntry = { type: "error", text: error.message };
      setHistory((prev) => limitHistory([...prev, errorEntry], MAX_OUTPUT_HISTORY));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLog = () => {
    setHistory([]);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.children[0] as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [history]);

  useEffect(() => {
    if (!isLoading) {
      document.getElementById("shell-input")?.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory.length]);

  const handleCommandChange = (value: string) => {
    setCommand(value);
    setHistoryIndex(commandHistory.length);
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col gap-4">
      <ShellTerminalCard command={command} onCommandChange={handleCommandChange} onKeyDown={handleKeyDown} isLoading={isLoading} history={history} onClearLog={handleClearLog} scrollAreaRef={scrollAreaRef} />
    </div>
  );
}
