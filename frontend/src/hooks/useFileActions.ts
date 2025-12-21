import { useState, useCallback } from "react";
import path from "path-browserify";
import { toast } from "sonner";
import { PushFile, CreateFolder, RenameFile, DeleteMultipleFiles, PullMultipleFiles, SelectFilesToPush, SelectFoldersToPush } from "../../wailsjs/go/backend/App";

type BatchFailure = {
  name: string;
  error: string;
};

export function useFileActions(currentPath: string, refreshFiles: (path: string) => void) {
  const [isPushingFile, setIsPushingFile] = useState(false);
  const [isPushingFolder, setIsPushingFolder] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const getBasename = (fullPath: string) => fullPath.replace(/\\/g, "/").split("/").pop() || fullPath;

  const showBatchToast = (toastId: string | number, entityLabel: string, total: number, failures: BatchFailure[]) => {
    if (total === 0) return;

    if (failures.length === 0) {
      toast.success(`Imported ${total} ${entityLabel}${total > 1 ? "s" : ""}`, { id: toastId });
      return;
    }

    const description = failures
      .slice(0, 5)
      .map((item) => `${item.name}: ${item.error}`)
      .join("\n");

    const successCount = total - failures.length;
    const title = failures.length === total ? `Failed to import ${entityLabel}${total > 1 ? "s" : ""}` : `Imported ${successCount}/${total} ${entityLabel}${successCount === 1 ? "" : "s"}`;

    toast.error(title, {
      id: toastId,
      description,
      duration: 8000,
    });
  };

  const handlePushFile = useCallback(async () => {
    setIsPushingFile(true);
    let toastId: string | number | undefined;
    try {
      const localPaths = await SelectFilesToPush();
      if (!localPaths || localPaths.length === 0) return;

      const description = localPaths.length === 1 ? `To: ${path.posix.join(currentPath, getBasename(localPaths[0]))}` : undefined;
      toastId = toast.loading(localPaths.length === 1 ? `Pushing ${getBasename(localPaths[0])}...` : `Pushing ${localPaths.length} files...`, { description });

      const failures: BatchFailure[] = [];
      for (const localPath of localPaths) {
        const fileName = getBasename(localPath);
        const remotePath = path.posix.join(currentPath, fileName);
        try {
          await PushFile(localPath, remotePath);
        } catch (error) {
          console.error("Import file error:", error);
          failures.push({ name: fileName, error: String(error) });
        }
      }

      showBatchToast(toastId, "file", localPaths.length, failures);
      refreshFiles(currentPath);
    } catch (error) {
      console.error("Import file error:", error);
      if (toastId) {
        toast.error("File Import Failed", { description: String(error), id: toastId });
      } else {
        toast.error("File Import Failed", { description: String(error) });
      }
    } finally {
      setIsPushingFile(false);
    }
  }, [currentPath, refreshFiles]);

  const handlePushFolder = useCallback(async () => {
    setIsPushingFolder(true);
    let toastId: string | number | undefined;
    try {
      const localFolders = await SelectFoldersToPush();
      if (!localFolders || localFolders.length === 0) return;

      toastId = toast.loading(localFolders.length === 1 ? `Pushing folder ${getBasename(localFolders[0])}...` : `Pushing ${localFolders.length} folders...`, {
        description: localFolders.length === 1 ? `To: ${currentPath}` : undefined,
      });

      const failures: BatchFailure[] = [];
      for (const localFolderPath of localFolders) {
        const folderName = getBasename(localFolderPath);
        try {
          await PushFile(localFolderPath, currentPath);
        } catch (error) {
          console.error("Import folder error:", error);
          failures.push({ name: folderName, error: String(error) });
        }
      }

      showBatchToast(toastId, "folder", localFolders.length, failures);
      refreshFiles(currentPath);
    } catch (error) {
      console.error("Import folder error:", error);
      if (toastId) {
        toast.error("Folder Import Failed", { description: String(error), id: toastId });
      } else {
        toast.error("Folder Import Failed", { description: String(error) });
      }
    } finally {
      setIsPushingFolder(false);
    }
  }, [currentPath, refreshFiles]);

  const handleMultiExport = useCallback(
    async (selectedFileNames: string[], onSuccess: () => void) => {
      if (selectedFileNames.length === 0) {
        toast.error("No files selected to export.");
        return;
      }

      setIsPulling(true);
      const remotePaths = selectedFileNames.map((name) => path.posix.join(currentPath, name));
      const toastId = toast.loading(`Exporting ${selectedFileNames.length} items...`);

      try {
        const output = await PullMultipleFiles(remotePaths);

        if (output.includes("cancelled by user")) {
          toast.info("Export Cancelled", { id: toastId });
        } else {
          toast.success("Batch Export Complete", {
            description: output,
            id: toastId,
            duration: 8000,
          });
        }
        onSuccess();
      } catch (error) {
        console.error("Batch export error:", error);
        toast.error("Batch Export Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsPulling(false);
      }
    },
    [currentPath]
  );

  const handleMultiDelete = useCallback(
    async (selectedFileNames: string[], onSuccess: () => void) => {
      if (selectedFileNames.length === 0) {
        toast.error("No files selected to delete.");
        return;
      }

      setIsDeleting(true);
      const fullPaths = selectedFileNames.map((name) => path.posix.join(currentPath, name));
      const toastId = toast.loading(`Deleting ${selectedFileNames.length} items...`);

      try {
        const output = await DeleteMultipleFiles(fullPaths);
        toast.success("Batch Delete Complete", {
          description: output,
          id: toastId,
          duration: 8000,
        });
        refreshFiles(currentPath);
        onSuccess();
      } catch (error) {
        console.error("Batch delete error:", error);
        toast.error("Batch Delete Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsDeleting(false);
      }
    },
    [currentPath, refreshFiles]
  );

  const handleRename = useCallback(
    async (oldName: string, newName: string, onSuccess: () => void) => {
      if (!newName || newName.trim() === "") {
        toast.error("New name cannot be empty.");
        return;
      }

      setIsRenaming(true);
      const oldPath = path.posix.join(currentPath, oldName);
      const newPath = path.posix.join(currentPath, newName);
      const toastId = toast.loading(`Renaming to ${newName}...`);

      try {
        const output = await RenameFile(oldPath, newPath);
        toast.success("Rename Successful", {
          description: output,
          id: toastId,
        });
        refreshFiles(currentPath);
        onSuccess();
      } catch (error) {
        console.error("Rename error:", error);
        toast.error("Rename Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsRenaming(false);
      }
    },
    [currentPath, refreshFiles]
  );

  const handleCreateFolder = useCallback(
    async (folderName: string, onSuccess: () => void) => {
      if (!folderName || folderName.trim() === "") {
        toast.error("Folder name cannot be empty.");
        return;
      }
      setIsCreatingFolder(true);
      const fullPath = path.posix.join(currentPath, folderName);
      const toastId = toast.loading(`Creating folder ${folderName}...`);
      try {
        const output = await CreateFolder(fullPath);
        toast.success("Folder Created", {
          description: output,
          id: toastId,
        });
        refreshFiles(currentPath);
        onSuccess();
      } catch (error) {
        console.error("Create folder error:", error);
        toast.error("Create Folder Failed", {
          description: String(error),
          id: toastId,
        });
      } finally {
        setIsCreatingFolder(false);
      }
    },
    [currentPath, refreshFiles]
  );

  return {
    isPushingFile,
    isPushingFolder,
    isPulling,
    isDeleting,
    isRenaming,
    isCreatingFolder,
    handlePushFile,
    handlePushFolder,
    handleMultiExport,
    handleMultiDelete,
    handleRename,
    handleCreateFolder,
  };
}
