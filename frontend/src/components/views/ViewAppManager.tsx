import React, { useState, useEffect } from 'react';

import {
  SelectApkFile,
  InstallPackage,
  UninstallPackage,
  ListPackages,
  ClearData,
  DisablePackage,
  EnablePackage,
  PullApk,
  UninstallMultiplePackages,
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
type PackageInfo = backend.PackageInfo;

export function ViewAppManager({ activeView }: { activeView: string }) {
  const [apkPath, setApkPath] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [isUninstalling, setIsUninstalling] = useState(false);

  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filter, setFilter] = useState<FilterType>('user');

  const [isClearing, setIsClearing] = useState(false);
  const [pkgToAction, setPkgToAction] = useState<string>('');
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);

  const [isTogglingPackageName, setIsTogglingPackageName] = useState<string>('');
  const [isPullingPackageName, setIsPullingPackageName] = useState<string>('');

  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);

  const [isBatchUninstalling, setIsBatchUninstalling] = useState(false);
  const [isBatchUninstallOpen, setIsBatchUninstallOpen] = useState(false);

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

  const handleUninstall = async () => {
    if (!packageName) {
      toast.error('Package name cannot be empty.');
      return;
    }

    setIsUninstalling(true);
    const toastId = toast.loading('Uninstalling package...', {
      description: packageName,
    });

    try {
      const output = await UninstallPackage(packageName);
      toast.success('Uninstall Complete', {
        description: output,
        id: toastId,
      });
      setPackageName('');
      loadPackages(filter);
    } catch (error) {
      console.error('Uninstall error:', error);
      toast.error('Uninstall Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsUninstalling(false);
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
      setSelectedPackages((prev) => [...prev, packageName]);
    } else {
      setSelectedPackages((prev) =>
        prev.filter((name) => name !== packageName)
      );
    }
  };

  const handleSelectAllPackages = (checked: boolean) => {
    if (checked) {
      setSelectedPackages(packageList.map((pkg) => pkg.PackageName));
    } else {
      setSelectedPackages([]);
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

      <div className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package />
                Install APK
              </CardTitle>
              <CardDescription>
                Select an .apk file from your computer to install it on your
                device.
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
                {apkPath ? apkPath : 'No file selected.'}
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
                Uninstall Package (by Name)
              </CardTitle>
              <CardDescription>
                Manually enter a package name to uninstall it.
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
                      Anda akan menghapus paket:{' '}
                      <span className="font-semibold text-foreground">
                        {packageName}
                      </span>
                      .
                      <br />
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: 'destructive' })}
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
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <List />
                Installed Packages
              </CardTitle>
              <CardDescription>
                List of applications installed on the device.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('user')}
              >
                User
              </Button>
              <Button
                variant={filter === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('system')}
              >
                System
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadPackages(filter)}
                disabled={isLoadingList || isBatchUninstalling}
              >
                {isLoadingList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedPackages.length === 0 || isBatchUninstalling}
                onClick={() => setIsBatchUninstallOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall Selected ({selectedPackages.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex overflow-hidden min-h-0">
            <ScrollArea className="flex-1 h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          packageList.length > 0 &&
                          selectedPackages.length === packageList.length
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAllPackages(checked as boolean)
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingList ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : packageList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No packages found for this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    packageList.map((pkg) => (
                      <TableRow
                        key={pkg.PackageName}
                        data-state={
                          selectedPackages.includes(pkg.PackageName)
                            ? 'selected'
                            : !pkg.IsEnabled
                            ? 'disabled'
                            : ''
                        }
                        className="hover:bg-muted/50"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedPackages.includes(
                              pkg.PackageName
                            )}
                            onCheckedChange={(checked) =>
                              handleSelectPackage(
                                pkg.PackageName,
                                checked as boolean
                              )
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
                        <TableCell className="font-mono">
                          {pkg.PackageName}
                        </TableCell>
                        <TableCell className="text-right">
                          {isTogglingPackageName === pkg.PackageName ||
                          isPullingPackageName === pkg.PackageName ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => handleTogglePackage(pkg)}
                                >
                                  {pkg.IsEnabled ? (
                                    <EyeOff className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Eye className="mr-2 h-4 w-4" />
                                  )}
                                  {pkg.IsEnabled ? 'Disable' : 'Enable'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePullApk(pkg)}
                                >
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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
