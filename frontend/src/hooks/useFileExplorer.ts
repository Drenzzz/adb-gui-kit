import { useState, useEffect, useCallback, useMemo } from "react";
import path from "path-browserify";
import { Upload, Download, FolderUp, Trash2, Pencil, FolderPlus } from "lucide-react";
import type { ExplorerActionItem } from "@/components/fileExplorer/ExplorerOverviewCard";
import { useFileList } from "./useFileList";
import type { FileEntry } from "./useFileList";
import { useFileActions } from "./useFileActions";

interface UseFileExplorerOptions {
  activeView: string;
}

export function useFileExplorer({ activeView }: UseFileExplorerOptions) {
  const { fileList, currentPath, setCurrentPath, isLoading, searchTerm, setSearchTerm, sortField, setSortField, sortDirection, setSortDirection, loadFiles, visibleFiles, explorerStats } = useFileList();

  const {
    isPushingFile,
    isPushingFolder,
    isPulling,
    isDeleting,
    isRenaming,
    isCreatingFolder,
    handlePushFile: performPushFile,
    handlePushFolder: performPushFolder,
    handleMultiExport: performMultiExport,
    handleMultiDelete: performMultiDelete,
    handleRename: performRename,
    handleCreateFolder: performCreateFolder,
  } = useFileActions(currentPath, loadFiles);

  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (activeView === "files") {
      loadFiles(currentPath);
    }
  }, [activeView, currentPath, loadFiles]);

  // Update newName when rename dialog opens and single file selected
  useEffect(() => {
    if (isRenameOpen && selectedFileNames.length === 1) {
      setNewName(selectedFileNames[0]);
    } else {
      setNewName("");
    }
  }, [isRenameOpen, selectedFileNames]);

  const handleSelectFile = useCallback((fileName: string, checked: boolean) => {
    if (checked) {
      setSelectedFileNames((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]));
    } else {
      setSelectedFileNames((prev) => prev.filter((name) => name !== fileName));
    }
  }, []);

  const handleSelectAllFiles = useCallback(
    (checked: boolean, targetList: FileEntry[] = fileList) => {
      const targetNames = targetList.map((file) => file.Name);
      const targetSet = new Set(targetNames);

      if (targetNames.length === 0) return;

      if (checked) {
        setSelectedFileNames((prev) => {
          const merged = new Set(prev);
          targetSet.forEach((name) => merged.add(name));
          return Array.from(merged);
        });
      } else {
        setSelectedFileNames((prev) => prev.filter((name) => !targetSet.has(name)));
      }
    },
    [fileList]
  );

  const handleRowClick = useCallback(
    (file: FileEntry) => {
      const isSelected = selectedFileNames.includes(file.Name);
      handleSelectFile(file.Name, !isSelected);
    },
    [selectedFileNames, handleSelectFile]
  );

  const handleRowDoubleClick = useCallback(
    (file: FileEntry) => {
      if (file.Type === "Directory") {
        const newPath = path.posix.join(currentPath, file.Name) + "/";
        loadFiles(newPath);
        // Optional: Clear selection on navigation? original didn't explicitly clear but loadFiles resets list?
        // Actually loadFiles in original hook set selectedFileNames([])
        // My extracted useFileList loadFiles does NOT set selectedFileNames (it doesn't own it).
        // So I should clear selection here or in loadFiles wrapper.
        // But loadFiles is called inside useFileList.
        // I can add a useEffect on currentPath change to clear selection?
        // Or explicit clear here.
        setSelectedFileNames([]);
      }
    },
    [currentPath, loadFiles]
  );

  // Clear selection when path changes (except initial load?)
  // Actually original logic: loadFiles -> setSelectedFileNames([])
  // Be faithful to original: clearing selection on loadFiles start would be best,
  // but loadFiles is in useFileList.
  // We can wrap loadFiles?
  // Let's wrap loadFiles exposed to the view.

  const loadFilesAndClearSelection = useCallback(
    (targetPath: string) => {
      setSelectedFileNames([]);
      loadFiles(targetPath);
    },
    [loadFiles]
  );

  // Wait, handleRowDoubleClick calls loadFiles directly.
  // I should use loadFilesAndClearSelection there.

  // Re-define handleRowDoubleClick to use the wrapper?
  // Or just clear state locally.

  const handleBackClick = useCallback(() => {
    if (currentPath === "/") return;
    const newPath = path.posix.join(currentPath, "..") + "/";
    loadFiles(newPath);
    setSelectedFileNames([]);
  }, [currentPath, loadFiles]);

  const handlePushFile = useCallback(() => performPushFile(), [performPushFile]);
  const handlePushFolder = useCallback(() => performPushFolder(), [performPushFolder]);

  const handleMultiExport = useCallback(() => {
    performMultiExport(selectedFileNames, () => {
      setSelectedFileNames([]);
    });
  }, [performMultiExport, selectedFileNames]);

  const handleMultiDelete = useCallback(() => {
    performMultiDelete(selectedFileNames, () => {
      setSelectedFileNames([]);
      setIsDeleteOpen(false);
    });
  }, [performMultiDelete, selectedFileNames]);

  const handleRename = useCallback(() => {
    performRename(selectedFileNames[0], newName, () => {
      setIsRenameOpen(false);
      setSelectedFileNames([]);
    });
  }, [performRename, selectedFileNames, newName]);

  const handleCreateFolder = useCallback(() => {
    performCreateFolder(newFolderName, () => {
      setIsCreateFolderOpen(false);
      setNewFolderName("");
    });
  }, [performCreateFolder, newFolderName]);

  const isBusy = isLoading || isPushingFile || isPushingFolder || isPulling || isDeleting || isRenaming || isCreatingFolder;
  const isExportDisabled = isPulling || selectedFileNames.length === 0;
  const isDeleteDisabled = isDeleting || selectedFileNames.length === 0;
  const isRenameDisabled = isRenaming || selectedFileNames.length !== 1;
  const selectedCount = selectedFileNames.length;

  const allVisibleSelected = useMemo(() => {
    return visibleFiles.length > 0 && visibleFiles.every((file) => selectedFileNames.includes(file.Name));
  }, [visibleFiles, selectedFileNames]);

  const actionItems: ExplorerActionItem[] = useMemo(
    () => [
      {
        key: "import-file",
        label: "Import file",
        icon: Upload,
        onClick: handlePushFile,
        disabled: isBusy,
        variant: "outline",
      },
      {
        key: "import-folder",
        label: "Import folder",
        icon: FolderUp,
        onClick: handlePushFolder,
        disabled: isBusy,
        variant: "outline",
      },
      {
        key: "new-folder",
        label: "New folder",
        icon: FolderPlus,
        onClick: () => setIsCreateFolderOpen(true),
        disabled: isBusy,
        variant: "default",
      },
      {
        key: "rename",
        label: "Rename",
        icon: Pencil,
        onClick: () => setIsRenameOpen(true),
        disabled: isRenameDisabled || isBusy,
        variant: "outline",
      },
      {
        key: "export",
        label: `Export (${selectedCount})`,
        icon: Download,
        onClick: handleMultiExport,
        disabled: isExportDisabled || isBusy,
        variant: "outline",
      },
      {
        key: "delete",
        label: `Delete (${selectedCount})`,
        icon: Trash2,
        onClick: () => setIsDeleteOpen(true),
        disabled: isDeleteDisabled || isBusy,
        variant: "destructive",
      },
    ],
    [isBusy, isRenameDisabled, isExportDisabled, isDeleteDisabled, selectedCount, handlePushFile, handlePushFolder, handleMultiExport, handleMultiDelete]
  );

  return {
    fileList,
    currentPath,
    isLoading,
    isPushingFile,
    isPushingFolder,
    isPulling,
    isDeleting,
    isRenameOpen,
    setIsRenameOpen,
    isCreateFolderOpen,
    setIsCreateFolderOpen,
    newName,
    setNewName,
    newFolderName,
    setNewFolderName,
    isRenaming,
    isCreatingFolder,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedFileNames,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    loadFiles: loadFilesAndClearSelection, // Export wrapped version
    handleRowClick,
    handleRowDoubleClick: useCallback(
      (file: FileEntry) => {
        // Redefine locally to ensure correct closure
        if (file.Type === "Directory") {
          const newPath = path.posix.join(currentPath, file.Name) + "/";
          loadFiles(newPath);
          setSelectedFileNames([]);
        }
      },
      [currentPath, loadFiles]
    ),
    handleBackClick,
    handlePushFile,
    handlePushFolder,
    handleMultiExport,
    handleMultiDelete,
    handleRename,
    handleCreateFolder,
    visibleFiles,
    allVisibleSelected,
    handleSelectFile,
    handleSelectAllFiles,
    isBusy,
    isExportDisabled,
    isDeleteDisabled,
    isRenameDisabled,
    selectedCount,
    explorerStats,
    actionItems,
  };
}
