import React, { useState, useEffect, useMemo } from 'react';

import {
  SelectApkFile,
  InstallPackage,
  ListPackages,
  ClearData,
  DisablePackage,
  EnablePackage,
  PullApk,
  UninstallMultiplePackages,
  DisableMultiplePackages,
  EnableMultiplePackages,
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
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Loader2,
  Package,
  Trash2,
  FileUp,
  RefreshCw,
  List,
  MoreHorizontal,
  Eraser,
  EyeOff,
  Eye,
  Download,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type FilterType = 'user' | 'system' | 'all';
type StatusFilter = 'all' | 'enabled' | 'disabled';
type PackageInfo = backend.PackageInfo;

export function ViewAppManager({ activeView }: { activeView: string }) {
  const [apkPath, setApkPath] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filter, setFilter] = useState<FilterType>('user');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const [isClearing, setIsClearing] = useState(false);
  const [pkgToAction, setPkgToAction] = useState<string>('');
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);

  const [isTogglingPackageName, setIsTogglingPackageName] = useState<string>('');
  const [isPullingPackageName, setIsPullingPackageName] = useState<string>('');

  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const [isBatchUninstalling, setIsBatchUninstalling] = useState(false);
  const [isBatchUninstallOpen, setIsBatchUninstallOpen] = useState(false);

  const [isBatchDisabling, setIsBatchDisabling] = useState(false);
  const [isBatchDisablingOpen, setIsBatchDisablingOpen] = useState(false);
  const [isBatchEnabling, setIsBatchEnabling] = useState(false);
  const [isBatchEnablingOpen, setIsBatchEnablingOpen] = useState(false);

  const loadPackages = async (currentFilter: FilterType) => {
    setIsLoadingList(true);
    try {
      const packages = await ListPackages(currentFilter);
      setPackageList(packages || []);
    } catch (error) {
      console.error('Failed to list packages:', error);
      toast.error('Failed to load package list', {
        description: String(error),
      });
      setPackageList([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeView === 'apps') {
      loadPackages(filter);
    }
  }, [activeView, filter]); 

  const handleSelectApk = async () => {
    try {
      const selectedPath = await SelectApkFile();
      if (selectedPath) {
        setApkPath(selectedPath);
        toast.info(`File selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error('File selection error:', error);
      toast.error('Failed to open file dialog', {
        description: String(error),
      });
    }
  };

  const handleInstall = async () => {
    if (!apkPath) {
      toast.error('No APK file selected.');
      return;
    }

    setIsInstalling(true);
    const toastId = toast.loading('Installing APK...', {
      description: apkPath.split(/[/\\]/).pop(),
    });

    try {
      const output = await InstallPackage(apkPath);
      toast.success('Install Complete', {
        description: output,
        id: toastId,
      });
      setApkPath('');
      if (filter === 'user') {
        loadPackages('user');
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Install Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClearData = async () => {
    if (!pkgToAction) return;

    setIsClearing(true);
    const toastId = toast.loading('Clearing data...', {
      description: pkgToAction,
    });

    try {
      const output = await ClearData(pkgToAction);
      toast.success('Data Clear Successful', {
        description: output,
        id: toastId,
      });
    } catch (error) {
      console.error('Clear data error:', error);
      toast.error('Clear Data Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsClearing(false);
      setIsClearDataOpen(false);
      setPkgToAction('');
    }
  };

  const handleTogglePackage = async (pkg: PackageInfo) => {
    setIsTogglingPackageName(pkg.PackageName);
    const action = pkg.IsEnabled ? 'Disabling' : 'Enabling';
    const toastId = toast.loading(`${action} package...`, {
      description: pkg.PackageName,
    });

    try {
      let output = '';
      if (pkg.IsEnabled) {
        output = await DisablePackage(pkg.PackageName);
      } else {
        output = await EnablePackage(pkg.PackageName);
      }
      
      toast.success(`Package ${action.slice(0, -3)}d`, {
        description: output,
        id: toastId,
      });

      loadPackages(filter);

    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(`Failed to ${action.toLowerCase()} package`, {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsTogglingPackageName('');
    }
  };

  const handlePullApk = async (pkg: PackageInfo) => {
    setIsPullingPackageName(pkg.PackageName);
    const toastId = toast.loading('Preparing to pull APK...', {
      description: pkg.PackageName,
    });

    try {
      const output = await PullApk(pkg.PackageName);
      
      if (output.includes("cancelled by user")) {
        toast.info("Pull APK Cancelled", {
          description: pkg.PackageName,
          id: toastId,
        });
      } else {
        toast.success("APK Pull Successful", {
          description: output,
          id: toastId,
        });
      }

    } catch (error) {
      console.error('Pull APK error:', error);
      toast.error('Failed to pull APK', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsPullingPackageName('');
    }
  };

  const handleSelectPackage = (packageName: string, checked: boolean) => {
    if (checked) {
      setSelectedPackages((prev) =>
        prev.includes(packageName) ? prev : [...prev, packageName]
      );
    } else {
      setSelectedPackages((prev) =>
        prev.filter((name) => name !== packageName)
      );
    }
  };

  const handleSelectAllPackages = (
    checked: boolean,
    targetList: PackageInfo[] = packageList
  ) => {
    const targetNames = targetList.map((pkg) => pkg.PackageName);
    const targetSet = new Set(targetNames);

    if (targetNames.length === 0) {
      return;
    }

    if (checked) {
      setSelectedPackages((prev) => {
        const merged = new Set(prev);
        targetSet.forEach((name) => merged.add(name));
        return Array.from(merged);
      });
    } else {
      setSelectedPackages((prev) =>
        prev.filter((name) => !targetSet.has(name))
      );
    }
  };

  const handleMultiUninstall = async () => {
    if (selectedPackages.length === 0) {
      toast.error('No packages selected to uninstall.');
      return;
    }

    setIsBatchUninstalling(true);
    const toastId = toast.loading(
      `Uninstalling ${selectedPackages.length} packages...`
    );

    try {
      const output = await UninstallMultiplePackages(selectedPackages);
      toast.success('Batch Uninstall Complete', {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      console.error('Batch uninstall error:', error);
      toast.error('Batch Uninstall Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsBatchUninstalling(false);
      setIsBatchUninstallOpen(false);
    }
  };

  const handleMultiDisable = async () => {
    if (selectedPackages.length === 0) return;
    setIsBatchDisabling(true);
    const toastId = toast.loading(
      `Disabling ${selectedPackages.length} packages...`
    );
    try {
      const output = await DisableMultiplePackages(selectedPackages);
      toast.success('Batch Disable Complete', {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      toast.error('Batch Disable Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsBatchDisabling(false);
      setIsBatchDisablingOpen(false);
    }
  };

  const handleMultiEnable = async () => {
    if (selectedPackages.length === 0) return;
    setIsBatchEnabling(true);
    const toastId = toast.loading(
      `Enabling ${selectedPackages.length} packages...`
    );
    try {
      const output = await EnableMultiplePackages(selectedPackages);
      toast.success('Batch Enable Complete', {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      toast.error('Batch Enable Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsBatchEnabling(false);
      setIsBatchEnablingOpen(false);
    }
  };

  const visiblePackages = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    return packageList
      .filter((pkg) => {
        if (!lowerSearch) return true;
        return pkg.PackageName.toLowerCase().includes(lowerSearch);
      })
      .filter((pkg) => {
        if (statusFilter === 'enabled') return pkg.IsEnabled;
        if (statusFilter === 'disabled') return !pkg.IsEnabled;
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'asc'
          ? a.PackageName.localeCompare(b.PackageName)
          : b.PackageName.localeCompare(a.PackageName);
      });
  }, [packageList, searchTerm, statusFilter, sortOrder]);

  const allVisibleSelected =
    visiblePackages.length > 0 &&
    visiblePackages.every((pkg) => selectedPackages.includes(pkg.PackageName));

  const { totalPackages, enabledPackages, disabledPackages } = useMemo(() => {
    const total = packageList.length;
    const enabledCount = packageList.filter((pkg) => pkg.IsEnabled).length;
    return {
      totalPackages: total,
      enabledPackages: enabledCount,
      disabledPackages: total - enabledCount,
    };
  }, [packageList]);

  const selectedCount = selectedPackages.length;

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'User apps', value: 'user' },
    { label: 'System apps', value: 'system' },
    { label: 'All apps', value: 'all' },
  ];

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Any status', value: 'all' },
    { label: 'Enabled only', value: 'enabled' },
    { label: 'Disabled only', value: 'disabled' },
  ];

  const sortOptions: { label: string; value: 'asc' | 'desc' }[] = [
    { label: 'Name (A-Z)', value: 'asc' },
    { label: 'Name (Z-A)', value: 'desc' },
  ];

  const filterLabel =
    filterOptions.find((option) => option.value === filter)?.label ?? 'Apps';
  const statusLabel =
    statusOptions.find((option) => option.value === statusFilter)?.label ??
    'Any status';
  const sortLabel =
    sortOptions.find((option) => option.value === sortOrder)?.label ??
    'Name (A-Z)';

  const quickControlSelects = [
    {
      label: 'App source',
      value: filterLabel,
      options: filterOptions,
      onSelect: (value: string) => setFilter(value as FilterType),
      activeValue: filter,
    },
    {
      label: 'Status',
      value: statusLabel,
      options: statusOptions,
      onSelect: (value: string) => setStatusFilter(value as StatusFilter),
      activeValue: statusFilter,
    },
    {
      label: 'Sort order',
      value: sortLabel,
      options: sortOptions,
      onSelect: (value: string) => setSortOrder(value as 'asc' | 'desc'),
      activeValue: sortOrder,
    },
  ];

  const handleClearSelection = () => setSelectedPackages([]);
  const handleResetFilters = () => {
    setFilter('user');
    setStatusFilter('all');
    setSortOrder('asc');
    setSearchTerm('');
    setSelectedPackages([]);
  };

  const isBusy =
    isLoadingList || isBatchUninstalling || isBatchDisabling || isBatchEnabling;
  
  return (
    <>
      <AlertDialog open={isClearDataOpen} onOpenChange={setIsClearDataOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to clear data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will erase all app data (logins, files, settings) for{' '}
              <span className="font-semibold text-foreground">{pkgToAction}</span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleClearData}
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eraser className="mr-2 h-4 w-4" />
              )}
              Yes, Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isBatchUninstallOpen}
        onOpenChange={setIsBatchUninstallOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to uninstall{' '}
              <span className="font-semibold text-foreground">
                {selectedPackages.length} selected packages
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchUninstalling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleMultiUninstall}
              disabled={isBatchUninstalling}
            >
              {isBatchUninstalling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Yes, Uninstall {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isBatchDisablingOpen}
        onOpenChange={setIsBatchDisablingOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to attempt to disable{' '}
              <span className="font-semibold text-foreground">
                {selectedPackages.length} selected packages
              </span>
              .
              <br />
              <strong className="text-destructive">
                System apps will likely fail (this is normal).
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDisabling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMultiDisable}
              disabled={isBatchDisabling}
            >
              {isBatchDisabling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Yes, Disable {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isBatchEnablingOpen}
        onOpenChange={setIsBatchEnablingOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to attempt to enable{' '}
              <span className="font-semibold text-foreground">
                {selectedPackages.length} selected packages
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchEnabling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMultiEnable}
              disabled={isBatchEnabling}
            >
              {isBatchEnabling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Yes, Enable {selectedPackages.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">Application Manager</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Install, toggle, and maintain packages with a streamlined workflow.
                </p>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => loadPackages(filter)}
                disabled={isBusy}
                className="w-full md:w-auto"
              >
                {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                Sync Packages
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total packages', value: totalPackages },
                { label: 'Enabled', value: enabledPackages },
                { label: 'Disabled', value: disabledPackages },
                { label: 'Selected', value: selectedCount },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-foreground"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle>Quick controls</CardTitle>
            <CardDescription>Adjust filters or batch actions without leaving the table.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              {quickControlSelects.map((config) => (
                <div key={config.label} className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{config.label}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {config.value}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {config.options.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => config.onSelect(option.value)}
                        className={cn(option.value === config.activeValue && 'font-semibold text-primary')}
                      >
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
              <p className="text-xs text-muted-foreground">
                {selectedCount === 0
                  ? 'Choose packages from the list to enable bulk actions.'
                  : 'Apply one of the actions below to the selected packages.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || isBusy}
                onClick={() => setIsBatchEnablingOpen(true)}
              >
                <Eye className="h-4 w-4" />
                Enable ({selectedCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCount === 0 || isBusy}
                onClick={() => setIsBatchDisablingOpen(true)}
              >
                <EyeOff className="h-4 w-4" />
                Disable ({selectedCount})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedCount === 0 || isBusy}
                onClick={() => setIsBatchUninstallOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Uninstall ({selectedCount})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={selectedCount === 0}
                onClick={handleClearSelection}
              >
                Clear selection
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Reset filters
              </Button>
            </div>
          </CardContent>
        </Card>

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
              <Input
                placeholder="Search package name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                              handleSelectAllPackages(checked as boolean, visiblePackages)
                            }
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead>Package Name</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                        visiblePackages.map((pkg) => (
                          <TableRow
                            key={pkg.PackageName}
                            data-state={
                              selectedPackages.includes(pkg.PackageName)
                                ? 'selected'
                                : !pkg.IsEnabled
                                ? 'disabled'
                                : ''
                            }
                            className="hover:bg-muted/40"
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedPackages.includes(pkg.PackageName)}
                                onCheckedChange={(checked) =>
                                  handleSelectPackage(pkg.PackageName, checked as boolean)
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
                            <TableCell className="font-mono text-sm">{pkg.PackageName}</TableCell>
                            <TableCell className="text-right">
                              {isTogglingPackageName === pkg.PackageName ||
                              isPullingPackageName === pkg.PackageName ? (
                                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleTogglePackage(pkg)}>
                                      {pkg.IsEnabled ? (
                                        <EyeOff className="mr-2 h-4 w-4" />
                                      ) : (
                                        <Eye className="mr-2 h-4 w-4" />
                                      )}
                                      {pkg.IsEnabled ? 'Disable' : 'Enable'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePullApk(pkg)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Pull APK
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setPkgToAction(pkg.PackageName);
                                        setIsClearDataOpen(true);
                                      }}
                                    >
                                      <Eraser className="mr-2 h-4 w-4" />
                                      Clear Data
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Install new application</CardTitle>
            <CardDescription>
              Use the file picker below to sideload an APK onto the connected device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/40 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected file</p>
              <p className="mt-2 break-all text-base font-semibold text-foreground">
                {apkPath ? apkPath : 'No file selected yet'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleSelectApk}
                disabled={isInstalling}
              >
                <FileUp className="h-4 w-4" />
                Choose APK
              </Button>
              <Button size="lg" className="flex-1" disabled={isInstalling || !apkPath} onClick={handleInstall}>
                {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                Install to device
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported on USB and wireless debugging sessions. Ensure the device allows installations from unknown
              sources.
            </p>
          </CardContent>
        </Card>
      </div>

    </>
  );
}
