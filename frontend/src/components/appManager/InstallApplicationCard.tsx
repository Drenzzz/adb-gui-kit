import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, FileUp } from "lucide-react";

interface InstallApplicationCardProps {
  apkPath: string;
  isInstalling: boolean;
  onSelectApk: () => void;
  onInstall: () => void;
}

export function InstallApplicationCard({ apkPath, isInstalling, onSelectApk, onInstall }: InstallApplicationCardProps) {
  return (
    <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Install new application</CardTitle>
        <CardDescription>Use the picker below to sideload an APK onto the connected device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border-2 border-dashed border-muted-foreground/40 bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected file</p>
          <p className="mt-2 break-all text-base font-semibold text-foreground">{apkPath ? apkPath : "No file selected yet"}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" className="flex-1" onClick={onSelectApk} disabled={isInstalling}>
            <FileUp className="h-4 w-4" />
            Choose APK
          </Button>
          <Button size="lg" className="flex-1" disabled={isInstalling || !apkPath} onClick={onInstall}>
            {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Install to device
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Make sure the device allows installs from unknown sources over USB or wireless debugging.</p>
      </CardContent>
    </Card>
  );
}
