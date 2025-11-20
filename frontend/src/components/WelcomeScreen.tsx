import React from "react";
import { Loader2 } from "lucide-react";

type WelcomeScreenProps = {
  progress: number;
};

export function WelcomeScreen({ progress }: WelcomeScreenProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <img src="/logo.png" alt="ADB Kit logo" className="h-20 w-20 object-contain" />

        <div className="w-56 space-y-2">
          <h1 className="text-xl font-bold text-foreground text-center">ADBKit</h1>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${clampedProgress}%` }} />
          </div>
          {/* <p className="text-center text-xs text-muted-foreground">
            Loading app... {Math.round(clampedProgress)}%
          </p> */}
        </div>

        {/* <Loader2 className="h-6 w-6 animate-spin text-primary" /> */}
      </div>
    </div>
  );
}
