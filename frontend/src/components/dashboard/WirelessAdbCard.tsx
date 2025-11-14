import React, { useEffect, useState } from "react";
import {
  ConnectWirelessAdb,
  DisconnectWirelessAdb,
  EnableWirelessAdb,
} from "../../../wailsjs/go/backend/App";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PlugZap, Usb, Wifi } from "lucide-react";

interface WirelessAdbCardProps {
  hasUsbDevice: boolean;
  defaultIp?: string | null;
  onDevicesUpdated: () => void;
}

export function WirelessAdbCard({
  hasUsbDevice,
  defaultIp,
  onDevicesUpdated,
}: WirelessAdbCardProps) {
  const [wirelessIp, setWirelessIp] = useState("");
  const [wirelessPort, setWirelessPort] = useState("5555");
  const [isEnablingTcpip, setIsEnablingTcpip] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (defaultIp && !defaultIp.startsWith("N/A")) {
      setWirelessIp(defaultIp);
    }
  }, [defaultIp]);

  const handleEnableTcpip = async () => {
    setIsEnablingTcpip(true);
    const toastId = toast.loading("Enabling wireless mode (port 5555)...", {
      description: "Please wait... Device must be connected via USB.",
    });
    try {
      const output = await EnableWirelessAdb("5555");
      toast.success("Wireless mode enabled!", {
        id: toastId,
        description: output,
      });
    } catch (error) {
      toast.error("Failed to enable wireless mode", {
        id: toastId,
        description: String(error),
      });
    }
    setIsEnablingTcpip(false);
  };

  const handleConnect = async () => {
    if (!wirelessIp) {
      toast.error("IP Address cannot be empty");
      return;
    }
    setIsConnecting(true);
    const toastId = toast.loading(`Connecting to ${wirelessIp}:${wirelessPort}...`);
    try {
      const output = await ConnectWirelessAdb(wirelessIp, wirelessPort);
      toast.success("Connection successful!", {
        id: toastId,
        description: output,
      });
      onDevicesUpdated();
    } catch (error) {
      toast.error("Connection failed", {
        id: toastId,
        description: String(error),
      });
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!wirelessIp) {
      toast.error("IP Address cannot be empty");
      return;
    }
    setIsDisconnecting(true);
    const toastId = toast.loading(
      `Disconnecting from ${wirelessIp}:${wirelessPort}...`
    );
    try {
      const output = await DisconnectWirelessAdb(wirelessIp, wirelessPort);
      toast.success("Disconnected", {
        id: toastId,
        description: output,
      });
      onDevicesUpdated();
    } catch (error) {
      toast.error("Disconnect failed", {
        id: toastId,
        description: String(error),
      });
    }
    setIsDisconnecting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi />
          Wireless ADB Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="font-medium">Step 1: Enable (via USB)</p>
          <p className="text-sm text-muted-foreground">
            Make sure the device is connected with a USB cable, then click this
            button.
          </p>
          <Button
            className="w-full"
            onClick={handleEnableTcpip}
            disabled={isEnablingTcpip || !hasUsbDevice || isConnecting}
          >
            {isEnablingTcpip ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Usb className="mr-2 h-4 w-4" />
            )}
            Enable Wireless Mode (tcpip)
          </Button>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Step 2: Connect (via WiFi)</p>
          <p className="text-sm text-muted-foreground">
            Enter the Device IP (usually automatically filled in) and Port.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Device IP Address"
              value={wirelessIp}
              onChange={(e) => setWirelessIp(e.target.value)}
              disabled={isConnecting || isDisconnecting}
              className="flex-1"
            />
            <Input
              placeholder="Port"
              value={wirelessPort}
              onChange={(e) => setWirelessPort(e.target.value)}
              disabled={isConnecting || isDisconnecting}
              className="w-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !wirelessIp || isDisconnecting}
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="mr-2 h-4 w-4" />
              )}
              Connect
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting || !wirelessIp || isConnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
