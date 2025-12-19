import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ListPackages } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";

export type FilterType = "user" | "system" | "all";
export type StatusFilter = "all" | "enabled" | "disabled";
export type PackageInfo = backend.PackageInfo;

export function usePackageList() {
  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [filter, setFilter] = useState<FilterType>("user");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  const loadPackages = useCallback(async (currentFilter: FilterType) => {
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
  }, []);

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

  const { totalPackages, enabledPackages, disabledPackages } = useMemo(() => {
    const total = packageList.length;
    const enabledCount = packageList.filter((pkg) => pkg.IsEnabled).length;
    return {
      totalPackages: total,
      enabledPackages: enabledCount,
      disabledPackages: total - enabledCount,
    };
  }, [packageList]);

  const handleResetFilters = useCallback(() => {
    setFilter("user");
    setStatusFilter("all");
    setSortOrder("asc");
    setSearchTerm("");
  }, []);

  return {
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
  };
}
