import React, { useState, useEffect } from 'react';
import path from 'path-browserify';

import {
  ListFiles,
  PushFile,
  PullFile,
  SelectFileToPush,
  SelectSaveDirectory,
  SelectDirectoryForPull,
  SelectDirectoryToPush,
  DeleteFile,
  CreateFolder,
  RenameFile,
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
} from 'lucide-react';

type FileEntry = backend.FileEntry;

export function ViewFileExplorer({ activeView }: { activeView: string }) {
  const [fileList, setFileList] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState('/sdcard/');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
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

  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  useEffect(() => {
    if (isRenameOpen && selectedFile) {
      setNewName(selectedFile.Name);
    } else {
      setNewName('');
    }
  }, [isRenameOpen, selectedFile]);

  useEffect(() => {
    if (activeView === 'files') {
      loadFiles(currentPath);
    }
  }, [activeView]);

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    setSelectedFile(null);
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
    setSelectedFile(file);
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

  const handlePushFile = async () => {
    setIsPushingFile(true);
    let toastId: string | number = '';
    try {
      const localPath = await SelectFileToPush();
      if (!localPath) {
        setIsPushingFile(false);
        return;
      }
      const fileName =
        localPath.replace(/\\/g, '/').split('/').pop() ||
        path.basename(localPath);
      const remotePath = path.posix.join(currentPath, fileName);
      toastId = toast.loading(`Pushing ${fileName}...`, {
        description: `To: ${remotePath}`,
      });
      const output = await PushFile(localPath, remotePath);
      toast.success('File Import Complete', {
        description: output,
        id: toastId,
      });
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
    let toastId: string | number = '';
    try {
      const localFolderPath = await SelectDirectoryToPush();
      if (!localFolderPath) {
        setIsPushingFolder(false);
        return;
      }
      const remotePath = currentPath;
      const folderName =
        localFolderPath.replace(/\\/g, '/').split('/').pop() ||
        path.basename(localFolderPath);
      toastId = toast.loading(`Pushing folder ${folderName}...`, {
        description: `To: ${remotePath}`,
      });
      const output = await PushFile(localFolderPath, remotePath);
      toast.success('Folder Import Complete', {
        description: output,
        id: toastId,
      });
      loadFiles(currentPath);
    } catch (error) {
      console.error('Import folder error:', error);
      if (toastId) {
        toast.error('Folder Import Failed', {
          description: String(error),
          id: toastId,
        });
      } else {
        toast.error('Folder Import Failed', { description: String(error) });
      }
    }
    setIsPushingFolder(false);
  };

  const handlePull = async () => {
    if (!selectedFile) {
      toast.error('No file or folder selected to pull.');
      return;
    }
    if (selectedFile.Type !== 'File' && selectedFile.Type !== 'Directory') {
      toast.error('Cannot export this item type.', {
        description: `Selected type: ${selectedFile.Type}`,
      });
      return;
    }
    setIsPulling(true);
    let toastId: string | number = '';
    try {
      const remotePath = path.posix.join(currentPath, selectedFile.Name);
      let localPath = '';
      if (selectedFile.Type === 'Directory') {
        toast.info('Select a folder to save the directory into.');
        localPath = await SelectDirectoryForPull();
      } else {
        localPath = await SelectSaveDirectory(selectedFile.Name);
      }
      if (!localPath) {
        setIsPulling(false);
        return;
      }
      toastId = toast.loading(`Pulling ${selectedFile.Name}...`, {
        description: `From: ${remotePath}`,
      });
      const output = await PullFile(remotePath, localPath);
      toast.success('Export Complete', {
        description: `Saved to ${localPath}`,
        id: toastId,
      });
    } catch (error) {
      console.error('Export error:', error);
      if (toastId) {
        toast.error('Export Failed', {
          description: String(error),
          id: toastId,
        });
      } else {
        toast.error('Export Failed', { description: String(error) });
      }
    }
    setIsPulling(false);
  };

  const handleDelete = async () => {
    if (!selectedFile) {
      toast.error('No file selected to delete.');
      return;
    }
    setIsDeleting(true);
    const fullPath = path.posix.join(currentPath, selectedFile.Name);
    const toastId = toast.loading(`Deleting ${selectedFile.Name}...`);
    try {
      const output = await DeleteFile(fullPath);
      toast.success('Delete Successful', {
        description: output,
        id: toastId,
      });
      loadFiles(currentPath);
      setSelectedFile(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete Failed', {
        description: String(error),
        id: toastId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!selectedFile) {
      toast.error('No file selected to rename.');
      return;
    }
    if (!newName || newName.trim() === '') {
      toast.error('New name cannot be empty.');
      return;
    }
    setIsRenaming(true);
    const oldPath = path.posix.join(currentPath, selectedFile.Name);
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
      setSelectedFile(null);
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

  const handleSelectFile = (fileName: string, checked: boolean) => {
    if (checked) {
      setSelectedFileNames((prev) => [...prev, fileName]);
    } else {
      setSelectedFileNames((prev) =>
        prev.filter((name) => name !== fileName)
      );
    }
  };

  const handleSelectAllFiles = (checked: boolean) => {
    if (checked) {
      setSelectedFileNames(fileList.map((file) => file.Name));
    } else {
      setSelectedFileNames([]);
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
  const isPullDisabled =
    isPulling || !selectedFile || (selectedFile.Type !== 'File' && selectedFile.Type !== 'Directory');
  const isDeleteDisabled = isDeleting || !selectedFile;
  const isRenameDisabled = isRenaming || !selectedFile;

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
              Enter a new name for {selectedFile?.Name}
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
                onClick={handlePull}
                disabled={isPullDisabled || isBusy}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isDeleteDisabled || isBusy}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="text-destructive" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently
                      delete:
                      <br />
                      <span className="font-mono font-semibold text-foreground">
                        {selectedFile?.Name}
                      </span>
                      {selectedFile?.Type === 'Directory' &&
                        ' (and all its contents)'}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className={buttonVariants({ variant: 'destructive' })}
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Yes, Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardContent className="p-0 flex-1 flex overflow-hidden min-h-0">
            <ScrollArea className="flex-1 h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          fileList.length > 0 &&
                          selectedFileNames.length === fileList.length
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAllFiles(checked as boolean)
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
                  ) : fileList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        This directory is empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fileList.map((file) => (
                      <TableRow
                        key={file.Name}
                        onDoubleClick={() => handleRowDoubleClick(file)}
                        onClick={() => handleRowClick(file)}
                        data-state={
                          selectedFile?.Name === file.Name ||
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
