import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface Metric {
  label: string;
  value: number;
}

interface AppManagerOverviewCardProps {
  isBusy: boolean;
  onSync: () => void;
  metrics: Metric[];
}

export function AppManagerOverviewCard({
  isBusy,
  onSync,
  metrics,
}: AppManagerOverviewCardProps) {
  return (
    <Card className="border border-border/60 bg-card/90 backdrop-blur shadow-xl">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Application Manager</CardTitle>
            <p className="text-sm text-muted-foreground">
              Install, toggle, and maintain packages with a streamlined workflow.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={onSync}
            disabled={isBusy}
            className="w-full md:w-auto"
          >
            {isBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            Sync Packages
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-foreground"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
