import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { backend } from "../../../wailsjs/go/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ROW_HEIGHT = 48;

export function DirectoryContentsCard({ visibleFiles, fileList, isLoading, allVisibleSelected, onToggleSelectAll, selectedFileNames, onSelectFile, onRowClick, onRowDoubleClick }: DirectoryContentsCardProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: visibleFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();

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
          <div className="min-w-[640px]">
            <div className="sticky top-0 z-10 flex bg-muted/60 backdrop-blur border-b">
              <div className="flex items-center justify-center w-[50px] h-10 px-4">
                <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => onToggleSelectAll(Boolean(checked))} aria-label="Select all" />
              </div>
              <div className="flex items-center justify-center w-[50px] h-10"></div>
              <div className="flex-1 flex items-center h-10 px-4 text-sm font-medium text-muted-foreground">Name</div>
              <div className="flex items-center w-[80px] h-10 px-4 text-sm font-medium text-muted-foreground">Size</div>
              <div className="flex items-center w-[100px] h-10 px-4 text-sm font-medium text-muted-foreground">Date</div>
              <div className="flex items-center w-[80px] h-10 px-4 text-sm font-medium text-muted-foreground">Time</div>
            </div>

            <div ref={parentRef} className="max-h-[60vh] overflow-auto custom-scroll">
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : visibleFiles.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground">{fileList.length === 0 ? "This directory is empty." : "No files match your search/filter."}</div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualRows.map((virtualRow) => {
                    const file = visibleFiles[virtualRow.index];
                    const isSelected = selectedFileNames.includes(file.Name);

                    return (
                      <div
                        key={file.Name}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        onClick={() => onRowClick(file)}
                        onDoubleClick={() => onRowDoubleClick(file)}
                        className={`absolute top-0 left-0 w-full flex items-center border-b cursor-pointer hover:bg-muted/40 ${isSelected ? "bg-muted/20" : ""}`}
                        style={{
                          height: `${ROW_HEIGHT}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="flex items-center justify-center w-[50px] px-4">
                          <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelectFile(file.Name, Boolean(checked))} onClick={(e) => e.stopPropagation()} aria-label="Select row" />
                        </div>
                        <div className="flex items-center justify-center w-[50px]">{file.Type === "Directory" ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-muted-foreground" />}</div>
                        <div className="flex-1 px-4 font-medium text-sm truncate">{file.Name}</div>
                        <div className="w-[80px] px-4 text-sm text-muted-foreground">{file.Size}</div>
                        <div className="w-[100px] px-4 text-sm text-muted-foreground">{file.Date}</div>
                        <div className="w-[80px] px-4 text-sm text-muted-foreground">{file.Time}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
