import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, EyeOff, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickControlSelect {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  activeValue: string;
}

interface AppManagerQuickControlsCardProps {
  quickControlSelects: QuickControlSelect[];
  selectedCount: number;
  isBusy: boolean;
  onEnableSelected: () => void;
  onDisableSelected: () => void;
  onUninstallSelected: () => void;
  onClearSelection: () => void;
  onResetFilters: () => void;
}

export function AppManagerQuickControlsCard({ quickControlSelects, selectedCount, isBusy, onEnableSelected, onDisableSelected, onUninstallSelected, onClearSelection, onResetFilters }: AppManagerQuickControlsCardProps) {
  return (
    <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
      <CardHeader>
        <CardTitle>Quick controls</CardTitle>
        <CardDescription>Adjust filters or batch actions without leaving the table.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          {quickControlSelects.map((config) => (
            <div key={config.label} className="flex-1">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{config.label}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {config.value}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {config.options.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => config.onSelect(option.value)} className={cn(option.value === config.activeValue && "font-semibold text-primary")}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30 p-4">
          <p className="text-sm font-semibold text-foreground">{selectedCount} selected</p>
          <p className="text-xs text-muted-foreground">{selectedCount === 0 ? "Pick packages from the table to enable bulk actions." : "Use the buttons below to apply actions to the selected packages."}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={selectedCount === 0 || isBusy} onClick={onEnableSelected}>
            <Eye className="h-4 w-4" />
            Enable ({selectedCount})
          </Button>
          <Button variant="outline" size="sm" disabled={selectedCount === 0 || isBusy} onClick={onDisableSelected}>
            <EyeOff className="h-4 w-4" />
            Disable ({selectedCount})
          </Button>
          <Button variant="destructive" size="sm" disabled={selectedCount === 0 || isBusy} onClick={onUninstallSelected}>
            <Trash2 className="h-4 w-4" />
            Uninstall ({selectedCount})
          </Button>
          <Button variant="ghost" size="sm" disabled={selectedCount === 0} onClick={onClearSelection}>
            Clear selection
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Actions
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem disabled={selectedCount === 0 || isBusy} onClick={onEnableSelected}>
                <Eye className="mr-2 h-4 w-4" />
                Enable ({selectedCount})
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedCount === 0 || isBusy} onClick={onDisableSelected}>
                <EyeOff className="mr-2 h-4 w-4" />
                Disable ({selectedCount})
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedCount === 0 || isBusy} onClick={onUninstallSelected}>
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall ({selectedCount})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
