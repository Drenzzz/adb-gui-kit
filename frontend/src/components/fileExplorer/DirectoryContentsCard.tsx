import React from "react";
import { backend } from "../../../wailsjs/go/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { File, Folder, Loader2 } from "lucide-react";

type FileEntry = backend.FileEntry;

interface DirectoryContentsCardProps {
  visibleFiles: FileEntry[];
  fileList: FileEntry[];
  isLoading: boolean;
  allVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  selectedFileNames: string[];
  onSelectFile: (fileName: string, checked: boolean) => void;
  onRowClick: (file: FileEntry) => void;
  onRowDoubleClick: (file: FileEntry) => void;
}

export function DirectoryContentsCard({ visibleFiles, fileList, isLoading, allVisibleSelected, onToggleSelectAll, selectedFileNames, onSelectFile, onRowClick, onRowDoubleClick }: DirectoryContentsCardProps) {
  return (
    <Card className="flex flex-1 flex-col overflow-hidden border border-border/60 shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Directory contents</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing {visibleFiles.length} of {fileList.length} item(s) in this location.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border bg-card/80">
          <ScrollArea className="max-h-[60vh] overflow-auto">
            <div className="min-w-[640px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))} aria-label="Select all" />
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
                        {fileList.length === 0 ? "This directory is empty." : "No files match your search/filter."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleFiles.map((file) => {
                      const isSelected = selectedFileNames.includes(file.Name);
                      return (
                        <TableRow key={file.Name} onClick={() => onRowClick(file)} onDoubleClick={() => onRowDoubleClick(file)} data-state={isSelected ? "selected" : ""} className="cursor-pointer">
                          <TableCell>
                            <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectFile(file.Name, Boolean(checked))} onClick={(e) => e.stopPropagation()} aria-label="Select row" />
                          </TableCell>
                          <TableCell>{file.Type === "Directory" ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-muted-foreground" />}</TableCell>
                          <TableCell className="font-medium">{file.Name}</TableCell>
                          <TableCell>{file.Size}</TableCell>
                          <TableCell>{file.Date}</TableCell>
                          <TableCell>{file.Time}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
