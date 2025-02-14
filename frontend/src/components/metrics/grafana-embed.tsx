"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GrafanaEmbedProps {
  title: string;
  description?: string;
  src: string;
  height?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function GrafanaEmbed({
  title,
  description,
  src,
  height = "600px",
  className,
  onLoad,
  onError,
}: GrafanaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      onLoad?.();
    };

    const handleError = () => {
      const error = new Error("Failed to load Grafana dashboard");
      setError(error);
      onError?.(error);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
    };
  }, [onLoad, onError]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className={`w-full ${height}`} />}
        {error && (
          <div className="flex items-center justify-center w-full p-4 text-sm text-red-500 bg-red-50 rounded-lg">
            Failed to load Grafana dashboard. Please check your connection and try again.
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          width="100%"
          height={height}
          frameBorder="0"
          style={{
            display: isLoading ? "none" : "block",
          }}
        />
      </CardContent>
    </Card>
  );
}

interface GrafanaPanelProps extends Omit<GrafanaEmbedProps, "src"> {
  dashboardUid: string;
  panelId: number;
  timeRange?: {
    from: string;
    to: string;
  };
  variables?: Record<string, string>;
}

export function GrafanaPanel({
  dashboardUid,
  panelId,
  timeRange,
  variables,
  ...props
}: GrafanaPanelProps) {
  // Get Grafana config from environment
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL;
  
  if (!grafanaUrl) {
    throw new Error("NEXT_PUBLIC_GRAFANA_URL is not defined");
  }

  const params: Record<string, string> = {
    ...variables,
    ...(timeRange && {
      from: timeRange.from,
      to: timeRange.to,
    }),
    viewPanel: panelId.toString(),
    kiosk: "", // Enable kiosk mode
  };

  const searchParams = new URLSearchParams(params);
  const src = `${grafanaUrl}/d/${dashboardUid}?${searchParams.toString()}`;

  return <GrafanaEmbed {...props} src={src} />;
}

interface GrafanaDashboardProps extends Omit<GrafanaEmbedProps, "src"> {
  dashboardUid: string;
  timeRange?: {
    from: string;
    to: string;
  };
  variables?: Record<string, string>;
}

export function GrafanaDashboard({
  dashboardUid,
  timeRange,
  variables,
  ...props
}: GrafanaDashboardProps) {
  // Get Grafana config from environment
  const grafanaUrl = process.env.NEXT_PUBLIC_GRAFANA_URL;
  
  if (!grafanaUrl) {
    throw new Error("NEXT_PUBLIC_GRAFANA_URL is not defined");
  }

  const params: Record<string, string> = {
    ...variables,
    ...(timeRange && {
      from: timeRange.from,
      to: timeRange.to,
    }),
    kiosk: "", // Enable kiosk mode
  };

  const searchParams = new URLSearchParams(params);
  const src = `${grafanaUrl}/d/${dashboardUid}?${searchParams.toString()}`;

  return <GrafanaEmbed {...props} src={src} />;
}