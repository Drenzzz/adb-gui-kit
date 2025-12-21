import React from "react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { ExplorerOverviewCard } from "@/components/fileExplorer/ExplorerOverviewCard";
import { DirectoryContentsCard } from "@/components/fileExplorer/DirectoryContentsCard";
import { useFileExplorer } from "@/hooks/useFileExplorer";

export function ViewFileExplorer({ activeView }: { activeView: string }) {
  const {
    fileList,
    currentPath,
    isLoading,
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
    loadFiles,
    handleRowClick,
    handleRowDoubleClick,
    handleBackClick,
    handleMultiDelete,
    handleRename,
    handleCreateFolder,
    visibleFiles,
    allVisibleSelected,
    handleSelectFile,
    handleSelectAllFiles,
    isBusy,
    selectedCount,
    explorerStats,
    actionItems,
  } = useFileExplorer({ activeView });

  return (
    <>
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder in {currentPath}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folder-name" className="text-right">
                Name
              </Label>
              <Input id="folder-name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="col-span-3" placeholder="New Folder Name" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Enter a new name for {selectedFileNames.length === 1 ? selectedFileNames[0] : "the selected item"}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                New Name
              </Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <span className="font-mono font-semibold text-foreground">{selectedFileNames.length} selected item(s)</span>, including all contents if any are folders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleMultiDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
          onToggleSortDirection={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
          onBack={handleBackClick}
          canGoBack={currentPath !== "/"}
          onRefresh={() => loadFiles(currentPath)}
          actionItems={actionItems}
        />

        <DirectoryContentsCard
          visibleFiles={visibleFiles}
          fileList={fileList}
          isLoading={isLoading}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAll={(checked) => handleSelectAllFiles(checked, visibleFiles)}
          selectedFileNames={selectedFileNames}
          onSelectFile={handleSelectFile}
          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
    </>
  );
}
