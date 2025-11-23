import React, { useState, useEffect } from 'react';

import {
  SelectApkFile,
  InstallPackage,
  UninstallPackage,
  ListPackages,
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
import { toast } from 'sonner';
import {
  Loader2,
  Package,
  Trash2,
  FileUp,
  RefreshCw,
  List,
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

  return (
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

        {/* --- [KODE LAMA] Kartu Uninstall Package --- */}
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

      {/* --- [KODE BARU] Kartu untuk Daftar Paket --- */}
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
            {/* Tombol Filter */}
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

            {/* Tombol Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadPackages(filter)}
              disabled={isLoadingList}
            >
              {isLoadingList ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex overflow-hidden min-h-0">
          <ScrollArea className="flex-1 h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  {/* Di commit selanjutnya kita akan tambahkan kolom 'Actions' di sini */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingList ? (
                  <TableRow>
                    <TableCell colSpan={1} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : packageList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={1} className="h-24 text-center">
                      No packages found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  packageList.map((pkg) => (
                    <TableRow
                      key={pkg.PackageName}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-mono">
                        {pkg.PackageName}
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
  );
}
