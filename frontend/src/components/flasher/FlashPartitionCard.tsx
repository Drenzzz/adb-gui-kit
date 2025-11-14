import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUp, Loader2 } from "lucide-react";

interface FlashPartitionCardProps {
  partition: string;
  onPartitionChange: (value: string) => void;
  filePath: string;
  onSelectFile: () => void;
  onFlash: () => void;
  isFlashing: boolean;
  canFlash: boolean;
}

export function FlashPartitionCard({
  partition,
  onPartitionChange,
  filePath,
  onSelectFile,
  onFlash,
  isFlashing,
  canFlash,
}: FlashPartitionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp />
          Flash Partition
        </CardTitle>
        <CardDescription>
          Flash an image file (.img) to a specific partition.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="partition" className="text-sm font-medium">
            Partition Name
          </label>
          <Input
            id="partition"
            placeholder="e.g., boot, recovery, vendor_boot"
            value={partition}
            onChange={(e) => onPartitionChange(e.target.value)}
            disabled={isFlashing}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Image File (.img)</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSelectFile}
              disabled={isFlashing}
            >
              Select File
            </Button>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {filePath ? filePath : "No file selected."}
          </p>
        </div>

        <Button
          variant="default"
          className="w-full"
          disabled={isFlashing || !partition || !filePath || !canFlash}
          onClick={onFlash}
        >
          {isFlashing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="mr-2 h-4 w-4" />
          )}
          Flash Partition
        </Button>
      </CardContent>
    </Card>
  );
}
