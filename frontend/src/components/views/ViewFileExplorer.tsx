import React, { useState, useEffect, useMemo } from 'react';
import path from 'path-browserify';

import {
  ListFiles,
  PushFile,
  PullFile,
  SelectSaveDirectory,
  SelectDirectoryForPull,
  DeleteFile,
  CreateFolder,
  RenameFile,
  DeleteMultipleFiles,
  PullMultipleFiles,
  SelectFilesToPush,
  SelectFoldersToPush,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  Upload,
  Download,
  FolderUp,
  Trash2,
  AlertTriangle,
  Pencil,
  FolderPlus, 
} from 'lucide-react';
import { ExplorerOverviewCard } from '@/components/fileExplorer/ExplorerOverviewCard';
import { DirectoryContentsCard } from '@/components/fileExplorer/DirectoryContentsCard';
import type { ExplorerActionItem } from '@/components/fileExplorer/ExplorerOverviewCard';

type FileEntry = backend.FileEntry;

export function ViewFileExplorer({ activeView }: { activeView: string }) {
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/sdcard/');
  const [isLoading, setIsLoading] = useState(false);

  const [isPushingFile, setIsPushingFile] = useState(false);
  const [isPushingFolder, setIsPushingFolder] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'date' | 'size'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (isRenameOpen && selectedFileNames.length === 1) {
      setNewName(selectedFileNames[0]);
    } else {
      setNewName('');
    }
  }, [isRenameOpen, selectedFileNames]);

  useEffect(() => {
    if (activeView === 'files') {
      loadFiles(currentPath);
    }
  }, [activeView]);

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    setSelectedFileNames([]);
    try {
      const files = await ListFiles(path);
      if (!files) {
        setFileList([]);
        setCurrentPath(path);
        setIsLoading(false);
        return;
      }
      files.sort((a, b) => {
        if (a.Type === 'Directory' && b.Type !== 'Directory') return -1;
        if (a.Type !== 'Directory' && b.Type === 'Directory') return 1;
        return a.Name.localeCompare(b.Name);
      });
      setFileList(files);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to list files:', error);
      toast.error('Failed to list files', { description: String(error) });
      setCurrentPath(currentPath);
    }
    setIsLoading(false);
  };

  const handleRowClick = (file: FileEntry) => {
    const isSelected = selectedFileNames.includes(file.Name);
    handleSelectFile(file.Name, !isSelected);
  };

  const handleRowDoubleClick = (file: FileEntry) => {
    if (file.Type === 'Directory') {
      const newPath = path.posix.join(currentPath, file.Name) + '/';
      loadFiles(newPath);
    }
  };

  const handleBackClick = () => {
    if (currentPath === '/') return;
    const newPath = path.posix.join(currentPath, '..') + '/';
    loadFiles(newPath);
  };

  type BatchFailure = {
    name: string;
    error: string;
  };

  const getBasename = (fullPath: string) =>
    fullPath.replace(/\\/g, '/').split('/').pop() || fullPath;

  const showBatchToast = (
    toastId: string | number,
    entityLabel: string,
    total: number,
    failures: BatchFailure[]
  ) => {
    if (total === 0) {
      return;
    }

    if (failures.length === 0) {
      toast.success(
        `Imported ${total} ${entityLabel}${total > 1 ? 's' : ''}`,
        { id: toastId }
      );
      return;
    }

    const description = failures
      .slice(0, 5)
      .map((item) => `${item.name}: ${item.error}`)
      .join('\n');

    const successCount = total - failures.length;
    const title =
      failures.length === total
        ? `Failed to import ${entityLabel}${total > 1 ? 's' : ''}`
        : `Imported ${successCount}/${total} ${entityLabel}${
            successCount === 1 ? '' : 's'
          }`;

    toast.error(title, {
      id: toastId,
      description,
      duration: 8000,
    });
  };

  const handlePushFile = async () => {
    setIsPushingFile(true);
    let toastId: string | number | undefined;
    try {
      const localPaths = await SelectFilesToPush();
      if (!localPaths || localPaths.length === 0) {
        return;
      }

      const description =
        localPaths.length === 1
          ? `To: ${path.posix.join(currentPath, getBasename(localPaths[0]))}`
          : undefined;
      toastId = toast.loading(
        localPaths.length === 1
          ? `Pushing ${getBasename(localPaths[0])}...`
          : `Pushing ${localPaths.length} files...`,
        { description }
      );

      const failures: BatchFailure[] = [];
      for (const localPath of localPaths) {
        const fileName = getBasename(localPath);
        const remotePath = path.posix.join(currentPath, fileName);
        try {
          await PushFile(localPath, remotePath);
        } catch (error) {
          console.error('Import file error:', error);
          failures.push({ name: fileName, error: String(error) });
        }
      }

      showBatchToast(toastId, 'file', localPaths.length, failures);
      loadFiles(currentPath);
    } catch (error) {
      console.error('Import file error:', error);
      if (toastId) {
        toast.error('File Import Failed', {
          description: String(error),
          id: toastId,
        });
      } else {
        toast.error('File Import Failed', { description: String(error) });
      }
    } finally {
      setIsPushingFile(false);
    }
  };

  const handlePushFolder = async () => {
    setIsPushingFolder(true);
    let toastId: string | number | undefined;
    try {
      const localFolders = await SelectFoldersToPush();
      if (!localFolders || localFolders.length === 0) {
        return;
      }

      toastId = toast.loading(
        localFolders.length === 1
          ? `Pushing folder ${getBasename(localFolders[0])}...`
          : `Pushing ${localFolders.length} folders...`,
        {
          description:
            localFolders.length === 1 ? `To: ${currentPath}` : undefined,
        }
      );

      const failures: BatchFailure[] = [];
      for (const localFolderPath of localFolders) {
        const folderName = getBasename(localFolderPath);
        try {
          await PushFile(localFolderPath, currentPath);
        } catch (error) {
          console.error('Import folder error:', error);
          failures.push({ name: folderName, error: String(error) });
        }
      }

      showBatchToast(toastId, 'folder', localFolders.length, failures);
      loadFiles(currentPath);
    } catch (error) {
      console.error('Import folder error:', error);
      if (toastId) {
        toast.error('Folder Import Failed', {
          description: String(error),
          id: toastId,
        });
      } else {
        toast.error('Folder Import Failed', {
          description: String(error),
        });
      }
    } finally {
      setIsPushingFolder(false);
    }
  };

  const handleMultiExport = async () => {
    if (selectedFileNames.length === 0) {
      toast.error('No files selected to export.');
      return;
    }

    setIsPulling(true);
    const remotePaths = selectedFileNames.map((name) =>
      path.posix.join(currentPath, name)
    );
    const toastId = toast.loading(
      `Exporting ${selectedFileNames.length} items...`
    );

    try {
      const output = await PullMultipleFiles(remotePaths);

      if (output.includes('cancelled by user')) {
        toast.info('Export Cancelled', { id: toastId });
      } else {
        toast.success('Batch Export Complete', {
          description: output,
          id: toastId,
          duration: 8000,
        });
      }
      setSelectedFileNames([]);
    } catch (error) {
      console.error('Batch export error:', error);
      toast.error('Batch Export Failed', {
        description: String(error),
        id: toastId,
      });
    }
    setIsPulling(false);
  };

  const handleMultiDelete = async () => {
    if (selectedFileNames.length === 0) {
      toast.error('No files selected to delete.');
      return;
    }

    setIsDeleting(true);
    const fullPaths = selectedFileNames.map((name) =>
      path.posix.join(currentPath, name)
    );
    const toastId = toast.loading(
      `Deleting ${selectedFileNames.length} items...`
    );

    try {
      const output = await DeleteMultipleFiles(fullPaths);
      toast.success('Batch Delete Complete', {
        description: output,
        id: toastId,
        duration: 8000,
      });
      loadFiles(currentPath);
      setSelectedFileNames([]);
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error('Batch Delete Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleRename = async () => {
    if (selectedFileNames.length !== 1) {
      toast.error('Please select exactly one file to rename.');
      return;
    }
    if (!newName || newName.trim() === '') {
      toast.error('New name cannot be empty.');
      return;
    }

    setIsRenaming(true);
    const oldName = selectedFileNames[0];
    const oldPath = path.posix.join(currentPath, oldName);
    const newPath = path.posix.join(currentPath, newName);
    const toastId = toast.loading(`Renaming to ${newName}...`);

    try {
      const output = await RenameFile(oldPath, newPath);
      toast.success('Rename Successful', {
        description: output,
        id: toastId,
      });
      setIsRenameOpen(false);
      loadFiles(currentPath);
      setSelectedFileNames([]);
    } catch (error) {
      console.error('Rename error:', error);
      toast.error('Rename Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName || newFolderName.trim() === '') {
      toast.error('Folder name cannot be empty.');
      return;
    }
    setIsCreatingFolder(true);
    const fullPath = path.posix.join(currentPath, newFolderName);
    const toastId = toast.loading(`Creating folder ${newFolderName}...`);
    try {
      const output = await CreateFolder(fullPath);
      toast.success('Folder Created', {
        description: output,
        id: toastId,
      });
      setIsCreateFolderOpen(false);
      setNewFolderName('');
      loadFiles(currentPath);
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('Create Folder Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const visibleFiles = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();

    const filtered = fileList.filter((file) =>
      lowerSearch ? file.Name.toLowerCase().includes(lowerSearch) : true
    );

    return filtered.sort((a, b) => {
      if (a.Type === 'Directory' && b.Type !== 'Directory') return -1;
      if (a.Type !== 'Directory' && b.Type === 'Directory') return 1;

      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.Name.localeCompare(b.Name);
      } else if (sortField === 'date') {
        const dateA = `${a.Date ?? ''} ${a.Time ?? ''}`.trim();
        const dateB = `${b.Date ?? ''} ${b.Time ?? ''}`.trim();
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'size') {
        const sizeA = parseInt(a.Size || '0', 10);
        const sizeB = parseInt(b.Size || '0', 10);
        comparison = sizeA - sizeB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [fileList, searchTerm, sortField, sortDirection]);

  const allVisibleSelected =
    visibleFiles.length > 0 &&
    visibleFiles.every((file) => selectedFileNames.includes(file.Name));

  const handleSelectFile = (fileName: string, checked: boolean) => {
    if (checked) {
      setSelectedFileNames((prev) =>
        prev.includes(fileName) ? prev : [...prev, fileName]
      );
    } else {
      setSelectedFileNames((prev) =>
        prev.filter((name) => name !== fileName)
      );
    }
  };

  const handleSelectAllFiles = (
    checked: boolean,
    targetList: FileEntry[] = fileList
  ) => {
    const targetNames = targetList.map((file) => file.Name);
    const targetSet = new Set(targetNames);

    if (targetNames.length === 0) {
      return;
    }

    if (checked) {
      setSelectedFileNames((prev) => {
        const merged = new Set(prev);
        targetSet.forEach((name) => merged.add(name));
        return Array.from(merged);
      });
    } else {
      setSelectedFileNames((prev) =>
        prev.filter((name) => !targetSet.has(name))
      );
    }
  };

const isBusy =
    isLoading ||
    isPushingFile ||
    isPushingFolder ||
    isPulling ||
    isDeleting ||
    isRenaming ||
    isCreatingFolder;
  const isExportDisabled = isPulling || selectedFileNames.length === 0;
  const isDeleteDisabled = isDeleting || selectedFileNames.length === 0;
  const isRenameDisabled = isRenaming || selectedFileNames.length !== 1;
  const selectedCount = selectedFileNames.length;

  const explorerStats = useMemo(
    () => {
      const folderCount = fileList.filter((file) => file.Type === 'Directory').length;
      const fileCount = Math.max(fileList.length - folderCount, 0);
      return {
        totalItems: fileList.length,
        folderCount,
        fileCount,
      };
    },
    [fileList]
  );

  const actionItems: ExplorerActionItem[] = [
    {
      key: 'import-file',
      label: 'Import file',
      icon: Upload,
      onClick: handlePushFile,
      disabled: isBusy,
      variant: 'outline',
    },
    {
      key: 'import-folder',
      label: 'Import folder',
      icon: FolderUp,
      onClick: handlePushFolder,
      disabled: isBusy,
      variant: 'outline',
    },
    {
      key: 'new-folder',
      label: 'New folder',
      icon: FolderPlus,
      onClick: () => setIsCreateFolderOpen(true),
      disabled: isBusy,
      variant: 'default',
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: Pencil,
      onClick: () => setIsRenameOpen(true),
      disabled: isRenameDisabled || isBusy,
      variant: 'outline',
    },
    {
      key: 'export',
      label: `Export (${selectedCount})`,
      icon: Download,
      onClick: handleMultiExport,
      disabled: isExportDisabled || isBusy,
      variant: 'outline',
    },
    {
      key: 'delete',
      label: `Delete (${selectedCount})`,
      icon: Trash2,
      onClick: () => setIsDeleteOpen(true),
      disabled: isDeleteDisabled || isBusy,
      variant: 'destructive',
    },
  ];

  return (
    <>
      <Dialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in {currentPath}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-3"
                placeholder="New Folder Name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for {selectedFileNames.length === 1 ? selectedFileNames[0] : 'the selected item'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                New Name
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <br />
              <span className="font-mono font-semibold text-foreground">
                {selectedFileNames.length} selected item(s)
              </span>
              , including all contents if any are folders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleMultiDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Yes, Delete {selectedFileNames.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-5">
        <ExplorerOverviewCard
          explorerStats={explorerStats}
          selectedCount={selectedCount}
          currentPath={currentPath}
          isBusy={isBusy}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          sortField={sortField}
          onSortFieldChange={(value) => setSortField(value)}
          sortDirection={sortDirection}
          onToggleSortDirection={() =>
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
          }
          onBack={handleBackClick}
          canGoBack={currentPath !== '/'}
          onRefresh={() => loadFiles(currentPath)}
          actionItems={actionItems}
        />

        <DirectoryContentsCard
          visibleFiles={visibleFiles}
          fileList={fileList}
          isLoading={isLoading}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAll={(checked) =>
            handleSelectAllFiles(checked, visibleFiles)
          }
          selectedFileNames={selectedFileNames}
          onSelectFile={handleSelectFile}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
    </>
  );
}
