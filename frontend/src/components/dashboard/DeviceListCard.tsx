import React, { useState } from "react";
import { backend } from "../../../wailsjs/go/models";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, RefreshCw, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getNickname, setNickname } from "@/lib/nicknameStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

type Device = backend.Device;

interface DeviceListCardProps {
  devices: Device[];
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
}

export function DeviceListCard({ devices, isRefreshing, onRefresh }: DeviceListCardProps) {
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [newNickname, setNewNickname] = useState("");

  const handleOpenEdit = (device: Device) => {
    setEditingDevice(device);
    setNewNickname(getNickname(device.Serial) || "");
  };

  const handleCloseDialog = () => {
    setEditingDevice(null);
    setNewNickname("");
  };

  const handleSaveNickname = () => {
    if (editingDevice) {
      setNickname(editingDevice.Serial, newNickname);
      toast.success(`Nama panggilan disimpan untuk ${editingDevice.Serial}`);
    }
    handleCloseDialog();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone />
            Connected Devices
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">{isRefreshing ? "Scanning for devices..." : "No device detected. Ensure USB Debugging is enabled."}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {devices.map((device) => {
                const displayName = getNickname(device.Serial) || device.Serial;
                const isOnline = device.Status === "device";
                return (
                  <div key={device.Serial} className="flex items-center justify-between rounded-lg bg-muted p-3 group">
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold">{displayName}</span>
                      {displayName !== device.Serial && <span className="font-mono text-xs text-muted-foreground">{device.Serial}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isOnline ? "text-green-500" : "text-yellow-500"}`}>{device.Status}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleOpenEdit(device)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!editingDevice} onOpenChange={handleCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Nickname</AlertDialogTitle>
            <AlertDialogDescription>
              Give a nickname to the device:
              <span className="mt-2 block font-mono text-foreground">{editingDevice?.Serial}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Label htmlFor="nickname" className="text-left">
              Nickname
            </Label>
            <Input id="nickname" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Ex: My Device" className="mt-2" />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialog}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveNickname}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
