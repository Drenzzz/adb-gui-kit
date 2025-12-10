import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { backend } from "../../../wailsjs/go/models";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Eye, EyeOff, List, Loader2, MoreHorizontal, Eraser } from "lucide-react";

type PackageInfo = backend.PackageInfo;

interface InstalledPackagesCardProps {
  visiblePackages: PackageInfo[];
  totalPackages: number;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterLabel: string;
  statusLabel: string;
  sortLabel: string;
  isLoadingList: boolean;
  allVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onSelectPackage: (packageName: string, checked: boolean) => void;
  onTogglePackage: (pkg: PackageInfo) => void;
  onPullApk: (pkg: PackageInfo) => void;
  onRequestClearData: (pkg: PackageInfo) => void;
  selectedPackages: string[];
  isTogglingPackageName: string;
  isPullingPackageName: string;
}

const ROW_HEIGHT = 48;

export function InstalledPackagesCard({
  visiblePackages,
  totalPackages,
  searchTerm,
  onSearchTermChange,
  filterLabel,
  statusLabel,
  sortLabel,
  isLoadingList,
  allVisibleSelected,
  onToggleSelectAll,
  onSelectPackage,
  onTogglePackage,
  onPullApk,
  onRequestClearData,
  selectedPackages,
  isTogglingPackageName,
  isPullingPackageName,
}: InstalledPackagesCardProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: visiblePackages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <Card className="flex flex-col overflow-hidden border border-border/60 shadow-xl">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <List className="h-5 w-5 text-primary" />
              Installed Packages
            </CardTitle>
            <CardDescription>
              Showing {visiblePackages.length} of {totalPackages} packages on the device.
            </CardDescription>
          </div>
          <Input placeholder="Search package name..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} className="w-full md:w-64" />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">Source: {filterLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">Status: {statusLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">Sort: {sortLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-card/80">
          <div className="min-w-[640px]">
            <div className="sticky top-0 z-10 flex bg-background/95 backdrop-blur border-b">
              <div className="flex items-center justify-center w-[50px] h-10 px-4">
                <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))} aria-label="Select all" />
              </div>
              <div className="flex items-center w-[110px] h-10 px-4 text-sm font-medium text-muted-foreground">Status</div>
              <div className="flex-1 flex items-center h-10 px-4 text-sm font-medium text-muted-foreground">Package Name</div>
              <div className="flex items-center justify-end w-[120px] h-10 px-4 text-sm font-medium text-muted-foreground">Actions</div>
            </div>

            <div ref={parentRef} className="max-h-[60vh] overflow-auto custom-scroll">
              {isLoadingList ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : visiblePackages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">No packages match your filters.</div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualRows.map((virtualRow) => {
                    const pkg = visiblePackages[virtualRow.index];
                    const isSelected = selectedPackages.includes(pkg.PackageName);
                    const isBusy = isTogglingPackageName === pkg.PackageName || isPullingPackageName === pkg.PackageName;

                    return (
                      <div
                        key={pkg.PackageName}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className={`absolute top-0 left-0 w-full flex items-center border-b hover:bg-muted/40 ${isSelected ? "bg-muted/20" : ""} ${!pkg.IsEnabled ? "opacity-60" : ""}`}
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="flex items-center justify-center w-[50px] px-4">
                          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectPackage(pkg.PackageName, Boolean(checked))} aria-label="Select row" />
                        </div>
                        <div className="flex items-center w-[110px] px-4">
                          {pkg.IsEnabled ? (
                            <span className="flex items-center text-emerald-500 text-sm">
                              <Eye className="mr-2 h-4 w-4" />
                              Enabled
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground text-sm">
                              <EyeOff className="mr-2 h-4 w-4" />
                              Disabled
                            </span>
                          )}
                        </div>
                        <div className="flex-1 px-4 font-mono text-sm truncate">{pkg.PackageName}</div>
                        <div className="flex items-center justify-end w-[120px] px-4">
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onTogglePackage(pkg)}>
                                  {pkg.IsEnabled ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                  {pkg.IsEnabled ? "Disable" : "Enable"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPullApk(pkg)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Pull APK
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRequestClearData(pkg)}>
                                  <Eraser className="mr-2 h-4 w-4" />
                                  Clear Data
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
