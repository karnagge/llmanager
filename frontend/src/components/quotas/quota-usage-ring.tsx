"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";

interface QuotaUsageRingProps {
  title: string;
  used: number;
  total: number;
  unit?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function QuotaUsageRing({
  title,
  used,
  total,
  unit = "",
  className,
  size = "md",
}: QuotaUsageRingProps) {
  const percentage = Math.min((used / total) * 100, 100);
  const radius = size === "sm" ? 35 : size === "md" ? 50 : 65;
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: "h-24 w-24",
    md: "h-32 w-32",
    lg: "h-40 w-40",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className={cn("relative", sizeClasses[size])}>
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="fill-none stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth={strokeWidth}
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                className={cn(
                  "fill-none transition-all duration-300 ease-in-out",
                  percentage >= 90
                    ? "stroke-red-500"
                    : percentage >= 75
                    ? "stroke-yellow-500"
                    : "stroke-green-500"
                )}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("font-bold", textSizeClasses[size])}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Usado</p>
              <p className="text-lg font-semibold">
                {formatNumber(used)}
                {unit && <span className="ml-1 text-sm">{unit}</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Total</p>
              <p className="text-lg font-semibold">
                {formatNumber(total)}
                {unit && <span className="ml-1 text-sm">{unit}</span>}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}