import React from "react";
import { backend } from "../../../wailsjs/go/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Smartphone } from "lucide-react";

type Device = backend.Device;

interface FastbootDevicesCardProps {
  devices: Device[];
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function FastbootDevicesCard({
  devices,
  isRefreshing,
  error,
  onRefresh,
}: FastbootDevicesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Smartphone />
          Fastboot Devices
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-muted-foreground">
            {isRefreshing
              ? "Scanning for devices..."
              : "No fastboot device detected. Put your device in fastboot/bootloader mode."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {devices.map((device) => (
              <div
                key={device.Serial}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <span className="font-mono">{device.Serial}</span>
                <span className="font-semibold text-blue-500">
                  {device.Status}
                </span>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
