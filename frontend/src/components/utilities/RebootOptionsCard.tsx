import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Power, RotateCw, Terminal, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type RebootMode =
  | "normal"
  | "recovery"
  | "bootloader"
  | "fastboot";

export interface RebootAction {
  label: string;
  mode: string;
  modeId: RebootMode;
}

interface RebootOptionsCardProps {
  deviceModeLabel: string;
  deviceModeClass: string;
  statusError: string | null;
  isCheckingStatus: boolean;
  hasPendingAction: boolean;
  canSendCommand: boolean;
  onRefreshStatus: () => void;
  onReboot: (mode: string, modeId: RebootMode) => void;
  isLoading: (modeId: RebootMode) => boolean;
  rebootActions: RebootAction[];
}

const ICON_MAP: Record<RebootMode, React.ReactNode> = {
  normal: <Power className="h-6 w-6" />,
  recovery: <RotateCw className="h-6 w-6" />,
  bootloader: <Terminal className="h-6 w-6" />,
  fastboot: <Zap className="h-6 w-6" />,
};

export function RebootOptionsCard({
  deviceModeLabel,
  deviceModeClass,
  statusError,
  isCheckingStatus,
  hasPendingAction,
  canSendCommand,
  onRefreshStatus,
  onReboot,
  isLoading,
  rebootActions,
}: RebootOptionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <RotateCw />
            Reboot Options
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Connection</span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                deviceModeClass
              )}
            >
              {deviceModeLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefreshStatus}
              disabled={isCheckingStatus || hasPendingAction}
            >
              {isCheckingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {statusError && <p className="text-xs text-destructive">{statusError}</p>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {rebootActions.map((action) => (
          <Button
            key={action.modeId}
            variant="outline"
            size="lg"
            className="flex h-24 flex-col"
            disabled={isLoading(action.modeId) || !canSendCommand}
            onClick={() => onReboot(action.mode, action.modeId)}
          >
            {isLoading(action.modeId) ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              ICON_MAP[action.modeId]
            )}
            <span className="mt-2">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
