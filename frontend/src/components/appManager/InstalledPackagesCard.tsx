import React from "react";
import { backend } from "../../../wailsjs/go/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  Eye,
  EyeOff,
  List,
  Loader2,
  MoreHorizontal,
  Eraser,
} from "lucide-react";

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
              Showing {visiblePackages.length} of {totalPackages} packages on the
              device.
            </CardDescription>
          </div>
          <Input
            placeholder="Search package name..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
            Source: {filterLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
            Status: {statusLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
            Sort: {sortLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-card/80">
          <ScrollArea className="max-h-[60vh] overflow-auto">
            <div className="min-w-[640px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) =>
                          onToggleSelectAll(Boolean(checked))
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingList ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : visiblePackages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        No packages match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visiblePackages.map((pkg) => {
                      const isSelected = selectedPackages.includes(
                        pkg.PackageName
                      );
                      const isBusy =
                        isTogglingPackageName === pkg.PackageName ||
                        isPullingPackageName === pkg.PackageName;

                      return (
                        <TableRow
                          key={pkg.PackageName}
                          data-state={
                            isSelected
                              ? "selected"
                              : !pkg.IsEnabled
                              ? "disabled"
                              : ""
                          }
                          className="hover:bg-muted/40"
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                onSelectPackage(pkg.PackageName, Boolean(checked))
                              }
                              aria-label="Select row"
                            />
                          </TableCell>
                          <TableCell>
                            {pkg.IsEnabled ? (
                              <span className="flex items-center text-emerald-500">
                                <Eye className="mr-2 h-4 w-4" />
                                Enabled
                              </span>
                            ) : (
                              <span className="flex items-center text-muted-foreground">
                                <EyeOff className="mr-2 h-4 w-4" />
                                Disabled
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {pkg.PackageName}
                          </TableCell>
                          <TableCell className="text-right">
                            {isBusy ? (
                              <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => onTogglePackage(pkg)}
                                  >
                                    {pkg.IsEnabled ? (
                                      <EyeOff className="mr-2 h-4 w-4" />
                                    ) : (
                                      <Eye className="mr-2 h-4 w-4" />
                                    )}
                                    {pkg.IsEnabled ? "Disable" : "Enable"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onPullApk(pkg)}
                                  >
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
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
