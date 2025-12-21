import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { SelectApkFile } from "../../wailsjs/go/backend/App";
import type { QuickControlSelect } from "@/components/appManager/AppManagerQuickControlsCard";
import { usePackageList } from "./usePackageList";
import type { FilterType, StatusFilter, PackageInfo } from "./usePackageList";
import { usePackageActions } from "./usePackageActions";

interface UseAppManagerOptions {
  activeView: string;
}

export function useAppManager({ activeView }: UseAppManagerOptions) {
  const [apkPath, setApkPath] = useState("");

  const {
    packageList,
    isLoadingList,
    filter,
    setFilter,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    searchTerm,
    setSearchTerm,
    loadPackages,
    visiblePackages,
    totalPackages,
    enabledPackages,
    disabledPackages,
    handleResetFilters,
  } = usePackageList();

  const {
    isInstalling,
    isClearing,
    isTogglingPackageName,
    isPullingPackageName,
    isBatchUninstalling,
    isBatchDisabling,
    isBatchEnabling,
    handleInstall: performInstall,
    handleClearData: performClearData,
    handleTogglePackage,
    handlePullApk,
    handleMultiUninstall: performMultiUninstall,
    handleMultiDisable: performMultiDisable,
    handleMultiEnable: performMultiEnable,
  } = usePackageActions(loadPackages, filter);

  const [pkgToAction, setPkgToAction] = useState<string>("");
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isBatchUninstallOpen, setIsBatchUninstallOpen] = useState(false);
  const [isBatchDisablingOpen, setIsBatchDisablingOpen] = useState(false);
  const [isBatchEnablingOpen, setIsBatchEnablingOpen] = useState(false);

  useEffect(() => {
    if (activeView === "apps") {
      loadPackages(filter);
    }
  }, [activeView, filter, loadPackages]);

  const handleSelectApk = useCallback(async () => {
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
  }, []);

  const handleInstall = useCallback(() => {
    performInstall(apkPath, setApkPath);
  }, [performInstall, apkPath]);

  const handleClearData = useCallback(() => {
    performClearData(pkgToAction, () => {
      setIsClearDataOpen(false);
      setPkgToAction("");
    });
  }, [performClearData, pkgToAction]);

  const handleSelectPackage = useCallback((packageName: string, checked: boolean) => {
    if (checked) {
      setSelectedPackages((prev) => (prev.includes(packageName) ? prev : [...prev, packageName]));
    } else {
      setSelectedPackages((prev) => prev.filter((name) => name !== packageName));
    }
  }, []);

  const handleSelectAllPackages = useCallback(
    (checked: boolean, targetList: PackageInfo[] = packageList) => {
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
    },
    [packageList]
  );

  const handleMultiUninstall = useCallback(() => {
    performMultiUninstall(selectedPackages, () => {
      setSelectedPackages([]);
      setIsBatchUninstallOpen(false);
    });
  }, [performMultiUninstall, selectedPackages]);

  const handleMultiDisable = useCallback(() => {
    performMultiDisable(selectedPackages, () => {
      setSelectedPackages([]);
      setIsBatchDisablingOpen(false);
    });
  }, [performMultiDisable, selectedPackages]);

  const handleMultiEnable = useCallback(() => {
    performMultiEnable(selectedPackages, () => {
      setSelectedPackages([]);
      setIsBatchEnablingOpen(false);
    });
  }, [performMultiEnable, selectedPackages]);

  const handleClearSelection = useCallback(() => setSelectedPackages([]), []);

  const handleResetFiltersAndSelection = useCallback(() => {
    handleResetFilters();
    setSelectedPackages([]);
  }, [handleResetFilters]);

  const allVisibleSelected = useMemo(() => {
    if (visiblePackages.length === 0) return false;
    return visiblePackages.every((pkg) => selectedPackages.includes(pkg.PackageName));
  }, [visiblePackages, selectedPackages]);

  const selectedCount = selectedPackages.length;

  const filterOptions: { label: string; value: FilterType }[] = useMemo(
    () => [
      { label: "User apps", value: "user" },
      { label: "System apps", value: "system" },
      { label: "All apps", value: "all" },
    ],
    []
  );

  const statusOptions: { label: string; value: StatusFilter }[] = useMemo(
    () => [
      { label: "Any status", value: "all" },
      { label: "Enabled only", value: "enabled" },
      { label: "Disabled only", value: "disabled" },
    ],
    []
  );

  const sortOptions: { label: string; value: "asc" | "desc" }[] = useMemo(
    () => [
      { label: "Name (A-Z)", value: "asc" },
      { label: "Name (Z-A)", value: "desc" },
    ],
    []
  );

  const filterLabel = useMemo(() => filterOptions.find((option) => option.value === filter)?.label ?? "Apps", [filter, filterOptions]);
  const statusLabel = useMemo(() => statusOptions.find((option) => option.value === statusFilter)?.label ?? "Any status", [statusFilter, statusOptions]);
  const sortLabel = useMemo(() => sortOptions.find((option) => option.value === sortOrder)?.label ?? "Name (A-Z)", [sortOrder, sortOptions]);

  const quickControlSelects: QuickControlSelect[] = useMemo(
    () => [
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
    ],
    [filterLabel, statusLabel, sortLabel, filterOptions, statusOptions, sortOptions, filter, statusFilter, sortOrder, setFilter, setStatusFilter, setSortOrder]
  );

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
    handleResetFilters: handleResetFiltersAndSelection,
    isBusy,
  };
}
