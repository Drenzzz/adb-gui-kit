import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { SelectApkFile, InstallPackage, ListPackages, ClearData, DisablePackage, EnablePackage, PullApk, UninstallMultiplePackages, DisableMultiplePackages, EnableMultiplePackages } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";
import type { QuickControlSelect } from "@/components/appManager/AppManagerQuickControlsCard";

type FilterType = "user" | "system" | "all";
type StatusFilter = "all" | "enabled" | "disabled";
type PackageInfo = backend.PackageInfo;

interface UseAppManagerOptions {
  activeView: string;
}

export function useAppManager({ activeView }: UseAppManagerOptions) {
  const [apkPath, setApkPath] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);

  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filter, setFilter] = useState<FilterType>("user");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  const [isClearing, setIsClearing] = useState(false);
  const [pkgToAction, setPkgToAction] = useState<string>("");
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);

  const [isTogglingPackageName, setIsTogglingPackageName] = useState<string>("");
  const [isPullingPackageName, setIsPullingPackageName] = useState<string>("");

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
      console.error("Failed to list packages:", error);
      toast.error("Failed to load package list", {
        description: String(error),
      });
      setPackageList([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeView === "apps") {
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
      console.error("File selection error:", error);
      toast.error("Failed to open file dialog", {
        description: String(error),
      });
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
      setApkPath("");
      if (filter === "user") {
        loadPackages("user");
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
  };

  const handleClearData = async () => {
    if (!pkgToAction) return;

    setIsClearing(true);
    const toastId = toast.loading("Clearing data...", {
      description: pkgToAction,
    });

    try {
      const output = await ClearData(pkgToAction);
      toast.success("Data Clear Successful", {
        description: output,
        id: toastId,
      });
    } catch (error) {
      console.error("Clear data error:", error);
      toast.error("Clear Data Failed", {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsClearing(false);
      setIsClearDataOpen(false);
      setPkgToAction("");
    }
  };

  const handleTogglePackage = async (pkg: PackageInfo) => {
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

      loadPackages(filter);
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(`Failed to ${action.toLowerCase()} package`, {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsTogglingPackageName("");
    }
  };

  const handlePullApk = async (pkg: PackageInfo) => {
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
  };

  const handleSelectPackage = (packageName: string, checked: boolean) => {
    if (checked) {
      setSelectedPackages((prev) => (prev.includes(packageName) ? prev : [...prev, packageName]));
    } else {
      setSelectedPackages((prev) => prev.filter((name) => name !== packageName));
    }
  };

  const handleSelectAllPackages = (checked: boolean, targetList: PackageInfo[] = packageList) => {
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
      setSelectedPackages((prev) => prev.filter((name) => !targetSet.has(name)));
    }
  };

  const handleMultiUninstall = async () => {
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
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      console.error("Batch uninstall error:", error);
      toast.error("Batch Uninstall Failed", {
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
    const toastId = toast.loading(`Disabling ${selectedPackages.length} packages...`);
    try {
      const output = await DisableMultiplePackages(selectedPackages);
      toast.success("Batch Disable Complete", {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      toast.error("Batch Disable Failed", {
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
    const toastId = toast.loading(`Enabling ${selectedPackages.length} packages...`);
    try {
      const output = await EnableMultiplePackages(selectedPackages);
      toast.success("Batch Enable Complete", {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadPackages(filter);
      setSelectedPackages([]);
    } catch (error) {
      toast.error("Batch Enable Failed", {
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
        if (statusFilter === "enabled") return pkg.IsEnabled;
        if (statusFilter === "disabled") return !pkg.IsEnabled;
        return true;
      })
      .sort((a, b) => {
        return sortOrder === "asc" ? a.PackageName.localeCompare(b.PackageName) : b.PackageName.localeCompare(a.PackageName);
      });
  }, [packageList, searchTerm, statusFilter, sortOrder]);

  const allVisibleSelected = visiblePackages.length > 0 && visiblePackages.every((pkg) => selectedPackages.includes(pkg.PackageName));

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
    { label: "User apps", value: "user" },
    { label: "System apps", value: "system" },
    { label: "All apps", value: "all" },
  ];

  const statusOptions: { label: string; value: StatusFilter }[] = [
    { label: "Any status", value: "all" },
    { label: "Enabled only", value: "enabled" },
    { label: "Disabled only", value: "disabled" },
  ];

  const sortOptions: { label: string; value: "asc" | "desc" }[] = [
    { label: "Name (A-Z)", value: "asc" },
    { label: "Name (Z-A)", value: "desc" },
  ];

  const filterLabel = filterOptions.find((option) => option.value === filter)?.label ?? "Apps";
  const statusLabel = statusOptions.find((option) => option.value === statusFilter)?.label ?? "Any status";
  const sortLabel = sortOptions.find((option) => option.value === sortOrder)?.label ?? "Name (A-Z)";

  const quickControlSelects: QuickControlSelect[] = [
    {
      label: "App source",
      value: filterLabel,
      options: filterOptions,
      onSelect: (value: string) => setFilter(value as FilterType),
      activeValue: filter,
    },
    {
      label: "Status",
      value: statusLabel,
      options: statusOptions,
      onSelect: (value: string) => setStatusFilter(value as StatusFilter),
      activeValue: statusFilter,
    },
    {
      label: "Sort order",
      value: sortLabel,
      options: sortOptions,
      onSelect: (value: string) => setSortOrder(value as "asc" | "desc"),
      activeValue: sortOrder,
    },
  ];

  const handleClearSelection = () => setSelectedPackages([]);
  const handleResetFilters = () => {
    setFilter("user");
    setStatusFilter("all");
    setSortOrder("asc");
    setSearchTerm("");
    setSelectedPackages([]);
  };

  const isBusy = isLoadingList || isBatchUninstalling || isBatchDisabling || isBatchEnabling;

  return {
    apkPath,
    isInstalling,
    packageList,
    isLoadingList,
    filter,
    searchTerm,
    setSearchTerm,
    isClearing,
    pkgToAction,
    setPkgToAction,
    isClearDataOpen,
    setIsClearDataOpen,
    isTogglingPackageName,
    isPullingPackageName,
    selectedPackages,
    isBatchUninstalling,
    isBatchUninstallOpen,
    setIsBatchUninstallOpen,
    isBatchDisabling,
    isBatchDisablingOpen,
    setIsBatchDisablingOpen,
    isBatchEnabling,
    isBatchEnablingOpen,
    setIsBatchEnablingOpen,
    loadPackages,
    handleSelectApk,
    handleInstall,
    handleClearData,
    handleTogglePackage,
    handlePullApk,
    handleSelectPackage,
    handleSelectAllPackages,
    handleMultiUninstall,
    handleMultiDisable,
    handleMultiEnable,
    visiblePackages,
    allVisibleSelected,
    totalPackages,
    enabledPackages,
    disabledPackages,
    selectedCount,
    filterLabel,
    statusLabel,
    sortLabel,
    quickControlSelects,
    handleClearSelection,
    handleResetFilters,
    isBusy,
  };
}
