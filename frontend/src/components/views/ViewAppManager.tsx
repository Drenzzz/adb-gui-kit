import React, { useState, useEffect } from 'react';

import { SelectApkFile, InstallPackage, UninstallPackage, GetInstalledPackages } from '../../../wailsjs/go/backend/App';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Package, Trash2, FileUp, RefreshCw } from "lucide-react";

export function ViewAppManager({ activeView }: { activeView: string }) {
  const [apkPath, setApkPath] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const [packages, setPackages] = useState<backend.InstalledPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [isUninstalling, setIsUninstalling] = useState(false);

  useEffect(() => {
    if (activeView === 'apps') {
      loadPackages();
    }
  }, [activeView]);

  const loadPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const packageList = await GetInstalledPackages();
      setPackages(packageList || []);
    } catch (error) {
      console.error("Failed to load packages:", error);
      toast.error("Failed to load packages", { description: String(error) });
    } finally {
      setIsLoadingPackages(false);
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
    if (!selectedPackage) {
      toast.error("No package selected.");
      return;
    }

    setIsUninstalling(true);
    const toastId = toast.loading("Uninstalling package...", {
      description: selectedPackage,
    });

    try {
      const output = await UninstallPackage(selectedPackage);
      toast.success("Uninstall Complete", {
        description: output,
        id: toastId,
      });
      setSelectedPackage(''); 
      await loadPackages();
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
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
            Search and select a package to uninstall it from your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={loadPackages}
              disabled={isLoadingPackages}
            >
              {isLoadingPackages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 text-sm text-muted-foreground flex items-center">
              {isLoadingPackages ? "Loading packages..." : `${packages.length} packages found`}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Package
            </label>
            <Command className="rounded-lg border shadow-md">
              <CommandInput placeholder="Search packages..." />
              <CommandList>
                <CommandEmpty>No packages found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {packages.map((pkg) => (
                      <CommandItem
                        key={pkg.Name}
                        onSelect={() => setSelectedPackage(pkg.Name)}
                        className={selectedPackage === pkg.Name ? "bg-accent" : ""}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        <span className="text-sm">{pkg.Name}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>

          {selectedPackage && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
              Selected: <span className="font-medium text-foreground">{selectedPackage}</span>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="w-full"
                disabled={isUninstalling || !selectedPackage} 
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Uninstall
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to uninstall:{" "}
                  <span className="font-semibold text-foreground">{selectedPackage}</span>.
                  <br />
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                  Yes, Uninstall
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

    </div>
  );
}
