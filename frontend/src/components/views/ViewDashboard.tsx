import React, { useState, useEffect } from 'react';

import { GetDevices, GetDeviceInfo } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Battery, Info, Server, RefreshCw, Loader2, Hash, Wifi, ShieldCheck, Cpu, Database, Code, Building } from "lucide-react";
import { cn } from "@/lib/utils";

type Device = backend.Device;
type DeviceInfo = backend.DeviceInfo;

export function ViewDashboard({ activeView }: { activeView: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isRefreshingInfo, setIsRefreshingInfo] = useState(false);

  const refreshDevices = async () => {
    setIsRefreshingDevices(true);
    try {
      const result = await GetDevices();
      setDevices(result || []); 
    } catch (error) {
      console.error("Error refreshing devices:", error);
      setDevices([]); 
    }
    setIsRefreshingDevices(false);
  };

  const refreshInfo = async () => {
    if (devices.length === 0) {
      setDeviceInfo(null);
      return;
    }
    
    setIsRefreshingInfo(true);
    try {
      const result = await GetDeviceInfo();
      setDeviceInfo(result);
    } catch (error) {
      console.error("Error refreshing device info:", error);
      setDeviceInfo(null);
    }
    setIsRefreshingInfo(false);
  };

  useEffect(() => {
    if (activeView === 'dashboard') {
      refreshDevices();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'dashboard') {
      const interval = setInterval(() => {
        if (!isRefreshingDevices) {
          refreshDevices();
        }
      }, 3000); 
      
      return () => clearInterval(interval);
    }
  }, [activeView, isRefreshingDevices]);

  return (
    <div className="flex flex-col gap-6">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone />
            Connected Devices
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={refreshDevices} disabled={isRefreshingDevices}>
            {isRefreshingDevices ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">
              {isRefreshingDevices ? "Scanning for devices..." : "No device detected. Ensure USB Debugging is enabled."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {devices.map((device) => (
                <div key={device.Serial} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-mono">{device.Serial}</span>
                  <span 
                    className={`font-semibold ${
                      device.Status === 'device' ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {device.Status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info />
            Device Info
          </CardTitle>
          <Button 
            variant="default" 
            onClick={refreshInfo} 
            disabled={isRefreshingInfo || devices.length === 0}
          >
            {isRefreshingInfo ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Info
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">Connect a device to see info.</p>
          ) : !deviceInfo ? (
             <p className="text-muted-foreground">Click "Refresh Info" to load data.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <InfoItem icon={<Building size={18} />} label="Brand" value={deviceInfo.Brand} />
              <InfoItem icon={<Code size={18} />} label="Codename" value={deviceInfo.Codename} />
              <InfoItem icon={<Smartphone size={18} />} label="Model" value={deviceInfo.Model} />
              <InfoItem icon={<Server size={18} />} label="Build Number" value={deviceInfo.BuildNumber} />
              <InfoItem icon={<Info size={18} />} label="Android Version" value={deviceInfo.AndroidVersion} />
              <InfoItem icon={<Battery size={18} />} label="Battery" value={deviceInfo.BatteryLevel} />
              <InfoItem icon={<Cpu size={18} />} label="Total RAM" value={deviceInfo.RamTotal} />
              <InfoItem icon={<Database size={18} />} label="Internal Storage" value={deviceInfo.StorageInfo} />
              <InfoItem icon={<Wifi size={18} />} label="IP Address" value={deviceInfo.IPAddress} />
              <InfoItem icon={<ShieldCheck size={18} />} label="Root Status" value={deviceInfo.RootStatus}
                valueClassName={deviceInfo.RootStatus === 'Yes' ? 'text-green-500 font-bold' : 'text-muted-foreground'}/>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ 
  icon, 
  label, 
  value,
  valueClassName
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: string,
  valueClassName?: string
}) {
  return (
    <div className="flex items-center p-3 bg-muted rounded-lg">
      <div className="mr-3 text-primary">{icon}</div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={cn("font-semibold truncate", valueClassName)}>
          {value ? value : "N/A"}
        </div>
      </div>
    </div>
  );
}
