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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Loader2,
  RefreshCw,
  Upload,
  Download,
  Folder,
  File,
  ArrowUp,
  FolderUp,
  Trash2,
  AlertTriangle,
  Pencil,
  FolderPlus, 
  Search,
  ArrowUpAZ,
  ArrowDownAZ,
} from 'lucide-react';

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

      <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              File Explorer
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadFiles(currentPath)}
                disabled={isBusy}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handlePushFile}
                disabled={isBusy}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import File
              </Button>
              <Button
                variant="outline"
                onClick={handlePushFolder}
                disabled={isBusy}
              >
                <FolderUp className="mr-2 h-4 w-4" />
                Import Folder
              </Button>
              <Button
                variant="default"
                disabled={isBusy}
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
              <Button
                variant="default"
                disabled={isRenameDisabled || isBusy}
                onClick={() => setIsRenameOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </Button>
              <Button
                variant="default"
                onClick={handleMultiExport}
                disabled={isExportDisabled || isBusy}
              >
                <Download className="mr-2 h-4 w-4" />
                Export ({selectedFileNames.length})
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleteDisabled || isBusy}
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedFileNames.length})
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                disabled={currentPath === '/' || isBusy}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <p className="font-mono text-sm truncate">{currentPath}</p>
            </div>
          </CardContent>

          <CardContent className="pt-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:max-w-sm relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search files or folders..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={sortField}
                  onChange={(e) =>
                    setSortField(e.target.value as 'name' | 'date')
                  }
                  className="h-9 min-w-[170px] rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                  <option value="size">Sort by Size</option>
                </select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  aria-label="Toggle sort direction"
                >
                  {sortDirection === 'asc' ? (
                    <ArrowUpAZ className="h-4 w-4" />
                  ) : (
                    <ArrowDownAZ className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardContent className="p-0 flex-1 flex overflow-hidden min-h-0">
            <ScrollArea className="flex-1 h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAllFiles(
                            checked as boolean,
                            visibleFiles
                          )
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : visibleFiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {fileList.length === 0
                          ? 'This directory is empty.'
                          : 'No files match your search/filter.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleFiles.map((file) => (
                      <TableRow
                        key={file.Name}
                        onClick={() => handleRowClick(file)}
                        onDoubleClick={() => handleRowDoubleClick(file)}
                        data-state={
                          selectedFileNames.includes(file.Name)
                            ? 'selected'
                            : ''
                        }
                        className="cursor-pointer"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedFileNames.includes(file.Name)}
                            onCheckedChange={(checked) =>
                              handleSelectFile(
                                file.Name,
                                checked as boolean
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell>
                          {file.Type === 'Directory' ? (
                            <Folder className="h-4 w-4 text-blue-500" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {file.Name}
                        </TableCell>
                        <TableCell>{file.Size}</TableCell>
                        <TableCell>{file.Date}</TableCell>
                        <TableCell>{file.Time}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
