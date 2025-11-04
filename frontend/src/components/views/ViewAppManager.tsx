import React, { useState } from 'react';

import { SelectApkFile, InstallPackage, UninstallPackage } from '../../../wailsjs/go/backend/App';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Package, Trash2, FileUp } from "lucide-react";

export function ViewAppManager() {
  const [apkPath, setApkPath] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);

  const [packageName, setPackageName] = useState('');
  const [isUninstalling, setIsUninstalling] = useState(false);

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

  /**
   * Menjalankan fungsi UninstallPackage dari Go
   */
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
          <Button 
            variant="destructive"
            className="w-full"
            disabled={isUninstalling || !packageName}
            onClick={handleUninstall}
          >
            {isUninstalling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Uninstall
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
