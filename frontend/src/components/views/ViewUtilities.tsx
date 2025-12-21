import React, { useState, useCallback, useEffect, useRef } from "react";

import { GetDeviceMode, Reboot } from "../../../wailsjs/go/backend/App";

import { toast } from "sonner";
import { RebootOptionsCard } from "@/components/utilities/RebootOptionsCard";
import type { RebootMode } from "@/components/utilities/RebootOptionsCard";

type DeviceConnectionMode = "adb" | "fastboot" | "unknown";

export function ViewUtilities({ activeView }: { activeView: string }) {
  const [loadingMode, setLoadingMode] = useState<RebootMode | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceConnectionMode>("unknown");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const refreshTimeout = useRef<number | null>(null);

  const fetchDeviceMode = useCallback(async () => {
    setIsCheckingStatus(true);
    setStatusError(null);
    try {
      const mode = await GetDeviceMode();
      const normalized = typeof mode === "string" ? mode.trim().toLowerCase() : "";
      if (normalized === "adb" || normalized === "fastboot") {
        setDeviceMode(normalized as DeviceConnectionMode);
      } else {
        setDeviceMode("unknown");
      }
    } catch (error) {
      console.error("Failed to determine device mode:", error);
      setDeviceMode("unknown");
      setStatusError("Unable to determine device mode.");
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === "utils") {
      fetchDeviceMode();
    }
  }, [activeView, fetchDeviceMode]);

  useEffect(() => {
    return () => {
      if (refreshTimeout.current) {
        window.clearTimeout(refreshTimeout.current);
      }
    };
  }, []);

  const handleReboot = async (mode: string, modeId: RebootMode) => {
    if (loadingMode) return;

    setLoadingMode(modeId);
    try {
      await Reboot(mode);
    } catch (error) {
      console.error(`Error rebooting to ${modeId}:`, error);
      toast.error("Failed to send reboot command", {
        description: String(error),
      });
    }

    setLoadingMode(null);
    if (refreshTimeout.current) {
      window.clearTimeout(refreshTimeout.current);
    }
    refreshTimeout.current = window.setTimeout(() => {
      fetchDeviceMode();
    }, 1500);
  };

  const isLoading = (modeId: RebootMode) => loadingMode === modeId;
  const canSendCommand = deviceMode !== "unknown";

  const deviceModeLabel = (() => {
    switch (deviceMode) {
      case "adb":
        return "ADB Mode";
      case "fastboot":
        return "Fastboot Mode";
      default:
        return "No Device Detected";
    }
  })();

  const deviceModeClass = (() => {
    switch (deviceMode) {
      case "adb":
        return "border-emerald-500/30 bg-emerald-500/15 text-emerald-600";
      case "fastboot":
        return "border-blue-500/30 bg-blue-500/15 text-blue-600";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      <RebootOptionsCard
        deviceModeLabel={deviceModeLabel}
        deviceModeClass={deviceModeClass}
        statusError={statusError}
        isCheckingStatus={isCheckingStatus}
        hasPendingAction={!!loadingMode}
        canSendCommand={canSendCommand}
        onRefreshStatus={fetchDeviceMode}
        onReboot={handleReboot}
        isLoading={isLoading}
        rebootActions={[
          { label: "Reboot System", mode: "", modeId: "normal" },
          { label: "Reboot to Recovery", mode: "recovery", modeId: "recovery" },
          { label: "Reboot to Bootloader", mode: "bootloader", modeId: "bootloader" },
          { label: "Reboot to Fastbootd", mode: "fastboot", modeId: "fastboot" },
        ]}
      />
    </div>
  );
}
