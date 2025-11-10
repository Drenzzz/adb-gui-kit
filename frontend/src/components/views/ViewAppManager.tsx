import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { 
  SelectApkFile, 
  InstallPackage, 
  UninstallPackage, 
  ListInstalledPackages,
  BatchUninstallPackages,
  GetPackageDetail,
  UpdatePackageLabels
} from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Package, Trash2, FileUp, RefreshCw, ListChecks, Search, CheckSquare, Info, ExternalLink } from "lucide-react";

type PackageInfo = backend.PackageInfo;

export function ViewAppManager({ activeView }: { activeView: string }) {
  const [apkPath, setApkPath] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const [packageName, setPackageName] = useState('');
  const [isUninstalling, setIsUninstalling] = useState(false);

  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isBatchUninstalling, setIsBatchUninstalling] = useState(false);
  const [packageSearch, setPackageSearch] = useState('');
  const [includeSystemApps, setIncludeSystemApps] = useState(false);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailData, setDetailData] = useState<backend.PackageDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const filteredPackages = useMemo(() => {
    if (!packageSearch) return packageList;
    const term = packageSearch.toLowerCase();
    return packageList.filter((pkg) => 
      pkg.Name.toLowerCase().includes(term) ||
      (pkg.Label && pkg.Label.toLowerCase().includes(term)) ||
      (pkg.ApkPath || "").toLowerCase().includes(term)
    );
  }, [packageList, packageSearch]);

  const getDisplayName = (pkg: PackageInfo) => pkg.Label?.trim() || pkg.Name;
  const getInstallerLabel = (pkg: PackageInfo) => {
    const installer = (pkg.Installer || "").toLowerCase();
    if (installer === "" || installer === "unknown") return "Unknown";
    if (installer.includes("vending")) return "Google Play";
    if (installer.includes("fdroid")) return "F-Droid";
    if (installer.includes("izzy")) return "IzzyOnDroid";
    if (installer.includes("adb")) return "ADB";
    return pkg.Installer;
  };

  const getStoreLink = (pkgName: string) => `https://play.google.com/store/apps/details?id=${pkgName}`;

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setDetailData(null);
    setDetailError(null);
  };

  const openDetailDialog = async (pkgName: string) => {
    setDetailDialogOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await GetPackageDetail(pkgName);
      setDetailData(detail);
    } catch (error) {
      console.error("Failed to load package detail:", error);
      setDetailError(String(error));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadPackages = useCallback(async () => {
    setIsLoadingPackages(true);
    setLabelsLoaded(false);
    try {
      const packages = await ListInstalledPackages(includeSystemApps);
      setPackageList(packages);
      setSelectedPackages((prev) => {
        const next = new Set<string>();
        packages.forEach((pkg) => {
          if (prev.has(pkg.Name)) {
            next.add(pkg.Name);
          }
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to load packages:", error);
      toast.error("Failed to load packages", { description: String(error) });
    } finally {
      setIsLoadingPackages(false);
    }
  }, [includeSystemApps]);

  const loadLabels = async () => {
    if (packageList.length === 0 || isLoadingLabels) return;
    
    setIsLoadingLabels(true);
    const toastId = toast.loading("Loading user-friendly app names...");
    
    try {
      // Since UpdatePackageLabels might not be bound, reload packages with different approach
      const refreshedPackages = await ListInstalledPackages(includeSystemApps);
      
      // Force refresh to get any cached labels
      setPackageList(refreshedPackages);
      setLabelsLoaded(true);
      toast.success("App names refreshed!", { id: toastId });
    } catch (error) {
      console.error("Failed to load labels:", error);
      toast.error("Failed to load app names", { description: String(error), id: toastId });
    } finally {
      setIsLoadingLabels(false);
    }
  };

  useEffect(() => {
    if (activeView === 'apps') {
      loadPackages();
    }
  }, [activeView, includeSystemApps, loadPackages]);

  const togglePackageSelection = (pkgName: string) => {
    setSelectedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkgName)) {
        next.delete(pkgName);
      } else {
        next.add(pkgName);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedPackages((prev) => {
      const allVisibleSelected = filteredPackages.every((pkg) => prev.has(pkg.Name));
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredPackages.forEach((pkg) => next.delete(pkg.Name));
        return next;
      }
      const next = new Set(prev);
      filteredPackages.forEach((pkg) => next.add(pkg.Name));
      return next;
    });
  };

  const handleBatchUninstall = async () => {
    const packagesToRemove = Array.from(selectedPackages);
    if (packagesToRemove.length === 0) {
      toast.error("Select at least one package to uninstall.");
      return;
    }

    setIsBatchUninstalling(true);
    const toastId = toast.loading(`Uninstalling ${packagesToRemove.length} packages...`);

    try {
      const results = await BatchUninstallPackages(packagesToRemove);
      const failed = results.filter((r) => !r.Success);

      if (failed.length === 0) {
        toast.success("All packages removed successfully", { id: toastId });
      } else {
        toast.error(`${failed.length} uninstall(s) failed`, {
          id: toastId,
          description: failed.map((f) => `${f.Package}: ${f.Message}`).join("\n"),
        });
      }

      await loadPackages();
    } catch (error) {
      console.error("Batch uninstall error:", error);
      toast.error("Batch uninstall failed", { description: String(error), id: toastId });
    } finally {
      setIsBatchUninstalling(false);
    }
  };

  const handleSelectApk = async () => {
    try {
      const selectedPath = await SelectApkFile(); 
      if (selectedPath) {
        setApkPath(selectedPath);
        toast.info(`File selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleInstall = async () => {
    if (!apkPath) {
      toast.error("No APK file selected.");
      return;
    }

    setIsInstalling(true);
    const toastId = toast.loading("Installing APK...", {
      description: apkPath.split(/[/\\]/).pop(),
    });

    try {
      const output = await InstallPackage(apkPath);
      toast.success("Install Complete", {
        description: output,
        id: toastId,
      });
      setApkPath(''); 
    } catch (error) {
      console.error("Install error:", error);
      toast.error("Install Failed", {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    if (!packageName) {
      toast.error("Package name cannot be empty.");
      return;
    }

    setIsUninstalling(true);
    const toastId = toast.loading("Uninstalling package...", {
      description: packageName,
    });

    try {
      const output = await UninstallPackage(packageName);
      toast.success("Uninstall Complete", {
        description: output,
        id: toastId,
      });
      setPackageName(''); 
    } catch (error) {
      console.error("Uninstall error:", error);
      toast.error("Uninstall Failed", {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsUninstalling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package />
            Install APK
          </CardTitle>
          <CardDescription>
            Select an .apk file from your computer to install it on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleSelectApk}
            disabled={isInstalling}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Select APK File
          </Button>
          <p className="text-sm text-muted-foreground truncate">
            {apkPath ? apkPath : "No file selected."}
          </p>
          <Button 
            variant="default"
            className="w-full"
            disabled={isInstalling || !apkPath}
            onClick={handleInstall}
          >
            {isInstalling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            Install
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 />
            Uninstall Package
          </CardTitle>
          <CardDescription>
            Enter the package name to uninstall it from your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="package-name" className="text-sm font-medium">
              Package Name
            </label>
            <Input 
              id="package-name" 
              placeholder="e.g., com.example.app" 
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              disabled={isUninstalling}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="w-full"
                disabled={isUninstalling || !packageName} 
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan menghapus paket:{" "}
                  <span className="font-semibold text-foreground">{packageName}</span>.
                  <br />
                  Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: "destructive" })}
                  onClick={handleUninstall}
                  disabled={isUninstalling}
                >
                  {isUninstalling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Ya, Uninstall
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks />
                Installed Apps
              </CardTitle>
              <CardDescription>Fetch, search, and multi-select packages for batch uninstall.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadPackages} disabled={isLoadingPackages}>
                {isLoadingPackages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              {!labelsLoaded && packageList.length > 0 && (
                <Button variant="secondary" size="sm" onClick={loadLabels} disabled={isLoadingLabels}>
                  {isLoadingLabels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                  Load App Names
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBatchUninstall} 
                disabled={isBatchUninstalling || selectedPackages.size === 0}
              >
                {isBatchUninstalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Remove Selected ({selectedPackages.size})
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by package or path..."
                className="pl-9"
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={includeSystemApps}
                onChange={(e) => setIncludeSystemApps(e.target.checked)}
              />
              Include system apps
            </label>
            <Button variant="ghost" size="sm" onClick={toggleSelectAllVisible} disabled={filteredPackages.length === 0}>
              <CheckSquare className="mr-2 h-4 w-4" />
              {filteredPackages.every((pkg) => selectedPackages.has(pkg.Name)) ? "Clear visible" : "Select visible"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <ScrollArea className="h-[360px]">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/70 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[160px]">Source</TableHead>
                    <TableHead>APK Path</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPackages ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredPackages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        {packageList.length === 0 ? "No packages loaded yet." : "No packages match your search."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPackages.map((pkg) => {
                      const isSelected = selectedPackages.has(pkg.Name);
                      const displayName = getDisplayName(pkg);
                      return (
                        <TableRow
                          key={pkg.Name}
                          data-state={isSelected ? 'selected' : ''}
                          className="cursor-pointer"
                          onClick={() => togglePackageSelection(pkg.Name)}
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={isSelected}
                              onChange={() => togglePackageSelection(pkg.Name)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate" title={displayName}>{displayName}</p>
                                <p className="text-xs text-muted-foreground truncate" title={pkg.Name}>{pkg.Name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{pkg.IsSystem ? "System" : "User"}</TableCell>
                          <TableCell>{getInstallerLabel(pkg)}</TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[280px]" title={pkg.ApkPath}>{pkg.ApkPath}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailDialog(pkg.Name);
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={detailDialogOpen} onOpenChange={(open) => {
        if (!open) closeDetailDialog();
      }}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>App details</AlertDialogTitle>
            <AlertDialogDescription>
              Device-reported metadata, permissions, and install info.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : detailError ? (
            <p className="text-destructive text-sm">{detailError}</p>
          ) : detailData ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{detailData.Label || detailData.Name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{detailData.Name}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(getStoreLink(detailData.Name), "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Play Store
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm text-muted-foreground">
                    {detailData.VersionName || "Unknown"} ({detailData.VersionCode || "?"})
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Installer</p>
                  <p className="text-sm text-muted-foreground">{detailData.Installer || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">APK Path</p>
                  <p className="text-xs font-mono break-all">{detailData.ApkPath || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Data Dir</p>
                  <p className="text-xs font-mono break-all">{detailData.DataDir || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">First installed</p>
                  <p className="text-sm text-muted-foreground">{detailData.FirstInstallTime || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Last updated</p>
                  <p className="text-sm text-muted-foreground">{detailData.LastUpdateTime || "Unknown"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">APK Size</p>
                  <p className="text-sm text-muted-foreground">{detailData.ApkSize || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Data Size</p>
                  <p className="text-sm text-muted-foreground">{detailData.DataSize || "N/A"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Granted permissions</p>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    {detailData.GrantedPermissions?.length ? (
                      <ul className="text-xs space-y-1">
                        {detailData.GrantedPermissions.map((perm) => (
                          <li key={perm}>{perm}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">None reported</p>
                    )}
                  </ScrollArea>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Requested permissions</p>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    {detailData.RequestedPermissions?.length ? (
                      <ul className="text-xs space-y-1">
                        {detailData.RequestedPermissions.map((perm) => (
                          <li key={perm}>{perm}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">None reported</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select an app to load details.</p>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeDetailDialog}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
