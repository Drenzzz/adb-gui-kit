import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDownAZ,
  ArrowUp,
  ArrowUpAZ,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type ExplorerActionItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
};

interface ExplorerStats {
  totalItems: number;
  folderCount: number;
  fileCount: number;
}

interface ExplorerOverviewCardProps {
  explorerStats: ExplorerStats;
  selectedCount: number;
  currentPath: string;
  isBusy: boolean;
  isLoading: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortField: "name" | "date" | "size";
  onSortFieldChange: (value: "name" | "date" | "size") => void;
  sortDirection: "asc" | "desc";
  onToggleSortDirection: () => void;
  onBack: () => void;
  canGoBack: boolean;
  onRefresh: () => void;
  actionItems: ExplorerActionItem[];
}

export function ExplorerOverviewCard({
  explorerStats,
  selectedCount,
  currentPath,
  isBusy,
  isLoading,
  searchTerm,
  onSearchTermChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onToggleSortDirection,
  onBack,
  canGoBack,
  onRefresh,
  actionItems,
}: ExplorerOverviewCardProps) {
  return (
    <Card className="border border-border/60 bg-card/90 shadow-xl">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">File Explorer</CardTitle>
            <p className="text-sm text-muted-foreground">
              Browse device storage, move files, and manage folders without leaving this screen.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 md:w-auto">
            {[
              { label: "Items", value: explorerStats.totalItems },
              { label: "Folders", value: explorerStats.folderCount },
              { label: "Files", value: explorerStats.fileCount },
              { label: "Selected", value: selectedCount },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-center md:text-left"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                disabled={!canGoBack || isBusy}
                aria-label="Go up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isBusy}
                aria-label="Refresh"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="min-w-[220px] flex-1 rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current path
              </p>
              <p className="font-mono text-sm break-all">{currentPath}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files or folders..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) =>
                  onSortFieldChange(e.target.value as "name" | "date" | "size")
                }
                className="h-9 min-w-[150px] rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleSortDirection}
                aria-label="Toggle sort direction"
              >
                {sortDirection === "asc" ? (
                  <ArrowUpAZ className="h-4 w-4" />
                ) : (
                  <ArrowDownAZ className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {selectedCount === 0
              ? "Select items to enable rename, export, or delete actions."
              : `${selectedCount} item${
                  selectedCount > 1 ? "s" : ""
                } selected.`}
          </p>
          <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
            {actionItems.map((action) => (
              <Button
                key={action.key}
                variant={action.variant ?? "outline"}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mt-3 w-full justify-between">
                  Actions
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {actionItems.map((action) => (
                  <DropdownMenuItem
                    key={action.key}
                    disabled={action.disabled}
                    onClick={() => {
                      if (!action.disabled) action.onClick();
                    }}
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
