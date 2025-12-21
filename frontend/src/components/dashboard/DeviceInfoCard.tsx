import React from "react";
import { backend } from "../../../wailsjs/go/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Battery, Building, Code, Cpu, Database, Hash, Info, RefreshCw, Server, ShieldCheck, Smartphone, Tag, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Device = backend.Device;
type DeviceInfo = backend.DeviceInfo;

interface DeviceInfoCardProps {
  devices: Device[];
  deviceInfo: DeviceInfo | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function DeviceInfoCard({ devices, deviceInfo, isRefreshing, onRefresh }: DeviceInfoCardProps) {
  const infoItems = [
    { icon: <Building size={18} />, label: "Brand", value: deviceInfo?.Brand },
    {
      icon: <Tag size={18} />,
      label: "Device Name",
      value: deviceInfo?.DeviceName,
    },
    {
      icon: <Code size={18} />,
      label: "Codename",
      value: deviceInfo?.Codename,
    },
    {
      icon: <Smartphone size={18} />,
      label: "Model",
      value: deviceInfo?.Model,
    },
    {
      icon: <Hash size={18} />,
      label: "Serial Number",
      value: deviceInfo?.Serial,
    },
    {
      icon: <Server size={18} />,
      label: "Build Number",
      value: deviceInfo?.BuildNumber,
    },
    {
      icon: <Info size={18} />,
      label: "Android Version",
      value: deviceInfo?.AndroidVersion,
    },
    {
      icon: <Battery size={18} />,
      label: "Battery",
      value: deviceInfo?.BatteryLevel,
    },
    {
      icon: <Cpu size={18} />,
      label: "Total RAM",
      value: deviceInfo?.RamTotal,
    },
    {
      icon: <Database size={18} />,
      label: "Internal Storage",
      value: deviceInfo?.StorageInfo,
    },
    {
      icon: <Wifi size={18} />,
      label: "IP Address",
      value: deviceInfo?.IPAddress,
    },
    {
      icon: <ShieldCheck size={18} />,
      label: "Root Status",
      value: deviceInfo?.RootStatus,
      valueClassName: deviceInfo?.RootStatus === "Yes" ? "text-green-500 font-bold" : "text-muted-foreground",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Info />
          Device Info
        </CardTitle>
        <Button variant="default" onClick={onRefresh} disabled={isRefreshing || devices.length === 0}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Info
        </Button>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-muted-foreground">Connect a device to see info.</p>
        ) : !deviceInfo ? (
          <p className="text-muted-foreground">Click "Refresh Info" to load data.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {infoItems.map((item) => (
              <InfoItem key={item.label} {...item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  valueClassName?: string;
}

function InfoItem({ icon, label, value, valueClassName }: InfoItemProps) {
  return (
    <div className="flex items-center rounded-lg bg-muted p-3">
      <div className="mr-3 text-primary">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn("font-semibold truncate", valueClassName)}>{value ? value : "N/A"}</div>
      </div>
    </div>
  );
}
