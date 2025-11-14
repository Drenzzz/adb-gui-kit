import React, { useState, useEffect } from 'react';

import { GetDevices, GetDeviceInfo } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';
import { DeviceListCard } from '../dashboard/DeviceListCard';
import { WirelessAdbCard } from '../dashboard/WirelessAdbCard';
import { DeviceInfoCard } from '../dashboard/DeviceInfoCard';


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
      <DeviceListCard
        devices={devices}
        isRefreshing={isRefreshingDevices}
        onRefresh={refreshDevices}
      />

      <WirelessAdbCard
        hasUsbDevice={devices.length > 0}
        defaultIp={deviceInfo?.IPAddress}
        onDevicesUpdated={refreshDevices}
      />

      <DeviceInfoCard
        devices={devices}
        deviceInfo={deviceInfo}
        isRefreshing={isRefreshingInfo}
        onRefresh={refreshInfo}
      />
    </div>
  );
}
