import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ListFiles } from "../../wailsjs/go/backend/App";
import { backend } from "../../wailsjs/go/models";

// Re-export types
export type FileEntry = backend.FileEntry;

export function useFileList() {
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("/sdcard/");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "date" | "size">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const loadFiles = useCallback(async (targetPath: string) => {
    setIsLoading(true);
    try {
      const files = await ListFiles(targetPath);
      if (!files) {
        setFileList([]);
        setCurrentPath(targetPath);
        return;
      }

      // Initial sort by type then name
      const sorted = [...files].sort((a, b) => {
        if (a.Type === "Directory" && b.Type !== "Directory") return -1;
        if (a.Type !== "Directory" && b.Type === "Directory") return 1;
        return a.Name.localeCompare(b.Name);
      });

      setFileList(sorted);
      setCurrentPath(targetPath);
    } catch (error) {
      console.error("Failed to list files:", error);
      toast.error("Failed to list files", { description: String(error) });
      // Keep current path if failed? Or update to target?
      // Current implementation kept old path if error, but updating state with error might be better?
      // Matches original behavior:
      // setCurrentPath(currentPath); // original hook kept old path on error implicitly by not updating it?
      // Actually original hook: setCurrentPath(currentPath) in catch block.
    } finally {
      setIsLoading(false);
    }
  }, []); // Logic is self-contained

  const visibleFiles = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const filtered = fileList.filter((file) => (lowerSearch ? file.Name.toLowerCase().includes(lowerSearch) : true));

    return filtered.sort((a, b) => {
      if (a.Type === "Directory" && b.Type !== "Directory") return -1;
      if (a.Type !== "Directory" && b.Type === "Directory") return 1;

      let comparison = 0;
      if (sortField === "name") {
        comparison = a.Name.localeCompare(b.Name);
      } else if (sortField === "date") {
        const dateA = `${a.Date ?? ""} ${a.Time ?? ""}`.trim();
        const dateB = `${b.Date ?? ""} ${b.Time ?? ""}`.trim();
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === "size") {
        const sizeA = parseInt(a.Size || "0", 10);
        const sizeB = parseInt(b.Size || "0", 10);
        comparison = sizeA - sizeB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [fileList, searchTerm, sortField, sortDirection]);

  const explorerStats = useMemo(() => {
    const folderCount = fileList.filter((file) => file.Type === "Directory").length;
    const fileCount = Math.max(fileList.length - folderCount, 0);
    return {
      totalItems: fileList.length,
      folderCount,
      fileCount,
    };
  }, [fileList]);

  return {
    fileList,
    currentPath,
    setCurrentPath,
    isLoading,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    loadFiles,
    visibleFiles,
    explorerStats,
  };
}
