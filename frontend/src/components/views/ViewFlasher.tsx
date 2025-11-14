import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { WipeData, FlashPartition, SelectImageFile, GetFastbootDevices, SelectZipFile, SideloadPackage } from '../../../wailsjs/go/backend/App';
import { backend } from '../../../wailsjs/go/models';

import { toast } from "sonner";
import { FastbootDevicesCard } from "@/components/flasher/FastbootDevicesCard";
import { FlashPartitionCard } from "@/components/flasher/FlashPartitionCard";
import { RecoveryActionsCard } from "@/components/flasher/RecoveryActionsCard";

type Device = backend.Device;

const sanitizeFastbootDevices = (devices: Device[] | null | undefined): Device[] => {
  if (!Array.isArray(devices)) {
    return [];
  }

  return devices
    .filter((device): device is Device => !!device && typeof device.Serial === 'string')
    .map((device) => ({
      Serial: device.Serial,
      Status: device.Status ?? 'fastboot',
    }));
};

const areDeviceListsEqual = (a: Device[], b: Device[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i].Serial !== b[i].Serial || a[i].Status !== b[i].Status) {
      return false;
    }
  }

  return true;
};

export function ViewFlasher({ activeView }: { activeView: string }) {
  const [partition, setPartition] = useState('');
  const [filePath, setFilePath] = useState('');
  const [sideloadFilePath, setSideloadFilePath] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [isSideloading, setIsSideloading] = useState(false);

  const [fastbootDevices, setFastbootDevices] = useState<Device[]>([]);
  const [isRefreshingFastboot, setIsRefreshingFastboot] = useState(false);
  const [fastbootError, setFastbootError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fastbootDevicesRef = useRef<Device[]>([]);
  const refreshInFlightRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const emptyPollCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyFastbootDevices = useCallback((devices: Device[]) => {
    if (!isMountedRef.current) {
      return;
    }
    fastbootDevicesRef.current = devices;
    setFastbootDevices((current) =>
      areDeviceListsEqual(current, devices) ? current : devices
    );
  }, []);

  const refreshFastbootDevices = useCallback(
    async ({ silent }: { silent?: boolean } = {}) => {
      if (refreshInFlightRef.current) {
        queuedRefreshRef.current = true;
        return;
      }

      refreshInFlightRef.current = true;
      if (!silent && isMountedRef.current) {
        setIsRefreshingFastboot(true);
      }

      try {
        const result = await GetFastbootDevices();
        if (!isMountedRef.current) {
          return;
        }
        const sanitizedDevices = sanitizeFastbootDevices(result);
        setFastbootError(null);

        if (sanitizedDevices.length > 0) {
          emptyPollCountRef.current = 0;
          applyFastbootDevices(sanitizedDevices);
        } else {
          emptyPollCountRef.current += 1;
          if (
            fastbootDevicesRef.current.length === 0 ||
            emptyPollCountRef.current >= 2
          ) {
            applyFastbootDevices([]);
          }
        }
      } catch (error) {
        console.error("Error refreshing fastboot devices:", error);
        if (isMountedRef.current) {
          setFastbootError("Failed to refresh fastboot devices.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsRefreshingFastboot(false);
        }
        refreshInFlightRef.current = false;

        if (queuedRefreshRef.current && isMountedRef.current) {
          queuedRefreshRef.current = false;
          refreshFastbootDevices({ silent: true });
        } else {
          queuedRefreshRef.current = false;
        }
      }
    },
    [applyFastbootDevices]
  );

  useEffect(() => {
    fastbootDevicesRef.current = fastbootDevices;
  }, [fastbootDevices]);

  useEffect(() => {
    if (activeView !== 'flasher') {
      return;
    }

    emptyPollCountRef.current = 0;
    refreshFastbootDevices();
    const interval = window.setInterval(() => {
      refreshFastbootDevices({ silent: true });
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeView, refreshFastbootDevices]);

  const handleSelectFile = async () => {
    try {
      const selectedPath = await SelectImageFile(); 
      
      if (selectedPath) {
        setFilePath(selectedPath);
        toast.info(`File selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("File selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleSelectSideloadFile = async () => {
    try {
      const selectedPath = await SelectZipFile();

      if (selectedPath) {
        setSideloadFilePath(selectedPath);
        toast.info(`ZIP selected: ${selectedPath.split(/[/\\]/).pop()}`);
      }
    } catch (error) {
      console.error("ZIP selection error:", error);
      toast.error("Failed to open file dialog", { description: String(error) });
    }
  };

  const handleFlash = async () => {
    if (!partition) {
      toast.error("Partition name cannot be empty.");
      return;
    }
    if (!filePath) {
      toast.error("No file selected.");
      return;
    }

    setIsFlashing(true);
    const toastId = toast.loading(`Flashing ${partition} partition...`);

    try {
      await FlashPartition(partition, filePath);
      toast.success("Flash Complete", { description: `${partition} flashed successfully.`, id: toastId });
    } catch (error) {
      console.error("Flash error:", error);
      toast.error("Flash Failed", { description: String(error), id: toastId });
    } finally {
      setIsFlashing(false);
    }
  };

  const handleSideload = async () => {
    if (!sideloadFilePath) {
      toast.error("No update package selected.");
      return;
    }

    const fileName = sideloadFilePath.split(/[/\\]/).pop() ?? "update.zip";
    setIsSideloading(true);
    const toastId = toast.loading(`Sideloading ${fileName}...`);

    try {
      const output = await SideloadPackage(sideloadFilePath);
      const description = output ? output : `${fileName} sideloaded successfully.`;
      toast.success("Sideload Complete", { description, id: toastId });
    } catch (error) {
      console.error("Sideload error:", error);
      toast.error("Sideload Failed", { description: String(error), id: toastId });
    } finally {
      setIsSideloading(false);
    }
  };

  const handleWipe = async () => {
    setIsWiping(true);
    const toastId = toast.loading("Wiping data... Device will factory reset.");

    try {
      await WipeData();
      toast.success("Wipe Complete", { description: "Device data has been erased.", id: toastId });
    } catch (error) {
      console.error("Wipe error:", error);
      toast.error("Wipe Failed", { description: String(error), id: toastId });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <FastbootDevicesCard
        devices={fastbootDevices}
        isRefreshing={isRefreshingFastboot}
        error={fastbootError}
        onRefresh={() => refreshFastbootDevices()}
      />

      <FlashPartitionCard
        partition={partition}
        onPartitionChange={setPartition}
        filePath={filePath}
        onSelectFile={handleSelectFile}
        onFlash={handleFlash}
        isFlashing={isFlashing}
        canFlash={fastbootDevices.length > 0}
      />

      <RecoveryActionsCard
        sideloadFilePath={sideloadFilePath}
        onSelectSideloadFile={handleSelectSideloadFile}
        isSideloading={isSideloading}
        onSideload={handleSideload}
        isWiping={isWiping}
        onWipe={handleWipe}
        canWipe={fastbootDevices.length > 0}
      />
    </div>
  );
}
