import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, AlertTriangle } from "lucide-react";
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
} from "@/components/ui/alert-dialog";

interface RecoveryActionsCardProps {
  sideloadFilePath: string;
  onSelectSideloadFile: () => void;
  isSideloading: boolean;
  onSideload: () => void;
  isWiping: boolean;
  onWipe: () => void;
  canWipe: boolean;
}

export function RecoveryActionsCard({
  sideloadFilePath,
  onSelectSideloadFile,
  isSideloading,
  onSideload,
  isWiping,
  onWipe,
  canWipe,
}: RecoveryActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package />
          Recovery & Danger Zone
        </CardTitle>
        <CardDescription>
          Send a flashable ZIP via adb sideload while your device is in recovery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium">Recovery Sideload (.zip)</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onSelectSideloadFile}
              disabled={isSideloading}
            >
              Select ZIP
            </Button>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {sideloadFilePath ? sideloadFilePath : "No ZIP selected."}
          </p>
          <p className="text-sm text-muted-foreground">
            Ensure the device shows recovery sideload mode before starting the transfer.
          </p>
          <Button
            variant="default"
            className="w-full"
            disabled={isSideloading || !sideloadFilePath}
            onClick={onSideload}
          >
            {isSideloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Package className="mr-2 h-4 w-4" />
            )}
            Sideload Package
          </Button>
        </div>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone - Factory Reset
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isWiping || !canWipe}
              >
                {isWiping ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Wipe Data (Factory Reset)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone and will erase all user data (photos, files, settings) on the device.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={onWipe}
                >
                  Yes, Wipe Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
