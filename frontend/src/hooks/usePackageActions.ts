import { useState, useCallback } from "react";
import { toast } from "sonner";
import { InstallPackage, ClearData, DisablePackage, EnablePackage, PullApk, UninstallMultiplePackages, DisableMultiplePackages, EnableMultiplePackages } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";

// Re-export type if needed, but usually imported from models
type PackageInfo = backend.PackageInfo;

export function usePackageActions(refreshList: (filter: any) => void, currentFilter: any) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTogglingPackageName, setIsTogglingPackageName] = useState<string>("");
  const [isPullingPackageName, setIsPullingPackageName] = useState<string>("");

  const [isBatchUninstalling, setIsBatchUninstalling] = useState(false);
  const [isBatchDisabling, setIsBatchDisabling] = useState(false);
  const [isBatchEnabling, setIsBatchEnabling] = useState(false);

  const handleInstall = useCallback(
    async (apkPath: string, setApkPath: (path: string) => void) => {
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
        setApkPath("");
        if (currentFilter === "user") {
          refreshList("user");
        }
      } catch (error) {
        console.error("Install error:", error);
        toast.error("Install Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsInstalling(false);
      }
    },
    [currentFilter, refreshList]
  );

  const handleClearData = useCallback(async (pkgName: string, onSuccess: () => void) => {
    if (!pkgName) return;

    setIsClearing(true);
    const toastId = toast.loading("Clearing data...", {
      description: pkgName,
    });

    try {
      const output = await ClearData(pkgName);
      toast.success("Data Clear Successful", {
        description: output,
        id: toastId,
      });
      onSuccess();
    } catch (error) {
      console.error("Clear data error:", error);
      toast.error("Clear Data Failed", {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsClearing(false);
    }
  }, []);

  const handleTogglePackage = useCallback(
    async (pkg: PackageInfo) => {
      setIsTogglingPackageName(pkg.PackageName);
      const action = pkg.IsEnabled ? "Disabling" : "Enabling";
      const toastId = toast.loading(`${action} package...`, {
        description: pkg.PackageName,
      });

      try {
        let output = "";
        if (pkg.IsEnabled) {
          output = await DisablePackage(pkg.PackageName);
        } else {
          output = await EnablePackage(pkg.PackageName);
        }

        toast.success(`Package ${action.slice(0, -3)}d`, {
          description: output,
          id: toastId,
        });

        refreshList(currentFilter);
      } catch (error) {
        console.error(`${action} error:`, error);
        toast.error(`Failed to ${action.toLowerCase()} package`, {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsTogglingPackageName("");
      }
    },
    [currentFilter, refreshList]
  );

  const handlePullApk = useCallback(async (pkg: PackageInfo) => {
    setIsPullingPackageName(pkg.PackageName);
    const toastId = toast.loading("Preparing to pull APK...", {
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
      console.error("Pull APK error:", error);
      toast.error("Failed to pull APK", {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsPullingPackageName("");
    }
  }, []);

  const handleMultiUninstall = useCallback(
    async (selectedPackages: string[], onSuccess: () => void) => {
      if (selectedPackages.length === 0) {
        toast.error("No packages selected to uninstall.");
        return;
      }

      setIsBatchUninstalling(true);
      const toastId = toast.loading(`Uninstalling ${selectedPackages.length} packages...`);

      try {
        const output = await UninstallMultiplePackages(selectedPackages);
        toast.success("Batch Uninstall Complete", {
          description: output,
          id: toastId,
          duration: 8000,
        });
        refreshList(currentFilter);
        onSuccess();
      } catch (error) {
        console.error("Batch uninstall error:", error);
        toast.error("Batch Uninstall Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsBatchUninstalling(false);
      }
    },
    [currentFilter, refreshList]
  );

  const handleMultiDisable = useCallback(
    async (selectedPackages: string[], onSuccess: () => void) => {
      if (selectedPackages.length === 0) return;
      setIsBatchDisabling(true);
      const toastId = toast.loading(`Disabling ${selectedPackages.length} packages...`);
      try {
        const output = await DisableMultiplePackages(selectedPackages);
        toast.success("Batch Disable Complete", {
          description: output,
          id: toastId,
          duration: 8000,
        });
        refreshList(currentFilter);
        onSuccess();
      } catch (error) {
        toast.error("Batch Disable Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsBatchDisabling(false);
      }
    },
    [currentFilter, refreshList]
  );

  const handleMultiEnable = useCallback(
    async (selectedPackages: string[], onSuccess: () => void) => {
      if (selectedPackages.length === 0) return;
      setIsBatchEnabling(true);
      const toastId = toast.loading(`Enabling ${selectedPackages.length} packages...`);
      try {
        const output = await EnableMultiplePackages(selectedPackages);
        toast.success("Batch Enable Complete", {
          description: output,
          id: toastId,
          duration: 8000,
        });
        refreshList(currentFilter);
        onSuccess();
      } catch (error) {
        toast.error("Batch Enable Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsBatchEnabling(false);
      }
    },
    [currentFilter, refreshList]
  );

  return {
    isInstalling,
    isClearing,
    isTogglingPackageName,
    isPullingPackageName,
    isBatchUninstalling,
    isBatchDisabling,
    isBatchEnabling,
    handleInstall,
    handleClearData,
    handleTogglePackage,
    handlePullApk,
    handleMultiUninstall,
    handleMultiDisable,
    handleMultiEnable,
  };
}
